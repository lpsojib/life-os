"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
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
   FIRESTORE COLLECTION DELETE
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

  await Promise.all(
    snapshot.docs.map((item) =>
      deleteDoc(item.ref),
    ),
  );
};

/* =========================================================
   INDEXED DB
========================================================= */

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
         * Don't create a new database
         * just because reset was clicked.
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
              `Unable to open IndexedDB: ${databaseName}`,
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
   CLEAR INDEXED DB STORE
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
   * OFFLINE
   *
   * Existing task system:
   *
   * tasks:{uid}
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
   * FIREBASE HABITS
   * -------------------------------------------------------
   */

  await deleteFirebaseCollection(
    "habits",
  );

  /*
   * -------------------------------------------------------
   * FIREBASE COMPLETIONS
   * -------------------------------------------------------
   */

  await deleteFirebaseCollection(
    "habitCompletions",
  );

  /*
   * -------------------------------------------------------
   * LOCAL HABIT DATABASE
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
  const user = getCurrentUser();

  /*
   * -------------------------------------------------------
   * FIREBASE
   *
   * users/{uid}/notes
   * -------------------------------------------------------
   */

  await deleteFirebaseCollection(
    "notes",
  );

  /*
   * -------------------------------------------------------
   * LOCAL
   *
   * life-os-notebook
   * └── notes
   * -------------------------------------------------------
   */

  await clearIndexedDBStore(
    "life-os-notebook",
    "notes",
  );

  void user;
};

/* =========================================================
   FOCUS TIMER
========================================================= */

const resetFocus = async (): Promise<void> => {
  const user = getCurrentUser();

  /*
   * -------------------------------------------------------
   * FIREBASE
   *
   * Exact structure from your Focus service:
   *
   * users/{uid}/focusTimer/main
   * -------------------------------------------------------
   */

  const focusTimerRef = doc(
    db,
    "users",
    user.uid,
    "focusTimer",
    "main",
  );

  /*
   * Restore the timer to its original
   * default/reset state.
   *
   * We do NOT delete the document because
   * your Focus service expects this timer
   * document to exist and loads it by "main".
   */

  await setDoc(
    focusTimerRef,
    {
      id: "main",
      title: "Focus Timer",
      startedAt: null,
      elapsed: 0,
      running: false,
      createdAt: Date.now(),
    },
    {
      merge: true,
    },
  );
};

/* =========================================================
   AI
========================================================= */

const resetAI = async (): Promise<void> => {
  /*
   * AI reset intentionally does nothing for now.
   *
   * We need the actual AI service/storage code
   * before deleting anything.
   *
   * This prevents accidental deletion of a
   * wrong Firebase collection.
   */
};

/* =========================================================
   MAIN RESET
========================================================= */

export const resetSelectedData = async (
  selectedModules: ResetModule[],
): Promise<void> => {
  const user = getCurrentUser();

  /*
   * Prevent empty reset.
   */
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
   * Reset selected modules one by one.
   *
   * IMPORTANT:
   * We use resetModule instead of module
   * to avoid the Next.js ESLint error.
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

      case "ai":
        await resetAI();
        break;

      /*
       * Finance and Reminder are intentionally
       * not handled at this stage.
       */
      case "finance":
      case "reminder":
        break;

      default:
        break;
    }
  }

  /*
   * -------------------------------------------------------
   * RESET EVENT
   * -------------------------------------------------------
   *
   * Components can listen to this event and
   * reload their current state without a
   * complete page refresh.
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

export const resetAIData =
  async (): Promise<void> => {
    await resetAI();
  };