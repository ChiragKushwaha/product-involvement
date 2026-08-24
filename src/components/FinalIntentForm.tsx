'use client';

import { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import type { PurchaseIntent, Situation } from '@/types/survey';
import {
  ActionBar,
  LikertQuestion,
  PrimaryButton,
  Screen,
  StepRail,
  ThemeToggle,
} from '@/components/ui';

const QUESTIONS: { key: keyof PurchaseIntent; text: string }[] = [
  {
    key: 'q7_considerPurchasing',
    text: 'If I were going to purchase this type of product/service, I would consider purchasing the selected product/service.',
  },
  {
    key: 'q8_likelihoodHigh',
    text: 'If I were shopping for this type of product/service, the likelihood that I would purchase the selected product/service is high.',
  },
  {
    key: 'q9_willingnessHigh',
    text: 'My willingness to purchase the selected product/service would be high.',
  },
  {
    key: 'q10_probabilityHigh',
    text: 'The probability that I would consider purchasing the selected product/service is high.',
  },
];

export function FinalIntentForm({
  situation,
  initialIntent,
  submitting,
  onSubmit,
}: {
  situation: Situation;
  initialIntent: PurchaseIntent;
  submitting: boolean;
  onSubmit: (intent: PurchaseIntent) => void;
}) {
  const [intent, setIntent] = useState<PurchaseIntent>(initialIntent);
  const [attempted, setAttempted] = useState(false);
  const questionRefs = useRef(new Map<keyof PurchaseIntent, HTMLDivElement>());
  const complete = QUESTIONS.every((q) => intent[q.key] > 0);
  const showFirstMissing = () => {
    setAttempted(true);
    const missing = QUESTIONS.find((question) => intent[question.key] === 0);
    const target = missing ? questionRefs.current.get(missing.key) : undefined;
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => target?.focus(), 350);
  };

  return (
    <Screen>
      <StepRail step={6} total={6} />

      <div className="flex items-start gap-3 pt-2 pb-5">
        <div className="min-w-0 flex-1">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
          Last few questions · {situation.category}
        </p>
        <h1 className="display text-[26px] leading-[0.92] md:text-[32px]">
          Your purchase
          <br />
          decision
        </h1>
        </div>
        <ThemeToggle />
      </div>

      {QUESTIONS.map((q, i) => (
        <LikertQuestion
          key={q.key}
          index={i + 7}
          question={q.text}
          value={intent[q.key]}
          onChange={(v) => setIntent((prev) => ({ ...prev, [q.key]: v }))}
          questionRef={(node) => {
            if (node) questionRefs.current.set(q.key, node);
            else questionRefs.current.delete(q.key);
          }}
          error={attempted && intent[q.key] === 0 ? 'Please choose a rating.' : undefined}
        />
      ))}

      <ActionBar>
        <PrimaryButton
          disabled={!complete || submitting}
          onDisabledClick={!submitting ? showFirstMissing : undefined}
          onClick={() => onSubmit(intent)}
        >
          {submitting ? 'Submitting…' : 'Submit responses'}
          {!submitting && <Check className="h-4 w-4" strokeWidth={3} />}
        </PrimaryButton>
      </ActionBar>
    </Screen>
  );
}
