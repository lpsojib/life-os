"use client";

import {
  collection,
  deleteDoc,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  deleteOfflineData,
  getOfflineCollection,
} from "@/lib/offline/db";

import type {
  ResetModule,
} from "../types/settings.types";

/* =========================================================
   TYPES
========================================================= */

interface OfflineTaskData {
  operation?: string;
  task?: {
    id?: string;
  };
}

/* =========================================================
   AUTH
========================================================= */

const getCurrentUser = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  return user;
};

/* =========================================================
   FIREBASE
========================================================= */

const deleteFirebaseCollection = async (
  collectionName: string,
): Promise<void> => {
  const user = getCurrentUser();

  const collectionRef = collection(
    db,
    "users",
    user.uid,
    collectionName,
  );

  const snapshot =
    await getDocs(collectionRef);

  if (snapshot.empty) {
    return;
  }

  /*
   * Delete all documents belonging to
   * the current authenticated user.
   */
  await Promise.all(
    snapshot.docs.map((item) =>
      deleteDoc(item.ref),
    ),
  );
};

/* =========================================================
   INDEXED DB
========================================================= */

const clearIndexedDBStore = async (
  databaseName: string,
  storeName: string,
): Promise<void> => {
  if (
    typeof window === "undefined" ||
    !("indexedDB" in window)
  ) {
    return;
  }

  const database =
    await openExistingDatabase(
      databaseName,
    );

  if (!database) {
    return;
  }

  if (
    !database.objectStoreNames.contains(
      storeName,
    )
  ) {
    database.close();
    return;
  }

  await new Promise<void>(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          storeName,
          "readwrite",
        );

      transaction
        .objectStore(storeName)
        .clear();

      transaction.oncomplete = () => {
        database.close();
        resolve();
      };

      transaction.onerror = () => {
        const error =
          transaction.error ??
          new Error(
            `Failed to clear ${storeName}.`,
          );

        database.close();
        reject(error);
      };

      transaction.onabort = () => {
        const error =
          transaction.error ??
          new Error(
            `Transaction aborted for ${storeName}.`,
          );

        database.close();
        reject(error);
      };
    },
  );
};

/**
 * Open an existing database without creating
 * a new database during reset.
 */
const openExistingDatabase = (
  databaseName: string,
): Promise<IDBDatabase | null> => {
  return new Promise(
    (resolve, reject) => {
      if (
        typeof window === "undefined" ||
        !("indexedDB" in window)
      ) {
        resolve(null);
        return;
      }

      const request =
        window.indexedDB.open(
          databaseName,
        );

      let databaseDidNotExist = false;

      request.onupgradeneeded = () => {
        /*
         * If the database didn't exist before,
         * don't create an empty database just
         * because Reset was clicked.
         */
        databaseDidNotExist = true;

        try {
          request.transaction?.abort();
        } catch {
          // Ignore abort error.
        }
      };

      request.onsuccess = () => {
        const database = request.result;

        if (databaseDidNotExist) {
          database.close();
          resolve(null);
          return;
        }

        resolve(database);
      };

      request.onerror = () => {
        if (
          request.error?.name ===
          "NotFoundError"
        ) {
          resolve(null);
          return;
        }

        reject(
          request.error ??
            new Error(
              `Unable to open ${databaseName}.`,
            ),
        );
      };

      request.onblocked = () => {
        reject(
          new Error(
            `IndexedDB "${databaseName}" is blocked.`,
          ),
        );
      };
    },
  );
};

/* =========================================================
   TASKS
========================================================= */

const resetTasks = async (): Promise<void> => {
  const user = getCurrentUser();

  /*
   * -------------------------------------------------------
   * FIREBASE
   *
   * users/{uid}/tasks
   * -------------------------------------------------------
   */

  await deleteFirebaseCollection(
    "tasks",
  );

  /*
   * -------------------------------------------------------
   * LOCAL TASKS
   *
   * Existing task service uses:
   *
   * collection:
   * tasks:{uid}
   *
   * record ID:
   * task:{uid}:{taskId}
   *
   * We delete every local task record belonging
   * to this user.
   * -------------------------------------------------------
   */

  const localTasks =
    await getOfflineCollection(
      `tasks:${user.uid}`,
    );

  if (localTasks.length > 0) {
    await Promise.all(
      localTasks.map((record) =>
        deleteOfflineData(
          record.id,
        ),
      ),
    );
  }
};

/* =========================================================
   HABITS
========================================================= */

const resetHabits = async (): Promise<void> => {
  /*
   * -------------------------------------------------------
   * FIREBASE
   * -------------------------------------------------------
   */

  await deleteFirebaseCollection(
    "habits",
  );

  await deleteFirebaseCollection(
    "habitCompletions",
  );

  /*
   * -------------------------------------------------------
   * LOCAL
   *
   * Existing habit service uses:
   *
   * life-os-db
   *
   * habits
   * habitCompletions
   * habitSyncQueue
   * -------------------------------------------------------
   */

  await clearIndexedDBStore(
    "life-os-db",
    "habits",
  );

  await clearIndexedDBStore(
    "life-os-db",
    "habitCompletions",
  );

  await clearIndexedDBStore(
    "life-os-db",
    "habitSyncQueue",
  );
};

/* =========================================================
   GOALS
========================================================= */

