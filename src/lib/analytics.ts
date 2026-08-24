import type { ChannelTelemetry, CompleteSurveySession } from '@/types/survey';

export interface Aggregates {
  total: number;
  byInvolvement: { involvement: string; n: number; te2: number; sn2: number; qd1: number }[];
  byCategory: { category: string; n: number; te2: number; sn2: number; ct2: number }[];
  byAd: { ad: string; label: string; n: number }[];
  byChannel: { channel: string; sn1: number; sn2: number; te1: number; ct1: number; qd1: number }[];
  involvementScores: { ad: string; involvement: string; q6mean: number; intentMean: number }[];
  scrollBands: { band: string; n: number }[];
}

function average(values: number[], digits: number) {
  if (values.length === 0) return 0;
  const value = values.reduce((sum, item) => sum + item, 0) / values.length;
  return Number(value.toFixed(digits));
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const value = key(item);
    groups.set(value, [...(groups.get(value) ?? []), item]);
  }
  return groups;
}

function averageChannel(channel: string, rows: ChannelTelemetry[]) {
  return {
    channel,
    sn1: average(rows.map((row) => row.sn1_sourceSelectionCount), 2),
    sn2: average(rows.map((row) => row.sn2_uniqueSourcesVisited), 2),
    te1: average(rows.map((row) => row.te1_avgDwellTimeSec), 1),
    ct1: average(rows.map((row) => row.ct1_scrollFrequency), 1),
    qd1: average(rows.map((row) => row.qd1_queryReformulationCount), 2),
  };
}

/** Creates the dashboard model directly from Drive's master-data.json file. */
export function aggregateSessions(sessions: CompleteSurveySession[]): Aggregates {
  const byInvolvement = Array.from(groupBy(sessions, (s) => s.situation.involvement))
    .map(([involvement, rows]) => ({
      involvement,
      n: rows.length,
      te2: average(rows.map((row) => row.telemetry.overall.te2_totalDurationSec), 1),
      sn2: average(rows.map((row) => row.telemetry.overall.sn2_uniqueSourcesVisited), 2),
      qd1: average(rows.map((row) => row.telemetry.overall.qd1_queryReformulationCount), 2),
    }))
    .sort((a, b) => b.involvement.localeCompare(a.involvement));

  const byCategory = Array.from(groupBy(sessions, (s) => s.situation.category))
    .map(([category, rows]) => ({
      category,
      n: rows.length,
      te2: average(rows.map((row) => row.telemetry.overall.te2_totalDurationSec), 1),
      sn2: average(rows.map((row) => row.telemetry.overall.sn2_uniqueSourcesVisited), 2),
      ct2: average(rows.map((row) => row.telemetry.overall.ct2_maxScrollDepthPct), 1),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  const byAd = Array.from(
    groupBy(sessions, (s) => `${s.situation.code}\u0000${s.situation.siteLabel}`),
  )
    .map(([key, rows]) => {
      const [ad, label] = key.split('\u0000');
      return { ad, label, n: rows.length };
    })
    .sort((a, b) => a.ad.localeCompare(b.ad));

  const byChannel = sessions.length === 0
    ? []
    : [
        averageChannel('GOOGLE', sessions.map((s) => s.telemetry.googleSearch)),
        averageChannel('SITE', sessions.map((s) => s.telemetry.directWebsite)),
        averageChannel('AI', sessions.map((s) => s.telemetry.conversationalAI)),
      ];

  const involvementScores = sessions.map((session) => {
    const p = session.productInvolvement;
    const i = session.purchaseIntent;
    return {
      ad: session.situation.code,
      involvement: session.situation.involvement,
      q6mean: average([
        p.unimportant_important,
        p.irrelevant_relevant,
        p.meansNothing_meansLot,
        p.worthless_valuable,
        p.notNeeded_needed,
      ], 2),
      intentMean: average([
        i.q7_considerPurchasing,
        i.q8_likelihoodHigh,
        i.q9_willingnessHigh,
        i.q10_probabilityHigh,
      ], 2),
    };
  });

  const scrollBands = Array.from(
    groupBy(sessions, (s) => s.telemetry.overall.ct2_scrollDepthCategory),
  )
    .map(([band, rows]) => ({ band, n: rows.length }))
    .sort((a, b) => b.n - a.n);

  return {
    total: sessions.length,
    byInvolvement,
    byCategory,
    byAd,
    byChannel,
    involvementScores,
    scrollBands,
  };
}
