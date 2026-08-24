export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GoogleSearchItem {
  cacheId?: string;
  title?: string;
  link?: string;
  displayLink?: string;
  snippet?: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
  queries?: { nextPage?: unknown[] };
  error?: { message?: string };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') ?? '').trim().slice(0, 200);
  const page = Math.min(10, Math.max(1, Number(url.searchParams.get('page')) || 1));
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get('limit')) || 8));
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID ?? '125890caa9c4b4550';

  if (!query) {
    return Response.json({ ok: false, mode: 'unavailable', error: 'A search query is required.' }, { status: 400 });
  }
  if (!apiKey) {
    return Response.json(
      { ok: false, mode: 'unavailable', error: 'Live Google Search is not configured.' },
      { status: 503 },
    );
  }

  const start = (page - 1) * limit + 1;
  const endpoint = new URL('https://customsearch.googleapis.com/customsearch/v1');
  endpoint.searchParams.set('key', apiKey);
  endpoint.searchParams.set('cx', engineId);
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('num', String(limit));
  endpoint.searchParams.set('start', String(start));
  endpoint.searchParams.set('safe', 'active');

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12_000),
      cache: 'no-store',
    });
    const data = (await response.json()) as GoogleSearchResponse;
    if (!response.ok) {
      return Response.json(
        { ok: false, mode: 'unavailable', error: data.error?.message ?? `Google returned ${response.status}.` },
        { status: 502 },
      );
    }

    const results = (data.items ?? []).flatMap((item, index) => {
      if (!item.link || !item.title) return [];
      let domain = item.displayLink ?? '';
      try {
        domain = new URL(item.link).hostname.replace(/^www\./, '');
      } catch {
        // Retain Google's displayLink when a result URL cannot be parsed.
      }
      return [{
        id: `google-${start + index}-${item.cacheId ?? index}`,
        title: item.title,
        url: item.link,
        domain,
        snippet: item.snippet ?? '',
        live: true,
      }];
    });

    return Response.json({
      ok: true,
      mode: 'live',
      results,
      hasNext: Boolean(data.queries?.nextPage?.length),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        mode: 'unavailable',
        error: error instanceof Error ? error.message : 'Could not reach Google Search.',
      },
      { status: 502 },
    );
  }
}
