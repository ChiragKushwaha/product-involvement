'use client';

import { useState } from 'react';
import { ArrowRight, Bot, Globe, RotateCcw, Search } from 'lucide-react';
import type { SemanticDifferential, Situation } from '@/types/survey';
import {
  ActionBar,
  LikertScale,
  PrimaryButton,
  Screen,
  StepRail,
  ThemeToggle,
} from '@/components/ui';

const ITEMS: {
  key: keyof SemanticDifferential;
  left: string;
  right: string;
}[] = [
  { key: 'unimportant_important', left: 'Unimportant', right: 'Important' },
  { key: 'irrelevant_relevant', left: 'Irrelevant', right: 'Relevant' },
  { key: 'meansNothing_meansLot', left: 'Means nothing to me', right: 'Means a lot to me' },
  { key: 'worthless_valuable', left: 'Worthless', right: 'Valuable' },
  { key: 'notNeeded_needed', left: 'Not needed', right: 'Needed' },
];

export function ProductInvolvementForm({
  situation,
  initialData,
  onRewatchAd,
  onSubmit,
}: {
  situation: Situation;
  initialData: SemanticDifferential;
  onRewatchAd: () => void;
  onSubmit: (data: SemanticDifferential) => void;
}) {
  const [phase, setPhase] = useState<'scale' | 'briefing'>('scale');
  const [data, setData] = useState<SemanticDifferential>(initialData);

  const complete = ITEMS.every((it) => data[it.key] > 0);

  if (phase === 'briefing') {
    return (
      <Screen>
        <StepRail step={4} total={6} />

        <div className="flex items-start gap-3 pt-2 pb-5">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
              You have now viewed the advertisement
            </p>
            <h1 className="display text-[26px] leading-[0.92] md:text-[32px]">
              Now explore
              <br />
              the information
            </h1>
          </div>
          <ThemeToggle />
        </div>

        <button
          onClick={onRewatchAd}
          className="mb-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-card text-[13px] font-bold text-content transition active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
          Rewatch again
        </button>

        <div className="card mb-5 bg-card p-5">
          <p className="text-[14px] leading-relaxed text-muted">
            Now imagine that you&rsquo;re thinking about buying this product/service. Before
            deciding you can explore more information using the search interfaces provided. Use
            whichever option you prefer &mdash; Google search, the AI chatbot, the official
            website links, or a combination of these &mdash; just as you would in real life.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            <strong className="font-bold text-primary">No time restriction.</strong> Once you have
            gathered sufficient information and are ready to make your decision, click continue
            to proceed to the last few questions.
          </p>
        </div>

        <div className="mb-2 grid grid-cols-3 gap-2.5">
          {[
            { icon: Search, label: 'Google\nSearch', tint: 'bg-sky text-[#16181a]' },
            { icon: Globe, label: 'Official\nWebsites', tint: 'bg-butter text-[#16181a]' },
            { icon: Bot, label: 'AI\nChatbot', tint: 'bg-peri text-white' },
          ].map(({ icon: Icon, label, tint }) => (
            <div
              key={label}
              className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-[20px] ${tint}`}
            >
              <Icon className="h-6 w-6" strokeWidth={2.5} />
              <span className="whitespace-pre-line text-center text-[11px] font-bold uppercase leading-tight tracking-wide">
                {label}
              </span>
            </div>
          ))}
        </div>

        <ActionBar>
          <PrimaryButton onClick={() => onSubmit(data)}>
            Start searching
            <ArrowRight className="h-4 w-4" strokeWidth={3} />
          </PrimaryButton>
        </ActionBar>
      </Screen>
    );
  }

  return (
    <Screen>
      <StepRail step={4} total={6} />

      <div className="flex items-start gap-3 pt-2 pb-5">
        <div className="min-w-0 flex-1">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
          Question 6 · {situation.category}
        </p>
        <h1 className="display text-[26px] leading-[0.92] md:text-[32px]">
          How would you
          <br />
          describe it?
        </h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="card mb-5 bg-card p-4">
        <p className="text-[14px] leading-relaxed text-muted">
          Please think about <strong className="font-bold text-content">this type of
          product/service in general</strong>. Indicate how you would describe it by selecting the
          point that best represents your opinion.
        </p>
      </div>

      {ITEMS.map((item) => (
        <div key={item.key} className="mb-5 rounded-[22px] bg-card p-4">
          <LikertScale
            value={data[item.key]}
            onChange={(v) => setData((prev) => ({ ...prev, [item.key]: v }))}
            leftAnchor={item.left}
            rightAnchor={item.right}
            name={`${item.left} to ${item.right}`}
          />
        </div>
      ))}

      <ActionBar>
        <PrimaryButton disabled={!complete} onClick={() => setPhase('briefing')}>
          Continue
          <ArrowRight className="h-4 w-4" strokeWidth={3} />
        </PrimaryButton>
      </ActionBar>
    </Screen>
  );
}
