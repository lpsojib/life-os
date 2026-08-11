"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  completeTask,
  getTasks,
  syncPendingTasks,
} from "../services/task.service";

import { Task } from "../types/task.types";

import TaskCard from "./TaskCard";
import { useAuthStore } from "@/store/auth.store";

export default function TaskList() {
  const user = useAuthStore(
    (state) => state.user
  );

  const authLoading = useAuthStore(
    (state) => state.loading
  );

  const [tasks, setTasks] = useState<Task[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  /**
   * Load Daily Tasks
   *
   * Firebase / Offline storage থেকে
   * task load করবে।
   */
  const loadTasks = useCallback(
    async () => {
      if (!user) {
        return;
      }

      try {
        setError("");

        const allTasks = await getTasks();

        /**
         * শুধু Daily Tasks
         */
        const dailyTasks =
          allTasks.filter(
            (task) =>
              task.status === "daily"
          );

        setTasks(dailyTasks);
      } catch (error) {
        console.error(
          "Load daily tasks error:",
          error
        );

        setError(
          "Failed to load daily tasks."
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  /**
   * Initial Task Load
   *
   * সরাসরি effect-এর মধ্যে
   * loadTasks() call করা হচ্ছে না।
   *
   * Browser task queue-তে defer করা হচ্ছে।
   */
  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const timer = window.setTimeout(
      () => {
        void loadTasks();
      },
      0
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    authLoading,
    user,
    loadTasks,
  ]);

  /**
   * Online / Offline listener
   *
   * Internet চলে গেলে:
   * Local data ব্যবহার করবে।
   *
   * Internet ফিরে এলে:
   * Pending tasks Firebase-এ sync করবে।
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    const handleOnline = () => {
      const syncTimer =
        window.setTimeout(
          async () => {
            try {
              await syncPendingTasks();
            } catch (error) {
              console.error(
                "Offline task sync error:",
                error
              );
            }

            await loadTasks();
          },
          0
        );

      return syncTimer;
    };

    const handleOffline = () => {
      const loadTimer =
        window.setTimeout(() => {
          void loadTasks();
        }, 0);

      window.setTimeout(() => {
        window.clearTimeout(loadTimer);
      }, 0);
    };

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );
    };
  }, [user, loadTasks]);

  /**
   * Complete Task
   */
  const handleComplete = async (
    taskId: string
  ) => {
    try {
      setError("");

      await completeTask(taskId);

      /**
       * Complete করার সাথে সাথে
       * Daily list থেকে remove হবে।
       */
      setTasks(
        (currentTasks) =>
          currentTasks.filter(
            (task) =>
              task.id !== taskId
          )
      );
    } catch (error) {
      console.error(
        "Complete task error:",
        error
      );

      setError(
        "Failed to complete task."
      );
    }
  };

  /**
   * Authentication checking
   */
  if (authLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Checking authentication...
        </p>
      </div>
    );
  }

  /**
   * User not logged in
   */
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
          You need to be logged in to see
          your tasks.
        </p>
      </div>
    );
  }

  /**
   * Loading
   */
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Loading daily tasks...
        </p>
      </div>
    );
  }

  /**
   * Error
   */
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-600">
          {error}
        </p>
      </div>
    );
  }

  /**
   * No Daily Tasks
   */
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

  /**
   * Daily Tasks
   */
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onComplete={
            handleComplete
          }
        />
      ))}
    </div>
  );
}