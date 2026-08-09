"use client";

import { useMemo } from "react";

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
 * গত ৭ দিনের তারিখ
 */
const getLastSevenDays = () => {
  const days: Date[] = [];

  for (let index = 6; index >= 0; index--) {
    const date = new Date();

    date.setHours(0, 0, 0, 0);

    date.setDate(
      date.getDate() - index
    );

    days.push(date);
  }

  return days;
};

export default function HabitCard({
  habit,
  completions,
  onToggle,
}: HabitCardProps) {
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
    return parseDate(habit.startDate);
  }, [habit.startDate]);

  /**
   * Habit End Date
   */
  const endDate = useMemo(() => {
    return parseDate(habit.endDate);
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
   * কত দিন ইতিমধ্যে পার হয়েছে
   *
   * Start Date-এর আগে কোনো দিন count হবে না।
   * End Date-এর পরে target-এর বেশি count হবে না।
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
   *
   * আজ থেকে পিছনের দিকে
   * ধারাবাহিকভাবে কত দিন complete
   */
  const currentStreak = useMemo(() => {
    let streak = 0;

    const currentDate = new Date(
      today
    );

    /**
     * যদি Habit এখনো শুরু না হয়ে থাকে
     */
    if (today < startDate) {
      return 0;
    }

    /**
     * End Date পার হয়ে গেলে
     * End Date থেকে হিসাব শুরু হবে।
     */
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
   * Last 7 Days
   */
  const lastSevenDays =
    getLastSevenDays();

  /**
   * Format Date in Bangla
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

  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {habit.name}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {habit.targetDays} দিনের অভ্যাস
          </p>

          <p className="mt-1 text-sm text-gray-500">
            প্রতিদিন {habit.time}
          </p>
        </div>

        <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
          {progress}%
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-4 rounded-xl bg-gray-50 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">
              শুরু
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-800">
              {formatDate(
                habit.startDate
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              শেষ
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-800">
              {formatDate(
                habit.endDate
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 7 Days */}
      <div className="mt-5">
        <p className="mb-3 text-sm font-medium text-gray-700">
          গত ৭ দিন
        </p>

        <div className="grid grid-cols-7 gap-2">
          {lastSevenDays.map(
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
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-xs transition ${
                    completed
                      ? "border-green-200 bg-green-50 text-green-600"
                      : isDisabled
                      ? "border-gray-100 bg-gray-100 text-gray-300"
                      : "border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <span>
                    {date.toLocaleDateString(
                      "bn-BD",
                      {
                        weekday:
                          "short",
                      }
                    )}
                  </span>

                  <span className="mt-1 text-sm font-semibold">
                    {date.getDate()}
                  </span>

                  {completed && (
                    <span className="mt-0.5">
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
      <div className="mt-5 grid grid-cols-3 gap-3">
        {/* Target */}
        <div className="rounded-xl bg-blue-50 p-3 text-center">
          <p className="text-xs text-gray-500">
            লক্ষ্য
          </p>

          <p className="mt-1 text-lg font-bold text-gray-900">
            {habit.targetDays}
          </p>
        </div>

        {/* Completed */}
        <div className="rounded-xl bg-green-50 p-3 text-center">
          <p className="text-xs text-gray-500">
            সম্পন্ন
          </p>

          <p className="mt-1 text-lg font-bold text-green-600">
            {completedCount}
          </p>
        </div>

        {/* Missed */}
        <div className="rounded-xl bg-red-50 p-3 text-center">
          <p className="text-xs text-gray-500">
            বাদ
          </p>

          <p className="mt-1 text-lg font-bold text-red-500">
            {missedCount}
          </p>
        </div>
      </div>

      {/* Streak */}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
        <span className="text-sm text-gray-600">
          ধারাবাহিকতা
        </span>

        <span className="font-bold text-orange-600">
          🔥 {currentStreak} দিন
        </span>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            অগ্রগতি
          </span>

          <span className="font-semibold text-gray-700">
            {completedCount}/
            {habit.targetDays} (
            {progress}%)
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </article>
  );
}