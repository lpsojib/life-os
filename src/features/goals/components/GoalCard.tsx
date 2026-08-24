"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addGoalTask,
  deleteGoalTask,
  getGoalTasks,
  toggleGoalTask,
  updateGoalTask,
  updateGoal,
} from "../services/goal.service";

import {
  Goal,
  GoalTask,
} from "../types/goal.types";

interface GoalCardProps {
  goal: Goal;
  onDelete?: (
    goalId: string
  ) => void;
  onCompletionChange?: (
    goalId: string,
    completed: boolean
  ) => void;
}

const formatDate = (
  dateString: string
) => {
  const date = new Date(
    `${dateString}T00:00:00`
  );

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

  return `${date.getDate()} ${
    months[date.getMonth()]
  }`;
};

const getDaysLeft = (
  endDate: string
) => {
  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const end = new Date(
    `${endDate}T00:00:00`
  );

  end.setHours(
    0,
    0,
    0,
    0
  );

  const diff = Math.ceil(
    (end.getTime() -
      today.getTime()) /
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

export default function GoalCard({
  goal,
  onDelete,
  onCompletionChange,
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
     GOAL EDIT
  ========================================================= */

  const [editingGoal, setEditingGoal] =
    useState(false);

  const [editTitle, setEditTitle] =
    useState(goal.title);

  const [editDescription, setEditDescription] =
    useState(goal.description);

  const [editStartDate, setEditStartDate] =
    useState(goal.startDate);

  const [editEndDate, setEditEndDate] =
    useState(goal.endDate);

  const [savingGoal, setSavingGoal] =
    useState(false);

  /* =========================================================
     LOAD GOAL TASKS
  ========================================================= */

  const loadTasks =
    useCallback(async () => {
      try {
        setLoadingTasks(true);
        setTaskError("");

        const data =
          await getGoalTasks(
            goal.id
          );

        setTasks(data);
      } catch (error) {
        console.error(
          "Load goal tasks error:",
          error
        );

        setTaskError(
          "লক্ষ্যের টাস্কগুলো লোড করা যায়নি।"
        );
      } finally {
        setLoadingTasks(false);
      }
    }, [goal.id]);

  /* =========================================================
     GOAL CHANGE EVENT
  ========================================================= */

  useEffect(() => {
    const handleChange =
      () => {
        if (!expanded) {
          return;
        }

        void loadTasks();
      };

    window.addEventListener(
      "life-os-goal-changed",
      handleChange
    );

    return () => {
      window.removeEventListener(
        "life-os-goal-changed",
        handleChange
      );
    };
  }, [
    expanded,
    loadTasks,
  ]);

  /* =========================================================
     EXPAND / COLLAPSE
  ========================================================= */

  const handleExpand = () => {
    setExpanded(
      (current) => {
        const next =
          !current;

        if (next) {
          void loadTasks();
        }

        return next;
      }
    );
  };

  /* =========================================================
     PROGRESS
  ========================================================= */

  const completedCount =
    useMemo(
      () =>
        tasks.filter(
          (task) =>
            task.completed
        ).length,
      [tasks]
    );

  const totalCount =
    tasks.length;

  const progress =
    totalCount > 0
      ? Math.round(
          (completedCount /
            totalCount) *
            100
        )
      : 0;

  const isCompleted =
    progress === 100 &&
    totalCount > 0;

  const status =
    isCompleted
      ? "সম্পন্ন"
      : "চলছে";

  const daysLeft =
    getDaysLeft(
      goal.endDate
    );

  /* =========================================================
     INFORM GOAL LIST ABOUT COMPLETION
  ========================================================= */

  useEffect(() => {
    onCompletionChange?.(
      goal.id,
      isCompleted
    );
  }, [
    goal.id,
    isCompleted,
    onCompletionChange,
  ]);

  /* =========================================================
     GOAL EDIT
  ========================================================= */

  const startGoalEdit = () => {
    setEditTitle(
      goal.title
    );

    setEditDescription(
      goal.description
    );

    setEditStartDate(
      goal.startDate
    );

    setEditEndDate(
      goal.endDate
    );

    setEditingGoal(true);
  };

  const cancelGoalEdit = () => {
    setEditingGoal(false);
  };

  const saveGoalEdit =
    async () => {
      if (
        !editTitle.trim()
      ) {
        return;
      }

      if (
        !editStartDate ||
        !editEndDate
      ) {
        return;
      }

      if (
        editEndDate <
        editStartDate
      ) {
        return;
      }

      try {
        setSavingGoal(true);
        setTaskError("");

        await updateGoal(
          goal.id,
          editTitle.trim(),
          editDescription.trim(),
          editStartDate,
          editEndDate
        );

        setEditingGoal(false);

        window.dispatchEvent(
          new CustomEvent(
            "life-os-goal-changed"
          )
        );
      } catch (error) {
        console.error(
          "Update goal error:",
          error
        );

        setTaskError(
          "লক্ষ্য আপডেট করা যায়নি।"
        );
      } finally {
        setSavingGoal(false);
      }
    };

  /* =========================================================
     DELETE GOAL
  ========================================================= */

  const handleDeleteGoal =
    () => {
      const confirmed =
        window.confirm(
          `“${goal.title}” লক্ষ্যটি মুছে ফেলতে চান? এর সব Goal Task-ও মুছে যাবে।`
        );

      if (!confirmed) {
        return;
      }

      onDelete?.(
        goal.id
      );
    };

  /* =========================================================
     TOGGLE TASK
  ========================================================= */

  const handleToggleTask =
    async (
      task: GoalTask
    ) => {
      const completed =
        !task.completed;

      /*
       * UI first
       */
      setTasks(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              task.id
                ? {
                    ...item,
                    completed,
                    completedAt:
                      completed
                        ? new Date().toISOString()
                        : null,
                  }
                : item
          )
      );

      try {
        setTaskError("");

        await toggleGoalTask(
          task.id,
          completed
        );

        window.dispatchEvent(
          new CustomEvent(
            "life-os-goal-changed"
          )
        );
      } catch (error) {
        console.error(
          "Toggle goal task error:",
          error
        );

        void loadTasks();

        setTaskError(
          "টাস্কের অবস্থা পরিবর্তন করা যায়নি।"
        );
      }
    };

  /* =========================================================
     TASK EDIT
  ========================================================= */

  const startEdit = (
    task: GoalTask
  ) => {
    setEditingTaskId(
      task.id
    );

    setEditingText(
      task.title
    );
  };

  const cancelEdit = () => {
    setEditingTaskId(
      null
    );

    setEditingText("");
  };

  const saveEdit =
    async () => {
      if (
        !editingTaskId
      ) {
        return;
      }

      const value =
        editingText.trim();

      if (!value) {
        return;
      }

      const currentTaskId =
        editingTaskId;

      /*
       * UI first
       */
      setTasks(
        (current) =>
          current.map(
            (task) =>
              task.id ===
              currentTaskId
                ? {
                    ...task,
                    title: value,
                  }
                : task
          )
      );

      try {
        setTaskError("");

        await updateGoalTask(
          currentTaskId,
          value
        );

        cancelEdit();

        window.dispatchEvent(
          new CustomEvent(
            "life-os-goal-changed"
          )
        );
      } catch (error) {
        console.error(
          "Update goal task error:",
          error
        );

        void loadTasks();

        setTaskError(
          "টাস্ক আপডেট করা যায়নি।"
        );
      }
    };

  /* =========================================================
     ADD TASK
  ========================================================= */

  const handleAddTask =
    async () => {
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

        const now =
          new Date().toISOString();

        setTasks(
          (current) => [
            ...current,
            {
              id: taskId,
              goalId: goal.id,
              title: value,
              completed: false,
              createdAt: now,
              completedAt: null,
              updatedAt: now,
            },
          ]
        );

        setNewTask("");

        window.dispatchEvent(
          new CustomEvent(
            "life-os-goal-changed"
          )
        );
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

  const handleDeleteTask =
    async (
      taskId: string
    ) => {
      const confirmed =
        window.confirm(
          "এই টাস্কটি মুছে ফেলতে চান?"
        );

      if (!confirmed) {
        return;
      }

      /*
       * UI first
       */
      setTasks(
        (current) =>
          current.filter(
            (task) =>
              task.id !==
              taskId
          )
      );

      try {
        setTaskError("");

        await deleteGoalTask(
          taskId
        );

        window.dispatchEvent(
          new CustomEvent(
            "life-os-goal-changed"
          )
        );
      } catch (error) {
        console.error(
          "Delete goal task error:",
          error
        );

        void loadTasks();

        setTaskError(
          "টাস্ক মুছে ফেলা যায়নি।"
        );
      }
    };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <article
      className={`overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 ${
        isCompleted
          ? "border-green-200 bg-green-50"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* =====================================================
          MAIN GOAL
      ===================================================== */}

      <div
        className={`flex items-center gap-4 p-4 ${
          isCompleted
            ? "bg-green-50/80"
            : "bg-white"
        }`}
      >
        {/* Progress Circle */}

        <div className="relative h-14 w-14 shrink-0">
          <svg
            viewBox="0 0 54 54"
            className="h-14 w-14 -rotate-90"
          >
            <circle
              cx="27"
              cy="27"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className={
                isCompleted
                  ? "text-green-100"
                  : "text-gray-200"
              }
            />

            <circle
              cx="27"
              cy="27"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={
                2 *
                Math.PI *
                24
              }
              strokeDashoffset={
                2 *
                  Math.PI *
                  24 -
                (progress /
                  100) *
                  (2 *
                    Math.PI *
                    24)
              }
              className={
                isCompleted
                  ? "text-green-500 transition-all"
                  : "text-blue-600 transition-all"
              }
            />
          </svg>

          <div
            className={`absolute inset-0 flex items-center justify-center text-xs font-semibold ${
              isCompleted
                ? "text-green-700"
                : "text-gray-700"
            }`}
          >
            {progress}%
          </div>
        </div>

        {/* Goal Info */}

        <div className="min-w-0 flex-1">
          <p
            className={`font-semibold ${
              isCompleted
                ? "text-green-900"
                : "text-gray-900"
            }`}
          >
            {goal.title}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                isCompleted
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              {isCompleted
                ? "✓ সম্পন্ন"
                : "চলছে"}
            </span>

            <span className="h-1 w-1 rounded-full bg-gray-300" />

            <span
              className={
                isCompleted
                  ? "text-green-700"
                  : "text-gray-500"
              }
            >
              {completedCount}/
              {totalCount} টাস্ক
            </span>

            <span className="h-1 w-1 rounded-full bg-gray-300" />

            <span
              className={
                isCompleted
                  ? "text-green-700"
                  : "text-gray-500"
              }
            >
              {daysLeft}
            </span>
          </div>
        </div>

        {/* Expand */}

        <button
          type="button"
          onClick={
            handleExpand
          }
          aria-label="টাস্ক দেখাও"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
            isCompleted
              ? "text-green-600 hover:bg-green-100"
              : "text-gray-500 hover:bg-gray-100"
          } ${
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
            className="h-5 w-5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* =====================================================
          EXPANDED CONTENT
      ===================================================== */}

      {expanded && (
        <div
          className={`border-t ${
            isCompleted
              ? "border-green-100 bg-green-50/50"
              : "bg-gray-50"
          }`}
        >
          <div className="p-4">

            {/* Goal Actions */}

            {!editingGoal && (
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={
                    startGoalEdit
                  }
                  className="flex-1 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                >
                  ✏️ Edit Goal
                </button>

                <button
                  type="button"
                  onClick={
                    handleDeleteGoal
                  }
                  className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                >
                  🗑️ Delete Goal
                </button>
              </div>
            )}

            {/* Goal Edit */}

            {editingGoal && (
              <div className="mb-4 space-y-3 rounded-2xl border border-blue-100 bg-white p-4">
                <input
                  type="text"
                  value={
                    editTitle
                  }
                  onChange={(
                    event
                  ) =>
                    setEditTitle(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Goal title"
                />

                <textarea
                  value={
                    editDescription
                  }
                  onChange={(
                    event
                  ) =>
                    setEditDescription(
                      event.target
                        .value
                    )
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={
                      editStartDate
                    }
                    onChange={(
                      event
                    ) =>
                      setEditStartDate(
                        event.target
                          .value
                      )
                    }
                    className="rounded-xl border px-3 py-3 text-sm"
                  />

                  <input
                    type="date"
                    min={
                      editStartDate ||
                      undefined
                    }
                    value={
                      editEndDate
                    }
                    onChange={(
                      event
                    ) =>
                      setEditEndDate(
                        event.target
                          .value
                      )
                    }
                    className="rounded-xl border px-3 py-3 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={
                      saveGoalEdit
                    }
                    disabled={
                      savingGoal
                    }
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {savingGoal
                      ? "Saving..."
                      : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      cancelGoalEdit
                    }
                    disabled={
                      savingGoal
                    }
                    className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Error */}

            {taskError && (
              <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {taskError}
              </div>
            )}

            {/* Loading */}

            {loadingTasks && (
              <div className="py-5 text-center text-sm text-gray-400">
                টাস্ক লোড হচ্ছে...
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

                      if (editing) {
                        return (
                          <div
                            key={
                              task.id
                            }
                            className="flex items-center gap-2 rounded-xl bg-white p-2"
                          >
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
                                  event
                                    .target
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

                            <button
                              type="button"
                              onClick={() =>
                                void saveEdit()
                              }
                              className="rounded-lg px-3 py-2 text-green-600 hover:bg-green-50"
                            >
                              ✓
                            </button>

                            <button
                              type="button"
                              onClick={
                                cancelEdit
                              }
                              className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
                            >
                              ×
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={
                            task.id
                          }
                          className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              void handleToggleTask(
                                task
                              )
                            }
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                              task.completed
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {task.completed &&
                              "✓"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              startEdit(
                                task
                              )
                            }
                            className={`min-w-0 flex-1 text-left text-sm ${
                              task.completed
                                ? "text-gray-400 line-through"
                                : "text-gray-700"
                            }`}
                          >
                            {
                              task.title
                            }
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              startEdit(
                                task
                              )
                            }
                            className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100"
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteTask(
                                task.id
                              )
                            }
                            className="rounded-lg px-2 py-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

            {/* Empty Tasks */}

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
                value={
                  newTask
                }
                onChange={(
                  event
                ) =>
                  setNewTask(
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-medium text-white hover:bg-blue-700"
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

            {/* Completed Message */}

            {isCompleted && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-100/70 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-green-700">
                  🎉 লক্ষ্যটি সম্পূর্ণ হয়েছে!
                </p>

                <p className="mt-1 text-xs text-green-600">
                  এই লক্ষ্যটি আপনার সম্পন্ন লক্ষ্যগুলোর তালিকায় থাকবে।
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}