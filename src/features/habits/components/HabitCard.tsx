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
  ) => void;
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
 * এই সপ্তাহের দিনগুলো
 *
 * Week starts:
 * Saturday
 *
 * Saturday → Friday
 */
const getCurrentWeekDays = () => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const day = today.getDay();

  /**
   * JavaScript:
   * Sunday = 0
   * Monday = 1
   * Tuesday = 2
   * Wednesday = 3
   * Thursday = 4
   * Friday = 5
   * Saturday = 6
   *
   * Saturday কে week start করতে:
   */
  const daysFromSaturday =
    (day + 1) % 7;

  const saturday = new Date(today);

  saturday.setDate(
    today.getDate() -
      daysFromSaturday
  );

  const days: Date[] = [];

  for (let index = 0; index < 7; index++) {
    const date = new Date(saturday);

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
 * Example:
 * 13:00 → 1:00 PM
 * 14:00 → 2:00 PM
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

  if (
    Number.isNaN(hour)
  ) {
    return time;
  }

  const period =
    hour >= 12 ? "PM" : "AM";

  const displayHour =
    hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
};

/**
 * Bangla date
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
}: HabitCardProps) {
  /**
   * Expand / Collapse
   */
  const [expanded, setExpanded] =
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
   * Habit Start Date
   */
  const startDate = useMemo(() => {
    return parseDate(
      habit.startDate
    );
  }, [habit.startDate]);

  /**
   * Habit End Date
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
   * Saturday → Friday
   */
  const currentWeekDays =
    getCurrentWeekDays();

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">

      {/* =========================
          COMPACT HEADER
      ========================== */}

      <div className="flex items-center gap-4 p-4 sm:p-5">

        {/* Progress Circle */}
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[7px] border-slate-100 sm:h-20 sm:w-20">

          <div
            className="absolute inset-[-7px] rounded-full"
            style={{
              background: `conic-gradient(
                #2563eb ${progress * 3.6}deg,
                transparent ${progress * 3.6}deg
              )`,
              mask:
                "radial-gradient(farthest-side, transparent calc(100% - 7px), #000 0)",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 7px), #000 0)",
            }}
          />

          <span className="relative text-sm font-bold text-slate-800 sm:text-base">
            {progress}%
          </span>
        </div>

        {/* Habit Main Info */}
        <div className="min-w-0 flex-1">

          <h3 className="line-clamp-2 text-base font-bold text-slate-900 sm:text-lg">
            {habit.name}
          </h3>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {habit.targetDays} দিনের অভ্যাস

            <span className="mx-1.5">
              •
            </span>

            প্রতিদিন{" "}
            {formatTime12Hour(
              habit.time
            )}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">

            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
              {progress}% সম্পন্ন
            </span>

            <span className="text-xs text-slate-500">
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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
        >
          <svg
            width="20"
            height="20"
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
        <div className="border-t border-slate-100 px-4 pb-5 pt-4 sm:px-5">

          {/* Timeline */}
          <div className="rounded-xl bg-slate-50 p-4">

            <div className="grid grid-cols-2 gap-4">

              <div>
                <p className="text-xs text-slate-500">
                  শুরু
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {formatDate(
                    habit.startDate
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  শেষ
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
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

          <div className="mt-5">

            <div className="mb-3 flex items-center justify-between">

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  এই সপ্তাহ
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  শনিবার থেকে শুক্রবার
                </p>
              </div>

              {/* Time */}
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                {formatTime12Hour(
                  habit.time
                )}
              </span>

            </div>

            {/* Week */}
            <div className="relative">

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">

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
                        disabled={
                          isDisabled
                        }
                        onClick={() =>
                          onToggle(
                            dateKey,
                            !completed
                          )
                        }
                        className={`relative flex min-h-[72px] flex-col items-center justify-center rounded-xl border text-[10px] transition sm:min-h-[80px] sm:text-xs ${
                          completed
                            ? "border-green-200 bg-green-50 text-green-600"
                            : isDisabled
                            ? "border-slate-100 bg-slate-100 text-slate-300"
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-200 hover:bg-blue-50"
                        }`}
                      >

                        {/* Today */}
                        {isToday && (
                          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
                        )}

                        <span className="font-medium">
                          {weekday}
                        </span>

                        <span className="mt-1 text-base font-bold">
                          {date.getDate()}
                        </span>

                        {completed && (
                          <span className="mt-0.5 text-sm">
                            ✓
                          </span>
                        )}

                      </button>
                    );
                  }
                )}

              </div>

            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">

            {/* Target */}
            <div className="rounded-xl bg-blue-50 p-3 text-center">

              <p className="text-xs text-slate-500">
                লক্ষ্য
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {habit.targetDays}
              </p>

            </div>

            {/* Completed */}
            <div className="rounded-xl bg-green-50 p-3 text-center">

              <p className="text-xs text-slate-500">
                সম্পন্ন
              </p>

              <p className="mt-1 text-lg font-bold text-green-600">
                {completedCount}
              </p>

            </div>

            {/* Missed */}
            <div className="rounded-xl bg-red-50 p-3 text-center">

              <p className="text-xs text-slate-500">
                বাদ
              </p>

              <p className="mt-1 text-lg font-bold text-red-500">
                {missedCount}
              </p>

            </div>

          </div>

          {/* Streak */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">

            <span className="text-sm text-slate-600">
              ধারাবাহিকতা
            </span>

            <span className="font-bold text-orange-600">
              🔥 {currentStreak} দিন
            </span>

          </div>

          {/* Progress */}
          <div className="mt-4">

            <div className="mb-2 flex items-center justify-between text-sm">

              <span className="text-slate-500">
                অগ্রগতি
              </span>

              <span className="font-semibold text-slate-700">
                {completedCount}/
                {habit.targetDays} (
                {progress}%)
              </span>

            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">

              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

          </div>

        </div>
      )}

    </article>
  );
}