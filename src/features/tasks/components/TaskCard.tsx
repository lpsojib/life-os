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
    <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
      <input
        type="checkbox"
        checked={task.status === "completed"}
        onChange={() => onComplete(task.id)}
        className="h-5 w-5 cursor-pointer"
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

        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-gray-100 px-2 py-1">
            {task.lifeArea}
          </span>

          <span className="rounded-full bg-gray-100 px-2 py-1">
            {task.priority}
          </span>
        </div>
      </div>
    </div>
  );
}