import { aggregates } from '@/lib/db';
import { Dashboard } from '@/components/Dashboard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Study results · Researcher dashboard' };

/**
 * Reads straight from the SQLite store on the server, so the browser never
 * receives raw participant records — only the rollups the charts plot.
 * Downloads go through /api/export, which applies the same token check.
 */
export default async function DashboardPage({ searchParams }: PageProps<'/dashboard'>) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : undefined;

  const expected = process.env.ADMIN_TOKEN;
  const allowed = expected ? token === expected : process.env.NODE_ENV !== 'production';

  if (!allowed) {
    return (
      <main id="main" className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col justify-center px-4">
        <div className="rounded-[22px] bg-card p-6 text-center">
          <h1 className="display text-[24px]">Dashboard locked</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            This deployment sets <code className="text-primary">ADMIN_TOKEN</code>. Open the
            dashboard with <code className="text-primary">?token=…</code> to view the results.
          </p>
        </div>
      </main>
    );
  }

  let data;
  try {
    data = await aggregates();
  } catch {
    data = {
      total: 0,
      byInvolvement: [],
      byCategory: [],
      byAd: [],
      byChannel: [],
      involvementScores: [],
      scrollBands: [],
    };
  }

  return (
    <main id="main" className="flex-1">
      <Dashboard data={data} token={token} />
    </main>
  );
}
