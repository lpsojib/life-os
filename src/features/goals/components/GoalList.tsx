"use client";

import {
  Check,
  CheckCircle2,
  ChevronRight,
  Flame,
  Target,
  Trophy,
} from "lucide-react";

import {
  useCallback,
  useEffect,
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

/* =========================================================
   HELPERS
========================================================= */

const getDaysLeft = (
  endDate: string
): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diff =
    end.getTime() - today.getTime();

  return Math.max(
    0,
    Math.ceil(
      diff / (1000 * 60 * 60 * 24)
    )
  );
};

const getBanglaNumber = (
  value: number
): string => {
  const numbers = [
    "০",
    "১",
    "২",
    "৩",
    "৪",
    "৫",
    "৬",
    "৭",
    "৮",
    "৯",
  ];

  return String(value)
    .split("")
    .map(
      (char) =>
        numbers[
          Number(char)
        ] ?? char
    )
    .join("");
};

/* =========================================================
   GOAL LIST
========================================================= */

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

  /* =======================================================
     LOAD
  ======================================================= */

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

        if (
          syncFromFirebase &&
          typeof window !== "undefined" &&
          navigator.onLine &&
          auth.currentUser
        ) {
          try {
            await refreshGoalsFromFirebase(
              false
            );

            await refreshGoalTasksFromFirebase(
              false
            );
          } catch (firebaseError) {
            console.warn(
              "Goal Firebase refresh skipped:",
              firebaseError
            );
          }
        }

        const [
          activeGoals,
          finishedGoals,
        ] = await Promise.all([
          getGoals(),
          getCompletedGoals(),
        ]);

        setGoals(activeGoals);
        setCompletedGoals(
          finishedGoals
        );
      } catch (loadError) {
        console.error(
          "Load goals error:",
          loadError
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

  /* =======================================================
     AUTH
  ======================================================= */

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

    return unsubscribe;
  }, [loadGoals, refreshKey]);

  /* =======================================================
     EVENTS
  ======================================================= */

  useEffect(() => {
    const handleChange = () => {
      void loadGoals(
        false,
        false
      );
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

    window.addEventListener(
      "life-os-goal-completed",
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

      window.removeEventListener(
        "life-os-goal-completed",
        handleChange
      );
    };
  }, [loadGoals]);

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDeleteGoal = async (
    goalId: string
  ) => {
    try {
      setError("");

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

      await deleteGoal(goalId);
    } catch (deleteError) {
      console.error(
        "Delete goal error:",
        deleteError
      );

      setError(
        "লক্ষ্যটি মুছে ফেলা যায়নি।"
      );

      void loadGoals(
        false,
        false
      );
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading &&
    goals.length === 0 &&
    completedGoals.length === 0
  ) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#173C30] border-t-transparent" />
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="mx-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-center text-sm font-medium text-red-600">
        {error}
      </div>
    );
  }

  /* =======================================================
     EMPTY
  ======================================================= */

  if (
    goals.length === 0 &&
    completedGoals.length === 0
  ) {
    return (
      <div className="px-5 py-10">
        <div className="rounded-[20px] border border-[#E7E3D8] bg-white px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#173C30]">
            <Target className="h-7 w-7 text-white" />
          </div>

          <h3 className="mt-4 text-lg font-extrabold text-[#22261F]">
            এখনো কোনো লক্ষ্য নেই
          </h3>

          <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-[#767C70]">
            আপনার গুরুত্বপূর্ণ লক্ষ্য
            নির্ধারণ করুন এবং ধাপে ধাপে
            এগিয়ে যান।
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="space-y-6 bg-[#F3F1EA] pb-8">

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="px-5 pt-5">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.5px] text-[#22261F]">
          আমার লক্ষ্য
        </h1>

        <p className="mt-1.5 max-w-[34ch] text-[14px] leading-6 text-[#767C70]">
          আপনার গুরুত্বপূর্ণ লক্ষ্য
          নির্ধারণ করুন এবং ধাপে ধাপে
          এগিয়ে যান।
        </p>
      </section>

      {/* ===================================================
          ACTIVE GOALS
      =================================================== */}

      {goals.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2 px-5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#173C30]">
              <Target className="h-3.5 w-3.5 text-white" />
            </div>

            <h2 className="text-[16px] font-extrabold text-[#22261F]">
              চলমান লক্ষ্য
            </h2>

            <span className="ml-auto rounded-full bg-[#EDEAE0] px-2.5 py-1 text-[11px] text-[#767C70]">
              {getBanglaNumber(
                goals.length
              )} টি
            </span>
          </div>

          <div className="space-y-3 px-5">
            {goals.map((goal) => (
              <ActiveGoalPreview
                key={goal.id}
                goal={goal}
              >
                <GoalCard
                  goal={goal}
                  onDelete={
                    handleDeleteGoal
                  }
                />
              </ActiveGoalPreview>
            ))}
          </div>
        </section>
      )}

      {/* ===================================================
          ACHIEVEMENT HEADER
      =================================================== */}

      {completedGoals.length > 0 && (
        <>
          <section className="mx-5 overflow-hidden rounded-[18px] bg-gradient-to-br from-[#15251E] to-[#1D362B]">
            <div className="relative flex items-center gap-3 px-4 py-3.5">
              <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-[#D9A441]/15" />

              <div className="relative z-10 flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] bg-[#D9A441]/15">
                <Trophy className="h-5 w-5 text-[#D9A441]" />
              </div>

              <div className="relative z-10 min-w-0 flex-1">
                <span className="block text-[10px] font-bold tracking-wider text-[#B7C4A9]">
                  ACHIEVEMENT
                </span>

                <h3 className="mt-0.5 text-[14.5px] font-bold text-white">
                  যা শুরু করেছিলে,
                  শেষ করেছো
                </h3>
              </div>

              <div className="relative z-10 shrink-0 rounded-xl bg-white/10 px-3 py-1.5 text-center">
                <div className="text-[18px] font-extrabold leading-none text-[#D9A441]">
                  {getBanglaNumber(
                    completedGoals.length
                  )}
                </div>

                <div className="mt-0.5 text-[9px] text-white/60">
                  completed
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              COMPLETED GOALS
          ================================================= */}

          <section>
            <div className="mb-3 flex items-center gap-2 px-5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#D9A441]" />

              <h2 className="text-[15px] font-extrabold text-[#22261F]">
                সম্পন্ন লক্ষ্য
              </h2>
            </div>

            <div className="space-y-3 px-5">
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
          </section>

          {/* =================================================
              MOTIVATION
          ================================================= */}

          <section className="mx-5 rounded-[18px] border border-[#E7E3D8] bg-white px-5 py-5 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#F3E3C2]">
              <Flame className="h-5 w-5 text-[#C97F1E]" />
            </div>

            <p className="mt-2.5 text-[14px] font-bold text-[#22261F]">
              Keep going.
            </p>

            <p className="mx-auto mt-1 max-w-[280px] text-[11.5px] leading-5 text-[#767C70]">
              একটি লক্ষ্য শেষ করা মানে
              শুধু একটি কাজ শেষ করা নয় —
              তুমি নিজের উপর বিশ্বাসটা
              আরও শক্ত করেছো।
            </p>
          </section>
        </>
      )}
    </div>
  );
}

