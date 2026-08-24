'use client';

import type { CompleteSurveySession } from '@/types/survey';

const DB_NAME = 'product-involvement-responses';
const DB_VERSION = 1;
const STORE = 'pending_responses';
const FALLBACK_STORAGE_KEY = 'product-involvement-pending-responses';
const MAX_BACKOFF_MS = 5 * 60 * 1000;

interface PendingResponse {
  sessionId: string;
  session: CompleteSurveySession;
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
}

export interface ResponseUploadStatus {
  sessionId: string;
  state: 'queued' | 'uploading' | 'uploaded';
  attempts: number;
  nextAttemptAt?: number;
}

type Listener = (status: ResponseUploadStatus) => void;

const listeners = new Set<Listener>();
const beaconPayloads = new Map<string, CompleteSurveySession>();
const volatilePending = new Map<string, PendingResponse>();
let drainPromise: Promise<void> | undefined;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let lifecycleStarted = false;
let workerRegistration: Promise<ServiceWorkerRegistration | undefined> | undefined;

interface SyncCapableRegistration extends ServiceWorkerRegistration {
  sync?: { register(tag: string): Promise<void> };
}

function requestBackgroundSync() {
  if (!('serviceWorker' in navigator)) return Promise.resolve();
  workerRegistration ??= navigator.serviceWorker
    .register('/response-upload-worker.js')
    .catch(() => undefined);
  return workerRegistration.then(async (registration) => {
    const sync = (registration as SyncCapableRegistration | undefined)?.sync;
    if (sync) await sync.register('product-involvement-response-upload').catch(() => undefined);
  });
}

function request<T>(operation: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error ?? new Error('IndexedDB request failed'));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const operation = indexedDB.open(DB_NAME, DB_VERSION);
    operation.onupgradeneeded = () => {
      const database = operation.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: 'sessionId' });
      }
    };
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error ?? new Error('Could not open response queue'));
  });
}

async function put(item: PendingResponse) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(item);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not queue response'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Response queue aborted'));
    });
  } finally {
    database.close();
  }
}

async function remove(sessionId: string) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(sessionId);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not clear response'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Response queue aborted'));
    });
  } finally {
    database.close();
  }
}

async function list(): Promise<PendingResponse[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE, 'readonly');
    const items = await request(transaction.objectStore(STORE).getAll()) as PendingResponse[];
    return items.sort((a, b) => a.nextAttemptAt - b.nextAttemptAt || a.createdAt - b.createdAt);
  } finally {
    database.close();
  }
}

function listFallback(): PendingResponse[] {
  try {
    const value = JSON.parse(localStorage.getItem(FALLBACK_STORAGE_KEY) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeFallback(items: PendingResponse[]) {
  try {
    if (items.length === 0) localStorage.removeItem(FALLBACK_STORAGE_KEY);
    else localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

function putFallback(item: PendingResponse) {
  const items = listFallback().filter((pending) => pending.sessionId !== item.sessionId);
  return writeFallback([...items, item]);
}

function removeFallback(sessionId: string) {
  writeFallback(listFallback().filter((pending) => pending.sessionId !== sessionId));
}

async function persist(item: PendingResponse) {
  if ('indexedDB' in window) {
    try {
      await put(item);
      removeFallback(item.sessionId);
      volatilePending.delete(item.sessionId);
      return true;
    } catch {
      // Some privacy modes expose IndexedDB but reject writes. Fall through.
    }
  }
  if (putFallback(item)) {
    volatilePending.delete(item.sessionId);
    return true;
  }
  volatilePending.set(item.sessionId, item);
  return false;
}

async function removeEverywhere(sessionId: string) {
  if ('indexedDB' in window) await remove(sessionId).catch(() => undefined);
  removeFallback(sessionId);
  volatilePending.delete(sessionId);
}

async function listPending() {
  const databaseItems = 'indexedDB' in window ? await list().catch(() => []) : [];
  const merged = new Map<string, PendingResponse>();
  volatilePending.forEach((item) => merged.set(item.sessionId, item));
  listFallback().forEach((item) => merged.set(item.sessionId, item));
  databaseItems.forEach((item) => merged.set(item.sessionId, item));
  return [...merged.values()].sort(
    (a, b) => a.nextAttemptAt - b.nextAttemptAt || a.createdAt - b.createdAt,
  );
}

function notify(status: ResponseUploadStatus) {
  listeners.forEach((listener) => listener(status));
}

function nextBackoff(attempts: number) {
  const base = Math.min(MAX_BACKOFF_MS, 15_000 * (2 ** Math.min(attempts, 5)));
  return Math.round(base * (0.7 + Math.random() * 0.6));
}

function schedule(at: number) {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => void drainResponseQueue(), Math.max(500, at - Date.now()));
}

async function send(item: PendingResponse) {
  notify({ sessionId: item.sessionId, state: 'uploading', attempts: item.attempts + 1 });
  try {
    const response = await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.session),
      signal: AbortSignal.timeout(25_000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok || !result?.drive?.forwarded) throw new Error('Drive did not confirm');
    await removeEverywhere(item.sessionId);
    beaconPayloads.delete(item.sessionId);
    notify({ sessionId: item.sessionId, state: 'uploaded', attempts: item.attempts + 1 });
    return;
  } catch {
    const attempts = item.attempts + 1;
    const nextAttemptAt = Date.now() + nextBackoff(attempts);
    await persist({ ...item, attempts, nextAttemptAt });
    notify({ sessionId: item.sessionId, state: 'queued', attempts, nextAttemptAt });
    void requestBackgroundSync();
    schedule(nextAttemptAt);
  }
}

export function drainResponseQueue() {
  if (drainPromise) return drainPromise;
  drainPromise = (async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const items = await listPending();
    for (const item of items) {
      beaconPayloads.set(item.sessionId, item.session);
      if (item.nextAttemptAt > Date.now()) {
        schedule(item.nextAttemptAt);
        continue;
      }
      await send(item);
    }
    const remaining = await listPending();
    if (remaining.length > 0) schedule(remaining[0].nextAttemptAt);
  })().finally(() => {
    drainPromise = undefined;
  });
  return drainPromise;
}

export async function queueSurveyResponse(session: CompleteSurveySession) {
  const item: PendingResponse = {
    sessionId: session.sessionId,
    session,
    createdAt: Date.now(),
    attempts: 0,
    nextAttemptAt: Date.now(),
  };
  beaconPayloads.set(session.sessionId, session);
  const persisted = await persist(item);
  void requestBackgroundSync();
  notify({ sessionId: session.sessionId, state: 'queued', attempts: 0, nextAttemptAt: Date.now() });
  if (persisted) await drainResponseQueue();
  else await send(item);
  return !beaconPayloads.has(session.sessionId);
}

export function startResponseUploadRecovery(listener: Listener) {
  listeners.add(listener);
  if (!lifecycleStarted) {
    lifecycleStarted = true;
    void requestBackgroundSync();
    window.addEventListener('online', drainResponseQueue);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) void drainResponseQueue();
    });
    window.addEventListener('pagehide', () => {
      beaconPayloads.forEach((session) => {
        navigator.sendBeacon(
          '/api/responses',
          new Blob([JSON.stringify(session)], { type: 'application/json' }),
        );
      });
    });
  }
  void drainResponseQueue();
  return () => {
    listeners.delete(listener);
  };
}
