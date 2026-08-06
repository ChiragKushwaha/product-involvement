import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type { CompleteSurveySession } from '@/types/survey';

/**
 * Server-side store, backed by a single SQLite file at data/survey.db.
 *
 * Uses Node's built-in `node:sqlite`, so there is no native dependency to
 * install or rebuild. One row per participant in `sessions` (every scalar the
 * analysis needs, already flattened), plus the full interaction stream in
 * `events` for sequence analysis. The untouched JSON is kept alongside so
 * nothing is lost to the flattening.
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'survey.db');

let db: DatabaseSync | null = null;

function connect(): DatabaseSync {
  if (db) return db;
  mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(d: DatabaseSync) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id                 TEXT PRIMARY KEY,
      timestamp                  TEXT NOT NULL,
      created_at                 TEXT NOT NULL DEFAULT (datetime('now')),

      full_name                  TEXT,
      age                        TEXT,
      gender                     TEXT,
      education                  TEXT,
      online_purchase_frequency  TEXT,

      ad_code                    TEXT,
      situation_id               TEXT,
      situation_label            TEXT,
      category                   TEXT,
      category_code              TEXT,
      involvement_level          TEXT,

      stimulus_exposure_sec      INTEGER,
      rewatch_count              INTEGER,
      video_watched_sec          INTEGER,
      video_completed            INTEGER,
      live_results_used          INTEGER,
      external_visits            INTEGER,

      q1 INTEGER, q2 INTEGER, q3 INTEGER, q4 INTEGER, q5 INTEGER,
      q6_unimportant_important   INTEGER,
      q6_irrelevant_relevant     INTEGER,
      q6_means_nothing_means_lot INTEGER,
      q6_worthless_valuable      INTEGER,
      q6_not_needed_needed       INTEGER,
      q7 INTEGER, q8 INTEGER, q9 INTEGER, q10 INTEGER,

      queries_submitted          TEXT,
      prompts_submitted          TEXT,
      sources_visited            TEXT,

      raw_json                   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS metrics (
      session_id            TEXT NOT NULL,
      channel               TEXT NOT NULL,
      sn1                   INTEGER,
      sn2                   INTEGER,
      te1_avg_dwell_sec     INTEGER,
      te1_total_dwell_sec   INTEGER,
      te1_denominator       INTEGER,
      te2_total_duration_sec INTEGER,
      ct1                   INTEGER,
      ct2_pct               INTEGER,
      ct2_category          TEXT,
      qd1                   INTEGER,
      qd2                   INTEGER,
      qd2_terms             TEXT,
      PRIMARY KEY (session_id, channel),
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id    TEXT NOT NULL,
      seq           INTEGER NOT NULL,
      timestamp     TEXT,
      elapsed_sec   INTEGER,
      channel       TEXT,
      event_type    TEXT,
      query_or_url  TEXT,
      dwell_sec     INTEGER,
      scroll_depth  INTEGER,
      new_terms     TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
    CREATE INDEX IF NOT EXISTS idx_metrics_channel ON metrics(channel);
    CREATE INDEX IF NOT EXISTS idx_sessions_ad ON sessions(ad_code);
  `);
}

const CHANNEL_KEYS = [
  ['overall', 'ALL'],
  ['googleSearch', 'GOOGLE'],
  ['directWebsite', 'SITE'],
  ['conversationalAI', 'AI'],
] as const;

export function saveSession(s: CompleteSurveySession) {
  const d = connect();

  const insertSession = d.prepare(`
    INSERT OR REPLACE INTO sessions (
      session_id, timestamp,
      full_name, age, gender, education, online_purchase_frequency,
      ad_code, situation_id, situation_label, category, category_code, involvement_level,
      stimulus_exposure_sec, rewatch_count, video_watched_sec, video_completed,
      live_results_used, external_visits,
      q1,q2,q3,q4,q5,
      q6_unimportant_important, q6_irrelevant_relevant, q6_means_nothing_means_lot,
      q6_worthless_valuable, q6_not_needed_needed,
      q7,q8,q9,q10,
      queries_submitted, prompts_submitted, sources_visited, raw_json
    ) VALUES (
      ?,?, ?,?,?,?,?, ?,?,?,?,?,?, ?,?,?,?, ?,?,
      ?,?,?,?,?, ?,?,?,?,?, ?,?,?,?, ?,?,?,?
    )
  `);

  const insertMetric = d.prepare(`
    INSERT OR REPLACE INTO metrics (
      session_id, channel, sn1, sn2, te1_avg_dwell_sec, te1_total_dwell_sec,
      te1_denominator, te2_total_duration_sec, ct1, ct2_pct, ct2_category,
      qd1, qd2, qd2_terms
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const insertEvent = d.prepare(`
    INSERT INTO events (
      session_id, seq, timestamp, elapsed_sec, channel, event_type,
      query_or_url, dwell_sec, scroll_depth, new_terms
    ) VALUES (?,?,?,?,?,?,?,?,?,?)
  `);

  const deleteEvents = d.prepare('DELETE FROM events WHERE session_id = ?');
  const deleteMetrics = d.prepare('DELETE FROM metrics WHERE session_id = ?');

  d.exec('BEGIN');
  try {
    const { demographics: dem, situation: sit, adFeedback: f } = s;
    const p = s.productInvolvement;
    const i = s.purchaseIntent;

    insertSession.run(
      s.sessionId,
      s.timestamp,
      dem.fullName,
      dem.age,
      dem.gender,
      dem.education,
      dem.onlinePurchaseFreq,
      sit.code,
      sit.id,
      sit.siteLabel,
      sit.category,
      sit.categoryCode,
      sit.involvement,
      s.stimulusExposureSec,
      s.rewatchCount,
      s.videoWatchedSec ?? 0,
      s.videoCompleted ? 1 : 0,
      s.searchMode?.liveResults ? 1 : 0,
      s.searchMode?.externalVisits ?? 0,
      f.q1_familiar,
      f.q2_knowWell,
      f.q3_knowMoreThanOthers,
      f.q4_providedFacts,
      f.q5_providedPracticalInfo,
      p.unimportant_important,
      p.irrelevant_relevant,
      p.meansNothing_meansLot,
      p.worthless_valuable,
      p.notNeeded_needed,
      i.q7_considerPurchasing,
      i.q8_likelihoodHigh,
      i.q9_willingnessHigh,
      i.q10_probabilityHigh,
      s.telemetry.queriesSubmitted.join(' | '),
      s.telemetry.promptsSubmitted.join(' | '),
      s.telemetry.visitedSources.join(' | '),
      JSON.stringify(s),
    );

    deleteMetrics.run(s.sessionId);
    for (const [key, label] of CHANNEL_KEYS) {
      const t = s.telemetry[key];
      insertMetric.run(
        s.sessionId,
        label,
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
      );
    }

    deleteEvents.run(s.sessionId);
    s.telemetry.eventLogs.forEach((e, idx) => {
      insertEvent.run(
        s.sessionId,
        idx,
        e.timestamp,
        e.elapsedSec,
        e.channel,
        e.eventType,
        e.queryOrUrl ?? null,
        e.dwellTimeSec ?? null,
        e.scrollDepthPct ?? null,
        (e.newTermsExtracted ?? []).join(' ') || null,
      );
    });

    d.exec('COMMIT');
  } catch (err) {
    d.exec('ROLLBACK');
    throw err;
  }
}

export function listSessions(): CompleteSurveySession[] {
  const d = connect();
  const rows = d
    .prepare('SELECT raw_json FROM sessions ORDER BY timestamp DESC')
    .all() as { raw_json: string }[];
  return rows.map((r) => JSON.parse(r.raw_json) as CompleteSurveySession);
}

export function countSessions(): number {
  const d = connect();
  const row = d.prepare('SELECT COUNT(*) AS n FROM sessions').get() as { n: number };
  return row?.n ?? 0;
}

export function deleteSession(sessionId: string) {
  const d = connect();
  d.prepare('DELETE FROM sessions WHERE session_id = ?').run(sessionId);
}

/* ---------------------------------------------------------- aggregates */

