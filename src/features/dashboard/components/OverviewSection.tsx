"use client";

import {
  CheckSquare,
  Flame,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import DashboardCard from "./DashboardCard";
import DashboardSectionTitle from "./DashboardSectionTitle";

import { getTasks } from "@/features/tasks/services/task.service";

import {
  getHabits,
  getHabitCompletions,
} from "@/features/habits/services/habit.service";

import {
  getGoals,
  getGoalTasks,
} from "@/features/goals/services/goal.service";

/* =========================================================
   TYPES
========================================================= */

interface Summary {
  tasks: {
    total: number;
    completed: number;
    pending: number;
  };

  habits: {
    total: number;
    completed: number;
    pending: number;
  };

  goals: {
    total: number;
    completed: number;
    pending: number;
    progress: number;
  };
}

/* =========================================================
   COLORS
========================================================= */

const COLORS = {
  ink: "#2A2318",
  muted: "#8C8374",

  task: {
    foreground: "#2A6459",
    background: "#E3EFEA",
  },

  habit: {
    foreground: "#B4842A",
    background: "#F5EACB",
  },

  goal: {
    foreground: "#7C4F6E",
    background: "#F0E3EC",
  },

  progress: {
    foreground: "#B15A38",
    background: "#F6E4D8",
  },
};

/* =========================================================
   HELPERS
========================================================= */

const getTodayString = (): string => {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const clampPercentage = (
  value: number
): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value)
    )
  );
};

/* =========================================================
   OVERVIEW CARD
========================================================= */

interface OverviewCardProps {
  icon: typeof CheckSquare;
  title: string;
  value: string;
  subtitle: string;
  foreground: string;
  background: string;
}

