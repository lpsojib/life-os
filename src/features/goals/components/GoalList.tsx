"use client";

import {
  CheckCircle2,
  Target,
  Flame,
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
         * Online হলে Firebase থেকে
         * latest data local cache-এ আনা হবে।
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
         * Active goals
         */
        const activeGoals =
          await getGoals();

        /*
         * Completed goals
         */
        const finishedGoals =
          await getCompletedGoals();

        setGoals(activeGoals);

        setCompletedGoals(
          finishedGoals
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

            setCompletedGoals([]);

            setLoading(false);

            setError(
              "লক্ষ্য দেখতে আগে লগইন করুন।"
            );

            return;
          }

          /*
           * Login হওয়ার পরে:
           *
           * Firebase
           *    ↓
           * IndexedDB
           *    ↓
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
     GOAL CHANGE EVENTS
  ========================================================= */

  useEffect(() => {
    const handleGoalChange =
      () => {
        void loadGoals(
          false,
          false
        );
      };

    const handleGoalCompleted =
      () => {
        void loadGoals(
          false,
          false
        );
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
      handleGoalCompleted
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
        handleGoalCompleted
      );
    };
  }, [loadGoals]);

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
         * Active list থেকে সঙ্গে সঙ্গে remove।
         */
        setGoals(
          (current) =>
            current.filter(
              (goal) =>
                goal.id !== goalId
            )
        );

        /*
         * Completed list থেকেও remove।
         */
        setCompletedGoals(
          (current) =>
            current.filter(
              (goal) =>
                goal.id !== goalId
            )
        );

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
    goals.length === 0 &&
    completedGoals.length === 0
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

  if (
    goals.length === 0 &&
    completedGoals.length === 0
  ) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-5 py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <Target className="h-8 w-8 text-gray-400" />
        </div>

        <p className="text-base font-bold text-gray-700">
          এখনো কোনো লক্ষ্য নেই
        </p>

        <p className="mt-1 text-sm text-gray-400">
          নতুন একটি লক্ষ্য তৈরি করে
          নিজের যাত্রা শুরু করো।
        </p>
      </div>
    );
  }

  /* =========================================================
     MAIN LIST
  ========================================================= */

  return (
    <div className="space-y-8">

      {/* =====================================================
          ACTIVE GOALS
      ===================================================== */}

      {goals.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                আমার লক্ষ্য
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                এগুলো শেষ করার পথে তুমি এগিয়ে যাচ্ছো
              </p>
            </div>

            <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {goals.length} টি
            </div>
          </div>

          <div className="space-y-4">
            {goals.map(
              (goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onDelete={
                    handleDeleteGoal
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

      {completedGoals.length > 0 && (
        <section>

          {/* =================================================
              ACHIEVEMENT HEADER
          ================================================= */}

          <div className="mb-4 overflow-hidden rounded-3xl border border-gray-200 bg-white">
            <div className="relative overflow-hidden px-5 py-6">

              <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gray-100" />

              <div className="absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-gray-50" />

              <div className="relative flex items-center gap-4">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-900 shadow-sm">
                  <Trophy className="h-7 w-7 text-white" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Achievement
                  </p>

                  <h2 className="mt-0.5 text-lg font-bold text-gray-900">
                    সম্পন্ন লক্ষ্য
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    তুমি যা শুরু করেছিলে,
                    সেটা শেষ করেছো।
                  </p>
                </div>

              </div>
            </div>

            {/* Stats */}

            <div className="grid grid-cols-2 border-t border-gray-100">

              <div className="px-5 py-4">
                <p className="text-xs text-gray-400">
                  Completed
                </p>

                <p className="mt-1 text-xl font-bold text-gray-900">
                  {completedGoals.length}
                </p>
              </div>

              <div className="border-l border-gray-100 px-5 py-4">
                <p className="text-xs text-gray-400">
                  Progress
                </p>

                <p className="mt-1 text-xl font-bold text-gray-900">
                  100%
                </p>
              </div>

            </div>
          </div>

          {/* =================================================
              COMPLETED GOAL CARDS
          ================================================= */}

          <div className="space-y-4">
            {completedGoals.map(
              (goal) => (
                <CompletedGoalCard
                  key={goal.id}
                  goal={goal}
                  onDelete={
                    handleDeleteGoal
                  }
                />
              )
            )}
          </div>

          {/* =================================================
              MOTIVATION FOOTER
          ================================================= */}

          <div className="mt-5 rounded-3xl border border-gray-200 bg-gray-50 px-5 py-6 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
              <Flame className="h-6 w-6 text-gray-800" />
            </div>

            <p className="mt-3 text-sm font-bold text-gray-800">
              Keep going.
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              একটি লক্ষ্য শেষ করা মানে
              শুধু একটি কাজ শেষ করা নয় —
              তুমি নিজের উপর বিশ্বাসটা
              আরও শক্ত করেছো।
            </p>

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
    <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

      {/* =====================================================
          ACHIEVEMENT STRIP
      ===================================================== */}

      <div className="h-1.5 w-full bg-gray-900" />

      <div className="p-5">

        {/* =================================================
            TITLE
        ================================================= */}

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-900">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="break-words text-base font-bold text-gray-900">
                {goal.title}
              </h3>

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                Completed
              </span>

            </div>

            {goal.description && (
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {goal.description}
              </p>
            )}

          </div>
        </div>

        {/* =================================================
            PROGRESS
        ================================================= */}

        <div className="mt-5">

          <div className="mb-2 flex items-center justify-between">

            <span className="text-xs font-medium text-gray-400">
              Goal Progress
            </span>

            <span className="text-sm font-bold text-gray-900">
              100%
            </span>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-full rounded-full bg-gray-900" />
          </div>

        </div>

        {/* =================================================
            ACHIEVEMENT STATS
        ================================================= */}

        <div className="mt-5 grid grid-cols-2 gap-3">

          <div className="rounded-2xl bg-gray-50 px-4 py-3">

            <p className="text-[11px] text-gray-400">
              Tasks
            </p>

            <p className="mt-1 text-sm font-bold text-gray-900">
              {goal.completedTasks}/
              {goal.totalTasks}
            </p>

          </div>

          <div className="rounded-2xl bg-gray-50 px-4 py-3">

            <p className="text-[11px] text-gray-400">
              Status
            </p>

            <p className="mt-1 text-sm font-bold text-gray-900">
              Finished
            </p>

          </div>

        </div>

        {/* =================================================
            MOTIVATION MESSAGE
        ================================================= */}

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">

          <Trophy className="h-5 w-5 shrink-0 text-gray-700" />

          <p className="text-xs font-medium leading-5 text-gray-600">
            এই লক্ষ্যটা তুমি সফলভাবে
            শেষ করেছো। পরের লক্ষ্যটা
            আরও বড় হতে পারে।
          </p>

        </div>

        {/* =================================================
            DELETE
        ================================================= */}

        <button
          type="button"
          onClick={() =>
            onDelete(goal.id)
          }
          className="mt-4 w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
        >
          লক্ষ্য মুছে ফেলুন
        </button>

      </div>
    </div>
  );
}