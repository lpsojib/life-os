"use client";

import { useEffect, useState } from "react";

import {
  getTasks,
  completeTask,
} from "../services/task.service";

import { Task } from "../types/task.types";

import TaskCard from "./TaskCard";

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchTasks = async () => {
      try {
        const allTasks = await getTasks();

        if (cancelled) return;

        const dailyTasks = allTasks.filter(
          (task) => task.status === "daily"
        );

        setTasks(dailyTasks);
      } catch (error) {
        if (cancelled) return;

        console.error("Load tasks error:", error);

        setError("Failed to load tasks.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleComplete = async (taskId: string) => {
    try {
      await completeTask(taskId);

      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task.id !== taskId
        )
      );
    } catch (error) {
      console.error(
        "Complete task error:",
        error
      );

      setError("Failed to complete task.");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-500">
          Loading tasks...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-6">
        <p className="text-sm text-red-600">
          {error}
        </p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <h3 className="text-lg font-semibold">
          No daily tasks
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Add a task to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onComplete={handleComplete}
        />
      ))}
    </div>
  );
}