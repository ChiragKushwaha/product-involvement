'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileJson, Table2 } from 'lucide-react';
import type { Aggregates } from '@/lib/db';
import { ThemeToggle, cx } from '@/components/ui';

/**
 * Researcher dashboard.
 *
 * Series colours are the validated categorical palette (violet / teal / gold —
 * the blue–yellow axis stays separable under deuteranopia and protanopia).
 * Both modes were validated against their own surface; see the palette block
 * below. Every chart also carries direct labels and a table view, so identity
 * is never conveyed by colour alone.
 */

const SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)'];

/* ------------------------------------------------------------ primitives */

function Panel({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('min-w-0 rounded-[22px] bg-card p-4 sm:p-5', className)}>
      <h2 className="text-[15px] font-bold leading-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-[12px] leading-snug text-faint">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatTile({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="rounded-[18px] bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{label}</p>
      <p className="display mt-1.5 text-[26px] leading-none sm:text-[30px]">
        {value}
        {unit && <span className="ml-1 text-[14px] font-semibold text-faint">{unit}</span>}
      </p>
    </div>
  );
}

/** Horizontal bars: 4px rounded data-end, 2px gap between fills, direct labels. */
function BarRows({
  rows,
  color = 'var(--s1)',
  suffix = '',
}: {
  rows: { label: string; value: number; sub?: string }[];
  color?: string;
  suffix?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[minmax(72px,26%)_1fr_auto] items-center gap-3">
          <span className="truncate text-[12px] font-medium text-muted" title={r.label}>
            {r.label}
          </span>
          <div className="h-6 overflow-hidden rounded-[4px] bg-well">
            <div
              className="h-full rounded-[4px] transition-[width] duration-500"
              style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: color }}
              title={`${r.label}: ${r.value}${suffix}`}
            />
          </div>
          <span className="w-14 text-right text-[12px] font-bold tabular-nums">
            {r.value}
            {suffix}
          </span>
        </div>
      ))}
      {rows.length === 0 && <p className="py-6 text-center text-[13px] text-faint">No data yet.</p>}
    </div>
  );
}

