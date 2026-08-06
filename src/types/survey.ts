/* ------------------------------------------------------------------
   Screen 1 — participant details (PDF flow, p.1)
------------------------------------------------------------------ */

export type AgeRange = '18-20' | '21-24' | '25-29' | '30-34';
export type Gender = 'Male' | 'Female' | 'Other';

export type EducationLevel =
  | 'Higher Secondary (10+2)'
  | 'Diploma'
  | "Undergraduate (Bachelor's degree)"
  | "Postgraduate (Master's degree)"
  | 'Other';

export type PurchaseFrequency =
  | 'Never'
  | 'Less than once a month'
  | 'Once a month'
  | '2-3 times per month'
  | '4-6 times per month'
  | '7-10 times per month'
  | 'Very frequently (more than 10 times per month)';

export interface Demographics {
  fullName: string;
  age: AgeRange | '';
  gender: Gender | '';
  education: EducationLevel | '';
  onlinePurchaseFreq: PurchaseFrequency | '';
}

/* ------------------------------------------------------------------
   Stimulus — the 8 search situations published on the study site
------------------------------------------------------------------ */

export type InvolvementLevel = 'high' | 'low';
export type CategoryCode = 'L' | 'F' | 'H' | 'D';
export type AccentName =
  | 'peri'
  | 'sky'
  | 'sage'
  | 'butter'
  | 'lilac'
  | 'mint'
  | 'blush'
  | 'slate';

export type Channel = 'Google Search' | 'Direct Website' | 'Conversational AI';

export interface Platform {
  id: string;
  name: string;
  domain: string;
  tint: AccentName;
}

export interface Situation {
  id: string;
  /** "Ad 1" … "Ad 8" — the labels used in the flow PDF */
  code: string;
  number: number;
  /** Slug of the source page on sites.google.com/view/research-on-search */
  siteSlug: string;
  /** e.g. "Search Situation (h)L" */
  siteLabel: string;
  involvement: InvolvementLevel;
  categoryCode: CategoryCode;
  /** e.g. "Laptop" */
  category: string;
  /** Short card title */
  headline: string;
  /** The lead-in line used on the source page */
  prompt: string;
  /** Introductory text, verbatim from the source page */
  scenario: string;
  accent: AccentName;
  platforms: Platform[];
  /**
   * Advertisement video. Drop a real file at this path to use it; otherwise
   * the player renders the generated motion ad built from `adScript`.
   */
  videoSrc: string;
  /**
   * WebVTT captions for the advertisement (WCAG 1.2.2). Set this once a
   * caption file exists — e.g. '/ads/ad-1.vtt'. Left undefined, no caption
   * track is requested.
   */
  captionsSrc?: string;
  /** Copy for the generated motion ad, and the ad's spoken-style tagline. */
  adScript: { tagline: string; beats: string[] };
}

/* ------------------------------------------------------------------
   Simulated information environment (search corpus per category)
------------------------------------------------------------------ */

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  /**
   * Body shown once the participant opens the source. Absent for live results,
   * whose text is fetched on demand through the reader endpoint.
   */
  body?: string[];
  /** True when the result came from the live search proxy rather than the corpus. */
  live?: boolean;
}

export interface ListingItem {
  id: string;
  name: string;
  price: string;
  meta: string;
  rating: number;
  ratingCount: string;
  highlights: string[];
  detail: string[];
}

/* ------------------------------------------------------------------
   Screens 3-4 — ad feedback + product involvement (PDF flow, p.2-3)
------------------------------------------------------------------ */

export interface AdFeedback {
  q1_familiar: number;
  q2_knowWell: number;
  q3_knowMoreThanOthers: number;
  q4_providedFacts: number;
  q5_providedPracticalInfo: number;
}

export interface SemanticDifferential {
  unimportant_important: number;
  irrelevant_relevant: number;
  meansNothing_meansLot: number;
  worthless_valuable: number;
  notNeeded_needed: number;
}

/* ------------------------------------------------------------------
   Screen 6 — purchase intention (PDF flow, p.3)
------------------------------------------------------------------ */

export interface PurchaseIntent {
  q7_considerPurchasing: number;
  q8_likelihoodHigh: number;
  q9_willingnessHigh: number;
  q10_probabilityHigh: number;
}

/* ------------------------------------------------------------------
   Behavioural measures — the indicator PDF (SN / TE / CT / QD)
------------------------------------------------------------------ */

/** CT2 coding frame from the indicator PDF, p.5 */
export type ScrollDepthCategory =
  | 'Top only'
  | 'Quarter'
  | 'Three quarters'
  | 'Near bottom'
  | 'Bottom reached'
  | 'No scrollable content';

export interface ChannelTelemetry {
  /** SN1 — result/source selection count (repeat visits included) */
  sn1_sourceSelectionCount: number;
  /** SN2 — unique sources visited */
  sn2_uniqueSourcesVisited: number;
  /** TE1 — average source/response dwell time (s) = total dwell ÷ items examined */
  te1_avgDwellTimeSec: number;
  /** Raw numerator for TE1, so the ratio can be recomputed downstream */
  totalDwellSec: number;
  /**
   * TE1 denominator — distinct items examined. Equals SN2 for the search and
   * website channels; for the AI channel it also includes AI responses, which
   * are dwell units but are not "sources opened" under the SN1/SN2 definition.
   */
  te1_denominator: number;
  /** TE2 — total active search duration (s) */
  te2_totalDurationSec: number;
  /** CT1 — scroll frequency */
  ct1_scrollFrequency: number;
  /** CT2 — average of per-source maximum scroll depth (%) */
  ct2_maxScrollDepthPct: number;
  /** CT2 coded into the PDF's 5-band frame */
  ct2_scrollDepthCategory: ScrollDepthCategory;
  /** QD1 — search request reformulation frequency */
  qd1_queryReformulationCount: number;
  /** QD2 — new information requirements introduced */
  qd2_newTermsCount: number;
  /** The actual new terms behind QD2, for coder verification */
  qd2_newTerms: string[];
}

export interface SearchEventLog {
  timestamp: string;
  elapsedSec: number;
  channel: Channel;
  eventType:
    | 'task_start'
    | 'query'
    | 'prompt'
    | 'source_open'
    | 'source_close'
    | 'scroll'
    | 'external_open'
    | 'external_return';
  queryOrUrl?: string;
  dwellTimeSec?: number;
  scrollDepthPct?: number;
  newTermsExtracted?: string[];
}

export interface CombinedTelemetry {
  overall: ChannelTelemetry;
  googleSearch: ChannelTelemetry;
  directWebsite: ChannelTelemetry;
  conversationalAI: ChannelTelemetry;
  queriesSubmitted: string[];
  promptsSubmitted: string[];
  visitedSources: string[];
  eventLogs: SearchEventLog[];
}

/* ------------------------------------------------------------------
   One complete participant record
------------------------------------------------------------------ */

export interface CompleteSurveySession {
  sessionId: string;
  timestamp: string;
  demographics: Demographics;
  situation: Situation;
  adFeedback: AdFeedback;
  productInvolvement: SemanticDifferential;
  telemetry: CombinedTelemetry;
  purchaseIntent: PurchaseIntent;
  /** Seconds spent on the stimulus screen, incl. rewatches */
  stimulusExposureSec: number;
  rewatchCount: number;
  /** Seconds of advertisement actually played */
  videoWatchedSec: number;
  /** Whether the advertisement was played through to the end at least once */
  videoCompleted: boolean;
  /** Which search modes the participant used */
  searchMode: { liveResults: boolean; externalVisits: number };
}
