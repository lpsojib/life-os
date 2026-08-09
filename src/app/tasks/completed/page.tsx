"use client";

import CompletedTaskList from "@/features/tasks/components/CompletedTaskList";
import TaskNavigation from "@/features/tasks/components/TaskNavigation";

export default function CompletedTasksPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* Task Navigation */}
        <TaskNavigation />

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
              ✓
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Tasks
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Completed Tasks
              </h1>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-sm text-slate-500">
              Your progress
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-800">
              Tasks you have completed
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Review your completed tasks and keep track of your progress.
            </p>
          </div>
        </header>

        {/* Completed Tasks */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Completed Tasks
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Here you can see all the tasks you have finished.
            </p>
          </div>

          <CompletedTaskList />
        </section>

      </div>
    </main>
  );
}