"use client";

import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  TrendingUp,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import DashboardCard from "./DashboardCard";
import DashboardSectionTitle from "./DashboardSectionTitle";

import {
  getTasks,
} from "@/features/tasks/services/task.service";

import {
  getHabits,
  getHabitCompletions,
} from "@/features/habits/services/habit.service";

import { useAuthStore } from "@/store/auth.store";

/* =========================================================
   TYPES
========================================================= */

type ReportMode = "monthly" | "yearly";

interface ActivityTask {
  id?: string;
  status: string;
  completedAt?: string | null;
  dueDate?: string | null;
  date?: string | null;
  scheduledDate?: string | null;
}

interface ActivityHabit {
  id: string;
  status: string;
}

interface ActivityHabitCompletion {
  date?: string | null;
  completed?: boolean;
}

interface DailyReport {
  key: string;
  label: string;
  taskPercentage: number;
  habitPercentage: number;
}

interface MonthlyReport {
  key: string;
  label: string;
  taskPercentage: number;
  habitPercentage: number;
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

function getDaysInMonth(
  year: number,
  month: number
): number {
  return new Date(
    year,
    month + 1,
    0
  ).getDate();
}

function getMonthKey(
  year: number,
  month: number
): string {
  return `${year}-${String(
    month + 1
  ).padStart(2, "0")}`;
}

function getMonthName(
  year: number,
  month: number
): string {
  return new Date(
    year,
    month,
    1
  ).toLocaleDateString("bn-BD", {
    month: "long",
    year: "numeric",
  });
}

function getShortMonthName(
  month: number
): string {
  return new Date(
    2024,
    month,
    1
  ).toLocaleDateString("bn-BD", {
    month: "short",
  });
}

/* =========================================================
   RANGE
========================================================= */

function daysInRange(
  startKey: string,
  endKey: string
): string[] {
  const result: string[] = [];

  const start = new Date(
    `${startKey}T00:00:00`
  );

  const end = new Date(
    `${endKey}T00:00:00`
  );

  const current = new Date(start);

  while (current <= end) {
    result.push(formatDate(current));

    current.setDate(
      current.getDate() + 1
    );
  }

  return result;
}

/* =========================================================
   SAFE TASK DATE
========================================================= */

function getTaskDate(
  task: ActivityTask
): string | null {
  const possibleDate =
    task.dueDate ??
    task.scheduledDate ??
    task.date ??
    null;

  if (
    typeof possibleDate !== "string" ||
    possibleDate.length < 10
  ) {
    return null;
  }

  return possibleDate.slice(0, 10);
}

/* =========================================================
   PERCENTAGE
========================================================= */

function calculatePercentage(
  completed: number,
  total: number
): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (completed / total) * 100
      )
    )
  );
}

/* =========================================================
   SVG CONSTANTS
========================================================= */

const CHART_WIDTH = 900;
const CHART_HEIGHT = 320;

const PADDING_LEFT = 48;
const PADDING_RIGHT = 20;
const PADDING_TOP = 18;
const PADDING_BOTTOM = 36;

const GRAPH_WIDTH =
  CHART_WIDTH -
  PADDING_LEFT -
  PADDING_RIGHT;

const GRAPH_HEIGHT =
  CHART_HEIGHT -
  PADDING_TOP -
  PADDING_BOTTOM;

/* =========================================================
   SVG POINT
========================================================= */

function getPointX(
  index: number,
  total: number
): number {
  if (total <= 1) {
    return (
      PADDING_LEFT +
      GRAPH_WIDTH / 2
    );
  }

  return (
    PADDING_LEFT +
    (index / (total - 1)) *
      GRAPH_WIDTH
  );
}

function getPointY(
  value: number
): number {
  return (
    PADDING_TOP +
    GRAPH_HEIGHT -
    (value / 100) *
      GRAPH_HEIGHT
  );
}

/* =========================================================
   SMOOTH PATH
========================================================= */

function createSmoothPath(
  values: number[]
): string {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    const x = getPointX(0, 1);
    const y = getPointY(values[0]);

    return `M ${x} ${y}`;
  }

  const points = values.map(
    (value, index) => ({
      x: getPointX(
        index,
        values.length
      ),
      y: getPointY(value),
    })
  );

  let path =
    `M ${points[0].x} ${points[0].y}`;

  for (
    let index = 0;
    index <
    points.length - 1;
    index++
  ) {
    const current =
      points[index];

    const next =
      points[index + 1];

    const controlX =
      (current.x + next.x) / 2;

    path +=
      ` C ${controlX} ${current.y}, ` +
      `${controlX} ${next.y}, ` +
      `${next.x} ${next.y}`;
  }

  return path;
}

