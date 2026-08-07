"use client";

import { useEffect, useMemo, useState } from "react";

import { getTasks, restoreTask } from "../services/task.service";
import { Task } from "../types/task.types";

import CompletedTaskCard from "./CompletedTaskCard";

type CompletedGroup = Record<string, Task[]>;

export default function CompletedTaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchCompletedTasks = async () => {
      try {
        const allTasks = await getTasks();

        if (!active) return;

        const completedTasks = allTasks.filter(
          (task) => task.status === "completed"
        );

        setTasks(completedTasks);
        setLoading(false);
      } catch (error) {
        console.error("Load completed tasks error:", error);

        if (!active) return;

        setError("Failed to load completed tasks.");
        setLoading(false);
      }
    };

    fetchCompletedTasks();

    return () => {
      active = false;
    };
  }, []);

  const handleRestore = async (taskId: string) => {
    try {
      await restoreTask(taskId);

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      );
    } catch (error) {
      console.error("Restore task error:", error);

      setError("Failed to restore task.");
    }
  };

  const groupedTasks = useMemo<CompletedGroup>(() => {
    const groups: CompletedGroup = {};

    tasks.forEach((task) => {
      const date = task.completedAt
        ? new Date(task.completedAt).toLocaleDateString()
        : "Unknown Date";

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(task);
    });

    return groups;
  }, [tasks]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-500">
          Loading completed tasks...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <h3 className="font-semibold text-gray-800">
          No completed tasks
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Completed tasks will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedTasks).map(
        ([date, dateTasks]) => (
          <div key={date}>
            <h3 className="mb-3 text-sm font-semibold text-gray-500">
              {date}
            </h3>

            <div className="space-y-3">
              {dateTasks.map((task) => (
                <CompletedTaskCard
                  key={task.id}
                  task={task}
                  onRestore={handleRestore}
                />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}