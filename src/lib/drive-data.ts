import 'server-only';

import { callDriveWebhook } from '@/lib/drive-webhook';
import type { CompleteSurveySession } from '@/types/survey';

export interface DriveMasterData {
  version: number;
  updatedAt: string;
  sessionCount: number;
  sessions: CompleteSurveySession[];
}

export async function getDriveMasterData(): Promise<DriveMasterData> {
  const result = await callDriveWebhook('master_get', {}, 60_000);
  if (!result.ok || !result.master || typeof result.master !== 'object') {
    throw new Error(result.error ?? 'Could not read master-data.json from Drive');
  }
  const master = result.master as Partial<DriveMasterData>;
  const sessions = Array.isArray(master.sessions) ? master.sessions : [];
  return {
    version: Number(master.version) || 1,
    updatedAt: typeof master.updatedAt === 'string' ? master.updatedAt : '',
    sessionCount: sessions.length,
    sessions,
  };
}

export async function listDriveSessions() {
  return (await getDriveMasterData()).sessions;
}
