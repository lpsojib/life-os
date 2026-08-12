"use client";

import { Task } from "../types/task.types";

interface CompletedTaskCardProps {
  task: Task;
  onRestore: (taskId: string) => void;
}

export default function CompletedTaskCard({
  task,
  onRestore,
}: CompletedTaskCardProps) {
  const completedTime = task.completedAt
    ? new Date(task.completedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      {/* Completed Icon */}
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
        ✓
      </div>

      {/* Task Content */}
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-gray-700 line-through">
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="mt-1 text-sm text-gray-400">
            {task.description}
          </p>
        )}

        {/* Task Meta */}
        <div className="mt-2 flex flex-wrap gap-2">
          {/* Life Area */}
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
            {task.lifeArea}
          </span>

          {/* Priority */}
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
            {task.priority}
          </span>

          {/* Completed Time */}
          {completedTime && (
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600">
              ✓ {completedTime}
            </span>
          )}
        </div>
      </div>

      {/* Restore Button */}
      <button
        type="button"
        onClick={() => onRestore(task.id)}
        className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
      >
        Restore
      </button>
    </div>
  );
}