export interface Aggregates {
  total: number;
  byInvolvement: { involvement: string; n: number; te2: number; sn2: number; qd1: number }[];
  byCategory: { category: string; n: number; te2: number; sn2: number; ct2: number }[];
  byAd: { ad: string; label: string; n: number }[];
  byChannel: { channel: string; sn1: number; sn2: number; te1: number; ct1: number; qd1: number }[];
  involvementScores: { ad: string; involvement: string; q6mean: number; intentMean: number }[];
  scrollBands: { band: string; n: number }[];
}

/** Pre-computed rollups for the dashboard, so the client ships no analysis code. */
export function aggregates(): Aggregates {
  const d = connect();
  // node:sqlite returns null-prototype rows, which cannot be handed to a
  // Client Component — copy them into plain objects first.
  const q = <T>(sql: string) => d.prepare(sql).all().map((r) => ({ ...(r as object) })) as T[];

  return {
    total: countSessions(),

    byInvolvement: q(`
      SELECT s.involvement_level AS involvement, COUNT(*) AS n,
             ROUND(AVG(m.te2_total_duration_sec),1) AS te2,
             ROUND(AVG(m.sn2),2) AS sn2,
             ROUND(AVG(m.qd1),2) AS qd1
      FROM sessions s JOIN metrics m
        ON m.session_id = s.session_id AND m.channel = 'ALL'
      GROUP BY s.involvement_level ORDER BY s.involvement_level DESC
    `),

    byCategory: q(`
      SELECT s.category AS category, COUNT(*) AS n,
             ROUND(AVG(m.te2_total_duration_sec),1) AS te2,
             ROUND(AVG(m.sn2),2) AS sn2,
             ROUND(AVG(m.ct2_pct),1) AS ct2
      FROM sessions s JOIN metrics m
        ON m.session_id = s.session_id AND m.channel = 'ALL'
      GROUP BY s.category ORDER BY s.category
    `),

    byAd: q(`
      SELECT ad_code AS ad, situation_label AS label, COUNT(*) AS n
      FROM sessions GROUP BY ad_code, situation_label ORDER BY ad_code
    `),

    byChannel: q(`
      SELECT channel,
             ROUND(AVG(sn1),2) AS sn1, ROUND(AVG(sn2),2) AS sn2,
             ROUND(AVG(te1_avg_dwell_sec),1) AS te1,
             ROUND(AVG(ct1),1) AS ct1, ROUND(AVG(qd1),2) AS qd1
      FROM metrics WHERE channel <> 'ALL' GROUP BY channel
    `),

    involvementScores: q(`
      SELECT ad_code AS ad, involvement_level AS involvement,
             ROUND((q6_unimportant_important + q6_irrelevant_relevant
                  + q6_means_nothing_means_lot + q6_worthless_valuable
                  + q6_not_needed_needed) / 5.0, 2) AS q6mean,
             ROUND((q7 + q8 + q9 + q10) / 4.0, 2) AS intentMean
      FROM sessions ORDER BY ad_code
    `),

    scrollBands: q(`
      SELECT ct2_category AS band, COUNT(*) AS n
      FROM metrics WHERE channel = 'ALL'
      GROUP BY ct2_category ORDER BY n DESC
    `),
  };
}
