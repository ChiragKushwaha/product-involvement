import type { SearchResult } from '@/types/survey';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Live search proxy.
 *
 * Results are fetched server-side and rendered inside the app, which is what
 * makes the behavioural measures possible — scroll depth, dwell time and
 * source selection cannot be observed inside a cross-origin iframe or a real
 * browser tab.
 *
 * Set SEARCH_MODE=corpus to force the fixed built-in corpus instead, which
 * keeps the information environment identical for every participant.
 */

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function decode(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(s: string) {
  return decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

/** DuckDuckGo wraps some links as /l/?uddg=<encoded>. */
function unwrap(href: string): string {
  try {
    if (href.startsWith('//')) href = 'https:' + href;
    const u = new URL(href, 'https://duckduckgo.com');
    const target = u.searchParams.get('uddg');
    return target ? decodeURIComponent(target) : u.toString();
  } catch {
    return href;
  }
}

function parseResults(html: string, limit: number): SearchResult[] {
  const out: SearchResult[] = [];
  const blocks = html.split('class="result results_links').slice(1);

  for (const block of blocks) {
    // Sponsored blocks carry result--ad and resolve through duckduckgo's
    // click tracker. Participants should be shown organic results only.
    if (/result--ad/.test(block.slice(0, 300))) continue;

    const link = block.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!link) continue;

    const url = unwrap(decode(link[1]));
    const title = stripTags(link[2]);
    if (!title || !/^https?:/.test(url)) continue;
    if (/(^|\.)duckduckgo\.com$/.test(new URL(url).hostname)) continue;

    const snip = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
    let domain = '';
    try {
      domain = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      continue;
    }

    if (out.some((r) => r.url === url)) continue;

    out.push({
      id: `live-${out.length}-${domain}`,
      title,
      url,
      domain,
      snippet: snip ? stripTags(snip[1]) : '',
      live: true,
    });

    if (out.length >= limit) break;
  }
  return out;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  const limit = Math.min(12, Math.max(1, Number(url.searchParams.get('limit') ?? 8)));

  if (!q) return Response.json({ ok: false, error: 'Missing q' }, { status: 400 });

  if (process.env.SEARCH_MODE === 'corpus') {
    return Response.json({ ok: true, mode: 'corpus', results: [] });
  }

  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=in-en`,
      {
        headers: {
          'User-Agent': UA,
          'Accept-Language': 'en-IN,en;q=0.9',
          Accept: 'text/html',
        },
        signal: AbortSignal.timeout(12_000),
        cache: 'no-store',
      },
    );

    if (!res.ok) {
      return Response.json({ ok: true, mode: 'corpus', results: [], reason: `upstream ${res.status}` });
    }

    const results = parseResults(await res.text(), limit);
    if (results.length === 0) {
      return Response.json({ ok: true, mode: 'corpus', results: [], reason: 'no results parsed' });
    }

    return Response.json({ ok: true, mode: 'live', results });
  } catch (err) {
    // Any failure falls back to the built-in corpus rather than breaking the task.
    return Response.json({
      ok: true,
      mode: 'corpus',
      results: [],
      reason: err instanceof Error ? err.message : 'fetch failed',
    });
  }
}
