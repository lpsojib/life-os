"use client";

import { Task } from "../types/task.types";

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
}

export default function TaskCard({
  task,
  onComplete,
}: TaskCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
      <button
        type="button"
        onClick={() => onComplete(task.id)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 transition hover:border-blue-500 hover:bg-blue-50"
        aria-label={`Complete ${task.title}`}
      />

      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-gray-900">
          {task.title}
        </h3>

        {task.description && (
          <p className="mt-1 text-sm text-gray-500">
            {task.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
            {task.lifeArea}
          </span>

          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-600">
            {task.priority}
          </span>
        </div>
      </div>
    </div>
  );
}