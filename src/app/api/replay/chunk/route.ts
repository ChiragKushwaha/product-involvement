import { callDriveWebhook } from '@/lib/drive-webhook';
import { gunzipSync } from 'node:zlib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_ID = /^[a-zA-Z0-9][a-zA-Z0-9-]{7,119}$/;
const TAB_ID = /^[a-zA-Z0-9-]{6,40}$/;
const MAX_BODY_CHARS = 800_000;

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > MAX_BODY_CHARS) {
    return Response.json({ ok: false, error: 'Replay chunk is too large' }, { status: 413 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { sessionId, tabId, sequence, events, compressedData, eventCount } = payload;
  const encoded = typeof compressedData === 'string' ? compressedData : null;
  const compressed = encoded !== null;
  if (
    typeof sessionId !== 'string' || !SESSION_ID.test(sessionId) ||
    typeof tabId !== 'string' || !TAB_ID.test(tabId) ||
    !Number.isInteger(sequence) || Number(sequence) < 0 || Number(sequence) > 100_000 ||
    (compressed
      ? encoded.length < 20 || encoded.length > 750_000 ||
        !/^[a-zA-Z0-9+/=]+$/.test(encoded) ||
        !Number.isInteger(eventCount) || Number(eventCount) < 1 || Number(eventCount) > 10_000
      : !Array.isArray(events) || events.length === 0 || events.length > 10_000 ||
        events.some((event) => typeof event !== 'string'))
  ) {
    return Response.json({ ok: false, error: 'Malformed replay chunk' }, { status: 400 });
  }

  let result = await callDriveWebhook(compressed ? 'replay_chunk_compressed' : 'replay_chunk', payload);
  if (compressed && !result.ok && /unknown action/i.test(result.error ?? '')) {
    try {
      const fallback = JSON.parse(gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8')) as Record<string, unknown>;
      if (
        fallback.sessionId !== sessionId || fallback.tabId !== tabId || fallback.sequence !== sequence ||
        !Array.isArray(fallback.events) || fallback.events.length !== eventCount ||
        fallback.events.some((event) => typeof event !== 'string')
      ) {
        throw new Error('Compressed metadata mismatch');
      }
      result = await callDriveWebhook('replay_chunk', fallback);
    } catch {
      return Response.json({ ok: false, error: 'Could not decompress replay chunk' }, { status: 400 });
    }
  }
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error ?? 'Drive upload failed' }, { status: 502 });
  }
  return Response.json({ ok: true, sequence });
}
