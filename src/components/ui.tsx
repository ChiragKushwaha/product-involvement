'use client';

import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Check, Moon, Sun } from 'lucide-react';
import type { AccentName } from '@/types/survey';

/* Static class maps — Tailwind needs literal strings to generate these. */

export const ACCENT_BG: Record<AccentName, string> = {
  peri: 'bg-peri',
  sky: 'bg-sky',
  sage: 'bg-sage',
  butter: 'bg-butter',
  lilac: 'bg-lilac',
  mint: 'bg-mint',
  blush: 'bg-blush',
  slate: 'bg-slate',
};

/** Periwinkle is dark enough to need light text; the rest are pale. */
export const ACCENT_ON: Record<AccentName, string> = {
  peri: 'text-white',
  sky: 'text-[#16181a]',
  sage: 'text-[#16181a]',
  butter: 'text-[#16181a]',
  lilac: 'text-[#16181a]',
  mint: 'text-[#16181a]',
  blush: 'text-[#16181a]',
  slate: 'text-[#16181a]',
};

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

/* ----------------------------------------------------------------- theme */

export type Theme = 'light' | 'dark';

const THEME_EVENT = 'survey-theme-change';

/**
 * The theme lives on `<html data-theme>` (stamped before paint by the inline
 * script in the layout) and in the OS preference — both external stores, so
 * this subscribes to them rather than mirroring them into state.
 */
function subscribeTheme(onChange: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    mq.removeEventListener('change', onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

function readTheme(): Theme {
  const stamped = document.documentElement.getAttribute('data-theme');
  if (stamped === 'light' || stamped === 'dark') return stamped;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  // Server render has no theme to report; the toggle stays blank until mounted.
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => null as Theme | null);

  const toggle = () => {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    // A cookie (not localStorage) so the server can render the right theme on
    // the very first paint of the next request.
    document.cookie = `survey-theme=${next};path=/;max-age=31536000;samesite=lax`;
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return { theme, toggle };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cx(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-well text-muted transition hover:text-content active:scale-95',
        className,
      )}
    >
      {/* Render nothing until the theme is known, to avoid a hydration flip */}
      {theme === 'dark' ? (
        <Sun className="h-[18px] w-[18px]" strokeWidth={2.5} />
      ) : theme === 'light' ? (
        <Moon className="h-[18px] w-[18px]" strokeWidth={2.5} />
      ) : null}
    </button>
  );
}

/* ---------------------------------------------------------------- Screen */

/**
 * Mobile-first column that widens on tablets and desktops. `wide` opts into a
 * roomier measure for content that benefits from it (grids, dashboards).
 */
export function Screen({
  children,
  className,
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <main
      id="main"
      className={cx(
        'mx-auto w-full px-4 pb-10 sm:px-6 lg:px-8',
        wide ? 'max-w-5xl' : 'max-w-md md:max-w-xl',
        className,
      )}
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      {children}
    </main>
  );
}

/* --------------------------------------------------------------- Top bar */

export function TopBar({
  title,
  onBack,
  right,
  eyebrow,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex items-start gap-3 pt-2 pb-5">
      {onBack && (
        <button onClick={onBack} className="circle-btn mt-0.5" aria-label="Go back">
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            {eyebrow}
          </p>
        )}
        <h1 className="display text-[26px] leading-[0.92] md:text-[32px]">{title}</h1>
      </div>
      {right}
    </div>
  );
}

/* -------------------------------------------------------------- Progress */

export function StepRail({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-4 flex items-center gap-1.5" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cx(
            'h-1 flex-1 rounded-full transition-colors',
            i < step ? 'bg-primary' : 'bg-line',
          )}
        />
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- Buttons */

export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = 'button',
  tone = 'primary',
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  tone?: 'primary' | 'neutral';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold uppercase tracking-wide transition active:scale-[0.98] disabled:cursor-not-allowed',
        tone === 'primary'
          ? 'bg-primary text-on-primary hover:opacity-90 disabled:bg-well disabled:text-faint disabled:hover:opacity-100'
          : 'bg-card text-content hover:opacity-90 disabled:text-faint',
      )}
    >
      {children}
    </button>
  );
}

/** Sticky action bar pinned above the home indicator. */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="sticky bottom-0 z-20 -mx-4 mt-6 bg-gradient-to-t from-surface via-surface to-transparent px-4 pt-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto max-w-md">{children}</div>
    </div>
  );
}

/* --------------------------------------------------------------- Choices */

export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  columns = 1,
}: {
  label: string;
  options: readonly T[];
  value: T | '';
  onChange: (v: T) => void;
  columns?: 1 | 2;
}) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-2.5 text-[13px] font-semibold text-muted">{label}</legend>
      <div className={cx('grid gap-2', columns === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={active}
              className={cx(
                'flex min-h-[48px] items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left text-[14px] font-medium transition',
                active
                  ? 'bg-primary text-on-primary'
                  : 'bg-card text-muted hover:text-content active:opacity-80',
              )}
            >
              <span className="leading-snug">{opt}</span>
              {active && <Check className="h-4 w-4 shrink-0" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="mb-6 block">
      <span className="mb-2.5 block text-[13px] font-semibold text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="name"
        className="w-full rounded-2xl bg-card px-4 py-3.5 text-[15px] text-content outline-none placeholder:text-faint focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}

/* ---------------------------------------------------------------- Likert */

/**
 * 7-point scale. Sized so all seven targets fit within a 375px viewport
 * (343px of content ÷ 7 with 6px gaps ≈ 44px each), capped on desktop.
 */
export function LikertScale({
  value,
  onChange,
  leftAnchor,
  rightAnchor,
  name,
}: {
  value: number;
  onChange: (v: number) => void;
  leftAnchor: string;
  rightAnchor: string;
  name: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <span className="max-w-[42%] text-[11px] font-medium leading-tight text-faint sm:text-[12px]">
          {leftAnchor}
        </span>
        <span className="max-w-[42%] text-right text-[11px] font-medium leading-tight text-faint sm:text-[12px]">
          {rightAnchor}
        </span>
      </div>
      <div
        className="grid grid-cols-7 gap-1.5 sm:mx-auto sm:max-w-sm"
        role="radiogroup"
        aria-label={`${name}. 1 is ${leftAnchor}, 7 is ${rightAnchor}.`}
      >
        {[1, 2, 3, 4, 5, 6, 7].map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={
                n === 1 ? `1, ${leftAnchor}` : n === 7 ? `7, ${rightAnchor}` : `${n} of 7`
              }
              onClick={() => onChange(n)}
              className={cx(
                'flex aspect-square items-center justify-center rounded-full text-[14px] font-bold transition',
                active
                  ? 'bg-primary text-on-primary'
                  : 'bg-well text-faint hover:text-muted active:opacity-80',
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LikertQuestion({
  index,
  question,
  value,
  onChange,
  leftAnchor = 'Strongly disagree',
  rightAnchor = 'Strongly agree',
}: {
  index: number;
  question: string;
  value: number;
  onChange: (v: number) => void;
  leftAnchor?: string;
  rightAnchor?: string;
}) {
  return (
    <div className="mb-5 rounded-[22px] bg-card p-4 sm:p-5">
      <p className="mb-4 flex gap-2.5 text-[14px] font-medium leading-snug sm:text-[15px]">
        <span className="shrink-0 font-bold text-primary">{index}.</span>
        <span>{question}</span>
      </p>
      <LikertScale
        value={value}
        onChange={onChange}
        leftAnchor={leftAnchor}
        rightAnchor={rightAnchor}
        name={question}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ Misc */

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-well px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </span>
  );
}