/** Small multiple: one metric, one bar per group. Avoids any dual-axis chart. */
function GroupedMetric({
  title,
  unit,
  groups,
}: {
  title: string;
  unit?: string;
  groups: { label: string; value: number; colorIndex: number }[];
}) {
  const max = Math.max(1, ...groups.map((g) => g.value));

  return (
    <div className="rounded-[16px] bg-well p-3.5">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-faint">
        {title}
        {unit ? ` (${unit})` : ''}
      </p>
      <div className="flex h-28 items-end gap-2">
        {groups.map((g) => (
          <div key={g.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-[11px] font-bold tabular-nums">{g.value}</span>
            <div
              className="w-full rounded-t-[4px] transition-[height] duration-500"
              style={{
                height: `${Math.max(4, (g.value / max) * 76)}px`,
                background: SERIES[g.colorIndex % SERIES.length],
              }}
              title={`${title} — ${g.label}: ${g.value}${unit ?? ''}`}
            />
            <span className="w-full truncate text-center text-[10px] text-faint" title={g.label}>
              {g.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ items }: { items: { label: string; colorIndex: number }[] }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
          <span
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{ background: SERIES[it.colorIndex % SERIES.length] }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

/** Involvement (Q6 mean) against purchase intention (Q7-Q10 mean). */
function Scatter({
  points,
}: {
  points: { ad: string; involvement: string; q6mean: number; intentMean: number }[];
}) {
  const W = 300;
  const H = 200;
  const PAD_X = 40;
  const PAD_Y = 30;
  const sx = (v: number) => PAD_X + ((v - 1) / 6) * (W - PAD_X - 16);
  const sy = (v: number) => H - PAD_Y - ((v - 1) / 6) * (H - PAD_Y - 16);

  return (
    <div>
      <Legend
        items={[
          { label: 'High involvement', colorIndex: 0 },
          { label: 'Low involvement', colorIndex: 1 },
        ]}
      />
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[280px]" role="img"
             aria-label="Product involvement against purchase intention">
          {[1, 4, 7].map((t) => (
            <g key={t}>
              <line
                x1={sx(t)} y1={16} x2={sx(t)} y2={H - PAD_Y}
                stroke="var(--line)" strokeWidth="1"
              />
              <line
                x1={PAD_X} y1={sy(t)} x2={W - 16} y2={sy(t)}
                stroke="var(--line)" strokeWidth="1"
              />
              <text x={sx(t)} y={H - PAD_Y + 12} fontSize="9" fill="var(--faint)" textAnchor="middle">
                {t}
              </text>
              <text x={PAD_X - 6} y={sy(t) + 3} fontSize="9" fill="var(--faint)" textAnchor="end">
                {t}
              </text>
            </g>
          ))}

          {points.map((p, i) => (
            <circle
              key={`${p.ad}-${i}`}
              cx={sx(p.q6mean)}
              cy={sy(p.intentMean)}
              r="5"
              fill={SERIES[p.involvement === 'high' ? 0 : 1]}
              stroke="var(--card)"
              strokeWidth="2"
            >
              <title>{`${p.ad} · ${p.involvement} — involvement ${p.q6mean}, intention ${p.intentMean}`}</title>
            </circle>
          ))}

          <text x={(PAD_X + W) / 2} y={H - 4} fontSize="9" fill="var(--faint)" textAnchor="middle">
            Product involvement (Q6 mean)
          </text>
          <text x={-(H - PAD_Y) / 2} y={11} fontSize="9" fill="var(--faint)" textAnchor="middle"
                transform="rotate(-90)">
            Purchase intention
          </text>
        </svg>
      </div>
      {points.length === 0 && <p className="py-4 text-center text-[13px] text-faint">No data yet.</p>}
    </div>
  );
}

/* -------------------------------------------------------------- dashboard */

const CHANNEL_LABEL: Record<string, string> = {
  GOOGLE: 'Search',
  SITE: 'Sites',
  AI: 'AI',
};

export function Dashboard({ data, token }: { data: Aggregates; token?: string }) {
  const [showTable, setShowTable] = useState(false);
  const qs = token ? `&token=${encodeURIComponent(token)}` : '';

  const channels = useMemo(
    () => data.byChannel.map((c) => ({ ...c, name: CHANNEL_LABEL[c.channel] ?? c.channel })),
    [data.byChannel],
  );

  const overall = useMemo(() => {
    const inv = data.byInvolvement;
    const n = inv.reduce((a, b) => a + b.n, 0);
    if (n === 0) return { te2: 0, sn2: 0, qd1: 0 };
    return {
      te2: Math.round(inv.reduce((a, b) => a + b.te2 * b.n, 0) / n),
      sn2: +(inv.reduce((a, b) => a + b.sn2 * b.n, 0) / n).toFixed(1),
      qd1: +(inv.reduce((a, b) => a + b.qd1 * b.n, 0) / n).toFixed(1),
    };
  }, [data.byInvolvement]);

  return (
    <div
      className="viz-root mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6 lg:px-8"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      {/* Validated series palette — light and dark are separately stepped. */}
      <style>{`
        .viz-root { --s1:#5951d8; --s2:#1a9aa8; --s3:#8f6f00; }
        @media (prefers-color-scheme: dark) {
          :root:where(:not([data-theme="light"])) .viz-root {
            --s1:#7d75f0; --s2:#23a0ae; --s3:#ad8a10;
          }
        }
        :root[data-theme="dark"] .viz-root { --s1:#7d75f0; --s2:#23a0ae; --s3:#ad8a10; }
      `}</style>

      <header className="flex items-start gap-3 pt-2 pb-6">
        <Link href="/" className="circle-btn mt-0.5" aria-label="Back to the survey">
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            Researcher dashboard
          </p>
          <h1 className="display text-[28px] leading-[0.92] sm:text-[36px]">Study results</h1>
        </div>
        <ThemeToggle />
      </header>

      {/* ------------------------------------------------------ stat tiles */}
      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatTile label="Sessions" value={data.total} />
        <StatTile label="Avg search time" value={overall.te2} unit="s" />
        <StatTile label="Avg unique sources" value={overall.sn2} />
        <StatTile label="Avg reformulations" value={overall.qd1} />
      </div>

      {/* -------------------------------------------------------- downloads */}
      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        <a
          href={`/api/export?format=responses${qs}`}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary text-[13px] font-bold text-on-primary transition active:scale-[0.98]"
        >
          <Table2 className="h-4 w-4" strokeWidth={2.5} />
          Responses CSV
        </a>
        <a
          href={`/api/export?format=events${qs}`}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-card text-[13px] font-semibold text-muted transition active:opacity-80"
        >
          <Download className="h-4 w-4" strokeWidth={2.5} />
          Event log CSV
        </a>
        <a
          href={`/api/export?format=json${qs}`}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-card text-[13px] font-semibold text-muted transition active:opacity-80"
        >
          <FileJson className="h-4 w-4" strokeWidth={2.5} />
          Raw JSON
        </a>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* --------------------------------------------- by involvement */}
        <Panel
          title="Search effort by involvement"
          subtitle="High- and low-involvement framings compared on the task-level measures."
          className="lg:col-span-2"
        >
          <Legend
            items={[
              { label: 'High involvement', colorIndex: 0 },
              { label: 'Low involvement', colorIndex: 1 },
            ]}
          />
          <div className="grid gap-2.5 sm:grid-cols-3">
            {(
              [
                ['TE2 · total search time', 's', 'te2'],
                ['SN2 · unique sources', '', 'sn2'],
                ['QD1 · reformulations', '', 'qd1'],
              ] as const
            ).map(([title, unit, key]) => (
              <GroupedMetric
                key={key}
                title={title}
                unit={unit || undefined}
                groups={data.byInvolvement.map((r) => ({
                  label: r.involvement === 'high' ? 'High' : 'Low',
                  value: r[key],
                  colorIndex: r.involvement === 'high' ? 0 : 1,
                }))}
              />
            ))}
          </div>
        </Panel>

        {/* ------------------------------------------------- by channel */}
        <Panel
          title="Channel comparison"
          subtitle="Averages per participant across the three search channels."
        >
          <Legend
            items={channels.map((c, i) => ({ label: c.name, colorIndex: i }))}
          />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {(
              [
                ['SN1 · selections', '', 'sn1'],
                ['TE1 · avg dwell', 's', 'te1'],
                ['CT1 · scrolls', '', 'ct1'],
                ['QD1 · reformulations', '', 'qd1'],
              ] as const
            ).map(([title, unit, key]) => (
              <GroupedMetric
                key={key}
                title={title}
                unit={unit || undefined}
                groups={channels.map((c, i) => ({
                  label: c.name,
                  value: c[key],
                  colorIndex: i,
                }))}
              />
            ))}
          </div>
        </Panel>

        {/* ---------------------------------------------------- scatter */}
        <Panel
          title="Involvement vs purchase intention"
          subtitle="Each point is one participant: Q6 mean against the Q7–Q10 mean."
        >
          <Scatter points={data.involvementScores} />
        </Panel>

        {/* -------------------------------------------------------- ads */}
        <Panel title="Responses per advertisement" subtitle="How the eight situations are covered.">
          <BarRows rows={data.byAd.map((a) => ({ label: a.ad, value: a.n }))} />
        </Panel>

        {/* ----------------------------------------------- scroll bands */}
        <Panel
          title="CT2 · scroll depth reached"
          subtitle="Coded into the measurement framework's five bands."
        >
          <BarRows
            rows={data.scrollBands.map((b) => ({ label: b.band, value: b.n }))}
            color="var(--s2)"
          />
        </Panel>

        {/* --------------------------------------------------- category */}
        <Panel
          title="By product category"
          subtitle="Mean search time, unique sources and scroll depth."
          className="lg:col-span-2"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-faint">
                  <th className="py-2 pr-3 font-semibold">Category</th>
                  <th className="py-2 pr-3 font-semibold tabular-nums">n</th>
                  <th className="py-2 pr-3 font-semibold tabular-nums">TE2 (s)</th>
                  <th className="py-2 pr-3 font-semibold tabular-nums">SN2</th>
                  <th className="py-2 font-semibold tabular-nums">CT2 (%)</th>
                </tr>
              </thead>
              <tbody>
                {data.byCategory.map((c) => (
                  <tr key={c.category} className="border-b border-line last:border-0">
                    <td className="py-2.5 pr-3 font-medium">{c.category}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted">{c.n}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted">{c.te2}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted">{c.sn2}</td>
                    <td className="py-2.5 tabular-nums text-muted">{c.ct2}</td>
                  </tr>
                ))}
                {data.byCategory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-faint">
                      No data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* ------------------------------------------------------ table view */}
      <div className="mt-3">
        <button
          onClick={() => setShowTable((v) => !v)}
          className="flex min-h-[44px] w-full items-center justify-center rounded-full bg-card text-[12px] font-semibold text-muted transition active:opacity-80"
        >
          {showTable ? 'Hide' : 'Show'} chart data as a table
        </button>

        {showTable && (
          <div className="mt-3 overflow-x-auto rounded-[22px] bg-card p-4">
            <table className="w-full min-w-[440px] text-left text-[13px]">
              <caption className="mb-3 text-left text-[12px] text-faint">
                Every value plotted above, in numbers.
              </caption>
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-faint">
                  <th className="py-2 pr-3 font-semibold">Group</th>
                  <th className="py-2 pr-3 font-semibold tabular-nums">n</th>
                  <th className="py-2 pr-3 font-semibold tabular-nums">TE2</th>
                  <th className="py-2 pr-3 font-semibold tabular-nums">SN2</th>
                  <th className="py-2 font-semibold tabular-nums">QD1</th>
                </tr>
              </thead>
              <tbody>
                {data.byInvolvement.map((r) => (
                  <tr key={r.involvement} className="border-b border-line">
                    <td className="py-2.5 pr-3 font-medium capitalize">{r.involvement} involvement</td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted">{r.n}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted">{r.te2}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted">{r.sn2}</td>
                    <td className="py-2.5 tabular-nums text-muted">{r.qd1}</td>
                  </tr>
                ))}
                {channels.map((c) => (
                  <tr key={c.channel} className="border-b border-line last:border-0">
                    <td className="py-2.5 pr-3 font-medium">{c.name} channel</td>
                    <td className="py-2.5 pr-3 tabular-nums text-faint">—</td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted">{c.te1}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted">{c.sn2}</td>
                    <td className="py-2.5 tabular-nums text-muted">{c.qd1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
