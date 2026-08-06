/**
 * Google Apps Script receiver — writes survey responses into the study's
 * Drive folder.
 *
 * DEPLOY
 *  1. script.google.com → New project → paste this file.
 *  2. Set SHARED_TOKEN below to a secret of your choice.
 *  3. Deploy → New deployment → type "Web app".
 *       Execute as:      Me
 *       Who has access:  Anyone
 *  4. Copy the /exec URL into the app's .env.local:
 *       SURVEY_WEBHOOK_URL=https://script.google.com/macros/s/…/exec
 *       SURVEY_WEBHOOK_TOKEN=<the same secret>
 *
 * On each submission this appends a row to "Survey Responses" and drops the
 * raw JSON into a "raw-json" subfolder, both inside FOLDER_ID.
 */

var FOLDER_ID = '1UgFOb7H9goq2DZuxSyohLa-_VD3Am0Zs';
var SHEET_NAME = 'Survey Responses';
var SHARED_TOKEN = 'CHANGE_ME';

var CHANNELS = [
  ['overall', 'ALL'],
  ['googleSearch', 'GOOGLE'],
  ['directWebsite', 'SITE'],
  ['conversationalAI', 'AI'],
];

var METRIC_SUFFIXES = [
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
];

function headers_() {
  var base = [
    'session_id', 'timestamp', 'full_name', 'age', 'gender', 'education',
    'online_purchase_frequency', 'ad_code', 'situation_label', 'category',
    'category_code', 'involvement_level', 'stimulus_exposure_sec', 'rewatch_count',
    'Q1_familiar', 'Q2_know_well', 'Q3_know_more_than_others',
    'Q4_ad_provided_facts', 'Q5_ad_provided_practical_info',
    'Q6_unimportant_important', 'Q6_irrelevant_relevant',
    'Q6_means_nothing_means_lot', 'Q6_worthless_valuable', 'Q6_not_needed_needed',
    'Q7_would_consider', 'Q8_likelihood_high', 'Q9_willingness_high',
    'Q10_probability_high',
  ];
  CHANNELS.forEach(function (c) {
    METRIC_SUFFIXES.forEach(function (s) { base.push(c[1] + '_' + s); });
  });
  return base.concat(['queries_submitted', 'ai_prompts_submitted', 'sources_visited']);
}

function metricValues_(t) {
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
    (t.qd2_newTerms || []).join(' | '),
  ];
}

function row_(s) {
  var d = s.demographics, f = s.adFeedback, p = s.productInvolvement,
      i = s.purchaseIntent, sit = s.situation, tel = s.telemetry;

  var out = [
    s.sessionId, s.timestamp, d.fullName, d.age, d.gender, d.education,
    d.onlinePurchaseFreq, sit.code, sit.siteLabel, sit.category,
    sit.categoryCode, sit.involvement, s.stimulusExposureSec, s.rewatchCount,
    f.q1_familiar, f.q2_knowWell, f.q3_knowMoreThanOthers,
    f.q4_providedFacts, f.q5_providedPracticalInfo,
    p.unimportant_important, p.irrelevant_relevant, p.meansNothing_meansLot,
    p.worthless_valuable, p.notNeeded_needed,
    i.q7_considerPurchasing, i.q8_likelihoodHigh, i.q9_willingnessHigh,
    i.q10_probabilityHigh,
  ];

  CHANNELS.forEach(function (c) {
    out = out.concat(metricValues_(tel[c[0]]));
  });

  return out.concat([
    (tel.queriesSubmitted || []).join(' | '),
    (tel.promptsSubmitted || []).join(' | '),
    (tel.visitedSources || []).join(' | '),
  ]);
}

function getSheet_() {
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var files = folder.getFilesByName(SHEET_NAME);
  var ss;

  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    ss = SpreadsheetApp.create(SHEET_NAME);
    var file = DriveApp.getFileById(ss.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
  }

  var sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    var h = headers_();
    sheet.appendRow(h);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, h.length).setFontWeight('bold');
  }
  return sheet;
}

function saveRawJson_(session) {
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var subs = folder.getFoldersByName('raw-json');
  var sub = subs.hasNext() ? subs.next() : folder.createFolder('raw-json');
  sub.createFile(
    session.sessionId + '.json',
    JSON.stringify(session, null, 2),
    MimeType.PLAIN_TEXT
  );
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    var payload = JSON.parse(e.postData.contents);

    if (SHARED_TOKEN !== 'CHANGE_ME' && payload.token !== SHARED_TOKEN) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Unauthorised' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var session = payload.session;
    getSheet_().appendRow(row_(session));
    saveRawJson_(session);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, sessionId: session.sessionId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'survey drive receiver' }))
    .setMimeType(ContentService.MimeType.JSON);
}
