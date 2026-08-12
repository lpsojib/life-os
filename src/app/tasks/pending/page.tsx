"use client";

import { useState } from "react";

import AddPendingTaskForm from "@/features/tasks/components/AddPendingTaskForm";
import PendingTaskList from "@/features/tasks/components/PendingTaskList";
import TaskNavigation from "@/features/tasks/components/TaskNavigation";

export default function PendingTasksPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTaskAdded = () => {
    setShowForm(false);
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
              ⏳
            </div>

            <div>
              <p className="text-sm font-semibold text-amber-600">
                Tasks
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Pending Tasks
              </h1>
            </div>
          </div>

          {/* Information Card */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-sm text-slate-500">
              Plan ahead
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-800">
              Schedule tasks for the future
            </p>

            <p className="mt-1 text-sm text-slate-500">
              When the active date arrives, the task will
              automatically move to Daily Tasks.
            </p>
          </div>
        </header>

        {/* Create Pending Task Button */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              setShowForm((current) => !current)
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99]"
          >
            <span className="text-xl">
              {showForm ? "×" : "+"}
            </span>

            <span>
              {showForm
                ? "Close"
                : "Create Pending Task"}
            </span>
          </button>
        </div>

        {/* Create Pending Task Form */}
        {showForm && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-5">
              <h2 className="text-xl font-bold text-slate-900">
                Create Pending Task
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose the date when this task should become
                a Daily Task.
              </p>
            </div>

            <div className="p-5">
              <AddPendingTaskForm
                onTaskAdded={handleTaskAdded}
              />
            </div>
          </section>
        )}

        {/* Pending Tasks */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Scheduled Tasks
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              These tasks are waiting for their active date.
            </p>
          </div>

          <PendingTaskList key={refreshKey} />
        </section>
      </div>
    </main>
  );
}