"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getHabitCompletions,
  getHabits,
  toggleHabitCompletion,
} from "@/features/habits/services/habit.service";

import type {
  Habit,
  HabitCompletion,
} from "@/features/habits/types/habit.types";

interface HabitWithProgress {
  habit: Habit;
  completedToday: boolean;
  streak: number;
}

const getTodayString = (): string => {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
};

const calculateStreak = (
  completions: HabitCompletion[],
  today: string
): number => {
  const completedDates = new Set(
    completions
      .filter((item) => item.completed)
      .map((item) => item.date)
  );

  let streak = 0;

  const date = new Date(`${today}T00:00:00`);

  while (true) {
    const dateString = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    if (!completedDates.has(dateString)) {
      break;
    }

    streak += 1;

    date.setDate(date.getDate() - 1);
  }

  return streak;
};

export default function TodaysHabits() {
  const [habits, setHabits] = useState<HabitWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadHabits = useCallback(async () => {
    try {
      const today = getTodayString();

      const activeHabits = await getHabits();

      const result = await Promise.all(
        activeHabits.map(async (habit) => {
          const completions =
            await getHabitCompletions(habit.id);

          const todayCompletion = completions.find(
            (item) => item.date === today
          );

          return {
            habit,
            completedToday:
              todayCompletion?.completed === true,
            streak: calculateStreak(
              completions,
              today
            ),
          };
        })
      );

      setHabits(result);
    } catch (error) {
      console.error(
        "Failed to load dashboard habits:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHabits();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadHabits]);

  const handleToggle = async (
    habitId: string,
    completed: boolean
  ) => {
    const today = getTodayString();

    setUpdatingId(habitId);

    // Optimistic UI
    setHabits((current) =>
      current.map((item) => {
        if (item.habit.id !== habitId) {
          return item;
        }

        return {
          ...item,
          completedToday: completed,
          streak: completed
            ? item.streak + 1
            : Math.max(0, item.streak - 1),
        };
      })
    );

    try {
      await toggleHabitCompletion(
        habitId,
        today,
        completed
      );
    } catch (error) {
      console.error(
        "Failed to toggle habit:",
        error
      );

      // Restore correct data
      await loadHabits();
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-neutral-900">
        <div className="mb-5">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />

          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-800"
            />
          ))}
        </div>
      </section>
    );
  }

  if (habits.length === 0) {
    return (
      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-neutral-900">
        <div className="mb-5">
          <h2 className="text-xl font-bold">
            {"Today's Habits"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            আজকের অভ্যাসগুলো এখানে দেখা যাবে।
          </p>
        </div>

        <div className="rounded-xl border border-dashed p-8 text-center">
          <div className="text-3xl">🌱</div>

          <p className="mt-3 font-medium">
            আজকের জন্য কোনো habit নেই
          </p>

          <p className="mt-1 text-sm text-gray-500">
            নতুন habit তৈরি করলে এখানে দেখাবে।
          </p>
        </div>
      </section>
    );
  }

  const completedCount = habits.filter(
    (item) => item.completedToday
  ).length;

  const completionPercent = Math.round(
    (completedCount / habits.length) * 100
  );

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-neutral-900">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">
            {"Today's Habits"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            আজকের habit completion
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold">
            {completionPercent}%
          </p>

          <p className="text-xs text-gray-500">
            {completedCount}/{habits.length} done
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{
              width: `${completionPercent}%`,
            }}
          />
        </div>
      </div>

      {/* Habits */}
      <div className="space-y-3">
        {habits.map(
          ({
            habit,
            completedToday,
            streak,
          }) => (
            <div
              key={habit.id}
              className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              {/* Checkbox */}
              <button
                type="button"
                disabled={
                  updatingId === habit.id
                }
                onClick={() =>
                  void handleToggle(
                    habit.id,
                    !completedToday
                  )
                }
                aria-label={
                  completedToday
                    ? `Mark ${habit.name} incomplete`
                    : `Complete ${habit.name}`
                }
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  completedToday
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-gray-300 hover:border-emerald-400 dark:border-neutral-600"
                } ${
                  updatingId === habit.id
                    ? "cursor-wait opacity-60"
                    : ""
                }`}
              >
                {completedToday ? "✓" : ""}
              </button>

              {/* Habit info */}
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate font-medium ${
                    completedToday
                      ? "text-gray-400 line-through"
                      : ""
                  }`}
                >
                  {habit.name}
                </p>

                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  {habit.time && (
                    <span>
                      🕐 {habit.time}
                    </span>
                  )}

                  <span>
                    🔥 {streak} day
                    {streak !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Status */}
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  completedToday
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400"
                }`}
              >
                {completedToday
                  ? "Done"
                  : "Pending"}
              </span>
            </div>
          )
        )}
      </div>
    </section>
  );
}