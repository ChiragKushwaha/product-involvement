'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LoaderCircle, Pause, Play, RotateCcw } from 'lucide-react';
import { Replayer } from '@rrweb/replay';
import { unpack } from '@rrweb/packer';
import type { ReplayChunkDescriptor, ReplayManifest } from '@/lib/drive-replays';
import { ThemeToggle } from '@/components/ui';

async function loadWithConcurrency<T, R>(
  items: T[],
  limit: number,
  load: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await load(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

export function ReplayPlayer({
  sessionId,
  token,
}: {
  sessionId: string;
  token?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const replayerRef = useRef<Replayer | null>(null);
  const [manifest, setManifest] = useState<ReplayManifest | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
        const metaResponse = await fetch(`/api/replays/${encodeURIComponent(sessionId)}${tokenQuery}`);
        const meta = await metaResponse.json();
        if (!metaResponse.ok || !meta?.ok) throw new Error(meta?.error ?? 'Replay not found');

        const descriptors = meta.chunks as ReplayChunkDescriptor[];
        const chunks = await loadWithConcurrency(
          descriptors,
          4,
          async (descriptor) => {
            const params = new URLSearchParams({ chunk: descriptor.fileName });
            if (token) params.set('token', token);
            const response = await fetch(
              `/api/replays/${encodeURIComponent(sessionId)}?${params.toString()}`,
            );
            const data = await response.json();
            if (!response.ok || !data?.ok || !Array.isArray(data.events)) {
              throw new Error(data?.error ?? `Could not load chunk ${descriptor.sequence}`);
            }
            return { sequence: descriptor.sequence, events: data.events as string[] };
          },
        );

        if (cancelled) return;
        chunks.sort((a, b) => a.sequence - b.sequence);
        setManifest(meta.manifest as ReplayManifest);
        setEvents(chunks.flatMap((chunk) => chunk.events));
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load replay');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [sessionId, token]);

  useEffect(() => {
    if (!rootRef.current || events.length === 0) return;
    rootRef.current.replaceChildren();
    const replayer = new Replayer(events, {
      root: rootRef.current,
      unpackFn: unpack,
      skipInactive: true,
      speed: 1,
      mouseTail: { duration: 400, lineWidth: 2, strokeStyle: '#5951d8' },
    });
    replayerRef.current = replayer;
    setPlaying(false);
    return () => {
      replayer.destroy();
      replayerRef.current = null;
    };
  }, [events]);

  const togglePlayback = () => {
    const replayer = replayerRef.current;
    if (!replayer) return;
    if (playing) replayer.pause();
    else replayer.play();
    setPlaying((value) => !value);
  };

  const restart = () => {
    const replayer = replayerRef.current;
    if (!replayer) return;
    replayer.pause(0);
    replayer.play(0);
    setPlaying(true);
  };

  const changeSpeed = (next: number) => {
    setSpeed(next);
    replayerRef.current?.setConfig({ speed: next });
  };

  const dashboardHref = token ? `/replays?token=${encodeURIComponent(token)}` : '/replays';

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
      <header className="mb-5 flex items-start gap-3">
        <Link href={dashboardHref} className="circle-btn" aria-label="Back to session replays">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            Privacy-masked event replay
          </p>
          <h1 className="display truncate text-[25px] sm:text-[32px]">{sessionId}</h1>
          {manifest && (
            <p className="mt-1 text-[12px] text-faint">
              {manifest.eventCount.toLocaleString()} events · {manifest.chunkCount} chunks
            </p>
          )}
        </div>
        <ThemeToggle />
      </header>

      {loading && (
        <div className="flex min-h-72 items-center justify-center rounded-[22px] bg-card">
          <LoaderCircle className="h-6 w-6 animate-spin text-primary" aria-label="Loading replay" />
        </div>
      )}

      {error && (
        <div className="rounded-[22px] bg-card p-6 text-center text-[14px] text-muted">{error}</div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="rounded-[22px] bg-card p-6 text-center text-[14px] text-muted">
          This session has no replay events.
        </div>
      )}

      <div className={events.length ? 'block' : 'hidden'}>
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[18px] bg-card p-2.5">
          <button
            onClick={togglePlayback}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-[13px] font-bold text-on-primary"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={restart}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-well px-4 text-[13px] font-semibold text-muted"
          >
            <RotateCcw className="h-4 w-4" />
            Restart
          </button>
          <label className="ml-auto flex items-center gap-2 text-[12px] font-semibold text-faint">
            Speed
            <select
              value={speed}
              onChange={(event) => changeSpeed(Number(event.target.value))}
              className="min-h-11 rounded-full bg-well px-3 text-content"
            >
              {[0.5, 1, 2, 4].map((value) => <option key={value} value={value}>{value}×</option>)}
            </select>
          </label>
        </div>
        <div className="overflow-auto rounded-[22px] bg-card p-2 sm:p-4">
          <div ref={rootRef} className="min-h-[420px] min-w-[360px]" />
        </div>
      </div>
    </main>
  );
}
