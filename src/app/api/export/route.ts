import { listDriveSessions } from '@/lib/drive-data';
import { getDriveFullReplay, getDriveReplayChunks, getDriveReplaySession } from '@/lib/drive-replays';
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

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function rawReplay(sessionId: string) {
  try {
    return await getDriveFullReplay(sessionId);
  } catch {
    // Receiver v2 fallback: read the descriptors and chunks separately.
  }
  const replay = await getDriveReplaySession(sessionId);
  const groups = Array.from(
    { length: Math.ceil(replay.chunks.length / 2) },
    (_, index) => replay.chunks.slice(index * 2, index * 2 + 2),
  );
  const chunks = (
    await Promise.all(
      groups.map((group) => getDriveReplayChunks(sessionId, group.map((chunk) => chunk.fileName))),
    )
  ).flat().sort((a, b) => a.sequence - b.sequence);
  return { manifest: replay.manifest, chunks };
}

function replayManifestCsv(replay: Awaited<ReturnType<typeof rawReplay>>) {
  const header = ['session_id', 'replay_status', 'started_at', 'completed_at', 'event_count', 'chunk_count'];
  const manifest = replay.manifest;
  const row = [
    manifest.sessionId,
    manifest.status,
    manifest.startedAt ?? '',
    manifest.completedAt ?? '',
    manifest.eventCount,
    manifest.chunkCount,
  ];
  return '\ufeff' + [header, row].map((values) => values.map(csvCell).join(',')).join('\r\n');
}

function replayEventsCsv(replay: Awaited<ReturnType<typeof rawReplay>>) {
  const lines = [['session_id', 'chunk_sequence', 'event_index', 'packed_event'].join(',')];
  for (const chunk of replay.chunks) {
    chunk.events.forEach((event, index) => {
      lines.push([replay.manifest.sessionId, chunk.sequence, index, event].map(csvCell).join(','));
    });
  }
  return '\ufeff' + lines.join('\r\n');
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
  if (requestedSessionId) sessions = sessions.filter((session) => session.sessionId === requestedSessionId);
  const fileKey = requestedSessionId
    ? requestedSessionId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 100)
    : stamp;

  let replay: Awaited<ReturnType<typeof rawReplay>> | undefined;
  if (requestedSessionId && (format === 'json' || sessions.length === 0)) {
    try {
      if (format === 'responses' && sessions.length === 0) {
        const metadata = await getDriveReplaySession(requestedSessionId);
        replay = { manifest: metadata.manifest, chunks: [] };
      } else {
        replay = await rawReplay(requestedSessionId);
      }
    } catch (error) {
      if (sessions.length === 0) {
        return Response.json(
          { ok: false, error: error instanceof Error ? error.message : 'Participant data not found' },
          { status: 404 },
        );
      }
    }
  }

  if (format === 'json') {
    const value = requestedSessionId
      ? { response: sessions[0] ?? null, replay: replay ?? null }
      : sessions;
    return new Response(JSON.stringify(value, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="survey-responses-${fileKey}.json"`,
      },
    });
  }

  const body = sessions.length > 0
    ? format === 'events' ? eventLogCsv(sessions) : toCsv(sessions)
    : replay
      ? format === 'events' ? replayEventsCsv(replay) : replayManifestCsv(replay)
      : format === 'events' ? eventLogCsv([]) : toCsv([]);
  const name = format === 'events' ? 'survey-event-log' : 'survey-responses';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}-${fileKey}.csv"`,
    },
  });
}
