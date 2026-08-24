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
 * Every participant gets participants/<session-id>/response.json plus a replay
 * subfolder. master-data.json contains every complete response and is the only
 * source used by the dashboard and exports. Participants never receive the
 * shared token or direct Drive access.
 */

var FOLDER_ID = '1UgFOb7H9goq2DZuxSyohLa-_VD3Am0Zs';
var SHEET_NAME = 'Survey Responses';
var PARTICIPANTS_FOLDER = 'participants';
var MASTER_FILE_NAME = 'master-data.json';
var MASTER_BACKUP_NAME = 'master-data.backup.json';
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
  return base.concat([
    'queries_submitted', 'ai_prompts_submitted', 'sources_visited',
    'replay_status', 'replay_capture_mode', 'replay_chunk_count', 'replay_event_count'
  ]);
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

  var replay = s.replay || {};
  return out.concat([
    (tel.queriesSubmitted || []).join(' | '),
    (tel.promptsSubmitted || []).join(' | '),
    (tel.visitedSources || []).join(' | '),
    replay.status || 'unavailable',
    replay.captureMode || '',
    replay.chunkCount || 0,
    replay.eventCount || 0,
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
  } else {
    // Migrate a sheet created by an older receiver by appending new columns.
    var desired = headers_();
    var current = sheet.getLastColumn();
    if (current < desired.length) {
      sheet.getRange(1, current + 1, 1, desired.length - current)
        .setValues([desired.slice(current)])
        .setFontWeight('bold');
    }
  }
  return sheet;
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function safeName_(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100);
}

