'use client';

import type { ReplayCaptureSummary } from '@/types/survey';

const DB_NAME = 'product-involvement-replay';
const DB_VERSION = 1;
const QUEUE_STORE = 'upload_queue';
const FLUSH_INTERVAL_MS = 10_000;
const MAX_BUFFER_CHARS = 220_000;

type ReplayRequestKind = 'chunk' | 'complete';

interface QueuedReplayRequest {
  id: string;
  sessionId: string;
  kind: ReplayRequestKind;
  createdAt: number;
  endpoint: '/api/replay/chunk' | '/api/replay/complete';
  payload: Record<string, unknown>;
}

function request<T>(operation: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error ?? new Error('IndexedDB request failed'));
  });
}

function openQueue(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const operation = indexedDB.open(DB_NAME, DB_VERSION);
    operation.onupgradeneeded = () => {
      const db = operation.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      }
    };
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error ?? new Error('Could not open replay queue'));
  });
}

async function queuePut(item: QueuedReplayRequest) {
  const db = await openQueue();
  try {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).put(item);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Could not save replay chunk'));
      tx.onabort = () => reject(tx.error ?? new Error('Replay queue transaction aborted'));
    });
  } finally {
    db.close();
  }
}

async function queueDelete(id: string) {
  const db = await openQueue();
  try {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Could not clear replay chunk'));
      tx.onabort = () => reject(tx.error ?? new Error('Replay queue transaction aborted'));
    });
  } finally {
    db.close();
  }
}

async function queueList(): Promise<QueuedReplayRequest[]> {
  const db = await openQueue();
  try {
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const items = await request(tx.objectStore(QUEUE_STORE).getAll()) as QueuedReplayRequest[];
    return items.sort((a, b) => a.createdAt - b.createdAt);
  } finally {
    db.close();
  }
}

function randomPart() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replaceAll('-', '').slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 14);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

async function compressedChunkPayload(payload: {
  sessionId: string;
  tabId: string;
  sequence: number;
  events: string[];
}): Promise<Record<string, unknown>> {
  if (typeof CompressionStream === 'undefined') return payload;
  try {
    const input = new Blob([JSON.stringify(payload)]).stream();
    const compressed = input.pipeThrough(new CompressionStream('gzip'));
    const bytes = new Uint8Array(await new Response(compressed).arrayBuffer());
    return {
      sessionId: payload.sessionId,
      tabId: payload.tabId,
      sequence: payload.sequence,
      eventCount: payload.events.length,
      compressedData: bytesToBase64(bytes),
    };
  } catch {
    return payload;
  }
}

/**
 * Records reconstructable DOM events rather than screen pixels. Uploads are
 * durably queued in IndexedDB before any network request, and Drive writes are
 * idempotent by session/tab/sequence so retries cannot duplicate a replay.
 */
export class SessionReplayRecorder {
  private sessionId = '';
  private readonly tabId = randomPart();
  private startedAt = '';
  private completedAt = '';
  private sequence = 0;
  private eventCount = 0;
  private chunkCount = 0;
  private bufferedChars = 0;
  private buffer: string[] = [];
  private stopFn: (() => void) | undefined;
  private addCustomEventFn: ((tag: string, payload: unknown) => void) | undefined;
  private flushTimer: ReturnType<typeof setInterval> | undefined;
  private startPromise: Promise<void> | undefined;
  private drainPromise: Promise<void> | undefined;
  private flushChain: Promise<void> = Promise.resolve();

  private readonly onOnline = () => void this.drainQueue();
  private readonly onVisibility = () => {
    this.addCustomEvent('page_visibility', { state: document.visibilityState });
    if (document.hidden) void this.flush();
  };

  start(sessionId = '') {
    if (this.startPromise || this.stopFn) return this.startPromise ?? Promise.resolve();
    this.sessionId = sessionId;
    this.startedAt = new Date().toISOString();

    this.startPromise = this.startRecording();
    return this.startPromise;
  }

  setSessionId(sessionId: string) {
    if (this.sessionId && this.sessionId !== sessionId) {
      throw new Error('This replay already belongs to another participant');
    }
    this.sessionId = sessionId;
    this.addCustomEvent('participant_identified', { sessionId });
    void this.flush();
  }

