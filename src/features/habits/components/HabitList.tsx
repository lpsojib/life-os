"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

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
  Habit,
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

/**
 * YYYY-MM-DD → Local Date
 */
const parseDate = (
  dateString: string
) => {
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

/**
 * Today
 */
const getToday = () => {
  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  return today;
};

export default function HabitList({
  refreshKey = 0,
}: HabitListProps) {
  const [items, setItems] =
    useState<HabitWithCompletions[]>(
      []
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /**
   * Local-only load.
   *
   * IMPORTANT:
   * This never waits for Firebase.
   */
  const loadHabits = useCallback(
    async (
      showLoading = false
    ) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError("");

        const habits =
          await getHabits();

        const habitsWithCompletions =
          await Promise.all(
            habits.map(
              async (habit) => {
                const completions =
                  await getHabitCompletions(
                    habit.id
                  );

                return {
                  habit,
                  completions,
                };
              }
            )
          );

        const today =
          getToday();

        const activeItems: HabitWithCompletions[] =
          [];

        for (
          const item of
            habitsWithCompletions
        ) {
          const endDate =
            parseDate(
              item.habit.endDate
            );

          if (
            today >= endDate
          ) {
            /*
             * Do not block list rendering
             * on Firebase.
             */
            void completeHabit(
              item.habit.id
            ).catch((error) => {
              console.error(
                "Auto complete habit error:",
                error
              );
            });

            continue;
          }

          activeItems.push(item);
        }

        /*
         * UI updates immediately from
         * IndexedDB.
         */
        setItems(
          activeItems
        );

        activeItems.forEach(
          (item) => {
            notifyHabitIfNeeded(
              item.habit
            );
          }
        );
      } catch (error) {
        console.error(
          "Load habits error:",
          error
        );

        setError(
          "অভ্যাসগুলো লোড করা যায়নি।"
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  /**
   * Firebase refresh happens in the
   * background only.
   */
  const refreshFromFirebase =
    useCallback(
      async () => {
        if (
          typeof navigator ===
            "undefined" ||
          !navigator.onLine
        ) {
          return;
        }

        try {
          await refreshHabitsFromFirebase();

          /*
           * Read the updated local list.
           */
          const latestHabits =
            await getHabits();

          /*
           * Refresh completions in parallel.
           */
          await Promise.all(
            latestHabits.map(
              (habit) =>
                refreshHabitCompletionsFromFirebase(
                  habit.id
                )
            )
          );

          /*
           * Finally update the UI from
           * the refreshed local cache.
           */
          await loadHabits(
            false
          );
        } catch (error) {
          console.error(
            "Background habit refresh error:",
            error
          );
        }
      },
      [loadHabits]
    );

  /**
   * Authentication
   */
  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          if (!user) {
            setItems([]);
            setLoading(false);

            setError(
              "অভ্যাস দেখতে আগে লগইন করুন।"
            );

            return;
          }

          /*
           * FIRST:
           * Show local data immediately.
           */
          void loadHabits(
            true
          );

          /*
           * THEN:
           * Firebase refresh in background.
           */
          void refreshFromFirebase();
        }
      );

    return () => {
      unsubscribe();
    };
  }, [
    loadHabits,
    refreshFromFirebase,
    refreshKey,
  ]);

  /**
   * New Habit
   *
   * Do not reload the whole page/list.
   * Just read local IndexedDB.
   */
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

  /**
   * Firebase finished background
   * synchronization of a newly-added
   * habit.
   */
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

  /**
   * Offline → Online Sync
   */
  useEffect(() => {
    const handleOnline = () => {
      void (async () => {
        try {
          /*
           * First push pending queue.
           */
          await syncPendingHabits();

          /*
           * Show local result immediately.
           */
          await loadHabits(
            false
          );

          /*
           * Then refresh Firebase data.
           */
          await refreshFromFirebase();
        } catch (error) {
          console.error(
            "Habit online sync error:",
            error
          );
        }
      })();
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

  /**
   * Habit Notification
   *
   * Every 30 seconds
   */
  useEffect(() => {
    if (
      items.length === 0
    ) {
      return;
    }

    const checkNotifications =
      () => {
        items.forEach(
          (item) => {
            notifyHabitIfNeeded(
              item.habit
            );
          }
        );
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

  /**
   * Toggle Habit Completion
   */
  const handleToggle =
    async (
      habitId: string,
      date: string,
      completed: boolean
    ) => {
      try {
        setError("");

        await toggleHabitCompletion(
          habitId,
          date,
          completed
        );

        let updatedItems:
          HabitWithCompletions[] =
          [];

        setItems(
          (currentItems) => {
            updatedItems =
              currentItems.map(
                (item) => {
                  if (
                    item.habit.id !==
                    habitId
                  ) {
                    return item;
                  }

                  const existing =
                    item.completions.find(
                      (completion) =>
                        completion.date ===
                        date
                    );

                  if (existing) {
                    return {
                      ...item,

                      completions:
                        item.completions.map(
                          (completion) =>
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
              );

            return updatedItems;
          }
        );

        const updatedHabit =
          updatedItems.find(
            (item) =>
              item.habit.id ===
              habitId
          );

        if (!updatedHabit) {
          return;
        }

        const completedCount =
          updatedHabit.completions.filter(
            (item) =>
              item.completed
          ).length;

        if (
          updatedHabit.habit
            .targetDays > 0 &&
          completedCount >=
            updatedHabit.habit
              .targetDays
        ) {
          /*
           * Complete in background.
           */
          void completeHabit(
            habitId
          ).catch((error) => {
            console.error(
              "Complete habit error:",
              error
            );
          });

          setItems(
            (currentItems) =>
              currentItems.filter(
                (item) =>
                  item.habit.id !==
                  habitId
              )
          );
        }
      } catch (error) {
        console.error(
          "Toggle habit error:",
          error
        );

        setError(
          "অভ্যাসের অবস্থা পরিবর্তন করা যায়নি।"
        );
      }
    };

  /**
   * Delete Habit
   */
  const handleDelete =
    async (
      habitId: string
    ) => {
      try {
        setError("");

        await deleteHabit(
          habitId
        );

        setItems(
          (currentItems) =>
            currentItems.filter(
              (item) =>
                item.habit.id !==
                habitId
            )
        );
      } catch (error) {
        console.error(
          "Delete habit error:",
          error
        );

        setError(
          "অভ্যাসটি delete করা যায়নি।"
        );

        throw error;
      }
    };

  /**
   * Initial loading only.
   *
   * If existing items are already visible,
   * never replace them with a loading screen.
   */
  if (
    loading &&
    items.length === 0
  ) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center text-gray-500">
        অভ্যাস লোড হচ্ছে...
      </div>
    );
  }

  /**
   * Error State
   */
  if (
    error &&
    items.length === 0
  ) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  /**
   * No Habits
   */
  if (
    items.length === 0
  ) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <p className="font-medium text-gray-700">
          এখনো কোনো সক্রিয় অভ্যাস নেই।
        </p>

        <p className="mt-1 text-sm text-gray-500">
          নতুন অভ্যাস যোগ করুন।
        </p>
      </div>
    );
  }

  /**
   * Habit List
   */
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <HabitCard
          key={item.habit.id}
          habit={item.habit}
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
      ))}
    </div>
  );
}