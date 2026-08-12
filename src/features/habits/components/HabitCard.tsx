"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Habit,
  HabitCompletion,
} from "../types/habit.types";

interface HabitCardProps {
  habit: Habit;
  completions: HabitCompletion[];
  onToggle: (
    date: string,
    completed: boolean
  ) => void | Promise<void>;
  onDelete: (
    habitId: string
  ) => void | Promise<void>;
}

/**
 * Date → YYYY-MM-DD
 */
const getDateKey = (date: Date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * YYYY-MM-DD → Local Date
 */
const parseDate = (dateString: string) => {
  const [year, month, day] =
    dateString.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
};

/**
 * Current Week
 *
 * Saturday → Friday
 */
const getCurrentWeekDays = () => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const day = today.getDay();

  /**
   * JavaScript:
   *
   * Sunday = 0
   * Monday = 1
   * Tuesday = 2
   * Wednesday = 3
   * Thursday = 4
   * Friday = 5
   * Saturday = 6
   */

  const daysFromSaturday =
    (day + 1) % 7;

  const saturday = new Date(today);

  saturday.setDate(
    today.getDate() -
      daysFromSaturday
  );

  const days: Date[] = [];

  for (
    let index = 0;
    index < 7;
    index++
  ) {
    const date = new Date(
      saturday
    );

    date.setDate(
      saturday.getDate() + index
    );

    days.push(date);
  }

  return days;
};

/**
 * 12-hour time formatter
 *
 * 13:00 → 1:00 PM
 */
const formatTime12Hour = (
  time: string
) => {
  if (!time) {
    return "";
  }

  const parts = time.split(":");

  if (parts.length < 2) {
    return time;
  }

  const hour = Number(parts[0]);
  const minute = parts[1];

  if (Number.isNaN(hour)) {
    return time;
  }

  const period =
    hour >= 12 ? "PM" : "AM";

  const displayHour =
    hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
};

/**
 * Bangla Date
 */
