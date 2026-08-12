"use client";

import { Task } from "../types/task.types";

interface TaskCardProps {
  task: Task;
  onComplete: (
    taskId: string
  ) => void | Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (
    taskId: string
  ) => void | Promise<void>;
}

export default function TaskCard({
  task,
  onComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const priorityStyles = {
    low: "border-green-100 bg-green-50 text-green-700",
    medium:
      "border-yellow-100 bg-yellow-50 text-yellow-700",
    high: "border-red-100 bg-red-50 text-red-700",
  };

  const lifeAreaLabels = {
    work: "💼 Work",
    learning: "📚 Learning",
    health: "💪 Health",
    deen: "🕌 Deen",
    family: "👨‍👩‍👧 Family",
    finance: "💰 Finance",
    personal: "🎯 Personal",
  };

  const formattedLifeArea =
    lifeAreaLabels[task.lifeArea];

  const formattedPriority =
    task.priority.charAt(0).toUpperCase() +
    task.priority.slice(1);

  const handleComplete = () => {
    void onComplete(task.id);
  };

  const handleEdit = () => {
    onEdit(task);
  };

  const handleDelete = () => {
    void onDelete(task.id);
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm transition hover:shadow-md">
      {/* Main Content */}
      <div className="flex items-start gap-2.5">
        {/* Complete Circle */}
        <button
          type="button"
          onClick={handleComplete}
          aria-label={`Complete task: ${task.title}`}
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-[11px] text-transparent transition hover:border-green-500 hover:bg-green-50 hover:text-green-600"
        >
          ✓
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title */}
          <h3 className="truncate text-[15px] font-semibold leading-5 text-slate-900">
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p className="mt-0.5 line-clamp-1 text-xs leading-4 text-slate-400">
              {task.description}
            </p>
          )}

          {/* Badges */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {/* Life Area */}
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium leading-4 text-slate-600">
              {formattedLifeArea}
            </span>

            {/* Priority */}
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4 ${
                priorityStyles[task.priority]
              }`}
            >
              ⚡ {formattedPriority}
            </span>

            {/* Repeat */}
            {task.repeatDaily && (
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium leading-4 text-blue-600">
                🔁 Daily
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
        {/* Repeat Status */}
        <span className="text-[11px] text-slate-400">
          {task.repeatDaily
            ? "Repeats daily"
            : "One-time task"}
        </span>

        {/* Buttons */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Edit */}
          <button
            type="button"
            onClick={handleEdit}
            aria-label={`Edit task: ${task.title}`}
            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            ✏️
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            aria-label={`Delete task: ${task.title}`}
            className="rounded-md border border-red-100 bg-white px-2 py-1.5 text-[11px] font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600"
          >
            🗑️
          </button>

          {/* Done */}
          <button
            type="button"
            onClick={handleComplete}
            className="rounded-md bg-green-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-green-700 active:scale-95"
          >
            ✓ Done
          </button>
        </div>
      </div>
    </article>
  );
}