"use client";

import {
  CheckCircle2,
  Flame,
  Target,
  Trophy,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";

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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completedGoals, setCompletedGoals] = useState<Goal[]>(
    []
  );

  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState("");

  const mountedRef = useRef(true);
  const previousRefreshKeyRef = useRef(refreshKey);

  /* =========================================================
     MOUNT / UNMOUNT
  ========================================================= */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* =========================================================
     LOAD LOCAL GOALS
     
     Local cache থেকে data নেওয়া হবে।
     Firebase এখানে block করবে না।
  ========================================================= */

  const loadLocalGoals = useCallback(async () => {
    try {
      const [activeGoals, finishedGoals] =
        await Promise.all([
          getGoals(),
          getCompletedGoals(),
        ]);

      if (!mountedRef.current) {
        return;
      }

      setGoals(activeGoals);
      setCompletedGoals(finishedGoals);
      setError("");
    } catch (error) {
      console.error(
        "Load local goals error:",
        error
      );

      if (!mountedRef.current) {
        return;
      }

      setError(
        "লক্ষ্যগুলো লোড করা যায়নি।"
      );
    } finally {
      if (mountedRef.current) {
        setInitialized(true);
      }
    }
  }, []);

  /* =========================================================
     BACKGROUND FIREBASE SYNC
     
     Important:
     এই function UI loading block করবে না।
  ========================================================= */

  const syncGoalsInBackground =
    useCallback(async () => {
      if (
        typeof window === "undefined" ||
        !navigator.onLine ||
        !auth.currentUser
      ) {
        return;
      }

      try {
        await refreshGoalsFromFirebase(false);

        await refreshGoalTasksFromFirebase(false);

        /*
         * Firebase sync হওয়ার পর
         * local cache আবার read করা হবে।
         */
        const [
          activeGoals,
          finishedGoals,
        ] = await Promise.all([
          getGoals(),
          getCompletedGoals(),
        ]);

        if (!mountedRef.current) {
          return;
        }

        setGoals(activeGoals);
        setCompletedGoals(
          finishedGoals
        );
      } catch (error) {
        /*
         * Background sync fail করলে
         * local data নষ্ট হবে না।
         */
        console.warn(
          "Background goal sync failed:",
          error
        );
      }
    }, []);

  /* =========================================================
     AUTH
     
     Login হওয়ার সাথে সাথে:
     
     1. Local data load
     2. UI show
     3. Firebase background sync
  ========================================================= */

  useEffect(() => {
    let active = true;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          if (!active) {
            return;
          }

          if (!user) {
            setGoals([]);
            setCompletedGoals([]);
            setError(
              "লক্ষ্য দেখতে আগে লগইন করুন।"
            );
            setInitialized(true);

            return;
          }

          /*
           * Local data first.
           *
           * void ব্যবহার করা হয়েছে যাতে
           * effect-এর ভিতরে await/block না হয়।
           */
          void loadLocalGoals();

          /*
           * Firebase sync background-এ।
           */
          void syncGoalsInBackground();
        }
      );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [
    loadLocalGoals,
    syncGoalsInBackground,
  ]);

  /* =========================================================
     REFRESH KEY
     
     AddGoalForm থেকে নতুন goal যোগ হলে
     local cache দ্রুত reload হবে।
  ========================================================= */

  useEffect(() => {
    if (
      previousRefreshKeyRef.current ===
      refreshKey
    ) {
      return;
    }

    previousRefreshKeyRef.current =
      refreshKey;

    void loadLocalGoals();
  }, [
    refreshKey,
    loadLocalGoals,
  ]);

  /* =========================================================
     GOAL EVENTS
  ========================================================= */

  useEffect(() => {
    const handleGoalChange = () => {
      void loadLocalGoals();
    };

    const handleGoalCompleted = () => {
      void loadLocalGoals();
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
  }, [loadLocalGoals]);

  /* =========================================================
     DELETE GOAL
  ========================================================= */

  const handleDeleteGoal = async (
    goalId: string
  ) => {
    const oldGoals = goals;
    const oldCompletedGoals =
      completedGoals;

    /*
     * Optimistic UI
     * সঙ্গে সঙ্গে card remove হবে।
     */
    setGoals((current) =>
      current.filter(
        (goal) =>
          goal.id !== goalId
      )
    );

    setCompletedGoals(
      (current) =>
        current.filter(
          (goal) =>
            goal.id !== goalId
        )
    );

    try {
      setError("");

      await deleteGoal(goalId);
    } catch (error) {
      console.error(
        "Delete goal error:",
        error
      );

      /*
       * Delete fail করলে আগের data ফিরিয়ে দাও।
       */
      if (mountedRef.current) {
        setGoals(oldGoals);
        setCompletedGoals(
          oldCompletedGoals
        );

        setError(
          "লক্ষ্যটি মুছে ফেলা যায়নি।"
        );
      }
    }
  };

  /* =========================================================
     INITIAL LOCAL LOADING
     
     এখানে full-page spinner না দেখিয়ে
     lightweight skeleton দেখানো হচ্ছে।
  ========================================================= */

  if (!initialized) {
    return (
      <div className="space-y-3">
        <GoalSkeleton />
        <GoalSkeleton />
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (
    error &&
    goals.length === 0 &&
    completedGoals.length === 0
  ) {
    return (
      <div className="rounded-[18px] border border-red-100 bg-red-50 px-4 py-5 text-center">
        <p className="text-sm font-semibold text-red-600">
          {error}
        </p>
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
      <div className="rounded-[18px] border border-dashed border-[#e3e0d6] bg-white px-5 py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf1eb]">
          <Target className="h-7 w-7 text-[#173c30]" />
        </div>

        <p className="text-base font-extrabold text-[#22261f]">
          এখনো কোনো লক্ষ্য নেই
        </p>

        <p className="mt-1 text-sm leading-6 text-[#767c70]">
          নতুন একটি লক্ষ্য তৈরি করে
          নিজের যাত্রা শুরু করো।
        </p>
      </div>
    );
  }

  /* =========================================================
     MAIN
  ========================================================= */

  return (
    <div className="space-y-6">

      {/* =====================================================
          ACTIVE GOALS
      ===================================================== */}

      {goals.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#173c30]">
              <Target className="h-3.5 w-3.5 text-white" />
            </div>

            <h2 className="text-base font-extrabold text-[#22261f]">
              চলমান লক্ষ্য
            </h2>

            <span className="ml-auto rounded-full bg-[#edeae0] px-2.5 py-1 text-[11px] font-semibold text-[#767c70]">
              {goals.length} টি
            </span>
          </div>

          <div className="space-y-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDelete={
                  handleDeleteGoal
                }
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

          <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-[#15251e] to-[#1d362b] px-4 py-3.5">
            <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-[#d9a441]/15" />

            <div className="relative flex items-center gap-3">
              <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] bg-[#d9a441]/15">
                <Trophy className="h-[19px] w-[19px] text-[#d9a441]" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold tracking-wider text-[#b7c4a9]">
                  ACHIEVEMENT
                </span>

                <h3 className="text-[14.5px] font-bold text-white">
                  যা শুরু করেছিলে, শেষ করেছো
                </h3>
              </div>

              <div className="shrink-0 rounded-xl bg-white/10 px-3 py-1.5 text-center">
                <div className="text-lg font-extrabold leading-none text-[#d9a441]">
                  {completedGoals.length}
                </div>

                <div className="mt-0.5 text-[9px] text-white/60">
                  completed
                </div>
              </div>
            </div>
          </div>

          {/* Completed Cards */}

          <div className="mt-4 space-y-3">
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

          {/* Motivation */}

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#f7f5ee] px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
              <Flame className="h-[18px] w-[18px] text-[#c98a2a]" />
            </div>

            <p className="text-xs leading-5 text-[#767c70]">
              একটি লক্ষ্য শেষ করা মানে
              শুধু একটি কাজ শেষ করা নয় —
              নিজের উপর বিশ্বাস আরও
              শক্ত করা।
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
    <div className="relative overflow-hidden rounded-[18px] border border-[#e7e3d8] bg-white">

      {/* Gold top line */}

      <div className="h-1 w-full bg-gradient-to-r from-[#d9a441] via-[#ebc372] to-[#d9a441]" />

      <div className="px-4 py-3.5">

        {/* Header */}

        <div className="flex items-center gap-2.5">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#f3e3c2]">
            <Trophy className="h-[18px] w-[18px] text-[#c97f1e]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-extrabold leading-tight text-[#22261f]">
              {goal.title}
            </p>

            <span className="text-[11px] text-[#767c70]">
              {goal.completedTasks}/
              {goal.totalTasks} টাস্ক সম্পন্ন
            </span>
          </div>

          <span className="shrink-0 text-sm font-extrabold text-[#c97f1e]">
            100%
          </span>
        </div>

        {/* Progress */}

        <div className="my-2.5 h-1.5 overflow-hidden rounded-full bg-[#efece1]">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-[#d9a441] to-[#c98a2a]" />
        </div>

        {/* Footer */}

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 rounded-full bg-[#e4f5ea] px-2 py-0.5 text-[11px] font-bold text-[#1e8e4c]">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </span>

          <button
            type="button"
            onClick={() =>
              onDelete(goal.id)
            }
            className="text-[11px] text-[#767c70] underline underline-offset-2 transition hover:text-[#22261f]"
          >
            মুছে ফেলুন
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   LOADING SKELETON
========================================================= */

function GoalSkeleton() {
  return (
    <div className="animate-pulse rounded-[18px] border border-[#e7e3d8] bg-white p-4">
      <div className="flex items-center gap-3">

        <div className="h-14 w-14 shrink-0 rounded-full bg-[#eeece5]" />

        <div className="min-w-0 flex-1">
          <div className="h-4 w-2/3 rounded bg-[#eeece5]" />

          <div className="mt-3 h-3 w-1/3 rounded bg-[#f1efe9]" />
        </div>

        <div className="h-5 w-5 rounded bg-[#eeece5]" />
      </div>
    </div>
  );
}