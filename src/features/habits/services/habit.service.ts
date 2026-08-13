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

/* =========================================================
   IndexedDB
========================================================= */

const DB_NAME = "life-os-db";
const DB_VERSION = 1;

const HABITS_STORE = "habits";
const COMPLETIONS_STORE = "habitCompletions";
const QUEUE_STORE = "habitSyncQueue";

interface HabitSyncItem {
  id?: number;
  type:
    | "add-habit"
    | "update-habit"
    | "delete-habit"
    | "toggle-completion"
    | "complete-habit";
  habit?: Habit;
  habitId?: string;
  completion?: HabitCompletion;
  completed?: boolean;
  date?: string;
}

let databasePromise: Promise<IDBDatabase> | null = null;

/**
 * Open IndexedDB
 */
const openDatabase = (): Promise<IDBDatabase> => {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("IndexedDB is only available in the browser.")
    );
  }

  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(HABITS_STORE)) {
        const store = database.createObjectStore(
          HABITS_STORE,
          {
            keyPath: "id",
          }
        );

        store.createIndex(
          "status",
          "status",
          { unique: false }
        );
      }

      if (
        !database.objectStoreNames.contains(
          COMPLETIONS_STORE
        )
      ) {
        const store = database.createObjectStore(
          COMPLETIONS_STORE,
          {
            keyPath: "id",
          }
        );

        store.createIndex(
          "habitId",
          "habitId",
          { unique: false }
        );

        store.createIndex(
          "date",
          "date",
          { unique: false }
        );
      }

      if (
        !database.objectStoreNames.contains(
          QUEUE_STORE
        )
      ) {
        database.createObjectStore(
          QUEUE_STORE,
          {
            keyPath: "id",
            autoIncrement: true,
          }
        );
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return databasePromise;
};

/**
 * Run IndexedDB transaction
 */
const runTransaction = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (
    store: IDBObjectStore
  ) => IDBRequest<T> | void
): Promise<T | undefined> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction =
      database.transaction(
        storeName,
        mode
      );

    const store =
      transaction.objectStore(storeName);

    let requestResult: T | undefined;

    let request:
      | IDBRequest<T>
      | undefined;

    try {
      request = operation(store) as
        | IDBRequest<T>
        | undefined;
    } catch (error) {
      reject(error);
      return;
    }

    if (request) {
      request.onsuccess = () => {
        requestResult = request.result;
      };

      request.onerror = () => {
        reject(request.error);
      };
    }

    transaction.oncomplete = () => {
      resolve(requestResult);
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };

    transaction.onabort = () => {
      reject(transaction.error);
    };
  });
};

/* =========================================================
   Helpers
========================================================= */

/**
 * Current user's Habits collection
 */
const getHabitsCollection = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated."
    );
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
    throw new Error(
      "User is not authenticated."
    );
  }

  return collection(
    db,
    "users",
    user.uid,
    "habitCompletions"
  );
};

/**
 * Generate local ID
 */
