"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckSquare,
  Loader2,
} from "lucide-react";

import {
  completeTask,
  getTasks,
} from "@/features/tasks/services/task.service";

import { Task } from "@/features/tasks/types/task.types";

import DashboardCard from "./DashboardCard";
import DashboardSectionTitle from "./DashboardSectionTitle";

/* =========================================================
   COLORS
========================================================= */

const COLORS = {
  paper: "#FAF5EA",
  card: "#FFFFFF",
  line: "#E9E0CC",
  ink: "#2A2318",
  muted: "#8D8271",
  mutedSoft: "#B5AB98",

  teal: "#2A6459",
  tealSoft: "#E3EFEA",

  clay: "#B15A38",
  claySoft: "#F6E4D8",

  gold: "#B4842A",
  goldSoft: "#F5EACB",
};

/* =========================================================
   PRIORITY
========================================================= */

const priorityTone = {
  high: {
    fg: COLORS.clay,
    bg: COLORS.claySoft,
    label: "জরুরি",
  },

  medium: {
    fg: COLORS.gold,
    bg: COLORS.goldSoft,
    label: "মাঝারি",
  },

  low: {
    fg: COLORS.teal,
    bg: COLORS.tealSoft,
    label: "কম",
  },
} as const;

/* =========================================================
   TASK CHECKBOX
========================================================= */

interface TaskCheckboxProps {
  checked: boolean;
  loading: boolean;
  onClick: () => void;
}

function TaskCheckbox({
  checked,
  loading,
  onClick,
}: TaskCheckboxProps) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      aria-label={
        checked
          ? "Task completed"
          : "Complete task"
      }
      className="flex items-center justify-center rounded-full flex-shrink-0 transition-all"
      style={{
        width: 22,
        height: 22,

        border: `2px solid ${
          checked
            ? COLORS.teal
            : COLORS.line
        }`,

        background: checked
          ? COLORS.teal
          : "transparent",

        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        <Loader2
          size={12}
          color={
            checked
              ? COLORS.card
              : COLORS.teal
          }
          className="animate-spin"
        />
      ) : (
        checked && (
          <Check
            size={13}
            color={COLORS.card}
            strokeWidth={3}
          />
        )
      )}
    </button>
  );
}

/* =========================================================
   PROGRESS BAR
========================================================= */

function ProgressBar({
  percent,
}: {
  percent: number;
}) {
  return (
    <div
      style={{
        height: 9,
        borderRadius: 9,
        background: COLORS.tealSoft,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",

          width: `${Math.min(
            Math.max(percent, 0),
            100
          )}%`,

          background: COLORS.teal,

          borderRadius: 9,

          transition:
            "width 0.4s ease",
        }}
      />
    </div>
  );
}

/* =========================================================
   TODAY TASKS
========================================================= */