/* =========================================================
   ACTIVE GOAL PREVIEW
========================================================= */

interface ActiveGoalPreviewProps {
  goal: Goal;
  children: React.ReactNode;
}

function ActiveGoalPreview({
  goal,
  children,
}: ActiveGoalPreviewProps) {
  /*
   * GoalCard already contains the
   * full goal functionality.
   *
   * এই wrapper শুধু visual container
   * হিসেবে কাজ করছে।
   */
  return (
    <div className="overflow-hidden rounded-[18px] border border-[#E7E3D8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="hidden">
        {children}
      </div>

      <ActiveGoalCompact
        goal={goal}
      />

      <div className="px-3 pb-3">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   ACTIVE GOAL COMPACT HEADER
========================================================= */

function ActiveGoalCompact({
  goal,
}: {
  goal: Goal;
}) {
  const progress = Math.min(
    100,
    Math.max(0, goal.progress)
  );

  const daysLeft = getDaysLeft(
    goal.endDate
  );

  const circumference =
    2 * Math.PI * 25;

  const offset =
    circumference -
    (circumference * progress) /
      100;

  return (
    <div className="px-[18px] pt-[18px]">
      <div className="flex items-center gap-3.5">
        {/* Ring */}

        <div className="relative h-[58px] w-[58px] shrink-0">
          <svg
            width="58"
            height="58"
            viewBox="0 0 58 58"
            className="-rotate-90"
          >
            <circle
              cx="29"
              cy="29"
              r="25"
              fill="none"
              stroke="#EDEAE0"
              strokeWidth="6"
            />

            <circle
              cx="29"
              cy="29"
              r="25"
              fill="none"
              stroke="#173C30"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={
                circumference
              }
              strokeDashoffset={
                offset
              }
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center text-[14px] font-extrabold text-[#22261F]">
            {getBanglaNumber(
              progress
            )}%
          </div>
        </div>

        {/* Content */}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15.5px] font-bold text-[#22261F]">
            {goal.title}
          </h3>

          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-full bg-[#EAF1FB] px-2.5 py-1 text-[11.5px] font-bold text-[#3B6FC4]">
              চলছে
            </span>

            <span className="text-[12px] text-[#767C70]">
              •
            </span>

            <span className="text-[12px] text-[#767C70]">
              {getBanglaNumber(
                goal.completedTasks
              )}
              /
              {getBanglaNumber(
                goal.totalTasks
              )}{" "}
              টাস্ক
            </span>
          </div>
        </div>

        <ChevronRight className="h-[18px] w-[18px] shrink-0 text-[#767C70]" />
      </div>

      <div className="pb-3 pt-2 text-[13px] text-[#767C70]">
        {daysLeft === 0
          ? "আজ শেষ দিন"
          : `${getBanglaNumber(
              daysLeft
            )} দিন বাকি`}
      </div>
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
    <div className="relative overflow-hidden rounded-[18px] border border-[#E7E3D8] bg-white">
      {/* Gold Shine */}

      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#D9A441] via-[#EBC372] to-[#D9A441]" />

      <div className="px-3.5 pb-3 pt-4">
        {/* Header */}

        <div className="flex items-center gap-2.5">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#F3E3C2]">
            <Trophy className="h-[18px] w-[18px] text-[#C97F1E]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-extrabold leading-tight text-[#22261F]">
              {goal.title}
            </p>

            <span className="text-[11px] text-[#767C70]">
              {getBanglaNumber(
                goal.completedTasks
              )}
              /
              {getBanglaNumber(
                goal.totalTasks
              )}{" "}
              টাস্ক সম্পন্ন
            </span>
          </div>

          <span className="shrink-0 text-[14px] font-extrabold text-[#C97F1E]">
            ১০০%
          </span>
        </div>

        {/* Progress */}

        <div className="my-2.5 h-1.5 overflow-hidden rounded-full bg-[#EFECE1]">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-[#D9A441] to-[#C98A2A]" />
        </div>

        {/* Footer */}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-[#E4F5EA] px-2 py-0.5 text-[11px] font-bold text-[#1E8E4C]">
              <Check className="h-3 w-3" />
              Completed
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              onDelete(goal.id)
            }
            className="text-[11px] text-[#767C70] underline underline-offset-[3px] transition hover:text-[#22261F]"
          >
            মুছে ফেলুন
          </button>
        </div>
      </div>
    </div>
  );
}