const resetGoals = async (): Promise<void> => {
  /*
   * -------------------------------------------------------
   * FIREBASE
   *
   * users/{uid}/goals
   * users/{uid}/goalTasks
   * -------------------------------------------------------
   */

  await deleteFirebaseCollection(
    "goals",
  );

  await deleteFirebaseCollection(
    "goalTasks",
  );

  /*
   * -------------------------------------------------------
   * LOCAL
   *
   * Clear only stores that already exist.
   * -------------------------------------------------------
   */

  await clearIndexedDBStore(
    "life-os-offline",
    "goals",
  );

  await clearIndexedDBStore(
    "life-os-offline",
    "goalTasks",
  );

  await clearIndexedDBStore(
    "life-os-offline",
    "goalSyncQueue",
  );
};

/* =========================================================
   NOTEBOOK
========================================================= */

const resetNotebook = async (): Promise<void> => {
  /*
   * Notebook local database from the
   * existing Life OS offline architecture:
   *
   * life-os-notebook
   * └── notes
   */

  await clearIndexedDBStore(
    "life-os-notebook",
    "notes",
  );

  /*
   * NOTE:
   * Firebase Notebook deletion is NOT guessed.
   *
   * If your Notebook service has a Firebase
   * collection, we will connect that exact
   * collection separately.
   */
};

/* =========================================================
   FOCUS
========================================================= */

const resetFocus = async (): Promise<void> => {
  /*
   * Clear only stores that actually exist.
   * Missing stores are ignored.
   */

  await clearIndexedDBStore(
    "life-os-offline",
    "focus",
  );

  await clearIndexedDBStore(
    "life-os-offline",
    "focusSessions",
  );

  await clearIndexedDBStore(
    "life-os-offline",
    "timer",
  );
};

/* =========================================================
   FINANCE
========================================================= */

const resetFinance = async (): Promise<void> => {
  /*
   * We intentionally don't guess a Firebase
   * collection name.
   *
   * Only existing local stores are cleared.
   */

  await clearIndexedDBStore(
    "life-os-offline",
    "finance",
  );

  await clearIndexedDBStore(
    "life-os-offline",
    "transactions",
  );
};

/* =========================================================
   REMINDER
========================================================= */

const resetReminder = async (): Promise<void> => {
  /*
   * Clear local reminder/alarm data if
   * these stores exist.
   */

  await clearIndexedDBStore(
    "life-os-offline",
    "reminders",
  );

  await clearIndexedDBStore(
    "life-os-offline",
    "alarms",
  );
};

/* =========================================================
   AI
========================================================= */

const resetAI = async (): Promise<void> => {
  await clearIndexedDBStore(
    "life-os-offline",
    "ai",
  );

  await clearIndexedDBStore(
    "life-os-offline",
    "aiData",
  );
};

/* =========================================================
   MAIN RESET
========================================================= */

export const resetSelectedData = async (
  selectedModules: ResetModule[],
): Promise<void> => {
  /*
   * Authentication is required.
   */
  const user = getCurrentUser();

  if (
    !selectedModules ||
    selectedModules.length === 0
  ) {
    throw new Error(
      "No reset option selected.",
    );
  }

  /*
   * Remove duplicate selections.
   */
  const uniqueModules =
    Array.from(
      new Set(selectedModules),
    );

  /*
   * -------------------------------------------------------
   * RESET ONE BY ONE
   *
   * Doing this sequentially makes it easier
   * to identify which module failed.
   * -------------------------------------------------------
   */

  for (const resetModule of uniqueModules) {
    switch (resetModule) {
      case "tasks":
        await resetTasks();
        break;

      case "habits":
        await resetHabits();
        break;

      case "goals":
        await resetGoals();
        break;

      case "notebook":
        await resetNotebook();
        break;

      case "focus":
        await resetFocus();
        break;

      case "finance":
        await resetFinance();
        break;

      case "reminder":
        await resetReminder();
        break;

      case "ai":
        await resetAI();
        break;

      default:
        break;
    }
  }

  /*
   * -------------------------------------------------------
   * RESET EVENTS
   * -------------------------------------------------------
   *
   * Other Life OS components can listen to
   * these events and reload their state.
   */

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(
        "life-os-data-reset",
        {
          detail: {
            uid: user.uid,
            modules: uniqueModules,
          },
        },
      ),
    );

    window.dispatchEvent(
      new CustomEvent(
        "life-os-data-reset-complete",
        {
          detail: {
            uid: user.uid,
            modules: uniqueModules,
          },
        },
      ),
    );
  }
};

/* =========================================================
   INDIVIDUAL EXPORTS
========================================================= */

export const resetTasksData =
  async (): Promise<void> => {
    await resetTasks();
  };

export const resetHabitsData =
  async (): Promise<void> => {
    await resetHabits();
  };

export const resetGoalsData =
  async (): Promise<void> => {
    await resetGoals();
  };

export const resetNotebookData =
  async (): Promise<void> => {
    await resetNotebook();
  };

export const resetFocusData =
  async (): Promise<void> => {
    await resetFocus();
  };

export const resetFinanceData =
  async (): Promise<void> => {
    await resetFinance();
  };

export const resetReminderData =
  async (): Promise<void> => {
    await resetReminder();
  };

export const resetAIData =
  async (): Promise<void> => {
    await resetAI();
  };