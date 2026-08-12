"use client";

import { useState } from "react";

import AddTaskForm from "@/features/tasks/components/AddTaskForm";
import TaskList from "@/features/tasks/components/TaskList";
import TaskNavigation from "@/features/tasks/components/TaskNavigation";

export default function TasksPage() {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const today = new Date();

  const dateText = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleTaskAdded = () => {
    setShowCreateTask(false);
    setRefreshKey((current) => current + 1);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Task Navigation */}
        <TaskNavigation />

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
              ☀️
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-600">
                Today
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Daily Tasks
              </h1>
            </div>
          </div>

          {/* Date Card */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-sm text-slate-500">
              Today&apos;s date
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-800">
              {dateText}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Focus on what matters today.
            </p>
          </div>
        </header>

        {/* Create Task Button */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              setShowCreateTask((current) => !current)
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99]"
          >
            <span className="text-xl">
              {showCreateTask ? "×" : "+"}
            </span>

            <span>
              {showCreateTask
                ? "Close"
                : "Create Daily Task"}
            </span>
          </button>
        </div>

        {/* Create Task Form */}
        {showCreateTask && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-5">
              <h2 className="text-xl font-bold text-slate-900">
                Create Daily Task
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add a task that you want to complete today.
              </p>
            </div>

            <div className="p-5">
              <AddTaskForm
                onTaskAdded={handleTaskAdded}
              />
            </div>
          </section>
        )}

        {/* Daily Tasks */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Today&apos;s Tasks
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Complete your tasks for today.
              </p>
            </div>
          </div>

          <TaskList key={refreshKey} />
        </section>
      </div>
    </main>
  );
}