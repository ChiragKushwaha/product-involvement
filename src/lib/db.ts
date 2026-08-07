import { createClient, type Client, type InStatement } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type { CompleteSurveySession } from '@/types/survey';

/**
 * Local development uses a file-backed SQLite database. Production uses the
 * connected Turso database, whose storage is durable across Vercel functions
 * and deployments. Set USE_TURSO_IN_DEVELOPMENT=true only when intentionally
 * testing against the production-style remote database.
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const USE_REMOTE = IS_PRODUCTION || process.env.USE_TURSO_IN_DEVELOPMENT === 'true';
const TURSO_DATABASE_URL =
  process.env.TURSO_DATABASE_URL ?? process.env.r3s3arch_TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN =
  process.env.TURSO_AUTH_TOKEN ?? process.env.r3s3arch_TURSO_AUTH_TOKEN;

const LOCAL_DB_PATH = process.env.SURVEY_DB_PATH
  ? path.resolve(process.env.SURVEY_DB_PATH)
  : path.join(process.cwd(), 'data', 'survey.db');

let client: Client | null = null;
let migration: Promise<void> | null = null;

function connect(): Client {
  if (client) return client;

  if (USE_REMOTE) {
    if (!TURSO_DATABASE_URL) {
      throw new Error(
        'Production database is not configured. Set TURSO_DATABASE_URL (or the connected r3s3arch_TURSO_DATABASE_URL).',
      );
    }
    client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });
  } else {
    mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
    client = createClient({ url: `file:${LOCAL_DB_PATH}` });
  }

  return client;
}

const SCHEMA: InStatement[] = [
  `CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    full_name TEXT, age TEXT, gender TEXT, education TEXT, online_purchase_frequency TEXT,
    ad_code TEXT, situation_id TEXT, situation_label TEXT, category TEXT,
    category_code TEXT, involvement_level TEXT,
    stimulus_exposure_sec INTEGER, rewatch_count INTEGER, video_watched_sec INTEGER,
    video_completed INTEGER, live_results_used INTEGER, external_visits INTEGER,
    q1 INTEGER, q2 INTEGER, q3 INTEGER, q4 INTEGER, q5 INTEGER,
    q6_unimportant_important INTEGER, q6_irrelevant_relevant INTEGER,
    q6_means_nothing_means_lot INTEGER, q6_worthless_valuable INTEGER,
    q6_not_needed_needed INTEGER, q7 INTEGER, q8 INTEGER, q9 INTEGER, q10 INTEGER,
    queries_submitted TEXT, prompts_submitted TEXT, sources_visited TEXT,
    raw_json TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS metrics (
    session_id TEXT NOT NULL, channel TEXT NOT NULL,
    sn1 INTEGER, sn2 INTEGER, te1_avg_dwell_sec INTEGER, te1_total_dwell_sec INTEGER,
    te1_denominator INTEGER, te2_total_duration_sec INTEGER, ct1 INTEGER,
    ct2_pct INTEGER, ct2_category TEXT, qd1 INTEGER, qd2 INTEGER, qd2_terms TEXT,
    PRIMARY KEY (session_id, channel),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, seq INTEGER NOT NULL,
    timestamp TEXT, elapsed_sec INTEGER, channel TEXT, event_type TEXT,
    query_or_url TEXT, dwell_sec INTEGER, scroll_depth INTEGER, new_terms TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
  )`,
  'CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id)',
  'CREATE INDEX IF NOT EXISTS idx_metrics_channel ON metrics(channel)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_ad ON sessions(ad_code)',
];

async function database(): Promise<Client> {
  const db = connect();
  migration ??= db.batch(SCHEMA, 'write').then(() => undefined);
  await migration;
  return db;
}

const CHANNEL_KEYS = [
  ['overall', 'ALL'],
  ['googleSearch', 'GOOGLE'],
  ['directWebsite', 'SITE'],
  ['conversationalAI', 'AI'],
] as const;

export async function saveSession(s: CompleteSurveySession) {
  const db = await database();
  const { demographics: dem, situation: sit, adFeedback: f } = s;
  const p = s.productInvolvement;
  const i = s.purchaseIntent;

  const statements: InStatement[] = [
    {
      sql: `INSERT OR REPLACE INTO sessions (
        session_id, timestamp, full_name, age, gender, education, online_purchase_frequency,
        ad_code, situation_id, situation_label, category, category_code, involvement_level,
        stimulus_exposure_sec, rewatch_count, video_watched_sec, video_completed,
        live_results_used, external_visits, q1,q2,q3,q4,q5,
        q6_unimportant_important, q6_irrelevant_relevant, q6_means_nothing_means_lot,
        q6_worthless_valuable, q6_not_needed_needed, q7,q8,q9,q10,
        queries_submitted, prompts_submitted, sources_visited, raw_json
      ) VALUES (
        ?,?, ?,?,?,?,?, ?,?,?,?,?,?, ?,?,?,?, ?,?,
        ?,?,?,?,?, ?,?,?,?,?, ?,?,?,?, ?,?,?,?
      )`,
      args: [
        s.sessionId, s.timestamp, dem.fullName ?? null, dem.age ?? null, dem.gender ?? null,
        dem.education ?? null, dem.onlinePurchaseFreq ?? null, sit.code, sit.id, sit.siteLabel,
        sit.category, sit.categoryCode, sit.involvement, s.stimulusExposureSec, s.rewatchCount,
        s.videoWatchedSec ?? 0, s.videoCompleted ? 1 : 0, s.searchMode?.liveResults ? 1 : 0,
        s.searchMode?.externalVisits ?? 0, f.q1_familiar, f.q2_knowWell,
        f.q3_knowMoreThanOthers, f.q4_providedFacts, f.q5_providedPracticalInfo,
        p.unimportant_important, p.irrelevant_relevant, p.meansNothing_meansLot,
        p.worthless_valuable, p.notNeeded_needed, i.q7_considerPurchasing,
        i.q8_likelihoodHigh, i.q9_willingnessHigh, i.q10_probabilityHigh,
        s.telemetry.queriesSubmitted.join(' | '), s.telemetry.promptsSubmitted.join(' | '),
        s.telemetry.visitedSources.join(' | '), JSON.stringify(s),
      ],
    },
    { sql: 'DELETE FROM metrics WHERE session_id = ?', args: [s.sessionId] },
    { sql: 'DELETE FROM events WHERE session_id = ?', args: [s.sessionId] },
  ];

  for (const [key, label] of CHANNEL_KEYS) {
    const t = s.telemetry[key];
    statements.push({
      sql: `INSERT INTO metrics (
        session_id, channel, sn1, sn2, te1_avg_dwell_sec, te1_total_dwell_sec,
        te1_denominator, te2_total_duration_sec, ct1, ct2_pct, ct2_category,
        qd1, qd2, qd2_terms
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        s.sessionId, label, t.sn1_sourceSelectionCount, t.sn2_uniqueSourcesVisited,
        t.te1_avgDwellTimeSec, t.totalDwellSec, t.te1_denominator, t.te2_totalDurationSec,
        t.ct1_scrollFrequency, t.ct2_maxScrollDepthPct, t.ct2_scrollDepthCategory,
        t.qd1_queryReformulationCount, t.qd2_newTermsCount, t.qd2_newTerms.join(' | '),
      ],
    });
  }

  s.telemetry.eventLogs.forEach((event, seq) => {
    statements.push({
      sql: `INSERT INTO events (
        session_id, seq, timestamp, elapsed_sec, channel, event_type,
        query_or_url, dwell_sec, scroll_depth, new_terms
      ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      args: [
        s.sessionId, seq, event.timestamp, event.elapsedSec, event.channel, event.eventType,
        event.queryOrUrl ?? null, event.dwellTimeSec ?? null, event.scrollDepthPct ?? null,
        (event.newTermsExtracted ?? []).join(' ') || null,
      ],
    });
  });

  await db.batch(statements, 'write');
}

export async function listSessions(): Promise<CompleteSurveySession[]> {
  const db = await database();
  const result = await db.execute('SELECT raw_json FROM sessions ORDER BY timestamp DESC');
  return result.rows.map((row) => JSON.parse(String(row.raw_json)) as CompleteSurveySession);
}

export async function countSessions(): Promise<number> {
  const db = await database();
  const result = await db.execute('SELECT COUNT(*) AS n FROM sessions');
  return Number(result.rows[0]?.n ?? 0);
}

export async function deleteSession(sessionId: string) {
  const db = await database();
  await db.execute({ sql: 'DELETE FROM sessions WHERE session_id = ?', args: [sessionId] });
}

export interface Aggregates {
  total: number;
  byInvolvement: { involvement: string; n: number; te2: number; sn2: number; qd1: number }[];
  byCategory: { category: string; n: number; te2: number; sn2: number; ct2: number }[];
  byAd: { ad: string; label: string; n: number }[];
  byChannel: { channel: string; sn1: number; sn2: number; te1: number; ct1: number; qd1: number }[];
  involvementScores: { ad: string; involvement: string; q6mean: number; intentMean: number }[];
  scrollBands: { band: string; n: number }[];
}

/** Fresh server-side rollups for the researcher dashboard. */
export async function aggregates(): Promise<Aggregates> {
  const db = await database();
  const queries = [
    `SELECT s.involvement_level AS involvement, COUNT(*) AS n,
       ROUND(AVG(m.te2_total_duration_sec),1) AS te2, ROUND(AVG(m.sn2),2) AS sn2,
       ROUND(AVG(m.qd1),2) AS qd1 FROM sessions s JOIN metrics m
       ON m.session_id=s.session_id AND m.channel='ALL'
       GROUP BY s.involvement_level ORDER BY s.involvement_level DESC`,
    `SELECT s.category AS category, COUNT(*) AS n,
       ROUND(AVG(m.te2_total_duration_sec),1) AS te2, ROUND(AVG(m.sn2),2) AS sn2,
       ROUND(AVG(m.ct2_pct),1) AS ct2 FROM sessions s JOIN metrics m
       ON m.session_id=s.session_id AND m.channel='ALL'
       GROUP BY s.category ORDER BY s.category`,
    `SELECT ad_code AS ad, situation_label AS label, COUNT(*) AS n
       FROM sessions GROUP BY ad_code, situation_label ORDER BY ad_code`,
    `SELECT channel, ROUND(AVG(sn1),2) AS sn1, ROUND(AVG(sn2),2) AS sn2,
       ROUND(AVG(te1_avg_dwell_sec),1) AS te1, ROUND(AVG(ct1),1) AS ct1,
       ROUND(AVG(qd1),2) AS qd1 FROM metrics WHERE channel <> 'ALL' GROUP BY channel`,
    `SELECT ad_code AS ad, involvement_level AS involvement,
       ROUND((q6_unimportant_important+q6_irrelevant_relevant+q6_means_nothing_means_lot+
       q6_worthless_valuable+q6_not_needed_needed)/5.0,2) AS q6mean,
       ROUND((q7+q8+q9+q10)/4.0,2) AS intentMean FROM sessions ORDER BY ad_code`,
    `SELECT ct2_category AS band, COUNT(*) AS n FROM metrics WHERE channel='ALL'
       GROUP BY ct2_category ORDER BY n DESC`,
  ];

  const [count, ...results] = await Promise.all([
    countSessions(),
    ...queries.map((sql) => db.execute(sql)),
  ]);
  const rows = <T>(index: number) => results[index].rows.map((row) => ({ ...row })) as T[];

  return {
    total: count,
    byInvolvement: rows<Aggregates['byInvolvement'][number]>(0),
    byCategory: rows<Aggregates['byCategory'][number]>(1),
    byAd: rows<Aggregates['byAd'][number]>(2),
    byChannel: rows<Aggregates['byChannel'][number]>(3),
    involvementScores: rows<Aggregates['involvementScores'][number]>(4),
    scrollBands: rows<Aggregates['scrollBands'][number]>(5),
  };
}
