import 'server-only';

import { callDriveWebhook } from '@/lib/drive-webhook';

export interface ReplayManifest {
  version: number;
  sessionId: string;
  captureMode: 'event-replay';
  status: 'complete';
  tabId?: string;
  startedAt?: string;
  completedAt?: string;
  eventCount: number;
  chunkCount: number;
}

export interface ReplayChunkDescriptor {
  fileName: string;
  sequence: number;
}

export async function listDriveReplays(): Promise<ReplayManifest[]> {
  const result = await callDriveWebhook('replay_list', {});
  if (!result.ok) throw new Error(result.error ?? 'Could not list Drive replays');
  return Array.isArray(result.sessions) ? result.sessions as ReplayManifest[] : [];
}

export async function getDriveReplaySession(sessionId: string): Promise<{
  manifest: ReplayManifest;
  chunks: ReplayChunkDescriptor[];
}> {
  const result = await callDriveWebhook('replay_session', { sessionId });
  if (!result.ok || !result.manifest || !Array.isArray(result.chunks)) {
    throw new Error(result.error ?? 'Replay not found');
  }
  return {
    manifest: result.manifest as ReplayManifest,
    chunks: result.chunks as ReplayChunkDescriptor[],
  };
}

export async function getDriveReplayChunk(sessionId: string, fileName: string): Promise<string[]> {
  const result = await callDriveWebhook('replay_chunk_get', { sessionId, fileName });
  const chunk = result.chunk as { events?: unknown } | undefined;
  if (!result.ok || !chunk || !Array.isArray(chunk.events)) {
    throw new Error(result.error ?? 'Replay chunk not found');
  }
  return chunk.events.filter((event): event is string => typeof event === 'string');
}

export async function getDriveReplayChunks(
  sessionId: string,
  fileNames: string[],
): Promise<{ sequence: number; events: string[] }[]> {
  const result = await callDriveWebhook('replay_chunks_get', { sessionId, fileNames }, 60_000);
  if (!result.ok || !Array.isArray(result.chunks)) {
    throw new Error(result.error ?? 'Replay chunks not found');
  }
  return result.chunks.map((chunk) => {
    const item = chunk as { sequence?: unknown; events?: unknown };
    if (!Number.isInteger(item.sequence) || !Array.isArray(item.events)) {
      throw new Error('Drive returned a malformed replay chunk');
    }
    return {
      sequence: Number(item.sequence),
      events: item.events.filter((event): event is string => typeof event === 'string'),
    };
  });
}
