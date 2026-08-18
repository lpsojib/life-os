"use client";

import { useMemo } from "react";

export default function DashboardPage() {
  /**
   * আপাতত UI-এর জন্য sample data।
   *
   * পরের ধাপে এগুলো Firebase Task,
   * Habit এবং Goal data দিয়ে replace করব।
   */

  const tasks = [
    {
      id: 1,
      title: "আজকের গুরুত্বপূর্ণ কাজ শেষ করা",
      completed: true,
    },
    {
      id: 2,
      title: "Web Development শেখা",
      completed: false,
    },
    {
      id: 3,
      title: "আজকের পড়াশোনা শেষ করা",
      completed: false,
    },
  ];

  const habits = [
    {
      id: 1,
      name: "সকালে নামাজ",
      completed: true,
      streak: 7,
    },
    {
      id: 2,
      name: "৩০ মিনিট পড়াশোনা",
      completed: true,
      streak: 12,
    },
    {
      id: 3,
      name: "Exercise",
      completed: false,
      streak: 4,
    },
  ];

  const goals = [
    {
      id: 1,
      title: "Become Web Developer",
      completedTasks: 18,
      totalTasks: 30,
      daysLeft: 42,
    },
    {
      id: 2,
      title: "English Learning",
      completedTasks: 12,
      totalTasks: 20,
      daysLeft: 28,
    },
  ];

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const taskProgress =
    tasks.length > 0
      ? Math.round(
          (completedTasks /
            tasks.length) *
            100
        )
      : 0;

  const completedHabits =
    habits.filter(
      (habit) => habit.completed
    ).length;

  const habitProgress =
    habits.length > 0
      ? Math.round(
          (completedHabits /
            habits.length) *
            100
        )
      : 0;

  const goalProgress = useMemo(() => {
    if (goals.length === 0) {
      return 0;
    }

    const totalCompleted =
      goals.reduce(
        (sum, goal) =>
          sum + goal.completedTasks,
        0
      );

    const totalTasks =
      goals.reduce(
        (sum, goal) =>
          sum + goal.totalTasks,
        0
      );

    if (totalTasks === 0) {
      return 0;
    }

    return Math.round(
      (totalCompleted /
        totalTasks) *
        100
    );
  }, [goals]);

  const today = new Date();

  const dateText =
    today.toLocaleDateString(
      "bn-BD",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );

  return (
    <main className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <section className="mb-7">
          <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-medium text-blue-600">
                  শুভ সকাল 👋
                </p>

                <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                  আপনার Dashboard
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  আজকের কাজ, অভ্যাস এবং লক্ষ্য
                  এক নজরে দেখুন।
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 px-4 py-3 sm:text-right">
                <p className="text-xs text-gray-400">
                  আজ
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-700">
                  {dateText}
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* =====================================================
            OVERVIEW CARDS
        ====================================================== */}

        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

          {/* Tasks */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-gray-500">
                  আজকের Task
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {tasks.length}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {completedTasks} টি সম্পন্ন
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="17"
                    rx="2"
                  />
                  <path d="M8 2v4M16 2v4M3 10h18" />
                  <path d="m8 15 2 2 5-5" />
                </svg>
              </div>

            </div>
          </div>

          {/* Habits */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-gray-500">
                  আজকের Habit
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {habits.length}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {completedHabits} টি সম্পন্ন
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path d="M12 3v18" />
                  <path d="M5 7c2.5-1.5 5-1.5 7 0" />
                  <path d="M12 7c2-1.5 4.5-1.5 7 0" />
                  <path d="M5 13c2.5-1.5 5-1.5 7 0" />
                  <path d="M12 13c2-1.5 4.5-1.5 7 0" />
                </svg>
              </div>

            </div>
          </div>

          {/* Goals */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-gray-500">
                  Active Goal
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {goals.length}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  চলমান লক্ষ্য
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="5"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="1"
                  />
                </svg>
              </div>

            </div>
          </div>

          {/* Completion */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-gray-500">
                  Overall Progress
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {Math.round(
                    (taskProgress +
                      habitProgress +
                      goalProgress) /
                      3
                  )}
                  %
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  আজকের অগ্রগতি
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path d="M4 19V5" />
                  <path d="M4 19h16" />
                  <path d="m7 15 3-4 3 2 5-7" />
                </svg>
              </div>

            </div>
          </div>

        </section>

        {/* =====================================================
            MAIN GRID
        ====================================================== */}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* =================================================
              TODAY'S TASKS
          ================================================== */}

          <section className="rounded-2xl border bg-white shadow-sm lg:col-span-2">

            <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">

              <div>
                <h2 className="font-semibold text-gray-900">
                  আজকের Task
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  আজকের গুরুত্বপূর্ণ কাজগুলো
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                {completedTasks}/{tasks.length}
              </span>

            </div>

            <div className="p-4 sm:p-5">

              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-gray-50"
                >

                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                      task.completed
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {task.completed && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="h-4 w-4"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  <p
                    className={`min-w-0 flex-1 text-sm ${
                      task.completed
                        ? "text-gray-400 line-through"
                        : "text-gray-700"
                    }`}
                  >
                    {task.title}
                  </p>

                  <span
                    className={`text-xs ${
                      task.completed
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                  >
                    {task.completed
                      ? "সম্পন্ন"
                      : "বাকি"}
                  </span>

                </div>
              ))}

              {/* Task Progress */}
              <div className="mt-4 border-t pt-4">

                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Task Progress
                  </span>

                  <span className="font-semibold text-gray-700">
                    {taskProgress}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{
                      width: `${taskProgress}%`,
                    }}
                  />
                </div>

              </div>

            </div>
          </section>

          {/* =================================================
              TODAY'S HABITS
          ================================================== */}

          <section className="rounded-2xl border bg-white shadow-sm">

            <div className="flex items-center justify-between border-b px-5 py-4">

              <div>
                <h2 className="font-semibold text-gray-900">
                  আজকের Habit
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  ধারাবাহিকতা ধরে রাখুন
                </p>
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                {habitProgress}%
              </span>

            </div>

            <div className="p-4">

              <div className="space-y-2">

                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-3"
                  >

                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        habit.completed
                          ? "bg-green-500 text-white"
                          : "border border-gray-300 bg-white"
                      }`}
                    >
                      {habit.completed && "✓"}
                    </div>

                    <div className="min-w-0 flex-1">

                      <p
                        className={`text-sm ${
                          habit.completed
                            ? "text-gray-400 line-through"
                            : "text-gray-700"
                        }`}
                      >
                        {habit.name}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-400">
                        🔥 {habit.streak} দিন
                      </p>

                    </div>

                  </div>
                ))}

              </div>

              <div className="mt-4">

                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Habit Progress
                  </span>

                  <span className="font-semibold text-gray-700">
                    {completedHabits}/
                    {habits.length}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{
                      width: `${habitProgress}%`,
                    }}
                  />
                </div>

              </div>

            </div>
          </section>

        </div>

        {/* =====================================================
            ACTIVE GOALS
        ====================================================== */}

        <section className="mt-6 rounded-2xl border bg-white shadow-sm">

          <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">

            <div>
              <h2 className="font-semibold text-gray-900">
                Active Goals
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                আপনার চলমান লক্ষ্যগুলো
              </p>
            </div>

            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600">
              {goals.length} Goal
            </span>

          </div>

          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">

            {goals.map((goal) => {
              const progress =
                goal.totalTasks > 0
                  ? Math.round(
                      (goal.completedTasks /
                        goal.totalTasks) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={goal.id}
                  className="rounded-2xl border bg-gray-50 p-4"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">

                      <h3 className="font-semibold text-gray-800">
                        {goal.title}
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        {goal.completedTasks}/
                        {goal.totalTasks} Task
                      </p>

                    </div>

                    <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                      {progress}%
                    </span>

                  </div>

                  <div className="mt-4">

                    <div className="h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">

                    <span>
                      {goal.completedTasks} সম্পন্ন
                    </span>

                    <span>
                      {goal.daysLeft} দিন বাকি
                    </span>

                  </div>

                </div>
              );
            })}

          </div>
        </section>

        {/* =====================================================
            QUICK PROGRESS
        ====================================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">

          {/* Task */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Task
              </span>

              <span className="text-sm font-bold text-blue-600">
                {taskProgress}%
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${taskProgress}%`,
                }}
              />
            </div>

          </div>

          {/* Habit */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Habit
              </span>

              <span className="text-sm font-bold text-green-600">
                {habitProgress}%
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-green-500"
                style={{
                  width: `${habitProgress}%`,
                }}
              />
            </div>

          </div>

          {/* Goal */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Goal
              </span>

              <span className="text-sm font-bold text-purple-600">
                {goalProgress}%
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-purple-500"
                style={{
                  width: `${goalProgress}%`,
                }}
              />
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}