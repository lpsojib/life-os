
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getGoals,
  getGoalTasks,
} from "@/features/goals/services/goal.service";

import type {
  Goal,
  GoalTask,
} from "@/features/goals/types/goal.types";

import { auth } from "@/lib/firebase";

interface GoalWithTasks extends Goal {
  tasks: GoalTask[];
}

export default function DashboardGoals() {
  const [goals, setGoals] =
    useState<GoalWithTasks[]>([]);

  const [loading, setLoading] =
    useState(true);

  /**
   * Prevent an old async request from updating
   * state after logout/unmount.
   */
  const mountedRef =
    useRef(true);

  const loadingRef =
    useRef(false);

  const loadGoals =
    useCallback(async () => {
      /*
       * IMPORTANT:
       *
       * User না থাকলে getGoals() call করবে না।
       *
       * এটাই "User is not authenticated"
       * error-এর মূল protection।
       */
      if (!auth.currentUser) {
        if (mountedRef.current) {
          setGoals([]);
          setLoading(false);
        }

        return;
      }

      /*
       * একই সময়ে একাধিক loadGoals()
       * চালানো বন্ধ করবে।
       */
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;

      try {
        /*
         * Request শুরু হওয়ার পর user logout করলে
         * Firebase currentUser null হয়ে যেতে পারে।
         */
        if (!auth.currentUser) {
          return;
        }

        const activeGoals =
          await getGoals();

        /*
         * getGoals() শেষ হওয়ার সময় user logout
         * করে ফেললে আর নিচের Firebase calls চালাব না।
         */
        if (
          !mountedRef.current ||
          !auth.currentUser
        ) {
          return;
        }

        const goalsWithTasks =
          await Promise.all(
            activeGoals.map(
              async (goal) => {
                /*
                 * প্রতিটি goal-এর task load করার
                 * আগে authentication check।
                 */
                if (
                  !auth.currentUser
                ) {
                  return {
                    ...goal,
                    tasks: [],
                  };
                }

                const tasks =
                  await getGoalTasks(
                    goal.id
                  );

                return {
                  ...goal,
                  tasks,
                };
              }
            )
          );

        /*
         * Async operation চলার সময় logout/unmount
         * হলে state update করবে না।
         */
        if (
          !mountedRef.current ||
          !auth.currentUser
        ) {
          return;
        }

        setGoals(
          goalsWithTasks
        );
      } catch (error) {
        /*
         * Logout-এর সময় expected auth error হলে
         * console-এ unnecessary error দেখাবে না।
         */
        if (
          !auth.currentUser
        ) {
          return;
        }

        console.error(
          "Failed to load dashboard goals:",
          error
        );
      } finally {
        loadingRef.current =
          false;

        if (
          mountedRef.current &&
          auth.currentUser
        ) {
          setLoading(false);
        }
      }
    }, []);

  useEffect(() => {
    mountedRef.current = true;

    /*
     * Initial load.
     *
     * setTimeout রাখা হয়েছে যাতে component
     * mount হওয়ার পর auth state settle হওয়ার
     * সামান্য সময় পাওয়া যায়।
     */
    const timer =
      window.setTimeout(() => {
        if (
          mountedRef.current &&
          auth.currentUser
        ) {
          void loadGoals();
        } else if (
          mountedRef.current
        ) {
          setLoading(false);
        }
      }, 0);

    const handleGoalChange =
      () => {
        /*
         * Logout অবস্থায় event এলেও
         * getGoals() call করবে না।
         */
        if (
          !mountedRef.current ||
          !auth.currentUser
        ) {
          return;
        }

        void loadGoals();
      };

    window.addEventListener(
      "life-os-goal-changed",
      handleGoalChange
    );

    window.addEventListener(
      "life-os-goal-synced",
      handleGoalChange
    );

    return () => {
      mountedRef.current =
        false;

      window.clearTimeout(
        timer
      );

      window.removeEventListener(
        "life-os-goal-changed",
        handleGoalChange
      );

      window.removeEventListener(
        "life-os-goal-synced",
        handleGoalChange
      );
    };
  }, [loadGoals]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />

          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-xl bg-slate-100"
              />
            )
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Goals
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your active goals and progress
          </p>
        </div>

        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {goals.length} Active
        </div>
      </div>

      {/* Empty */}
      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
          <div className="text-3xl">
            🎯
          </div>

          <h3 className="mt-3 font-semibold text-slate-800">
            No active goals
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Create a goal to start tracking your progress.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map(
            (goal) => {
              const totalTasks =
                goal.tasks.length;

              const completedTasks =
                goal.tasks.filter(
                  (task) =>
                    task.completed
                ).length;

              const progress =
                totalTasks > 0
                  ? Math.round(
                      (completedTasks /
                        totalTasks) *
                        100
                    )
                  : goal.progress ??
                    0;

              return (
                <div
                  key={goal.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:shadow-sm"
                >
                  {/* Goal title */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">
                        {goal.title}
                      </h3>

                      {goal.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {
                            goal.description
                          }
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 text-lg">
                      🎯
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600">
                        Progress
                      </span>

                      <span className="font-bold text-slate-900">
                        {progress}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-slate-900 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              progress
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Task summary */}
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Tasks
                    </span>

                    <span className="font-semibold text-slate-700">
                      {completedTasks}/
                      {totalTasks}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
                    <span>
                      {formatDate(
                        goal.startDate
                      )}
                    </span>

                    <span>
                      →
                    </span>

                    <span>
                      {formatDate(
                        goal.endDate
                      )}
                    </span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
  date: string
): string {
  if (!date) {
    return "—";
  }

  const parsedDate =
    new Date(
      `${date}T00:00:00`
    );

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );
}