/* =========================================================
   MONTHLY LINE CHART
========================================================= */

interface LineChartProps {
  data: DailyReport[];
}

function MonthlyLineChart({
  data,
}: LineChartProps) {
  const habitValues =
    data.map(
      (item) =>
        item.habitPercentage
    );

  const taskValues =
    data.map(
      (item) =>
        item.taskPercentage
    );

  const habitPath =
    createSmoothPath(
      habitValues
    );

  const taskPath =
    createSmoothPath(
      taskValues
    );

  const gridLines = [
    0,
    20,
    40,
    60,
    80,
    100,
  ];

  return (
    <div
      className="w-full overflow-hidden rounded-2xl p-2 sm:p-3"
      style={{
        background:
          COLORS.paper,
        border:
          `1px solid ${COLORS.line}`,
      }}
    >
      <div className="flex items-center justify-end gap-4 mb-2 pr-1">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background:
                COLORS.teal,
            }}
          />

          <span
            className="text-[10px] font-medium"
            style={{
              color:
                COLORS.muted,
            }}
          >
            Habit
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background:
                COLORS.clay,
            }}
          />

          <span
            className="text-[10px] font-medium"
            style={{
              color:
                COLORS.muted,
            }}
          >
            Task
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full min-w-[620px]"
          preserveAspectRatio="none"
        >
          {gridLines.map(
            (value) => {
              const y =
                getPointY(value);

              return (
                <g key={value}>
                  <line
                    x1={
                      PADDING_LEFT
                    }
                    x2={
                      CHART_WIDTH -
                      PADDING_RIGHT
                    }
                    y1={y}
                    y2={y}
                    stroke={
                      COLORS.line
                    }
                    strokeWidth="1"
                  />

                  <text
                    x={
                      PADDING_LEFT -
                      8
                    }
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill={
                      COLORS.mutedSoft
                    }
                  >
                    {value}%
                  </text>
                </g>
              );
            }
          )}

          <path
            d={habitPath}
            fill="none"
            stroke={
              COLORS.teal
            }
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={taskPath}
            fill="none"
            stroke={
              COLORS.clay
            }
            strokeWidth="2.5"
            strokeDasharray="7 5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {data.map(
            (item, index) => (
              <circle
                key={`habit-${item.key}`}
                cx={getPointX(
                  index,
                  data.length
                )}
                cy={getPointY(
                  item.habitPercentage
                )}
                r="2.5"
                fill={
                  COLORS.teal
                }
              />
            )
          )}

          {data.map(
            (item, index) => (
              <circle
                key={`task-${item.key}`}
                cx={getPointX(
                  index,
                  data.length
                )}
                cy={getPointY(
                  item.taskPercentage
                )}
                r="2"
                fill={
                  COLORS.clay
                }
              />
            )
          )}

          {data.map(
            (item, index) => {
              const shouldShow =
                data.length <= 15 ||
                index === 0 ||
                index ===
                  data.length - 1 ||
                index % 3 === 0;

              if (!shouldShow) {
                return null;
              }

              return (
                <text
                  key={`label-${item.key}`}
                  x={getPointX(
                    index,
                    data.length
                  )}
                  y={
                    CHART_HEIGHT -
                    10
                  }
                  textAnchor="middle"
                  fontSize="10"
                  fill={
                    COLORS.mutedSoft
                  }
                >
                  {item.label}
                </text>
              );
            }
          )}
        </svg>
      </div>
    </div>
  );
}

/* =========================================================
   YEAR BAR CHART
========================================================= */

interface YearChartProps {
  data: MonthlyReport[];
}

