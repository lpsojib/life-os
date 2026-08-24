"use client";

import {
  Check,
  CheckCircle2,
  Flame,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

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
  getCompletedGoals,
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
    useState<Goal[]>([]);

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
         * Online হলে Firebase → IndexedDB
         */
        if (
          syncFromFirebase &&
          typeof window !== "undefined" &&
          navigator.onLine &&
          auth.currentUser
        ) {
          await refreshGoalsFromFirebase(false);

          await refreshGoalTasksFromFirebase(false);
        }

        /*
         * Active Goals
         */
        const activeGoals =
          await getGoals();

        /*
         * Completed Goals
         */
        const finishedGoals =
          await getCompletedGoals();

        setGoals(activeGoals);
        setCompletedGoals(finishedGoals);
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
            setCompletedGoals([]);
            setLoading(false);

            setError(
              "লক্ষ্য দেখতে আগে লগইন করুন।"
            );

            return;
          }

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
     GOAL EVENTS
  ========================================================= */

  useEffect(() => {
    const handleGoalChange = () => {
      void loadGoals(false, false);
    };

    window.addEventListener(
      "life-os-goal-changed",
      handleGoalChange
    );

    window.addEventListener(
      "life-os-goal-added",
      handleGoalChange
    );

    window.addEventListener(
      "life-os-goal-synced",
      handleGoalChange
    );

    window.addEventListener(
      "life-os-goal-completed",
      handleGoalChange
    );

    return () => {
      window.removeEventListener(
        "life-os-goal-changed",
        handleGoalChange
      );

      window.removeEventListener(
        "life-os-goal-added",
        handleGoalChange
      );

      window.removeEventListener(
        "life-os-goal-synced",
        handleGoalChange
      );

      window.removeEventListener(
        "life-os-goal-completed",
        handleGoalChange
      );
    };
  }, [loadGoals]);

  /* =========================================================
     DELETE GOAL
  ========================================================= */

  const handleDeleteGoal = async (
    goalId: string
  ) => {
    try {
      setError("");

      /*
       * Instant UI update
       */
      setGoals((current) =>
        current.filter(
          (goal) => goal.id !== goalId
        )
      );

      setCompletedGoals((current) =>
        current.filter(
          (goal) => goal.id !== goalId
        )
      );

      await deleteGoal(goalId);
    } catch (error) {
      console.error(
        "Delete goal error:",
        error
      );

      setError(
        "লক্ষ্যটি মুছে ফেলা যায়নি।"
      );

      await loadGoals(false, false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (
    loading &&
    goals.length === 0 &&
    completedGoals.length === 0
  ) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-700" />
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
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-center text-sm font-medium text-red-600">
        {error}
      </div>
    );
  }

  /* =========================================================
     EMPTY
  ========================================================= */

  if (
    goals.length === 0 &&
    completedGoals.length === 0
  ) {
    return (
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
        <div className="px-6 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 shadow-sm">
            <Target className="h-7 w-7 text-white" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-gray-900">
            এখনো কোনো লক্ষ্য নেই
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
            একটি লক্ষ্য তৈরি করো এবং প্রতিদিন
            ছোট ছোট পদক্ষেপ নিয়ে সেটার দিকে
            এগিয়ে যাও।
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     TOTAL COMPLETED
  ========================================================= */

  const completedCount =
    completedGoals.length;

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="space-y-10">

      {/* =====================================================
          ACTIVE GOALS
      ===================================================== */}

      {goals.length > 0 && (
        <section>
          {/* Section Header */}

          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900">
                  <Target className="h-4 w-4 text-white" />
                </div>

                <h2 className="text-lg font-bold tracking-tight text-gray-900">
                  আমার লক্ষ্য
                </h2>
              </div>

              <p className="mt-2 text-sm text-gray-500">
                আজকের ছোট অগ্রগতিই আগামী দিনের
                বড় ফলাফল তৈরি করবে।
              </p>
            </div>

            <div className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600">
              {goals.length}টি চলমান
            </div>
          </div>

          {/* Active Goal Cards */}

          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>
        </section>
      )}

      {/* =====================================================
          COMPLETED GOALS
      ===================================================== */}

      {completedGoals.length > 0 && (
        <section>

          {/* Achievement Header */}

          <div className="relative mb-5 overflow-hidden rounded-3xl bg-gray-900 text-white">

            {/* Decorative elements */}

            <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/[0.06]" />

            <div className="pointer-events-none absolute -bottom-20 -left-10 h-36 w-36 rounded-full bg-white/[0.04]" />

            <div className="relative px-6 py-7">

              <div className="flex items-start justify-between gap-5">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-gray-900 shadow-lg">
                    <Trophy className="h-7 w-7" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gray-300" />

                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                        Achievement
                      </span>
                    </div>

                    <h2 className="mt-1 text-xl font-bold tracking-tight">
                      সম্পন্ন লক্ষ্য
                    </h2>

                    <p className="mt-1.5 text-sm text-gray-400">
                      তুমি যেগুলো শুরু করেছিলে,
                      সেগুলো শেষ করেছো।
                    </p>
                  </div>
                </div>

                {/* Count */}

                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-3xl font-bold">
                    {completedCount}
                  </p>

                  <p className="text-xs text-gray-400">
                    লক্ষ্য সম্পন্ন
                  </p>
                </div>
              </div>

              {/* Mobile Count */}

              <div className="mt-6 flex items-center gap-2 sm:hidden">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-full rounded-full bg-white" />
                </div>

                <span className="text-xs font-semibold text-gray-300">
                  {completedCount} completed
                </span>
              </div>
            </div>
          </div>

          {/* Completed Cards */}

          <div className="space-y-4">
            {completedGoals.map((goal) => (
              <CompletedGoalCard
                key={goal.id}
                goal={goal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>

          {/* Motivation */}

          <div className="mt-6 flex items-center gap-4 rounded-3xl border border-gray-200 bg-white px-5 py-5">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
              <Flame className="h-5 w-5 text-gray-800" />
            </div>

            <div>
              <p className="text-sm font-bold text-gray-900">
                Momentum তৈরি হয়েছে 🔥
              </p>

              <p className="mt-0.5 text-xs leading-5 text-gray-500">
                একটি লক্ষ্য শেষ করার পর থেমে যেও না।
                পরের লক্ষ্যটা শুরু করো।
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* =========================================================
   COMPLETED GOAL CARD
========================================================= */

interface CompletedGoalCardProps {
  goal: Goal;

  onDelete: (
    goalId: string
  ) => void;
}

function CompletedGoalCard({
  goal,
  onDelete,
}: CompletedGoalCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-md">

      {/* Completion indicator */}

      <div className="absolute bottom-0 left-0 top-0 w-1 bg-gray-900" />

      <div className="p-5 pl-6 sm:p-6 sm:pl-7">

        {/* Top */}

        <div className="flex items-start gap-4">

          {/* Check */}

          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-900 shadow-sm">
            <CheckCircle2 className="h-6 w-6 text-white" />

            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-gray-100">
              <Check className="h-2.5 w-2.5 text-gray-800" />
            </div>
          </div>

          {/* Content */}

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="break-words text-base font-bold leading-6 text-gray-900">
                {goal.title}
              </h3>

              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                <Check className="h-3 w-3" />
                Done
              </span>
            </div>

            {goal.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                {goal.description}
              </p>
            )}
          </div>
        </div>

        {/* Progress */}

        <div className="mt-6">

          <div className="mb-2.5 flex items-center justify-between">

            <span className="text-xs font-semibold text-gray-400">
              Goal progress
            </span>

            <span className="text-sm font-bold text-gray-900">
              100%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="relative h-full w-full rounded-full bg-gray-900">
              <div className="absolute inset-y-0 right-0 w-1/3 bg-white/10" />
            </div>
          </div>
        </div>

        {/* Stats */}

        <div className="mt-5 grid grid-cols-2 gap-3">

          <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
            <p className="text-[11px] font-medium text-gray-400">
              Tasks completed
            </p>

            <p className="mt-1 text-base font-bold text-gray-900">
              {goal.completedTasks}
              <span className="mx-1 text-gray-300">
                /
              </span>
              {goal.totalTasks}
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
            <p className="text-[11px] font-medium text-gray-400">
              Status
            </p>

            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-900" />

              <p className="text-sm font-bold text-gray-900">
                Completed
              </p>
            </div>
          </div>
        </div>

        {/* Achievement Message */}

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5">

          <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-gray-700" />

          <p className="text-xs leading-5 text-gray-600">
            এই লক্ষ্যটি সফলভাবে শেষ হয়েছে।
            তুমি নিজের commitment ধরে রেখেছো —
            এটাই আসল achievement।
          </p>
        </div>

        {/* Delete */}

        <button
          type="button"
          onClick={() =>
            onDelete(goal.id)
          }
          className="mt-4 w-full rounded-2xl border border-transparent px-4 py-2.5 text-xs font-semibold text-gray-400 transition hover:border-gray-200 hover:bg-gray-50 hover:text-gray-700"
        >
          লক্ষ্য মুছে ফেলুন
        </button>
      </div>
    </article>
  );
}