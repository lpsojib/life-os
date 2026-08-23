"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type { User } from "firebase/auth";

import type { FocusItem } from "../types/focus.types";

import {
  createDefaultFocusItem,
  getElapsedTime,
  loadFocusTimer,
  pauseFocus,
  resetFocusTimer,
  saveFocusTimer,
  startFocus,
  subscribeToAuth,
} from "../services/focus.service";

/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatTime(
  milliseconds: number
): string {
  const totalSeconds = Math.floor(
    Math.max(0, milliseconds) / 1000
  );

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");
}

/* =========================================================
   FOCUS TIMER
   ========================================================= */

export default function FocusTimer() {
  const [user, setUser] =
    useState<User | null>(null);

  const [timer, setTimer] =
    useState<FocusItem | null>(null);

  /*
   * 0 is used as initial value.
   *
   * No Date.now() during render.
   */
  const [now, setNow] =
    useState<number>(0);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     AUTH + FIRESTORE
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const unsubscribe =
      subscribeToAuth(
        async (currentUser) => {
          if (cancelled) {
            return;
          }

          setUser(currentUser);
          setError(null);
          setLoading(true);

          /*
           * Logged out
           */
          if (!currentUser) {
            setTimer(null);
            setLoading(false);
            return;
          }

          try {
            /*
             * Load permanent timer
             * from Firestore.
             */
            const savedTimer =
              await loadFocusTimer(
                currentUser
              );

            if (cancelled) {
              return;
            }

            /*
             * Existing timer found.
             */
            if (savedTimer) {
              setTimer(savedTimer);
              setLoading(false);
              return;
            }

            /*
             * First timer for this account.
             */
            const newTimer =
              createDefaultFocusItem();

            await saveFocusTimer(
              currentUser,
              newTimer
            );

            if (cancelled) {
              return;
            }

            setTimer(newTimer);
          } catch (err) {
            console.error(
              "Failed to load Focus Timer:",
              err
            );

            if (!cancelled) {
              setTimer(null);

              setError(
                "Focus Timer load করতে সমস্যা হয়েছে।"
              );
            }
          } finally {
            if (!cancelled) {
              setLoading(false);
            }
          }
        }
      );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  /* =======================================================
     TIMER CLOCK
     ======================================================= */

  useEffect(() => {
    /*
     * If timer is not running,
     * there is nothing to subscribe to.
     *
     * No setState here.
     */
    if (!timer?.running) {
      return;
    }

    /*
     * Timer is running.
     *
     * First update happens asynchronously,
     * avoiding synchronous setState inside
     * the effect body.
     */
    const firstUpdate =
      window.setTimeout(() => {
        setNow(Date.now());
      }, 0);

    const interval =
      window.setInterval(() => {
        setNow(Date.now());
      }, 1000);

    return () => {
      window.clearTimeout(
        firstUpdate
      );

      window.clearInterval(
        interval
      );
    };
  }, [timer?.running]);

  /* =======================================================
     START
     ======================================================= */

  const handleStart =
    useCallback(async () => {
      if (
        !user ||
        !timer ||
        saving
      ) {
        return;
      }

      const startTime =
        Date.now();

      const updatedTimer =
        startFocus(
          timer,
          startTime
        );

      setSaving(true);
      setError(null);

      try {
        await saveFocusTimer(
          user,
          updatedTimer
        );

        setTimer(
          updatedTimer
        );

        /*
         * This happens from a click
         * handler, not render/effect.
         */
        setNow(startTime);
      } catch (err) {
        console.error(
          "Failed to start timer:",
          err
        );

        setError(
          "Timer start save করা যায়নি।"
        );
      } finally {
        setSaving(false);
      }
    }, [
      user,
      timer,
      saving,
    ]);

  /* =======================================================
     PAUSE
     ======================================================= */

  const handlePause =
    useCallback(async () => {
      if (
        !user ||
        !timer ||
        saving
      ) {
        return;
      }

      const pauseTime =
        Date.now();

      const updatedTimer =
        pauseFocus(
          timer,
          pauseTime
        );

      setSaving(true);
      setError(null);

      try {
        await saveFocusTimer(
          user,
          updatedTimer
        );

        setTimer(
          updatedTimer
        );
      } catch (err) {
        console.error(
          "Failed to pause timer:",
          err
        );

        setError(
          "Timer pause save করা যায়নি।"
        );
      } finally {
        setSaving(false);
      }
    }, [
      user,
      timer,
      saving,
    ]);

  /* =======================================================
     RESET
     ======================================================= */

  const handleReset =
    useCallback(async () => {
      if (
        !user ||
        !timer ||
        saving
      ) {
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const resetTimer =
          await resetFocusTimer(
            user,
            timer
          );

        setTimer(
          resetTimer
        );
      } catch (err) {
        console.error(
          "Failed to reset timer:",
          err
        );

        setError(
          "Timer reset save করা যায়নি।"
        );
      } finally {
        setSaving(false);
      }
    }, [
      user,
      timer,
      saving,
    ]);

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <div className="text-sm text-slate-500">
          Loading focus timer...
        </div>
      </div>
    );
  }

  /* =======================================================
     NOT LOGGED IN
     ======================================================= */

  if (!user) {
    return (
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Focus Timer
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Please login to use your Focus Timer.
        </p>
      </div>
    );
  }

  /* =======================================================
     TIMER NOT AVAILABLE
     ======================================================= */

  if (!timer) {
    return (
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Focus Timer
        </h2>

        <p className="mt-3 text-sm text-red-500">
          {error ??
            "Focus Timer পাওয়া যায়নি।"}
        </p>
      </div>
    );
  }

  /* =======================================================
     DISPLAY TIME
     ======================================================= */

  /*
   * When running:
   *
   * now > 0
   *      ↓
   * calculate live elapsed
   *
   * When paused:
   *
   * timer.elapsed
   *      ↓
   * display saved time
   */
  const displayNow =
    timer.running && now > 0
      ? now
      : timer.startedAt ??
        0;

  const elapsed =
    getElapsedTime(
      timer,
      displayNow
    );

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

      <div className="text-center">

        <p className="text-sm font-medium text-slate-500">
          Focus Timer
        </p>

        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          {timer.title}
        </h2>

        {/* TIME */}

        <div className="mt-8 font-mono text-5xl font-bold tracking-wider text-slate-900">
          {formatTime(elapsed)}
        </div>

        {/* ERROR */}

        {error && (
          <p className="mt-4 text-sm text-red-500">
            {error}
          </p>
        )}

        {/* BUTTONS */}

        <div className="mt-8 flex items-center justify-center gap-3">

          {!timer.running ? (
            <button
              type="button"
              onClick={() => {
                void handleStart();
              }}
              disabled={saving}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Start"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                void handlePause();
              }}
              disabled={saving}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Pause"}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              void handleReset();
            }}
            disabled={saving}
            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>

        </div>

        {/* STATUS */}

        {timer.running && (
          <p className="mt-5 text-xs font-medium text-green-600">
            Timer is running
          </p>
        )}

      </div>
    </div>
  );
}