export default function TodayTasks() {
  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [completingTaskId, setCompletingTaskId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     TODAY STRING
  ======================================================= */

  const today = useMemo(() => {
    const date = new Date();

    return [
      date.getFullYear(),

      String(
        date.getMonth() + 1
      ).padStart(2, "0"),

      String(
        date.getDate()
      ).padStart(2, "0"),
    ].join("-");
  }, []);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadInitialTasks =
      async () => {
        try {
          const result =
            await getTasks();

          if (!cancelled) {
            setTasks(result);
            setError(null);
          }
        } catch (err) {
          console.error(
            "Failed to load dashboard tasks:",
            err
          );

          if (!cancelled) {
            setError(
              "টাস্ক লোড করা যায়নি।"
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    void loadInitialTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     ONLINE REFRESH
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const handleOnline =
      async () => {
        try {
          const result =
            await getTasks();

          if (!cancelled) {
            setTasks(result);
            setError(null);
          }
        } catch (err) {
          console.error(
            "Failed to refresh dashboard tasks:",
            err
          );
        }
      };

    window.addEventListener(
      "online",
      handleOnline
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "online",
        handleOnline
      );
    };
  }, []);

  /* =======================================================
     COMPLETE TASK
  ======================================================= */

  const handleCompleteTask =
    async (taskId: string) => {
      try {
        setCompletingTaskId(
          taskId
        );

        setError(null);

        /*
         * Existing task service:
         *
         * Local IndexedDB updates first.
         * Firebase sync happens in background.
         */
        await completeTask(taskId);

        /*
         * Read updated local data.
         */
        const updatedTasks =
          await getTasks();

        setTasks(updatedTasks);
      } catch (err) {
        console.error(
          "Failed to complete task:",
          err
        );

        setError(
          "টাস্ক সম্পন্ন করা যায়নি।"
        );
      } finally {
        setCompletingTaskId(null);
      }
    };

  /* =======================================================
     TODAY'S TASKS
  ======================================================= */

  const todayTasks = useMemo(() => {
    return tasks.filter((task) => {
      /*
       * Daily tasks
       */
      if (task.status === "daily") {
        return true;
      }

      /*
       * Completed today's tasks
       */
      if (
        task.status === "completed" &&
        task.completedAt
      ) {
        return task.completedAt.startsWith(
          today
        );
      }

      return false;
    });
  }, [tasks, today]);

  /* =======================================================
     PENDING
  ======================================================= */

  const pendingTasks = useMemo(() => {
    return todayTasks.filter(
      (task) =>
        task.status !== "completed"
    );
  }, [todayTasks]);

  /* =======================================================
     COMPLETED
  ======================================================= */

  const completedTasks = useMemo(() => {
    return todayTasks.filter(
      (task) =>
        task.status === "completed"
    );
  }, [todayTasks]);

  /* =======================================================
     PROGRESS
  ======================================================= */

  const totalTasks =
    todayTasks.length;

  const completedCount =
    completedTasks.length;

  const taskPercent =
    totalTasks > 0
      ? Math.round(
          (completedCount /
            totalTasks) *
            100
        )
      : 0;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <DashboardCard>
      {/* ===================================================
          HEADER
      =================================================== */}

      <DashboardSectionTitle
        icon={CheckSquare}
        title="আজকের টাস্ক"
        subtitle={`${completedCount} সম্পন্ন · ${pendingTasks.length} বাকি`}
      />

      {/* ===================================================
          PROGRESS
      =================================================== */}

      <div className="mb-4">
        <div
          className="flex justify-between mb-1.5 text-xs"
          style={{
            color: COLORS.mutedSoft,
          }}
        >
          <span>
            অগ্রগতি
          </span>

          <span
            style={{
              fontFamily:
                "'IBM Plex Mono', monospace",

              color: COLORS.teal,

              fontWeight: 600,
            }}
          >
            {taskPercent}%
          </span>
        </div>

        <ProgressBar
          percent={taskPercent}
        />
      </div>

      {/* ===================================================
          LOADING
      =================================================== */}

      {loading && (
        <div
          className="flex items-center justify-center gap-2 py-6 text-sm"
          style={{
            color: COLORS.mutedSoft,
          }}
        >
          <Loader2
            size={16}
            className="animate-spin"
          />

          <span>
            টাস্ক লোড হচ্ছে...
          </span>
        </div>
      )}

      {/* ===================================================
          ERROR
      =================================================== */}

      {!loading && error && (
        <div
          className="rounded-xl px-3.5 py-3 text-sm"
          style={{
            background:
              COLORS.claySoft,

            color: COLORS.clay,
          }}
        >
          {error}
        </div>
      )}

      {/* ===================================================
          EMPTY
      =================================================== */}

      {!loading &&
        !error &&
        todayTasks.length === 0 && (
          <div
            className="text-center py-6 text-sm"
            style={{
              color:
                COLORS.mutedSoft,
            }}
          >
            আজকের কোনো টাস্ক নেই। 🎉
          </div>
        )}

      {/* ===================================================
          PENDING TASKS
      =================================================== */}

      {!loading &&
        pendingTasks.length > 0 && (
          <div className="mb-4">
            <div
              className="text-xs mb-2"
              style={{
                color:
                  COLORS.mutedSoft,

                fontWeight: 600,
              }}
            >
              বাকি আছে
            </div>

            <div className="flex flex-col gap-2">
              {pendingTasks.map(
                (task) => {
                  const tone =
                    priorityTone[
                      task.priority
                    ];

                  const isCompleting =
                    completingTaskId ===
                    task.id;

                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                      style={{
                        background:
                          COLORS.paper,

                        border:
                          `1px solid ${COLORS.line}`,
                      }}
                    >
                      {/* Checkbox */}

                      <TaskCheckbox
                        checked={false}
                        loading={
                          isCompleting
                        }
                        onClick={() =>
                          handleCompleteTask(
                            task.id
                          )
                        }
                      />

                      {/* Title */}

                      <span
                        className="text-sm flex-1 min-w-0"
                        style={{
                          color:
                            COLORS.ink,

                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {task.title}
                      </span>

                      {/* Priority */}

                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background:
                            tone.bg,

                          color:
                            tone.fg,

                          fontWeight: 600,
                        }}
                      >
                        {tone.label}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

      {/* ===================================================
          COMPLETED TASKS
      =================================================== */}

      {!loading &&
        completedTasks.length > 0 && (
          <div>
            <div
              className="text-xs mb-2"
              style={{
                color:
                  COLORS.mutedSoft,

                fontWeight: 600,
              }}
            >
              সম্পন্ন হয়েছে
            </div>

            <div className="flex flex-col gap-2">
              {completedTasks.map(
                (task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                    style={{
                      background:
                        COLORS.paper,

                      border:
                        `1px solid ${COLORS.line}`,

                      opacity: 0.65,
                    }}
                  >
                    {/* Completed checkbox */}

                    <TaskCheckbox
                      checked={true}
                      loading={false}
                      onClick={() => {}}
                    />

                    {/* Task title */}

                    <span
                      className="text-sm flex-1 min-w-0"
                      style={{
                        color:
                          COLORS.mutedSoft,

                        textDecoration:
                          "line-through",

                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      {task.title}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </DashboardCard>
  );
}