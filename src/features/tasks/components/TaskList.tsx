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
  updateTask,
} from "../services/task.service";

import {
  LifeArea,
  Task,
  TaskPriority,
} from "../types/task.types";

import TaskCard from "./TaskCard";
import { useAuthStore } from "@/store/auth.store";

const lifeAreas: {
  value: LifeArea;
  label: string;
}[] = [
  {
    value: "work",
    label: "💼 Work",
  },
  {
    value: "learning",
    label: "📚 Learning",
  },
  {
    value: "health",
    label: "💪 Health",
  },
  {
    value: "deen",
    label: "🕌 Deen",
  },
  {
    value: "family",
    label: "👨‍👩‍👧 Family",
  },
  {
    value: "finance",
    label: "💰 Finance",
  },
  {
    value: "personal",
    label: "🎯 Personal",
  },
];

const priorities: {
  value: TaskPriority;
  label: string;
}[] = [
  {
    value: "low",
    label: "🟢 Low",
  },
  {
    value: "medium",
    label: "🟡 Medium",
  },
  {
    value: "high",
    label: "🔴 High",
  },
];

export default function TaskList() {
  const user = useAuthStore(
    (state) => state.user
  );

  const authLoading = useAuthStore(
    (state) => state.loading
  );

  const [tasks, setTasks] = useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const [editTitle, setEditTitle] =
    useState("");

  const [editDescription, setEditDescription] =
    useState("");

  const [editLifeArea, setEditLifeArea] =
    useState<LifeArea>("personal");

  const [editPriority, setEditPriority] =
    useState<TaskPriority>("medium");

  const [savingEdit, setSavingEdit] =
    useState(false);

  const [deletingTaskId, setDeletingTaskId] =
    useState<string | null>(null);

  /**
   * Load Daily Tasks
   */
  const loadTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setError("");

      const allTasks = await getTasks();

      const dailyTasks = allTasks.filter(
        (task) => task.status === "daily"
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
  }, [user]);

  /**
   * Initial Task Load
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
  }, [
    authLoading,
    user,
    loadTasks,
  ]);

  /**
   * Listen for newly created task
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    const handleTaskAdded = () => {
      const timer = window.setTimeout(() => {
        void loadTasks();
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    };

    const listener = () => {
      handleTaskAdded();
    };

    window.addEventListener(
      "life-os-task-added",
      listener
    );

    return () => {
      window.removeEventListener(
        "life-os-task-added",
        listener
      );
    };
  }, [user, loadTasks]);

  /**
   * Online / Offline listener
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
   * Complete Task
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
        "Complete task error:",
        error
      );

      setError(
        "Failed to complete task."
      );
    }
  };

  /**
   * Start Editing Task
   */
  const handleEditStart = (
    task: Task
  ) => {
    setEditingTask(task);

    setEditTitle(task.title);

    setEditDescription(
      task.description
    );

    setEditLifeArea(
      task.lifeArea
    );

    setEditPriority(
      task.priority
    );

    setError("");
  };

  /**
   * Cancel Edit
   */
  const handleEditCancel = () => {
    setEditingTask(null);

    setEditTitle("");

    setEditDescription("");

    setEditLifeArea("personal");

    setEditPriority("medium");
  };

  /**
   * Save Edited Task
   */
  const handleEditSave = async () => {
    if (!editingTask) {
      return;
    }

    const trimmedTitle =
      editTitle.trim();

    if (!trimmedTitle) {
      setError(
        "Task title is required."
      );

      return;
    }

    try {
      setSavingEdit(true);

      setError("");

      const updatedDescription =
        editDescription.trim();

      await updateTask(
        editingTask.id,
        {
          title: trimmedTitle,
          description:
            updatedDescription,
          lifeArea: editLifeArea,
          priority: editPriority,
        }
      );

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTask.id
            ? {
                ...task,
                title: trimmedTitle,
                description:
                  updatedDescription,
                lifeArea: editLifeArea,
                priority: editPriority,
              }
            : task
        )
      );

      handleEditCancel();
    } catch (error) {
      console.error(
        "Update task error:",
        error
      );

      setError(
        "Failed to update task."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  /**
   * Delete Task
   */
  const handleDelete = async (
    taskId: string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this task?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTaskId(taskId);

      setError("");

      await deleteTask(taskId);

      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task.id !== taskId
        )
      );

      if (
        editingTask?.id === taskId
      ) {
        handleEditCancel();
      }
    } catch (error) {
      console.error(
        "Delete task error:",
        error
      );

      setError(
        "Failed to delete task."
      );
    } finally {
      setDeletingTaskId(null);
    }
  };

  /**
   * Repeat Daily Toggle
   */
  const handleRepeatToggle = async (
    task: Task
  ) => {
    try {
      setError("");

      const newRepeatValue =
        !task.repeatDaily;

      await updateTask(
        task.id,
        {
          repeatDaily:
            newRepeatValue,
        }
      );

      setTasks((currentTasks) =>
        currentTasks.map(
          (currentTask) =>
            currentTask.id === task.id
              ? {
                  ...currentTask,
                  repeatDaily:
                    newRepeatValue,
                }
              : currentTask
        )
      );
    } catch (error) {
      console.error(
        "Repeat task update error:",
        error
      );

      setError(
        "Failed to update repeat setting."
      );
    }
  };

  /**
   * Authentication Loading
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
   * User Not Logged In
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
  if (
    error &&
    tasks.length === 0
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={() => {
            setLoading(true);

            void loadTasks();
          }}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Try Again
        </button>
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
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {tasks.map((task) => (
        <div
          key={task.id}
          className="space-y-2"
        >
          {/* Task Card */}
          <TaskCard
            task={task}
            onComplete={handleComplete}
            onEdit={handleEditStart}
            onDelete={handleDelete}
          />

          {/* Repeat Daily */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                void handleRepeatToggle(
                  task
                )
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                task.repeatDaily
                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {task.repeatDaily
                ? "✓ Repeats Daily"
                : "↻ Repeat Daily"}
            </button>
          </div>

          {/* Edit Form */}
          {editingTask?.id === task.id && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900">
                  Edit Task
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Update your task information.
                </p>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label
                  htmlFor={`edit-title-${task.id}`}
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Title
                </label>

                <input
                  id={`edit-title-${task.id}`}
                  type="text"
                  value={editTitle}
                  onChange={(event) =>
                    setEditTitle(
                      event.target.value
                    )
                  }
                  disabled={savingEdit}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label
                  htmlFor={`edit-description-${task.id}`}
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id={`edit-description-${task.id}`}
                  value={editDescription}
                  onChange={(event) =>
                    setEditDescription(
                      event.target.value
                    )
                  }
                  rows={3}
                  disabled={savingEdit}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Life Area */}
              <div className="mb-4">
                <label
                  htmlFor={`edit-life-area-${task.id}`}
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Life Area
                </label>

                <select
                  id={`edit-life-area-${task.id}`}
                  value={editLifeArea}
                  onChange={(event) =>
                    setEditLifeArea(
                      event.target.value as LifeArea
                    )
                  }
                  disabled={savingEdit}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {lifeAreas.map(
                    (area) => (
                      <option
                        key={area.value}
                        value={area.value}
                      >
                        {area.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Priority */}
              <div className="mb-5">
                <label
                  htmlFor={`edit-priority-${task.id}`}
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Priority
                </label>

                <select
                  id={`edit-priority-${task.id}`}
                  value={editPriority}
                  onChange={(event) =>
                    setEditPriority(
                      event.target.value as TaskPriority
                    )
                  }
                  disabled={savingEdit}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {priorities.map(
                    (item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Edit Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void handleEditSave()
                  }
                  disabled={savingEdit}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingEdit
                    ? "Saving..."
                    : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={
                    handleEditCancel
                  }
                  disabled={savingEdit}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}