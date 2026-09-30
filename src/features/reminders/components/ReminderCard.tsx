"use client";

import {
  CalendarDays,
  Check,
  Clock3,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

import type { Reminder } from "../types/reminder.types";

interface ReminderCardProps {
  reminder: Reminder;
  onEdit?: () => void;
  onComplete?: () => void;
  onReopen?: () => void;
  onDelete?: () => void;
}

function formatDate(date: string): string {
  const parsedDate = new Date(
    `${date}T00:00:00`
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formatTime(time: string): string {
  const [hoursString, minutesString] =
    time.split(":");

  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return time;
  }

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function getRepeatLabel(
  reminder: Reminder
): string {
  switch (reminder.repeat) {
    case "daily":
      return "Every day";

    case "weekly":
      return "Every week";

    case "monthly":
      return "Every month";

    case "yearly":
      return "Every year";

    case "custom":
      return "Custom";

    default:
      return "Don't repeat";
  }
}

export default function ReminderCard({
  reminder,
  onEdit,
  onComplete,
  onReopen,
  onDelete,
}: ReminderCardProps) {
  const isCompleted =
    reminder.status === "completed";

  return (
    <article
      className={[
        "group relative flex h-full flex-col",
        "rounded-2xl border bg-white p-4",
        "shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        isCompleted
          ? "border-gray-200 opacity-75"
          : "border-gray-200",
      ].join(" ")}
    >
      {/* =================================================
          TOP
      ================================================= */}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className={[
              "break-words text-base font-semibold",
              "leading-6 text-gray-900",
              isCompleted
                ? "line-through text-gray-500"
                : "",
            ].join(" ")}
          >
            {reminder.title}
          </h3>

          {reminder.description && (
            <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-5 text-gray-500">
              {reminder.description}
            </p>
          )}
        </div>

        {/* Status */}

        <div
          className={[
            "shrink-0 rounded-full px-2.5 py-1",
            "text-xs font-medium",
            isCompleted
              ? "bg-gray-100 text-gray-600"
              : "bg-blue-50 text-blue-600",
          ].join(" ")}
        >
          {isCompleted
            ? "Completed"
            : "Pending"}
        </div>
      </div>

      {/* =================================================
          DATE / TIME
      ================================================= */}

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarDays
            size={16}
            className="shrink-0 text-gray-400"
          />

          <span>
            {formatDate(reminder.date)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock3
            size={16}
            className="shrink-0 text-gray-400"
          />

          <span>
            {formatTime(reminder.time)}
          </span>
        </div>
      </div>

      {/* =================================================
          REPEAT
      ================================================= */}

      <div className="mt-3">
        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          {getRepeatLabel(reminder)}
        </span>
      </div>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-4">
        {isCompleted ? (
          <button
            type="button"
            onClick={onReopen}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <RotateCcw size={15} />
            Reopen
          </button>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Check size={15} />
            Complete
          </button>
        )}

        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit reminder"
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
        >
          <Pencil size={16} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete reminder"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}