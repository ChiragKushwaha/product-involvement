'use client';

import { Shuffle } from 'lucide-react';
import type { Situation } from '@/types/survey';
import { SITUATIONS } from '@/lib/situations-data';
import { ACCENT_BG, ACCENT_ON, Screen, StepRail, ThemeToggle, cx } from '@/components/ui';

/**
 * The eight advertisements from the flow PDF, labelled by what is advertised.
 *
 * The label is the product category only — never the high/low message framing,
 * which is the experimental manipulation and must stay hidden from
 * participants. Two cards therefore share each category, which is expected.
 */
export function SituationGrid({
  onSelect,
}: {
  onSelect: (s: Situation) => void;
}) {
  const pickRandom = () => {
    onSelect(SITUATIONS[Math.floor(Math.random() * SITUATIONS.length)]);
  };

  return (
    <Screen>
      <StepRail step={2} total={6} />

      <div className="flex items-start gap-3 pt-2 pb-5">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            Step 2 of 6
          </p>
          <h1 className="display text-[28px] leading-[0.92] md:text-[34px]">
            Select any one
            <br />
            advertisement
          </h1>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
            Choose a single advertisement to continue. Please do not go back and forth between
            them — viewing more than one affects the study data.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {SITUATIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            aria-label={`Advertisement ${s.number}: ${s.category}`}
            className={cx(
              'card flex aspect-[4/3] flex-col items-center justify-center gap-1.5 p-3 text-center [container-type:inline-size] transition active:scale-[0.97]',
              ACCENT_BG[s.accent],
              ACCENT_ON[s.accent],
            )}
          >
            <span className="display max-w-full text-[clamp(18px,15cqw,24px)] leading-[0.95]">
              {s.category}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
              Advertisement {s.number}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={pickRandom}
        className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-card text-[13px] font-semibold text-muted transition active:bg-well"
      >
        <Shuffle className="h-4 w-4" strokeWidth={2.5} />
        Pick one at random for me
      </button>
    </Screen>
  );
}