function YearBarChart({
  data,
}: YearChartProps) {
  return (
    <div
      className="w-full rounded-2xl p-3 sm:p-4"
      style={{
        background:
          COLORS.paper,
        border:
          `1px solid ${COLORS.line}`,
      }}
    >
      <div className="flex items-center justify-end gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm"
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
            Habit
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{
              background:
                COLORS.clay,
            }}
          />

          <span
            className="text-[10px]"
            style={{
              color:
                COLORS.muted,
            }}
          >
            Task
          </span>
        </div>
      </div>

      <div className="flex items-end gap-1 sm:gap-2 h-[260px]">
        {data.map(
          (month) => (
            <div
              key={month.key}
              className="flex-1 min-w-0 h-full flex flex-col justify-end"
            >
              <div className="flex items-end justify-center gap-0.5 sm:gap-1 h-[220px]">
                <div
                  className="w-full max-w-[16px] rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(
                      3,
                      month.habitPercentage *
                        2.05
                    )}px`,
                    background:
                      COLORS.teal,
                    opacity:
                      month.habitPercentage ===
                      0
                        ? 0.18
                        : 1,
                  }}
                  title={`Habit ${month.habitPercentage}%`}
                />

                <div
                  className="w-full max-w-[16px] rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(
                      3,
                      month.taskPercentage *
                        2.05
                    )}px`,
                    background:
                      COLORS.clay,
                    opacity:
                      month.taskPercentage ===
                      0
                        ? 0.18
                        : 1,
                  }}
                  title={`Task ${month.taskPercentage}%`}
                />
              </div>

              <div
                className="text-[9px] sm:text-[10px] text-center mt-2 truncate"
                style={{
                  color:
                    COLORS.muted,
                }}
              >
                {month.label}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ActivityGraph() {
  /* =======================================================
     AUTH
  ======================================================= */

  const user = useAuthStore(
    (state) => state.user
  );

  const initialized =
    useAuthStore(
      (state) =>
        state.initialized
    );

  /* =======================================================
     INITIAL DATE
  ======================================================= */

  const initialDate = useMemo(
    () => new Date(),
    []
  );

  /* =======================================================
     STATE
  ======================================================= */

  const [mode, setMode] =
    useState<ReportMode>(
      "monthly"
    );

  const [
    selectedYear,
    setSelectedYear,
  ] = useState(
    initialDate.getFullYear()
  );

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    initialDate.getMonth()
  );

  const [
    monthlyData,
    setMonthlyData,
  ] = useState<
    DailyReport[]
  >([]);

  const [
    yearlyData,
    setYearlyData,
  ] = useState<
    MonthlyReport[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const requestIdRef =
    useRef(0);

  /* =======================================================
     LOAD REPORT
  ======================================================= */

  const loadReport =
    useCallback(
      async (
        year: number,
        month: number
      ) => {
        /*
         * Auth ready না হলে Firebase
         * request করা হবে না।
         */
        if (
          !initialized ||
          !user
        ) {
          return;
        }

        const requestId =
          ++requestIdRef.current;

        try {
          setLoading(true);
          setError(null);

          /* ===============================================
             TASKS + HABITS
          =============================================== */

          const [
            taskResult,
            habitResult,
          ] = await Promise.all([
            getTasks(),
            getHabits(),
          ]);

          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          const tasks =
            Array.isArray(
              taskResult
            )
              ? (
                  taskResult as ActivityTask[]
                )
              : [];

          const habits =
            Array.isArray(
              habitResult
            )
              ? (
                  habitResult as ActivityHabit[]
                )
              : [];

          const activeHabits =
            habits.filter(
              (habit) =>
                habit.status ===
                "active"
            );

          /* ===============================================
             HABIT COMPLETIONS
          =============================================== */

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

                    if (
                      !Array.isArray(
                        result
                      )
                    ) {
                      return [];
                    }

                    /*
                     * এখানে কোনো type predicate
                     * ব্যবহার করা হচ্ছে না।
                     *
                     * তাই TS2677 হবে না।
                     */
                    return result as ActivityHabitCompletion[];
                  } catch (
                    completionError
                  ) {
                    console.error(
                      "Habit completion load failed:",
                      completionError
                    );

                    return [];
                  }
                }
              )
            );

          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          /* ===============================================
             HABITS BY DATE
          =============================================== */

          const habitByDate =
            new Map<
              string,
              number
            >();

          completionResults.forEach(
            (completions) => {
              completions.forEach(
                (completion) => {
                  if (
                    completion.completed !==
                    true
                  ) {
                    return;
                  }

                  if (
                    typeof completion.date !==
                    "string"
                  ) {
                    return;
                  }

                  if (
                    completion.date.length <
                    10
                  ) {
                    return;
                  }

                  const dateKey =
                    completion.date.slice(
                      0,
                      10
                    );

                  const current =
                    habitByDate.get(
                      dateKey
                    ) ?? 0;

                  habitByDate.set(
                    dateKey,
                    current + 1
                  );
                }
              );
            }
          );

          /* ===============================================
             TASKS BY DATE
          =============================================== */

          const completedTasksByDate =
            new Map<
              string,
              number
            >();

          const dueTasksByDate =
            new Map<
              string,
              number
            >();

          tasks.forEach(
            (task) => {
              /*
               * Completed task
               */
              if (
                task.status ===
                  "completed" &&
                typeof task.completedAt ===
                  "string" &&
                task.completedAt.length >=
                  10
              ) {
                const completedDate =
                  task.completedAt.slice(
                    0,
                    10
                  );

                const current =
                  completedTasksByDate.get(
                    completedDate
                  ) ?? 0;

                completedTasksByDate.set(
                  completedDate,
                  current + 1
                );
              }

              /*
               * Task due date
               */
              const taskDate =
                getTaskDate(task);

              if (taskDate) {
                const current =
                  dueTasksByDate.get(
                    taskDate
                  ) ?? 0;

                dueTasksByDate.set(
                  taskDate,
                  current + 1
                );
              }
            }
          );

          /* ===============================================
             MONTHLY DATA
          =============================================== */

          const daysInMonth =
            getDaysInMonth(
              year,
              month
            );

          const days: DailyReport[] =
            [];

          for (
            let day = 1;
            day <= daysInMonth;
            day++
          ) {
            const date =
              new Date(
                year,
                month,
                day
              );

            const key =
              formatDate(date);

            const completedTasks =
              completedTasksByDate.get(
                key
              ) ?? 0;

            const dueTasks =
              dueTasksByDate.get(
                key
              ) ?? 0;

            const completedHabits =
              habitByDate.get(
                key
              ) ?? 0;

            const habitPercentage =
              activeHabits.length >
              0
                ? calculatePercentage(
                    completedHabits,
                    activeHabits.length
                  )
                : 0;

            const taskPercentage =
              dueTasks > 0
                ? calculatePercentage(
                    completedTasks,
                    dueTasks
                  )
                : 0;

            days.push({
              key,
              label: String(
                day
              ),
              taskPercentage,
              habitPercentage,
            });
          }

          /* ===============================================
             YEARLY DATA
          =============================================== */

          const months: MonthlyReport[] =
            [];

          for (
            let monthIndex = 0;
            monthIndex < 12;
            monthIndex++
          ) {
            const monthStart =
              new Date(
                year,
                monthIndex,
                1
              );

            const monthEnd =
              new Date(
                year,
                monthIndex + 1,
                0
              );

            const startKey =
              formatDate(
                monthStart
              );

            const endKey =
              formatDate(
                monthEnd
              );

            const monthDays =
              daysInRange(
                startKey,
                endKey
              );

            let taskTotal = 0;
            let habitTotal = 0;

            let taskDays = 0;
            let habitDays = 0;

            monthDays.forEach(
              (dateKey) => {
                const completedTasks =
                  completedTasksByDate.get(
                    dateKey
                  ) ?? 0;

                const dueTasks =
                  dueTasksByDate.get(
                    dateKey
                  ) ?? 0;

                const completedHabits =
                  habitByDate.get(
                    dateKey
                  ) ?? 0;

                if (
                  dueTasks > 0
                ) {
                  taskTotal +=
                    calculatePercentage(
                      completedTasks,
                      dueTasks
                    );

                  taskDays++;
                }

                if (
                  activeHabits.length >
                  0
                ) {
                  habitTotal +=
                    calculatePercentage(
                      completedHabits,
                      activeHabits.length
                    );

                  habitDays++;
                }
              }
            );

            const taskPercentage =
              taskDays > 0
                ? Math.round(
                    taskTotal /
                      taskDays
                  )
                : 0;

            const habitPercentage =
              habitDays > 0
                ? Math.round(
                    habitTotal /
                      habitDays
                  )
                : 0;

            months.push({
              key:
                getMonthKey(
                  year,
                  monthIndex
                ),

              label:
                getShortMonthName(
                  monthIndex
                ),

              taskPercentage,
              habitPercentage,
            });
          }

          /* ===============================================
             LATEST REQUEST ONLY
          =============================================== */

          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          /*
           * IMPORTANT:
           * Firebase থেকে valid data আসার পরেই
           * state replace হবে।
           *
           * Loading শুরু হওয়ার সময় data clear
           * করা হচ্ছে না।
           */
          setMonthlyData(days);
          setYearlyData(months);
          setError(null);
        } catch (
          loadError
        ) {
          console.error(
            "Activity report load failed:",
            loadError
          );

          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          /*
           * Existing graph data রেখে
           * শুধু error দেখানো হবে।
           */
          setError(
            "রিপোর্টের ডাটা লোড করা যায়নি।"
          );
        } finally {
          if (
            requestId ===
            requestIdRef.current
          ) {
            setLoading(false);
          }
        }
      },
      [initialized, user]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    /*
     * Auth এখনো initialize না হলে
     * কিছু করা হবে না।
     */
    if (!initialized) {
      return;
    }

    /*
     * User না থাকলে database request নয়।
     */
    if (!user) {
      const timer = window.setTimeout(() => {
        setLoading(false);
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    }

    /*
     * Effect-এর body থেকে সরাসরি
     * async state update trigger না করে
     * browser task queue ব্যবহার করা হচ্ছে।
     */
    const timer =
      window.setTimeout(() => {
        void loadReport(
          selectedYear,
          selectedMonth
        );
      }, 0);

    return () => {
      window.clearTimeout(timer);

      /*
       * পুরোনো request invalidate।
       */
      requestIdRef.current += 1;
    };
  }, [
    initialized,
    user,
    selectedYear,
    selectedMonth,
    loadReport,
  ]);

  /* =======================================================
     UPDATE EVENTS
  ======================================================= */

  useEffect(() => {
    if (!initialized || !user) {
      return;
    }

    let timer:
      | ReturnType<
          typeof setTimeout
        >
      | null = null;

    const handleUpdate = () => {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        void loadReport(
          selectedYear,
          selectedMonth
        );
      }, 150);
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
        clearTimeout(timer);
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
    initialized,
    user,
    selectedYear,
    selectedMonth,
    loadReport,
  ]);

  /* =======================================================
     MONTH NAVIGATION
  ======================================================= */

  const goPreviousMonth =
    useCallback(() => {
      if (
        selectedMonth === 0
      ) {
        setSelectedMonth(11);

        setSelectedYear(
          (year) => year - 1
        );

        return;
      }

      setSelectedMonth(
        (month) => month - 1
      );
    }, [selectedMonth]);

  const goNextMonth =
    useCallback(() => {
      if (
        selectedMonth === 11
      ) {
        setSelectedMonth(0);

        setSelectedYear(
          (year) => year + 1
        );

        return;
      }

      setSelectedMonth(
        (month) => month + 1
      );
    }, [selectedMonth]);

  /* =======================================================
     YEAR NAVIGATION
  ======================================================= */

  const goPreviousYear =
    useCallback(() => {
      setSelectedYear(
        (year) => year - 1
      );
    }, []);

  const goNextYear =
    useCallback(() => {
      setSelectedYear(
        (year) => year + 1
      );
    }, []);

  /* =======================================================
     MONTHLY SUMMARY
  ======================================================= */

  const monthlySummary =
    useMemo(() => {
      if (
        monthlyData.length === 0
      ) {
        return {
          habit: 0,
          task: 0,
        };
      }

      const habitTotal =
        monthlyData.reduce(
          (total, item) =>
            total +
            item.habitPercentage,
          0
        );

      const taskTotal =
        monthlyData.reduce(
          (total, item) =>
            total +
            item.taskPercentage,
          0
        );

      return {
        habit: Math.round(
          habitTotal /
            monthlyData.length
        ),

        task: Math.round(
          taskTotal /
            monthlyData.length
        ),
      };
    }, [monthlyData]);

  /* =======================================================
     YEARLY SUMMARY
  ======================================================= */

  const yearlySummary =
    useMemo(() => {
      if (
        yearlyData.length === 0
      ) {
        return {
          habit: 0,
          task: 0,
        };
      }

      const habitTotal =
        yearlyData.reduce(
          (total, month) =>
            total +
            month.habitPercentage,
          0
        );

      const taskTotal =
        yearlyData.reduce(
          (total, month) =>
            total +
            month.taskPercentage,
          0
        );

      return {
        habit: Math.round(
          habitTotal /
            yearlyData.length
        ),

        task: Math.round(
          taskTotal /
            yearlyData.length
        ),
      };
    }, [yearlyData]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <DashboardCard>
      {/* HEADER */}

      <div className="flex items-start justify-between gap-3">
        <DashboardSectionTitle
          icon={TrendingUp}
          title="মাসিক ও বার্ষিক রিপোর্ট"
          subtitle={
            mode === "monthly"
              ? "দিন অনুযায়ী Habit ও Task performance"
              : "মাস অনুযায়ী পুরো বছরের performance"
          }
        />

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
              setMode("monthly")
            }
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background:
                mode === "monthly"
                  ? COLORS.card
                  : "transparent",

              color:
                mode === "monthly"
                  ? COLORS.teal
                  : COLORS.muted,
            }}
          >
            মাস
          </button>

          <button
            type="button"
            onClick={() =>
              setMode("yearly")
            }
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background:
                mode === "yearly"
                  ? COLORS.card
                  : "transparent",

              color:
                mode === "yearly"
                  ? COLORS.teal
                  : COLORS.muted,
            }}
          >
            বছর
          </button>
        </div>
      </div>

      {/* PERIOD NAVIGATION */}

      <div className="flex items-center justify-between mt-4 mb-4">
        <button
          type="button"
          onClick={
            mode === "monthly"
              ? goPreviousMonth
              : goPreviousYear
          }
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
          style={{
            background:
              COLORS.paper,
            border:
              `1px solid ${COLORS.line}`,
            color:
              COLORS.muted,
          }}
          aria-label="Previous"
        >
          <ChevronLeft
            size={16}
          />
        </button>

        <div className="text-center">
          <div
            className="text-sm font-semibold"
            style={{
              color:
                COLORS.ink,
            }}
          >
            {mode === "monthly"
              ? getMonthName(
                  selectedYear,
                  selectedMonth
                )
              : selectedYear}
          </div>

          <div
            className="text-[10px] mt-0.5"
            style={{
              color:
                COLORS.mutedSoft,
            }}
          >
            {mode === "monthly"
              ? "Monthly Report"
              : "Yearly Report"}
          </div>
        </div>

        <button
          type="button"
          onClick={
            mode === "monthly"
              ? goNextMonth
              : goNextYear
          }
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
          style={{
            background:
              COLORS.paper,
            border:
              `1px solid ${COLORS.line}`,
            color:
              COLORS.muted,
          }}
          aria-label="Next"
        >
          <ChevronRight
            size={16}
          />
        </button>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* HABIT */}

        <div
          className="rounded-xl px-3 py-3 flex items-center gap-2.5"
          style={{
            background:
              COLORS.tealSoft,
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background:
                COLORS.card,
            }}
          >
            <Flame
              size={16}
              color={
                COLORS.teal
              }
            />
          </div>

          <div>
            <div
              className="text-base font-bold"
              style={{
                color:
                  COLORS.teal,
              }}
            >
              {mode === "monthly"
                ? monthlySummary.habit
                : yearlySummary.habit}
              %
            </div>

            <div
              className="text-[10px]"
              style={{
                color:
                  COLORS.muted,
              }}
            >
              Habit Avg
            </div>
          </div>
        </div>

        {/* TASK */}

        <div
          className="rounded-xl px-3 py-3 flex items-center gap-2.5"
          style={{
            background:
              COLORS.claySoft,
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background:
                COLORS.card,
            }}
          >
            <CheckSquare
              size={16}
              color={
                COLORS.clay
              }
            />
          </div>

          <div>
            <div
              className="text-base font-bold"
              style={{
                color:
                  COLORS.clay,
              }}
            >
              {mode === "monthly"
                ? monthlySummary.task
                : yearlySummary.task}
              %
            </div>

            <div
              className="text-[10px]"
              style={{
                color:
                  COLORS.muted,
              }}
            >
              Task Avg
            </div>
          </div>
        </div>
      </div>

      {/* ERROR */}

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

      {/* CHART */}

      <div className="relative">
        {mode === "monthly" ? (
          <MonthlyLineChart
            data={monthlyData}
          />
        ) : (
          <YearBarChart
            data={yearlyData}
          />
        )}

        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none"
            style={{
              background:
                "rgba(250,245,234,0.55)",
            }}
          >
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background:
                  COLORS.card,

                border:
                  `1px solid ${COLORS.line}`,

                color:
                  COLORS.muted,

                boxShadow:
                  "0 4px 16px rgba(42,35,24,0.06)",
              }}
            >
              <Loader2
                size={15}
                className="animate-spin"
              />

              <span className="text-xs">
                আপডেট হচ্ছে...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* DESCRIPTION */}

      <div
        className="mt-3 flex items-center gap-2 text-xs"
        style={{
          color:
            COLORS.mutedSoft,
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background:
              mode === "monthly"
                ? COLORS.teal
                : COLORS.gold,
          }}
        />

        <span>
          {mode === "monthly"
            ? "প্রতিদিনের Habit ও Task completion percentage এখানে দেখা যাবে।"
            : "প্রতিটি bar সেই মাসের গড় Habit ও Task performance দেখায়।"}
        </span>
      </div>
    </DashboardCard>
  );
}