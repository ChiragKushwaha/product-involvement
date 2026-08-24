'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, RotateCcw } from 'lucide-react';

import { DemographicsForm } from '@/components/DemographicsForm';
import { SituationGrid } from '@/components/SituationGrid';
import { StimulusScreen, type StimulusResult } from '@/components/StimulusScreen';
import { ProductInvolvementForm } from '@/components/ProductInvolvementForm';
import { SearchInterface } from '@/components/SearchInterface';
import { FinalIntentForm } from '@/components/FinalIntentForm';
import { PrimaryButton, Screen } from '@/components/ui';

import { TelemetryCollector } from '@/lib/telemetry-tracker';
import { appendLocalSession } from '@/lib/local-store';
import {
  queueSurveyResponse,
  startResponseUploadRecovery,
} from '@/lib/response-upload-queue';
import { SessionReplayRecorder } from '@/lib/session-replay';
import type {
  AdFeedback,
  CombinedTelemetry,
  CompleteSurveySession,
  Demographics,
  PurchaseIntent,
  SemanticDifferential,
  Situation,
} from '@/types/survey';

const EMPTY_DEMOGRAPHICS: Demographics = {
  fullName: '',
  age: '',
  gender: '',
  education: '',
  onlinePurchaseFreq: '',
};

const EMPTY_FEEDBACK: AdFeedback = {
  q1_familiar: 0,
  q2_knowWell: 0,
  q3_knowMoreThanOthers: 0,
  q4_providedFacts: 0,
  q5_providedPracticalInfo: 0,
};

const EMPTY_INVOLVEMENT: SemanticDifferential = {
  unimportant_important: 0,
  irrelevant_relevant: 0,
  meansNothing_meansLot: 0,
  worthless_valuable: 0,
  notNeeded_needed: 0,
};

const EMPTY_INTENT: PurchaseIntent = {
  q7_considerPurchasing: 0,
  q8_likelihoodHigh: 0,
  q9_willingnessHigh: 0,
  q10_probabilityHigh: 0,
};

function slugPart(value: string, fallback: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36) || fallback;
}

function participantSessionId(data: Demographics) {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
    String(now.getMilliseconds()).padStart(3, '0'),
  ].join('');
  return `${slugPart(data.fullName, 'participant')}-${slugPart(data.age, 'age')}-${slugPart(data.gender, 'gender')}-${stamp}`;
}

