import type { CompleteSurveySession } from '@/types/survey';
import { listSessions, saveSession } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Forwards the session to the Google Apps Script web app that writes into the
 * study's Drive folder. Configure SURVEY_WEBHOOK_URL — see scripts/drive-receiver.gs.
 */
async function forwardToDrive(session: CompleteSurveySession) {
  const url = process.env.SURVEY_WEBHOOK_URL;
  if (!url) return { forwarded: false, reason: 'SURVEY_WEBHOOK_URL not configured' };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: process.env.SURVEY_WEBHOOK_TOKEN ?? '', session }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { forwarded: false, reason: `webhook returned ${res.status}` };
    return { forwarded: true };
  } catch (err) {
    return { forwarded: false, reason: err instanceof Error ? err.message : 'unknown error' };
  }
}

export async function POST(request: Request) {
  let session: CompleteSurveySession;
  try {
    session = (await request.json()) as CompleteSurveySession;
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!session?.sessionId || !session?.situation || !session?.telemetry) {
    return Response.json({ ok: false, error: 'Malformed session payload' }, { status: 400 });
  }

  let stored: { ok: boolean; reason?: string };
  try {
    saveSession(session);
    stored = { ok: true };
  } catch (err) {
    stored = { ok: false, reason: err instanceof Error ? err.message : 'db write failed' };
  }

  const drive = await forwardToDrive(session);

  return Response.json({ ok: true, sessionId: session.sessionId, stored, drive });
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
    const sessions = listSessions();
    return Response.json({ ok: true, count: sessions.length, sessions });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'read failed' },
      { status: 500 },
    );
  }
}
