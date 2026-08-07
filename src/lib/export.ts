import type { ChannelTelemetry, CompleteSurveySession } from '@/types/survey';

/**
 * Flattens a session into one row. Column order follows the indicator PDF:
 * participant details → stimulus → Q1-Q10 → SN/TE/CT/QD per channel.
 */

const CHANNEL_KEYS = [
  ['overall', 'ALL'],
  ['googleSearch', 'GOOGLE'],
  ['directWebsite', 'SITE'],
  ['conversationalAI', 'AI'],
] as const;

const METRIC_SUFFIXES = [
  'SN1_selection_count',
  'SN2_unique_sources',
  'TE1_avg_dwell_sec',
  'TE1_total_dwell_sec',
  'TE1_denominator',
  'TE2_total_duration_sec',
  'CT1_scroll_frequency',
  'CT2_max_scroll_depth_pct',
  'CT2_depth_category',
  'QD1_reformulations',
  'QD2_new_requirements',
  'QD2_terms',
] as const;

function metricValues(t: ChannelTelemetry): (string | number)[] {
  return [
    t.sn1_sourceSelectionCount,
    t.sn2_uniqueSourcesVisited,
    t.te1_avgDwellTimeSec,
    t.totalDwellSec,
    t.te1_denominator,
    t.te2_totalDurationSec,
    t.ct1_scrollFrequency,
    t.ct2_maxScrollDepthPct,
    t.ct2_scrollDepthCategory,
    t.qd1_queryReformulationCount,
    t.qd2_newTermsCount,
    t.qd2_newTerms.join(' | '),
  ];
}

export function csvHeaders(): string[] {
  const base = [
    'session_id',
    'timestamp',
    'full_name',
    'age',
    'gender',
    'education',
    'online_purchase_frequency',
    'ad_code',
    'situation_label',
    'category',
    'category_code',
    'involvement_level',
    'stimulus_exposure_sec',
    'rewatch_count',
    'video_watched_sec',
    'video_completed',
    'live_results_used',
    'external_visits',
    'Q1_familiar',
    'Q2_know_well',
    'Q3_know_more_than_others',
    'Q4_ad_provided_facts',
    'Q5_ad_provided_practical_info',
    'Q6_unimportant_important',
    'Q6_irrelevant_relevant',
    'Q6_means_nothing_means_lot',
    'Q6_worthless_valuable',
    'Q6_not_needed_needed',
    'Q7_would_consider',
    'Q8_likelihood_high',
    'Q9_willingness_high',
    'Q10_probability_high',
  ];

  const metrics = CHANNEL_KEYS.flatMap(([, prefix]) =>
    METRIC_SUFFIXES.map((suffix) => `${prefix}_${suffix}`),
  );

  return [
    ...base,
    ...metrics,
    'queries_submitted',
    'ai_prompts_submitted',
    'sources_visited',
    'event_log_json',
  ];
}

export function csvRow(s: CompleteSurveySession): (string | number)[] {
  const base: (string | number)[] = [
    s.sessionId,
    s.timestamp,
    s.demographics.fullName,
    s.demographics.age,
    s.demographics.gender,
    s.demographics.education,
    s.demographics.onlinePurchaseFreq,
    s.situation.code,
    s.situation.siteLabel,
    s.situation.category,
    s.situation.categoryCode,
    s.situation.involvement,
    s.stimulusExposureSec,
    s.rewatchCount,
    s.videoWatchedSec ?? 0,
    s.videoCompleted ? 1 : 0,
    s.searchMode?.liveResults ? 1 : 0,
    s.searchMode?.externalVisits ?? 0,
    s.adFeedback.q1_familiar,
    s.adFeedback.q2_knowWell,
    s.adFeedback.q3_knowMoreThanOthers,
    s.adFeedback.q4_providedFacts,
    s.adFeedback.q5_providedPracticalInfo,
    s.productInvolvement.unimportant_important,
    s.productInvolvement.irrelevant_relevant,
    s.productInvolvement.meansNothing_meansLot,
    s.productInvolvement.worthless_valuable,
    s.productInvolvement.notNeeded_needed,
    s.purchaseIntent.q7_considerPurchasing,
    s.purchaseIntent.q8_likelihoodHigh,
    s.purchaseIntent.q9_willingnessHigh,
    s.purchaseIntent.q10_probabilityHigh,
  ];

  const metrics = CHANNEL_KEYS.flatMap(([key]) => metricValues(s.telemetry[key]));

  return [
    ...base,
    ...metrics,
    s.telemetry.queriesSubmitted.join(' | '),
    s.telemetry.promptsSubmitted.join(' | '),
    s.telemetry.visitedSources.join(' | '),
    JSON.stringify(s.telemetry.eventLogs),
  ];
}

function escapeCell(v: string | number): string {
  const str = String(v ?? '');
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function toCsv(sessions: CompleteSurveySession[]): string {
  const lines = [csvHeaders().join(',')];
  for (const s of sessions) lines.push(csvRow(s).map(escapeCell).join(','));
  // BOM so Excel opens the ₹ symbol and names correctly
  return '﻿' + lines.join('\r\n');
}

/** Long-format event log, one row per interaction — for sequence analysis. */
export function eventLogCsv(sessions: CompleteSurveySession[]): string {
  const header = [
    'session_id',
    'ad_code',
    'category',
    'involvement_level',
    'timestamp',
    'elapsed_sec',
    'channel',
    'event_type',
    'query_or_url',
    'dwell_sec',
    'scroll_depth_pct',
    'new_terms',
  ];
  const lines = [header.join(',')];

  for (const s of sessions) {
    for (const e of s.telemetry.eventLogs) {
      lines.push(
        [
          s.sessionId,
          s.situation.code,
          s.situation.category,
          s.situation.involvement,
          e.timestamp,
          e.elapsedSec,
          e.channel,
          e.eventType,
          e.queryOrUrl ?? '',
          e.dwellTimeSec ?? '',
          e.scrollDepthPct ?? '',
          (e.newTermsExtracted ?? []).join(' '),
        ]
          .map(escapeCell)
          .join(','),
      );
    }
  }

  return '﻿' + lines.join('\r\n');
}

export function downloadFile(filename: string, content: string, type = 'text/csv') {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
