import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  Habit,
  HabitCompletion,
} from "../types/habit.types";

/**
 * Current user's Habits collection
 */
const getHabitsCollection = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return collection(
    db,
    "users",
    user.uid,
    "habits"
  );
};

/**
 * Current user's Habit Completions collection
 */
const getCompletionsCollection = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return collection(
    db,
    "users",
    user.uid,
    "habitCompletions"
  );
};

/**
 * Calculate Habit End Date
 *
 * Example:
 * Start Date = 2026-08-08
 * Target Days = 21
 *
 * End Date = 2026-08-28
 */
const calculateEndDate = (
  startDate: string,
  targetDays: number
): string => {
  const start = new Date(
    `${startDate}T00:00:00`
  );

  if (Number.isNaN(start.getTime())) {
    throw new Error(
      "Invalid habit start date."
    );
  }

  const end = new Date(start);

  end.setDate(
    start.getDate() + targetDays - 1
  );

  return end.toISOString().split("T")[0];
};

/**
 * Add a new Habit
 */
export const addHabit = async (
  name: string,
  targetDays: number,
  startDate: string,
  time: string
): Promise<string> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated."
    );
  }

  const endDate = calculateEndDate(
    startDate,
    targetDays
  );

  const habitData = {
    name: name.trim(),
    targetDays,
    startDate,
    endDate,
    time,
    status: "active",
    createdAt: Timestamp.now(),
  };

  const habitRef = await addDoc(
    getHabitsCollection(),
    habitData
  );

  return habitRef.id;
};

/**
 * Get Active Habits
 */
export const getHabits = async (): Promise<
  Habit[]
> => {
  const habitsQuery = query(
    getHabitsCollection(),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(
    habitsQuery
  );

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,

      name: data.name ?? "",

      targetDays: data.targetDays ?? 0,

      startDate: data.startDate ?? "",

      endDate: data.endDate ?? "",

      time: data.time ?? "",

      status: "active",

      createdAt:
        data.createdAt?.toDate?.().toISOString() ??
        new Date().toISOString(),
    };
  });
};

/**
 * Get Completed Habits
 *
 * এগুলো History section-এ দেখানো হবে।
 */
export const getCompletedHabits =
  async (): Promise<Habit[]> => {
    const habitsQuery = query(
      getHabitsCollection(),
      where("status", "==", "completed"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(
      habitsQuery
    );

    return snapshot.docs.map((item) => {
      const data = item.data();

      return {
        id: item.id,

        name: data.name ?? "",

        targetDays: data.targetDays ?? 0,

        startDate: data.startDate ?? "",

        endDate: data.endDate ?? "",

        time: data.time ?? "",

        status: "completed",

        createdAt:
          data.createdAt?.toDate?.().toISOString() ??
          new Date().toISOString(),
      };
    });
  };

/**
 * Get Habit Completions
 */
export const getHabitCompletions = async (
  habitId: string
): Promise<HabitCompletion[]> => {
  const completionsQuery = query(
    getCompletionsCollection(),
    where("habitId", "==", habitId),
    orderBy("date", "asc")
  );

  const snapshot = await getDocs(
    completionsQuery
  );

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,

      habitId:
        data.habitId ?? habitId,

      date: data.date ?? "",

      completed:
        data.completed ?? false,

      createdAt:
        data.createdAt?.toDate?.().toISOString() ??
        new Date().toISOString(),
    };
  });
};

/**
 * Toggle Habit Completion
 *
 * একটি নির্দিষ্ট দিনের Habit:
 *
 * false → true
 * true → false
 */
export const toggleHabitCompletion =
  async (
    habitId: string,
    date: string,
    completed: boolean
  ): Promise<void> => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error(
        "User is not authenticated."
      );
    }

    const completionsCollection =
      getCompletionsCollection();

    const existingQuery = query(
      completionsCollection,
      where("habitId", "==", habitId),
      where("date", "==", date)
    );

    const snapshot = await getDocs(
      existingQuery
    );

    if (!snapshot.empty) {
      const existingDoc =
        snapshot.docs[0];

      await updateDoc(
        doc(
          db,
          "users",
          user.uid,
          "habitCompletions",
          existingDoc.id
        ),
        {
          completed,
        }
      );

      return;
    }

    await addDoc(
      completionsCollection,
      {
        habitId,
        date,
        completed,
        createdAt: Timestamp.now(),
      }
    );
  };

/**
 * Mark Habit as Completed
 *
 * Target days পূর্ণ হলে
 * History-তে যাবে।
 */
export const completeHabit =
  async (
    habitId: string
  ): Promise<void> => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error(
        "User is not authenticated."
      );
    }

    await updateDoc(
      doc(
        db,
        "users",
        user.uid,
        "habits",
        habitId
      ),
      {
        status: "completed",
      }
    );
  };

/**
 * Delete Active / Completed Habit
 *
 * Habit-এর সাথে থাকা
 * completion records-ও delete হবে।
 */
export const deleteHabit =
  async (
    habitId: string
  ): Promise<void> => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error(
        "User is not authenticated."
      );
    }

    /**
     * Delete Habit
     */
    await deleteDoc(
      doc(
        db,
        "users",
        user.uid,
        "habits",
        habitId
      )
    );

    /**
     * Get completion records
     */
    const completionsQuery = query(
      getCompletionsCollection(),
      where(
        "habitId",
        "==",
        habitId
      )
    );

    const snapshot = await getDocs(
      completionsQuery
    );

    /**
     * Delete all completion records
     */
    await Promise.all(
      snapshot.docs.map((item) =>
        deleteDoc(
          doc(
            db,
            "users",
            user.uid,
            "habitCompletions",
            item.id
          )
        )
      )
    );
  };