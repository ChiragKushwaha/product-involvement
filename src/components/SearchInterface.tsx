'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject, SubmitEvent, UIEvent } from 'react';
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronDown,
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  Search,
  Send,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import type {
  Channel,
  CombinedTelemetry,
  ListingItem,
  Platform,
  SearchResult,
  Situation,
} from '@/types/survey';
import type { TelemetryCollector } from '@/lib/telemetry-tracker';
import { AI_SUGGESTIONS, LISTINGS, SEARCH_RESULTS, buildAiReply } from '@/lib/search-corpus';
import { SEED_QUERY } from '@/lib/situations-data';
import { ACCENT_BG, ACCENT_ON, ThemeToggle, cx } from '@/components/ui';

/** Scroll events within this window belong to the same gesture (one CT1 action). */
const GESTURE_MS = 350;

function useScrollTracker(collector: TelemetryCollector, channel: Channel, sourceId?: string) {
  const lastActionRef = useRef(0);

  return useCallback(
    (e: UIEvent<HTMLElement>) => {
      const el = e.currentTarget;
      const range = el.scrollHeight - el.clientHeight;
      const scrollable = range > 4;
      const pct = scrollable
        ? Math.min(100, ((el.scrollTop + el.clientHeight) / el.scrollHeight) * 100)
        : 100;

      const now = Date.now();
      if (now - lastActionRef.current > GESTURE_MS) {
        lastActionRef.current = now;
        collector.logScroll(channel, pct, sourceId, scrollable);
      } else {
        collector.updateScrollDepth(sourceId, pct, scrollable);
      }
    },
    [collector, channel, sourceId],
  );
}

