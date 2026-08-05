"use client";

import { useState } from "react";
import { createTask } from "../services/task.service";

export default function AddTaskForm() {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    "medium"
  );

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!title.trim()) return;

    try {
      await createTask({
        title: title.trim(),
        priority,
      });

      setTitle("");
      setPriority("medium");

      alert("✅ Task added successfully!");
    } catch (error) {
      console.error("Failed to add task:", error);
      alert("❌ Failed to add task.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 shadow-sm"
    >
      <h2 className="mb-6 text-xl font-semibold">
        Add New Task
      </h2>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border p-3 outline-none focus:border-blue-500"
          required
        />

        <select
          value={priority}
          onChange={(e) =>
            setPriority(
              e.target.value as "low" | "medium" | "high"
            )
          }
          className="w-full rounded-xl border p-3 outline-none focus:border-blue-500"
        >
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>

        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Add Task
        </button>
      </div>
    </form>
  );
}