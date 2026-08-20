import { getTasks } from "@/features/tasks/services/task.service";
import {
  getHabits,
  getHabitCompletions,
} from "@/features/habits/services/habit.service";
import {
  getGoals,
  getGoalTasks,
} from "@/features/goals/services/goal.service";

export interface QuickSummaryData {
  taskCompletion: number;
  habitCompletion: number;
  goalProgress: number;
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

const getTodayString = (): string => {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
};

/* =========================================================
   QUICK SUMMARY
========================================================= */

export const getQuickSummary =
  async (): Promise<QuickSummaryData> => {
    const today = getTodayString();

    /* =====================================================
       TASK
       শুধু আজকের Task count হবে।
       Pending/Future Task এখানে count হবে না।
    ===================================================== */

    const tasks = await getTasks();

    const todayTasks = tasks.filter(
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

    const totalTodayTasks =
      todayTasks.length;

    const completedTodayTasks =
      todayTasks.filter(
        (task) =>
          task.status === "completed"
      ).length;

    const taskCompletion =
      totalTodayTasks > 0
        ? (completedTodayTasks /
            totalTodayTasks) *
          100
        : 0;

    /* =====================================================
       HABIT
       আজকের active habit-এর মধ্যে
       কতগুলো আজ complete হয়েছে।
    ===================================================== */

    const habits = await getHabits();

    const activeHabits =
      habits.filter(
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

    const habitCompletion =
      activeHabits.length > 0
        ? (completedHabits /
            activeHabits.length) *
          100
        : 0;

    /* =====================================================
       GOAL
       Active Goal-এর progress-এর average।
    ===================================================== */

    const goals = await getGoals();

    const activeGoals =
      goals.filter(
        (goal) =>
          goal.status === "active"
      );

    let goalProgress = 0;

    if (activeGoals.length > 0) {
      const progressValues =
        await Promise.all(
          activeGoals.map(
            async (goal) => {
              /* -----------------------------------------
                 Goal-এর নিজের progress থাকলে
                 সেটাই ব্যবহার করবে।
              ----------------------------------------- */

              if (
                typeof goal.progress ===
                "number"
              ) {
                return goal.progress;
              }

              /* -----------------------------------------
                 না থাকলে Goal Tasks থেকে calculate করবে।
              ----------------------------------------- */

              const goalTasks =
                await getGoalTasks(
                  goal.id
                );

              if (
                goalTasks.length === 0
              ) {
                return 0;
              }

              const completed =
                goalTasks.filter(
                  (task) =>
                    task.completed
                ).length;

              return (
                (completed /
                  goalTasks.length) *
                100
              );
            }
          )
        );

      goalProgress =
        progressValues.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / activeGoals.length;
    }

    /* =====================================================
       RETURN
    ===================================================== */

    return {
      taskCompletion:
        clampPercentage(
          taskCompletion
        ),

      habitCompletion:
        clampPercentage(
          habitCompletion
        ),

      goalProgress:
        clampPercentage(
          goalProgress
        ),
    };
  };