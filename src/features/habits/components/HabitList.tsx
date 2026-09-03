"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BellRing,
  Clock,
  Moon,
  Volume2,
  X,
} from "lucide-react";

import {
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

import {
  completeHabit,
  deleteHabit,
  getHabitCompletions,
  getHabits,
  refreshHabitCompletionsFromFirebase,
  refreshHabitsFromFirebase,
  syncPendingHabits,
  toggleHabitCompletion,
} from "../services/habit.service";

import {
  notifyHabitIfNeeded,
} from "../services/habit.notification";

import {
  setAlarmHabits,
  startHabitAlarmRunner,
  stopHabitAlarmRunner,
  unlockAlarmAudio,
  stopHabitAlarm,
  snoozeHabitAlarm,
} from "../services/habit-alarm.service";

import type {
  Habit,
  HabitAlarm,
  HabitCompletion,
} from "../types/habit.types";

import HabitCard from "./HabitCard";

interface HabitWithCompletions {
  habit: Habit;
  completions: HabitCompletion[];
}

interface HabitListProps {
  refreshKey?: number;
}

interface AlarmEventDetail {
  habit: Habit;
  alarm?: HabitAlarm;
  triggeredAt?: string;
}

/* =========================================================
   DATE HELPERS
========================================================= */

const parseDate = (
  dateString: string
): Date => {
  if (!dateString) {
    return new Date(NaN);
  }

  const [
    year,
    month,
    day,
  ] = dateString
    .split("-")
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return new Date(NaN);
  }

  return new Date(
    year,
    month - 1,
    day
  );
};

const getToday = (): Date => {
  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  return today;
};

/* =========================================================
   TIME FORMAT
========================================================= */

