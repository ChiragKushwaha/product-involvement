import type {
  Channel,
  ChannelTelemetry,
  CombinedTelemetry,
  ScrollDepthCategory,
  SearchEventLog,
} from '@/types/survey';

/**
 * Behavioural measure collection for the search task.
 *
 * Indicator definitions follow the measurement PDF:
 *   SN1 result/source selection count      SN2 unique sources visited
 *   TE1 avg dwell = total dwell ÷ sources  TE2 total active search duration
 *   CT1 scroll frequency                   CT2 max scroll depth (avg, banded)
 *   QD1 reformulation frequency            QD2 new information requirements
 *
 * Durations are *active*: time while the tab is hidden is excluded from both
 * TE2 and per-source dwell.
 */

const CHANNELS: Channel[] = ['Google Search', 'Direct Website', 'Conversational AI'];

/**
 * Function words and category-generic terms are excluded so QD2 counts
 * *meaningful* new requirements rather than any unseen token.
 */
const COMMON_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with',
  'by', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'can', 'will', 'just', 'don', 'should', 'now', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'what',
  'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'its', 'it',
  'you', 'your', 'yours', 'me', 'my', 'mine', 'we', 'our', 'ours', 'they',
  'them', 'their', 'his', 'her', 'hers', 'him', 'she', 'he',
  // generic search scaffolding, not a new requirement
  'best', 'good', 'top', 'buy', 'vs', 'versus', 'review', 'reviews', 'need',
  'want', 'get', 'give', 'tell', 'show', 'find', 'look', 'please', 'thanks',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s₹]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !COMMON_STOPWORDS.has(t));
}

/** CT2 coding frame from the indicator PDF, p.5 */
export function codeScrollDepth(pct: number, hasData: boolean): ScrollDepthCategory {
  if (!hasData) return 'No scrollable content';
  if (pct >= 100) return 'Bottom reached';
  if (pct >= 76) return 'Near bottom';
  if (pct >= 51) return 'Three quarters';
  if (pct >= 26) return 'Quarter';
  return 'Top only';
}

interface SourceRecord {
  channel: Channel;
  url: string;
  /** One entry per visit, so repeat visits are preserved */
  dwellSecs: number[];
  maxDepthPct: number;
  hadScrollableContent: boolean;
  /**
   * False for AI responses: they are dwell and scroll units, but the mapping
   * table defines the AI channel's SN1/SN2 as cited/external sources opened.
   */
  countsAsSelection: boolean;
}

interface QueryRecord {
  text: string;
  channel: Channel;
  atMs: number;
  newTerms: string[];
}

export class TelemetryCollector {
  private startMs = 0;
  private started = false;

  private pausedTotalMs = 0;
  private pauseStartMs: number | null = null;

  private eventLogs: SearchEventLog[] = [];
  private sources = new Map<string, SourceRecord>();
  private queries: QueryRecord[] = [];

  /** Every open event in order, so SN1 counts repeat visits */
  private openEvents: { sourceId: string; channel: Channel; countsAsSelection: boolean }[] = [];

  private scrollCounts: Record<Channel, number> = {
    'Google Search': 0,
    'Direct Website': 0,
    'Conversational AI': 0,
  };

  private activeSource:
    | { id: string; channel: Channel; openedMs: number; pausedAtOpenMs: number }
    | null = null;

  /* -------------------------- time bookkeeping -------------------------- */

  private pausedSoFarMs(): number {
    return this.pausedTotalMs + (this.pauseStartMs !== null ? Date.now() - this.pauseStartMs : 0);
  }

  private activeElapsedSec(): number {
    if (!this.started) return 0;
    return Math.max(0, Math.round((Date.now() - this.startMs - this.pausedSoFarMs()) / 1000));
  }

  /** True while the participant is away in a real browser window. */
  private externalVisitActive = false;
  private externalVisitCount = 0;

  get isExternalVisitActive() {
    return this.externalVisitActive;
  }

  get externalVisits() {
    return this.externalVisitCount;
  }

  /**
   * The participant opened a real site in another window. Time away counts as
   * dwell on that source, so this deliberately does *not* pause the clock.
   */
  beginExternalVisit(sourceId: string, url: string, channel: Channel) {
    this.externalVisitActive = true;
    this.externalVisitCount += 1;
    this.logSourceOpen(sourceId, url, channel);
    this.eventLogs.push({
      timestamp: new Date().toISOString(),
      elapsedSec: this.activeElapsedSec(),
      channel,
      eventType: 'external_open',
      queryOrUrl: url,
    });
  }

