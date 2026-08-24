import { getDriveReplayChunk, getDriveReplayChunks, getDriveReplaySession } from '@/lib/drive-replays';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorised(request: Request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return process.env.NODE_ENV !== 'production';
  const url = new URL(request.url);
  const supplied = request.headers.get('x-admin-token') ?? url.searchParams.get('token') ?? '';
  return supplied === expected;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  if (!authorised(request)) {
    return Response.json({ ok: false, error: 'Unauthorised' }, { status: 401 });
  }

  const { sessionId } = await context.params;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{7,119}$/.test(sessionId)) {
    return Response.json({ ok: false, error: 'Invalid session id' }, { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const fileNames = url.searchParams.getAll('chunk');
    if (fileNames.length > 1) {
      if (fileNames.length > 10) {
        return Response.json({ ok: false, error: 'Too many chunks requested' }, { status: 400 });
      }
      const chunks = await getDriveReplayChunks(sessionId, fileNames);
      return Response.json({ ok: true, chunks });
    }
    const fileName = fileNames[0];
    if (fileName) {
      const events = await getDriveReplayChunk(sessionId, fileName);
      return Response.json({ ok: true, events });
    }
    const replay = await getDriveReplaySession(sessionId);
    return Response.json({ ok: true, ...replay });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Replay read failed' },
      { status: 502 },
    );
  }
}