/** Minimal markdown: **bold**, `## heading`, line breaks. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <span key={i} className="block">
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={j} className="font-bold text-content">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <span key={j}>{part}</span>
            ),
          )}
        </span>
      ))}
    </>
  );
}

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citations?: { label: string; url: string }[];
}

type OpenSource =
  | { kind: 'article'; result: SearchResult }
  | { kind: 'listing'; item: ListingItem }
  | { kind: 'citation'; cite: { label: string; url: string } };

interface ReaderState {
  status: 'idle' | 'loading' | 'ready' | 'blocked';
  paragraphs: string[];
  error?: string;
}

export function SearchInterface({
  situation,
  collector,
  onFinish,
}: {
  situation: Situation;
  collector: TelemetryCollector;
  onFinish: (t: CombinedTelemetry) => void;
}) {
  const cat = situation.categoryCode;
  const corpus = SEARCH_RESULTS[cat];
  const listings = LISTINGS[cat];

  const [channel, setChannel] = useState<Channel>('Google Search');
  const [taskOpen, setTaskOpen] = useState(false);

  // ---- Google channel
  const [query, setQuery] = useState(SEED_QUERY[cat]);
  const [submitted, setSubmitted] = useState(SEED_QUERY[cat]);
  const [results, setResults] = useState<SearchResult[]>(corpus);
  const [searching, setSearching] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const usedLiveRef = useRef(false);

  // ---- Direct website channel
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [siteQuery, setSiteQuery] = useState('');

  // ---- AI channel
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [thinking, setThinking] = useState(false);

  // ---- opened source
  const [open, setOpen] = useState<OpenSource | null>(null);
  const [reader, setReader] = useState<ReaderState>({ status: 'idle', paragraphs: [] });

  const mainRef = useRef<HTMLElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const externalRef = useRef(false);

  /* ---------------------------------------------------------- live search */

  /** Pure fetch — resolves to the corpus whenever live search is unavailable. */
  const fetchResults = useCallback(
    async (q: string): Promise<{ results: SearchResult[]; live: boolean }> => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        if (data?.mode === 'live' && Array.isArray(data.results) && data.results.length) {
          return { results: data.results as SearchResult[], live: true };
        }
      } catch {
        /* fall through to the fixed corpus */
      }
      // Network blocked or nothing parsed — the fixed corpus keeps the task going.
      return { results: corpus, live: false };
    },
    [corpus],
  );

  const runSearch = useCallback(
    async (q: string) => {
      setSearching(true);
      const r = await fetchResults(q);
      setResults(r.results);
      setLiveMode(r.live);
      if (r.live) usedLiveRef.current = true;
      setSearching(false);
    },
    [fetchResults],
  );

  /* ---------------------------------------------------------- lifecycle */

  useEffect(() => {
    collector.startSearchTask(SEED_QUERY[cat], 'Google Search');

    let cancelled = false;
    void (async () => {
      const r = await fetchResults(SEED_QUERY[cat]);
      if (cancelled) return;
      setResults(r.results);
      setLiveMode(r.live);
      if (r.live) usedLiveRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [collector, cat, fetchResults]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        collector.pause();
        return;
      }
      // Back from a real site: the away time is dwell on that source.
      if (externalRef.current) {
        externalRef.current = false;
        collector.endExternalVisit();
      }
      collector.resume();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [collector]);

  const switchChannel = (next: Channel) => {
    if (next === channel) return;
    collector.logSourceClose();
    setOpen(null);
    setChannel(next);
    mainRef.current?.scrollTo({ top: 0 });
  };

  /* ------------------------------------------------------------ handlers */

  const submitQuery = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || q === submitted) return;
    setSubmitted(q);
    collector.logQuery(q, 'Google Search');
    void runSearch(q);
    mainRef.current?.scrollTo({ top: 0 });
  };

  /** Opens a real page inside the app so scroll and dwell stay observable. */
  const openArticle = async (r: SearchResult) => {
    setOpen({ kind: 'article', result: r });
    collector.logSourceOpen(r.id, r.url, 'Google Search');

    if (r.body?.length) {
      setReader({ status: 'ready', paragraphs: r.body });
      return;
    }

    setReader({ status: 'loading', paragraphs: [] });
    try {
      const res = await fetch(`/api/reader?url=${encodeURIComponent(r.url)}`);
      const data = await res.json();
      if (data?.ok && Array.isArray(data.paragraphs) && data.paragraphs.length) {
        setReader({ status: 'ready', paragraphs: data.paragraphs });
      } else {
        setReader({ status: 'blocked', paragraphs: [], error: data?.error });
      }
    } catch {
      setReader({ status: 'blocked', paragraphs: [], error: 'Could not load this source' });
    }
  };

  const closeSource = () => {
    collector.logSourceClose();
    setOpen(null);
    setReader({ status: 'idle', paragraphs: [] });
    // Returning to a platform listing is a repeat access under SN1's definition.
    if (channel === 'Direct Website' && platform) {
      collector.logSourceOpen(`site-${platform.id}`, platform.domain, 'Direct Website');
    }
  };

  /** Opens the real site in another window and measures the time away. */
  const openExternally = (url: string, sourceId: string, ch: Channel) => {
    collector.logSourceClose();
    externalRef.current = true;
    collector.beginExternalVisit(sourceId, url, ch);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openPlatform = (p: Platform) => {
    setPlatform(p);
    setSiteQuery('');
    collector.logSourceOpen(`site-${p.id}`, p.domain, 'Direct Website');
  };

  const leavePlatform = () => {
    collector.logSourceClose();
    setPlatform(null);
  };

  const submitSiteQuery = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = siteQuery.trim();
    if (!q) return;
    collector.logQuery(q, 'Direct Website');
  };

  const openProduct = (item: ListingItem) => {
    setOpen({ kind: 'listing', item });
    setReader({ status: 'ready', paragraphs: item.detail });
    collector.logSourceOpen(
      `item-${item.id}`,
      `${platform?.domain ?? 'site'}/${item.id}`,
      'Direct Website',
    );
  };

  const sendPrompt = (text: string) => {
    const p = text.trim();
    if (!p || thinking) return;

    collector.logSourceClose();
    collector.logQuery(p, 'Conversational AI');
    setPrompt('');
    setThinking(true);
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text: p }]);

    window.setTimeout(() => {
      const reply = buildAiReply(cat, p);
      const id = `a-${Date.now()}`;
      setMessages((m) => [
        ...m,
        { id, role: 'assistant', text: reply.text, citations: reply.citations },
      ]);
      setThinking(false);
      // A response is a dwell/scroll unit but not a "source opened" for SN1/SN2.
      collector.logSourceOpen(id, `ai-response:${p.slice(0, 60)}`, 'Conversational AI', false);
    }, 700);
  };

  const openCite = async (c: { label: string; url: string }) => {
    setOpen({ kind: 'citation', cite: c });
    collector.logSourceOpen(`cite-${c.url}`, c.url, 'Conversational AI', true);

    const local = corpus.find((r) => r.url === c.url);
    if (local?.body) {
      setReader({ status: 'ready', paragraphs: local.body });
      return;
    }
    setReader({ status: 'loading', paragraphs: [] });
    try {
      const res = await fetch(`/api/reader?url=${encodeURIComponent(c.url)}`);
      const data = await res.json();
      setReader(
        data?.ok && data.paragraphs?.length
          ? { status: 'ready', paragraphs: data.paragraphs }
          : { status: 'blocked', paragraphs: [], error: data?.error },
      );
    } catch {
      setReader({ status: 'blocked', paragraphs: [], error: 'Could not load this source' });
    }
  };

  useEffect(() => {
    if (channel === 'Conversational AI') {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, thinking, channel]);

  const finish = () => {
    collector.logSourceClose();
    onFinish(collector.compileFinalTelemetry());
  };

  /* -------------------------------------------------------------- scroll */

  const openSourceId =
    open?.kind === 'article'
      ? open.result.id
      : open?.kind === 'listing'
        ? `item-${open.item.id}`
        : open?.kind === 'citation'
          ? `cite-${open.cite.url}`
          : undefined;

  const openChannel: Channel =
    open?.kind === 'listing'
      ? 'Direct Website'
      : open?.kind === 'citation'
        ? 'Conversational AI'
        : 'Google Search';

  const mainScroll = useScrollTracker(
    collector,
    channel,
    channel === 'Direct Website' && platform ? `site-${platform.id}` : undefined,
  );
  const sourceScroll = useScrollTracker(collector, openChannel, openSourceId);
  const threadScroll = useScrollTracker(
    collector,
    'Conversational AI',
    [...messages].reverse().find((m) => m.role === 'assistant')?.id,
  );

  /* ---------------------------------------------------------------- view */

  const NAV: { key: Channel; icon: typeof Search; label: string }[] = [
    { key: 'Google Search', icon: Search, label: 'Search' },
    { key: 'Direct Website', icon: Globe, label: 'Sites' },
    { key: 'Conversational AI', icon: Bot, label: 'AI' },
  ];

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      {/* -------------------------------------------------- task reminder */}
      <header
        className="mx-auto w-full max-w-md shrink-0 px-4 pb-3 lg:max-w-6xl lg:px-8"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTaskOpen((o) => !o)}
            className={cx(
              'flex min-w-0 flex-1 items-center gap-2.5 rounded-full py-2.5 pl-3 pr-4 text-left transition',
              ACCENT_BG[situation.accent],
              ACCENT_ON[situation.accent],
            )}
          >
            <span className="rounded-full bg-black/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
              {situation.code}
            </span>
            <span className="flex-1 truncate text-[13px] font-bold">{situation.headline}</span>
            <ChevronDown
              className={cx('h-4 w-4 shrink-0 transition-transform', taskOpen && 'rotate-180')}
              strokeWidth={2.5}
            />
          </button>
          <ThemeToggle />
        </div>
        {taskOpen && (
          <div className="mt-2 rounded-[20px] bg-card p-4 text-[13px] leading-relaxed text-muted">
            {situation.scenario}
          </div>
        )}
      </header>

      {/* ---------------------------------------------------------- body */}
      <div className="mx-auto flex w-full min-h-0 max-w-md flex-1 gap-6 lg:max-w-6xl lg:px-8">
        <main
          id="main"
          ref={mainRef}
          onScroll={mainScroll}
          className={cx(
            'min-h-0 flex-1 overflow-y-auto px-4 lg:px-0',
            open && 'hidden lg:block lg:max-w-md',
          )}
        >
          {channel === 'Google Search' && (
            <GoogleChannel
              query={query}
              setQuery={setQuery}
              submitted={submitted}
              onSubmit={submitQuery}
              results={results}
              searching={searching}
              liveMode={liveMode}
              activeId={openSourceId}
              onOpen={openArticle}
            />
          )}

          {channel === 'Direct Website' && (
            <DirectChannel
              situation={situation}
              platform={platform}
              onOpenPlatform={openPlatform}
              onLeavePlatform={leavePlatform}
              onOpenExternally={(url, id) => openExternally(url, id, 'Direct Website')}
              siteQuery={siteQuery}
              setSiteQuery={setSiteQuery}
              onSubmitSiteQuery={submitSiteQuery}
              listings={listings}
              onOpenProduct={openProduct}
            />
          )}

          {channel === 'Conversational AI' && (
            <AiChannel
              situation={situation}
              messages={messages}
              thinking={thinking}
              suggestions={AI_SUGGESTIONS[cat]}
              onSend={sendPrompt}
              onOpenCite={openCite}
              onScroll={threadScroll}
              endRef={threadEndRef}
            />
          )}
        </main>

        {/* Source view: full-screen on phones, a second pane from lg up */}
        {open && (
          <SourcePane
            open={open}
            reader={reader}
            onClose={closeSource}
            onScroll={sourceScroll}
            onOpenExternally={(url, id) => openExternally(url, id, openChannel)}
          />
        )}
      </div>

      {/* -------------------------------------------------- prompt + nav */}
      {channel === 'Conversational AI' && !open && (
        <div className="mx-auto w-full max-w-md shrink-0 px-4 pb-2 pt-2 lg:max-w-6xl lg:px-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendPrompt(prompt);
            }}
            className="flex items-center gap-2 rounded-full bg-card py-2 pl-4 pr-2"
          >
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask something to start"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-content outline-none placeholder:text-faint"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || thinking}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary disabled:bg-well disabled:text-faint"
              aria-label="Send"
            >
              <Send className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </form>
        </div>
      )}

      <nav
        className="mx-auto w-full max-w-md shrink-0 px-4 pt-2 lg:max-w-6xl lg:px-8"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-1.5 rounded-full bg-card p-1.5">
          {NAV.map(({ key, icon: Icon, label }) => {
            const active = channel === key;
            return (
              <button
                key={key}
                onClick={() => switchChannel(key)}
                aria-label={label}
                aria-current={active}
                className={cx(
                  'flex h-[46px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[16px] transition',
                  active ? 'bg-primary text-on-primary' : 'text-faint active:bg-well',
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
                <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
              </button>
            );
          })}
          <button
            onClick={finish}
            className="flex h-[46px] items-center gap-1.5 rounded-[16px] bg-content px-4 text-[12px] font-bold uppercase tracking-wide text-surface transition active:scale-95"
          >
            <Check className="h-4 w-4" strokeWidth={3} />
            Done
          </button>
        </div>
      </nav>
    </div>
  );
}

