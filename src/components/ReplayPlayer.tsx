'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileJson, LoaderCircle, Pause, Play, RotateCcw, Table2 } from 'lucide-react';
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

function groupsOf<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

function replayDecoder(startedAt?: string) {
  let lastTimestamp = startedAt ? Date.parse(startedAt) : Date.now();
  return (event: string) => {
    try {
      const decoded = event.startsWith('{') ? JSON.parse(event) : unpack(event);
      if (Number.isFinite(decoded.timestamp)) lastTimestamp = decoded.timestamp;
      return decoded;
    } catch {
      // A single damaged legacy event should not make an otherwise complete
      // replay unwatchable. New recordings use text-safe JSON events.
      return {
        type: 5,
        timestamp: lastTimestamp,
        data: { tag: 'replay_event_unavailable', payload: null },
      };
    }
  };
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
  const scrubbingRef = useRef(false);
  const pendingPlayRef = useRef(false);
  const [manifest, setManifest] = useState<ReplayManifest | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      pendingPlayRef.current = false;
      setPlayerReady(false);
      setPlaying(false);
      setLoading(true);
      setError(null);
      try {
        const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
        const fullParams = new URLSearchParams({ full: '1' });
        if (token) fullParams.set('token', token);
        const fullResponse = await fetch(
          `/api/replays/${encodeURIComponent(sessionId)}?${fullParams.toString()}`,
        );
        const full = await fullResponse.json();
        if (fullResponse.ok && full?.ok && Array.isArray(full.chunks)) {
          const chunks = full.chunks as { sequence: number; events: string[] }[];
          chunks.sort((a, b) => a.sequence - b.sequence);
          if (!cancelled) {
            setManifest(full.manifest as ReplayManifest);
            setEvents(chunks.flatMap((chunk) => chunk.events));
          }
          return;
        }

        const metaResponse = await fetch(`/api/replays/${encodeURIComponent(sessionId)}${tokenQuery}`);
        const meta = await metaResponse.json();
        if (!metaResponse.ok || !meta?.ok) throw new Error(meta?.error ?? 'Replay not found');

        const descriptors = meta.chunks as ReplayChunkDescriptor[];
        const batches = await loadWithConcurrency(
          groupsOf(descriptors, 2),
          3,
          async (batch) => {
            const params = new URLSearchParams();
            batch.forEach((descriptor) => params.append('chunk', descriptor.fileName));
            if (token) params.set('token', token);
            const response = await fetch(
              `/api/replays/${encodeURIComponent(sessionId)}?${params.toString()}`,
            );
            const data = await response.json();
            if ((!response.ok || !data?.ok) && batch.length > 1) {
              // Backward-compatible fallback for a receiver that has not yet
              // been redeployed with the batch-read action.
              return Promise.all(batch.map(async (descriptor) => {
                const single = new URLSearchParams({ chunk: descriptor.fileName });
                if (token) single.set('token', token);
                const singleResponse = await fetch(
                  `/api/replays/${encodeURIComponent(sessionId)}?${single.toString()}`,
                );
                const singleData = await singleResponse.json();
                if (!singleResponse.ok || !singleData?.ok || !Array.isArray(singleData.events)) {
                  throw new Error(singleData?.error ?? `Could not load chunk ${descriptor.sequence}`);
                }
                return { sequence: descriptor.sequence, events: singleData.events as string[] };
              }));
            }
            if (!response.ok || !data?.ok) {
              throw new Error(data?.error ?? 'Could not load replay chunks');
            }
            if (batch.length === 1 && Array.isArray(data.events)) {
              return [{ sequence: batch[0].sequence, events: data.events as string[] }];
            }
            if (!Array.isArray(data.chunks)) throw new Error('Drive returned malformed replay data');
            return data.chunks as { sequence: number; events: string[] }[];
          },
        );

        if (cancelled) return;
        const chunks = batches.flat();
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
    setPlayerReady(false);
    rootRef.current.replaceChildren();
    const replayer = new Replayer(events, {
      root: rootRef.current,
      unpackFn: replayDecoder(manifest?.startedAt),
      skipInactive: true,
      speed: 4,
      mouseTail: { duration: 400, lineWidth: 2, strokeStyle: '#5951d8' },
    });
    replayerRef.current = replayer;
    const totalTime = replayer.getMetaData().totalTime;
    setDuration(totalTime);
    setCurrentTime(0);
    setPlaying(false);
    // Build the initial full snapshot immediately. Previously this happened
    // only after seeking, which made the first Play click appear unresponsive.
    replayer.pause(0);

    const start = () => setPlaying(true);
    const pause = () => setPlaying(false);
    const finish = () => {
      pendingPlayRef.current = false;
      setPlaying(false);
      setCurrentTime(totalTime);
    };
    replayer.on('start', start);
    replayer.on('pause', pause);
    replayer.on('finish', finish);
    setPlayerReady(true);
    if (pendingPlayRef.current) replayer.play(0);
    const timer = window.setInterval(() => {
      if (!scrubbingRef.current) {
        setCurrentTime(Math.min(replayer.getCurrentTime(), replayer.getMetaData().totalTime));
      }
    }, 150);
    return () => {
      window.clearInterval(timer);
      replayer.off('start', start);
      replayer.off('pause', pause);
      replayer.off('finish', finish);
      replayer.destroy();
      replayerRef.current = null;
    };
  }, [events, manifest?.startedAt]);

  const togglePlayback = () => {
    const replayer = replayerRef.current;
    if (!replayer || !playerReady) {
      const shouldPlay = !playing;
      pendingPlayRef.current = shouldPlay;
      setPlaying(shouldPlay);
      return;
    }
    if (playing) {
      pendingPlayRef.current = false;
      replayer.pause();
      setCurrentTime(replayer.getCurrentTime());
    } else {
      pendingPlayRef.current = true;
      replayer.play(currentTime >= duration ? 0 : currentTime);
    }
  };

  const restart = () => {
    const replayer = replayerRef.current;
    if (!replayer || !playerReady) {
      pendingPlayRef.current = true;
      setCurrentTime(0);
      setPlaying(true);
      return;
    }
    pendingPlayRef.current = true;
    replayer.pause(0);
    replayer.play(0);
    setCurrentTime(0);
    setPlaying(true);
  };

  const changeSpeed = (next: number) => {
    setSpeed(next);
    replayerRef.current?.setConfig({ speed: next });
  };

  const seek = (next: number) => {
    const replayer = replayerRef.current;
    if (!replayer) return;
    pendingPlayRef.current = false;
    replayer.pause(next);
    scrubbingRef.current = false;
    setPlaying(false);
    setCurrentTime(next);
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const dashboardHref = token ? `/replays?token=${encodeURIComponent(token)}` : '/replays';
  const participantQuery = `&sessionId=${encodeURIComponent(sessionId)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
      <header className="mb-5 flex items-start gap-3">
        <Link href={dashboardHref} className="circle-btn" aria-label="Back to session replays">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            Full in-app event replay
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

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <a
          href={`/api/export?format=responses${participantQuery}`}
          className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary text-[12px] font-bold text-on-primary"
        >
          <Table2 className="h-4 w-4" /> Response CSV
        </a>
        <a
          href={`/api/export?format=events${participantQuery}`}
          className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-card text-[12px] font-semibold text-muted"
        >
          <Download className="h-4 w-4" /> Event log CSV
        </a>
        <a
          href={`/api/export?format=json${participantQuery}`}
          className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-card text-[12px] font-semibold text-muted"
        >
          <FileJson className="h-4 w-4" /> Raw JSON
        </a>
      </div>

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
              {[1, 2, 4, 8, 16].map((value) => <option key={value} value={value}>{value}×</option>)}
            </select>
          </label>
          <div className="flex basis-full items-center gap-3 px-2 pb-1 pt-1">
            <span className="w-10 text-right text-[11px] font-semibold tabular-nums text-faint">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(1, duration)}
              step={100}
              value={Math.min(currentTime, Math.max(1, duration))}
              onPointerDown={() => {
                scrubbingRef.current = true;
                replayerRef.current?.pause();
                setPlaying(false);
              }}
              onChange={(event) => {
                scrubbingRef.current = true;
                setCurrentTime(Number(event.target.value));
              }}
              onPointerUp={(event) => seek(Number(event.currentTarget.value))}
              onKeyUp={(event) => seek(Number(event.currentTarget.value))}
              onBlur={(event) => seek(Number(event.currentTarget.value))}
              aria-label="Session replay timeline"
              className="h-2 min-w-0 flex-1 cursor-pointer accent-primary"
            />
            <span className="w-10 text-[11px] font-semibold tabular-nums text-faint">
              {formatTime(duration)}
            </span>
          </div>
        </div>
        <div className="overflow-auto rounded-[22px] bg-card p-2 sm:p-4">
          <div ref={rootRef} className="min-h-[420px] min-w-[360px]" />
        </div>
      </div>
    </main>
  );
}
