import type { CompleteSurveySession } from '@/types/survey';
import { listDriveSessions } from '@/lib/drive-data';
import { callDriveWebhook } from '@/lib/drive-webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Forwards the session to the Google Apps Script web app that writes into the
 * study's Drive folder. Configure SURVEY_WEBHOOK_URL — see scripts/drive-receiver.gs.
 */
async function forwardToDrive(session: CompleteSurveySession) {
  // Fail fast into the browser's durable retry queue instead of holding every
  // participant request open while Apps Script is saturated.
  const result = await callDriveWebhook('survey', { session }, 15_000);
  return result.ok
    ? { forwarded: true }
    : { forwarded: false, reason: result.error ?? 'Drive write failed' };
}

export async function POST(request: Request) {
  let session: CompleteSurveySession;
  try {
    session = (await request.json()) as CompleteSurveySession;
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (
    !session?.sessionId ||
    !/^[a-zA-Z0-9][a-zA-Z0-9-]{7,119}$/.test(session.sessionId) ||
    !session?.situation ||
    !session?.telemetry
  ) {
    return Response.json({ ok: false, error: 'Malformed session payload' }, { status: 400 });
  }

  const drive = await forwardToDrive(session);

  return Response.json(
    { ok: drive.forwarded, sessionId: session.sessionId, drive },
    { status: drive.forwarded ? 200 : 503 },
  );
}

function authorised(request: Request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return process.env.NODE_ENV !== 'production';
  const url = new URL(request.url);
  const supplied = request.headers.get('x-admin-token') ?? url.searchParams.get('token') ?? '';
  return supplied === expected;
}

export async function GET(request: Request) {
  if (!authorised(request)) {
    return Response.json({ ok: false, error: 'Unauthorised' }, { status: 401 });
  }
  try {
    const sessions = await listDriveSessions();
    return Response.json({ ok: true, count: sessions.length, sessions });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'read failed' },
      { status: 500 },
    );
  }
}