/* ====================================================== channel: Google */

function GoogleChannel({
  query,
  setQuery,
  submitted,
  onSubmit,
  results,
  searching,
  liveMode,
  activeId,
  onOpen,
}: {
  query: string;
  setQuery: (v: string) => void;
  submitted: string;
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  results: SearchResult[];
  searching: boolean;
  liveMode: boolean;
  activeId?: string;
  onOpen: (r: SearchResult) => void;
}) {
  return (
    <div className="pb-4">
      <form onSubmit={onSubmit} className="sticky top-0 z-10 bg-surface pb-3 pt-1">
        <div className="flex items-center gap-2 rounded-full bg-card py-2.5 pl-4 pr-2 ring-1 ring-line">
          <Search className="h-[18px] w-[18px] shrink-0 text-faint" strokeWidth={2.5} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-content outline-none placeholder:text-faint"
            placeholder="Search"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="shrink-0 p-1 text-faint"
              aria-label="Clear"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </form>

      <div className="mb-3 flex items-center gap-2 px-1">
        {searching ? (
          <span className="flex items-center gap-1.5 text-[12px] text-faint">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
          </span>
        ) : (
          <>
            <span className="text-[12px] text-faint">
              Results for &ldquo;{submitted}&rdquo;
            </span>
            <span
              className={cx(
                'rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                liveMode ? 'bg-mint/30 text-content' : 'bg-well text-faint',
              )}
            >
              {liveMode ? 'Live web' : 'Offline set'}
            </span>
          </>
        )}
      </div>

      <div className="space-y-2.5">
        {results.map((r) => (
          <button
            key={r.id}
            onClick={() => onOpen(r)}
            className={cx(
              'block w-full rounded-[20px] p-4 text-left transition',
              activeId === r.id ? 'bg-primary-soft ring-1 ring-primary' : 'bg-card active:opacity-80',
            )}
          >
            <p className="mb-1 text-[11px] font-medium text-faint">{r.domain}</p>
            <h3 className="mb-1.5 text-[15px] font-bold leading-snug text-primary">{r.title}</h3>
            <p className="text-[13px] leading-relaxed text-muted">{r.snippet}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ====================================================== channel: Direct */

function DirectChannel({
  situation,
  platform,
  onOpenPlatform,
  onLeavePlatform,
  onOpenExternally,
  siteQuery,
  setSiteQuery,
  onSubmitSiteQuery,
  listings,
  onOpenProduct,
}: {
  situation: Situation;
  platform: Platform | null;
  onOpenPlatform: (p: Platform) => void;
  onLeavePlatform: () => void;
  onOpenExternally: (url: string, sourceId: string) => void;
  siteQuery: string;
  setSiteQuery: (v: string) => void;
  onSubmitSiteQuery: (e: SubmitEvent<HTMLFormElement>) => void;
  listings: ListingItem[];
  onOpenProduct: (i: ListingItem) => void;
}) {
  if (!platform) {
    return (
      <div className="pb-4">
        <h2 className="display mb-1 pt-1 text-[22px]">Official websites</h2>
        <p className="mb-4 text-[13px] text-muted">
          Open any of the {situation.category.toLowerCase()} sites below.
        </p>
        <div className="space-y-2.5 sm:grid sm:grid-cols-2 sm:gap-2.5 sm:space-y-0">
          {situation.platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => onOpenPlatform(p)}
              className={cx(
                'flex w-full items-center justify-between rounded-[20px] p-4 text-left transition active:scale-[0.99]',
                ACCENT_BG[p.tint],
                ACCENT_ON[p.tint],
              )}
            >
              <div>
                <p className="display text-[19px] leading-none">{p.name}</p>
                <p className="mt-1.5 text-[11px] font-semibold opacity-55">{p.domain}</p>
              </div>
              <Link2 className="h-5 w-5 opacity-60" strokeWidth={2.5} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-10 bg-surface pb-3 pt-1">
        <div className="mb-2.5 flex items-center gap-2.5">
          <button
            onClick={onLeavePlatform}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card"
            aria-label="All sites"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="display truncate text-[17px] leading-none">{platform.name}</p>
            <p className="text-[11px] text-faint">{platform.domain}</p>
          </div>
          <button
            onClick={() => onOpenExternally(`https://${platform.domain}`, `ext-${platform.id}`)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-on-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.5} />
            Visit site
          </button>
        </div>

        <form onSubmit={onSubmitSiteQuery}>
          <div className="flex items-center gap-2 rounded-full bg-card py-2.5 pl-4 pr-2">
            <Search className="h-[18px] w-[18px] shrink-0 text-faint" strokeWidth={2.5} />
            <input
              value={siteQuery}
              onChange={(e) => setSiteQuery(e.target.value)}
              enterKeyHint="search"
              placeholder={`Search on ${platform.name}`}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-content outline-none placeholder:text-faint"
            />
          </div>
        </form>
      </div>

      <div className="space-y-2.5">
        {listings.map((item) => (
          <button
            key={item.id}
            onClick={() => onOpenProduct(item)}
            className="block w-full rounded-[20px] bg-card p-4 text-left transition active:opacity-80"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="text-[15px] font-bold leading-snug">{item.name}</h3>
              <span className="shrink-0 text-[15px] font-bold text-primary">{item.price}</span>
            </div>
            <p className="mb-2 text-[12px] text-faint">{item.meta}</p>
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-butter text-butter" />
              <span className="text-[12px] font-semibold text-muted">{item.rating}</span>
              <span className="text-[12px] text-faint">({item.ratingCount})</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ========================================================== channel: AI */

function AiChannel({
  situation,
  messages,
  thinking,
  suggestions,
  onSend,
  onOpenCite,
  onScroll,
  endRef,
}: {
  situation: Situation;
  messages: AiMessage[];
  thinking: boolean;
  suggestions: string[];
  onSend: (t: string) => void;
  onOpenCite: (c: { label: string; url: string }) => void;
  onScroll: (e: UIEvent<HTMLElement>) => void;
  endRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div onScroll={onScroll} className="pb-4">
      {messages.length === 0 && (
        <div className="pt-2">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Sparkles className="h-5 w-5 text-on-primary" strokeWidth={2.5} />
            </div>
            <div>
              <p className="display text-[19px] leading-none">AI Assistant</p>
              <p className="text-[11px] text-faint">Ask about {situation.category}</p>
            </div>
          </div>
          <p className="mb-4 text-[14px] leading-relaxed text-muted">
            Ask me anything before you decide — comparisons, what to check, prices, or trade-offs.
          </p>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSend(s)}
                className="block w-full rounded-2xl bg-card px-4 py-3 text-left text-[13.5px] font-medium text-muted transition active:opacity-80"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 pt-1">
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-[18px] rounded-br-md bg-primary px-4 py-2.5 text-[14px] font-medium text-on-primary">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="rounded-[20px] bg-card p-4">
              <div className="text-[14px] leading-relaxed text-muted">
                <RichText text={m.text} />
              </div>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3.5 border-t border-line pt-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-faint">
                    Sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {m.citations.map((c) => (
                      <button
                        key={c.url}
                        onClick={() => onOpenCite(c)}
                        className="flex items-center gap-1.5 rounded-full bg-well px-3 py-1.5 text-[11px] font-semibold text-primary transition active:opacity-80"
                      >
                        <Link2 className="h-3 w-3" strokeWidth={2.5} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ),
        )}

        {thinking && (
          <div className="flex items-center gap-2 rounded-[20px] bg-card px-4 py-3.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-faint"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

/* ==================================================== source pane / overlay */

function SourcePane({
  open,
  reader,
  onClose,
  onScroll,
  onOpenExternally,
}: {
  open: OpenSource;
  reader: ReaderState;
  onClose: () => void;
  onScroll: (e: UIEvent<HTMLElement>) => void;
  onOpenExternally: (url: string, sourceId: string) => void;
}) {
  const title =
    open.kind === 'article'
      ? open.result.title
      : open.kind === 'listing'
        ? open.item.name
        : open.cite.label;

  const subtitle =
    open.kind === 'article'
      ? open.result.domain
      : open.kind === 'listing'
        ? 'Product page'
        : 'Cited source';

  const url =
    open.kind === 'article' ? open.result.url : open.kind === 'citation' ? open.cite.url : null;

  const sourceId =
    open.kind === 'article'
      ? `ext-${open.result.id}`
      : open.kind === 'citation'
        ? `ext-${open.cite.url}`
        : `ext-${open.item.id}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface lg:static lg:z-auto lg:min-h-0 lg:flex-1 lg:rounded-[26px] lg:bg-card">
      <div
        className="flex shrink-0 items-start gap-3 px-4 pb-3 lg:pt-4"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button onClick={onClose} className="circle-btn mt-0.5" aria-label="Close source">
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <div className="min-w-0 flex-1 pt-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-faint">
            {subtitle}
          </p>
          <h2 className="text-[16px] font-bold leading-snug">{title}</h2>
        </div>
        {url && (
          <button
            onClick={() => onOpenExternally(url, sourceId)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-well text-muted"
            aria-label="Open the original page in a new window"
          >
            <ExternalLink className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto px-4 lg:px-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {open.kind === 'listing' && <ListingHeader item={open.item} />}

        {reader.status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-16 text-faint">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-[13px]">Loading the page…</p>
          </div>
        )}

        {reader.status === 'blocked' && (
          <div className="rounded-[20px] bg-well p-5 text-center">
            <p className="mb-1 text-[14px] font-bold">This site can&rsquo;t be read in-app</p>
            <p className="mb-4 text-[13px] leading-relaxed text-muted">
              {reader.error ?? 'The page blocked our request.'} You can open the real site in a
              new window — the time you spend there is still recorded.
            </p>
            {url && (
              <button
                onClick={() => onOpenExternally(url, sourceId)}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-5 text-[13px] font-bold text-on-primary"
              >
                <ExternalLink className="h-4 w-4" strokeWidth={2.5} />
                Open in a new window
              </button>
            )}
          </div>
        )}

        {reader.status === 'ready' &&
          reader.paragraphs.map((p, i) =>
            p.startsWith('## ') ? (
              <h3 key={i} className="mb-2 mt-5 text-[17px] font-bold leading-snug">
                {p.slice(3)}
              </h3>
            ) : (
              <p key={i} className="mb-4 text-[15px] leading-relaxed text-muted">
                {p}
              </p>
            ),
          )}

        <div className="h-6" />
      </div>
    </div>
  );
}

function ListingHeader({ item }: { item: ListingItem }) {
  return (
    <>
      <div className="mb-4 flex items-baseline gap-3">
        <span className="display text-[30px] text-primary">{item.price}</span>
        <span className="text-[13px] text-faint">{item.meta}</span>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <Star className="h-4 w-4 fill-butter text-butter" />
        <span className="text-[14px] font-bold">{item.rating}</span>
        <span className="text-[13px] text-faint">({item.ratingCount} ratings)</span>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {item.highlights.map((h) => (
          <span
            key={h}
            className="rounded-lg bg-well px-2.5 py-1.5 text-[11px] font-semibold text-muted"
          >
            {h}
          </span>
        ))}
      </div>
    </>
  );
}
