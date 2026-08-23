"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckSquare,
  Flame,
  Loader2,
  TrendingUp,
} from "lucide-react";

import {
  getTasks,
} from "@/features/tasks/services/task.service";

import {
  getHabits,
  getHabitCompletions,
} from "@/features/habits/services/habit.service";

import DashboardCard from "./DashboardCard";
import DashboardSectionTitle from "./DashboardSectionTitle";

/* =========================================================
   TYPES
========================================================= */

type Period = "weekly" | "monthly";

interface ChartDay {
  key: string;
  label: string;
  taskCompleted: number;
  habitCompleted: number;
}

interface HabitCompletion {
  date: string;
  completed: boolean;
}

interface ActivityTask {
  status: string;
  completedAt: string | null;
}

interface ActivityHabit {
  id: string;
  status: string;
}

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
   DATE HELPERS
========================================================= */

function formatDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function getDateDaysAgo(days: number): Date {
  const date = new Date();

  date.setDate(
    date.getDate() - days
  );

  return startOfDay(date);
}

function getMonthStart(): Date {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );
}

/* =========================================================
   DAY LABEL
========================================================= */

function getDayLabel(
  date: Date,
  period: Period
): string {
  if (period === "weekly") {
    return date.toLocaleDateString(
      "bn-BD",
      {
        weekday: "short",
      }
    );
  }

  return String(
    date.getDate()
  );
}

/* =========================================================
   CREATE CHART DAYS
========================================================= */

function createChartDays(
  period: Period
): ChartDay[] {
  const today = startOfDay(
    new Date()
  );

  const days: ChartDay[] = [];

  if (period === "weekly") {
    /*
     * Last 7 days
     */
    for (
      let i = 6;
      i >= 0;
      i--
    ) {
      const date =
        getDateDaysAgo(i);

      days.push({
        key: formatDate(date),

        label:
          getDayLabel(
            date,
            period
          ),

        taskCompleted: 0,

        habitCompleted: 0,
      });
    }

    return days;
  }

  /*
   * Current month
   */
  const monthStart =
    getMonthStart();

  const dayCount =
    today.getDate();

  for (
    let i = 0;
    i < dayCount;
    i++
  ) {
    const date =
      new Date(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        i + 1
      );

    days.push({
      key: formatDate(date),

      label:
        getDayLabel(
          date,
          period
        ),

      taskCompleted: 0,

      habitCompleted: 0,
    });
  }

  return days;
}

/* =========================================================
   SIMPLE BAR
========================================================= */

interface ActivityBarProps {
  value: number;
  max: number;
  background: string;
}

