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
  pauseFocus,
  resetFocusTimer,
  saveFocusTimer,
  startFocus,
  subscribeToAuth,
  subscribeToFocusTimer,
} from "../services/focus.service";

function formatTime(milliseconds: number) {
  const totalSeconds = Math.floor(
    milliseconds / 1000
  );

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds =
    totalSeconds % 60;

  return [
    hours.toString().padStart(2, "0"),

    minutes.toString().padStart(2, "0"),

    seconds.toString().padStart(2, "0"),
  ].join(":");
}

export default function FocusTimer() {
  const [timer, setTimer] =
    useState<FocusItem | null>(null);

  const [currentTime, setCurrentTime] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  /* =====================================================
     CURRENT TIME
     ===================================================== */

  useEffect(() => {
    if (!timer?.running) {
      return;
    }

    const updateTime = () => {
      setCurrentTime(
        new Date().getTime()
      );
    };

    updateTime();

    const interval =
      window.setInterval(
        updateTime,
        1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [timer?.running]);

  /* =====================================================
     AUTH + FIRESTORE
     ===================================================== */

  useEffect(() => {
    let unsubscribeTimer:
      (() => void) | null = null;

    const unsubscribeAuth =
      subscribeToAuth(
        (user: User | null) => {
          setLoading(true);

          if (unsubscribeTimer) {
            unsubscribeTimer();

            unsubscribeTimer = null;
          }

          if (!user) {
            setTimer(null);

            setLoading(false);

            return;
          }

          unsubscribeTimer =
            subscribeToFocusTimer(
              user,
              (firestoreTimer) => {
                if (firestoreTimer) {
                  setTimer(
                    firestoreTimer
                  );
                } else {
                  const newTimer =
                    createDefaultFocusItem();

                  setTimer(newTimer);

                  void saveFocusTimer(
                    newTimer
                  );
                }

                setLoading(false);
              }
            );
        }
      );

    return () => {
      unsubscribeAuth();

      if (unsubscribeTimer) {
        unsubscribeTimer();
      }
    };
  }, []);

  /* =====================================================
     START
     ===================================================== */

  const handleStart =
    useCallback(async () => {
      if (!timer || saving) {
        return;
      }

      const now =
        new Date().getTime();

      const updated =
        startFocus(
          timer,
          now
        );

      setTimer(updated);

      setSaving(true);

      try {
        await saveFocusTimer(
          updated
        );
      } finally {
        setSaving(false);
      }
    }, [timer, saving]);

  /* =====================================================
     PAUSE
     ===================================================== */

  const handlePause =
    useCallback(async () => {
      if (!timer || saving) {
        return;
      }

      const now =
        new Date().getTime();

      const updated =
        pauseFocus(
          timer,
          now
        );

      setTimer(updated);

      setSaving(true);

      try {
        await saveFocusTimer(
          updated
        );
      } finally {
        setSaving(false);
      }
    }, [timer, saving]);

  /* =====================================================
     RESET
     ===================================================== */

  const handleReset =
    useCallback(async () => {
      if (saving) {
        return;
      }

      setSaving(true);

      try {
        const resetTimer =
          await resetFocusTimer();

        setTimer(resetTimer);
      } finally {
        setSaving(false);
      }
    }, [saving]);

  /* =====================================================
     LOADING
     ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <div className="text-sm text-slate-500">
          Loading focus timer...
        </div>
      </div>
    );
  }

  /* =====================================================
     NOT LOGGED IN
     ===================================================== */

  if (!timer) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Focus Timer
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Please login to use your Focus Timer.
        </p>
      </div>
    );
  }

  /* =====================================================
     DISPLAY TIME
     ===================================================== */

  const time =
    currentTime === null
      ? timer.elapsed
      : getElapsedTime(
          timer,
          currentTime
        );

  return (
    <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="text-center">
        <p className="text-sm font-medium text-slate-500">
          Focus Timer
        </p>

        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          {timer.title}
        </h2>

        <div className="mt-8 font-mono text-5xl font-bold tracking-wider text-slate-900">
          {formatTime(time)}
        </div>

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

        {timer.running && (
          <p className="mt-5 text-xs font-medium text-green-600">
            Timer is running
          </p>
        )}
      </div>
    </div>
  );
}