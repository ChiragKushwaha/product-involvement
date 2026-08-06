'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import type { Situation } from '@/types/survey';
import { ACCENT_BG, ACCENT_ON, cx } from '@/components/ui';

/** Seconds each motion-ad beat holds on screen. */
const BEAT_SEC = 2.6;
const TITLE_SEC = 3;

export interface AdPlayback {
  watchedSec: number;
  completed: boolean;
}

/**
 * The advertisement stimulus. Autoplays as soon as the ad screen appears.
 *
 * If a real file exists at `situation.videoSrc` it is used; otherwise the
 * generated motion ad renders instead, with the same autoplay, progress,
 * replay and watch-time behaviour so the measurement contract never changes.
 *
 * Browsers only allow unattended playback when muted, so playback starts with
 * sound and silently falls back to muted if the browser refuses.
 */
export function AdPlayer({
  situation,
  onProgress,
  onEnded,
}: {
  situation: Situation;
  onProgress: (p: AdPlayback) => void;
  onEnded?: () => void;
}) {
  const [hasVideo, setHasVideo] = useState(true);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const watchedRef = useRef(0);
  const completedRef = useRef(false);

  const beats = situation.adScript.beats;
  const motionDuration = TITLE_SEC + beats.length * BEAT_SEC + 2;

  // The timer below must survive re-renders, so it reads the callbacks through
  // refs rather than depending on their identity — an inline `onEnded` would
  // otherwise restart the effect (and the elapsed clock) on every render.
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onEndedRef.current = onEnded;
  });

  const report = useCallback(() => {
    onProgressRef.current({
      watchedSec: Math.round(watchedRef.current),
      completed: completedRef.current,
    });
  }, []);

  const markEnded = useCallback(() => {
    completedRef.current = true;
    setCompleted(true);
    setPlaying(false);
    report();
    onEndedRef.current?.();
  }, [report]);

  /* ------------------------------------------------------------- video */

  useEffect(() => {
    const el = videoRef.current;
    if (!hasVideo || !el) return;

    // Try with sound; browsers that block it get a muted retry.
    el.muted = false;
    el.play().then(
      () => setMuted(false),
      () => {
        el.muted = true;
        setMuted(true);
        el.play().catch(() => setPlaying(false));
      },
    );
  }, [hasVideo]);

  /* ------------------------------------------------------- motion timer */

  useEffect(() => {
    if (hasVideo) return;

    completedRef.current = false;

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let stopped = false;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      elapsed += dt;
      watchedRef.current += dt;

      const p = Math.min(1, elapsed / motionDuration);
      setProgress(p);

      if (p >= 1) {
        stopped = true;
        markEnded();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    const report_ = setInterval(report, 1000);

    return () => {
      if (!stopped) cancelAnimationFrame(raf);
      clearInterval(report_);
    };
  }, [hasVideo, motionDuration, markEnded, report]);

  /* ------------------------------------------------------------ controls */

  const togglePlay = () => {
    const el = videoRef.current;
    if (hasVideo && el) {
      if (el.paused) {
        el.play().catch(() => {});
        setPlaying(true);
      } else {
        el.pause();
        setPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (el) {
      el.muted = !el.muted;
      setMuted(el.muted);
    }
  };

  /* ---------------------------------------------------------------- view */

  const activeBeat = (() => {
    const t = progress * motionDuration;
    if (t < TITLE_SEC) return -1;
    return Math.min(beats.length - 1, Math.floor((t - TITLE_SEC) / BEAT_SEC));
  })();

  return (
    <div className="card relative overflow-hidden bg-black">
      {/* Real ads are 16:9 and must not be cropped; the generated motion ad
          is laid out for a taller phone-friendly frame. */}
      <div className={cx('relative w-full', hasVideo ? 'aspect-video' : 'aspect-[4/5] sm:aspect-video')}>
        {hasVideo ? (
          <video
            ref={videoRef}
            src={situation.videoSrc}
            className="absolute inset-0 h-full w-full object-contain"
            autoPlay
            playsInline
            preload="auto"
            controls={false}
            aria-label={`Advertisement ${situation.number}: ${situation.category}`}
            onError={() => setHasVideo(false)}
            onEnded={markEnded}
            onTimeUpdate={(e) => {
              const el = e.currentTarget;
              if (el.duration) setProgress(el.currentTime / el.duration);
              watchedRef.current = Math.max(watchedRef.current, el.currentTime);
              report();
            }}
          >
            {/* Set `captionsSrc` on the situation once a .vtt exists (WCAG 1.2.2). */}
            {situation.captionsSrc && (
              <track
                kind="captions"
                srcLang="en"
                label="English captions"
                src={situation.captionsSrc}
                default
              />
            )}
          </video>
        ) : (
          <MotionAd
            situation={situation}
            activeBeat={activeBeat}
            finished={progress >= 1}
          />
        )}

        {/* progress */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
          <div
            className="h-full bg-white transition-[width] duration-150"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        {/* controls */}
        <div className="absolute right-3 top-3 flex gap-2">
          {hasVideo && (
            <>
              <button
                onClick={toggleMute}
                aria-label={muted ? 'Unmute advertisement' : 'Mute advertisement'}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
              >
                {muted ? (
                  <VolumeX className="h-[18px] w-[18px]" strokeWidth={2.5} />
                ) : (
                  <Volume2 className="h-[18px] w-[18px]" strokeWidth={2.5} />
                )}
              </button>
              <button
                onClick={togglePlay}
                aria-label={playing ? 'Pause advertisement' : 'Play advertisement'}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
              >
                {playing ? (
                  <Pause className="h-[18px] w-[18px]" strokeWidth={2.5} />
                ) : (
                  <Play className="h-[18px] w-[18px]" strokeWidth={2.5} />
                )}
              </button>
            </>
          )}
        </div>

        {muted && hasVideo && playing && (
          <button
            onClick={toggleMute}
            className="absolute bottom-4 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-[12px] font-bold text-white backdrop-blur"
          >
            <VolumeX className="h-4 w-4" strokeWidth={2.5} />
            Tap for sound
          </button>
        )}

        {completed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wide text-black">
              <RotateCcw className="h-4 w-4" strokeWidth={3} />
              Advertisement ended
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ motion ad */

/**
 * Generated advertisement used when no video file is present. Beats are
 * revealed on a timer so the stimulus has a real duration and end point.
 */
function MotionAd({
  situation,
  activeBeat,
  finished,
}: {
  situation: Situation;
  activeBeat: number;
  finished: boolean;
}) {
  const { tagline, beats } = situation.adScript;

  return (
    <div
      className={cx(
        'absolute inset-0 flex flex-col justify-between p-6',
        ACCENT_BG[situation.accent],
        ACCENT_ON[situation.accent],
      )}
    >
      <div className="flex items-start justify-between">
        <span className="rounded-full bg-black/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em]">
          {situation.code}
        </span>
        <span className="rounded-full bg-black/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em]">
          {situation.category}
        </span>
      </div>

      <div className="flex-1 py-6">
        <h3
          className={cx(
            'display text-[30px] leading-[0.94] transition-all duration-700 sm:text-[38px]',
            activeBeat < 0 ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-60',
          )}
        >
          {tagline}
        </h3>

        <ul className="mt-5 space-y-2.5">
          {beats.map((b, i) => (
            <li
              key={b}
              className={cx(
                'text-[17px] font-bold leading-tight transition-all duration-500 sm:text-[20px]',
                i <= activeBeat || finished
                  ? 'translate-x-0 opacity-100'
                  : 'translate-x-3 opacity-0',
              )}
            >
              {b}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-55">
        {situation.headline}
      </p>
    </div>
  );
}
