"use client";

import { Task } from "../types/task.types";

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void | Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void | Promise<void>;
}

export default function TaskCard({
  task,
  onComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const priorityStyles = {
    low: "border-green-100 bg-green-50 text-green-700",
    medium: "border-yellow-100 bg-yellow-50 text-yellow-700",
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
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      {/* Main Row */}
      <div className="flex items-start gap-3">
        {/* Complete Checkbox */}
        <button
          type="button"
          onClick={handleComplete}
          aria-label={`Complete task: ${task.title}`}
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-transparent transition hover:border-green-500 hover:bg-green-50 hover:text-green-600"
        >
          ✓
        </button>

        {/* Task Content */}
        <div className="min-w-0 flex-1">
          {/* Task Title */}
          <h3 className="break-words text-base font-semibold text-slate-900 sm:text-lg">
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-5 text-slate-500">
              {task.description}
            </p>
          )}

          {/* Badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Life Area */}
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              {formattedLifeArea}
            </span>

            {/* Priority */}
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                priorityStyles[task.priority]
              }`}
            >
              ⚡ {formattedPriority}
            </span>

           
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        {/* Repeat Status */}
        <div className="text-xs text-slate-400">
          {task.repeatDaily
            ? "Repeats daily"
            : "One-time task"}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Edit */}
          <button
            type="button"
            onClick={handleEdit}
            aria-label={`Edit task: ${task.title}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            ✏️ Edit
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            aria-label={`Delete task: ${task.title}`}
            className="rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600"
          >
            🗑️ Delete
          </button>

          {/* Complete */}
          <button
            type="button"
            onClick={handleComplete}
            className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 active:scale-[0.98]"
          >
            ✓ Done
          </button>
        </div>
      </div>
    </article>
  );
}