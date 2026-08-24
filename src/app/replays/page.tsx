import Link from 'next/link';
import { ArrowLeft, Download, FileJson, Play, Table2 } from 'lucide-react';
import { listDriveReplays, type ReplayManifest } from '@/lib/drive-replays';
import { listDriveSessions } from '@/lib/drive-data';
import type { CompleteSurveySession } from '@/types/survey';
import { ThemeToggle } from '@/components/ui';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Session replays · Researcher dashboard' };

export default async function ReplaysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : undefined;
  const expected = process.env.ADMIN_TOKEN;
  const allowed = expected ? token === expected : process.env.NODE_ENV !== 'production';

  if (!allowed) {
    return (
      <main id="main" className="mx-auto flex min-h-[70dvh] w-full max-w-md items-center px-4">
        <div className="w-full rounded-[22px] bg-card p-6 text-center">
          <h1 className="display text-[24px]">Replays locked</h1>
          <p className="mt-2 text-[14px] text-muted">Open this page with the dashboard admin token.</p>
        </div>
      </main>
    );
  }

  let sessions: ReplayManifest[] = [];
  let responses: CompleteSurveySession[] = [];
  let error: string | null = null;
  try {
    sessions = await listDriveReplays();
  } catch (loadError) {
    error = loadError instanceof Error ? loadError.message : 'Could not load Drive replays';
  }
  try {
    responses = await listDriveSessions();
  } catch (loadError) {
    error ??= loadError instanceof Error ? loadError.message : 'Could not load Drive responses';
  }
  const responseById = new Map(responses.map((response) => [response.sessionId, response]));

  const dashboardHref = token ? `/dashboard?token=${encodeURIComponent(token)}` : '/dashboard';
  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-start gap-3">
        <Link href={dashboardHref} className="circle-btn" aria-label="Back to dashboard">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            Researcher dashboard
          </p>
          <h1 className="display text-[28px] sm:text-[36px]">Session replays</h1>
        </div>
        <ThemeToggle />
      </header>

      {error && <div className="mb-4 rounded-[20px] bg-card p-4 text-[13px] text-muted">{error}</div>}

      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        <a
          href={`/api/export?format=responses${token ? `&token=${encodeURIComponent(token)}` : ''}`}
          className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary text-[12px] font-bold text-on-primary"
        >
          <Table2 className="h-4 w-4" /> All responses CSV
        </a>
        <a
          href={`/api/export?format=events${token ? `&token=${encodeURIComponent(token)}` : ''}`}
          className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-card text-[12px] font-semibold text-muted"
        >
          <Download className="h-4 w-4" /> Event log CSV
        </a>
        <a
          href={`/api/export?format=json${token ? `&token=${encodeURIComponent(token)}` : ''}`}
          className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-card text-[12px] font-semibold text-muted"
        >
          <FileJson className="h-4 w-4" /> Raw JSON
        </a>
      </div>

      <div className="grid gap-2.5">
        {sessions.map((session) => {
          const response = responseById.get(session.sessionId);
          const href = token
            ? `/replays/${encodeURIComponent(session.sessionId)}?token=${encodeURIComponent(token)}`
            : `/replays/${encodeURIComponent(session.sessionId)}`;
          return (
            <Link
              key={session.sessionId}
              href={href}
              className="flex items-center gap-4 rounded-[20px] bg-card p-4 transition hover:bg-well"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Play className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold">
                  {response
                    ? `${response.demographics.fullName} · ${response.demographics.age} · ${response.demographics.gender}`
                    : session.sessionId}
                </span>
                <span className="mt-0.5 block text-[12px] text-faint">
                  {response && <>{session.sessionId} · </>}
                  {session.completedAt ? new Date(session.completedAt).toLocaleString('en-IN') : 'Completed'}
                </span>
              </span>
              <span className="text-right text-[11px] font-semibold text-faint">
                {session.eventCount.toLocaleString()} events<br />{session.chunkCount} chunks
              </span>
            </Link>
          );
        })}
        {!error && sessions.length === 0 && (
          <div className="rounded-[22px] bg-card p-8 text-center text-[14px] text-muted">
            No completed session replays are in Drive yet.
          </div>
        )}
      </div>
    </main>
  );
}
