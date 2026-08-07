'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Eye, RotateCcw } from 'lucide-react';
import type { AdFeedback, Situation } from '@/types/survey';
import { AdPlayer, type AdPlayback } from '@/components/AdPlayer';
import {
  ACCENT_BG,
  ACCENT_ON,
  ActionBar,
  LikertQuestion,
  PrimaryButton,
  Screen,
  StepRail,
  ThemeToggle,
  cx,
} from '@/components/ui';

const FAMILIARITY_QUESTIONS: { key: keyof AdFeedback; text: string }[] = [
  { key: 'q1_familiar', text: 'I am familiar with this product/service.' },
  { key: 'q2_knowWell', text: 'I know this product/service well.' },
  {
    key: 'q3_knowMoreThanOthers',
    text: 'Compared with most people, I know more about this product/service.',
  },
];

const AD_FEEDBACK_QUESTIONS: { key: keyof AdFeedback; text: string }[] = [
  {
    key: 'q4_providedFacts',
    text: 'The advertisement provided facts about the product/service.',
  },
  {
    key: 'q5_providedPracticalInfo',
    text: 'The advertisement provided practical information about the product/service.',
  },
];

/** The scenario text that accompanies the advertisement. */
export function ScenarioCard({ situation }: { situation: Situation }) {
  return (
    <div className={cx('card p-5', ACCENT_BG[situation.accent], ACCENT_ON[situation.accent])}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-55">
            {situation.code}
          </p>
          <h2 className="display mt-1 text-[26px] leading-[0.92]">{situation.headline}</h2>
        </div>
        <span className="shrink-0 rounded-full bg-black/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
          {situation.category}
        </span>
      </div>

      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] opacity-55">
        {situation.prompt}
      </p>

      <p className="text-[15px] font-medium leading-relaxed">{situation.scenario}</p>
    </div>
  );
}

export interface StimulusResult {
  feedback: AdFeedback;
  exposureSec: number;
  rewatchCount: number;
  videoWatchedSec: number;
  videoCompleted: boolean;
}

