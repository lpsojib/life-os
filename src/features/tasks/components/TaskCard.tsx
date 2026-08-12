"use client";

import { Task } from "../types/task.types";

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
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

  const formattedPriority =
    task.priority.charAt(0).toUpperCase() +
    task.priority.slice(1);

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete "${task.title}"?`
    );

    if (!confirmed) {
      return;
    }

    onDelete(task.id);
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-center gap-3">
        {/* Complete Circle */}
        <button
          type="button"
          onClick={() => onComplete(task.id)}
          aria-label={`Complete task: ${task.title}`}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-transparent transition hover:border-green-500 hover:bg-green-50 hover:text-green-600"
        >
          ✓
        </button>

        {/* Task Content */}
        <div className="min-w-0 flex-1">
          {/* Task Name */}
          <h3 className="truncate text-sm font-semibold text-slate-800 sm:text-base">
            {task.title}
          </h3>

          {/* Life Area + Priority */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {lifeAreaLabels[task.lifeArea]}
            </span>

            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityStyles[task.priority]}`}
            >
              ⚡ {formattedPriority}
            </span>
          </div>
        </div>

        {/* Edit + Delete */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(task.id)}
            aria-label={`Edit task: ${task.title}`}
            className="rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            ✏️
          </button>

          <button
            type="button"
            onClick={handleDelete}
            aria-label={`Delete task: ${task.title}`}
            className="rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          >
            🗑️
          </button>
        </div>

        {/* Complete */}
        <button
          type="button"
          onClick={() => onComplete(task.id)}
          className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 active:scale-95 sm:px-4 sm:text-sm"
        >
          ✓ Complete
        </button>
      </div>
    </article>
  );
}