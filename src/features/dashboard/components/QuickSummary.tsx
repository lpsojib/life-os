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
    String(
      today.getMonth() + 1
    ).padStart(2, "0"),
    String(
      today.getDate()
    ).padStart(2, "0"),
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
  /*
   * Future habit এখনো শুরু হয়নি
   */
  if (
    habit.startDate &&
    habit.startDate > today
  ) {
    return false;
  }

  /*
   * Habit শেষ হয়ে গেছে
   */
  if (
    habit.endDate &&
    habit.endDate < today
  ) {
    return false;
  }

  return true;
};

/* =========================================================
   MAIN SUMMARY
========================================================= */

export const getQuickSummary =
  async (): Promise<QuickSummaryData> => {

    const today =
      getTodayString();

    /* =====================================================
       TASKS

       শুধু আজকের task count হবে।
       Future / pending task count হবে না।
    ===================================================== */

    const allTasks =
      await getTasks();

    const todayTasks =
      allTasks.filter(
        (task) => {

          /*
           * completed task-এর dueDate
           * আজকের হলে count হবে।
           */
          if (
            task.dueDate === today
          ) {
            return true;
          }

          /*
           * কিছু task-এর dueDate null হতে পারে।
           * status daily হলে আজকের task হিসেবে ধরা হবে।
           */
          if (
            !task.dueDate &&
            task.status === "daily"
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
        ? (taskCompleted /
            taskTotal) *
          100
        : 0;

    /* =====================================================
       HABITS

       শুধু আজকে active হওয়া habit count হবে।
       Future start date-এর habit count হবে না।
    ===================================================== */

    const allHabits =
      await getHabits();

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
            habitCompleted += 1;
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
        ? (habitCompleted /
            habitTotal) *
          100
        : 0;

    /* =====================================================
       GOALS

       শুধু আজকের active goal count হবে।

       Goal-এর startDate যদি future হয়,
       তাহলে এখনো active নয়।

       Goal-এর endDate আজকের আগে হলে
       expired হিসেবে বাদ যাবে।
    ===================================================== */

    const allGoals =
      await getGoals();

    const todayGoals =
      allGoals.filter(
        (goal) => {

          if (
            goal.startDate &&
            goal.startDate > today
          ) {
            return false;
          }

          if (
            goal.endDate &&
            goal.endDate < today
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
             * Goal already completed
             */
            if (
              goal.status ===
              "completed"
            ) {
              goalCompleted += 1;

              return 100;
            }

            /*
             * Goal-এর নিজের progress থাকলে
             * সেটাই ব্যবহার করবো।
             */
            if (
              typeof goal.progress ===
              "number"
            ) {
              if (
                goal.progress >=
                100
              ) {
                goalCompleted += 1;
              }

              return goal.progress;
            }

            /*
             * Otherwise Goal Tasks থেকে
             * progress calculate হবে।
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
              goalCompleted += 1;
            }

            return (
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
        ? goalProgressValues.reduce(
            (sum, value) =>
              sum + value,
            0
          ) /
          goalProgressValues.length
        : 0;

    /* =====================================================
       RETURN
    ===================================================== */

    return {
      taskTotal,
      taskCompleted,
      taskPending,

      habitTotal,
      habitCompleted,
      habitPending,

      goalTotal,
      goalCompleted,
      goalPending,

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