  /** They came back. Closes the source, which records the away time as dwell. */
  endExternalVisit() {
    if (!this.externalVisitActive) return;
    const active = this.activeSource;
    this.externalVisitActive = false;
    let visit:
      | { sourceId: string; url: string; channel: Channel; durationSec: number }
      | undefined;
    if (active) {
      const url = this.sources.get(active.id)?.url ?? active.id;
      const pausedDuring = this.pausedSoFarMs() - active.pausedAtOpenMs;
      const durationSec = Math.max(
        1,
        Math.round((Date.now() - active.openedMs - pausedDuring) / 1000),
      );
      visit = { sourceId: active.id, url, channel: active.channel, durationSec };
      this.eventLogs.push({
        timestamp: new Date().toISOString(),
        elapsedSec: this.activeElapsedSec(),
        channel: active.channel,
        eventType: 'external_return',
        queryOrUrl: url,
        dwellTimeSec: durationSec,
      });
    }
    this.logSourceClose();
    return visit;
  }

  /**
   * Call when the tab is hidden — excludes the gap from active durations.
   * No-op during an external visit, where the away time is the measurement.
   */
  pause() {
    if (!this.started || this.pauseStartMs !== null) return;
    if (this.externalVisitActive) return;
    this.pauseStartMs = Date.now();
  }

  /** Call when the tab becomes visible again. */
  resume() {
    if (this.pauseStartMs === null) return;
    this.pausedTotalMs += Date.now() - this.pauseStartMs;
    this.pauseStartMs = null;
  }

  /* ------------------------------ logging ------------------------------- */

  /**
   * Idempotent: React may mount the search screen's effect more than once
   * (Strict Mode), and the initial request must be recorded exactly once or
   * QD1 is inflated.
   *
   * @param seedQuery the pre-filled query the first result page reflects —
   *   logged as the participant's initial search request, so QD1 counts only
   *   genuine reformulations after it.
   */
  startSearchTask(seedQuery?: string, channel: Channel = 'Google Search') {
    if (this.started) return;
    this.startMs = Date.now();
    this.started = true;
    this.eventLogs.push({
      timestamp: new Date().toISOString(),
      elapsedSec: 0,
      channel,
      eventType: 'task_start',
      queryOrUrl: 'Search task initiated',
    });
    if (seedQuery) this.logQuery(seedQuery, channel);
  }

  /**
   * QD1 counts every request after the first within the task; QD2 counts
   * meaningful terms not present in any earlier request.
   */
  logQuery(queryText: string, channel: Channel) {
    const text = queryText.trim();
    if (!text) return;

    const seen = new Set<string>();
    for (const q of this.queries) for (const t of tokenize(q.text)) seen.add(t);

    const newTerms = this.queries.length === 0
      ? []
      : Array.from(new Set(tokenize(text).filter((t) => !seen.has(t))));

    this.queries.push({ text, channel, atMs: Date.now(), newTerms });

    this.eventLogs.push({
      timestamp: new Date().toISOString(),
      elapsedSec: this.activeElapsedSec(),
      channel,
      eventType: channel === 'Conversational AI' ? 'prompt' : 'query',
      queryOrUrl: text,
      newTermsExtracted: newTerms,
    });
  }

  /**
   * @param countsAsSelection false for AI responses — they are dwell/scroll
   *   units but not "sources opened" for SN1/SN2 in the AI channel.
   */
  logSourceOpen(sourceId: string, url: string, channel: Channel, countsAsSelection = true) {
    if (this.activeSource) this.logSourceClose();

    if (!this.sources.has(sourceId)) {
      this.sources.set(sourceId, {
        channel,
        url,
        dwellSecs: [],
        maxDepthPct: 0,
        hadScrollableContent: false,
        countsAsSelection,
      });
    }

    this.openEvents.push({ sourceId, channel, countsAsSelection });
    this.activeSource = {
      id: sourceId,
      channel,
      openedMs: Date.now(),
      pausedAtOpenMs: this.pausedSoFarMs(),
    };

    this.eventLogs.push({
      timestamp: new Date().toISOString(),
      elapsedSec: this.activeElapsedSec(),
      channel,
      eventType: 'source_open',
      queryOrUrl: url,
    });
  }

  logSourceClose() {
    const active = this.activeSource;
    if (!active) return;

    const pausedDuring = this.pausedSoFarMs() - active.pausedAtOpenMs;
    const dwellSec = Math.max(1, Math.round((Date.now() - active.openedMs - pausedDuring) / 1000));

    this.sources.get(active.id)?.dwellSecs.push(dwellSec);

    this.eventLogs.push({
      timestamp: new Date().toISOString(),
      elapsedSec: this.activeElapsedSec(),
      channel: active.channel,
      eventType: 'source_close',
      queryOrUrl: this.sources.get(active.id)?.url ?? active.id,
      dwellTimeSec: dwellSec,
    });

    this.activeSource = null;
  }

  /**
   * Raises a source's CT2 high-water mark without counting a scroll action.
   * Used for the continuous events within a single gesture.
   */
  updateScrollDepth(sourceId: string | undefined, depthPct: number, scrollable = true) {
    const rec = sourceId ? this.sources.get(sourceId) : undefined;
    if (!rec) return;
    rec.maxDepthPct = Math.max(rec.maxDepthPct, Math.min(100, Math.round(depthPct)));
    if (scrollable) rec.hadScrollableContent = true;
  }