const formatDate = (
  dateString: string
) => {
  if (!dateString) {
    return "";
  }

  return parseDate(
    dateString
  ).toLocaleDateString(
    "bn-BD",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
};

export default function HabitCard({
  habit,
  completions,
  onToggle,
  onDelete,
}: HabitCardProps) {
  /**
   * Expand / Collapse
   */
  const [expanded, setExpanded] =
    useState(false);

  /**
   * Delete Loading
   */
  const [deleting, setDeleting] =
    useState(false);

  /**
   * Completion Map
   */
  const completionMap = useMemo(() => {
    return new Map(
      completions.map((item) => [
        item.date,
        item.completed,
      ])
    );
  }, [completions]);

  /**
   * Completed Count
   */
  const completedCount = useMemo(() => {
    return completions.filter(
      (item) => item.completed
    ).length;
  }, [completions]);

  /**
   * Start Date
   */
  const startDate = useMemo(() => {
    return parseDate(
      habit.startDate
    );
  }, [habit.startDate]);

  /**
   * End Date
   */
  const endDate = useMemo(() => {
    return parseDate(
      habit.endDate
    );
  }, [habit.endDate]);

  /**
   * Today
   */
  const today = useMemo(() => {
    const date = new Date();

    date.setHours(0, 0, 0, 0);

    return date;
  }, []);

  /**
   * Elapsed Days
   */
  const elapsedDays = useMemo(() => {
    if (today < startDate) {
      return 0;
    }

    if (today >= endDate) {
      return habit.targetDays;
    }

    const difference =
      today.getTime() -
      startDate.getTime();

    return Math.min(
      habit.targetDays,
      Math.floor(
        difference /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
  }, [
    today,
    startDate,
    endDate,
    habit.targetDays,
  ]);

  /**
   * Missed Days
   */
  const missedCount = Math.max(
    0,
    elapsedDays - completedCount
  );

  /**
   * Progress
   */
  const progress =
    habit.targetDays > 0
      ? Math.min(
          100,
          Math.round(
            (completedCount /
              habit.targetDays) *
              100
          )
        )
      : 0;

  /**
   * Current Streak
   */
  const currentStreak = useMemo(() => {
    let streak = 0;

    const currentDate =
      new Date(today);

    if (today < startDate) {
      return 0;
    }

    if (today > endDate) {
      currentDate.setTime(
        endDate.getTime()
      );
    }

    while (
      currentDate >= startDate
    ) {
      const dateKey =
        getDateKey(currentDate);

      if (
        completionMap.get(dateKey)
      ) {
        streak++;

        currentDate.setDate(
          currentDate.getDate() - 1
        );
      } else {
        break;
      }
    }

    return streak;
  }, [
    today,
    startDate,
    endDate,
    completionMap,
  ]);

  /**
   * Current Week
   */
  const currentWeekDays =
    getCurrentWeekDays();

  /**
   * Delete Habit
   */
  const handleDelete = async () => {
    const confirmed =
      window.confirm(
        `আপনি কি "${habit.name}" habit টি delete করতে চান?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      await onDelete(habit.id);
    } catch (error) {
      console.error(
        "Delete habit error:",
        error
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* =========================
          COMPACT HEADER
      ========================== */}

      <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
        {/* Progress Circle */}

        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[6px] border-slate-100 sm:h-16 sm:w-16">
          <div
            className="absolute inset-[-6px] rounded-full"
            style={{
              background: `conic-gradient(
                #2563eb ${progress * 3.6}deg,
                transparent ${progress * 3.6}deg
              )`,
              mask:
                "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 0)",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 0)",
            }}
          />

          <span className="relative text-xs font-bold text-slate-800 sm:text-sm">
            {progress}%
          </span>
        </div>

        {/* Habit Main Info */}

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-bold text-slate-900 sm:text-base">
            {habit.name}
          </h3>

          <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
            {habit.targetDays} দিনের অভ্যাস
            <span className="mx-1">
              •
            </span>
            প্রতিদিন{" "}
            {formatTime12Hour(
              habit.time
            )}
          </p>

          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 sm:text-xs">
              {progress}% সম্পন্ন
            </span>

            <span className="text-[10px] text-slate-500 sm:text-xs">
              {completedCount}/
              {habit.targetDays} দিন
            </span>
          </div>
        </div>

        {/* Expand Arrow */}

        <button
          type="button"
          onClick={() =>
            setExpanded(
              (current) =>
                !current
            )
          }
          aria-label={
            expanded
              ? "Collapse habit details"
              : "Expand habit details"
          }
          aria-expanded={expanded}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 active:scale-95 sm:h-10 sm:w-10"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${
              expanded
                ? "rotate-180"
                : ""
            }`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* =========================
          EXPANDED CONTENT
      ========================== */}

      {expanded && (
        <div className="border-t border-slate-100 px-3 pb-4 pt-3 sm:px-4 sm:pb-5 sm:pt-4">
          {/* Timeline */}

          <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-slate-500 sm:text-xs">
                  শুরু
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-800 sm:text-sm">
                  {formatDate(
                    habit.startDate
                  )}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-500 sm:text-xs">
                  শেষ
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-800 sm:text-sm">
                  {formatDate(
                    habit.endDate
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* =========================
              WEEKLY TRACKER
          ========================== */}

          <div className="mt-4">
            <div className="mb-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  এই সপ্তাহ
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  শনিবার থেকে শুক্রবার
                </p>
              </div>

              <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600">
                {formatTime12Hour(
                  habit.time
                )}
              </span>
            </div>

            {/* Week */}

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {currentWeekDays.map(
                (date) => {
                  const dateKey =
                    getDateKey(date);

                  const completed =
                    completionMap.get(
                      dateKey
                    ) ?? false;

                  const isBeforeStart =
                    date < startDate;

                  const isAfterEnd =
                    date > endDate;

                  const isFuture =
                    date > today;

                  const isDisabled =
                    isBeforeStart ||
                    isAfterEnd ||
                    isFuture;

                  const weekday =
                    date.toLocaleDateString(
                      "bn-BD",
                      {
                        weekday: "short",
                      }
                    );

                  const isToday =
                    date.getTime() ===
                    today.getTime();

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      disabled={isDisabled}
                      onClick={() =>
                        onToggle(
                          dateKey,
                          !completed
                        )
                      }
                      className={`relative flex min-h-[64px] flex-col items-center justify-center rounded-lg border text-[9px] transition sm:min-h-[72px] sm:text-[10px] ${
                        completed
                          ? "border-green-200 bg-green-50 text-green-600"
                          : isDisabled
                            ? "border-slate-100 bg-slate-100 text-slate-300"
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      {isToday && (
                        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                      )}

                      <span className="font-medium">
                        {weekday}
                      </span>

                      <span className="mt-0.5 text-sm font-bold sm:text-base">
                        {date.getDate()}
                      </span>

                      {completed && (
                        <span className="text-xs sm:text-sm">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Stats */}

          <div className="mt-4 grid grid-cols-3 gap-2">
            {/* Target */}

            <div className="rounded-lg bg-blue-50 p-2.5 text-center">
              <p className="text-[10px] text-slate-500 sm:text-xs">
                লক্ষ্য
              </p>

              <p className="mt-0.5 text-base font-bold text-slate-900 sm:text-lg">
                {habit.targetDays}
              </p>
            </div>

            {/* Completed */}

            <div className="rounded-lg bg-green-50 p-2.5 text-center">
              <p className="text-[10px] text-slate-500 sm:text-xs">
                সম্পন্ন
              </p>

              <p className="mt-0.5 text-base font-bold text-green-600 sm:text-lg">
                {completedCount}
              </p>
            </div>

            {/* Missed */}

            <div className="rounded-lg bg-red-50 p-2.5 text-center">
              <p className="text-[10px] text-slate-500 sm:text-xs">
                বাদ
              </p>

              <p className="mt-0.5 text-base font-bold text-red-500 sm:text-lg">
                {missedCount}
              </p>
            </div>
          </div>

          {/* Streak */}

          <div className="mt-3 flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2.5">
            <span className="text-xs text-slate-600 sm:text-sm">
              ধারাবাহিকতা
            </span>

            <span className="text-sm font-bold text-orange-600">
              🔥 {currentStreak} দিন
            </span>
          </div>

          {/* Progress */}

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                অগ্রগতি
              </span>

              <span className="font-semibold text-slate-700">
                {completedCount}/
                {habit.targetDays} (
                {progress}%)
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          {/* =========================
              DELETE
          ========================== */}

          <div className="mt-4 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() =>
                void handleDelete()
              }
              disabled={deleting}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-4"
            >
              {deleting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                  Delete হচ্ছে...
                </>
              ) : (
                <>
                  🗑️ Delete Habit
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}