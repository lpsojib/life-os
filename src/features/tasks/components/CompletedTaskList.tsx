"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getTasks,
  restoreTask,
  syncPendingTasks,
} from "../services/task.service";

import { Task } from "../types/task.types";

import CompletedTaskCard from "./CompletedTaskCard";
import { useAuthStore } from "@/store/auth.store";

type CompletedGroup = Record<string, Task[]>;

export default function CompletedTaskList() {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Load completed tasks
   *
   * Firebase অথবা IndexedDB থেকে
   * completed tasks load করবে।
   */
  const loadCompletedTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setError("");
      setLoading(true);

      const allTasks = await getTasks();

      const completedTasks = allTasks.filter(
        (task) => task.status === "completed"
      );

      setTasks(completedTasks);
    } catch (error) {
      console.error("Load completed tasks error:", error);

      setError("Failed to load completed tasks.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Initial load
   */
  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadCompletedTasks();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [authLoading, user, loadCompletedTasks]);

  /**
   * Online / Offline support
   *
   * Online হলে pending local data Firebase-এ sync হবে।
   * তারপর completed task আবার load হবে।
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    const handleOnline = () => {
      const timer = window.setTimeout(() => {
        void (async () => {
          try {
            await syncPendingTasks();
          } catch (error) {
            console.error(
              "Completed task sync error:",
              error
            );
          }

          await loadCompletedTasks();
        })();
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    };

    const handleOffline = () => {
      const timer = window.setTimeout(() => {
        void loadCompletedTasks();
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    };

    const onlineHandler = () => {
      handleOnline();
    };

    const offlineHandler = () => {
      handleOffline();
    };

    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);

    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, [user, loadCompletedTasks]);

  /**
   * Restore completed task
   *
   * Completed → Daily
   */
  const handleRestore = async (taskId: string) => {
    try {
      setError("");

      await restoreTask(taskId);

      /**
       * Restore করার সাথে সাথে
       * completed list থেকে task remove হবে।
       */
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      );
    } catch (error) {
      console.error("Restore task error:", error);

      setError("Failed to restore task.");
    }
  };

  /**
   * Group completed tasks by date
   */
  const groupedTasks = useMemo<CompletedGroup>(() => {
    const groups: CompletedGroup = {};

    tasks.forEach((task) => {
      let date = "Unknown Date";

      if (task.completedAt) {
        const parsedDate = new Date(task.completedAt);

        if (!Number.isNaN(parsedDate.getTime())) {
          date = parsedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          });
        }
      }

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(task);
    });

    return groups;
  }, [tasks]);

  /**
   * Authentication loading
   */
  if (authLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />

          <p className="text-sm text-gray-500">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  /**
   * User not logged in
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
          You need to be logged in to see your completed tasks.
        </p>
      </div>
    );
  }

  /**
   * Loading
   */
  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />

          <p className="text-sm text-gray-500">
            Loading completed tasks...
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
            void loadCompletedTasks();
          }}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  /**
   * No completed tasks
   */
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">
          ✓
        </div>

        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          No completed tasks
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          Completed tasks will appear here after you finish
          your daily or pending tasks.
        </p>
      </div>
    );
  }

  /**
   * Completed tasks
   */
  return (
    <div className="space-y-8">
      {Object.entries(groupedTasks).map(
        ([date, dateTasks]) => (
          <section key={date}>
            {/* Date Header */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-lg">
                ✓
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {date}
                </h2>

                <p className="text-xs text-gray-500">
                  {dateTasks.length}{" "}
                  {dateTasks.length === 1 ? "task" : "tasks"}{" "}
                  completed
                </p>
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {dateTasks.map((task) => (
                <CompletedTaskCard
                  key={task.id}
                  task={task}
                  onRestore={handleRestore}
                />
              ))}
            </div>
          </section>
        )
      )}
    </div>
  );
}