"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  CheckSquare,
  Flame,
  Loader2,
} from "lucide-react";

import DashboardCard from "./DashboardCard";
import DashboardSectionTitle from "./DashboardSectionTitle";

import { getTasks } from "@/features/tasks/services/task.service";

import {
  getHabits,
  getHabitCompletions,
} from "@/features/habits/services/habit.service";

import type { Task } from "@/features/tasks/types/task.types";

/* =========================================================
   TYPES
========================================================= */

interface HabitCompletion {
  id?: string;
  date: string;
  completed: boolean;
}

interface HabitData {
  id: string;
  status?: string;
}

interface MonthData {
  key: string;
  label: string;
  tasks: number;
  habits: number;
  total: number;
  score: number;
}

type ViewMode = "monthly" | "yearly";

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

  gold: "#B4842A",
  goldSoft: "#F5EACB",

  clay: "#B15A38",
  claySoft: "#F6E4D8",
};

/* =========================================================
   MONTH NAMES
========================================================= */

const MONTHS = [
  "জানু",
  "ফেব্রু",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগ",
  "সেপ্টে",
  "অক্টো",
  "নভে",
  "ডিসে",
];

/* =========================================================
   HELPERS
========================================================= */

function getMonthKey(
  dateString: string
): string | null {
  if (!dateString) {
    return null;
  }

  const match =
    dateString.match(
      /^(\d{4})-(\d{2})/
    );

  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}`;
}

/* =========================================================
   PRODUCTIVITY CHART
========================================================= */

export default function ProductivityChart() {
  /* =======================================================
     STATE
  ======================================================= */

  const [viewMode, setViewMode] =
    useState<ViewMode>("monthly");

  const [year, setYear] =
    useState<number>(
      () => new Date().getFullYear()
    );

  const [selectedMonth, setSelectedMonth] =
    useState<number>(
      () => new Date().getMonth()
    );

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [habits, setHabits] =
    useState<HabitData[]>([]);

  const [
    habitCompletions,
    setHabitCompletions,
  ] = useState<
    Record<
      string,
      HabitCompletion[]
    >
  >({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadData =
    useCallback(async () => {
      try {
        setError(null);

        const [
          taskResult,
          habitResult,
        ] = await Promise.all([
          getTasks(),
          getHabits(),
        ]);

        setTasks(taskResult);

        /*
         * Habit service-এর actual result
         * থেকে প্রয়োজনীয় field নিচ্ছি।
         */
        const activeHabits: HabitData[] =
          habitResult
            .filter(
              (habit) =>
                habit.status ===
                "active"
            )
            .map((habit) => ({
              id: habit.id,
              status: habit.status,
            }));

        setHabits(
          activeHabits
        );

        /* -----------------------------------------------
           HABIT COMPLETIONS
        ------------------------------------------------ */

        const completionEntries =
          await Promise.all(
            activeHabits.map(
              async (habit) => {
                try {
                  const completions =
                    await getHabitCompletions(
                      habit.id
                    );

                  /*
                   * Service যদি extra field দেয়,
                   * আমরা শুধু প্রয়োজনীয় field রাখছি।
                   */
                  const normalized: HabitCompletion[] =
                    completions.map(
                      (completion) => ({
                        id:
                          completion.id,
                        date:
                          completion.date,
                        completed:
                          completion.completed ===
                          true,
                      })
                    );

                  return [
                    habit.id,
                    normalized,
                  ] as const;
                } catch (completionError) {
                  console.error(
                    "Habit completion load failed:",
                    completionError
                  );

                  return [
                    habit.id,
                    [],
                  ] as const;
                }
              }
            )
          );

        setHabitCompletions(
          Object.fromEntries(
            completionEntries
          )
        );
      } catch (loadError) {
        console.error(
          "Productivity data load failed:",
          loadError
        );

        setError(
          "Productivity data লোড করা যায়নি।"
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const startLoad = async () => {
      await loadData();

      if (cancelled) {
        return;
      }
    };

    void startLoad();

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  /* =======================================================
     UPDATE EVENTS
  ======================================================= */

  useEffect(() => {
    let timer:
      | ReturnType<typeof setTimeout>
      | null = null;

    const refresh = () => {
      if (timer !== null) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        void loadData();
      }, 100);
    };

    window.addEventListener(
      "life-os-task-changed",
      refresh
    );

    window.addEventListener(
      "life-os-task-synced",
      refresh
    );

    window.addEventListener(
      "life-os-habit-changed",
      refresh
    );

    window.addEventListener(
      "life-os-habit-synced",
      refresh
    );

    window.addEventListener(
      "online",
      refresh
    );

    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }

      window.removeEventListener(
        "life-os-task-changed",
        refresh
      );

      window.removeEventListener(
        "life-os-task-synced",
        refresh
      );

      window.removeEventListener(
        "life-os-habit-changed",
        refresh
      );

      window.removeEventListener(
        "life-os-habit-synced",
        refresh
      );

      window.removeEventListener(
        "online",
        refresh
      );
    };
  }, [loadData]);

  /* =======================================================
     MONTHLY DATA
  ======================================================= */

  const monthlyData =
    useMemo<MonthData[]>(() => {
      return MONTHS.map(
        (label, monthIndex) => {
          const monthNumber =
            String(
              monthIndex + 1
            ).padStart(2, "0");

          const key =
            `${year}-${monthNumber}`;

          /* -----------------------------------------------
             COMPLETED TASKS
          ------------------------------------------------ */

          const completedTasks =
            tasks.filter(
              (task) => {
                if (
                  task.status !==
                  "completed"
                ) {
                  return false;
                }

                if (
                  !task.completedAt
                ) {
                  return false;
                }

                return (
                  getMonthKey(
                    task.completedAt
                  ) === key
                );
              }
            ).length;

          /* -----------------------------------------------
             COMPLETED HABITS
          ------------------------------------------------ */

          let completedHabits = 0;

          Object.values(
            habitCompletions
          ).forEach(
            (
              completions: HabitCompletion[]
            ) => {
              completions.forEach(
                (
                  completion: HabitCompletion
                ) => {
                  if (
                    completion.completed !==
                    true
                  ) {
                    return;
                  }

                  if (
                    getMonthKey(
                      completion.date
                    ) === key
                  ) {
                    completedHabits +=
                      1;
                  }
                }
              );
            }
          );

          /* -----------------------------------------------
             TOTAL
          ------------------------------------------------ */

          const total =
            completedTasks +
            completedHabits;

          /*
           * Visual productivity score.
           *
           * Maximum reference:
           * 30 completions / month.
           */
          const score =
            total > 0
              ? Math.min(
                  100,
                  Math.round(
                    (total / 30) *
                      100
                  )
                )
              : 0;

          return {
            key,
            label,
            tasks:
              completedTasks,
            habits:
              completedHabits,
            total,
            score,
          };
        }
      );
    }, [
      tasks,
      habitCompletions,
      year,
    ]);

  /* =======================================================
     SELECTED MONTH
  ======================================================= */

  const selectedMonthData =
    monthlyData[
      selectedMonth
    ];

  /* =======================================================
     YEAR TOTALS
  ======================================================= */

  const yearlyTotals =
    useMemo(() => {
      const taskTotal =
        monthlyData.reduce(
          (sum, item) =>
            sum + item.tasks,
          0
        );

      const habitTotal =
        monthlyData.reduce(
          (sum, item) =>
            sum + item.habits,
          0
        );

      return {
        tasks: taskTotal,
        habits: habitTotal,
        total:
          taskTotal +
          habitTotal,
      };
    }, [monthlyData]);

  /* =======================================================
     CHART MAX
  ======================================================= */

  const chartMax =
    Math.max(
      10,
      ...monthlyData.map(
        (item) =>
          item.total
      )
    );

  /* =======================================================
     YEAR CHANGE
  ======================================================= */

  const changeYear = (
    direction: number
  ) => {
    setYear(
      (currentYear) =>
        currentYear +
        direction
    );
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <DashboardCard>
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex items-start justify-between gap-3">
        <DashboardSectionTitle
          icon={BarChart3}
          title="প্রোডাক্টিভিটি"
          subtitle={
            viewMode ===
            "monthly"
              ? `${MONTHS[selectedMonth]} ${year}`
              : `${year} সালের সম্পূর্ণ হিসাব`
          }
        />

        {/* VIEW TOGGLE */}

        <div
          className="flex rounded-xl p-1 flex-shrink-0"
          style={{
            background:
              COLORS.paper,
            border:
              `1px solid ${COLORS.line}`,
          }}
        >
          <button
            type="button"
            onClick={() =>
              setViewMode(
                "monthly"
              )
            }
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
            style={{
              background:
                viewMode ===
                "monthly"
                  ? COLORS.card
                  : "transparent",

              color:
                viewMode ===
                "monthly"
                  ? COLORS.teal
                  : COLORS.muted,
            }}
          >
            মাস
          </button>

          <button
            type="button"
            onClick={() =>
              setViewMode(
                "yearly"
              )
            }
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
            style={{
              background:
                viewMode ===
                "yearly"
                  ? COLORS.card
                  : "transparent",

              color:
                viewMode ===
                "yearly"
                  ? COLORS.teal
                  : COLORS.muted,
            }}
          >
            বছর
          </button>
        </div>
      </div>

      {/* ===================================================
          LOADING
      =================================================== */}

      {loading && (
        <div
          className="flex items-center justify-center gap-2 py-10 text-sm"
          style={{
            color:
              COLORS.mutedSoft,
          }}
        >
          <Loader2
            size={17}
            className="animate-spin"
          />

          <span>
            ডাটা বিশ্লেষণ হচ্ছে...
          </span>
        </div>
      )}

      {/* ===================================================
          ERROR
      =================================================== */}

      {!loading &&
        error && (
          <div
            className="rounded-xl px-3 py-3 text-sm"
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
          CONTENT
      =================================================== */}

      {!loading &&
        !error && (
          <>
            {/* =============================================
                SUMMARY
            ============================================== */}

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {/* TASKS */}

              <div
                className="rounded-xl p-3"
                style={{
                  background:
                    COLORS.tealSoft,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckSquare
                    size={13}
                    color={
                      COLORS.teal
                    }
                  />

                  <span
                    className="text-[10px] font-semibold"
                    style={{
                      color:
                        COLORS.muted,
                    }}
                  >
                    Tasks
                  </span>
                </div>

                <div
                  className="text-lg font-semibold"
                  style={{
                    color:
                      COLORS.teal,
                    fontFamily:
                      "'IBM Plex Mono', monospace",
                  }}
                >
                  {viewMode ===
                  "monthly"
                    ? selectedMonthData?.tasks ??
                      0
                    : yearlyTotals.tasks}
                </div>
              </div>

              {/* HABITS */}

              <div
                className="rounded-xl p-3"
                style={{
                  background:
                    COLORS.goldSoft,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Flame
                    size={13}
                    color={
                      COLORS.gold
                    }
                  />

                  <span
                    className="text-[10px] font-semibold"
                    style={{
                      color:
                        COLORS.muted,
                    }}
                  >
                    Habits
                  </span>
                </div>

                <div
                  className="text-lg font-semibold"
                  style={{
                    color:
                      COLORS.gold,
                    fontFamily:
                      "'IBM Plex Mono', monospace",
                  }}
                >
                  {viewMode ===
                  "monthly"
                    ? selectedMonthData?.habits ??
                      0
                    : yearlyTotals.habits}
                </div>
              </div>

              {/* TOTAL */}

              <div
                className="rounded-xl p-3"
                style={{
                  background:
                    COLORS.claySoft,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart3
                    size={13}
                    color={
                      COLORS.clay
                    }
                  />

                  <span
                    className="text-[10px] font-semibold"
                    style={{
                      color:
                        COLORS.muted,
                    }}
                  >
                    Total
                  </span>
                </div>

                <div
                  className="text-lg font-semibold"
                  style={{
                    color:
                      COLORS.clay,
                    fontFamily:
                      "'IBM Plex Mono', monospace",
                  }}
                >
                  {viewMode ===
                  "monthly"
                    ? selectedMonthData?.total ??
                      0
                    : yearlyTotals.total}
                </div>
              </div>
            </div>

            {/* =============================================
                YEAR SELECTOR
            ============================================== */}

            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() =>
                  changeYear(-1)
                }
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background:
                    COLORS.paper,
                  color:
                    COLORS.muted,
                  border:
                    `1px solid ${COLORS.line}`,
                }}
              >
                ← {year - 1}
              </button>

              <div
                className="text-sm font-semibold"
                style={{
                  color:
                    COLORS.ink,
                  fontFamily:
                    "'IBM Plex Mono', monospace",
                }}
              >
                {year}
              </div>

              <button
                type="button"
                onClick={() =>
                  changeYear(1)
                }
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background:
                    COLORS.paper,
                  color:
                    COLORS.muted,
                  border:
                    `1px solid ${COLORS.line}`,
                }}
              >
                {year + 1} →
              </button>
            </div>

            {/* =============================================
                GRAPH
            ============================================== */}

            <div
              className="rounded-2xl p-4"
              style={{
                background:
                  COLORS.paper,
                border:
                  `1px solid ${COLORS.line}`,
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div
                    className="text-sm font-semibold"
                    style={{
                      color:
                        COLORS.ink,
                    }}
                  >
                    {viewMode ===
                    "monthly"
                      ? "মাসিক অগ্রগতি"
                      : "বার্ষিক অগ্রগতি"}
                  </div>

                  <div
                    className="text-[10px] mt-1"
                    style={{
                      color:
                        COLORS.mutedSoft,
                    }}
                  >
                    Task + Habit completion
                  </div>
                </div>

                <div className="flex gap-3 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          COLORS.teal,
                      }}
                    />

                    Tasks
                  </span>

                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          COLORS.gold,
                      }}
                    />

                    Habits
                  </span>
                </div>
              </div>

              {/* BAR CHART */}

              <div
                className="flex items-end gap-1.5 sm:gap-2"
                style={{
                  height: 190,
                }}
              >
                {monthlyData.map(
                  (
                    item,
                    index
                  ) => {
                    const isSelected =
                      index ===
                      selectedMonth;

                    const taskHeight =
                      (item.tasks /
                        chartMax) *
                      130;

                    const habitHeight =
                      (item.habits /
                        chartMax) *
                      130;

                    return (
                      <button
                        key={
                          item.key
                        }
                        type="button"
                        onClick={() =>
                          setSelectedMonth(
                            index
                          )
                        }
                        className="flex-1 h-full flex flex-col justify-end items-center group"
                      >
                        {/* VALUE */}

                        <div
                          className="text-[9px] mb-1"
                          style={{
                            color:
                              COLORS.ink,
                            opacity:
                              isSelected
                                ? 1
                                : 0,
                          }}
                        >
                          {item.total}
                        </div>

                        {/* BARS */}

                        <div className="w-full max-w-[30px] flex items-end justify-center gap-[2px]">
                          <div
                            className="w-1/2 rounded-t-md"
                            style={{
                              height:
                                Math.max(
                                  3,
                                  taskHeight
                                ),

                              background:
                                COLORS.teal,

                              opacity:
                                isSelected
                                  ? 1
                                  : 0.65,
                            }}
                          />

                          <div
                            className="w-1/2 rounded-t-md"
                            style={{
                              height:
                                Math.max(
                                  3,
                                  habitHeight
                                ),

                              background:
                                COLORS.gold,

                              opacity:
                                isSelected
                                  ? 1
                                  : 0.65,
                            }}
                          />
                        </div>

                        {/* MONTH */}

                        <div
                          className="text-[9px] mt-2"
                          style={{
                            color:
                              isSelected
                                ? COLORS.teal
                                : COLORS.mutedSoft,

                            fontWeight:
                              isSelected
                                ? 700
                                : 500,
                          }}
                        >
                          {item.label}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* =============================================
                SELECTED MONTH
            ============================================== */}

            {viewMode ===
              "monthly" &&
              selectedMonthData && (
                <div
                  className="mt-3 rounded-xl px-3.5 py-3 flex items-center justify-between"
                  style={{
                    background:
                      COLORS.card,
                    border:
                      `1px solid ${COLORS.line}`,
                  }}
                >
                  <div>
                    <div
                      className="text-xs font-semibold"
                      style={{
                        color:
                          COLORS.ink,
                      }}
                    >
                      {
                        selectedMonthData.label
                      }{" "}
                      {year}
                    </div>

                    <div
                      className="text-[10px] mt-1"
                      style={{
                        color:
                          COLORS.mutedSoft,
                      }}
                    >
                      মোট{" "}
                      {
                        selectedMonthData.total
                      }{" "}
                      completion
                    </div>
                  </div>

                  <div
                    className="text-xl font-semibold"
                    style={{
                      color:
                        COLORS.teal,
                      fontFamily:
                        "'IBM Plex Mono', monospace",
                    }}
                  >
                    {
                      selectedMonthData.score
                    }
                    %
                  </div>
                </div>
              )}
          </>
        )}
    </DashboardCard>
  );
}