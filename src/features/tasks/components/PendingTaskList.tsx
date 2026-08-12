"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  completeTask,
  deleteTask,
  getTasks,
  syncPendingTasks,
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
   *
   * Firebase অথবা IndexedDB থেকে
   * pending tasks load করবে।
   */
  const loadTasks = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setError("");

      const allTasks = await getTasks();

      const pendingTasks = allTasks.filter(
        (task) => task.status === "pending"
      );

      setTasks(pendingTasks);
    } catch (error) {
      console.error(
        "Load pending tasks error:",
        error
      );

      setError("Failed to load pending tasks.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Initial Load
   *
   * Effect-এর body থেকে সরাসরি
   * state update না করে browser queue-তে
   * loadTasks defer করা হচ্ছে।
   */
  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadTasks();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [authLoading, user, loadTasks]);

  /**
   * Online / Offline listener
   *
   * Offline:
   * IndexedDB থেকে data ব্যবহার করবে।
   *
   * Online:
   * Pending offline tasks Firebase-এ sync করবে।
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    const onlineHandler = () => {
      const timer = window.setTimeout(() => {
        void (async () => {
          try {
            await syncPendingTasks();
          } catch (error) {
            console.error(
              "Offline task sync error:",
              error
            );
          }

          await loadTasks();
        })();
      }, 0);

      window.setTimeout(() => {
        window.clearTimeout(timer);
      }, 0);
    };

    const offlineHandler = () => {
      const timer = window.setTimeout(() => {
        void loadTasks();
      }, 0);

      window.setTimeout(() => {
        window.clearTimeout(timer);
      }, 0);
    };

    window.addEventListener(
      "online",
      onlineHandler
    );

    window.addEventListener(
      "offline",
      offlineHandler
    );

    return () => {
      window.removeEventListener(
        "online",
        onlineHandler
      );

      window.removeEventListener(
        "offline",
        offlineHandler
      );
    };
  }, [user, loadTasks]);

  /**
   * Complete Pending Task
   *
   * Online বা Offline দুই অবস্থাতেই
   * task complete করার চেষ্টা করবে।
   */
  const handleComplete = async (
    taskId: string
  ) => {
    try {
      setError("");

      await completeTask(taskId);

      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task.id !== taskId
        )
      );
    } catch (error) {
      console.error(
        "Complete pending task error:",
        error
      );

      setError("Failed to complete task.");
    }
  };

  /**
   * Delete Pending Task
   */
  const handleDelete = async (
    taskId: string
  ) => {
    try {
      setError("");

      await deleteTask(taskId);

      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task.id !== taskId
        )
      );
    } catch (error) {
      console.error(
        "Delete pending task error:",
        error
      );

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
          You need to be logged in to see your
          pending tasks.
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
          onClick={() => {
            setLoading(true);
            void loadTasks();
          }}
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
          You don&apos;t have any upcoming tasks.
          Create a pending task and set an active
          date.
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
            {/* Complete */}
            <button
              type="button"
              onClick={() =>
                void handleComplete(task.id)
              }
              className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-indigo-400 text-sm transition hover:bg-indigo-500 hover:text-white"
              aria-label={`Complete ${task.title}`}
              title="Complete task"
            >
              ✓
            </button>

            {/* Task Information */}
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
                    ).toLocaleDateString(
                      "en-US",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </span>
                )}

                {/* Priority */}
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600">
                  {task.priority}
                </span>

                {/* Life Area */}
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600">
                  {task.lifeArea}
                </span>
              </div>
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() =>
                void handleDelete(task.id)
              }
              className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
              aria-label={`Delete ${task.title}`}
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