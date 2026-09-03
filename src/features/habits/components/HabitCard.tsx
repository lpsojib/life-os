"use client";

import {
  Bell,
  BellOff,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Loader2,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  Habit,
  HabitAlarm,
  HabitCompletion,
} from "../types/habit.types";

import {
  getHabitAlarm,
  saveHabitAlarmSettings,
} from "../services/habit-alarm.service";

interface HabitCardProps {
  habit: Habit;
  completions: HabitCompletion[];

  onToggle: (
    date: string,
    completed: boolean
  ) => void | Promise<void>;

  onDelete: (
    habitId: string
  ) => void | Promise<void>;
}

/* ========================================================================= */
/* DATE HELPERS                                                              */
/* ========================================================================= */

function getDateKey(date: Date): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(value: string): Date {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

function normalizeDate(date: Date): Date {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

function formatDate(value: string): string {
  return parseDate(value).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formatShortDate(value: string): string {
  return parseDate(value).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
    }
  );
}

function formatTime12Hour(time: string): string {
  if (!time) {
    return "--:--";
  }

  const [hourString, minute] =
    time.split(":");

  let hour = Number(hourString);

  const period =
    hour >= 12 ? "PM" : "AM";

  hour = hour % 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${hour}:${minute} ${period}`;
}

/* ========================================================================= */
/* CURRENT WEEK                                                             */
/* ========================================================================= */

function getCurrentWeekDays(): Date[] {
  const today = normalizeDate(
    new Date()
  );

  const day = today.getDay();

  const mondayOffset =
    day === 0 ? -6 : 1 - day;

  const monday = new Date(today);

  monday.setDate(
    today.getDate() +
      mondayOffset
  );

  return Array.from(
    { length: 7 },
    (_, index) => {
      const date = new Date(monday);

      date.setDate(
        monday.getDate() +
          index
      );

      return date;
    }
  );
}

/* ========================================================================= */
/* COMPONENT                                                                */
/* ========================================================================= */

export default function HabitCard({
  habit,
  completions,
  onToggle,
  onDelete,
}: HabitCardProps) {
  /* --------------------------------------------------------------------- */
  /* STATE                                                                 */
  /* --------------------------------------------------------------------- */

  const [expanded, setExpanded] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [savingAlarm, setSavingAlarm] =
    useState(false);

  const [
    showAlarmSettings,
    setShowAlarmSettings,
  ] = useState(false);

  const [selectedDate, setSelectedDate] =
    useState(
      getDateKey(new Date())
    );

  const [alarm, setAlarm] =
    useState<HabitAlarm>(() =>
      getHabitAlarm(habit)
    );

  /* --------------------------------------------------------------------- */
  /* DATES                                                                 */
  /* --------------------------------------------------------------------- */

  const startDate = useMemo(
    () =>
      normalizeDate(
        parseDate(habit.startDate)
      ),
    [habit.startDate]
  );

  const endDate = useMemo(
    () =>
      normalizeDate(
        parseDate(habit.endDate)
      ),
    [habit.endDate]
  );

  const today = useMemo(
    () =>
      normalizeDate(
        new Date()
      ),
    []
  );

  /* --------------------------------------------------------------------- */
  /* COMPLETION MAP                                                        */
  /* --------------------------------------------------------------------- */

  const completionMap = useMemo(() => {
    const map = new Map<
      string,
      boolean
    >();

    for (const completion of completions) {
      map.set(
        completion.date,
        completion.completed
      );
    }

    return map;
  }, [completions]);

  /* --------------------------------------------------------------------- */
  /* COMPLETED DAYS                                                        */
  /* --------------------------------------------------------------------- */

  const completedCount = useMemo(
    () =>
      completions.filter(
        (completion) =>
          completion.completed
      ).length,
    [completions]
  );

  /* --------------------------------------------------------------------- */
  /* TOTAL DAYS                                                            */
  /* --------------------------------------------------------------------- */

  const totalDays = Math.max(
    1,
    Math.ceil(
      (endDate.getTime() -
        startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  /* --------------------------------------------------------------------- */
  /* ELAPSED DAYS                                                          */
  /* --------------------------------------------------------------------- */

  const elapsedDays = Math.min(
    totalDays,
    Math.max(
      0,
      Math.floor(
        (today.getTime() -
          startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    )
  );

  /* --------------------------------------------------------------------- */
  /* REMAINING DAYS                                                        */
  /* --------------------------------------------------------------------- */

  const remainingDays = Math.max(
    0,
    totalDays - elapsedDays
  );

  /* --------------------------------------------------------------------- */
  /* TARGET                                                                 */
  /* --------------------------------------------------------------------- */

  const targetDays =
    habit.targetDays || totalDays;

  /* --------------------------------------------------------------------- */
  /* PROGRESS                                                               */
  /* --------------------------------------------------------------------- */

  const progress = Math.min(
    100,
    Math.round(
      (completedCount /
        Math.max(
          1,
          targetDays
        )) *
        100
    )
  );

  /* --------------------------------------------------------------------- */
  /* MISSED DAYS                                                            */
  /* --------------------------------------------------------------------- */

  const missedCount = Math.max(
    0,
    elapsedDays - completedCount
  );

  /* --------------------------------------------------------------------- */
  /* CURRENT STREAK                                                         */
  /* --------------------------------------------------------------------- */

  const currentStreak = useMemo(() => {
    if (today < startDate) {
      return 0;
    }

    let streak = 0;

    const date = new Date(today);

    while (
      date >= startDate &&
      date <= endDate
    ) {
      const key =
        getDateKey(date);

      const completed =
        completionMap.get(key) ===
        true;

      if (!completed) {
        break;
      }

      streak++;

      date.setDate(
        date.getDate() - 1
      );
    }

    return streak;
  }, [
    completionMap,
    today,
    startDate,
    endDate,
  ]);

  /* --------------------------------------------------------------------- */
  /* BEST STREAK                                                           */
  /* --------------------------------------------------------------------- */

  const bestStreak = useMemo(() => {
    const completedDates =
      Array.from(
        completionMap.entries()
      )
        .filter(
          ([, completed]) =>
            completed
        )
        .map(([date]) => date)
        .sort();

    if (
      completedDates.length === 0
    ) {
      return 0;
    }

    let best = 1;
    let current = 1;

    for (
      let index = 1;
      index <
      completedDates.length;
      index++
    ) {
      const previous =
        parseDate(
          completedDates[
            index - 1
          ]
        );

      const currentDate =
        parseDate(
          completedDates[index]
        );

      const difference =
        Math.round(
          (currentDate.getTime() -
            previous.getTime()) /
            (1000 * 60 * 60 * 24)
        );

      if (difference === 1) {
        current++;

        best = Math.max(
          best,
          current
        );
      } else {
        current = 1;
      }
    }

    return best;
  }, [completionMap]);

  /* --------------------------------------------------------------------- */
  /* WEEK DAYS                                                             */
  /* --------------------------------------------------------------------- */

  const weekDays = useMemo(
    () => getCurrentWeekDays(),
    []
  );

  /* --------------------------------------------------------------------- */
  /* SELECTED DATE                                                         */
  /* --------------------------------------------------------------------- */

  const selectedDateCompleted =
    completionMap.get(
      selectedDate
    ) === true;

  /* --------------------------------------------------------------------- */
  /* FINISHED                                                              */
  /* --------------------------------------------------------------------- */

  const isFinished =
    completedCount >= targetDays;

  /* --------------------------------------------------------------------- */
  /* DATE RULES                                                            */
  /* --------------------------------------------------------------------- */

  const isDateBeforeStart = (
    date: Date
  ): boolean => {
    return (
      normalizeDate(date).getTime() <
      startDate.getTime()
    );
  };

  const isDateAfterEnd = (
    date: Date
  ): boolean => {
    return (
      normalizeDate(date).getTime() >
      endDate.getTime()
    );
  };

  const isDateFuture = (
    date: Date
  ): boolean => {
    return (
      normalizeDate(date).getTime() >
      today.getTime()
    );
  };

  /* --------------------------------------------------------------------- */
  /* DATE TOGGLE                                                           */
  /* --------------------------------------------------------------------- */

  const handleDateToggle = async (
    dateKey: string
  ): Promise<void> => {
    const date = normalizeDate(
      parseDate(dateKey)
    );

    /*
     * Future date হলে কোনো কাজ হবে না।
     *
     * যেমন:
     * আজ 2 September হলে
     * 3 September / 4 September
     * click করলেও কিছু হবে না।
     */
    if (
      date.getTime() >
      today.getTime()
    ) {
      return;
    }

    /*
     * Habit শুরু হওয়ার আগের date
     * complete করা যাবে না।
     */
    if (
      date.getTime() <
      startDate.getTime()
    ) {
      return;
    }

    /*
     * Habit শেষ হওয়ার পরের date
     * complete করা যাবে না।
     */
    if (
      date.getTime() >
      endDate.getTime()
    ) {
      return;
    }

    const completed =
      completionMap.get(
        dateKey
      ) === true;

    setSelectedDate(
      dateKey
    );

    await onToggle(
      dateKey,
      !completed
    );
  };

  /* --------------------------------------------------------------------- */
  /* ALARM                                                                 */
  /* --------------------------------------------------------------------- */

  const updateAlarm = async (
    changes: Partial<HabitAlarm>
  ): Promise<void> => {
    if (savingAlarm) {
      return;
    }

    setSavingAlarm(true);

    try {
      const nextAlarm: HabitAlarm = {
        ...alarm,
        ...changes,
      };

      await saveHabitAlarmSettings(
        habit.id,
        nextAlarm
      );

      setAlarm(
        nextAlarm
      );

      window.dispatchEvent(
        new CustomEvent(
          "life-os-habit-alarm-updated",
          {
            detail: {
              habitId:
                habit.id,
              alarm:
                nextAlarm,
            },
          }
        )
      );

      window.dispatchEvent(
        new CustomEvent(
          "life-os-habit-alarm-settings-changed",
          {
            detail: {
              habitId:
                habit.id,
              alarm:
                nextAlarm,
            },
          }
        )
      );
    } catch (error) {
      console.error(
        "Failed to update habit alarm:",
        error
      );
    } finally {
      setSavingAlarm(false);
    }
  };

  /* --------------------------------------------------------------------- */
  /* DELETE                                                                */
  /* --------------------------------------------------------------------- */

  const handleDelete =
    async (): Promise<void> => {
      if (deleting) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete "${habit.name}"?`
        );

      if (!confirmed) {
        return;
      }

      setDeleting(true);

      try {
        await onDelete(
          habit.id
        );
      } catch (error) {
        console.error(
          "Failed to delete habit:",
          error
        );
      } finally {
        setDeleting(false);
      }
    };

  /* ========================================================================= */
  /* UI                                                                        */
  /* ========================================================================= */

  return (
    <article
      className={`
        group
        relative
        overflow-hidden
        rounded-[26px]
        border
        bg-white
        shadow-[0_8px_30px_rgba(15,23,42,0.06)]
        transition-all
        duration-300
        hover:shadow-[0_14px_40px_rgba(15,23,42,0.09)]
        ${
          isFinished
            ? "border-emerald-200"
            : "border-slate-200"
        }
      `}
    >

      {/* ================================================================ */}
      {/* TOP COLOR LINE                                                   */}
      {/* ================================================================ */}

      <div
        className={`
          absolute
          left-0
          top-0
          h-[3px]
          w-full
          ${
            isFinished
              ? "bg-emerald-500"
              : "bg-indigo-500"
          }
        `}
      />

      <div className="p-4 sm:p-5">

        {/* ============================================================ */}
        {/* HEADER                                                       */}
        {/* ============================================================ */}

        <div className="flex items-center justify-between gap-3">

          {/* Habit information */}
          <div className="flex min-w-0 items-center gap-3">

            <div
              className={`
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                ${
                  isFinished
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-indigo-50 text-indigo-600"
                }
              `}
            >
              {isFinished ? (
                <Check
                  size={20}
                  strokeWidth={2.5}
                />
              ) : (
                <span className="text-base font-bold">
                  {habit.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "H"}
                </span>
              )}
            </div>

            <div className="min-w-0">

              <h3 className="truncate text-[16px] font-bold text-slate-900">
                {habit.name}
              </h3>

              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">

                <Clock
                  size={13}
                />

                <span>
                  {formatTime12Hour(
                    habit.time
                  )}
                </span>

                <span className="text-slate-300">
                  •
                </span>

                <span>
                  {completedCount}/
                  {targetDays}
                </span>

              </div>

            </div>

          </div>

          {/* Header actions */}
          <div className="flex shrink-0 items-center gap-1.5">

            <button
              type="button"
              disabled={
                savingAlarm
              }
              onClick={() =>
                updateAlarm({
                  enabled:
                    !alarm.enabled,
                })
              }
              className={`
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                transition-all
                ${
                  alarm.enabled
                    ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                }
              `}
            >
              {alarm.enabled ? (
                <Bell
                  size={16}
                />
              ) : (
                <BellOff
                  size={16}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setExpanded(
                  (value) =>
                    !value
                )
              }
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-slate-50
                text-slate-500
                transition-all
                hover:bg-slate-100
              "
            >
              {expanded ? (
                <ChevronUp
                  size={17}
                />
              ) : (
                <ChevronDown
                  size={17}
                />
              )}
            </button>

          </div>

        </div>

        {/* ============================================================ */}
        {/* PROGRESS                                                      */}
        {/* ============================================================ */}

        <div className="mt-5">

          {/* Start / End */}
          <div className="mb-2.5 flex items-end justify-between">

            <div>

              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Start Date
              </p>

              <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
                {formatShortDate(
                  habit.startDate
                )}
              </p>

            </div>

            <div className="text-center">

              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Progress
              </p>

              <p
                className={`
                  mt-0.5
                  text-[12px]
                  font-bold
                  ${
                    isFinished
                      ? "text-emerald-600"
                      : "text-indigo-600"
                  }
                `}
              >
                {progress}%
              </p>

            </div>

            <div className="text-right">

              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                End Date
              </p>

              <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
                {formatShortDate(
                  habit.endDate
                )}
              </p>

            </div>

          </div>

          {/* Progress bar */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">

            <div
              className={`
                h-full
                rounded-full
                transition-all
                duration-700
                ease-out
                ${
                  isFinished
                    ? "bg-emerald-500"
                    : "bg-indigo-500"
                }
              `}
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          {/* Progress details */}
          <div className="mt-2 flex items-center justify-between">

            <span className="text-[10px] text-slate-400">
              {completedCount} completed
            </span>

            <span className="text-[10px] font-medium text-slate-400">
              {elapsedDays}/{totalDays} days
            </span>

            <span className="text-[10px] text-slate-400">
              {remainingDays > 0
                ? `${remainingDays} left`
                : "Finished"}
            </span>

          </div>

        </div>

        {/* ============================================================ */}
        {/* EXPANDED                                                      */}
        {/* ============================================================ */}

        {expanded && (
          <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">

            {/* ======================================================== */}
            {/* WEEKLY DATE TRACKER                                      */}
            {/* ======================================================== */}

            <div>

              <div className="mb-3 flex items-center justify-between">

                <div>

                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700">
                    Daily Progress
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Complete your habit one day at a time
                  </p>

                </div>

                <div className="rounded-full bg-slate-100 px-2.5 py-1">

                  <span className="text-[9px] font-semibold text-slate-500">
                    This Week
                  </span>

                </div>

              </div>

              {/* Seven days */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">

                {weekDays.map(
                  (date) => {

                    const key =
                      getDateKey(
                        date
                      );

                    const completed =
                      completionMap.get(
                        key
                      ) === true;

                    const isToday =
                      key ===
                      getDateKey(
                        today
                      );

                    const isSelected =
                      key ===
                      selectedDate;

                    const beforeStart =
                      isDateBeforeStart(
                        date
                      );

                    const afterEnd =
                      isDateAfterEnd(
                        date
                      );

                    const future =
                      isDateFuture(
                        date
                      );

                    const disabled =
                      beforeStart ||
                      afterEnd ||
                      future;

                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={
                          disabled
                        }
                        onClick={() => {

                          /*
                           * Future date:
                           * click করলে কিছুই হবে না।
                           */
                          if (
                            future
                          ) {
                            return;
                          }

                          if (
                            disabled
                          ) {
                            return;
                          }

                          handleDateToggle(
                            key
                          );
                        }}
                        className={`
                          relative
                          min-w-0
                          rounded-2xl
                          border
                          px-1
                          py-2.5
                          transition-all
                          duration-200

                          ${
                            disabled
                              ? `
                                cursor-not-allowed
                                border-slate-100
                                bg-slate-50
                                opacity-50
                              `
                              : completed
                              ? `
                                border-emerald-200
                                bg-emerald-50
                                shadow-sm
                              `
                              : isToday
                              ? `
                                border-indigo-300
                                bg-indigo-50
                                shadow-sm
                              `
                              : isSelected
                              ? `
                                border-indigo-200
                                bg-indigo-50/60
                              `
                              : `
                                border-slate-100
                                bg-white
                                hover:border-indigo-200
                                hover:bg-indigo-50/40
                              `
                          }
                        `}
                      >

                        {/* Today badge */}
                        {isToday &&
                          !disabled && (
                            <span
                              className="
                                absolute
                                left-1/2
                                top-1
                                -translate-x-1/2
                                rounded-full
                                bg-indigo-500
                                px-1.5
                                py-[1px]
                                text-[6px]
                                font-bold
                                uppercase
                                tracking-wider
                                text-white
                              "
                            >
                              Today
                            </span>
                          )}

                        {/* Day */}
                        <span
                          className={`
                            block
                            text-center
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-wide
                            ${
                              disabled
                                ? "text-slate-300"
                                : completed
                                ? "text-emerald-600"
                                : isToday
                                ? "text-indigo-600"
                                : "text-slate-400"
                            }
                          `}
                        >
                          {date.toLocaleDateString(
                            undefined,
                            {
                              weekday:
                                "short",
                            }
                          )}
                        </span>

                        {/* Date number */}
                        <div className="mt-2 flex justify-center">

                          <div
                            className={`
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              text-[11px]
                              font-bold
                              transition-all

                              ${
                                completed
                                  ? `
                                    bg-emerald-500
                                    text-white
                                    shadow-sm
                                  `
                                  : disabled
                                  ? `
                                    bg-slate-100
                                    text-slate-300
                                  `
                                  : isToday
                                  ? `
                                    bg-indigo-500
                                    text-white
                                    shadow-sm
                                  `
                                  : isSelected
                                  ? `
                                    bg-indigo-100
                                    text-indigo-600
                                  `
                                  : `
                                    bg-slate-100
                                    text-slate-600
                                  `
                              }
                            `}
                          >
                            {completed ? (
                              <Check
                                size={14}
                                strokeWidth={3}
                              />
                            ) : (
                              date.getDate()
                            )}
                          </div>

                        </div>

                        {/* Status */}
                        <div className="mt-1.5 flex justify-center">

                          {completed ? (

                            <span
                              className="
                                text-[7px]
                                font-bold
                                uppercase
                                tracking-wide
                                text-emerald-500
                              "
                            >
                              Done
                            </span>

                          ) : future ? (

                            <span
                              className="
                                text-[7px]
                                font-semibold
                                uppercase
                                tracking-wide
                                text-slate-300
                              "
                            >
                              Locked
                            </span>

                          ) : isToday ? (

                            <span
                              className="
                                text-[7px]
                                font-bold
                                uppercase
                                tracking-wide
                                text-indigo-500
                              "
                            >
                              Today
                            </span>

                          ) : (

                            <span
                              className="
                                text-[7px]
                                font-medium
                                uppercase
                                tracking-wide
                                text-slate-300
                              "
                            >
                              Open
                            </span>

                          )}

                        </div>

                      </button>
                    );
                  }
                )}

              </div>

              {/* Legend */}
              <div className="mt-3 flex items-center justify-center gap-4">

                <div className="flex items-center gap-1.5">

                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  <span className="text-[9px] text-slate-400">
                    Completed
                  </span>

                </div>

                <div className="flex items-center gap-1.5">

                  <span className="h-2 w-2 rounded-full bg-indigo-500" />

                  <span className="text-[9px] text-slate-400">
                    Today
                  </span>

                </div>

                <div className="flex items-center gap-1.5">

                  <span className="h-2 w-2 rounded-full bg-slate-200" />

                  <span className="text-[9px] text-slate-400">
                    Future
                  </span>

                </div>

              </div>

            </div>

            {/* ======================================================== */}
            {/* SELECTED DATE                                            */}
            {/* ======================================================== */}

            <div
              className={`
                flex
                items-center
                justify-between
                rounded-2xl
                px-4
                py-3.5
                ${
                  selectedDateCompleted
                    ? "bg-emerald-50"
                    : "bg-slate-50"
                }
              `}
            >

              <div
                className={`
                  flex
                  items-center
                  gap-2.5
                  ${
                    selectedDateCompleted
                      ? "text-emerald-600"
                      : "text-slate-500"
                  }
                `}
              >

                {selectedDateCompleted ? (
                  <Check
                    size={15}
                  />
                ) : (
                  <CalendarDays
                    size={15}
                  />
                )}

                <div>

                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Selected Date
                  </p>

                  <p className="mt-0.5 text-xs font-semibold">
                    {formatDate(
                      selectedDate
                    )}
                  </p>

                </div>

              </div>

              <span
                className={`
                  rounded-full
                  px-2.5
                  py-1
                  text-[9px]
                  font-bold
                  ${
                    selectedDateCompleted
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-white text-slate-400"
                  }
                `}
              >
                {selectedDateCompleted
                  ? "Completed"
                  : "Not Completed"}
              </span>

            </div>

            {/* ======================================================== */}
            {/* STATS                                                     */}
            {/* ======================================================== */}

            <div className="grid grid-cols-3 gap-2">

              {/* Completed */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Check
                    size={14}
                  />
                </div>

                <p className="mt-2 text-[10px] text-slate-500">
                  Completed
                </p>

                <p className="mt-0.5 text-xl font-bold text-emerald-600">
                  {completedCount}
                </p>

                <p className="text-[9px] text-slate-400">
                  days
                </p>

              </div>

              {/* Missed */}
              <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-500">
                  <X
                    size={14}
                  />
                </div>

                <p className="mt-2 text-[10px] text-slate-500">
                  Missed
                </p>

                <p className="mt-0.5 text-xl font-bold text-rose-500">
                  {missedCount}
                </p>

                <p className="text-[9px] text-slate-400">
                  days
                </p>

              </div>

              {/* Streak */}
              <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                  <Flame
                    size={14}
                  />
                </div>

                <p className="mt-2 text-[10px] text-slate-500">
                  Streak
                </p>

                <p className="mt-0.5 text-xl font-bold text-orange-500">
                  {currentStreak}
                </p>

                <p className="text-[9px] text-slate-400">
                  days
                </p>

              </div>

            </div>

            {/* ======================================================== */}
            {/* PERIOD INFORMATION                                        */}
            {/* ======================================================== */}

            <div className="grid grid-cols-2 gap-2">

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">

                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Current Day
                </p>

                <p className="mt-1.5 text-sm font-bold text-slate-700">
                  Day {elapsedDays}
                  <span className="font-normal text-slate-400">
                    {" "}
                    / {totalDays}
                  </span>
                </p>

              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 text-right">

                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Remaining
                </p>

                <p className="mt-1.5 text-sm font-bold text-indigo-600">
                  {remainingDays > 0
                    ? `${remainingDays} days`
                    : "Finished"}
                </p>

              </div>

            </div>

            {/* ======================================================== */}
            {/* BEST STREAK                                               */}
            {/* ======================================================== */}

            <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3.5">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                  <Flame
                    size={17}
                  />
                </div>

                <div>

                  <p className="text-xs font-semibold text-slate-700">
                    Best Streak
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Longest consecutive run
                  </p>

                </div>

              </div>

              <p className="text-lg font-bold text-orange-500">
                {bestStreak}

                <span className="ml-1 text-[10px] font-medium text-slate-400">
                  days
                </span>
              </p>

            </div>

            {/* ======================================================== */}
            {/* ALARM                                                      */}
            {/* ======================================================== */}

            <div
              className={`
                rounded-2xl
                border
                p-4
                ${
                  alarm.enabled
                    ? "border-indigo-100 bg-indigo-50/50"
                    : "border-slate-200 bg-slate-50"
                }
              `}
            >

              {/* Alarm Header */}
              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div
                    className={`
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      ${
                        alarm.enabled
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-slate-200 text-slate-400"
                      }
                    `}
                  >
                    {alarm.enabled ? (
                      <Bell
                        size={18}
                      />
                    ) : (
                      <BellOff
                        size={18}
                      />
                    )}
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-slate-800">
                      Habit Alarm
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {alarm.enabled
                        ? `Rings at ${formatTime12Hour(
                            habit.time
                          )}`
                        : "Alarm disabled"}
                    </p>

                  </div>

                </div>

                {/* Alarm Toggle */}
                <button
                  type="button"
                  disabled={
                    savingAlarm
                  }
                  onClick={() =>
                    updateAlarm({
                      enabled:
                        !alarm.enabled,
                    })
                  }
                  className={`
                    relative
                    h-6
                    w-11
                    rounded-full
                    transition-colors
                    ${
                      alarm.enabled
                        ? "bg-indigo-500"
                        : "bg-slate-300"
                    }
                  `}
                >

                  <span
                    className={`
                      absolute
                      top-1
                      h-4
                      w-4
                      rounded-full
                      bg-white
                      shadow
                      transition-all
                      ${
                        alarm.enabled
                          ? "left-6"
                          : "left-1"
                      }
                    `}
                  />

                </button>

              </div>

              {/* Quick controls */}
              {alarm.enabled && (
                <div className="mt-4 grid grid-cols-2 gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      updateAlarm({
                        sound:
                          alarm.sound ===
                          "default"
                            ? "alarm"
                            : "default",
                      })
                    }
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      bg-white
                      px-3
                      py-2.5
                      text-xs
                      text-slate-600
                      shadow-sm
                    "
                  >

                    {alarm.sound ===
                    "default" ? (
                      <VolumeX
                        size={14}
                      />
                    ) : (
                      <Volume2
                        size={14}
                      />
                    )}

                    Sound

                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateAlarm({
                        vibration:
                          !alarm.vibration,
                      })
                    }
                    className="
                      rounded-xl
                      bg-white
                      px-3
                      py-2.5
                      text-left
                      text-xs
                      text-slate-600
                      shadow-sm
                    "
                  >
                    Vibration:{" "}
                    {alarm.vibration
                      ? "On"
                      : "Off"}
                  </button>

                </div>
              )}

              {/* Advanced Settings */}
              <button
                type="button"
                onClick={() =>
                  setShowAlarmSettings(
                    (value) =>
                      !value
                  )
                }
                className="
                  mt-3
                  text-xs
                  font-semibold
                  text-indigo-600
                  hover:text-indigo-700
                "
              >
                {showAlarmSettings
                  ? "Hide advanced settings"
                  : "Advanced alarm settings"}
              </button>

              {showAlarmSettings && (
                <div className="mt-4 space-y-3">

                  {/* Sound */}
                  <div>

                    <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                      Sound
                    </label>

                    <select
                      value={
                        alarm.sound
                      }
                      onChange={(
                        event
                      ) =>
                        updateAlarm({
                          sound:
                            event.target
                              .value as HabitAlarm["sound"],
                        })
                      }
                      className="
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-3
                        py-2.5
                        text-sm
                        outline-none
                        focus:border-indigo-300
                        focus:ring-2
                        focus:ring-indigo-100
                      "
                    >

                      <option value="default">
                        Default
                      </option>

                      <option value="alarm">
                        Alarm
                      </option>

                      <option value="bell">
                        Bell
                      </option>

                      <option value="chime">
                        Chime
                      </option>

                      <option value="digital">
                        Digital
                      </option>

                    </select>

                  </div>

                  {/* Repeat */}
                  <div>

                    <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                      Repeat
                    </label>

                    <select
                      value={
                        alarm.repeat
                      }
                      onChange={(
                        event
                      ) =>
                        updateAlarm({
                          repeat:
                            event.target
                              .value as HabitAlarm["repeat"],
                        })
                      }
                      className="
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-3
                        py-2.5
                        text-sm
                        outline-none
                        focus:border-indigo-300
                        focus:ring-2
                        focus:ring-indigo-100
                      "
                    >

                      <option value="none">
                        None
                      </option>

                      <option value="daily">
                        Daily
                      </option>

                      <option value="weekdays">
                        Weekdays
                      </option>

                      <option value="weekly">
                        Weekly
                      </option>

                    </select>

                  </div>

                  {/* Snooze */}
                  <div>

                    <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                      Snooze
                    </label>

                    <select
                      value={
                        alarm.snoozeMinutes
                      }
                      onChange={(
                        event
                      ) =>
                        updateAlarm({
                          snoozeMinutes:
                            Number(
                              event
                                .target
                                .value
                            ),
                        })
                      }
                      className="
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-3
                        py-2.5
                        text-sm
                        outline-none
                        focus:border-indigo-300
                        focus:ring-2
                        focus:ring-indigo-100
                      "
                    >

                      <option value={0}>
                        No snooze
                      </option>

                      <option value={1}>
                        1 minute
                      </option>

                      <option value={5}>
                        5 minutes
                      </option>

                      <option value={10}>
                        10 minutes
                      </option>

                      <option value={15}>
                        15 minutes
                      </option>

                      <option value={30}>
                        30 minutes
                      </option>

                    </select>

                  </div>

                </div>
              )}

            </div>

            {/* ======================================================== */}
            {/* DELETE                                                     */}
            {/* ======================================================== */}

            <div className="border-t border-slate-100 pt-4">

              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={
                  handleDelete
                }
                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-red-100
                  bg-red-50
                  px-4
                  py-3
                  text-xs
                  font-bold
                  text-red-600
                  transition-all
                  hover:border-red-200
                  hover:bg-red-100
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                {deleting ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2
                    size={15}
                  />
                )}

                Delete Habit

              </button>

            </div>

          </div>
        )}

      </div>
    </article>
  );
}