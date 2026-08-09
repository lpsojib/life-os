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
  { value: "work", label: "💼 Work" },
  { value: "learning", label: "📚 Learning" },
  { value: "health", label: "💪 Health" },
  { value: "deen", label: "🕌 Deen" },
  { value: "family", label: "👨‍👩‍👧 Family" },
  { value: "finance", label: "💰 Finance" },
  { value: "personal", label: "🎯 Personal" },
];

const priorities: {
  value: TaskPriority;
  label: string;
}[] = [
  { value: "low", label: "🟢 Low" },
  { value: "medium", label: "🟡 Medium" },
  { value: "high", label: "🔴 High" },
];

interface AddPendingTaskFormProps {
  onTaskAdded?: () => void;
}

export default function AddPendingTaskForm({
  onTaskAdded,
}: AddPendingTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lifeArea, setLifeArea] =
    useState<LifeArea>("personal");
  const [priority, setPriority] =
    useState<TaskPriority>("medium");
  const [goalId, setGoalId] = useState("");
  const [activeDate, setActiveDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!activeDate) {
      setError("Please select an active date.");
      return;
    }

    try {
      setLoading(true);

      await addPendingTask(
        title,
        description,
        lifeArea,
        priority,
        goalId || null,
        activeDate
      );

      setTitle("");
      setDescription("");
      setLifeArea("personal");
      setPriority("medium");
      setGoalId("");
      setActiveDate("");

      onTaskAdded?.();
    } catch (error) {
      console.error("Add pending task error:", error);

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
      className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
    >
      {/* Title */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Title
        </label>

        <input
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="What do you need to do?"
          className="w-full rounded-xl border border-gray-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Description
        </label>

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="Add some details..."
          rows={3}
          className="w-full resize-none rounded-xl border border-gray-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Life Area */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Life Area
        </label>

        <select
          value={lifeArea}
          onChange={(event) =>
            setLifeArea(event.target.value as LifeArea)
          }
          className="w-full rounded-xl border border-gray-200 p-3 outline-none"
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
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Priority
        </label>

        <select
          value={priority}
          onChange={(event) =>
            setPriority(
              event.target.value as TaskPriority
            )
          }
          className="w-full rounded-xl border border-gray-200 p-3 outline-none"
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
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Goal
        </label>

        <input
          type="text"
          value={goalId}
          onChange={(event) =>
            setGoalId(event.target.value)
          }
          placeholder="Goal ID (optional)"
          className="w-full rounded-xl border border-gray-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Active Date */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Active Date
        </label>

        <input
          type="date"
          value={activeDate}
          onChange={(event) =>
            setActiveDate(event.target.value)
          }
          min={new Date().toISOString().split("T")[0]}
          className="w-full rounded-xl border border-gray-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          required
        />

        <p className="mt-2 text-xs text-gray-500">
          এই তারিখে task টি automatically Daily Tasks-এ চলে
          আসবে।
        </p>
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
        className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Creating Pending Task..."
          : "Create Pending Task"}
      </button>
    </form>
  );
}