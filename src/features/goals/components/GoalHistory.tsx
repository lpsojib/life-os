"use client";

import { useEffect, useState } from "react";

import {
  deleteGoal,
  getCompletedGoals,
  getGoalTasks,
} from "../services/goal.service";

import {
  Goal,
} from "../types/goal.types";

import {
  GoalTask,
} from "../types/goal-task.types";

interface HistoryItem {
  goal: Goal;
  tasks: GoalTask[];
}

const formatDate = (dateString: string) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const months = [
    "জানু",
    "ফেব্রু",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টে",
    "অক্টো",
    "নভে",
    "ডিসে",
  ];

  return `${date.getDate()} ${
    months[date.getMonth()]
  } ${date.getFullYear()}`;
};

export default function GoalHistory() {
  const [items, setItems] =
    useState<HistoryItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const goals =
          await getCompletedGoals();

        const history =
          await Promise.all(
            goals.map(async (goal) => {
              const tasks =
                await getGoalTasks(
                  goal.id
                );

              return {
                goal,
                tasks,
              };
            })
          );

        if (cancelled) {
          return;
        }

        setItems(history);
      } catch (error) {
        console.error(
          "Load goal history error:",
          error
        );

        if (cancelled) {
          return;
        }

        setError(
          "লক্ষ্যের ইতিহাস লোড করা যায়নি।"
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
   * Delete completed Goal
   */
  const handleDelete = async (
    goalId: string
  ) => {
    const confirmed =
      window.confirm(
        "এই লক্ষ্যটি এবং এর সব টাস্ক মুছে ফেলতে চান?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteGoal(goalId);

      setItems((currentItems) =>
        currentItems.filter(
          (item) =>
            item.goal.id !== goalId
        )
      );
    } catch (error) {
      console.error(
        "Delete goal history error:",
        error
      );

      setError(
        "লক্ষ্যের ইতিহাস মুছে ফেলা যায়নি।"
      );
    }
  };

  /**
   * Loading
   */
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <p className="text-sm text-gray-500">
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
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
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
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />

            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>

        <h3 className="mt-4 font-semibold text-gray-900">
          এখনো কোনো সম্পন্ন লক্ষ্য নেই
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          সম্পন্ন হওয়া লক্ষ্যগুলো এখানে দেখা যাবে।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(
        ({
          goal,
          tasks,
        }) => {
          const completedTasks =
            tasks.filter(
              (task) =>
                task.status ===
                "completed"
            ).length;

          const totalTasks =
            tasks.length;

          const progress =
            totalTasks > 0
              ? Math.min(
                  100,
                  Math.round(
                    (completedTasks /
                      totalTasks) *
                      100
                  )
                )
              : 100;

          return (
            <article
              key={goal.id}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {goal.title}
                    </h3>

                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
                      সম্পন্ন
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    {formatDate(
                      goal.startDate
                    )}{" "}
                    —{" "}
                    {formatDate(
                      goal.endDate
                    )}
                  </p>
                </div>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() =>
                    handleDelete(
                      goal.id
                    )
                  }
                  className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                >
                  মুছুন
                </button>
              </div>

              {/* Stats */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-center">
                  <p className="text-xs text-gray-500">
                    মোট টাস্ক
                  </p>

                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {totalTasks}
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 p-3 text-center">
                  <p className="text-xs text-gray-500">
                    সম্পন্ন
                  </p>

                  <p className="mt-1 text-lg font-bold text-green-600">
                    {completedTasks}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-500">
                    অগ্রগতি
                  </p>

                  <p className="mt-1 text-lg font-bold text-blue-600">
                    {progress}%
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
                    {completedTasks}/
                    {totalTasks}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>

              {/* Task History */}
              {tasks.length > 0 && (
                <div className="mt-5 border-t pt-4">
                  <p className="mb-3 text-sm font-semibold text-gray-700">
                    টাস্ক
                  </p>

                  <div className="space-y-2">
                    {tasks.map(
                      (task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5"
                        >
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                              task.status ===
                              "completed"
                                ? "bg-green-500 text-white"
                                : "border border-gray-300 bg-white"
                            }`}
                          >
                            {task.status ===
                              "completed" && (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>

                          <span
                            className={`min-w-0 flex-1 text-sm ${
                              task.status ===
                              "completed"
                                ? "text-gray-400 line-through"
                                : "text-gray-700"
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
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