const formatAlarmTime = (
  time: string
): string => {
  if (!time) {
    return "";
  }

  const [
    hourString,
    minute,
  ] = time.split(":");

  const hour =
    Number(hourString);

  if (
    Number.isNaN(hour) ||
    !minute
  ) {
    return time;
  }

  const period =
    hour >= 12
      ? "PM"
      : "AM";

  const hour12 =
    hour % 12 || 12;

  return `${hour12}:${minute} ${period}`;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function HabitList({
  refreshKey = 0,
}: HabitListProps) {
  const [items, setItems] =
    useState<
      HabitWithCompletions[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [ringingAlarm, setRingingAlarm] =
    useState<AlarmEventDetail | null>(
      null
    );

  /*
   * Prevent multiple simultaneous loads.
   */
  const loadingRef =
    useRef(false);

  /*
   * Track current authenticated user.
   */
  const currentUserIdRef =
    useRef<string | null>(
      null
    );

  /* =======================================================
     LOAD LOCAL HABITS
  ======================================================= */

  const loadHabits =
    useCallback(
      async (
        showLoading = false
      ) => {
        /*
         * Do not start duplicate local loads.
         */
        if (
          loadingRef.current
        ) {
          return;
        }

        loadingRef.current = true;

        try {
          if (
            showLoading
          ) {
            setLoading(true);
          }

          setError("");

          const habits =
            await getHabits();

          const habitsWithCompletions =
            await Promise.all(
              habits.map(
                async (
                  habit
                ) => {
                  try {
                    const completions =
                      await getHabitCompletions(
                        habit.id
                      );

                    return {
                      habit,
                      completions,
                    };
                  } catch (
                    completionError
                  ) {
                    console.error(
                      `Failed to load completions for habit ${habit.id}:`,
                      completionError
                    );

                    return {
                      habit,
                      completions:
                        [],
                    };
                  }
                }
              )
            );

          const today =
            getToday();

          const activeItems:
            HabitWithCompletions[] =
            [];

          for (
            const item of
              habitsWithCompletions
          ) {
            const endDate =
              parseDate(
                item.habit.endDate
              );

            /*
             * Keep the habit visible ON the end date.
             * Only remove/complete it after the end date.
             */
            if (
              !Number.isNaN(
                endDate.getTime()
              ) &&
              today >
                endDate
            ) {
              void completeHabit(
                item.habit.id
              ).catch(
                (
                  completeError
                ) => {
                  console.error(
                    "Auto complete habit error:",
                    completeError
                  );
                }
              );

              continue;
            }

            activeItems.push(
              item
            );
          }

          setItems(
            activeItems
          );

          /*
           * Update alarm runner immediately
           * using local data.
           */
          setAlarmHabits(
            activeItems.map(
              (
                item
              ) =>
                item.habit
            )
          );

          /*
           * Notification check.
           */
          for (
            const item of
              activeItems
          ) {
            try {
              notifyHabitIfNeeded(
                item.habit
              );
            } catch (
              notificationError
            ) {
              console.error(
                "Habit notification error:",
                notificationError
              );
            }
          }
        } catch (
          loadError
        ) {
          console.error(
            "Load habits error:",
            loadError
          );

          /*
           * Only show error if there is
           * actually no local data.
           */
          setError(
            "অভ্যাসগুলো লোড করা যায়নি।"
          );
        } finally {
          loadingRef.current =
            false;

          if (
            showLoading
          ) {
            setLoading(false);
          }
        }
      },
      []
    );

  /* =======================================================
     FIREBASE BACKGROUND REFRESH
  ======================================================= */

  const refreshFromFirebase =
    useCallback(
      async () => {
        if (
          typeof window ===
          "undefined"
        ) {
          return;
        }

        if (
          !navigator.onLine
        ) {
          return;
        }

        if (
          !auth.currentUser
        ) {
          return;
        }

        try {
          /*
           * First push pending offline changes.
           */
          await syncPendingHabits();

          /*
           * Pull latest habits.
           */
          await refreshHabitsFromFirebase();

          const latestHabits =
            await getHabits();

          /*
           * Pull completions.
           */
          await Promise.all(
            latestHabits.map(
              (
                habit
              ) =>
                refreshHabitCompletionsFromFirebase(
                  habit.id
                )
            )
          );

          /*
           * Reload local data after Firebase sync.
           */
          await loadHabits(
            false
          );
        } catch (
          refreshError
        ) {
          /*
           * Background Firebase error should NOT
           * destroy working offline/local UI.
           */
          console.error(
            "Background habit refresh error:",
            refreshError
          );
        }
      },
      [loadHabits]
    );

  /* =======================================================
     AUTHENTICATION
  ======================================================= */

  useEffect(() => {
    let disposed = false;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          if (
            disposed
          ) {
            return;
          }

          /*
           * No user.
           */
          if (!user) {
            currentUserIdRef.current =
              null;

            setItems([]);

            setAlarmHabits([]);

            stopHabitAlarmRunner();

            setLoading(false);

            setError(
              "অভ্যাস দেখতে আগে লগইন করুন।"
            );

            return;
          }

          /*
           * New user detected.
           */
          const userChanged =
            currentUserIdRef.current !==
            user.uid;

          currentUserIdRef.current =
            user.uid;

          setError("");

          /*
           * If user changed, clear old UI first.
           * Then load this user's local data.
           */
          if (
            userChanged
          ) {
            setItems([]);
          }

          void loadHabits(
            true
          );

          /*
           * Firebase runs in background.
           */
          void refreshFromFirebase();
        }
      );

    return () => {
      disposed = true;

      unsubscribe();

      stopHabitAlarmRunner();
    };
  }, [
    loadHabits,
    refreshFromFirebase,
    refreshKey,
  ]);

  /* =======================================================
     HABIT ALARM RUNNER
  ======================================================= */

  useEffect(() => {
    /*
     * Runner itself checks the current alarm list.
     * Actual habits are supplied through setAlarmHabits().
     */
    startHabitAlarmRunner([]);

    return () => {
      stopHabitAlarmRunner();
    };
  }, []);

  /* =======================================================
     UPDATE ALARM HABITS
  ======================================================= */

  useEffect(() => {
    const habits =
      items.map(
        (
          item
        ) =>
          item.habit
      );

    setAlarmHabits(
      habits
    );
  }, [items]);

  /* =======================================================
     ALARM EVENT
  ======================================================= */

  useEffect(() => {
    const handleAlarm =
      (
        event: Event
      ) => {
        const customEvent =
          event as CustomEvent<AlarmEventDetail>;

        const detail =
          customEvent.detail;

        if (
          !detail ||
          !detail.habit
        ) {
          return;
        }

        setRingingAlarm(
          detail
        );
      };

    window.addEventListener(
      "life-os-habit-alarm",
      handleAlarm
    );

    return () => {
      window.removeEventListener(
        "life-os-habit-alarm",
        handleAlarm
      );
    };
  }, []);

  /* =======================================================
     ALARM STOPPED
  ======================================================= */

  useEffect(() => {
    const handleStopped =
      () => {
        setRingingAlarm(
          null
        );
      };

    window.addEventListener(
      "life-os-habit-alarm-stopped",
      handleStopped
    );

    return () => {
      window.removeEventListener(
        "life-os-habit-alarm-stopped",
        handleStopped
      );
    };
  }, []);

  /* =======================================================
     ALARM SNOOZED
  ======================================================= */

  useEffect(() => {
    const handleSnoozed =
      () => {
        setRingingAlarm(
          null
        );
      };

    window.addEventListener(
      "life-os-habit-alarm-snoozed",
      handleSnoozed
    );

    return () => {
      window.removeEventListener(
        "life-os-habit-alarm-snoozed",
        handleSnoozed
      );
    };
  }, []);

  /* =======================================================
     UNLOCK AUDIO
  ======================================================= */

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    let unlocked =
      false;

    const unlock = () => {
      if (
        unlocked
      ) {
        return;
      }

      unlocked = true;

      void unlockAlarmAudio();

      window.removeEventListener(
        "pointerdown",
        unlock
      );

      window.removeEventListener(
        "touchstart",
        unlock
      );

      window.removeEventListener(
        "keydown",
        unlock
      );
    };

    window.addEventListener(
      "pointerdown",
      unlock,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "touchstart",
      unlock,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "keydown",
      unlock
    );

    return () => {
      window.removeEventListener(
        "pointerdown",
        unlock
      );

      window.removeEventListener(
        "touchstart",
        unlock
      );

      window.removeEventListener(
        "keydown",
        unlock
      );
    };
  }, []);

  /* =======================================================
     NEW HABIT
  ======================================================= */

  useEffect(() => {
    const handleHabitAdded =
      () => {
        void loadHabits(
          false
        );
      };

    window.addEventListener(
      "life-os-habit-added",
      handleHabitAdded
    );

    return () => {
      window.removeEventListener(
        "life-os-habit-added",
        handleHabitAdded
      );
    };
  }, [loadHabits]);

  /* =======================================================
     HABIT SYNCED
  ======================================================= */

  useEffect(() => {
    const handleHabitSynced =
      () => {
        void loadHabits(
          false
        );
      };

    window.addEventListener(
      "life-os-habit-synced",
      handleHabitSynced
    );

    return () => {
      window.removeEventListener(
        "life-os-habit-synced",
        handleHabitSynced
      );
    };
  }, [loadHabits]);

  /* =======================================================
     ALARM SETTINGS UPDATED
  ======================================================= */

  useEffect(() => {
    const handleAlarmUpdated =
      () => {
        const habits =
          items.map(
            (
              item
            ) =>
              item.habit
          );

        setAlarmHabits(
          habits
        );
      };

    window.addEventListener(
      "life-os-habit-alarm-updated",
      handleAlarmUpdated
    );

    window.addEventListener(
      "life-os-habit-alarm-settings-changed",
      handleAlarmUpdated
    );

    return () => {
      window.removeEventListener(
        "life-os-habit-alarm-updated",
        handleAlarmUpdated
      );

      window.removeEventListener(
        "life-os-habit-alarm-settings-changed",
        handleAlarmUpdated
      );
    };
  }, [items]);

  /* =======================================================
     OFFLINE → ONLINE
  ======================================================= */

  useEffect(() => {
    const handleOnline =
      () => {
        void (
          async () => {
            try {
              /*
               * Immediately show local state.
               */
              await loadHabits(
                false
              );

              /*
               * Then sync Firebase.
               */
              await refreshFromFirebase();
            } catch (
              syncError
            ) {
              console.error(
                "Habit online sync error:",
                syncError
              );
            }
          }
        )();
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
  }, [
    loadHabits,
    refreshFromFirebase,
  ]);

  /* =======================================================
     HABIT NOTIFICATION
  ======================================================= */

  useEffect(() => {
    if (
      items.length === 0
    ) {
      return;
    }

    const checkNotifications =
      () => {
        for (
          const item of
            items
        ) {
          try {
            notifyHabitIfNeeded(
              item.habit
            );
          } catch (
            notificationError
          ) {
            console.error(
              "Habit notification error:",
              notificationError
            );
          }
        }
      };

    checkNotifications();

    const interval =
      window.setInterval(
        checkNotifications,
        30 * 1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [items]);

  /* =======================================================
     TOGGLE COMPLETION
  ======================================================= */

  const handleToggle =
    async (
      habitId: string,
      date: string,
      completed: boolean
    ) => {
      try {
        setError("");

        /*
         * Persist first.
         */
        await toggleHabitCompletion(
          habitId,
          date,
          completed
        );

        /*
         * Optimistic/local UI update.
         */
        setItems(
          (
            currentItems
          ) =>
            currentItems.map(
              (
                item
              ) => {
                if (
                  item.habit.id !==
                  habitId
                ) {
                  return item;
                }

                const existing =
                  item.completions.find(
                    (
                      completion
                    ) =>
                      completion.date ===
                      date
                  );

                if (
                  existing
                ) {
                  return {
                    ...item,
                    completions:
                      item.completions.map(
                        (
                          completion
                        ) =>
                          completion.date ===
                          date
                            ? {
                                ...completion,
                                completed,
                              }
                            : completion
                      ),
                  };
                }

                /*
                 * Prevent duplicate records.
                 */
                return {
                  ...item,
                  completions: [
                    ...item.completions,
                    {
                      id: `${habitId}-${date}`,
                      habitId,
                      date,
                      completed,
                      createdAt:
                        new Date().toISOString(),
                    },
                  ],
                };
              }
            )
        );
      } catch (
        toggleError
      ) {
        console.error(
          "Toggle habit error:",
          toggleError
        );

        setError(
          "অভ্যাসের অবস্থা পরিবর্তন করা যায়নি।"
        );

        /*
         * Reload local data if persistence failed.
         */
        void loadHabits(
          false
        );
      }
    };

  /* =======================================================
     DELETE HABIT
  ======================================================= */

  const handleDelete =
    async (
      habitId: string
    ) => {
      try {
        setError("");

        await deleteHabit(
          habitId
        );

        /*
         * Stop alarm before removing habit.
         */
        stopHabitAlarm(
          habitId
        );

        setItems(
          (
            currentItems
          ) =>
            currentItems.filter(
              (
                item
              ) =>
                item.habit.id !==
                habitId
            )
        );

        if (
          ringingAlarm?.habit.id ===
          habitId
        ) {
          setRingingAlarm(
            null
          );
        }
      } catch (
        deleteError
      ) {
        console.error(
          "Delete habit error:",
          deleteError
        );

        setError(
          "অভ্যাসটি delete করা যায়নি।"
        );

        throw deleteError;
      }
    };

  /* =======================================================
     STOP RINGING
  ======================================================= */

  const handleStopAlarm =
    () => {
      if (
        !ringingAlarm
      ) {
        return;
      }

      stopHabitAlarm(
        ringingAlarm.habit.id
      );

      setRingingAlarm(
        null
      );
    };

  /* =======================================================
     SNOOZE
  ======================================================= */

  const handleSnoozeAlarm =
    () => {
      if (
        !ringingAlarm
      ) {
        return;
      }

      snoozeHabitAlarm(
        ringingAlarm.habit
      );

      setRingingAlarm(
        null
      );
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading &&
    items.length === 0
  ) {
    return (
      <>
        <div className="rounded-2xl border bg-white p-6 text-center text-gray-500">
          অভ্যাস লোড হচ্ছে...
        </div>

        {ringingAlarm && (
          <AlarmRingingModal
            alarm={
              ringingAlarm
            }
            onStop={
              handleStopAlarm
            }
            onSnooze={
              handleSnoozeAlarm
            }
          />
        )}
      </>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error &&
    items.length === 0
  ) {
    return (
      <>
        <div className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
          {error}
        </div>

        {ringingAlarm && (
          <AlarmRingingModal
            alarm={
              ringingAlarm
            }
            onStop={
              handleStopAlarm
            }
            onSnooze={
              handleSnoozeAlarm
            }
          />
        )}
      </>
    );
  }

  /* =======================================================
     EMPTY
  ======================================================= */

  if (
    items.length === 0
  ) {
    return (
      <>
        <div className="rounded-2xl border bg-white p-8 text-center">
          <p className="font-medium text-gray-700">
            এখনো কোনো সক্রিয় অভ্যাস নেই।
          </p>

          <p className="mt-1 text-sm text-gray-500">
            নতুন অভ্যাস যোগ করুন।
          </p>
        </div>

        {ringingAlarm && (
          <AlarmRingingModal
            alarm={
              ringingAlarm
            }
            onStop={
              handleStopAlarm
            }
            onSnooze={
              handleSnoozeAlarm
            }
          />
        )}
      </>
    );
  }

  /* =======================================================
     LIST
  ======================================================= */

  return (
    <>
      <div className="space-y-4">
        {items.map(
          (
            item
          ) => (
            <HabitCard
              key={
                item.habit.id
              }
              habit={
                item.habit
              }
              completions={
                item.completions
              }
              onToggle={(
                date,
                completed
              ) =>
                handleToggle(
                  item.habit.id,
                  date,
                  completed
                )
              }
              onDelete={
                handleDelete
              }
            />
          )
        )}
      </div>

      {ringingAlarm && (
        <AlarmRingingModal
          alarm={
            ringingAlarm
          }
          onStop={
            handleStopAlarm
          }
          onSnooze={
            handleSnoozeAlarm
          }
        />
      )}
    </>
  );
}

/* =========================================================
   ALARM RINGING MODAL
========================================================= */

interface AlarmRingingModalProps {
  alarm: AlarmEventDetail;
  onStop: () => void;
  onSnooze: () => void;
}

function AlarmRingingModal({
  alarm,
  onStop,
  onSnooze,
}: AlarmRingingModalProps) {
  const snoozeMinutes =
    alarm.alarm
      ?.snoozeMinutes ??
    5;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* =================================================
            TOP
        ================================================= */}

        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 px-6 py-8 text-center text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border-4 border-white" />
          </div>

          <div className="relative">
            <div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-white/20 ring-8 ring-white/10">
              <BellRing
                size={40}
                strokeWidth={2}
              />
            </div>

            <p className="mt-5 text-sm font-medium uppercase tracking-[0.2em] text-white/80">
              Habit Alarm
            </p>

            <h2 className="mt-2 break-words text-2xl font-bold sm:text-3xl">
              {alarm.habit.name}
            </h2>
          </div>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="p-6">
          <div className="rounded-2xl border bg-gray-50 p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Clock
                size={18}
              />

              <span className="text-sm">
                Alarm Time
              </span>
            </div>

            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
              {formatAlarmTime(
                alarm.habit.time
              )}
            </p>

            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-orange-600">
              <Volume2
                size={16}
              />

              <span>
                Alarm is ringing
              </span>
            </div>
          </div>

          {/* =================================================
              BUTTONS
          ================================================= */}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={
                onSnooze
              }
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100 active:scale-[0.98]"
            >
              <Moon
                size={19}
              />

              <span>
                Snooze{" "}
                {snoozeMinutes}m
              </span>
            </button>

            <button
              type="button"
              onClick={
                onStop
              }
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98]"
            >
              <X
                size={20}
              />

              <span>
                STOP
              </span>
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            Snooze করলে{" "}
            {snoozeMinutes} মিনিট পরে
            আবার alarm বাজবে।
          </p>
        </div>
      </div>
    </div>
  );
}