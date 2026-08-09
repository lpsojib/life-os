"use client";

import { useEffect, useState } from "react";

import { getTasks, completeTask } from "../services/task.service";
import { Task } from "../types/task.types";

import TaskCard from "./TaskCard";
import { useAuthStore } from "@/store/auth.store";

export default function TaskList() {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Firebase authentication এখনো check করছে
    if (authLoading) {
      return;
    }

    // User login করা নেই
    // এখানে কোনো setState() করা যাবে না
    if (!user) {
      return;
    }

    const loadTasks = async () => {
      try {
        setError("");

        const allTasks = await getTasks();

        // শুধু Daily task
        const dailyTasks = allTasks.filter(
          (task) => task.status === "daily"
        );

        setTasks(dailyTasks);
      } catch (error) {
        console.error("Load daily tasks error:", error);

        setError("Failed to load daily tasks.");
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [user, authLoading]);

  const handleComplete = async (taskId: string) => {
    try {
      await completeTask(taskId);

      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task.id !== taskId
        )
      );
    } catch (error) {
      console.error("Complete task error:", error);

      setError("Failed to complete task.");
    }
  };

  // Authentication checking
  if (authLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Checking authentication...
        </p>
      </div>
    );
  }

  // User login করা নেই
  if (!user) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          🔐
        </div>

        <h3 className="mt-4 font-semibold text-gray-900">
          Please login first
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          You need to be logged in to see your tasks.
        </p>
      </div>
    );
  }

  // Tasks loading
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Loading daily tasks...
        </p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-600">
          {error}
        </p>
      </div>
    );
  }

  // কোনো Daily task নেই
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
          🎯
        </div>

        <h3 className="mt-4 font-semibold text-gray-900">
          No tasks for today
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Create a task to get started.
        </p>
      </div>
    );
  }

  // Daily Tasks
  return (
    <div className="space-y-3">
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