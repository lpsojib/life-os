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
   PRIORITY LABEL
========================================================= */

const priorityLabel = {
  high: "জরুরি",
  medium: "মাঝারি",
  low: "কম",
} as const;

/* =========================================================
   TASK CHECKBOX
========================================================= */

interface TaskCheckboxProps {
  loading: boolean;
  onClick: () => void;
}

function TaskCheckbox({
  loading,
  onClick,
}: TaskCheckboxProps) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      aria-label="Complete task"
      className="
        flex
        items-center
        justify-center
        flex-shrink-0
        rounded-full
        transition-all
        duration-200
        hover:scale-105
        active:scale-95
      "
      style={{
        width: 22,
        height: 22,

        border: `2px solid ${COLORS.line}`,

        background: COLORS.card,

        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading && (
        <Loader2
          size={12}
          color={COLORS.teal}
          className="animate-spin"
        />
      )}
    </button>
  );
}

/* =========================================================
   TODAY TASKS
========================================================= */

export default function TodayTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [completingTaskId, setCompletingTaskId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     TODAY
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
     LOAD TASKS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadTasks = async () => {
      try {
        const result = await getTasks();

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

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     ONLINE REFRESH
  ======================================================= */

  useEffect(() => {
    const handleOnline = () => {
      void getTasks()
        .then((result) => {
          setTasks(result);
          setError(null);
        })
        .catch((err) => {
          console.error(
            "Failed to refresh dashboard tasks:",
            err
          );
        });
    };

    window.addEventListener(
      "online",
      handleOnline
    );

    return () => {
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
      if (completingTaskId) {
        return;
      }

      try {
        setCompletingTaskId(taskId);
        setError(null);

        /*
         * Immediately remove the task
         * from dashboard UI.
         *
         * This makes the dashboard
         * feel instant.
         */
        setTasks((currentTasks) =>
          currentTasks.filter(
            (task) => task.id !== taskId
          )
        );

        /*
         * Existing service handles:
         *
         * 1. Local update
         * 2. Firebase background sync
         * 3. Repeat-daily task creation
         */
        await completeTask(taskId);
      } catch (err) {
        console.error(
          "Failed to complete task:",
          err
        );

        /*
         * If completion fails,
         * reload the task list so
         * the task comes back.
         */
        try {
          const result = await getTasks();

          setTasks(result);
        } catch (reloadError) {
          console.error(
            "Failed to restore task list:",
            reloadError
          );
        }

        setError(
          "টাস্ক সম্পন্ন করা যায়নি।"
        );
      } finally {
        setCompletingTaskId(null);
      }
    };

  /* =======================================================
     TODAY'S ACTIVE TASKS
  ======================================================= */

  const todayTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        /*
         * Only active daily tasks.
         */
        if (task.status === "daily") {
          return true;
        }

        /*
         * Pending task becomes visible
         * when its active date is today
         * or earlier.
         */
        if (
          task.status === "pending" &&
          task.activeDate
        ) {
          return task.activeDate <= today;
        }

        /*
         * Completed tasks are intentionally
         * NOT shown.
         */
        return false;
      })
      .sort((a, b) => {
        /*
         * Priority order:
         *
         * high
         * medium
         * low
         */

        const priorityOrder = {
          high: 0,
          medium: 1,
          low: 2,
        };

        const priorityDifference =
          priorityOrder[a.priority] -
          priorityOrder[b.priority];

        if (
          priorityDifference !== 0
        ) {
          return priorityDifference;
        }

        return a.order - b.order;
      });
  }, [tasks, today]);

  /* =======================================================
     EMPTY
  ======================================================= */

  const hasTasks =
    todayTasks.length > 0;

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
        subtitle={
          hasTasks
            ? `${todayTasks.length}টি টাস্ক বাকি`
            : "সব টাস্ক সম্পন্ন"
        }
      />

      {/* ===================================================
          LOADING
      =================================================== */}

      {loading && (
        <div
          className="
            flex
            items-center
            justify-center
            gap-2
            py-7
            text-sm
          "
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
          className="
            rounded-xl
            px-3.5
            py-3
            text-sm
            mb-3
          "
          style={{
            background:
              COLORS.claySoft,

            color:
              COLORS.clay,
          }}
        >
          {error}
        </div>
      )}

      {/* ===================================================
          EMPTY STATE
      =================================================== */}

      {!loading &&
        !error &&
        !hasTasks && (
          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              py-8
              text-center
            "
          >
            <div
              className="
                flex
                items-center
                justify-center
                rounded-full
                mb-3
              "
              style={{
                width: 44,
                height: 44,
                background:
                  COLORS.tealSoft,
              }}
            >
              <Check
                size={22}
                color={COLORS.teal}
                strokeWidth={2.5}
              />
            </div>

            <p
              className="text-sm font-medium"
              style={{
                color: COLORS.ink,
              }}
            >
              আজকের সব টাস্ক সম্পন্ন 🎉
            </p>

            <p
              className="text-xs mt-1"
              style={{
                color:
                  COLORS.mutedSoft,
              }}
            >
              দারুণ কাজ করেছেন।
            </p>
          </div>
        )}

      {/* ===================================================
          TASK LIST
      =================================================== */}

      {!loading &&
        !error &&
        hasTasks && (
          <div className="flex flex-col gap-2.5">
            {todayTasks.map((task) => {
              const isCompleting =
                completingTaskId ===
                task.id;

              return (
                <button
                  key={task.id}
                  type="button"
                  disabled={
                    completingTaskId !==
                      null &&
                    !isCompleting
                  }
                  onClick={() =>
                    handleCompleteTask(
                      task.id
                    )
                  }
                  className="
                    w-full
                    flex
                    items-center
                    gap-3
                    text-left
                    rounded-xl
                    px-3.5
                    py-3
                    transition-all
                    duration-200
                    hover:-translate-y-[1px]
                    active:scale-[0.99]
                  "
                  style={{
                    background:
                      COLORS.paper,

                    border:
                      `1px solid ${COLORS.line}`,

                    opacity:
                      isCompleting
                        ? 0.65
                        : 1,
                  }}
                >
                  {/* =================================================
                      CHECKBOX
                  ================================================= */}

                  <TaskCheckbox
                    loading={
                      isCompleting
                    }
                    onClick={() => {}}
                  />

                  {/* =================================================
                      TASK CONTENT
                  ================================================= */}

                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium"
                      style={{
                        color:
                          COLORS.ink,

                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      {task.title}
                    </div>

                    {/* Description */}

                    {task.description && (
                      <div
                        className="
                          text-xs
                          mt-1
                          line-clamp-1
                        "
                        style={{
                          color:
                            COLORS.muted,
                        }}
                      >
                        {task.description}
                      </div>
                    )}
                  </div>

                  {/* =================================================
                      PRIORITY TEXT
                  ================================================= */}

                  <span
                    className="
                      text-xs
                      font-semibold
                      flex-shrink-0
                    "
                    style={{
                      color:
                        task.priority ===
                        "high"
                          ? COLORS.clay
                          : task.priority ===
                            "medium"
                          ? COLORS.gold
                          : COLORS.teal,
                    }}
                  >
                    {
                      priorityLabel[
                        task.priority
                      ]
                    }
                  </span>
                </button>
              );
            })}
          </div>
        )}
    </DashboardCard>
  );
}