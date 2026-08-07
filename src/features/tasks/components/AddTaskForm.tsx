"use client";

import { useEffect, useState } from "react";

import { addTask } from "../services/task.service";
import {
  LifeArea,
  TaskPriority,
} from "../types/task.types";

import { getGoals } from "@/features/goals/services/goal.service";
import { Goal } from "@/features/goals/types/goal.types";

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
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

interface AddTaskFormProps {
  onTaskAdded?: () => void;
}

export default function AddTaskForm({
  onTaskAdded,
}: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [lifeArea, setLifeArea] =
    useState<LifeArea>("personal");

  const [priority, setPriority] =
    useState<TaskPriority>("medium");

  const [goalId, setGoalId] = useState("");

  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Load current user's goals
   */
  useEffect(() => {
    const loadGoals = async () => {
      try {
        setGoalsLoading(true);

        const userGoals = await getGoals();

        setGoals(userGoals);
      } catch (error) {
        console.error("Load goals error:", error);

        setError("Failed to load goals.");
      } finally {
        setGoalsLoading(false);
      }
    };

    loadGoals();
  }, []);

  /**
   * Add Task
   */
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    try {
      setLoading(true);

      await addTask(
        title,
        description,
        lifeArea,
        priority,
        goalId || null,
        null
      );

      setTitle("");
      setDescription("");
      setLifeArea("personal");
      setPriority("medium");
      setGoalId("");

      onTaskAdded?.();
    } catch (error) {
      console.error("Add task error:", error);

      setError("Failed to add task. Please try again.");
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
        <label className="mb-2 block text-sm font-medium">
          Title
        </label>

        <input
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="What do you need to do?"
          className="w-full rounded-xl border p-3 outline-none transition focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Description
        </label>

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="Add some details..."
          rows={3}
          className="w-full resize-none rounded-xl border p-3 outline-none transition focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Life Area */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Life Area
        </label>

        <select
          value={lifeArea}
          onChange={(event) =>
            setLifeArea(event.target.value as LifeArea)
          }
          className="w-full rounded-xl border p-3"
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
        <label className="mb-2 block text-sm font-medium">
          Priority
        </label>

        <select
          value={priority}
          onChange={(event) =>
            setPriority(
              event.target.value as TaskPriority
            )
          }
          className="w-full rounded-xl border p-3"
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
        <label className="mb-2 block text-sm font-medium">
          Goal
        </label>

        <select
          value={goalId}
          onChange={(event) =>
            setGoalId(event.target.value)
          }
          className="w-full rounded-xl border p-3"
        >
          <option value="">Regular</option>

          {goalsLoading ? (
            <option disabled>
              Loading goals...
            </option>
          ) : (
            goals.map((goal) => (
              <option
                key={goal.id}
                value={goal.id}
              >
                {goal.title}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Adding Task..." : "Add Task"}
      </button>
    </form>
  );
}