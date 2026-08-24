"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

import {
  deleteGoal,
  getGoals,
  refreshGoalTasksFromFirebase,
  refreshGoalsFromFirebase,
} from "../services/goal.service";

import { Goal } from "../types/goal.types";

import GoalCard from "./GoalCard";

interface GoalListProps {
  refreshKey?: number;
}

export default function GoalList({
  refreshKey = 0,
}: GoalListProps) {
  const [goals, setGoals] =
    useState<Goal[]>([]);

  const [completedGoals, setCompletedGoals] =
    useState<Record<string, boolean>>({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =========================================================
     LOAD GOALS
  ========================================================= */

  const loadGoals = useCallback(
    async (
      showLoading = false,
      syncFromFirebase = false
    ) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError("");

        /*
         * Online হলে Firebase থেকে
         * permanent data refresh করবো।
         */
        if (
          syncFromFirebase &&
          typeof window !== "undefined" &&
          navigator.onLine &&
          auth.currentUser
        ) {
          await refreshGoalsFromFirebase(
            false
          );

          await refreshGoalTasksFromFirebase(
            false
          );
        }

        /*
         * UI-এর জন্য local data load।
         */
        const data =
          await getGoals();

        setGoals(data);

        /*
         * যেসব Goal আর নেই,
         * তাদের completion state remove করবো।
         */
        setCompletedGoals(
          (current) => {
            const validIds =
              new Set(
                data.map(
                  (goal) => goal.id
                )
              );

            const next: Record<
              string,
              boolean
            > = {};

            Object.keys(current).forEach(
              (goalId) => {
                if (
                  validIds.has(
                    goalId
                  )
                ) {
                  next[goalId] =
                    current[goalId];
                }
              }
            );

            return next;
          }
        );
      } catch (error) {
        console.error(
          "Load goals error:",
          error
        );

        setError(
          "লক্ষ্যগুলো লোড করা যায়নি।"
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  /* =========================================================
     AUTHENTICATION
  ========================================================= */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          if (!user) {
            setGoals([]);
            setCompletedGoals({});
            setLoading(false);

            setError(
              "লক্ষ্য দেখতে আগে লগইন করুন।"
            );

            return;
          }

          /*
           * Firebase
           * ↓
           * IndexedDB
           * ↓
           * Goal List
           */
          void loadGoals(
            true,
            true
          );
        }
      );

    return () => {
      unsubscribe();
    };
  }, [
    loadGoals,
    refreshKey,
  ]);

  /* =========================================================
     GOAL CHANGE EVENT
  ========================================================= */

  useEffect(() => {
    const handleChange =
      () => {
        void loadGoals(false);
      };

    window.addEventListener(
      "life-os-goal-changed",
      handleChange
    );

    window.addEventListener(
      "life-os-goal-added",
      handleChange
    );

    window.addEventListener(
      "life-os-goal-synced",
      handleChange
    );

    return () => {
      window.removeEventListener(
        "life-os-goal-changed",
        handleChange
      );

      window.removeEventListener(
        "life-os-goal-added",
        handleChange
      );

      window.removeEventListener(
        "life-os-goal-synced",
        handleChange
      );
    };
  }, [loadGoals]);

  /* =========================================================
     COMPLETION CHANGE
  ========================================================= */

  const handleCompletionChange =
    useCallback(
      (
        goalId: string,
        completed: boolean
      ) => {
        setCompletedGoals(
          (current) => {
            if (
              current[goalId] ===
              completed
            ) {
              return current;
            }

            return {
              ...current,
              [goalId]:
                completed,
            };
          }
        );
      },
      []
    );

  /* =========================================================
     DELETE GOAL
  ========================================================= */

  const handleDeleteGoal =
    async (
      goalId: string
    ) => {
      try {
        setError("");

        /*
         * UI থেকে সঙ্গে সঙ্গে Goal সরানো।
         */
        setGoals(
          (current) =>
            current.filter(
              (goal) =>
                goal.id !==
                goalId
            )
        );

        /*
         * Completion state থেকেও সরানো।
         */
        setCompletedGoals(
          (current) => {
            const next = {
              ...current,
            };

            delete next[
              goalId
            ];

            return next;
          }
        );

        /*
         * Service-এর মাধ্যমে
         * IndexedDB / Firebase delete।
         */
        await deleteGoal(
          goalId
        );
      } catch (error) {
        console.error(
          "Delete goal error:",
          error
        );

        setError(
          "লক্ষ্যটি মুছে ফেলা যায়নি।"
        );

        await loadGoals(
          false,
          false
        );
      }
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (
    loading &&
    goals.length === 0
  ) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-sm text-gray-500">
          লক্ষ্য লোড হচ্ছে...
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 px-4 py-4 text-center text-sm font-medium text-red-600">
        {error}
      </div>
    );
  }

  /* =========================================================
     EMPTY
  ========================================================= */

  if (goals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-gray-400"
          >
            <circle
              cx="12"
              cy="12"
              r="5"
            />

            <circle
              cx="12"
              cy="12"
              r="1"
            />
          </svg>
        </div>

        <p className="text-base font-semibold text-gray-700">
          এখনো কোনো লক্ষ্য নেই
        </p>

        <p className="mt-1 text-sm text-gray-400">
          নতুন একটি লক্ষ্য তৈরি করে শুরু করো।
        </p>
      </div>
    );
  }

  /* =========================================================
     ACTIVE / COMPLETED GOALS
  ========================================================= */

  const activeGoals =
    goals.filter(
      (goal) =>
        completedGoals[
          goal.id
        ] !== true
    );

  const finishedGoals =
    goals.filter(
      (goal) =>
        completedGoals[
          goal.id
        ] === true
    );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-8">

      {/* =====================================================
          ACTIVE GOALS
      ===================================================== */}

      {activeGoals.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#17261e]">
              চলমান লক্ষ্য
            </h2>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              {activeGoals.length}
            </span>
          </div>

          <div className="space-y-4">
            {activeGoals.map(
              (goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onDelete={
                    handleDeleteGoal
                  }
                  onCompletionChange={
                    handleCompletionChange
                  }
                />
              )
            )}
          </div>
        </section>
      )}

      {/* =====================================================
          COMPLETED GOALS
      ===================================================== */}

      {finishedGoals.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#17261e]">
                সম্পন্ন লক্ষ্য
              </h2>

              <p className="mt-1 text-sm text-[#7a877e]">
                আপনার সম্পন্ন করা লক্ষ্যগুলো এখানে থাকবে।
              </p>
            </div>

            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              ✓ {finishedGoals.length}
            </span>
          </div>

          <div className="space-y-4">
            {finishedGoals.map(
              (goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onDelete={
                    handleDeleteGoal
                  }
                  onCompletionChange={
                    handleCompletionChange
                  }
                />
              )
            )}
          </div>
        </section>
      )}

      {/* =====================================================
          ALL GOALS COMPLETED
      ===================================================== */}

      {activeGoals.length === 0 &&
        finishedGoals.length > 0 && (
          <div className="rounded-2xl border border-green-100 bg-green-50 px-5 py-4 text-center">
            <p className="text-sm font-semibold text-green-700">
              🎉 সব লক্ষ্য সম্পন্ন!
            </p>

            <p className="mt-1 text-xs text-green-600">
              নতুন লক্ষ্য যোগ করে আবার শুরু করতে পারো।
            </p>
          </div>
        )}
    </div>
  );
}