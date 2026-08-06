'use client';

import { useState } from 'react';
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

  const set = <K extends keyof Demographics>(key: K, value: Demographics[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const complete =
    data.fullName.trim().length > 0 &&
    data.age !== '' &&
    data.gender !== '' &&
    data.education !== '' &&
    data.onlinePurchaseFreq !== '';

  return (
    <Screen>
      <div className="flex items-center justify-between gap-3 pt-1 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
          Step 1 of 6
        </p>
        <ThemeToggle />
      </div>
      <StepRail step={1} total={6} />

      {/* Consent card — reference style: coral fill, heavy uppercase display type */}
      <div className="card mb-6 bg-primary p-5 text-on-primary">
        <h1 className="display mb-3 text-[30px] leading-[0.9]">
          Online
          <br />
          Information
          <br />
          Search Survey
        </h1>
        <p className="text-[13px] font-medium leading-relaxed text-on-primary/75">
          All responses will remain anonymous and will be used solely for academic research
          purposes.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-2">
          <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Please fill in details to begin
          </span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (complete) onSubmit(data);
        }}
      >
        <TextField
          label="1.  Full name"
          value={data.fullName}
          onChange={(v) => set('fullName', v)}
          placeholder="Enter your full name"
        />

        <ChoiceGroup
          label="2.  Age"
          options={AGES}
          value={data.age}
          onChange={(v) => set('age', v)}
          columns={2}
        />

        <ChoiceGroup
          label="3.  Gender"
          options={GENDERS}
          value={data.gender}
          onChange={(v) => set('gender', v)}
          columns={2}
        />

        <ChoiceGroup
          label="4.  Educational level"
          options={EDUCATION}
          value={data.education}
          onChange={(v) => set('education', v)}
        />

        <ChoiceGroup
          label="5.  How often do you purchase products or services online?"
          options={FREQUENCY}
          value={data.onlinePurchaseFreq}
          onChange={(v) => set('onlinePurchaseFreq', v)}
        />

        <ActionBar>
          <PrimaryButton type="submit" disabled={!complete}>
            Proceed to videos
            <ArrowRight className="h-4 w-4" strokeWidth={3} />
          </PrimaryButton>
        </ActionBar>
      </form>
    </Screen>
  );
}