  /**
   * Counts one *distinct* scrolling action (CT1). Callers group the continuous
   * stream of scroll events into gestures before calling this.
   *
   * @param depthPct proportion of scrollable height reached (0-100)
   * @param scrollable false when the content fits without scrolling
   */
  logScroll(channel: Channel, depthPct: number, sourceId?: string, scrollable = true) {
    this.scrollCounts[channel] += 1;
    this.updateScrollDepth(sourceId, depthPct, scrollable);
    const rec = sourceId ? this.sources.get(sourceId) : undefined;

    this.eventLogs.push({
      timestamp: new Date().toISOString(),
      elapsedSec: this.activeElapsedSec(),
      channel,
      eventType: 'scroll',
      queryOrUrl: rec?.url,
      scrollDepthPct: Math.min(100, Math.round(depthPct)),
    });
  }

  /* ---------------------------- live readout ---------------------------- */

  /** Non-mutating snapshot for on-screen counters. */
  getLiveSnapshot() {
    return {
      sn1: this.openEvents.filter((o) => o.countsAsSelection).length,
      sn2: Array.from(this.sources.values()).filter((r) => r.countsAsSelection).length,
      te2: this.activeElapsedSec(),
      ct1: CHANNELS.reduce((sum, c) => sum + this.scrollCounts[c], 0),
      qd1: Math.max(0, this.queries.length - 1),
      qd2: this.queries.reduce((sum, q) => sum + q.newTerms.length, 0),
    };
  }

  /* ------------------------------ compile ------------------------------- */

  compileFinalTelemetry(): CombinedTelemetry {
    // Close any source still open so its dwell is counted.
    if (this.activeSource) this.logSourceClose();

    const totalActiveSec = this.activeElapsedSec();

    const build = (filter?: Channel): ChannelTelemetry => {
      const opens = filter ? this.openEvents.filter((o) => o.channel === filter) : this.openEvents;

      const entries = Array.from(this.sources.entries()).filter(
        ([, r]) => !filter || r.channel === filter,
      );

      const sn1 = opens.filter((o) => o.countsAsSelection).length;
      const sn2 = entries.filter(([, r]) => r.countsAsSelection).length;

      const totalDwellSec = entries.reduce(
        (sum, [, r]) => sum + r.dwellSecs.reduce((a, b) => a + b, 0),
        0,
      );

      // PDF formula: total dwell time across all sources ÷ number of sources visited.
      // Denominator counts every item actually examined, which for the AI
      // channel includes responses as well as cited sources.
      const te1Denominator = entries.filter(([, r]) => r.dwellSecs.length > 0).length;
      const te1 = te1Denominator > 0 ? Math.round(totalDwellSec / te1Denominator) : 0;

      const ct1 = filter
        ? this.scrollCounts[filter]
        : CHANNELS.reduce((sum, c) => sum + this.scrollCounts[c], 0);

      const scrolled = entries.filter(([, r]) => r.hadScrollableContent);
      const ct2 =
        scrolled.length > 0
          ? Math.round(scrolled.reduce((sum, [, r]) => sum + r.maxDepthPct, 0) / scrolled.length)
          : 0;

      const qs = filter ? this.queries.filter((q) => q.channel === filter) : this.queries;
      const qd1 = Math.max(0, qs.length - 1);

      // Per channel, recompute novelty within that channel's own request stream.
      let newTerms: string[];
      if (filter) {
        const seen = new Set<string>();
        const collected: string[] = [];
        qs.forEach((q, i) => {
          const toks = tokenize(q.text);
          if (i > 0) {
            for (const t of toks) {
              if (!seen.has(t)) {
                collected.push(t);
                seen.add(t);
              }
            }
          } else {
            for (const t of toks) seen.add(t);
          }
        });
        newTerms = collected;
      } else {
        newTerms = this.queries.flatMap((q) => q.newTerms);
      }

      return {
        sn1_sourceSelectionCount: sn1,
        sn2_uniqueSourcesVisited: sn2,
        te1_avgDwellTimeSec: te1,
        totalDwellSec,
        te1_denominator: te1Denominator,
        te2_totalDurationSec: totalActiveSec,
        ct1_scrollFrequency: ct1,
        ct2_maxScrollDepthPct: ct2,
        ct2_scrollDepthCategory: codeScrollDepth(ct2, scrolled.length > 0),
        qd1_queryReformulationCount: qd1,
        qd2_newTermsCount: newTerms.length,
        qd2_newTerms: newTerms,
      };
    };

    return {
      overall: build(),
      googleSearch: build('Google Search'),
      directWebsite: build('Direct Website'),
      conversationalAI: build('Conversational AI'),
      queriesSubmitted: this.queries
        .filter((q) => q.channel !== 'Conversational AI')
        .map((q) => q.text),
      promptsSubmitted: this.queries
        .filter((q) => q.channel === 'Conversational AI')
        .map((q) => q.text),
      visitedSources: Array.from(this.sources.values())
        .filter((r) => r.countsAsSelection)
        .map((r) => r.url),
      eventLogs: this.eventLogs,
    };
  }
}
