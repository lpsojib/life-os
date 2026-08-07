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
    ? new Date(task.completedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-sm text-green-600">
        ✓
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-gray-700 line-through">
          {task.title}
        </h3>

        {task.description && (
          <p className="mt-1 text-sm text-gray-400">
            {task.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-gray-100 px-2 py-1">
            {task.lifeArea}
          </span>

          <span className="rounded-full bg-gray-100 px-2 py-1">
            {task.priority}
          </span>

          {completedTime && (
            <span className="rounded-full bg-gray-100 px-2 py-1">
              {completedTime}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRestore(task.id)}
        className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        Restore
      </button>
    </div>
  );
}