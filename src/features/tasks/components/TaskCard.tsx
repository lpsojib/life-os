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

  const handleComplete = () => {
    onComplete(task.id);
  };

  return (
    <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:shadow-md">
      {/* Complete Circle */}
      <button
        type="button"
        onClick={handleComplete}
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

        {/* Badges */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {/* Life Area */}
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {lifeAreaLabels[task.lifeArea]}
          </span>

          {/* Priority */}
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
              priorityStyles[task.priority]
            }`}
          >
            ⚡ {formattedPriority}
          </span>

          {/* Everyday */}
          {task.repeatDaily && (
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              🔁 Every day
            </span>
          )}
        </div>
      </div>

      {/* Complete Button */}
      <button
        type="button"
        onClick={handleComplete}
        className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 active:scale-95 sm:px-4 sm:text-sm"
      >
        ✓ Complete
      </button>
    </article>
  );
}