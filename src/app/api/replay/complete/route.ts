import { callDriveWebhook } from '@/lib/drive-webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_ID = /^S-[a-zA-Z0-9-]{8,80}$/;

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (
    typeof payload.sessionId !== 'string' || !SESSION_ID.test(payload.sessionId) ||
    payload.captureMode !== 'event-replay' ||
    !Number.isInteger(payload.eventCount) || Number(payload.eventCount) < 0 ||
    !Number.isInteger(payload.chunkCount) || Number(payload.chunkCount) < 0
  ) {
    return Response.json({ ok: false, error: 'Malformed replay manifest' }, { status: 400 });
  }

  const result = await callDriveWebhook('replay_complete', payload);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error ?? 'Drive upload failed' }, { status: 502 });
  }
  return Response.json({ ok: true, sessionId: payload.sessionId });
}
