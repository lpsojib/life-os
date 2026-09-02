"use client";

import {
  Bell,
  BellOff,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Loader2,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
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

/* =========================================================
   DATE HELPERS
========================================================= */

const getDateKey = (
  date: Date
): string => {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDate = (
  dateString: string
): Date => {
  const [
    year,
    month,
    day,
  ] = dateString
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
};

const getCurrentWeekDays =
  (): Date[] => {
    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const day =
      today.getDay();

    const saturdayOffset =
      day === 6
        ? 0
        : day + 1;

    const saturday =
      new Date(today);

    saturday.setDate(
      today.getDate() -
        saturdayOffset
    );

    return Array.from(
      {
        length: 7,
      },
      (_, index) => {
        const date =
          new Date(
            saturday
          );

        date.setDate(
          saturday.getDate() +
            index
        );

        return date;
      }
    );
  };

const formatTime12Hour =
  (
    time: string
  ): string => {
    const [
      hourString,
      minute,
    ] = time.split(":");

    let hour =
      Number(hourString);

    const period =
      hour >= 12
        ? "PM"
        : "AM";

    hour =
      hour % 12 || 12;

    return `${hour}:${minute} ${period}`;
  };

const formatDate =
  (
    dateString: string
  ): string => {
    const date =
      parseDate(
        dateString
      );

    return date.toLocaleDateString(
      "bn-BD",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  };

/* =========================================================
   COMPONENT
========================================================= */

export default function HabitCard({
  habit,
  completions,
  onToggle,
  onDelete,
}: HabitCardProps) {
  const [expanded, setExpanded] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [alarm, setAlarm] =
    useState<HabitAlarm>(
      () =>
        getHabitAlarm(
          habit
        )
    );

  const [savingAlarm, setSavingAlarm] =
    useState(false);

  const [showAlarmSettings, setShowAlarmSettings] =
    useState(false);

  /* =======================================================
     COMPLETION DATA
  ======================================================= */

  const completionMap =
    useMemo(() => {
      const map =
        new Map<
          string,
          boolean
        >();

      completions.forEach(
        (completion) => {
          map.set(
            completion.date,
            completion.completed
          );
        }
      );

      return map;
    }, [completions]);

  const completedCount =
    useMemo(
      () =>
        completions.filter(
          (completion) =>
            completion.completed
        ).length,
      [completions]
    );

  /* =======================================================
     DATE / PROGRESS
  ======================================================= */

  const startDate =
    parseDate(
      habit.startDate
    );

  const endDate =
    parseDate(
      habit.endDate
    );

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const elapsedDays =
    Math.max(
      1,
      Math.min(
        habit.targetDays,
        Math.floor(
          (
            today.getTime() -
            startDate.getTime()
          ) /
            (24 *
              60 *
              60 *
              1000)
        ) + 1
      )
    );

  const missedCount =
    Math.max(
      0,
      elapsedDays -
        completedCount
    );

  const progress =
    habit.targetDays > 0
      ? Math.min(
          100,
          Math.round(
            (completedCount /
              habit.targetDays) *
              100
          )
        )
      : 0;

  /* =======================================================
     STREAK
  ======================================================= */

  const currentStreak =
    useMemo(() => {
      let streak = 0;

      const cursor =
        new Date();

      cursor.setHours(
        0,
        0,
        0,
        0
      );

      while (true) {
        const key =
          getDateKey(
            cursor
          );

        if (
          completionMap.get(
            key
          )
        ) {
          streak++;

          cursor.setDate(
            cursor.getDate() - 1
          );
        } else {
          break;
        }
      }

      return streak;
    }, [completionMap]);

  /* =======================================================
     WEEK
  ======================================================= */

  const weekDays =
    getCurrentWeekDays();

  const weekLabels = [
    "শনি",
    "রবি",
    "সোম",
    "মঙ্গল",
    "বুধ",
    "বৃহস্পতি",
    "শুক্র",
  ];

  /* =======================================================
     ALARM SETTINGS
  ======================================================= */

  const updateAlarm =
    async (
      changes: Partial<HabitAlarm>
    ) => {
      setSavingAlarm(true);

      try {
        const nextAlarm: HabitAlarm = {
          ...alarm,
          ...changes,
        };

        setAlarm(
          nextAlarm
        );

        saveHabitAlarmSettings(
          habit.id,
          changes
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
      } catch (error) {
        console.error(
          "Alarm settings error:",
          error
        );
      } finally {
        setSavingAlarm(false);
      }
    };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete =
    async () => {
      const confirmed =
        window.confirm(
          `“${habit.name}” অভ্যাসটি delete করতে চান?`
        );

      if (!confirmed) {
        return;
      }

      setDeleting(true);

      try {
        await onDelete(
          habit.id
        );
      } catch {
        setDeleting(false);
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-gray-900 sm:text-lg">
              {habit.name}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-600">
                <Clock
                  size={14}
                />

                {formatTime12Hour(
                  habit.time
                )}
              </span>

              <span
                className={
                  alarm.enabled
                    ? "inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-green-600"
                    : "inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-500"
                }
              >
                {alarm.enabled ? (
                  <Bell
                    size={14}
                  />
                ) : (
                  <BellOff
                    size={14}
                  />
                )}

                {alarm.enabled
                  ? "Alarm On"
                  : "Alarm Off"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setExpanded(
                (value) =>
                  !value
              )
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-gray-500 transition hover:bg-gray-50"
            aria-label="Expand habit"
          >
            {expanded ? (
              <ChevronUp
                size={18}
              />
            ) : (
              <ChevronDown
                size={18}
              />
            )}
          </button>
        </div>

        {/* =================================================
            PROGRESS
        ================================================= */}

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>
              Progress
            </span>

            <span>
              {completedCount}/
              {habit.targetDays}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* =================================================
            ALARM BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={() =>
            setShowAlarmSettings(
              (value) =>
                !value
            )
          }
          className="mt-4 flex w-full items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-3 py-3 text-left transition hover:bg-orange-100"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-orange-700">
            {alarm.enabled ? (
              <Bell
                size={18}
              />
            ) : (
              <BellOff
                size={18}
              />
            )}

            Alarm Settings
          </span>

          {showAlarmSettings ? (
            <ChevronUp
              size={18}
              className="text-orange-600"
            />
          ) : (
            <ChevronDown
              size={18}
              className="text-orange-600"
            />
          )}
        </button>

        {/* =================================================
            ALARM SETTINGS
        ================================================= */}

        {showAlarmSettings && (
          <div className="mt-3 rounded-2xl border bg-gray-50 p-4">
            <div className="space-y-4">
              {/* ON / OFF */}

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Habit Alarm
                  </p>

                  <p className="text-xs text-gray-500">
                    সময়:{" "}
                    {formatTime12Hour(
                      habit.time
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={savingAlarm}
                  onClick={() =>
                    void updateAlarm(
                      {
                        enabled:
                          !alarm.enabled,
                      }
                    )
                  }
                  className={
                    alarm.enabled
                      ? "relative h-7 w-12 rounded-full bg-green-500 transition"
                      : "relative h-7 w-12 rounded-full bg-gray-300 transition"
                  }
                  aria-label="Toggle alarm"
                >
                  <span
                    className={
                      alarm.enabled
                        ? "absolute right-1 top-1 h-5 w-5 rounded-full bg-white shadow"
                        : "absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow"
                    }
                  />
                </button>
              </div>

              {/* SOUND */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center gap-2">
                    <Volume2
                      size={16}
                    />
                    Alarm Sound
                  </span>
                </label>

                <select
                  value={alarm.sound}
                  disabled={
                    savingAlarm ||
                    !alarm.enabled
                  }
                  onChange={(event) =>
                    void updateAlarm(
                      {
                        sound:
                          event.target
                            .value as HabitAlarm["sound"],
                      }
                    )
                  }
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
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

              {/* REPEAT */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Repeat
                </label>

                <select
                  value={alarm.repeat}
                  disabled={
                    savingAlarm ||
                    !alarm.enabled
                  }
                  onChange={(event) =>
                    void updateAlarm(
                      {
                        repeat:
                          event.target
                            .value as HabitAlarm["repeat"],
                      }
                    )
                  }
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                >
                  <option value="none">
                    একবার
                  </option>

                  <option value="daily">
                    প্রতিদিন
                  </option>

                  <option value="weekdays">
                    Weekdays
                  </option>

                  <option value="weekly">
                    Weekly
                  </option>
                </select>
              </div>

              {/* SNOOZE */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Snooze
                </label>

                <select
                  value={
                    alarm.snoozeMinutes
                  }
                  disabled={
                    savingAlarm ||
                    !alarm.enabled
                  }
                  onChange={(event) =>
                    void updateAlarm(
                      {
                        snoozeMinutes:
                          Number(
                            event.target
                              .value
                          ),
                      }
                    )
                  }
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                >
                  <option value={1}>
                    1 মিনিট
                  </option>

                  <option value={5}>
                    5 মিনিট
                  </option>

                  <option value={10}>
                    10 মিনিট
                  </option>

                  <option value={15}>
                    15 মিনিট
                  </option>

                  <option value={30}>
                    30 মিনিট
                  </option>
                </select>
              </div>

              {/* VIBRATION */}

              <button
                type="button"
                disabled={
                  savingAlarm ||
                  !alarm.enabled
                }
                onClick={() =>
                  void updateAlarm(
                    {
                      vibration:
                        !alarm.vibration,
                    }
                  )
                }
                className="flex w-full items-center justify-between rounded-xl border bg-white px-3 py-3"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">
                    Vibration
                  </p>

                  <p className="text-xs text-gray-500">
                    Alarm বাজলে vibration হবে
                  </p>
                </div>

                <span
                  className={
                    alarm.vibration
                      ? "flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-600"
                      : "flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400"
                  }
                >
                  {alarm.vibration ? (
                    <Check
                      size={16}
                    />
                  ) : (
                    <VolumeX
                      size={16}
                    />
                  )}
                </span>
              </button>

              {savingAlarm && (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />

                  Saving...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================
          EXPANDED DETAILS
      =================================================== */}

      {expanded && (
        <div className="border-t bg-gray-50 p-4 sm:p-5">
          {/* DATE */}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-gray-500">
                Start Date
              </p>

              <p className="mt-1 text-sm font-medium text-gray-800">
                {formatDate(
                  habit.startDate
                )}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-gray-500">
                End Date
              </p>

              <p className="mt-1 text-sm font-medium text-gray-800">
                {formatDate(
                  habit.endDate
                )}
              </p>
            </div>
          </div>

          {/* WEEKLY TRACKER */}

          <div className="mt-4 rounded-xl border bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-gray-800">
              এই সপ্তাহ
            </p>

            <div className="grid grid-cols-7 gap-1.5">
              {weekDays.map(
                (
                  date,
                  index
                ) => {
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

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        void onToggle(
                          key,
                          !completed
                        )
                      }
                      className="flex flex-col items-center gap-1"
                    >
                      <span className="text-[10px] text-gray-500">
                        {
                          weekLabels[
                            index
                          ]
                        }
                      </span>

                      <span
                        className={
                          completed
                            ? "flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white"
                            : isToday
                              ? "flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-400 bg-blue-50 text-blue-600"
                              : "flex h-8 w-8 items-center justify-center rounded-full border bg-gray-50 text-gray-400"
                        }
                      >
                        {completed ? (
                          <Check
                            size={15}
                          />
                        ) : (
                          date.getDate()
                        )}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* STATS */}

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border bg-white p-3 text-center">
              <p className="text-xs text-gray-500">
                Complete
              </p>

              <p className="mt-1 text-lg font-bold text-green-600">
                {completedCount}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-3 text-center">
              <p className="text-xs text-gray-500">
                Missed
              </p>

              <p className="mt-1 text-lg font-bold text-red-500">
                {missedCount}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-3 text-center">
              <p className="text-xs text-gray-500">
                Streak
              </p>

              <p className="mt-1 flex items-center justify-center gap-1 text-lg font-bold text-orange-500">
                <Flame
                  size={17}
                />

                {currentStreak}
              </p>
            </div>
          </div>

          {/* DELETE */}

          <button
            type="button"
            disabled={deleting}
            onClick={() =>
              void handleDelete()
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Trash2
                size={17}
              />
            )}

            {deleting
              ? "Deleting..."
              : "Delete Habit"}
          </button>
        </div>
      )}
    </div>
  );
}