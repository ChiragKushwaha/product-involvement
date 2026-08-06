import { lookup } from 'node:dns/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Fetches a page server-side and returns its readable text, so a real source
 * can be opened *inside* the app with scroll depth and dwell time observable.
 *
 * Only ever returns extracted text — never HTML, scripts or styles — so
 * nothing from the remote page can execute in the participant's browser.
 */

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const MAX_BYTES = 2_500_000;

/** Blocks loopback, link-local, and RFC1918 space so this can't be used to probe the host network. */
function isPrivateAddress(ip: string, family: number): boolean {
  if (family === 6) {
    const v = ip.toLowerCase();
    if (v === '::1' || v === '::') return true;
    if (v.startsWith('fc') || v.startsWith('fd')) return true; // unique local
    if (v.startsWith('fe80')) return true; // link local
    // IPv4-mapped, e.g. ::ffff:127.0.0.1
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1], 4);
    return false;
  }

  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

async function assertPublicUrl(raw: string): Promise<URL> {
  const u = new URL(raw);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Only http and https are supported');
  }
  const addrs = await lookup(u.hostname, { all: true });
  if (addrs.length === 0) throw new Error('Host did not resolve');
  for (const a of addrs) {
    if (isPrivateAddress(a.address, a.family)) throw new Error('Host is not publicly routable');
  }
  return u;
}

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

/** Pulls headings, paragraphs and list items out in document order. */
function extract(html: string): { title: string; paragraphs: string[] } {
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|iframe|form|nav|footer|header|aside)\b[\s\S]*?<\/\1>/gi, ' ');

  const titleMatch = cleaned.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decode(titleMatch[1]).replace(/\s+/g, ' ').trim() : '';

  const paragraphs: string[] = [];
  const re = /<(h1|h2|h3|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(cleaned)) !== null) {
    const tag = m[1].toLowerCase();
    const text = decode(m[2].replace(/<[^>]+>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length < 25) continue;
    if (paragraphs.includes(text)) continue;

    paragraphs.push(/^h[123]$/.test(tag) ? `## ${text}` : text);
    if (paragraphs.length >= 220) break;
  }

  return { title, paragraphs };
}

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get('url');
  if (!target) return Response.json({ ok: false, error: 'Missing url' }, { status: 400 });

  let url: URL;
  try {
    url = await assertPublicUrl(target);
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'Invalid url' },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*;q=0.8', 'Accept-Language': 'en-IN,en;q=0.9' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    });

    if (!res.ok) {
      return Response.json({ ok: false, error: `Source returned ${res.status}` }, { status: 502 });
    }

    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('html') && !type.includes('text/plain')) {
      return Response.json({ ok: false, error: 'Source is not a readable page' }, { status: 415 });
    }

    // Cap the read so an enormous page can't exhaust memory.
    const reader = res.body?.getReader();
    if (!reader) return Response.json({ ok: false, error: 'Empty response' }, { status: 502 });

    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.length;
        if (total > MAX_BYTES) {
          await reader.cancel();
          break;
        }
      }
    }

    const html = new TextDecoder('utf-8').decode(
      chunks.reduce((acc, c) => {
        const merged = new Uint8Array(acc.length + c.length);
        merged.set(acc);
        merged.set(c, acc.length);
        return merged;
      }, new Uint8Array()),
    );

    const { title, paragraphs } = extract(html);
    if (paragraphs.length === 0) {
      return Response.json({ ok: false, error: 'No readable text found on this page' }, { status: 422 });
    }

    return Response.json({
      ok: true,
      url: res.url || url.toString(),
      domain: url.hostname.replace(/^www\./, ''),
      title,
      paragraphs,
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'Could not load the source' },
      { status: 502 },
    );
  }
}
