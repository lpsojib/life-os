"use client";

import { useEffect, useState } from "react";

import {
  deleteHabit,
  getCompletedHabits,
  getHabitCompletions,
} from "../services/habit.service";

import {
  Habit,
  HabitCompletion,
} from "../types/habit.types";

interface HistoryItem {
  habit: Habit;
  completions: HabitCompletion[];
}

/**
 * YYYY-MM-DD → Bangla Date
 */
const formatDate = (dateString: string) => {
  if (!dateString) {
    return "";
  }

  const [year, month, day] =
    dateString.split("-").map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  return date.toLocaleDateString(
    "bn-BD",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
};

export default function HabitHistory() {
  const [items, setItems] =
    useState<HistoryItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /**
   * Load completed habits
   */
  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const habits =
          await getCompletedHabits();

        const history =
          await Promise.all(
            habits.map(async (habit) => {
              const completions =
                await getHabitCompletions(
                  habit.id
                );

              return {
                habit,
                completions,
              };
            })
          );

        if (cancelled) {
          return;
        }

        setItems(history);
      } catch (error) {
        console.error(
          "Load habit history error:",
          error
        );

        if (cancelled) {
          return;
        }

        setError(
          "অভ্যাসের ইতিহাস লোড করা যায়নি।"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Delete completed habit
   */
  const handleDelete = async (
    habitId: string
  ) => {
    const confirmed =
      window.confirm(
        "এই অভ্যাসের ইতিহাস মুছে ফেলতে চান?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteHabit(habitId);

      setItems((currentItems) =>
        currentItems.filter(
          (item) =>
            item.habit.id !== habitId
        )
      );
    } catch (error) {
      console.error(
        "Delete habit history error:",
        error
      );

      setError(
        "ইতিহাস মুছে ফেলা যায়নি।"
      );
    }
  };

  /**
   * Loading
   */
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <p className="text-gray-500">
          ইতিহাস লোড হচ্ছে...
        </p>
      </div>
    );
  }

  /**
   * Error
   */
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-600">
          {error}
        </p>
      </div>
    );
  }

  /**
   * Empty History
   */
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <p className="text-lg font-semibold text-gray-800">
          এখনো কোনো ইতিহাস নেই।
        </p>

        <p className="mt-1 text-sm text-gray-500">
          সম্পন্ন হওয়া অভ্যাস এখানে
          দেখা যাবে।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(
        ({ habit, completions }) => {
          /**
           * Completed days
           */
          const completedCount =
            completions.filter(
              (item) =>
                item.completed
            ).length;

          /**
           * Missed days
           */
          const missedCount =
            Math.max(
              0,
              habit.targetDays -
                completedCount
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

          return (
            <article
              key={habit.id}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {habit.name}
                    </h3>

                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
                      সম্পন্ন
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    লক্ষ্য ছিল{" "}
                    {habit.targetDays}{" "}
                    দিন
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    প্রতিদিন{" "}
                    {habit.time}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleDelete(
                      habit.id
                    )
                  }
                  className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                >
                  মুছুন
                </button>
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

              {/* Progress */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    অগ্রগতি
                  </span>

                  <span className="font-semibold text-gray-700">
                    {completedCount}/
                    {habit.targetDays}{" "}
                    ({progress}%)
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

              {/* Completion Records */}
              {completions.length >
                0 && (
                <div className="mt-5">
                  <p className="mb-3 text-sm font-medium text-gray-700">
                    সম্পন্ন করার দিন
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {completions
                      .filter(
                        (item) =>
                          item.completed
                      )
                      .map(
                        (item) => (
                          <span
                            key={
                              item.id
                            }
                            className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600"
                          >
                            ✓{" "}
                            {formatDate(
                              item.date
                            )}
                          </span>
                        )
                      )}
                  </div>
                </div>
              )}
            </article>
          );
        }
      )}
    </div>
  );
}