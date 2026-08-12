"use client";

import { useState } from "react";

import { addPendingTask } from "../services/task.service";

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

interface AddPendingTaskFormProps {
  onTaskAdded?: () => void;
}

export default function AddPendingTaskForm({
  onTaskAdded,
}: AddPendingTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [lifeArea, setLifeArea] =
    useState<LifeArea>("personal");

  const [priority, setPriority] =
    useState<TaskPriority>("medium");

  const [goalId, setGoalId] = useState("");

  const [activeDate, setActiveDate] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  /**
   * Today's date
   *
   * Browser local date ব্যবহার করা হচ্ছে।
   */
  const getTodayDate = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  /**
   * Submit Pending Task
   */
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    const trimmedTitle = title.trim();
    const trimmedDescription =
      description.trim();
    const trimmedGoalId = goalId.trim();

    /**
     * Title validation
     */
    if (!trimmedTitle) {
      setError(
        "Task title is required."
      );

      return;
    }

    /**
     * Active Date validation
     */
    if (!activeDate) {
      setError(
        "Please select an active date."
      );

      return;
    }

    /**
     * Active date must not be
     * before today.
     */
    if (activeDate < getTodayDate()) {
      setError(
        "Active date cannot be in the past."
      );

      return;
    }

    try {
      setLoading(true);

      /**
       * Task service will decide:
       *
       * Offline:
       * IndexedDB
       *
       * Online:
       * Firebase
       */
      await addPendingTask(
        trimmedTitle,
        trimmedDescription,
        lifeArea,
        priority,
        trimmedGoalId || null,
        activeDate
      );

      /**
       * Reset form
       */
      setTitle("");
      setDescription("");
      setLifeArea("personal");
      setPriority("medium");
      setGoalId("");
      setActiveDate("");

      /**
       * Notify parent component
       */
      onTaskAdded?.();
    } catch (error) {
      console.error(
        "Add pending task error:",
        error
      );

      setError(
        "Failed to add pending task. Please try again."
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
      {/* Title */}
      <div>
        <label
          htmlFor="pending-task-title"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Task Title
        </label>

        <input
          id="pending-task-title"
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="What do you need to do?"
          disabled={loading}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="pending-task-description"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Description
        </label>

        <textarea
          id="pending-task-description"
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          placeholder="Add some details..."
          rows={3}
          disabled={loading}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Life Area */}
      <div>
        <label
          htmlFor="pending-task-life-area"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Life Area
        </label>

        <select
          id="pending-task-life-area"
          value={lifeArea}
          onChange={(event) =>
            setLifeArea(
              event.target.value as LifeArea
            )
          }
          disabled={loading}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
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

      {/* Priority */}
      <div>
        <label
          htmlFor="pending-task-priority"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Priority
        </label>

        <select
          id="pending-task-priority"
          value={priority}
          onChange={(event) =>
            setPriority(
              event.target.value as TaskPriority
            )
          }
          disabled={loading}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
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

      {/* Goal */}
      <div>
        <label
          htmlFor="pending-task-goal"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Goal
        </label>

        <input
          id="pending-task-goal"
          type="text"
          value={goalId}
          onChange={(event) =>
            setGoalId(event.target.value)
          }
          placeholder="Goal ID (optional)"
          disabled={loading}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <p className="mt-1.5 text-xs text-slate-400">
          Optional: connect this task with a
          goal.
        </p>
      </div>

      {/* Active Date */}
      <div>
        <label
          htmlFor="pending-task-active-date"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Active Date
        </label>

        <input
          id="pending-task-active-date"
          type="date"
          value={activeDate}
          onChange={(event) =>
            setActiveDate(
              event.target.value
            )
          }
          min={getTodayDate()}
          disabled={loading}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          required
        />

        <p className="mt-2 text-xs leading-5 text-slate-500">
          📅 এই তারিখে Pending Task
          automatically Daily Tasks-এ চলে
          আসবে।
        </p>
      </div>

      {/* Offline Information */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
        <p className="text-xs leading-5 text-blue-700">
          💾 Internet না থাকলেও task তৈরি
          হবে। Internet ফিরে এলে task
          Firebase-এর সাথে sync হবে।
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Creating Pending Task..."
          : "Create Pending Task"}
      </button>
    </form>
  );
}