function getOrCreateFolder_(parent, name) {
  var folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function studyFolder_() {
  return DriveApp.getFolderById(FOLDER_ID);
}

function participantsRoot_() {
  return getOrCreateFolder_(studyFolder_(), PARTICIPANTS_FOLDER);
}

function participantFolder_(sessionId, create) {
  var id = safeName_(sessionId);
  if (!id) throw new Error('Invalid session id');
  var root = participantsRoot_();
  var folders = root.getFoldersByName(id);
  if (folders.hasNext()) return folders.next();
  if (!create) return null;
  return root.createFolder(id);
}

function legacyReplayFolder_(sessionId) {
  var roots = studyFolder_().getFoldersByName('session-replays');
  if (!roots.hasNext()) return null;
  var folders = roots.next().getFoldersByName(safeName_(sessionId));
  return folders.hasNext() ? folders.next() : null;
}

function replayFolder_(sessionId, create) {
  var participant = participantFolder_(sessionId, create);
  if (participant) {
    var folders = participant.getFoldersByName('replay');
    if (folders.hasNext()) return folders.next();
    if (create) return participant.createFolder('replay');
  }
  return create ? null : legacyReplayFolder_(sessionId);
}

function upsertText_(folder, name, content) {
  var files = folder.getFilesByName(name);
  if (files.hasNext()) {
    files.next().setContent(content);
    while (files.hasNext()) files.next().setTrashed(true);
  } else {
    folder.createFile(name, content, MimeType.PLAIN_TEXT);
  }
}

function upsertGzipJson_(folder, name, value) {
  var files = folder.getFilesByName(name);
  while (files.hasNext()) files.next().setTrashed(true);
  var source = Utilities.newBlob(JSON.stringify(value), 'application/json', name.replace(/\.gz$/, ''));
  var zipped = Utilities.gzip(source);
  zipped.setName(name);
  folder.createFile(zipped);
}

function readJsonFile_(folder, name) {
  var files = folder.getFilesByName(name);
  if (!files.hasNext()) return null;
  return JSON.parse(files.next().getBlob().getDataAsString());
}

function readGzipJsonFile_(folder, name) {
  var files = folder.getFilesByName(name);
  if (!files.hasNext()) return null;
  return JSON.parse(Utilities.ungzip(files.next().getBlob()).getDataAsString());
}

function legacySessions_() {
  var roots = studyFolder_().getFoldersByName('raw-json');
  if (!roots.hasNext()) return [];
  var files = roots.next().getFiles();
  var sessions = [];
  while (files.hasNext()) {
    try {
      var session = JSON.parse(files.next().getBlob().getDataAsString());
      if (session && session.sessionId) sessions.push(session);
    } catch (ignored) {
      // One malformed legacy file must not hide every other response.
    }
  }
  return sessions;
}

function emptyMaster_() {
  return { version: 1, updatedAt: '', sessionCount: 0, sessions: [] };
}

function readMaster_() {
  var files = studyFolder_().getFilesByName(MASTER_FILE_NAME);
  if (files.hasNext()) {
    try {
      var master = JSON.parse(files.next().getBlob().getDataAsString());
      if (!Array.isArray(master.sessions)) master.sessions = [];
      master.sessionCount = master.sessions.length;
      return master;
    } catch (primaryError) {
      var backups = studyFolder_().getFilesByName(MASTER_BACKUP_NAME);
      if (backups.hasNext()) {
        var backup = JSON.parse(backups.next().getBlob().getDataAsString());
        if (!Array.isArray(backup.sessions)) backup.sessions = [];
        backup.sessionCount = backup.sessions.length;
        return backup;
      }
      throw primaryError;
    }
  }

  var master = emptyMaster_();
  master.sessions = legacySessions_();
  master.sessionCount = master.sessions.length;
  return master;
}

function writeMaster_(master) {
  master.version = 1;
  master.updatedAt = new Date().toISOString();
  master.sessionCount = master.sessions.length;
  var formatted = JSON.stringify(master, null, 2);
  var current = studyFolder_().getFilesByName(MASTER_FILE_NAME);
  if (current.hasNext()) {
    upsertText_(studyFolder_(), MASTER_BACKUP_NAME, current.next().getBlob().getDataAsString());
  }
  upsertText_(studyFolder_(), MASTER_FILE_NAME, formatted);
}

function upsertMasterSession_(session) {
  var master = readMaster_();
  var replaced = false;
  for (var i = 0; i < master.sessions.length; i++) {
    if (master.sessions[i].sessionId === session.sessionId) {
      master.sessions[i] = session;
      replaced = true;
      break;
    }
  }
  if (!replaced) master.sessions.push(session);
  master.sessions.sort(function (a, b) {
    return String(b.timestamp || '').localeCompare(String(a.timestamp || ''));
  });
  writeMaster_(master);
}

function updateMasterReplay_(manifest) {
  var master = readMaster_();
  var changed = false;
  for (var i = 0; i < master.sessions.length; i++) {
    if (master.sessions[i].sessionId === manifest.sessionId) {
      master.sessions[i].replay = {
        captureMode: 'event-replay',
        status: 'uploaded',
        eventCount: manifest.eventCount,
        chunkCount: manifest.chunkCount,
        startedAt: manifest.startedAt,
        completedAt: manifest.completedAt,
      };
      changed = true;
      break;
    }
  }
  if (changed) writeMaster_(master);
}

function saveParticipantResponse_(session) {
  var folder = participantFolder_(session.sessionId, true);
  upsertText_(folder, 'response.json', JSON.stringify(session, null, 2));
}

function upsertSheetRow_(session) {
  var sheet = getSheet_();
  var values = row_(session);
  var match = sheet.getRange('A:A')
    .createTextFinder(session.sessionId)
    .matchEntireCell(true)
    .findNext();
  if (match && match.getRow() > 1) {
    sheet.getRange(match.getRow(), 1, 1, values.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }
}

function padSequence_(sequence) {
  return ('000000' + Number(sequence)).slice(-6);
}

function saveReplayChunk_(payload) {
  var sessionId = safeName_(payload.sessionId);
  var tabId = safeName_(payload.tabId);
  var sequence = Number(payload.sequence);
  if (!sessionId || !tabId || !isFinite(sequence) || !Array.isArray(payload.events)) {
    throw new Error('Malformed replay chunk');
  }

  var folder = replayFolder_(sessionId, true);
  var name = 'chunk-' + tabId + '-' + padSequence_(sequence) + '.json.gz';
  upsertGzipJson_(folder, name, {
    sessionId: sessionId,
    tabId: tabId,
    sequence: sequence,
    eventCount: payload.events.length,
    events: payload.events,
  });
  return { ok: true, sessionId: sessionId, sequence: sequence, fileName: name };
}

function saveReplayManifest_(payload) {
  var sessionId = safeName_(payload.sessionId);
  if (!sessionId) throw new Error('Invalid session id');
  var manifest = {
    version: 1,
    sessionId: sessionId,
    captureMode: 'event-replay',
    status: 'complete',
    tabId: safeName_(payload.tabId),
    startedAt: payload.startedAt || '',
    completedAt: payload.completedAt || new Date().toISOString(),
    eventCount: Number(payload.eventCount) || 0,
    chunkCount: Number(payload.chunkCount) || 0,
  };
  var folder = replayFolder_(sessionId, true);
  upsertText_(folder, 'manifest.json', JSON.stringify(manifest, null, 2));
  updateMasterReplay_(manifest);
  return { ok: true, sessionId: sessionId, manifest: manifest };
}

function listReplaySessions_() {
  var folders = participantsRoot_().getFolders();
  var sessions = [];
  while (folders.hasNext()) {
    var participant = folders.next();
    var replayFolders = participant.getFoldersByName('replay');
    if (!replayFolders.hasNext()) continue;
    var manifest = readJsonFile_(replayFolders.next(), 'manifest.json');
    if (manifest) sessions.push(manifest);
  }

  // Replays created by protocol version 1 remain available after migration.
  var legacyRoots = studyFolder_().getFoldersByName('session-replays');
  if (legacyRoots.hasNext()) {
    var legacyFolders = legacyRoots.next().getFolders();
    while (legacyFolders.hasNext()) {
      var legacy = readJsonFile_(legacyFolders.next(), 'manifest.json');
      if (legacy && !sessions.some(function (item) { return item.sessionId === legacy.sessionId; })) {
        sessions.push(legacy);
      }
    }
  }
  sessions.sort(function (a, b) {
    return String(b.completedAt || '').localeCompare(String(a.completedAt || ''));
  });
  return { ok: true, sessions: sessions };
}

function replaySession_(sessionId) {
  var folder = replayFolder_(sessionId, false);
  if (!folder) return { ok: false, error: 'Replay not found' };
  var manifest = readJsonFile_(folder, 'manifest.json');
  var files = folder.getFiles();
  var chunks = [];
  while (files.hasNext()) {
    var file = files.next();
    var name = file.getName();
    if (/^chunk-[a-zA-Z0-9_-]+-[0-9]{6}\.json\.gz$/.test(name)) {
      var match = name.match(/-([0-9]{6})\.json\.gz$/);
      chunks.push({ fileName: name, sequence: match ? Number(match[1]) : 0 });
    }
  }
  chunks.sort(function (a, b) { return a.sequence - b.sequence; });
  return { ok: true, manifest: manifest, chunks: chunks };
}

function replayChunk_(sessionId, fileName) {
  var folder = replayFolder_(sessionId, false);
  var safeFile = String(fileName || '');
  if (!folder || !/^chunk-[a-zA-Z0-9_-]+-[0-9]{6}\.json\.gz$/.test(safeFile)) {
    return { ok: false, error: 'Replay chunk not found' };
  }
  var chunk = readGzipJsonFile_(folder, safeFile);
  return chunk ? { ok: true, chunk: chunk } : { ok: false, error: 'Replay chunk not found' };
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    var payload = JSON.parse(e.postData.contents);

    if (SHARED_TOKEN !== 'CHANGE_ME' && payload.token !== SHARED_TOKEN) {
      return json_({ ok: false, error: 'Unauthorised' });
    }

    var action = payload.action || 'survey';
    // Reads do not mutate Drive and should not queue behind participant writes.
    if (action === 'master_get') return json_({ ok: true, master: readMaster_() });
    if (action === 'replay_list') return json_(listReplaySessions_());
    if (action === 'replay_session') return json_(replaySession_(payload.sessionId));
    if (action === 'replay_chunk_get') {
      return json_(replayChunk_(payload.sessionId, payload.fileName));
    }

    lock.waitLock(30000);
    locked = true;

    if (action === 'replay_chunk') return json_(saveReplayChunk_(payload));
    if (action === 'replay_complete') return json_(saveReplayManifest_(payload));
    if (action !== 'survey') return json_({ ok: false, error: 'Unknown action' });

    var session = payload.session;
    saveParticipantResponse_(session);
    upsertMasterSession_(session);
    upsertSheetRow_(session);

    return json_({ ok: true, sessionId: session.sessionId });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    if (locked) lock.releaseLock();
  }
}

function doGet() {
  return json_({
    ok: true,
    service: 'survey drive receiver',
    replayVersion: 1,
    storageVersion: 2,
  });
}