  private async startRecording() {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return;

    const [{ record }, { pack }] = await Promise.all([
      import('@rrweb/record'),
      import('@rrweb/packer'),
    ]);

    const stop = record<string>({
      emit: (event) => {
        this.buffer.push(event);
        this.bufferedChars += event.length;
        this.eventCount += 1;
        if (this.bufferedChars >= MAX_BUFFER_CHARS) void this.flush();
      },
      packFn: pack,
      checkoutEveryNms: 5 * 60 * 1000,
      blockSelector: '[data-replay-block]',
      ignoreSelector: '[data-replay-ignore]',
      maskTextSelector: '[data-replay-mask]',
      maskInputOptions: { password: true },
      recordCanvas: false,
      inlineImages: false,
      collectFonts: false,
      slimDOMOptions: 'all',
      sampling: {
        mousemove: 100,
        scroll: 150,
        media: 750,
      },
      errorHandler: (error) => {
        console.warn('Session replay recorder skipped an event', error);
      },
    });

    this.stopFn = stop;
    this.addCustomEventFn = record.addCustomEvent;
    this.flushTimer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
    window.addEventListener('online', this.onOnline);
    document.addEventListener('visibilitychange', this.onVisibility);

    this.addCustomEvent('recording_started', {
      captureMode: 'event-replay',
      viewport: { width: window.innerWidth, height: window.innerHeight },
    });

    // Also recovers uploads left by an interrupted older session.
    void this.drainQueue();
  }

  addCustomEvent(tag: string, payload: unknown) {
    try {
      this.addCustomEventFn?.(tag, payload);
    } catch {
      // A replay annotation must never interrupt the participant's survey.
    }
  }

  private async enqueue(item: QueuedReplayRequest) {
    try {
      await queuePut(item);
    } catch {
      // Very restrictive/private browsers may disable IndexedDB. The live
      // request is still attempted so the session can continue normally.
    }
  }

  flush() {
    const next = this.flushChain.then(() => this.flushNow());
    this.flushChain = next.catch(() => undefined);
    return next;
  }

  private async flushNow() {
    if (!this.sessionId || this.buffer.length === 0) return;

    const events = this.buffer;
    this.buffer = [];
    this.bufferedChars = 0;
    const sequence = this.sequence++;
    this.chunkCount += 1;

    const rawPayload = {
      sessionId: this.sessionId,
      tabId: this.tabId,
      sequence,
      events,
    };
    const payload = await compressedChunkPayload(rawPayload);
    await this.enqueue({
      id: `${this.sessionId}:chunk:${this.tabId}:${sequence}`,
      sessionId: this.sessionId,
      kind: 'chunk',
      createdAt: Date.now(),
      endpoint: '/api/replay/chunk',
      payload,
    });
    await this.drainQueue();
  }

  private drainQueue() {
    if (this.drainPromise) return this.drainPromise;

    this.drainPromise = (async () => {
      let items: QueuedReplayRequest[];
      try {
        items = await queueList();
      } catch {
        return;
      }

      for (const item of items) {
        try {
          const response = await fetch(item.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
          const result = await response.json().catch(() => null);
          if (!response.ok || !result?.ok) break;
          await queueDelete(item.id);
        } catch {
          break;
        }
      }
    })().finally(() => {
      this.drainPromise = undefined;
    });

    return this.drainPromise;
  }

  async finalize(): Promise<ReplayCaptureSummary> {
    await this.startPromise?.catch(() => undefined);

    if (!this.startedAt || !this.stopFn) {
      return {
        captureMode: 'event-replay',
        status: 'unavailable',
        eventCount: 0,
        chunkCount: 0,
      };
    }

    this.completedAt = new Date().toISOString();
    this.addCustomEvent('recording_completed', { completedAt: this.completedAt });
    this.stopFn();
    this.stopFn = undefined;
    if (this.flushTimer) clearInterval(this.flushTimer);
    window.removeEventListener('online', this.onOnline);
    document.removeEventListener('visibilitychange', this.onVisibility);

    await this.flush();

    const completion: QueuedReplayRequest = {
      id: `${this.sessionId}:complete`,
      sessionId: this.sessionId,
      kind: 'complete',
      createdAt: Date.now() + 1,
      endpoint: '/api/replay/complete',
      payload: {
        sessionId: this.sessionId,
        tabId: this.tabId,
        startedAt: this.startedAt,
        completedAt: this.completedAt,
        eventCount: this.eventCount,
        chunkCount: this.chunkCount,
        captureMode: 'event-replay',
      },
    };
    await this.enqueue(completion);
    await this.drainQueue();

    let pending = true;
    try {
      pending = (await queueList()).some((item) => item.sessionId === this.sessionId);
    } catch {
      // If durable storage is unavailable we cannot prove the upload completed.
    }

    // Keep retrying while the thank-you screen remains open. The durable queue
    // will also be recovered when a later participant begins a session.
    if (pending) {
      window.addEventListener('online', this.onOnline);
      this.flushTimer = setInterval(() => void this.drainQueue(), 30_000);
    }

    return {
      captureMode: 'event-replay',
      status: pending ? 'pending' : 'uploaded',
      eventCount: this.eventCount,
      chunkCount: this.chunkCount,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
    };
  }

  dispose() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    window.removeEventListener('online', this.onOnline);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.stopFn?.();
    this.stopFn = undefined;
  }
}
