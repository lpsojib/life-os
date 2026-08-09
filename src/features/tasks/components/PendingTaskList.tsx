"use client";

import { useEffect, useState } from "react";

import {
  getTasks,
  deleteTask,
  completeTask,
} from "../services/task.service";

import { Task } from "../types/task.types";

import { useAuthStore } from "@/store/auth.store";

export default function PendingTaskList() {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Load Pending Tasks
   */
  useEffect(() => {
    // Firebase authentication এখনো check করছে
    if (authLoading) {
      return;
    }

    // User login করা নেই
    if (!user) {
      return;
    }

    const loadTasks = async () => {
      try {
        setLoading(true);
        setError("");

        const allTasks = await getTasks();

        // শুধু Pending task দেখাবে
        const pendingTasks = allTasks.filter(
          (task) => task.status === "pending"
        );

        setTasks(pendingTasks);
      } catch (error) {
        console.error("Load pending tasks error:", error);

        setError("Failed to load pending tasks.");
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [user, authLoading]);

  /**
   * Complete Pending Task
   */
  const handleComplete = async (taskId: string) => {
    try {
      await completeTask(taskId);

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      );
    } catch (error) {
      console.error("Complete pending task error:", error);

      setError("Failed to complete task.");
    }
  };

  /**
   * Delete Pending Task
   */
  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      );
    } catch (error) {
      console.error("Delete pending task error:", error);

      setError("Failed to delete task.");
    }
  };

  /**
   * Authentication Loading
   */
  if (authLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />

          <p className="text-sm text-gray-500">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  /**
   * User Not Logged In
   */
  if (!user) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
          🔐
        </div>

        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Please login first
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          You need to be logged in to see your pending tasks.
        </p>
      </div>
    );
  }

  /**
   * Loading Tasks
   */
  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />

          <p className="text-sm text-gray-500">
            Loading pending tasks...
          </p>
        </div>
      </div>
    );
  }

  /**
   * Error
   */
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">
          ⚠️
        </div>

        <h3 className="mt-3 font-semibold text-red-800">
          Something went wrong
        </h3>

        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  /**
   * No Pending Tasks
   */
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-3xl">
          📅
        </div>

        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          No pending tasks
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          You don&apos;t have any upcoming tasks. Create a pending
          task and set an active date.
        </p>
      </div>
    );
  }

  /**
   * Pending Tasks
   */
  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start gap-4">
            {/* Task checkbox */}
            <button
              type="button"
              onClick={() => handleComplete(task.id)}
              className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-indigo-400 transition hover:bg-indigo-500 hover:text-white"
              aria-label="Complete task"
            >
              ✓
            </button>

            {/* Task information */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900">
                {task.title}
              </h3>

              {task.description && (
                <p className="mt-1 text-sm text-gray-500">
                  {task.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* Active Date */}
                {task.activeDate && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                    📅{" "}
                    {new Date(
                      `${task.activeDate}T00:00:00`
                    ).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}

                {/* Priority */}
                {task.priority && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600">
                    {task.priority}
                  </span>
                )}

                {/* Life Area */}
                {task.lifeArea && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600">
                    {task.lifeArea}
                  </span>
                )}
              </div>
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() => handleDelete(task.id)}
              className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
              aria-label="Delete task"
              title="Delete task"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}