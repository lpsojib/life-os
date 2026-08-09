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

  const [goalId, setGoalId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError(
        "Task title is required."
      );

      return;
    }

    try {
      setLoading(true);

      await addDailyTask(
        title,
        description,
        lifeArea,
        priority,
        goalId || null
      );

      setTitle("");

      setDescription("");

      setLifeArea("personal");

      setPriority("medium");

      setGoalId("");

      onTaskAdded?.();
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
      {/* Title */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Title
        </label>

        <input
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="What do you need to do?"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Description
        </label>

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          placeholder="Add some details..."
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Life Area */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Life Area
        </label>

        <select
          value={lifeArea}
          onChange={(event) =>
            setLifeArea(
              event.target.value as LifeArea
            )
          }
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

      {/* Priority */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Priority
        </label>

        <select
          value={priority}
          onChange={(event) =>
            setPriority(
              event.target.value as TaskPriority
            )
          }
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

      {/* Goal */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Goal
        </label>

        <input
          type="text"
          value={goalId}
          onChange={(event) =>
            setGoalId(
              event.target.value
            )
          }
          placeholder="Goal ID (optional)"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Creating Task..."
          : "Create Task"}
      </button>
    </form>
  );
}