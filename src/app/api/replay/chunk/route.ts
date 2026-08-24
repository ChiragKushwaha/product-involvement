import { callDriveWebhook } from '@/lib/drive-webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_ID = /^S-[a-zA-Z0-9-]{8,80}$/;
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

  const { sessionId, tabId, sequence, events } = payload;
  if (
    typeof sessionId !== 'string' || !SESSION_ID.test(sessionId) ||
    typeof tabId !== 'string' || !TAB_ID.test(tabId) ||
    !Number.isInteger(sequence) || Number(sequence) < 0 || Number(sequence) > 100_000 ||
    !Array.isArray(events) || events.length === 0 || events.length > 10_000 ||
    events.some((event) => typeof event !== 'string')
  ) {
    return Response.json({ ok: false, error: 'Malformed replay chunk' }, { status: 400 });
  }

  const result = await callDriveWebhook('replay_chunk', payload);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error ?? 'Drive upload failed' }, { status: 502 });
  }
  return Response.json({ ok: true, sequence });
}