export function StimulusScreen({
  situation,
  initialFeedback,
  onBack,
  onSubmit,
}: {
  situation: Situation;
  initialFeedback: AdFeedback;
  onBack: () => void;
  onSubmit: (result: StimulusResult) => void;
}) {
  const [phase, setPhase] = useState<'ad' | 'feedback' | 'familiarity'>('ad');
  const [feedback, setFeedback] = useState<AdFeedback>(initialFeedback);
  const [rewatchCount, setRewatchCount] = useState(0);
  const [replayToken, setReplayToken] = useState(0);
  const [adEnded, setAdEnded] = useState(false);

  // Watch time accumulates across plays; the player restarts at 0 each replay.
  const playbackRef = useRef<AdPlayback>({ watchedSec: 0, completed: false });
  const lastPlayRef = useRef(0);

  // Accumulated seconds the ad screen was actually on screen. The effect runs
  // on mount with phase 'ad', which opens the first exposure window.
  const exposureRef = useRef(0);
  const enteredAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase === 'ad') {
      enteredAtRef.current = Date.now();
      return;
    }
    if (enteredAtRef.current !== null) {
      exposureRef.current += (Date.now() - enteredAtRef.current) / 1000;
      enteredAtRef.current = null;
    }
  }, [phase]);

  const handleProgress = useCallback((p: AdPlayback) => {
    const delta =
      p.watchedSec >= lastPlayRef.current ? p.watchedSec - lastPlayRef.current : p.watchedSec;
    lastPlayRef.current = p.watchedSec;
    playbackRef.current = {
      watchedSec: playbackRef.current.watchedSec + delta,
      completed: playbackRef.current.completed || p.completed,
    };
  }, []);

  const rewatch = () => {
    setRewatchCount((c) => c + 1);
    setReplayToken((t) => t + 1);
    lastPlayRef.current = 0;
    setAdEnded(false);
    setPhase('ad');
  };

  const adFeedbackComplete = AD_FEEDBACK_QUESTIONS.every((q) => feedback[q.key] > 0);
  const familiarityComplete = FAMILIARITY_QUESTIONS.every((q) => feedback[q.key] > 0);

  /* ------------------------------------------------------------ the ad */

  if (phase === 'ad') {
    return (
      <Screen>
        <StepRail step={3} total={6} />
        <div className="flex items-start gap-3 pt-2 pb-5">
          <button onClick={onBack} className="circle-btn mt-0.5" aria-label="Go back">
            <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
              Advertisement
            </p>
            <h1 className="display text-[26px] leading-[0.92] md:text-[32px]">
              Watch, then read
            </h1>
          </div>
          <ThemeToggle />
        </div>

        <div className="space-y-4">
          <AdPlayer
            key={replayToken}
            situation={situation}
            onProgress={handleProgress}
            onEnded={() => setAdEnded(true)}
          />
          <ScenarioCard situation={situation} />
        </div>

        <ActionBar>
          <div className="space-y-2">
            {adEnded && (
              <button
                onClick={() => {
                  lastPlayRef.current = 0;
                  setReplayToken((t) => t + 1);
                  setAdEnded(false);
                }}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-card text-[13px] font-semibold text-muted transition active:opacity-80"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
                Play again
              </button>
            )}
            <PrimaryButton onClick={() => setPhase('feedback')}>
              Continue
              <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </PrimaryButton>
          </div>
        </ActionBar>
      </Screen>
    );
  }

  /* -------------------------------------------------- product familiarity */

  if (phase === 'familiarity') {
    return (
      <Screen>
        <StepRail step={3} total={6} />

        <div className="flex items-start gap-3 pt-2 pb-5">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
              {situation.code} · {situation.category}
            </p>
            <h1 className="display text-[26px] leading-[0.92] md:text-[32px]">
              Product familiarity
            </h1>
          </div>
          <ThemeToggle />
        </div>

        {FAMILIARITY_QUESTIONS.map((q, i) => (
          <LikertQuestion
            key={q.key}
            index={i + 1}
            question={q.text}
            value={feedback[q.key]}
            onChange={(v) => setFeedback((prev) => ({ ...prev, [q.key]: v }))}
          />
        ))}

        <ActionBar>
          <PrimaryButton
            disabled={!familiarityComplete}
            onClick={() => {
              const extra =
                enteredAtRef.current !== null ? (Date.now() - enteredAtRef.current) / 1000 : 0;
              onSubmit({
                feedback,
                exposureSec: Math.round(exposureRef.current + extra),
                rewatchCount,
                videoWatchedSec: Math.round(playbackRef.current.watchedSec),
                videoCompleted: playbackRef.current.completed,
              });
            }}
          >
            Continue
            <ArrowRight className="h-4 w-4" strokeWidth={3} />
          </PrimaryButton>
        </ActionBar>
      </Screen>
    );
  }

  /* --------------------------------------------------------- ad feedback */

  return (
    <Screen>
      <StepRail step={3} total={6} />

      <div className="flex items-start gap-3 pt-2 pb-5">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            {situation.code} · {situation.category}
          </p>
          <h1 className="display text-[26px] leading-[0.92] md:text-[32px]">Ad feedback</h1>
        </div>
        <ThemeToggle />
      </div>

      <button
        onClick={rewatch}
        className="mb-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-card text-[13px] font-semibold text-muted transition active:opacity-80"
      >
        <Eye className="h-4 w-4" strokeWidth={2.5} />
        View the advertisement again
      </button>

      {AD_FEEDBACK_QUESTIONS.map((q, i) => (
        <LikertQuestion
          key={q.key}
          index={i + 1}
          question={q.text}
          value={feedback[q.key]}
          onChange={(v) => setFeedback((prev) => ({ ...prev, [q.key]: v }))}
        />
      ))}

      <ActionBar>
        <PrimaryButton disabled={!adFeedbackComplete} onClick={() => setPhase('familiarity')}>
          Continue
          <ArrowRight className="h-4 w-4" strokeWidth={3} />
        </PrimaryButton>
      </ActionBar>
    </Screen>
  );
}
