'use client';

import { useRef, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import type {
  AgeRange,
  Demographics,
  EducationLevel,
  Gender,
  PurchaseFrequency,
} from '@/types/survey';
import {
  ActionBar,
  ChoiceGroup,
  PrimaryButton,
  Screen,
  StepRail,
  TextField,
  ThemeToggle,
} from '@/components/ui';

const AGES: readonly AgeRange[] = ['18-20', '21-24', '25-29', '30-34'];
const GENDERS: readonly Gender[] = ['Male', 'Female', 'Other'];
const EDUCATION: readonly EducationLevel[] = [
  'Higher Secondary (10+2)',
  'Diploma',
  "Undergraduate (Bachelor's degree)",
  "Postgraduate (Master's degree)",
  'Other',
];
const FREQUENCY: readonly PurchaseFrequency[] = [
  'Never',
  'Less than once a month',
  'Once a month',
  '2-3 times per month',
  '4-6 times per month',
  '7-10 times per month',
  'Very frequently (more than 10 times per month)',
];

export function DemographicsForm({
  initialData,
  onSubmit,
}: {
  initialData: Demographics;
  onSubmit: (d: Demographics) => void;
}) {
  const [data, setData] = useState<Demographics>(initialData);
  const [attempted, setAttempted] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLFieldSetElement>(null);
  const genderRef = useRef<HTMLFieldSetElement>(null);
  const educationRef = useRef<HTMLFieldSetElement>(null);
  const frequencyRef = useRef<HTMLFieldSetElement>(null);

  const set = <K extends keyof Demographics>(key: K, value: Demographics[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const complete =
    data.fullName.trim().length > 0 &&
    data.age !== '' &&
    data.gender !== '' &&
    data.education !== '' &&
    data.onlinePurchaseFreq !== '';

  const showFirstError = () => {
    setAttempted(true);
    const target = !data.fullName.trim()
      ? nameRef.current
      : !data.age
        ? ageRef.current
        : !data.gender
          ? genderRef.current
          : !data.education
            ? educationRef.current
            : frequencyRef.current;
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => target?.focus(), 350);
  };

  return (
    <Screen>
      <div className="flex items-center justify-between gap-3 pt-1 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
          Step 1 of 6
        </p>
        <ThemeToggle />
      </div>
      <StepRail step={1} total={6} />

      {/* Study notice card — coral fill, heavy uppercase display type. */}
      <div className="card mb-6 bg-primary p-5 text-on-primary">
        <h1 className="display mb-3 text-[30px] leading-[0.9]">
          Online
          <br />
          Information
          <br />
          Search Survey
        </h1>
        <p className="text-[13px] font-medium leading-relaxed text-on-primary/75">
          Responses are confidential and will be used solely for academic research. This study
          records clicks, scrolling, entered answers, searches, AI chats and page changes on this
          website for session replay. It never records your screen, camera or other websites.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-2">
          <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Session recording active
          </span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (complete) onSubmit(data);
          else showFirstError();
        }}
      >
        <TextField
          label="1.  Full name"
          value={data.fullName}
          onChange={(v) => set('fullName', v)}
          placeholder="Enter your full name"
          inputRef={nameRef}
          error={attempted && !data.fullName.trim() ? 'Please enter your full name.' : undefined}
        />

        <ChoiceGroup
          label="2.  Age"
          options={AGES}
          value={data.age}
          onChange={(v) => set('age', v)}
          columns={2}
          groupRef={ageRef}
          error={attempted && !data.age ? 'Please select your age.' : undefined}
        />

        <ChoiceGroup
          label="3.  Gender"
          options={GENDERS}
          value={data.gender}
          onChange={(v) => set('gender', v)}
          columns={2}
          groupRef={genderRef}
          error={attempted && !data.gender ? 'Please select your gender.' : undefined}
        />

        <ChoiceGroup
          label="4.  Educational level"
          options={EDUCATION}
          value={data.education}
          onChange={(v) => set('education', v)}
          groupRef={educationRef}
          error={attempted && !data.education ? 'Please select your educational level.' : undefined}
        />

        <ChoiceGroup
          label="5.  How often do you purchase products or services online?"
          options={FREQUENCY}
          value={data.onlinePurchaseFreq}
          onChange={(v) => set('onlinePurchaseFreq', v)}
          groupRef={frequencyRef}
          error={attempted && !data.onlinePurchaseFreq ? 'Please select a purchase frequency.' : undefined}
        />

        <ActionBar>
          <PrimaryButton type="submit" disabled={!complete} onDisabledClick={showFirstError}>
            Proceed to videos
            <ArrowRight className="h-4 w-4" strokeWidth={3} />
          </PrimaryButton>
        </ActionBar>
      </form>
    </Screen>
  );
}
