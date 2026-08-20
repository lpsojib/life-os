"use client";

import { useCallback, useEffect, useState } from "react";

import { getTasks } from "@/features/tasks/services/task.service";

import {
  getHabits,
  getHabitCompletions,
} from "@/features/habits/services/habit.service";

import {
  getGoals,
  getGoalTasks,
} from "@/features/goals/services/goal.service";

interface Summary {
  taskTotal: number;
  taskCompleted: number;
  taskPending: number;

  habitTotal: number;
  habitCompleted: number;
  habitPending: number;

  goalTotal: number;
  goalCompleted: number;
  goalPending: number;

  taskCompletion: number;
  habitCompletion: number;
  goalProgress: number;
}

/* =========================================================
   DATE
========================================================= */

const getTodayString = (): string => {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(
      2,
      "0"
    ),
    String(today.getDate()).padStart(
      2,
      "0"
    ),
  ].join("-");
};

/* =========================================================
   HABIT DATE FILTER
========================================================= */

const isHabitAvailableToday = (
  habit: {
    startDate?: string;
    endDate?: string;
  },
  today: string
): boolean => {
  if (
    habit.startDate &&
    habit.startDate > today
  ) {
    return false;
  }

  if (
    habit.endDate &&
    habit.endDate < today
  ) {
    return false;
  }

  return true;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function QuickSummary() {
  const [summary, setSummary] =
    useState<Summary | null>(null);

  const [loading, setLoading] =
    useState(true);

  /* =======================================================
     LOAD SUMMARY
  ======================================================= */

  const loadSummary = useCallback(
    async () => {
      try {
        /* ===================================================
           TODAY
        =================================================== */

        const today =
          getTodayString();

        /* ===================================================
           TASK
        =================================================== */

        const allTasks =
          await getTasks();

        /*
         * শুধু আজকের task।
         *
         * Future/pending task এখানে
         * count হবে না।
         */
        const todayTasks =
          allTasks.filter(
            (task) => {
              if (
                task.dueDate ===
                today
              ) {
                return true;
              }

              if (
                !task.dueDate &&
                task.status ===
                  "daily"
              ) {
                return true;
              }

              return false;
            }
          );

        const taskTotal =
          todayTasks.length;

        const taskCompleted =
          todayTasks.filter(
            (task) =>
              task.status ===
              "completed"
          ).length;

        const taskPending =
          Math.max(
            0,
            taskTotal -
              taskCompleted
          );

        const taskCompletion =
          taskTotal > 0
            ? Math.round(
                (taskCompleted /
                  taskTotal) *
                  100
              )
            : 0;

        /* ===================================================
           HABIT
        =================================================== */

        const allHabits =
          await getHabits();

        /*
         * শুধু আজকের available habit।
         *
         * Example:
         *
         * Today = 2026-08-20
         *
         * startDate = 2026-09-01
         * => বাদ
         */
        const todayHabits =
          allHabits.filter(
            (habit) =>
              isHabitAvailableToday(
                habit,
                today
              )
          );

        const habitTotal =
          todayHabits.length;

        let habitCompleted = 0;

        await Promise.all(
          todayHabits.map(
            async (habit) => {
              const completions =
                await getHabitCompletions(
                  habit.id
                );

              const completedToday =
                completions.some(
                  (completion) =>
                    completion.date ===
                      today &&
                    completion.completed ===
                      true
                );

              if (
                completedToday
              ) {
                habitCompleted +=
                  1;
              }
            }
          )
        );

        const habitPending =
          Math.max(
            0,
            habitTotal -
              habitCompleted
          );

        const habitCompletion =
          habitTotal > 0
            ? Math.round(
                (habitCompleted /
                  habitTotal) *
                  100
              )
            : 0;

        /* ===================================================
           GOAL
        =================================================== */

        const allGoals =
          await getGoals();

        /*
         * শুধু আজকে active goal।
         */
        const todayGoals =
          allGoals.filter(
            (goal) => {
              if (
                goal.startDate &&
                goal.startDate >
                  today
              ) {
                return false;
              }

              if (
                goal.endDate &&
                goal.endDate <
                  today
              ) {
                return false;
              }

              return (
                goal.status !==
                "completed"
              );
            }
          );

        const goalTotal =
          todayGoals.length;

        let goalCompleted = 0;

        const goalProgressValues =
          await Promise.all(
            todayGoals.map(
              async (goal) => {
                /*
                 * Goal-এর নিজের progress
                 */
                if (
                  typeof goal.progress ===
                  "number"
                ) {
                  if (
                    goal.progress >=
                    100
                  ) {
                    goalCompleted +=
                      1;
                  }

                  return goal.progress;
                }

                /*
                 * Goal task থেকে progress
                 */
                const goalTasks =
                  await getGoalTasks(
                    goal.id
                  );

                if (
                  goalTasks.length ===
                  0
                ) {
                  return 0;
                }

                const completed =
                  goalTasks.filter(
                    (task) =>
                      task.completed
                  ).length;

                if (
                  completed ===
                  goalTasks.length
                ) {
                  goalCompleted +=
                    1;
                }

                return Math.round(
                  (completed /
                    goalTasks.length) *
                    100
                );
              }
            )
          );

        const goalPending =
          Math.max(
            0,
            goalTotal -
              goalCompleted
          );

        const goalProgress =
          goalProgressValues.length >
          0
            ? Math.round(
                goalProgressValues.reduce(
                  (
                    total,
                    value
                  ) =>
                    total + value,
                  0
                ) /
                  goalProgressValues.length
              )
            : 0;

        /* ===================================================
           SAVE
        =================================================== */

        setSummary({
          taskTotal,
          taskCompleted,
          taskPending,

          habitTotal,
          habitCompleted,
          habitPending,

          goalTotal,
          goalCompleted,
          goalPending,

          taskCompletion,
          habitCompletion,
          goalProgress,
        });
      } catch (error) {
        console.error(
          "Failed to load overview:",
          error
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadSummary();
      }, 0);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [loadSummary]);

  /* =======================================================
     REFRESH WHEN DATA CHANGES
  ======================================================= */

  useEffect(() => {
    const handleUpdate = () => {
      void loadSummary();
    };

    window.addEventListener(
      "life-os-task-changed",
      handleUpdate
    );

    window.addEventListener(
      "life-os-habit-changed",
      handleUpdate
    );

    window.addEventListener(
      "life-os-goal-changed",
      handleUpdate
    );

    window.addEventListener(
      "life-os-goal-synced",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "life-os-task-changed",
        handleUpdate
      );

      window.removeEventListener(
        "life-os-habit-changed",
        handleUpdate
      );

      window.removeEventListener(
        "life-os-goal-changed",
        handleUpdate
      );

      window.removeEventListener(
        "life-os-goal-synced",
        handleUpdate
      );
    };
  }, [loadSummary]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading ||
    !summary
  ) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl bg-gray-100"
            />
          )
        )}
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  const overall =
    Math.round(
      (
        summary.taskCompletion +
        summary.habitCompletion +
        summary.goalProgress
      ) / 3
    );

  return (
    <div className="grid grid-cols-2 gap-3">

      {/* TASK */}

      <div className="rounded-2xl bg-[#E3EFEA] p-4">
        <div className="text-sm text-[#2A6459]">
          আজকের টাস্ক
        </div>

        <div className="mt-2 text-2xl font-bold text-[#2A6459]">
          {summary.taskCompleted}/
          {summary.taskTotal}
        </div>

        <div className="mt-1 text-xs text-[#2A2318]/70">
          {summary.taskPending} টি বাকি
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-[#2A6459] transition-all"
            style={{
              width: `${summary.taskCompletion}%`,
            }}
          />
        </div>
      </div>

      {/* HABIT */}

      <div className="rounded-2xl bg-[#F5EACB] p-4">
        <div className="text-sm text-[#B4842A]">
          আজকের অভ্যাস
        </div>

        <div className="mt-2 text-2xl font-bold text-[#B4842A]">
          {summary.habitCompleted}/
          {summary.habitTotal}
        </div>

        <div className="mt-1 text-xs text-[#2A2318]/70">
          {summary.habitPending} টি বাকি
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-[#B4842A] transition-all"
            style={{
              width: `${summary.habitCompletion}%`,
            }}
          />
        </div>
      </div>

      {/* GOAL */}

      <div className="rounded-2xl bg-[#F0E3EC] p-4">
        <div className="text-sm text-[#7C4F6E]">
          সক্রিয় লক্ষ্য
        </div>

        <div className="mt-2 text-2xl font-bold text-[#7C4F6E]">
          {summary.goalCompleted}/
          {summary.goalTotal}
        </div>

        <div className="mt-1 text-xs text-[#2A2318]/70">
          {summary.goalPending} টি বাকি
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-[#7C4F6E] transition-all"
            style={{
              width: `${summary.goalProgress}%`,
            }}
          />
        </div>
      </div>

      {/* OVERALL */}

      <div className="rounded-2xl bg-[#F6E4D8] p-4">
        <div className="text-sm text-[#B15A38]">
          মোট সম্পন্নতা
        </div>

        <div className="mt-2 text-2xl font-bold text-[#B15A38]">
          {overall}%
        </div>

        <div className="mt-1 text-xs text-[#2A2318]/70">
          আজকের সামগ্রিক অগ্রগতি
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-[#B15A38] transition-all"
            style={{
              width: `${overall}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}