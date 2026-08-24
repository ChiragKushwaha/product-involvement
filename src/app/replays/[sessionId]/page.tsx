import { ReplayPlayer } from '@/components/ReplayPlayer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Session replay · Researcher dashboard' };

export default async function ReplayPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ sessionId }, query] = await Promise.all([params, searchParams]);
  const token = typeof query.token === 'string' ? query.token : undefined;
  const expected = process.env.ADMIN_TOKEN;
  const allowed = expected ? token === expected : process.env.NODE_ENV !== 'production';

  if (!allowed) {
    return (
      <main id="main" className="mx-auto flex min-h-[70dvh] w-full max-w-md items-center px-4">
        <div className="w-full rounded-[22px] bg-card p-6 text-center">
          <h1 className="display text-[24px]">Replay locked</h1>
          <p className="mt-2 text-[14px] text-muted">Open this page with the dashboard admin token.</p>
        </div>
      </main>
    );
  }

  return <ReplayPlayer sessionId={sessionId} token={token} />;
}
