/**
 * useCountdownTimer — reusable countdown engine.
 *
 * Architecture
 * ------------
 * 1. Seed remainingMs from endsAt − now.
 * 2. While AppState === active: drain remainingMs every tick.
 * 3. On background/inactive (pauseInBackground): freeze remainingMs.
 * 4. On foreground: report pausedMs via onPauseCredit so parent can
 *    extend server ends_at (keeps auto-save / expiry in sync).
 * 5. Once when remaining ≤ warningThreshold → onLowTimeWarning.
 * 6. Once when remaining ≤ 0 → onAutoSubmit.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { formatCountdown } from './formatCountdown';

export type UseCountdownTimerOptions = {
  /** ISO deadline used to seed (and re-seed) remaining time */
  endsAt: string;
  /** Freeze ticks while app is backgrounded. Default true. */
  pauseInBackground?: boolean;
  /** Seconds at/below which low-time warning fires once. Default 300. */
  warningThresholdSeconds?: number;
  /** Stop ticking (e.g. attempt already closed). */
  enabled?: boolean;
  onLowTimeWarning?: () => void;
  /** Fired once at zero — wire to auto-submit. */
  onAutoSubmit?: () => void;
  /** Background pause duration to credit on the server. */
  onPauseCredit?: (pausedMs: number) => void;
};

export type CountdownTimerState = {
  remainingMs: number;
  remainingSeconds: number;
  isWarning: boolean;
  isExpired: boolean;
  isPaused: boolean;
  formatted: string;
};

function msUntil(endsAt: string): number {
  const end = Date.parse(endsAt);
  if (Number.isNaN(end)) return 0;
  return Math.max(0, end - Date.now());
}

export function useCountdownTimer({
  endsAt,
  pauseInBackground = true,
  warningThresholdSeconds = 5 * 60,
  enabled = true,
  onLowTimeWarning,
  onAutoSubmit,
  onPauseCredit,
}: UseCountdownTimerOptions): CountdownTimerState {
  const [remainingMs, setRemainingMs] = useState(() => msUntil(endsAt));
  const [isPaused, setIsPaused] = useState(false);

  const warningFired = useRef(false);
  const submitFired = useRef(false);
  const backgroundedAt = useRef<number | null>(null);
  const remainingRef = useRef(remainingMs);
  const lastTickAt = useRef(Date.now());
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const onLowTimeWarningRef = useRef(onLowTimeWarning);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const onPauseCreditRef = useRef(onPauseCredit);
  onLowTimeWarningRef.current = onLowTimeWarning;
  onAutoSubmitRef.current = onAutoSubmit;
  onPauseCreditRef.current = onPauseCredit;

  const applyRemaining = useCallback(
    (next: number) => {
      const clamped = Math.max(0, next);
      remainingRef.current = clamped;
      setRemainingMs(clamped);

      const seconds = Math.ceil(clamped / 1000);
      if (
        !warningFired.current &&
        seconds > 0 &&
        seconds <= warningThresholdSeconds
      ) {
        warningFired.current = true;
        onLowTimeWarningRef.current?.();
      }
      if (clamped <= 0 && !submitFired.current) {
        submitFired.current = true;
        onAutoSubmitRef.current?.();
      }
    },
    [warningThresholdSeconds],
  );

  // Re-seed when server extends endsAt after pause credit
  useEffect(() => {
    const next = msUntil(endsAt);
    remainingRef.current = next;
    setRemainingMs(next);
    lastTickAt.current = Date.now();
    if (next > warningThresholdSeconds * 1000) {
      warningFired.current = false;
    }
    if (next > 0) {
      submitFired.current = false;
    }
  }, [endsAt, warningThresholdSeconds]);

  // AppState pause / resume
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      if (!pauseInBackground || !enabled) return;

      const leaving =
        prev === 'active' && (next === 'background' || next === 'inactive');
      const returning =
        (prev === 'background' || prev === 'inactive') && next === 'active';

      if (leaving) {
        backgroundedAt.current = Date.now();
        setIsPaused(true);
        return;
      }

      if (returning && backgroundedAt.current != null) {
        const pausedMs = Math.max(0, Date.now() - backgroundedAt.current);
        backgroundedAt.current = null;
        setIsPaused(false);
        lastTickAt.current = Date.now();
        if (pausedMs > 0) {
          onPauseCreditRef.current?.(pausedMs);
        }
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [enabled, pauseInBackground]);

  // Countdown tick
  useEffect(() => {
    if (!enabled) return;
    if (pauseInBackground && isPaused) return;

    lastTickAt.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      if (!pauseInBackground) {
        applyRemaining(msUntil(endsAt));
        return;
      }
      const delta = now - lastTickAt.current;
      lastTickAt.current = now;
      applyRemaining(remainingRef.current - delta);
    }, 250);

    return () => clearInterval(id);
  }, [applyRemaining, enabled, endsAt, isPaused, pauseInBackground]);

  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return {
    remainingMs,
    remainingSeconds,
    isWarning:
      remainingSeconds > 0 && remainingSeconds <= warningThresholdSeconds,
    isExpired: remainingMs <= 0,
    isPaused: pauseInBackground && isPaused,
    formatted: formatCountdown(remainingSeconds),
  };
}
