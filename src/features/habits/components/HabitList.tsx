"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";

import {
  completeHabit,
  deleteHabit,
  getHabitCompletions,
  getHabits,
  syncPendingHabits,
  toggleHabitCompletion,
} from "../services/habit.service";

import { notifyHabitIfNeeded } from "../services/habit.notification";

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
const parseDate = (dateString: string) => {
  const [year, month, day] =
    dateString.split("-").map(Number);

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

  today.setHours(0, 0, 0, 0);

  return today;
};

export default function HabitList({
  refreshKey = 0,
}: HabitListProps) {
  const [items, setItems] = useState<
    HabitWithCompletions[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /**
   * Load Habits
   *
   * Online:
   * Firebase
   *
   * Offline:
   * habit.service.ts-এর
   * IndexedDB fallback
   */
  const loadHabits = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const habits = await getHabits();

        const today = getToday();

        /**
         * Load completions
         */
        const habitsWithCompletions =
          await Promise.all(
            habits.map(async (habit) => {
              const completions =
                await getHabitCompletions(
                  habit.id
                );

              return {
                habit,
                completions,
              };
            })
          );

        /**
         * Active habits
         */
        const activeItems: HabitWithCompletions[] =
          [];

        for (const item of habitsWithCompletions) {
          const endDate = parseDate(
            item.habit.endDate
          );

          /**
           * End date reached/passed
           */
          if (today >= endDate) {
            try {
              await completeHabit(
                item.habit.id
              );
            } catch (error) {
              console.error(
                "Auto complete habit error:",
                error
              );
            }
          } else {
            activeItems.push(item);
          }
        }

        /**
         * Save active habits
         */
        setItems(activeItems);

        /**
         * Notifications
         */
        activeItems.forEach((item) => {
          notifyHabitIfNeeded(
            item.habit
          );
        });
      } catch (error) {
        console.error(
          "Load habits error:",
          error
        );

        setError(
          "অভ্যাসগুলো লোড করা যায়নি।"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Offline → Online Sync
   */
  useEffect(() => {
    const handleOnline = () => {
      void (async () => {
        try {
          await syncPendingHabits();

          await loadHabits();
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
  }, [loadHabits]);

  /**
   * Authentication
   */
  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) {
            setItems([]);
            setLoading(false);

            setError(
              "অভ্যাস দেখতে আগে লগইন করুন।"
            );

            return;
          }

          await loadHabits();
        }
      );

    return () => {
      unsubscribe();
    };
  }, [loadHabits, refreshKey]);

  /**
   * Habit Notification
   *
   * Every 30 seconds
   */
  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const checkNotifications = () => {
      items.forEach((item) => {
        notifyHabitIfNeeded(
          item.habit
        );
      });
    };

    checkNotifications();

    const interval = window.setInterval(
      checkNotifications,
      30 * 1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [items]);

  /**
   * Toggle Habit Completion
   */
  const handleToggle = async (
    habitId: string,
    date: string,
    completed: boolean
  ) => {
    try {
      setError("");

      /**
       * Online/offline service
       */
      await toggleHabitCompletion(
        habitId,
        date,
        completed
      );

      /**
       * Update local state
       */
      let updatedItems: HabitWithCompletions[] =
        [];

      setItems((currentItems) => {
        updatedItems =
          currentItems.map((item) => {
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

            /**
             * Existing completion
             */
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

            /**
             * New completion
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
          });

        return updatedItems;
      });

      /**
       * Find updated habit
       */
      const updatedHabit =
        updatedItems.find(
          (item) =>
            item.habit.id ===
            habitId
        );

      if (!updatedHabit) {
        return;
      }

      /**
       * Completed days
       */
      const completedCount =
        updatedHabit.completions.filter(
          (item) =>
            item.completed
        ).length;

      /**
       * Target reached
       *
       * Move to History
       */
      if (
        updatedHabit.habit
          .targetDays > 0 &&
        completedCount >=
          updatedHabit.habit
            .targetDays
      ) {
        await completeHabit(
          habitId
        );

        /**
         * Remove from active list
         */
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
   *
   * Online:
   * Firebase থেকে delete
   *
   * Offline:
   * habit.service.ts
   * IndexedDB queue handle করবে
   */
  const handleDelete = async (
    habitId: string
  ) => {
    try {
      setError("");

      /**
       * Delete from service
       */
      await deleteHabit(
        habitId
      );

      /**
       * Immediately remove
       * from UI
       */
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
   * Loading State
   */
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center text-gray-500">
        অভ্যাস লোড হচ্ছে...
      </div>
    );
  }

  /**
   * Error State
   */
  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  /**
   * No Habits
   */
  if (items.length === 0) {
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