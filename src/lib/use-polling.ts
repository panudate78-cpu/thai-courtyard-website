"use client";

import { useEffect, useRef, useState } from "react";
import { describeWindowResume, isServiceWindowOpen, msUntilWindowChange } from "./refresh-schedule";

type PollOptions = {
  /** How long to wait between refreshes while the window is open. */
  intervalMs: number;
  /** Skip polling entirely (e.g. read-only panels). Defaults to true. */
  enabled?: boolean;
  /**
   * Refresh straight away on mount. Off by default: the server already sent
   * fresh data with the page, so an immediate poll would be a duplicate query.
   */
  immediate?: boolean;
};

/**
 * Polls `run` on a timer, but only when it is worth a database query:
 *
 * - inside the service window (Tue – Sat, 12:00 – 21:00 UK time), and
 * - while the tab is actually visible.
 *
 * Outside the window nothing is scheduled except a single wake-up for the
 * moment the window opens, so an admin tab left open overnight no longer keeps
 * the database (and its compute bill) awake. Hidden tabs stop polling too and
 * refresh once when they come back.
 */
export function usePolling(run: () => void | Promise<void>, { intervalMs, enabled = true, immediate = false }: PollOptions) {
  const runRef = useRef(run);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const stopTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const visible = () => document.visibilityState !== "hidden";

    function schedule() {
      stopTimer();
      if (cancelled) return;
      if (!visible()) return; // a visibilitychange listener restarts us
      // While open, wait one interval; while closed, sleep until the window flips.
      const delay = isServiceWindowOpen() ? intervalMs : msUntilWindowChange();
      timer = setTimeout(() => void tick(), Math.max(1_000, delay));
    }

    async function tick() {
      if (cancelled) return;
      if (isServiceWindowOpen() && visible()) {
        try {
          await runRef.current();
        } catch {
          // Callers surface their own errors; a failed poll must not stop the timer.
        }
      }
      schedule();
    }

    const onVisibility = () => {
      if (!visible()) {
        stopTimer();
        return;
      }
      void tick();
    };

    if (immediate && isServiceWindowOpen() && visible()) void tick();
    else schedule();

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      stopTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, immediate, intervalMs]);
}

export type ServiceWindowState = {
  /** null until mounted, so the server and client markup match. */
  open: boolean | null;
  /** Human answer for "when does auto-refresh come back?" */
  resumes: string;
};

/** Tracks whether the service window is open, re-checking every 30 seconds. */
export function useServiceWindow(): ServiceWindowState {
  const [state, setState] = useState<ServiceWindowState>({ open: null, resumes: "" });

  useEffect(() => {
    const update = () =>
      setState((prev) => {
        const open = isServiceWindowOpen();
        const resumes = open ? "" : describeWindowResume();
        return prev.open === open && prev.resumes === resumes ? prev : { open, resumes };
      });

    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return state;
}
