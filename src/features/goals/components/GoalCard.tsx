"use client";

import { useState } from "react";

import {
  addGoalTask,
  deleteGoalTask,
  getGoalTasks,
  toggleGoalTask,
  updateGoalTask,
} from "../services/goal.service";

import {
  Goal,
  GoalTask,
} from "../types/goal.types";

interface GoalCardProps {
  goal: Goal;
}

/* =========================================================
   DATE HELPERS
========================================================= */

const formatDate = (dateString: string) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);

  const months = [
    "জানু",
    "ফেব্রু",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টে",
    "অক্টো",
    "নভে",
    "ডিসে",
  ];

  return `${date.getDate()} ${months[date.getMonth()]}`;
};

const getDaysLeft = (endDate: string) => {
  if (!endDate) {
    return "";
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const end = new Date(`${endDate}T00:00:00`);

  end.setHours(0, 0, 0, 0);

  const diff = Math.ceil(
    (end.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diff < 0) {
    return "মেয়াদ পার হয়েছে";
  }

  if (diff === 0) {
    return "আজই শেষ দিন";
  }

  return `${diff} দিন বাকি`;
};

/* =========================================================
   GOAL CARD
========================================================= */

export default function GoalCard({
  goal,
}: GoalCardProps) {
  const [expanded, setExpanded] =
    useState(false);

  const [tasks, setTasks] =
    useState<GoalTask[]>([]);

  const [loadingTasks, setLoadingTasks] =
    useState(false);

  const [taskError, setTaskError] =
    useState("");

  const [newTask, setNewTask] =
    useState("");

  const [editingTaskId, setEditingTaskId] =
    useState<string | null>(null);

  const [editingText, setEditingText] =
    useState("");

  /* =========================================================
     LOAD TASKS
  ========================================================= */

  const loadTasks = async () => {
    try {
      setLoadingTasks(true);
      setTaskError("");

      const goalTasks =
        await getGoalTasks(goal.id);

      setTasks(goalTasks);
    } catch (error) {
      console.error(
        "Load goal tasks error:",
        error
      );

      setTaskError(
        "Goal-এর টাস্কগুলো লোড করা যায়নি।"
      );
    } finally {
      setLoadingTasks(false);
    }
  };

  /* =========================================================
     EXPAND / COLLAPSE
  ========================================================= */

  const handleExpand = () => {
    const nextExpanded = !expanded;

    setExpanded(nextExpanded);

    if (nextExpanded) {
      void loadTasks();
    }
  };

  /* =========================================================
     TASK COUNTS
  ========================================================= */

  const completedCount =
    tasks.filter(
      (task) =>
        task.status === "completed"
    ).length;

  const totalCount = tasks.length;

  const progress =
    totalCount > 0
      ? Math.round(
          (completedCount / totalCount) *
            100
        )
      : 0;

  const status =
    progress === 100 &&
    totalCount > 0
      ? "সম্পন্ন"
      : "চলছে";

  const daysLeft = getDaysLeft(
    goal.endDate
  );

  /* =========================================================
     TOGGLE TASK
  ========================================================= */

  const handleToggleTask = async (
    task: GoalTask
  ) => {
    const completed =
      task.status !== "completed";

    try {
      setTaskError("");

      await toggleGoalTask(
        task.id,
        completed
      );

      setTasks((currentTasks) =>
        currentTasks.map(
          (currentTask) =>
            currentTask.id === task.id
              ? {
                  ...currentTask,
                  status: completed
                    ? "completed"
                    : "pending",
                  completedAt: completed
                    ? new Date().toISOString()
                    : null,
                }
              : currentTask
        )
      );
    } catch (error) {
      console.error(
        "Toggle goal task error:",
        error
      );

      setTaskError(
        "টাস্কের অবস্থা পরিবর্তন করা যায়নি।"
      );
    }
  };

  /* =========================================================
     START EDIT
  ========================================================= */

  const startEdit = (
    task: GoalTask
  ) => {
    setEditingTaskId(task.id);
    setEditingText(task.title);
  };

  /* =========================================================
     CANCEL EDIT
  ========================================================= */

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingText("");
  };

  /* =========================================================
     SAVE EDIT
  ========================================================= */

  const saveEdit = async () => {
    if (!editingTaskId) {
      return;
    }

    const value =
      editingText.trim();

    if (!value) {
      return;
    }

    try {
      setTaskError("");

      await updateGoalTask(
        editingTaskId,
        value
      );

      setTasks((currentTasks) =>
        currentTasks.map(
          (task) =>
            task.id === editingTaskId
              ? {
                  ...task,
                  title: value,
                }
              : task
        )
      );

      cancelEdit();
    } catch (error) {
      console.error(
        "Update goal task error:",
        error
      );

      setTaskError(
        "টাস্ক আপডেট করা যায়নি।"
      );
    }
  };

  /* =========================================================
     ADD TASK
  ========================================================= */

  const handleAddTask = async () => {
    const value =
      newTask.trim();

    if (!value) {
      return;
    }

    try {
      setTaskError("");

      const taskId =
        await addGoalTask(
          goal.id,
          value
        );

      const newGoalTask: GoalTask = {
        id: taskId,
        goalId: goal.id,
        title: value,
        status: "pending",
        createdAt:
          new Date().toISOString(),
        completedAt: null,
        updatedAt:
          new Date().toISOString(),
      };

      setTasks((currentTasks) => [
        ...currentTasks,
        newGoalTask,
      ]);

      setNewTask("");
    } catch (error) {
      console.error(
        "Add goal task error:",
        error
      );

      setTaskError(
        "টাস্ক যোগ করা যায়নি।"
      );
    }
  };

  /* =========================================================
     DELETE TASK
  ========================================================= */

  const handleDeleteTask = async (
    taskId: string
  ) => {
    const confirmed =
      window.confirm(
        "এই টাস্কটি মুছে ফেলতে চান?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setTaskError("");

      await deleteGoalTask(
        taskId
      );

      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) =>
            task.id !== taskId
        )
      );
    } catch (error) {
      console.error(
        "Delete goal task error:",
        error
      );

      setTaskError(
        "টাস্ক মুছে ফেলা যায়নি।"
      );
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* =====================================================
          GOAL MAIN
      ===================================================== */}

      <div className="flex items-center gap-4 p-4 sm:p-5">
        {/* Progress Ring */}

        <div className="relative h-14 w-14 shrink-0">
          <svg
            viewBox="0 0 54 54"
            className="h-14 w-14 -rotate-90"
          >
            {/* Background */}

            <circle
              cx="27"
              cy="27"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-gray-100"
            />

            {/* Progress */}

            <circle
              cx="27"
              cy="27"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={
                2 * Math.PI * 24
              }
              strokeDashoffset={
                2 *
                  Math.PI *
                  24 -
                (progress / 100) *
                  (2 *
                    Math.PI *
                    24)
              }
              className="text-blue-600 transition-all"
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
            {progress}%
          </div>
        </div>

        {/* Goal Body */}

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">
            {goal.title}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                status === "সম্পন্ন"
                  ? "bg-green-50 text-green-600"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              {status}
            </span>

            <span className="h-1 w-1 rounded-full bg-gray-300" />

            <span>
              {completedCount}/
              {totalCount} টাস্ক
            </span>

            <span className="h-1 w-1 rounded-full bg-gray-300" />

            <span>
              {daysLeft}
            </span>
          </div>
        </div>

        {/* Expand Button */}

        <button
          type="button"
          onClick={handleExpand}
          aria-label={
            expanded
              ? "টাস্ক লুকাও"
              : "টাস্ক দেখাও"
          }
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 ${
            expanded
              ? "rotate-180"
              : ""
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* =====================================================
          TASK PANEL
      ===================================================== */}

      {expanded && (
        <div className="border-t bg-gray-50">
          <div className="p-4">
            {/* Loading */}

            {loadingTasks && (
              <div className="py-5 text-center text-sm text-gray-400">
                টাস্ক লোড হচ্ছে...
              </div>
            )}

            {/* Error */}

            {taskError && (
              <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {taskError}
              </div>
            )}

            {/* Tasks */}

            {!loadingTasks &&
              tasks.length > 0 && (
                <div className="space-y-1">
                  {tasks.map(
                    (task) => {
                      const editing =
                        editingTaskId ===
                        task.id;

                      /* =========================
                         EDIT MODE
                      ========================= */

                      if (editing) {
                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 rounded-xl bg-white p-2"
                          >
                            {/* Check */}

                            <button
                              type="button"
                              onClick={() =>
                                void handleToggleTask(
                                  task
                                )
                              }
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                                task.status ===
                                "completed"
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {task.status ===
                                "completed" && (
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>

                            {/* Edit Input */}

                            <input
                              autoFocus
                              type="text"
                              value={
                                editingText
                              }
                              onChange={(
                                event
                              ) =>
                                setEditingText(
                                  event.target
                                    .value
                                )
                              }
                              onKeyDown={(
                                event
                              ) => {
                                if (
                                  event.key ===
                                  "Enter"
                                ) {
                                  void saveEdit();
                                }

                                if (
                                  event.key ===
                                  "Escape"
                                ) {
                                  cancelEdit();
                                }
                              }}
                              className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            {/* Save */}

                            <button
                              type="button"
                              onClick={() =>
                                void saveEdit()
                              }
                              aria-label="সেভ করো"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-green-600 hover:bg-green-50"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </button>

                            {/* Cancel */}

                            <button
                              type="button"
                              onClick={
                                cancelEdit
                              }
                              aria-label="বাতিল করো"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5"
                              >
                                <line
                                  x1="18"
                                  y1="6"
                                  x2="6"
                                  y2="18"
                                />

                                <line
                                  x1="6"
                                  y1="6"
                                  x2="18"
                                  y2="18"
                                />
                              </svg>
                            </button>
                          </div>
                        );
                      }

                      /* =========================
                         NORMAL TASK
                      ========================= */

                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5"
                        >
                          {/* Check */}

                          <button
                            type="button"
                            onClick={() =>
                              void handleToggleTask(
                                task
                              )
                            }
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
                              task.status ===
                              "completed"
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-gray-300 bg-white hover:border-blue-400"
                            }`}
                          >
                            {task.status ===
                              "completed" && (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>

                          {/* Task Text */}

                          <button
                            type="button"
                            onClick={() =>
                              startEdit(
                                task
                              )
                            }
                            className={`min-w-0 flex-1 text-left text-sm ${
                              task.status ===
                              "completed"
                                ? "text-gray-400 line-through"
                                : "text-gray-700"
                            }`}
                          >
                            {task.title}
                          </button>

                          {/* Edit */}

                          <button
                            type="button"
                            onClick={() =>
                              startEdit(
                                task
                              )
                            }
                            aria-label="এডিট করো"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>

                          {/* Delete */}

                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteTask(
                                task.id
                              )
                            }
                            aria-label="মুছে ফেলো"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

            {/* No Tasks */}

            {!loadingTasks &&
              tasks.length === 0 && (
                <div className="py-5 text-center text-sm text-gray-400">
                  এখনো কোনো টাস্ক যোগ করা হয়নি
                </div>
              )}

            {/* Add Task */}

            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(event) =>
                  setNewTask(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    void handleAddTask();
                  }
                }}
                placeholder="নতুন টাস্ক লিখো..."
                className="min-w-0 flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() =>
                  void handleAddTask()
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-medium text-white transition hover:bg-blue-700"
              >
                +
              </button>
            </div>

            {/* Timeline */}

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span>
                শুরু:{" "}
                {formatDate(
                  goal.startDate
                )}
              </span>

              <span className="h-1 w-1 rounded-full bg-gray-300" />

              <span>
                শেষ:{" "}
                {formatDate(
                  goal.endDate
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}