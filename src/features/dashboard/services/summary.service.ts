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

export interface SummaryItem {
  total: number;
  completed: number;
  remaining: number;
  progress: number;
}

export interface QuickSummaryData {
  tasks: SummaryItem;
  habits: SummaryItem;
  goals: SummaryItem;
}

/* =========================================================
   HELPERS
========================================================= */

const clampPercentage = (
  value: number
): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round(value))
  );
};

const createSummaryItem = (
  total: number,
  completed: number
): SummaryItem => {
  const safeTotal = Math.max(0, total);
  const safeCompleted = Math.min(
    safeTotal,
    Math.max(0, completed)
  );

  const remaining =
    safeTotal - safeCompleted;

  const progress =
    safeTotal > 0
      ? (safeCompleted / safeTotal) * 100
      : 0;

  return {
    total: safeTotal,
    completed: safeCompleted,
    remaining,
    progress: clampPercentage(
      progress
    ),
  };
};

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
   QUICK SUMMARY
========================================================= */

export const getQuickSummary =
  async (): Promise<QuickSummaryData> => {
    const today = getTodayString();

    /* =====================================================
       TASKS

       শুধু আজকের dueDate-এর task count হবে।

       Future / Pending task:
       ❌ count হবে না
    ===================================================== */

    const allTasks = await getTasks();

    const todayTasks = allTasks.filter(
      (task) => {
        if (!task.dueDate) {
          return false;
        }

        return (
          task.dueDate.slice(0, 10) ===
          today
        );
      }
    );

    const completedTasks =
      todayTasks.filter(
        (task) =>
          task.status === "completed"
      ).length;

    const taskSummary =
      createSummaryItem(
        todayTasks.length,
        completedTasks
      );

    /* =====================================================
       HABITS

       আজ active থাকা habit count হবে।

       আজ complete হয়েছে → completed
       আজ complete হয়নি → remaining
    ===================================================== */

    const allHabits = await getHabits();

    const activeHabits =
      allHabits.filter(
        (habit) =>
          habit.status === "active"
      );

    let completedHabits = 0;

    await Promise.all(
      activeHabits.map(
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

          if (completedToday) {
            completedHabits += 1;
          }
        }
      )
    );

    const habitSummary =
      createSummaryItem(
        activeHabits.length,
        completedHabits
      );

    /* =====================================================
       GOALS

       শুধু আজকের মধ্যে active থাকা Goal count হবে।

       startDate <= today <= endDate

       Future Goal:
       ❌ count হবে না

       Expired Goal:
       ❌ count হবে না
    ===================================================== */

    const allGoals = await getGoals();

    const todayGoals =
      allGoals.filter(
        (goal) =>
          goal.status === "active" &&
          goal.startDate <= today &&
          goal.endDate >= today
      );

    let totalGoalTasks = 0;
    let completedGoalTasks = 0;

    await Promise.all(
      todayGoals.map(
        async (goal) => {
          const goalTasks =
            await getGoalTasks(
              goal.id
            );

          totalGoalTasks +=
            goalTasks.length;

          completedGoalTasks +=
            goalTasks.filter(
              (task) =>
                task.completed
            ).length;
        }
      )
    );

    const goalSummary =
      createSummaryItem(
        totalGoalTasks,
        completedGoalTasks
      );

    /* =====================================================
       RETURN
    ===================================================== */

    return {
      tasks: taskSummary,
      habits: habitSummary,
      goals: goalSummary,
    };
  };