function OverviewCard({
  icon: Icon,
  title,
  value,
  subtitle,
  foreground,
  background,
}: OverviewCardProps) {
  return (
    <div
      className="rounded-2xl p-3.5 flex flex-col gap-2.5"
      style={{
        background,
      }}
    >
      {/* Icon */}

      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          background: "#FFFFFF",
        }}
      >
        <Icon
          size={15}
          color={foreground}
          strokeWidth={2.2}
        />
      </div>

      {/* Content */}

      <div>
        <div
          style={{
            fontFamily:
              "'IBM Plex Mono', monospace",
            fontSize: "18px",
            fontWeight: 600,
            color: foreground,
          }}
        >
          {value}
        </div>

        <div
          className="text-xs mt-0.5"
          style={{
            color: COLORS.ink,
            fontWeight: 600,
            opacity: 0.8,
          }}
        >
          {title}
        </div>

        <div
          className="text-[10px] mt-1"
          style={{
            color: COLORS.muted,
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function OverviewSection() {
  const [summary, setSummary] =
    useState<Summary>({
      tasks: {
        total: 0,
        completed: 0,
        pending: 0,
      },

      habits: {
        total: 0,
        completed: 0,
        pending: 0,
      },

      goals: {
        total: 0,
        completed: 0,
        pending: 0,
        progress: 0,
      },
    });

  const [loading, setLoading] =
    useState(true);

  /* =======================================================
     LOAD SUMMARY
  ======================================================= */

  const loadSummary =
    useCallback(async () => {
      try {
        setLoading(true);

        const today =
          getTodayString();

        /* =================================================
           TASKS
        ================================================= */

        const allTasks =
          await getTasks();

        /*
         * শুধুমাত্র আজকের task।
         *
         * Future/pending task এখানে আসবে না।
         *
         * dueDate অবশ্যই আজকের date হতে হবে।
         */

        const todayTasks =
          allTasks.filter(
            (task) =>
              task.dueDate === today
          );

        const totalTasks =
          todayTasks.length;

        const completedTasks =
          todayTasks.filter(
            (task) =>
              task.status ===
              "completed"
          ).length;

        const pendingTasks =
          Math.max(
            0,
            totalTasks -
              completedTasks
          );

        /* =================================================
           HABITS
        ================================================= */

        const allHabits =
          await getHabits();

        /*
         * আজকের জন্য active habits।
         *
         * Habit-এর আলাদা dueDate নেই,
         * তাই active habit-গুলো আজকের habit
         * হিসেবে গণনা করা হচ্ছে।
         */

        const activeHabits =
          allHabits.filter(
            (habit) =>
              habit.status ===
              "active"
          );

        const totalHabits =
          activeHabits.length;

        let completedHabits = 0;

        /*
         * প্রতিটি habit আজ complete হয়েছে
         * কিনা check করছি।
         */

        await Promise.all(
          activeHabits.map(
            async (habit) => {
              try {
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
                  completedHabits += 1;
                }
              } catch (error) {
                console.error(
                  "Habit completion load failed:",
                  error
                );
              }
            }
          )
        );

        const pendingHabits =
          Math.max(
            0,
            totalHabits -
              completedHabits
          );

        /* =================================================
           GOALS
        ================================================= */

        const allGoals =
          await getGoals();

        /*
         * শুধুমাত্র যে Goal-এর date range-এর
         * মধ্যে আজকের date আছে সেগুলো।
         *
         * Future goal এখানে গণনা হবে না।
         */

        const todayGoals =
          allGoals.filter(
            (goal) =>
              goal.startDate <=
                today &&
              goal.endDate >=
                today
          );

        const totalGoals =
          todayGoals.length;

        let completedGoals = 0;

        let totalGoalProgress = 0;

        /*
         * প্রতিটি আজকের goal-এর progress
         * calculate করছি।
         */

        for (const goal of todayGoals) {
          let progress =
            typeof goal.progress ===
            "number"
              ? goal.progress
              : 0;

          /*
           * Goal-এর progress যদি 0 হয়,
           * Goal Tasks থেকে আবার calculate করি।
           */

          const goalTasks =
            await getGoalTasks(
              goal.id
            );

          if (
            goalTasks.length > 0
          ) {
            const completed =
              goalTasks.filter(
                (task) =>
                  task.completed
              ).length;

            progress =
              (completed /
                goalTasks.length) *
              100;
          }

          progress =
            clampPercentage(
              progress
            );

          totalGoalProgress +=
            progress;

          if (
            goal.status ===
              "completed" ||
            progress === 100
          ) {
            completedGoals += 1;
          }
        }

        const pendingGoals =
          Math.max(
            0,
            totalGoals -
              completedGoals
          );

        const goalProgress =
          totalGoals > 0
            ? clampPercentage(
                totalGoalProgress /
                  totalGoals
              )
            : 0;

        /* =================================================
           SET SUMMARY
        ================================================= */

        setSummary({
          tasks: {
            total:
              totalTasks,
            completed:
              completedTasks,
            pending:
              pendingTasks,
          },

          habits: {
            total:
              totalHabits,
            completed:
              completedHabits,
            pending:
              pendingHabits,
          },

          goals: {
            total:
              totalGoals,
            completed:
              completedGoals,
            pending:
              pendingGoals,
            progress:
              goalProgress,
          },
        });
      } catch (error) {
        console.error(
          "Overview summary load failed:",
          error
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* =======================================================
     LOAD + REALTIME UPDATE
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const initialLoad =
      async () => {
        if (cancelled) {
          return;
        }

        await loadSummary();
      };

    void initialLoad();

    /*
     * Task / Habit / Goal change হলে
     * Overview আবার load হবে।
     */

    const handleUpdate =
      () => {
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
      "life-os-task-synced",
      handleUpdate
    );

    window.addEventListener(
      "life-os-goal-synced",
      handleUpdate
    );

    /*
     * Online হলে Firebase data থেকে
     * আবার calculate হবে।
     */

    window.addEventListener(
      "online",
      handleUpdate
    );

    return () => {
      cancelled = true;

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
        "life-os-task-synced",
        handleUpdate
      );

      window.removeEventListener(
        "life-os-goal-synced",
        handleUpdate
      );

      window.removeEventListener(
        "online",
        handleUpdate
      );
    };
  }, [loadSummary]);

  /* =======================================================
     VALUES
  ======================================================= */

  const taskValue =
    loading
      ? "—"
      : `${summary.tasks.completed}/${summary.tasks.total}`;

  const habitValue =
    loading
      ? "—"
      : `${summary.habits.completed}/${summary.habits.total}`;

  const goalValue =
    loading
      ? "—"
      : `${summary.goals.completed}/${summary.goals.total}`;

  const progressValue =
    loading
      ? "—"
      : `${summary.goals.progress}%`;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <DashboardCard>
      <DashboardSectionTitle
        title="ওভারভিউ"
      />

      <div className="grid grid-cols-2 gap-3">
        {/* ================================================
            TODAY TASKS
        ================================================= */}

        <OverviewCard
          icon={CheckSquare}
          title="আজকের টাস্ক"
          value={taskValue}
          subtitle={
            loading
              ? "লোড হচ্ছে..."
              : `${summary.tasks.pending}টি বাকি`
          }
          foreground={
            COLORS.task.foreground
          }
          background={
            COLORS.task.background
          }
        />

        {/* ================================================
            TODAY HABITS
        ================================================= */}

        <OverviewCard
          icon={Flame}
          title="আজকের অভ্যাস"
          value={habitValue}
          subtitle={
            loading
              ? "লোড হচ্ছে..."
              : `${summary.habits.pending}টি বাকি`
          }
          foreground={
            COLORS.habit.foreground
          }
          background={
            COLORS.habit.background
          }
        />

        {/* ================================================
            TODAY GOALS
        ================================================= */}

        <OverviewCard
          icon={Target}
          title="সক্রিয় লক্ষ্য"
          value={goalValue}
          subtitle={
            loading
              ? "লোড হচ্ছে..."
              : `${summary.goals.pending}টি বাকি`
          }
          foreground={
            COLORS.goal.foreground
          }
          background={
            COLORS.goal.background
          }
        />

        {/* ================================================
            GOAL PROGRESS
        ================================================= */}

        <OverviewCard
          icon={TrendingUp}
          title="লক্ষ্য অগ্রগতি"
          value={progressValue}
          subtitle={
            loading
              ? "লোড হচ্ছে..."
              : "আজকের লক্ষ্য"
          }
          foreground={
            COLORS.progress.foreground
          }
          background={
            COLORS.progress.background
          }
        />
      </div>
    </DashboardCard>
  );
}