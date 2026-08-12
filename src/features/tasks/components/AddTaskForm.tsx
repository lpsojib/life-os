"use client";

import { useState } from "react";

import { addDailyTask } from "../services/task.service";

import {
  LifeArea,
  TaskPriority,
} from "../types/task.types";

const lifeAreas: {
  value: LifeArea;
  label: string;
}[] = [
  {
    value: "work",
    label: "💼 Work",
  },
  {
    value: "learning",
    label: "📚 Learning",
  },
  {
    value: "health",
    label: "💪 Health",
  },
  {
    value: "deen",
    label: "🕌 Deen",
  },
  {
    value: "family",
    label: "👨‍👩‍👧 Family",
  },
  {
    value: "finance",
    label: "💰 Finance",
  },
  {
    value: "personal",
    label: "🎯 Personal",
  },
];

const priorities: {
  value: TaskPriority;
  label: string;
}[] = [
  {
    value: "low",
    label: "🟢 Low",
  },
  {
    value: "medium",
    label: "🟡 Medium",
  },
  {
    value: "high",
    label: "🔴 High",
  },
];

interface AddTaskFormProps {
  onTaskAdded?: () => void;
}

export default function AddTaskForm({
  onTaskAdded,
}: AddTaskFormProps) {
  const [title, setTitle] = useState("");

  const [description, setDescription] =
    useState("");

  const [lifeArea, setLifeArea] =
    useState<LifeArea>("personal");

  const [priority, setPriority] =
    useState<TaskPriority>("medium");

  /**
   * Repeat Daily
   *
   * true:
   * Task প্রতিদিন Daily Tasks-এ থাকবে।
   *
   * false:
   * Task শুধু একবারের Daily Task হবে।
   */
  const [repeatDaily, setRepeatDaily] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Task title is required.");
      return;
    }

    try {
      setLoading(true);

      /**
       * Task প্রথমে IndexedDB-তে save হবে।
       *
       * Online হলে task.service Firebase-এ
       * automatically sync করবে।
       *
       * repeatDaily:
       * true হলে task recurring Daily Task হবে।
       */
      await addDailyTask(
      trimmedTitle,
      description.trim(),
      lifeArea,
      priority,
      null,
      repeatDaily
      );

      /**
       * Reset form
       */
      setTitle("");
      setDescription("");
      setLifeArea("personal");
      setPriority("medium");
      setRepeatDaily(false);

      /**
       * Parent component-কে জানানো।
       */
      onTaskAdded?.();

      /**
       * অন্য TaskList component-কে
       * task added event পাঠানো।
       */
      window.dispatchEvent(
        new CustomEvent("life-os-task-added")
      );
    } catch (error) {
      console.error(
        "Add daily task error:",
        error
      );

      setError(
        "Failed to add task. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {/* =================================================
          TITLE
          ================================================= */}

      <div>
        <label
          htmlFor="task-title"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Title
        </label>

        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="What do you need to do?"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          disabled={loading}
          required
        />
      </div>

      {/* =================================================
          DESCRIPTION
          ================================================= */}

      <div>
        <label
          htmlFor="task-description"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Description
        </label>

        <textarea
          id="task-description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="Add some details..."
          rows={3}
          disabled={loading}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* =================================================
          LIFE AREA
          ================================================= */}

      <div>
        <label
          htmlFor="task-life-area"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Life Area
        </label>

        <select
          id="task-life-area"
          value={lifeArea}
          onChange={(event) =>
            setLifeArea(
              event.target.value as LifeArea
            )
          }
          disabled={loading}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {lifeAreas.map((area) => (
            <option
              key={area.value}
              value={area.value}
            >
              {area.label}
            </option>
          ))}
        </select>
      </div>

      {/* =================================================
          PRIORITY
          ================================================= */}

      <div>
        <label
          htmlFor="task-priority"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Priority
        </label>

        <select
          id="task-priority"
          value={priority}
          onChange={(event) =>
            setPriority(
              event.target.value as TaskPriority
            )
          }
          disabled={loading}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {priorities.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* =================================================
          REPEAT DAILY
          ================================================= */}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label
          htmlFor="repeat-daily"
          className="flex cursor-pointer items-start gap-3"
        >
          {/* Checkbox */}

          <input
            id="repeat-daily"
            type="checkbox"
            checked={repeatDaily}
            onChange={(event) =>
              setRepeatDaily(
                event.target.checked
              )
            }
            disabled={loading}
            className="mt-1 h-5 w-5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />

          {/* Text */}

          <div>
            <p className="font-semibold text-slate-800">
              Repeat every day
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Keep this task automatically available
              in your Daily Tasks every day.
            </p>
          </div>
        </label>

        {/* Active message */}

        {repeatDaily && (
          <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
            ✓ This task will repeat automatically
            every day.
          </div>
        )}
      </div>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* =================================================
          SUBMIT BUTTON
          ================================================= */}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Creating Task..."
          : repeatDaily
            ? "Create Daily Repeating Task"
            : "Create Task"}
      </button>
    </form>
  );
}