const generateLocalId = (
  prefix: string
): string => {
  return `local-${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

/**
 * Calculate Habit End Date
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

  if (
    !Number.isInteger(targetDays) ||
    targetDays <= 0
  ) {
    throw new Error(
      "Target days must be greater than 0."
    );
  }

  const end = new Date(start);

  end.setDate(
    start.getDate() + targetDays - 1
  );

  return end
    .toISOString()
    .split("T")[0];
};

/**
 * Save habit locally
 */
const saveHabitLocally = async (
  habit: Habit
): Promise<void> => {
  await runTransaction(
    HABITS_STORE,
    "readwrite",
    (store) => {
      store.put(habit);
    }
  );
};

/**
 * Get all local habits
 */
const getLocalHabits =
  async (): Promise<Habit[]> => {
    const result =
      await runTransaction<Habit[]>(
        HABITS_STORE,
        "readonly",
        (store) => store.getAll()
      );

    return result ?? [];
  };

/**
 * Get local habit
 */
const getLocalHabit = async (
  habitId: string
): Promise<Habit | undefined> => {
  const result =
    await runTransaction<Habit>(
      HABITS_STORE,
      "readonly",
      (store) =>
        store.get(habitId)
    );

  return result;
};

/**
 * Delete local habit
 */
const deleteLocalHabit = async (
  habitId: string
): Promise<void> => {
  await runTransaction(
    HABITS_STORE,
    "readwrite",
    (store) => {
      store.delete(habitId);
    }
  );
};

/**
 * Save completion locally
 */
const saveCompletionLocally =
  async (
    completion: HabitCompletion
  ): Promise<void> => {
    await runTransaction(
      COMPLETIONS_STORE,
      "readwrite",
      (store) => {
        store.put(completion);
      }
    );
  };

/**
 * Get local completions
 */
const getLocalCompletions =
  async (
    habitId: string
  ): Promise<HabitCompletion[]> => {
    const database =
      await openDatabase();

    return new Promise(
      (resolve, reject) => {
        const transaction =
          database.transaction(
            COMPLETIONS_STORE,
            "readonly"
          );

        const store =
          transaction.objectStore(
            COMPLETIONS_STORE
          );

        const index =
          store.index("habitId");

        const request =
          index.getAll(habitId);

        request.onsuccess = () => {
          resolve(
            (request.result ??
              []) as HabitCompletion[]
          );
        };

        request.onerror = () => {
          reject(request.error);
        };
      }
    );
  };

/**
 * Delete local completions
 */
const deleteLocalCompletions =
  async (
    habitId: string
  ): Promise<void> => {
    const completions =
      await getLocalCompletions(
        habitId
      );

    if (completions.length === 0) {
      return;
    }

    const database =
      await openDatabase();

    await new Promise<void>(
      (resolve, reject) => {
        const transaction =
          database.transaction(
            COMPLETIONS_STORE,
            "readwrite"
          );

        const store =
          transaction.objectStore(
            COMPLETIONS_STORE
          );

        completions.forEach(
          (completion) => {
            store.delete(
              completion.id
            );
          }
        );

        transaction.oncomplete = () =>
          resolve();

        transaction.onerror = () =>
          reject(transaction.error);

        transaction.onabort = () =>
          reject(transaction.error);
      }
    );
  };

/**
 * Add item to sync queue
 */
const addToSyncQueue = async (
  item: HabitSyncItem
): Promise<void> => {
  await runTransaction(
    QUEUE_STORE,
    "readwrite",
    (store) => {
      store.add(item);
    }
  );
};

/* =========================================================
   ADD HABIT
========================================================= */

/**
 * Add a new Habit
 *
 * Online:
 * Firebase-এ save হবে।
 *
 * Offline:
 * IndexedDB-তে save হবে।
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

  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error(
      "Habit name is required."
    );
  }

  const endDate = calculateEndDate(
    startDate,
    targetDays
  );

  const localId =
    generateLocalId("habit");

  const habit: Habit = {
    id: localId,
    name: trimmedName,
    targetDays,
    startDate,
    endDate,
    time,
    status: "active",
    createdAt:
      new Date().toISOString(),
  };

  /*
   * LOCAL-FIRST
   *
   * The UI never waits for Firebase.
   */
  await saveHabitLocally(habit);

  if (
    typeof window !== "undefined" &&
    navigator.onLine
  ) {
    /*
     * Firebase runs in the background.
     *
     * addHabit() returns immediately after
     * the local IndexedDB save.
     */
    void syncSingleHabitInBackground(
      habit
    );

    return localId;
  }

  /*
   * Offline:
   * Keep a durable sync queue.
   *
   * This is intentionally awaited so an
   * offline habit is not lost if the page
   * closes immediately after creation.
   */
  await addToSyncQueue({
    type: "add-habit",
    habit,
  });

  return localId;
};

/**
 * Sync one newly-created habit in the
 * background when the browser is online.
 */
const syncSingleHabitInBackground =
  async (
    habit: Habit
  ): Promise<void> => {
    try {
      const habitRef =
        await addDoc(
          getHabitsCollection(),
          {
            name: habit.name,
            targetDays:
              habit.targetDays,
            startDate:
              habit.startDate,
            endDate:
              habit.endDate,
            time: habit.time,
            status: habit.status,
            createdAt:
              Timestamp.fromDate(
                new Date(
                  habit.createdAt
                )
              ),
          }
        );

      await deleteLocalHabit(
        habit.id
      );

      const firebaseHabit: Habit = {
        ...habit,
        id: habitRef.id,
      };

      await saveHabitLocally(
        firebaseHabit
      );

      /*
       * If the user completed/toggled this
       * local habit before Firebase finished,
       * move those queued operations to the
       * real Firebase habit ID.
       */
      await replaceQueuedHabitId(
        habit.id,
        habitRef.id
      );

      if (
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(
          new CustomEvent(
            "life-os-habit-synced",
            {
              detail: {
                localId: habit.id,
                firebaseId:
                  habitRef.id,
              },
            }
          )
        );
      }
    } catch (error) {
      console.error(
        "Background habit sync failed:",
        error
      );

      /*
       * Firebase failed. Keep the local copy
       * and put it into the durable queue.
       */
      try {
        await addToSyncQueue({
          type: "add-habit",
          habit,
        });
      } catch (queueError) {
        console.error(
          "Failed to queue habit sync:",
          queueError
        );
      }
    }
  };

/**
 * Replace a temporary local habit ID in
 * queued completion operations.
 */
const replaceQueuedHabitId =
  async (
    localId: string,
    firebaseId: string
  ): Promise<void> => {
    const queue =
      await getSyncQueue();

    const relatedItems =
      queue.filter(
        (item) =>
          item.habitId === localId
      );

    if (
      relatedItems.length === 0
    ) {
      return;
    }

    const database =
      await openDatabase();

    await new Promise<void>(
      (resolve, reject) => {
        const transaction =
          database.transaction(
            QUEUE_STORE,
            "readwrite"
          );

        const store =
          transaction.objectStore(
            QUEUE_STORE
          );

        for (
          const item of relatedItems
        ) {
          if (
            typeof item.id !==
            "number"
          ) {
            continue;
          }

          store.put({
            ...item,
            habitId: firebaseId,
            completion:
              item.completion
                ? {
                    ...item.completion,
                    habitId:
                      firebaseId,
                  }
                : item.completion,
          });
        }

        transaction.oncomplete = () =>
          resolve();

        transaction.onerror = () =>
          reject(
            transaction.error
          );

        transaction.onabort = () =>
          reject(
            transaction.error
          );
      }
    );
  };

/**
 * Refresh habits from Firebase in the
 * background.
 *
 * This function is intentionally separate
 * from getHabits() so reads stay instant.
 */
export const refreshHabitsFromFirebase =
  async (): Promise<void> => {
    if (
      typeof window === "undefined" ||
      !navigator.onLine ||
      !auth.currentUser
    ) {
      return;
    }

    try {
      const habitsQuery =
        query(
          getHabitsCollection(),
          where(
            "status",
            "==",
            "active"
          ),
          orderBy(
            "createdAt",
            "desc"
          )
        );

      const snapshot =
        await getDocs(
          habitsQuery
        );

      await Promise.all(
        snapshot.docs.map(
          async (item) => {
            const data =
              item.data();

            const habit: Habit = {
              id: item.id,
              name:
                data.name ?? "",
              targetDays:
                data.targetDays ?? 0,
              startDate:
                data.startDate ?? "",
              endDate:
                data.endDate ?? "",
              time:
                data.time ?? "",
              status: "active",
              createdAt:
                data.createdAt
                  ?.toDate?.()
                  ?.toISOString() ??
                new Date().toISOString(),
            };

            await saveHabitLocally(
              habit
            );
          }
        )
      );

    } catch (error) {
      console.error(
        "Background habit refresh failed:",
        error
      );
    }
  };

/**
 * Refresh one habit's completions from
 * Firebase in the background.
 */
export const refreshHabitCompletionsFromFirebase =
  async (
    habitId: string
  ): Promise<void> => {
    if (
      typeof window === "undefined" ||
      !navigator.onLine ||
      !auth.currentUser ||
      habitId.startsWith(
        "local-habit-"
      )
    ) {
      return;
    }

    try {
      const completionsQuery =
        query(
          getCompletionsCollection(),
          where(
            "habitId",
            "==",
            habitId
          ),
          orderBy(
            "date",
            "asc"
          )
        );

      const snapshot =
        await getDocs(
          completionsQuery
        );

      await Promise.all(
        snapshot.docs.map(
          async (item) => {
            const data =
              item.data();

            const completion:
              HabitCompletion = {
              id: item.id,
              habitId:
                data.habitId ??
                habitId,
              date:
                data.date ?? "",
              completed:
                data.completed ??
                false,
              createdAt:
                data.createdAt
                  ?.toDate?.()
                  ?.toISOString() ??
                new Date().toISOString(),
            };

            await saveCompletionLocally(
              completion
            );
          }
        )
      );

    } catch (error) {
      console.error(
        "Background completion refresh failed:",
        error
      );
    }
  };

/* =========================================================
   GET HABITS
========================================================= */

/**
 * Get Active Habits
 */
export const getHabits =
  async (): Promise<Habit[]> => {
    /*
     * LOCAL-FIRST
     *
     * Never wait for Firebase here.
     */
    const localHabits =
      await getLocalHabits();

    const activeLocalHabits =
      localHabits
        .filter(
          (habit) =>
            habit.status === "active"
        )
        .sort(
          (a, b) =>
            b.createdAt.localeCompare(
              a.createdAt
            )
        );

    return activeLocalHabits;
  };

/* =========================================================
   COMPLETED HABITS
========================================================= */

/**
 * Get Completed Habits
 */
export const getCompletedHabits =
  async (): Promise<Habit[]> => {
    const localHabits =
      await getLocalHabits();

    if (!navigator.onLine) {
      return localHabits
        .filter(
          (habit) =>
            habit.status ===
            "completed"
        )
        .sort(
          (a, b) =>
            b.createdAt.localeCompare(
              a.createdAt
            )
        );
    }

    try {
      const habitsQuery =
        query(
          getHabitsCollection(),
          where(
            "status",
            "==",
            "completed"
          ),
          orderBy(
            "createdAt",
            "desc"
          )
        );

      const snapshot =
        await getDocs(
          habitsQuery
        );

      const firebaseHabits =
        snapshot.docs.map(
          (item) => {
            const data =
              item.data();

            const habit: Habit = {
              id: item.id,
              name:
                data.name ?? "",
              targetDays:
                data.targetDays ?? 0,
              startDate:
                data.startDate ?? "",
              endDate:
                data.endDate ?? "",
              time:
                data.time ?? "",
              status:
                "completed",
              createdAt:
                data.createdAt
                  ?.toDate?.()
                  ?.toISOString() ??
                new Date().toISOString(),
            };

            return habit;
          }
        );

      for (const habit of firebaseHabits) {
        await saveHabitLocally(
          habit
        );
      }

      return firebaseHabits;
    } catch (error) {
      console.error(
        "Get completed habits failed.",
        error
      );

      return localHabits.filter(
        (habit) =>
          habit.status ===
          "completed"
      );
    }
  };

/* =========================================================
   HABIT COMPLETIONS
========================================================= */

/**
 * Get Habit Completions
 */
export const getHabitCompletions =
  async (
    habitId: string
  ): Promise<HabitCompletion[]> => {
    /*
     * LOCAL-FIRST.
     */
    const localCompletions =
      await getLocalCompletions(
        habitId
      );

    return localCompletions.sort(
      (a, b) =>
        a.date.localeCompare(
          b.date
        )
    );
  };

/* =========================================================
   TOGGLE COMPLETION
========================================================= */

/**
 * Toggle Habit Completion
 *
 * Offline + Online compatible.
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

    const localCompletions =
      await getLocalCompletions(
        habitId
      );

    const existing =
      localCompletions.find(
        (item) =>
          item.date === date
      );

    const completion: HabitCompletion =
      {
        id:
          existing?.id ??
          generateLocalId(
            "completion"
          ),
        habitId,
        date,
        completed,
        createdAt:
          existing?.createdAt ??
          new Date().toISOString(),
      };

    /**
     * Save locally immediately.
     */
    await saveCompletionLocally(
      completion
    );

    /**
     * Offline queue.
     */
    if (!navigator.onLine) {
      await addToSyncQueue({
        type:
          "toggle-completion",
        habitId,
        date,
        completed,
        completion,
      });

      return;
    }

    /**
     * Online Firebase sync.
     */
    try {
      const completionsCollection =
        getCompletionsCollection();

      const existingQuery =
        query(
          completionsCollection,
          where(
            "habitId",
            "==",
            habitId
          ),
          where(
            "date",
            "==",
            date
          )
        );

      const snapshot =
        await getDocs(
          existingQuery
        );

      if (!snapshot.empty) {
        await updateDoc(
          doc(
            db,
            "users",
            user.uid,
            "habitCompletions",
            snapshot.docs[0].id
          ),
          {
            completed,
          }
        );

        /**
         * Replace local temporary
         * completion with Firebase ID.
         */
        await runTransaction(
          COMPLETIONS_STORE,
          "readwrite",
          (store) => {
            store.delete(
              completion.id
            );
          }
        );

        await saveCompletionLocally({
          ...completion,
          id: snapshot.docs[0].id,
        });

        return;
      }

      const completionRef =
        await addDoc(
          completionsCollection,
          {
            habitId,
            date,
            completed,
            createdAt:
              Timestamp.fromDate(
                new Date(
                  completion.createdAt
                )
              ),
          }
        );

      await runTransaction(
        COMPLETIONS_STORE,
        "readwrite",
        (store) => {
          store.delete(
            completion.id
          );
        }
      );

      await saveCompletionLocally({
        ...completion,
        id: completionRef.id,
      });
    } catch (error) {
      console.error(
        "Habit completion sync failed.",
        error
      );

      await addToSyncQueue({
        type:
          "toggle-completion",
        habitId,
        date,
        completed,
        completion,
      });
    }
  };

/* =========================================================
   COMPLETE HABIT
========================================================= */

/**
 * Mark Habit as Completed
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

    const localHabit =
      await getLocalHabit(
        habitId
      );

    if (localHabit) {
      await saveHabitLocally({
        ...localHabit,
        status: "completed",
      });
    }

    if (!navigator.onLine) {
      await addToSyncQueue({
        type: "complete-habit",
        habitId,
      });

      return;
    }

    try {
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
    } catch (error) {
      console.error(
        "Complete habit sync failed.",
        error
      );

      await addToSyncQueue({
        type: "complete-habit",
        habitId,
      });
    }
  };

/* =========================================================
   DELETE HABIT
========================================================= */

/**
 * Delete Active / Completed Habit
 *
 * Offline:
 * Local habit + completion records
 * immediately delete হবে।
 *
 * Online:
 * Firebase থেকেও delete হবে।
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
     * Delete locally first.
     */
    await deleteLocalHabit(
      habitId
    );

    await deleteLocalCompletions(
      habitId
    );

    /**
     * Offline → queue delete.
     */
    if (!navigator.onLine) {
      await addToSyncQueue({
        type: "delete-habit",
        habitId,
      });

      return;
    }

    try {
      /**
       * Delete Firebase habit.
       */
      if (
        !habitId.startsWith(
          "local-habit-"
        )
      ) {
        await deleteDoc(
          doc(
            db,
            "users",
            user.uid,
            "habits",
            habitId
          )
        );
      }

      /**
       * Delete Firebase completions.
       */
      const completionsQuery =
        query(
          getCompletionsCollection(),
          where(
            "habitId",
            "==",
            habitId
          )
        );

      const snapshot =
        await getDocs(
          completionsQuery
        );

      await Promise.all(
        snapshot.docs.map(
          (item) =>
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
    } catch (error) {
      console.error(
        "Delete habit sync failed.",
        error
      );

      await addToSyncQueue({
        type: "delete-habit",
        habitId,
      });
    }
  };

/* =========================================================
   SYNC PENDING HABITS
========================================================= */

/**
 * Get all pending queue items
 */
const getSyncQueue =
  async (): Promise<
    HabitSyncItem[]
  > => {
    const result =
      await runTransaction<
        HabitSyncItem[]
      >(
        QUEUE_STORE,
        "readonly",
        (store) =>
          store.getAll()
      );

    return result ?? [];
  };

/**
 * Delete queue item
 */
const deleteQueueItem =
  async (
    id: number
  ): Promise<void> => {
    await runTransaction(
      QUEUE_STORE,
      "readwrite",
      (store) => {
        store.delete(id);
      }
    );
  };

/**
 * Sync offline habits
 *
 * Call this when browser becomes online.
 */
export const syncPendingHabits =
  async (): Promise<void> => {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    if (!navigator.onLine) {
      return;
    }

    const queue =
      await getSyncQueue();

    for (const item of queue) {
      if (
        typeof item.id !==
        "number"
      ) {
        continue;
      }

      try {
        /**
         * ADD HABIT
         */
        if (
          item.type ===
            "add-habit" &&
          item.habit
        ) {
          const habit =
            item.habit;

          const habitRef =
            await addDoc(
              getHabitsCollection(),
              {
                name:
                  habit.name,
                targetDays:
                  habit.targetDays,
                startDate:
                  habit.startDate,
                endDate:
                  habit.endDate,
                time:
                  habit.time,
                status:
                  habit.status,
                createdAt:
                  Timestamp.fromDate(
                    new Date(
                      habit.createdAt
                    )
                  ),
              }
            );

          await deleteLocalHabit(
            habit.id
          );

          await saveHabitLocally({
            ...habit,
            id: habitRef.id,
          });

          /*
           * Any completion operations created
           * while the habit was offline must now
           * use the real Firebase habit ID.
           */
          await replaceQueuedHabitId(
            habit.id,
            habitRef.id
          );
        }

        /**
         * COMPLETE HABIT
         */
        if (
          item.type ===
            "complete-habit" &&
          item.habitId
        ) {
          if (
            !item.habitId.startsWith(
              "local-habit-"
            )
          ) {
            await updateDoc(
              doc(
                db,
                "users",
                user.uid,
                "habits",
                item.habitId
              ),
              {
                status:
                  "completed",
              }
            );
          }
        }

        /**
         * DELETE HABIT
         */
        if (
          item.type ===
            "delete-habit" &&
          item.habitId
        ) {
          if (
            !item.habitId.startsWith(
              "local-habit-"
            )
          ) {
            try {
              await deleteDoc(
                doc(
                  db,
                  "users",
                  user.uid,
                  "habits",
                  item.habitId
                )
              );
            } catch {
              // Firebase document may
              // already be deleted.
            }

            const completionsQuery =
              query(
                getCompletionsCollection(),
                where(
                  "habitId",
                  "==",
                  item.habitId
                )
              );

            const snapshot =
              await getDocs(
                completionsQuery
              );

            await Promise.all(
              snapshot.docs.map(
                (completion) =>
                  deleteDoc(
                    doc(
                      db,
                      "users",
                      user.uid,
                      "habitCompletions",
                      completion.id
                    )
                  )
              )
            );
          }
        }

        /**
         * TOGGLE COMPLETION
         */
        if (
          item.type ===
            "toggle-completion" &&
          item.habitId &&
          item.date &&
          typeof item.completed ===
            "boolean"
        ) {
          /**
           * If this completion belongs
           * to a local habit that was
           * just added, we cannot sync
           * it until the habit has a
           * Firebase ID.
           */
          if (
            item.habitId.startsWith(
              "local-habit-"
            )
          ) {
            /**
             * Keep it in queue.
             */
            continue;
          }

          const completionsCollection =
            getCompletionsCollection();

          const existingQuery =
            query(
              completionsCollection,
              where(
                "habitId",
                "==",
                item.habitId
              ),
              where(
                "date",
                "==",
                item.date
              )
            );

          const snapshot =
            await getDocs(
              existingQuery
            );

          if (!snapshot.empty) {
            await updateDoc(
              doc(
                db,
                "users",
                user.uid,
                "habitCompletions",
                snapshot.docs[0].id
              ),
              {
                completed:
                  item.completed,
              }
            );
          } else {
            await addDoc(
              completionsCollection,
              {
                habitId:
                  item.habitId,
                date:
                  item.date,
                completed:
                  item.completed,
                createdAt:
                  Timestamp.now(),
              }
            );
          }
        }

        /**
         * Successfully synced.
         */
        await deleteQueueItem(
          item.id
        );
      } catch (error) {
        console.error(
          "Habit sync item failed:",
          item,
          error
        );

        /**
         * Stop here so remaining
         * items can retry later.
         */
        break;
      }
    }
  };