function ActivityBar({
  value,
  max,
  background,
}: ActivityBarProps) {
  const height =
    max > 0
      ? Math.max(
          8,
          (value / max) * 100
        )
      : 8;

  return (
    <div
      className="flex-1 flex items-end justify-center"
      style={{
        height: 150,
      }}
    >
      <div
        className="w-full max-w-[22px] rounded-t-md transition-all duration-500"
        style={{
          height: `${height}%`,
          background,
          opacity:
            value === 0 ? 0.18 : 1,
          minHeight: 4,
        }}
      />
    </div>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ActivityGraph() {
  const [period, setPeriod] =
    useState<Period>(
      "weekly"
    );

  const [chartData, setChartData] =
    useState<ChartDay[]>(() =>
      createChartDays(
        "weekly"
      )
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null
    );

  /* =======================================================
     LOAD ACTIVITY
  ======================================================= */

  const loadActivity =
    useCallback(
      async (
        selectedPeriod: Period
      ) => {
        try {
          /*
           * Do not change state here before
           * async data is available.
           */

          const days =
            createChartDays(
              selectedPeriod
            );

          const dayMap =
            new Map<
              string,
              ChartDay
            >();

          days.forEach(
            (day) => {
              dayMap.set(
                day.key,
                {
                  ...day,
                }
              );
            }
          );

          /*
           * ===============================================
           * TASKS
           * ===============================================
           */

          const tasks =
            (await getTasks()) as ActivityTask[];

          tasks.forEach(
            (task) => {
              if (
                task.status !==
                  "completed" ||
                !task.completedAt
              ) {
                return;
              }

              const date =
                task.completedAt.slice(
                  0,
                  10
                );

              const day =
                dayMap.get(
                  date
                );

              if (!day) {
                return;
              }

              day.taskCompleted +=
                1;
            }
          );

          /*
           * ===============================================
           * HABITS
           * ===============================================
           */

          const habits =
            (await getHabits()) as ActivityHabit[];

          const activeHabits =
            habits.filter(
              (habit) =>
                habit.status ===
                "active"
            );

          /*
           * Load habit completion
           * data safely.
           */

          const completionResults =
            await Promise.all(
              activeHabits.map(
                async (
                  habit
                ) => {
                  try {
                    const result =
                      await getHabitCompletions(
                        habit.id
                      );

                    return result as HabitCompletion[];
                  } catch (
                    habitError
                  ) {
                    console.error(
                      "Habit completion load failed:",
                      habitError
                    );

                    return [];
                  }
                }
              )
            );

          completionResults.forEach(
            (
              completions
            ) => {
              completions.forEach(
                (
                  completion
                ) => {
                  if (
                    completion.completed !==
                    true
                  ) {
                    return;
                  }

                  const day =
                    dayMap.get(
                      completion.date
                    );

                  if (!day) {
                    return;
                  }

                  day.habitCompleted +=
                    1;
                }
              );
            }
          );

          /*
           * Convert Map into array
           */
          const finalData =
            days.map(
              (day) => {
                const updated =
                  dayMap.get(
                    day.key
                  );

                return (
                  updated ?? day
                );
              }
            );

          /*
           * State update happens AFTER
           * async work is finished.
           */

          setChartData(
            finalData
          );

          setError(null);
        } catch (loadError) {
          console.error(
            "Activity graph load failed:",
            loadError
          );

          /*
           * Don't destroy existing chart
           * when refresh fails.
           */

          setError(
            "অ্যাক্টিভিটি ডাটা লোড করা যায়নি।"
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  /* =======================================================
     INITIAL LOAD / PERIOD CHANGE
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    const run = async () => {
      try {
        await loadActivity(
          period
        );
      } finally {
        /*
         * No synchronous setState here.
         *
         * If component unmounts,
         * request result is simply ignored
         * by the caller lifecycle.
         */
        if (cancelled) {
          return;
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    period,
    loadActivity,
  ]);

  /* =======================================================
     TASK / HABIT UPDATE EVENTS
  ======================================================= */

  useEffect(() => {
    let timer:
      | ReturnType<
          typeof setTimeout
        >
      | null = null;

    const handleUpdate =
      () => {
        if (timer) {
          clearTimeout(
            timer
          );
        }

        timer = setTimeout(
          () => {
            void loadActivity(
              period
            );
          },
          100
        );
      };

    window.addEventListener(
      "life-os-task-changed",
      handleUpdate
    );

    window.addEventListener(
      "life-os-task-synced",
      handleUpdate
    );

    window.addEventListener(
      "life-os-habit-changed",
      handleUpdate
    );

    window.addEventListener(
      "life-os-habit-synced",
      handleUpdate
    );

    window.addEventListener(
      "online",
      handleUpdate
    );

    return () => {
      if (timer) {
        clearTimeout(
          timer
        );
      }

      window.removeEventListener(
        "life-os-task-changed",
        handleUpdate
      );

      window.removeEventListener(
        "life-os-task-synced",
        handleUpdate
      );

      window.removeEventListener(
        "life-os-habit-changed",
        handleUpdate
      );

      window.removeEventListener(
        "life-os-habit-synced",
        handleUpdate
      );

      window.removeEventListener(
        "online",
        handleUpdate
      );
    };
  }, [
    period,
    loadActivity,
  ]);

  /* =======================================================
     TOTALS
  ======================================================= */

  const totals =
    useMemo(() => {
      return chartData.reduce(
        (total, day) => {
          total.tasks +=
            day.taskCompleted;

          total.habits +=
            day.habitCompleted;

          return total;
        },
        {
          tasks: 0,
          habits: 0,
        }
      );
    }, [chartData]);

  /* =======================================================
     MAX VALUE
  ======================================================= */

  const maxValue =
    useMemo(() => {
      const values =
        chartData.flatMap(
          (day) => [
            day.taskCompleted,
            day.habitCompleted,
          ]
        );

      const max =
        Math.max(
          ...values,
          1
        );

      return max;
    }, [chartData]);

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
          icon={TrendingUp}
          title="অ্যাক্টিভিটি"
          subtitle={
            period ===
            "weekly"
              ? "গত ৭ দিনের কাজের হিসাব"
              : "এই মাসের কাজের হিসাব"
          }
        />

        {/* Period switch */}
        <div
          className="flex items-center rounded-xl p-1 flex-shrink-0"
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
              setPeriod(
                "weekly"
              )
            }
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background:
                period ===
                "weekly"
                  ? COLORS.card
                  : "transparent",

              color:
                period ===
                "weekly"
                  ? COLORS.teal
                  : COLORS.muted,
            }}
          >
            সপ্তাহ
          </button>

          <button
            type="button"
            onClick={() =>
              setPeriod(
                "monthly"
              )
            }
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background:
                period ===
                "monthly"
                  ? COLORS.card
                  : "transparent",

              color:
                period ===
                "monthly"
                  ? COLORS.teal
                  : COLORS.muted,
            }}
          >
            মাস
          </button>
        </div>
      </div>

      {/* ===================================================
          SUMMARY
      =================================================== */}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div
          className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
          style={{
            background:
              COLORS.tealSoft,
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background:
                COLORS.card,
            }}
          >
            <CheckSquare
              size={15}
              color={COLORS.teal}
            />
          </div>

          <div>
            <div
              className="text-sm font-semibold"
              style={{
                color:
                  COLORS.teal,
              }}
            >
              {totals.tasks}
            </div>

            <div
              className="text-[10px]"
              style={{
                color:
                  COLORS.muted,
              }}
            >
              সম্পন্ন টাস্ক
            </div>
          </div>
        </div>

        <div
          className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
          style={{
            background:
              COLORS.goldSoft,
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background:
                COLORS.card,
            }}
          >
            <Flame
              size={15}
              color={COLORS.gold}
            />
          </div>

          <div>
            <div
              className="text-sm font-semibold"
              style={{
                color:
                  COLORS.gold,
              }}
            >
              {totals.habits}
            </div>

            <div
              className="text-[10px]"
              style={{
                color:
                  COLORS.muted,
              }}
            >
              সম্পন্ন অভ্যাস
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div
          className="rounded-xl px-3 py-2.5 mb-3 text-xs"
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
          LOADING
      =================================================== */}

      {loading ? (
        <div
          className="flex items-center justify-center gap-2 py-10"
          style={{
            color:
              COLORS.mutedSoft,
          }}
        >
          <Loader2
            size={17}
            className="animate-spin"
          />

          <span className="text-sm">
            অ্যাক্টিভিটি লোড হচ্ছে...
          </span>
        </div>
      ) : (
        <>
          {/* =============================================
              CHART
          ============================================= */}

          <div
            className="rounded-2xl p-3.5"
            style={{
              background:
                COLORS.paper,
              border:
                `1px solid ${COLORS.line}`,
            }}
          >
            {/* Legend */}

            <div className="flex items-center justify-end gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background:
                      COLORS.teal,
                  }}
                />

                <span
                  className="text-[10px]"
                  style={{
                    color:
                      COLORS.muted,
                  }}
                >
                  টাস্ক
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background:
                      COLORS.gold,
                  }}
                />

                <span
                  className="text-[10px]"
                  style={{
                    color:
                      COLORS.muted,
                  }}
                >
                  অভ্যাস
                </span>
              </div>
            </div>

            {/* Bars */}

            <div className="flex items-end gap-2 sm:gap-3">
              {chartData.map(
                (day) => (
                  <div
                    key={day.key}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-end gap-1">
                      <ActivityBar
                        value={
                          day.taskCompleted
                        }
                        max={
                          maxValue
                        }
                        background={
                          COLORS.teal
                        }
                      />

                      <ActivityBar
                        value={
                          day.habitCompleted
                        }
                        max={
                          maxValue
                        }
                        background={
                          COLORS.gold
                        }
                      />
                    </div>

                    <div
                      className="text-[9px] text-center mt-2 truncate"
                      style={{
                        color:
                          COLORS.mutedSoft,
                      }}
                    >
                      {
                        day.label
                      }
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* =============================================
              DESCRIPTION
          ============================================= */}

          <div
            className="mt-3 flex items-center gap-2 text-xs"
            style={{
              color:
                COLORS.mutedSoft,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background:
                  COLORS.teal,
              }}
            />

            <span>
              বেশি বার সম্পন্ন করলে
              গ্রাফে বার আরও উঁচু হবে।
            </span>
          </div>
        </>
      )}
    </DashboardCard>
  );
}