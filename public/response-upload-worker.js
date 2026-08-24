/* Persistent response and replay uploader. Keep DB/store names in sync with
 * response-upload-queue.ts and session-replay.ts. */
const DB_NAME = 'product-involvement-responses';
const DB_VERSION = 1;
const STORE = 'pending_responses';
const REPLAY_DB_NAME = 'product-involvement-replay';
const REPLAY_STORE = 'upload_queue';
const SYNC_TAG = 'product-involvement-response-upload';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

async function notifyResponseUploaded(sessionId) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  windows.forEach((client) => client.postMessage({
    type: 'product-involvement-response-uploaded',
    sessionId,
  }));
}

function request(operation) {
  return new Promise((resolve, reject) => {
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error || new Error('IndexedDB request failed'));
  });
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const operation = indexedDB.open(DB_NAME, DB_VERSION);
    operation.onupgradeneeded = () => {
      const database = operation.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: 'sessionId' });
      }
    };
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error || new Error('Could not open response queue'));
  });
}

async function pendingResponses() {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE, 'readonly');
    return await request(transaction.objectStore(STORE).getAll());
  } finally {
    database.close();
  }
}

async function removeResponse(sessionId) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(sessionId);
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Could not clear response'));
      transaction.onabort = () => reject(transaction.error || new Error('Response queue aborted'));
    });
  } finally {
    database.close();
  }
}

async function uploadPendingResponses() {
  const items = await pendingResponses();
  let failed = false;
  for (const item of items) {
    try {
      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Retry': item.attempts > 0 ? '1' : '0',
        },
        body: JSON.stringify(item.session),
      });
      const result = await response.json();
      if (!response.ok || !result?.ok || !result?.drive?.forwarded) throw new Error('Drive did not confirm');
      await removeResponse(item.sessionId);
      await notifyResponseUploaded(item.sessionId);
    } catch {
      failed = true;
    }
  }
  if (failed) throw new Error('One or more Drive uploads remain queued');
}

function openReplayDatabase() {
  return new Promise((resolve, reject) => {
    const operation = indexedDB.open(REPLAY_DB_NAME, DB_VERSION);
    operation.onupgradeneeded = () => {
      const database = operation.result;
      if (!database.objectStoreNames.contains(REPLAY_STORE)) {
        database.createObjectStore(REPLAY_STORE, { keyPath: 'id' });
      }
    };
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error || new Error('Could not open replay queue'));
  });
}

async function pendingReplayRequests() {
  const database = await openReplayDatabase();
  try {
    const transaction = database.transaction(REPLAY_STORE, 'readonly');
    const items = await request(transaction.objectStore(REPLAY_STORE).getAll());
    return items.sort((a, b) => a.createdAt - b.createdAt);
  } finally {
    database.close();
  }
}

async function removeReplayRequest(id) {
  const database = await openReplayDatabase();
  try {
    const transaction = database.transaction(REPLAY_STORE, 'readwrite');
    transaction.objectStore(REPLAY_STORE).delete(id);
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Could not clear replay'));
      transaction.onabort = () => reject(transaction.error || new Error('Replay queue aborted'));
    });
  } finally {
    database.close();
  }
}

async function uploadPendingReplays() {
  const items = await pendingReplayRequests();
  for (const item of items) {
    const response = await fetch(item.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.payload),
    });
    const result = await response.json();
    if (!response.ok || !result?.ok) throw new Error('Drive did not confirm replay upload');
    await removeReplayRequest(item.id);
  }
}

async function uploadEverything() {
  const results = await Promise.allSettled([
    uploadPendingResponses(),
    uploadPendingReplays(),
  ]);
  if (results.some((result) => result.status === 'rejected')) {
    throw new Error('One or more Drive files remain queued');
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) event.waitUntil(uploadEverything());
});
