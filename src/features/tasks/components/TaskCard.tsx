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
    low: "bg-green-50 text-green-700 border-green-100",
    medium:
      "bg-yellow-50 text-yellow-700 border-yellow-100",
    high: "bg-red-50 text-red-700 border-red-100",
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
    onComplete(task.id);
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Top Section */}
      <div className="flex items-start gap-4">
        {/* Complete Button */}
        <button
          type="button"
          onClick={handleComplete}
          aria-label={`Complete task: ${task.title}`}
          className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-transparent transition hover:border-green-500 hover:bg-green-50 hover:text-green-600"
        >
          ✓
        </button>

        {/* Task Content */}
        <div className="min-w-0 flex-1">
          {/* Title */}
          <h3 className="break-words text-lg font-semibold text-slate-900">
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
              {task.description}
            </p>
          )}

          {/* Task Information */}
          <div className="mt-4 flex flex-wrap gap-2">
            {/* Life Area */}
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
              {formattedLifeArea}
            </span>

            {/* Priority */}
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                priorityStyles[task.priority]
              }`}
            >
              ⚡ {formattedPriority}
            </span>

            {/* Repeat Daily */}
            {task.repeatDaily && (
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                🔁 Repeats Daily
              </span>
            )}

            {/* Active Date */}
            {task.activeDate && (
              <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700">
                📅 {task.activeDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="text-xs text-slate-400">
          {task.repeatDaily
            ? "This task repeats every day"
            : "One-time daily task"}
        </div>

        <button
          type="button"
          onClick={handleComplete}
          className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 active:scale-[0.98]"
        >
          ✓ Complete
        </button>
      </div>
    </article>
  );
}