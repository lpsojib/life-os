"use client";

import AddTaskForm from "@/features/tasks/components/AddTaskForm";
import TaskList from "@/features/tasks/components/TaskList";

export default function TasksPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Tasks
          </h1>

          <p className="mt-2 text-gray-500">
            Manage your daily tasks.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-xl font-semibold">
              Add Task
            </h2>

            <AddTaskForm />
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Daily Tasks
              </h2>
            </div>

            <TaskList />
          </section>
        </div>
      </div>
    </main>
  );
}