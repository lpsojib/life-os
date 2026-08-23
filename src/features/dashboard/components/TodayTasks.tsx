"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
        transition-all
        duration-200
      "
      style={{
        width: 22,
        height: 22,

        border: `2px solid ${COLORS.line}`,

        background: COLORS.card,

        opacity: loading ? 0.65 : 1,
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
  const [tasks, setTasks] = useState<Task[]>([]);

  /*
   * শুধু প্রথমবার data load হওয়ার জন্য।
   *
   * পরের refresh-এ এই loading আর true হবে না।
   */
  const [initialLoading, setInitialLoading] =
    useState(true);

  /*
   * Background refresh indicator।
   */
  const [refreshing, setRefreshing] =
    useState(false);

  const [completingTaskId, setCompletingTaskId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Component unmount হওয়ার পরে
   * state update আটকানোর জন্য।
   */
  const mountedRef = useRef(false);

  /*
   * একই সময়ে অনেক refresh request
   * চলা আটকানোর জন্য।
   */
  const loadingRef = useRef(false);

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
    async (isInitial = false) => {
      /*
       * একই সময়ে duplicate request চলতে দেব না।
       */
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;

      if (!isInitial) {
        setRefreshing(true);
      }

      try {
        const result = await getTasks();

        /*
         * Component আর mounted না থাকলে
         * state update করব না।
         */
        if (!mountedRef.current) {
          return;
        }

        /*
         * নতুন data পেলেই replace করব।
         *
         * getTasks() local/offline data ব্যবহার করলে
         * এখানেই দ্রুত update হবে।
         */
        setTasks(result);

        setError(null);
      } catch (err) {
        console.error(
          "Dashboard task load failed:",
          err
        );

        /*
         * Existing task থাকলে সেগুলো রেখে দেব।
         *
         * Refresh fail করলেও dashboard blank হবে না।
         */
        if (
          mountedRef.current &&
          tasks.length === 0
        ) {
          setError(
            "টাস্ক লোড করা যায়নি।"
          );
        }
      } finally {
        loadingRef.current = false;

        if (mountedRef.current) {
          setInitialLoading(false);
          setRefreshing(false);
        }
      }
    },
    [tasks.length]
  );

  /* =======================================================
     COMPONENT MOUNT
  ======================================================= */

  useEffect(() => {
    mountedRef.current = true;

    /*
     * Initial task load.
     */
    void loadTasks(true);

    return () => {
      mountedRef.current = false;
    };
  }, [loadTasks]);

  /* =======================================================
     TASK CHANGE EVENT
  ======================================================= */

  useEffect(() => {
    let timer: ReturnType<
      typeof setTimeout
    > | null = null;

    const handleTaskChanged = () => {
      /*
       * একসাথে add/update/delete/complete
       * event অনেকবার এলে শুধু একটি refresh হবে।
       */
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        void loadTasks(false);
      }, 100);
    };

    window.addEventListener(
      "life-os-task-changed",
      handleTaskChanged
    );

    window.addEventListener(
      "life-os-task-synced",
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
    };
  }, [loadTasks]);

  /* =======================================================
     ONLINE EVENT
  ======================================================= */

  useEffect(() => {
    const handleOnline = () => {
      /*
       * Internet আসলে background refresh।
       *
       * Existing task screen-এ থাকবে।
       */
      void loadTasks(false);
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
  }, [loadTasks]);

  /* =======================================================
     COMPLETE TASK
  ======================================================= */

  const handleCompleteTask = async (
    taskId: string
  ) => {
    /*
     * একসাথে দুইটা task complete করতে দেব না।
     */
    if (completingTaskId !== null) {
      return;
    }

    /*
     * Complete করার আগের list।
     *
     * যদি service fail করে,
     * task আবার ফিরিয়ে দেব।
     */
    const previousTasks = tasks;

    try {
      setCompletingTaskId(taskId);

      setError(null);

      /*
       * =====================================================
       * INSTANT UI UPDATE
       * =====================================================
       *
       * User click করার সাথে সাথে task disappear করবে।
       */
      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task.id !== taskId
        )
      );

      /*
       * Actual task completion।
       *
       * তোমার existing task service:
       *
       * - local update
       * - Firebase sync
       * - repeat task handling
       *
       * এগুলো handle করবে।
       */
      await completeTask(taskId);

      /*
       * OverviewSection এই event শুনে
       * task count update করবে।
       */
      window.dispatchEvent(
        new CustomEvent(
          "life-os-task-changed"
        )
      );

      /*
       * অন্য dashboard component-এর জন্য।
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
       * Completion fail করলে
       * আগের task list restore।
       */
      if (mountedRef.current) {
        setTasks(previousTasks);

        setError(
          "টাস্ক সম্পন্ন করা যায়নি।"
        );
      }
    } finally {
      if (mountedRef.current) {
        setCompletingTaskId(null);
      }
    }
  };

  /* =======================================================
     TODAY ACTIVE TASKS
  ======================================================= */

  const todayTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        /*
         * Daily task:
         * আজকের task হিসেবে দেখাবে।
         */
        if (task.status === "daily") {
          return true;
        }

        /*
         * Pending task:
         *
         * activeDate আজ বা তার আগের হলে
         * Dashboard-এ দেখাবে।
         */
        if (
          task.status === "pending" &&
          task.activeDate
        ) {
          return task.activeDate <= today;
        }

        /*
         * Completed task Dashboard-এ
         * দেখানো হবে না।
         */
        return false;
      })
      .sort((a, b) => {
        /*
         * Priority:
         *
         * জরুরি
         * ↓
         * মাঝারি
         * ↓
         * কম
         */
        const priorityDifference =
          priorityOrder[a.priority] -
          priorityOrder[b.priority];

        if (
          priorityDifference !== 0
        ) {
          return priorityDifference;
        }

        /*
         * Same priority হলে order অনুযায়ী।
         */
        return (
          (a.order ?? 0) -
          (b.order ?? 0)
        );
      });
  }, [tasks, today]);

  /* =======================================================
     HAS TASKS
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
          initialLoading
            ? "টাস্ক লোড হচ্ছে..."
            : hasTasks
            ? `${todayTasks.length}টি টাস্ক বাকি`
            : "সব টাস্ক সম্পন্ন"
        }
      />

      {/* ===================================================
          BACKGROUND REFRESH
      =================================================== */}

      {!initialLoading &&
        refreshing && (
          <div
            className="
              flex
              items-center
              justify-center
              gap-2
              mb-3
              text-xs
            "
            style={{
              color:
                COLORS.mutedSoft,
            }}
          >
            <Loader2
              size={13}
              className="animate-spin"
            />

            <span>
              আপডেট হচ্ছে...
            </span>
          </div>
        )}

      {/* ===================================================
          INITIAL LOADING
      =================================================== */}

      {initialLoading && (
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
            color:
              COLORS.mutedSoft,
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

      {!initialLoading &&
        error && (
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

      {!initialLoading &&
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
                color:
                  COLORS.ink,
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

      {!initialLoading &&
        !error &&
        hasTasks && (
          <div className="flex flex-col gap-2.5">
            {todayTasks.map(
              (task) => {
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
                          ? 0.6
                          : 1,
                    }}
                  >
                    {/* ===================================
                        CHECKBOX
                    =================================== */}

                    <TaskCheckbox
                      loading={
                        isCompleting
                      }
                    />

                    {/* ===================================
                        TASK CONTENT
                    =================================== */}

                    <div className="flex-1 min-w-0">
                      <div
                        className="
                          text-sm
                          font-medium
                        "
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
                          {
                            task.description
                          }
                        </div>
                      )}
                    </div>

                    {/* ===================================
                        PRIORITY TEXT
                    =================================== */}

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
              }
            )}
          </div>
        )}
    </DashboardCard>
  );
}