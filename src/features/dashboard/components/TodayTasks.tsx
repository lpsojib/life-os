"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

import { useAuthStore } from "@/store/auth.store";

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

  gold: "#B4842A",
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
   PRIORITY ORDER
========================================================= */

const priorityOrder = {
  high: 0,
  medium: 1,
  low: 2,
} as const;

/* =========================================================
   TODAY STRING
========================================================= */

function getTodayString(): string {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/* =========================================================
   TASK CHECKBOX
========================================================= */

interface TaskCheckboxProps {
  loading: boolean;
}

function TaskCheckbox({
  loading,
}: TaskCheckboxProps) {
  return (
    <span
      className="
        flex
        items-center
        justify-center
        flex-shrink-0
        rounded-full
      "
      style={{
        width: 22,
        height: 22,
        border: `2px solid ${COLORS.line}`,
        background: COLORS.card,
      }}
    >
      {loading && (
        <Loader2
          size={12}
          color={COLORS.teal}
          className="animate-spin"
        />
      )}
    </span>
  );
}

/* =========================================================
   TODAY TASKS
========================================================= */

export default function TodayTasks() {
  /* =======================================================
     AUTH
  ======================================================= */

  const user = useAuthStore(
    (state) => state.user
  );

  const initialized = useAuthStore(
    (state) => state.initialized
  );

  /* =======================================================
     STATE
  ======================================================= */

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [completingTaskId, setCompletingTaskId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     TODAY
  ======================================================= */

  const today = useMemo(
    () => getTodayString(),
    []
  );

  /* =======================================================
     LOAD TASKS
  ======================================================= */

  const loadTasks = useCallback(
    async () => {
      /*
       * Auth এখনো initialize হয়নি।
       *
       * এই অবস্থায় fetch করব না।
       */
      if (!initialized) {
        return;
      }

      /*
       * User নেই।
       *
       * এখানে state synchronously update না করে
       * async callback-এর ভিতরে update করছি।
       */
      if (!user) {
        await Promise.resolve();

        setTasks([]);
        setLoading(false);
        setError(null);

        return;
      }

      try {
        const result = await getTasks();

        setTasks(result);
        setError(null);
      } catch (err) {
        console.error(
          "Dashboard task load failed:",
          err
        );

        /*
         * আগে data থাকলে সেটা রেখে দেব।
         * শুধু error দেখাব।
         */
        setError(
          "টাস্ক লোড করা যায়নি।"
        );
      } finally {
        setLoading(false);
      }
    },
    [initialized, user]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    /*
     * Effect body থেকে সরাসরি state update না করে
     * async callback-এর মাধ্যমে load করছি।
     */
    const run = async () => {
      if (!initialized) {
        return;
      }

      if (!user) {
        await Promise.resolve();

        if (cancelled) {
          return;
        }

        setTasks([]);
        setLoading(false);
        setError(null);

        return;
      }

      try {
        const result = await getTasks();

        if (cancelled) {
          return;
        }

        setTasks(result);
        setError(null);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Initial dashboard task load failed:",
          err
        );

        setError(
          "টাস্ক লোড করা যায়নি।"
        );
      } finally {
        if (cancelled) {
          return;
        }

        setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [initialized, user]);

  /* =======================================================
     TASK CHANGE EVENT
  ======================================================= */

  useEffect(() => {
    if (!initialized || !user) {
      return;
    }

    let timer:
      | ReturnType<typeof setTimeout>
      | null = null;

    const handleTaskChanged = () => {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        void loadTasks();
      }, 50);
    };

    window.addEventListener(
      "life-os-task-changed",
      handleTaskChanged
    );

    window.addEventListener(
      "life-os-task-synced",
      handleTaskChanged
    );

    window.addEventListener(
      "life-os-dashboard-refresh",
      handleTaskChanged
    );

    return () => {
      if (timer) {
        clearTimeout(timer);
      }

      window.removeEventListener(
        "life-os-task-changed",
        handleTaskChanged
      );

      window.removeEventListener(
        "life-os-task-synced",
        handleTaskChanged
      );

      window.removeEventListener(
        "life-os-dashboard-refresh",
        handleTaskChanged
      );
    };
  }, [initialized, user, loadTasks]);

  /* =======================================================
     ONLINE EVENT
  ======================================================= */

  useEffect(() => {
    if (!initialized || !user) {
      return;
    }

    const handleOnline = () => {
      void loadTasks();
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
  }, [initialized, user, loadTasks]);

  /* =======================================================
     COMPLETE TASK
  ======================================================= */

  const handleCompleteTask = async (
    taskId: string
  ) => {
    if (completingTaskId !== null) {
      return;
    }

    /*
     * আগের task list রেখে দিচ্ছি।
     *
     * Complete fail করলে restore করব।
     */
    const previousTasks = tasks;

    try {
      setCompletingTaskId(taskId);
      setError(null);

      /*
       * UI থেকে সঙ্গে সঙ্গে task remove।
       *
       * তাই click করার পর task আর থাকবে না।
       */
      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task.id !== taskId
        )
      );

      /*
       * Actual completion.
       */
      await completeTask(taskId);

      /*
       * OverviewSection update হবে।
       */
      window.dispatchEvent(
        new CustomEvent(
          "life-os-task-changed"
        )
      );

      /*
       * অন্যান্য dashboard component-ও
       * refresh করতে পারবে।
       */
      window.dispatchEvent(
        new CustomEvent(
          "life-os-dashboard-refresh"
        )
      );
    } catch (err) {
      console.error(
        "Failed to complete task:",
        err
      );

      /*
       * Completion fail হলে task ফিরিয়ে দাও।
       */
      setTasks(previousTasks);

      setError(
        "টাস্ক সম্পন্ন করা যায়নি।"
      );
    } finally {
      setCompletingTaskId(null);
    }
  };

  /* =======================================================
     TODAY ACTIVE TASKS
  ======================================================= */

  const todayTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        /*
         * Completed task dashboard-এ দেখাব না।
         */
        if (task.status === "completed") {
          return false;
        }

        /*
         * Daily task।
         */
        if (task.status === "daily") {
          return true;
        }

        /*
         * Pending task।
         *
         * activeDate থাকলে সেটা ব্যবহার করবে।
         */
        if (
          task.status === "pending" &&
          task.activeDate
        ) {
          return (
            task.activeDate <= today
          );
        }

        /*
         * activeDate না থাকলে dueDate ব্যবহার।
         */
        if (
          task.status === "pending" &&
          task.dueDate
        ) {
          return (
            task.dueDate <= today
          );
        }

        return false;
      })
      .sort((a, b) => {
        const priorityDifference =
          priorityOrder[a.priority] -
          priorityOrder[b.priority];

        if (
          priorityDifference !== 0
        ) {
          return priorityDifference;
        }

        return (
          (a.order ?? 0) -
          (b.order ?? 0)
        );
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
          loading
            ? "টাস্ক লোড হচ্ছে..."
            : hasTasks
            ? `${todayTasks.length}টি টাস্ক বাকি`
            : "সব টাস্ক সম্পন্ন"
        }
      />

      {/* ===================================================
          INITIAL LOADING
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
            background: "#F6E4D8",
            color: COLORS.clay,
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
                    void handleCompleteTask(
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
                  {/* CHECKBOX */}

                  <TaskCheckbox
                    loading={
                      isCompleting
                    }
                  />

                  {/* TASK CONTENT */}

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

                  {/* PRIORITY */}

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