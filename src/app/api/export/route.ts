import { listSessions } from '@/lib/db';
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

/** Direct CSV/JSON download straight from the database. */
export async function GET(request: Request) {
  if (!authorised(request)) {
    return Response.json({ ok: false, error: 'Unauthorised' }, { status: 401 });
  }

  const format = new URL(request.url).searchParams.get('format') ?? 'responses';
  const stamp = new Date().toISOString().slice(0, 10);
  const sessions = await listSessions();

  if (format === 'json') {
    return new Response(JSON.stringify(sessions, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="survey-responses-${stamp}.json"`,
      },
    });
  }

  const body = format === 'events' ? eventLogCsv(sessions) : toCsv(sessions);
  const name = format === 'events' ? 'survey-event-log' : 'survey-responses';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}-${stamp}.csv"`,
    },
  });
}
