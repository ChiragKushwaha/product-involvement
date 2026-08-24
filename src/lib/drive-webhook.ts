import 'server-only';

export interface DriveWebhookResult {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

/** Calls the private Apps Script receiver without exposing its token to clients. */
export async function callDriveWebhook(
  action: string,
  payload: Record<string, unknown>,
  timeoutMs = 20_000,
): Promise<DriveWebhookResult> {
  const url = process.env.SURVEY_WEBHOOK_URL;
  if (!url) return { ok: false, error: 'SURVEY_WEBHOOK_URL not configured' };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: process.env.SURVEY_WEBHOOK_TOKEN ?? '',
        action,
        ...payload,
      }),
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await response.text();
    let result: DriveWebhookResult;
    try {
      result = JSON.parse(text) as DriveWebhookResult;
    } catch {
      return { ok: false, error: `Drive receiver returned invalid JSON (${response.status})` };
    }

    if (!response.ok) {
      return { ok: false, error: result.error ?? `Drive receiver returned ${response.status}` };
    }
    return result;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Drive receiver request failed',
    };
  }
}

export function driveWebhookConfigured() {
  return Boolean(process.env.SURVEY_WEBHOOK_URL && process.env.SURVEY_WEBHOOK_TOKEN);
}
