import type { CompleteSurveySession } from '@/types/survey';

/**
 * On-device backup of submitted responses, so a network failure during
 * submission can never lose a participant's session.
 */

const STORAGE_KEY = 'research_survey_sessions';

export function readLocalSessions(): CompleteSurveySession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CompleteSurveySession[]) : [];
  } catch {
    return [];
  }
}

/** Prepends the session and returns the updated list. */
export function appendLocalSession(session: CompleteSurveySession): CompleteSurveySession[] {
  const updated = [session, ...readLocalSessions()];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    /* storage blocked or full — the server copy is the fallback */
  }
  return updated;
}

export function clearLocalSessions() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to do */
  }
}