export default function Home() {
  const [sessionId, setSessionId] = useState('');
  const [stage, setStage] = useState(1);
  const [demographics, setDemographics] = useState<Demographics>(EMPTY_DEMOGRAPHICS);
  const [situation, setSituation] = useState<Situation | null>(null);
  const [feedback, setFeedback] = useState<AdFeedback>(EMPTY_FEEDBACK);
  const [involvement, setInvolvement] = useState<SemanticDifferential>(EMPTY_INVOLVEMENT);
  const [telemetry, setTelemetry] = useState<CombinedTelemetry | null>(null);
  const [intent, setIntent] = useState<PurchaseIntent>(EMPTY_INTENT);
  const [exposure, setExposure] = useState({
    sec: 0,
    rewatches: 0,
    videoWatchedSec: 0,
    videoCompleted: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitNote, setSubmitNote] = useState<string | null>(null);

  const [collector, setCollector] = useState(() => new TelemetryCollector());
  const replayRef = useRef(new SessionReplayRecorder());
  const activeSessionIdRef = useRef('');

  useEffect(() => () => replayRef.current.dispose(), []);
  useEffect(() => startResponseUploadRecovery((status) => {
    if (status.sessionId !== activeSessionIdRef.current) return;
    if (status.state === 'uploading') {
      setSubmitNote('Saving your response to the study Drive folder…');
    } else if (status.state === 'uploaded') {
      setSubmitNote('Response saved to Drive. Replay files are syncing automatically.');
    } else if (status.attempts > 0) {
      setSubmitNote('Drive is busy. Your response is secured and will retry automatically.');
    } else {
      setSubmitNote('Response secured. Syncing to Drive automatically…');
    }
  }), []);

  const toTop = () => window.scrollTo({ top: 0 });

  const advance = useCallback((next: number) => {
    replayRef.current.addCustomEvent('stage_change', { stage: next });
    setStage(next);
    toTop();
  }, []);

  const handleSelectSituation = (s: Situation) => {
    replayRef.current.addCustomEvent('situation_selected', {
      code: s.code,
      category: s.category,
    });
    setSituation(s);
    setFeedback(EMPTY_FEEDBACK);
    setInvolvement(EMPTY_INVOLVEMENT);
    advance(3);
  };

  const handleFeedback = (r: StimulusResult) => {
    setFeedback(r.feedback);
    setExposure({
      sec: r.exposureSec,
      rewatches: r.rewatchCount,
      videoWatchedSec: r.videoWatchedSec,
      videoCompleted: r.videoCompleted,
    });
    advance(4);
  };

  const handleInvolvement = (data: SemanticDifferential) => {
    setInvolvement(data);
    setCollector(new TelemetryCollector());
    advance(5);
  };

  const handleSearchDone = (t: CombinedTelemetry) => {
    setTelemetry(t);
    advance(6);
  };

  const handleSubmit = async (finalIntent: PurchaseIntent) => {
    if (!situation || !telemetry) return;
    setIntent(finalIntent);
    setSubmitting(true);
    setSubmitNote('Finalising your response and session replay…');
    advance(7);

    // Capture the rendered thank-you state before closing the recorder.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => window.setTimeout(resolve, 200)));
    });
    replayRef.current.addCustomEvent('thank_you_shown', { sessionId });

    const replay = await replayRef.current.finalize();

    const session: CompleteSurveySession = {
      sessionId,
      timestamp: new Date().toISOString(),
      demographics,
      situation,
      adFeedback: feedback,
      productInvolvement: involvement,
      telemetry,
      purchaseIntent: finalIntent,
      stimulusExposureSec: exposure.sec,
      rewatchCount: exposure.rewatches,
      videoWatchedSec: exposure.videoWatchedSec,
      videoCompleted: exposure.videoCompleted,
      searchMode: {
        liveResults: telemetry.visitedSources.some((u) => u.startsWith('http')),
        externalVisits: collector.externalVisits,
      },
      replay,
    };

    // Local copy first, so a network failure can never lose the response.
    appendLocalSession(session);

    const uploaded = await queueSurveyResponse(session);
    setSubmitNote(
      uploaded && replay.status === 'uploaded'
        ? 'Response and session replay saved to the study Drive folder.'
        : uploaded
          ? 'Response saved to Drive. Replay files are syncing automatically.'
          : 'Response secured. Drive is busy, so automatic retry is in progress.',
    );

    setSubmitting(false);
    confetti({ particleCount: 110, spread: 78, origin: { y: 0.6 } });
  };

  const resetAll = () => {
    replayRef.current.dispose();
    replayRef.current = new SessionReplayRecorder();
    activeSessionIdRef.current = '';
    setSessionId('');
    setStage(1);
    setDemographics(EMPTY_DEMOGRAPHICS);
    setSituation(null);
    setFeedback(EMPTY_FEEDBACK);
    setInvolvement(EMPTY_INVOLVEMENT);
    setTelemetry(null);
    setIntent(EMPTY_INTENT);
    setExposure({ sec: 0, rewatches: 0, videoWatchedSec: 0, videoCompleted: false });
    setSubmitNote(null);
    setCollector(new TelemetryCollector());
    toTop();
  };

  return (
    <>
      {stage === 1 && (
        <DemographicsForm
          initialData={demographics}
          onReplayConsent={() => replayRef.current.start()}
          onSubmit={(d) => {
            const id = participantSessionId(d);
            activeSessionIdRef.current = id;
            setSessionId(id);
            replayRef.current.setSessionId(id);
            setDemographics(d);
            advance(2);
          }}
        />
      )}

      {stage === 2 && <SituationGrid onSelect={handleSelectSituation} />}

      {stage === 3 && situation && (
        <StimulusScreen
          situation={situation}
          initialFeedback={feedback}
          onBack={() => advance(2)}
          onSubmit={handleFeedback}
        />
      )}

      {stage === 4 && situation && (
        <ProductInvolvementForm
          situation={situation}
          initialData={involvement}
          onRewatchAd={() => advance(3)}
          onSubmit={handleInvolvement}
        />
      )}

      {stage === 5 && situation && (
        <SearchInterface
          situation={situation}
          collector={collector}
          onReplayEvent={(tag, payload) => replayRef.current.addCustomEvent(tag, payload)}
          onFinish={handleSearchDone}
        />
      )}

      {stage === 6 && situation && (
        <FinalIntentForm
          situation={situation}
          initialIntent={intent}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      )}

      {stage === 7 && (
        <Screen>
          <div className="flex min-h-[80dvh] flex-col justify-center">
            <div className="card bg-sage p-6 text-[#16181a]">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-surface">
                <CheckCircle2 className="h-7 w-7 text-sage" strokeWidth={2.5} />
              </div>
              <h1 className="display text-[30px] leading-[0.92]">
                Thank you for
                <br />
                participating
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-[#16181a]/70">
                Your responses and privacy-masked session replay have been recorded. The data is
                confidential and will be used solely for academic research purposes.
              </p>
              {submitNote && (
                <p className="mt-4 rounded-2xl bg-surface/10 px-4 py-3 text-[12px] font-semibold">
                  {submitNote}
                </p>
              )}
            </div>

            <div className="mt-4">
              <PrimaryButton onClick={resetAll} tone="neutral" disabled={submitting}>
                <RotateCcw className="h-4 w-4" strokeWidth={3} />
                Start a new session
              </PrimaryButton>
            </div>
          </div>
        </Screen>
      )}

    </>
  );
}
