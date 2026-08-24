import { listDriveSessions } from '@/lib/drive-data';
import { eventLogCsv, toCsv } from '@/lib/export';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorised(request: Request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return process.env.NODE_ENV !== 'production';
  const url = new URL(request.url);
  const supplied = request.headers.get('x-admin-token') ?? url.searchParams.get('token') ?? '';
  return supplied === expected;
}

/** Direct CSV/JSON download generated from Drive's master-data.json. */
export async function GET(request: Request) {
  if (!authorised(request)) {
    return Response.json({ ok: false, error: 'Unauthorised' }, { status: 401 });
  }

  const format = new URL(request.url).searchParams.get('format') ?? 'responses';
  const requestedSessionId = new URL(request.url).searchParams.get('sessionId');
  const stamp = new Date().toISOString().slice(0, 10);
  let sessions;
  try {
    sessions = await listDriveSessions();
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not load Drive data' },
      { status: 502 },
    );
  }
  if (requestedSessionId) {
    sessions = sessions.filter((session) => session.sessionId === requestedSessionId);
    if (sessions.length === 0) {
      return Response.json({ ok: false, error: 'Participant response not found' }, { status: 404 });
    }
  }
  const fileKey = requestedSessionId
    ? requestedSessionId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 100)
    : stamp;

  if (format === 'json') {
    return new Response(JSON.stringify(sessions, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="survey-responses-${fileKey}.json"`,
      },
    });
  }

  const body = format === 'events' ? eventLogCsv(sessions) : toCsv(sessions);
  const name = format === 'events' ? 'survey-event-log' : 'survey-responses';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}-${fileKey}.csv"`,
    },
  });
}
