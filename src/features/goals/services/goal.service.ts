"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  Goal,
  GoalStatus,
  GoalTask,
} from "../types/goal.types";

/* =========================================================
   TYPES
========================================================= */

type GoalQueueOperation =
  | "create-goal"
  | "update-goal"
  | "delete-goal"
  | "create-task"
  | "update-task"
  | "delete-task";

interface GoalQueueItem {
  id: string;
  operation: GoalQueueOperation;
  targetId: string;
  goalId?: string;
  data?: unknown;
  createdAt: number;
}

/* =========================================================
   CONSTANTS
========================================================= */

const DB_NAME = "life-os-goals-offline";
const DB_VERSION = 1;

const GOALS_STORE = "goals";
const TASKS_STORE = "tasks";
const QUEUE_STORE = "queue";

/* =========================================================
   USER
========================================================= */

const getCurrentUser = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated."
    );
  }

  return user;
};

/* =========================================================
   FIREBASE COLLECTIONS
========================================================= */

const getGoalsCollection = () => {
  const user = getCurrentUser();

  return collection(
    db,
    "users",
    user.uid,
    "goals"
  );
};

const getGoalTasksCollection = () => {
  const user = getCurrentUser();

  return collection(
    db,
    "users",
    user.uid,
    "goalTasks"
  );
};

/* =========================================================
   ID
========================================================= */

const createId = (
  prefix: string
) => {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

/* =========================================================
   INDEXED DB
========================================================= */

let dbPromise:
  | Promise<IDBDatabase>
  | null = null;

const openDatabase =
  (): Promise<IDBDatabase> => {
    if (
      typeof window === "undefined"
    ) {
      return Promise.reject(
        new Error(
          "IndexedDB is only available in the browser."
        )
      );
    }

    if (dbPromise) {
      return dbPromise;
    }

    dbPromise = new Promise(
      (resolve, reject) => {
        const request =
          indexedDB.open(
            DB_NAME,
            DB_VERSION
          );

        request.onerror = () => {
          dbPromise = null;

          reject(
            request.error ??
              new Error(
                "Failed to open Goal IndexedDB."
              )
          );
        };

        request.onupgradeneeded = () => {
          const db =
            request.result;

          if (
            !db.objectStoreNames.contains(
              GOALS_STORE
            )
          ) {
            db.createObjectStore(
              GOALS_STORE,
              {
                keyPath: "id",
              }
            );
          }

          if (
            !db.objectStoreNames.contains(
              TASKS_STORE
            )
          ) {
            const store =
              db.createObjectStore(
                TASKS_STORE,
                {
                  keyPath: "id",
                }
              );

            store.createIndex(
              "goalId",
              "goalId",
              {
                unique: false,
              }
            );
          }

          if (
            !db.objectStoreNames.contains(
              QUEUE_STORE
            )
          ) {
            const store =
              db.createObjectStore(
                QUEUE_STORE,
                {
                  keyPath: "id",
                }
              );

            store.createIndex(
              "createdAt",
              "createdAt",
              {
                unique: false,
              }
            );
          }
        };

        request.onsuccess = () => {
          const db =
            request.result;

          db.onclose = () => {
            dbPromise = null;
          };

          db.onversionchange = () => {
            db.close();
            dbPromise = null;
          };

          resolve(db);
        };
      }
    );

    return dbPromise;
  };

/* =========================================================
   INDEXED DB HELPERS
========================================================= */

const putLocal = async (
  storeName: string,
  data: unknown
): Promise<void> => {
  const db =
    await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const tx =
        db.transaction(
          storeName,
          "readwrite"
        );

      tx.objectStore(
        storeName
      ).put(data);

      tx.oncomplete = () =>
        resolve();

      tx.onerror = () =>
        reject(
          tx.error ??
            new Error(
              "Local save failed."
            )
        );
    }
  );
};

const deleteLocal = async (
  storeName: string,
  id: string
): Promise<void> => {
  const db =
    await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const tx =
        db.transaction(
          storeName,
          "readwrite"
        );

      tx.objectStore(
        storeName
      ).delete(id);

      tx.oncomplete = () =>
        resolve();

      tx.onerror = () =>
        reject(
          tx.error ??
            new Error(
              "Local delete failed."
            )
        );
    }
  );
};

const getAllLocal = async <T>(
  storeName: string
): Promise<T[]> => {
  const db =
    await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const tx =
        db.transaction(
          storeName,
          "readonly"
        );

      const request =
        tx.objectStore(
          storeName
        ).getAll();

      request.onsuccess = () =>
        resolve(
          request.result ?? []
        );

      request.onerror = () =>
        reject(
          request.error ??
            new Error(
              "Local read failed."
            )
        );
    }
  );
};

const getLocal = async <T>(
  storeName: string,
  id: string
): Promise<T | null> => {
  const db =
    await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const tx =
        db.transaction(
          storeName,
          "readonly"
        );

      const request =
        tx.objectStore(
          storeName
        ).get(id);

      request.onsuccess = () =>
        resolve(
          request.result ?? null
        );

      request.onerror = () =>
        reject(
          request.error ??
            new Error(
              "Local read failed."
            )
        );
    }
  );
};

/* =========================================================
   QUEUE
========================================================= */

const queueOperation = async (
  operation: GoalQueueOperation,
  targetId: string,
  data?: unknown,
  goalId?: string
) => {
  const item: GoalQueueItem = {
    id: createId("queue"),
    operation,
    targetId,
    goalId,
    data,
    createdAt: Date.now(),
  };

  await putLocal(
    QUEUE_STORE,
    item
  );
};

const getQueue =
  async (): Promise<
    GoalQueueItem[]
  > => {
    const items =
      await getAllLocal<GoalQueueItem>(
        QUEUE_STORE
      );

    return items.sort(
      (a, b) =>
        a.createdAt -
        b.createdAt
    );
  };

/* =========================================================
   HELPERS
========================================================= */

const emitGoalEvent = (
  eventName: string
) => {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(eventName)
  );
};

const goalToFirestore = (
  goal: Goal
) => ({
  title: goal.title,
  description: goal.description,
  startDate: goal.startDate,
  endDate: goal.endDate,
  status: goal.status,
  totalTasks: goal.totalTasks,
  completedTasks:
    goal.completedTasks,
  progress: goal.progress,
  createdAt:
    Timestamp.fromDate(
      new Date(goal.createdAt)
    ),
  updatedAt:
    Timestamp.fromDate(
      new Date(goal.updatedAt)
    ),
});

const taskToFirestore = (
  task: GoalTask
) => ({
  goalId: task.goalId,
  title: task.title,
  status: task.completed
    ? "completed"
    : "pending",
  createdAt:
    Timestamp.fromDate(
      new Date(task.createdAt)
    ),
  completedAt:
    task.completedAt
      ? Timestamp.fromDate(
          new Date(
            task.completedAt
          )
        )
      : null,
  updatedAt:
    Timestamp.fromDate(
      new Date(task.updatedAt)
    ),
});

/* =========================================================
   CREATE GOAL
========================================================= */

export const addGoal = async (
  title: string,
  description: string,
  startDate: string,
  endDate: string,
  taskTitles: string[] = []
): Promise<string> => {
  getCurrentUser();

  const cleanTitle =
    title.trim();

  const cleanDescription =
    description.trim();

  if (!cleanTitle) {
    throw new Error(
      "লক্ষ্যের নাম লিখুন।"
    );
  }

  if (!startDate || !endDate) {
    throw new Error(
      "শুরু ও শেষের তারিখ দিন।"
    );
  }

  if (endDate < startDate) {
    throw new Error(
      "শেষের তারিখ শুরুর তারিখের পরে হতে হবে।"
    );
  }

  const cleanTasks =
    taskTitles
      .map((task) => task.trim())
      .filter(Boolean);

  const now =
    new Date().toISOString();

  const goalId =
    createId("goal");

  const goal: Goal = {
    id: goalId,
    title: cleanTitle,
    description: cleanDescription,
    startDate,
    endDate,
    status: "active",
    totalTasks:
      cleanTasks.length,
    completedTasks: 0,
    progress: 0,
    createdAt: now,
    updatedAt: now,
  };

  /*
   * LOCAL FIRST
   */
  await putLocal(
    GOALS_STORE,
    goal
  );

  /*
   * Create local tasks immediately.
   */
  for (
    const taskTitle of cleanTasks
  ) {
    const task: GoalTask = {
      id: createId("goal-task"),
      goalId,
      title: taskTitle,
      completed: false,
      createdAt: now,
      completedAt: null,
      updatedAt: now,
    };

    await putLocal(
      TASKS_STORE,
      task
    );

    await queueOperation(
      "create-task",
      task.id,
      task,
      goalId
    );
  }

  await queueOperation(
    "create-goal",
    goalId,
    goal
  );

  /*
   * UI immediately.
   */
  emitGoalEvent(
    "life-os-goal-changed"
  );

  /*
   * Firebase background.
   */
  if (
    typeof window !==
      "undefined" &&
    navigator.onLine
  ) {
    void syncPendingGoals();
  }

  return goalId;
};

/* =========================================================
   GET ACTIVE GOALS
========================================================= */

export const getGoals =
  async (): Promise<Goal[]> => {
    getCurrentUser();

    const localGoals =
      await getAllLocal<Goal>(
        GOALS_STORE
      );

    return localGoals
      .filter(
        (goal) =>
          goal.status ===
          "active"
      )
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(
            a.createdAt
          )
      );
  };

/* =========================================================
   COMPLETED
========================================================= */

export const getCompletedGoals =
  async (): Promise<Goal[]> => {
    getCurrentUser();

    const goals =
      await getAllLocal<Goal>(
        GOALS_STORE
      );

    return goals
      .filter(
        (goal) =>
          goal.status ===
          "completed"
      )
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(
            a.createdAt
          )
      );
  };

/* =========================================================
   EXPIRED
========================================================= */

export const getExpiredGoals =
  async (): Promise<Goal[]> => {
    getCurrentUser();

    const goals =
      await getAllLocal<Goal>(
        GOALS_STORE
      );

    return goals
      .filter(
        (goal) =>
          goal.status ===
          "expired"
      )
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(
            a.createdAt
          )
      );
};

/* =========================================================
   UPDATE GOAL
========================================================= */

export const updateGoal =
  async (
    goalId: string,
    title: string,
    description: string,
    startDate: string,
    endDate: string
  ): Promise<void> => {
    getCurrentUser();

    const oldGoal =
      await getLocal<Goal>(
        GOALS_STORE,
        goalId
      );

    if (!oldGoal) {
      throw new Error(
        "লক্ষ্যটি খুঁজে পাওয়া যায়নি।"
      );
    }

    const cleanTitle =
      title.trim();

    if (!cleanTitle) {
      throw new Error(
        "লক্ষ্যের নাম লিখুন।"
      );
    }

    if (endDate < startDate) {
      throw new Error(
        "শেষের তারিখ শুরুর তারিখের আগে হতে পারবে না।"
      );
    }

    const updatedGoal: Goal = {
      ...oldGoal,
      title: cleanTitle,
      description:
        description.trim(),
      startDate,
      endDate,
      updatedAt:
        new Date().toISOString(),
    };

    await putLocal(
      GOALS_STORE,
      updatedGoal
    );

    await queueOperation(
      "update-goal",
      goalId,
      updatedGoal
    );

    emitGoalEvent(
      "life-os-goal-changed"
    );

    if (
      typeof window !==
        "undefined" &&
      navigator.onLine
    ) {
      void syncPendingGoals();
    }
  };

/* =========================================================
   DELETE GOAL
========================================================= */

export const deleteGoal =
  async (
    goalId: string
  ): Promise<void> => {
    getCurrentUser();

    const tasks =
      await getAllLocal<GoalTask>(
        TASKS_STORE
      );

    const goalTasks =
      tasks.filter(
        (task) =>
          task.goalId ===
          goalId
      );

    /*
     * Delete local tasks.
     */
    for (
      const task of goalTasks
    ) {
      await deleteLocal(
        TASKS_STORE,
        task.id
      );

      await queueOperation(
        "delete-task",
        task.id,
        undefined,
        goalId
      );
    }

    /*
     * Delete local goal.
     */
    await deleteLocal(
      GOALS_STORE,
      goalId
    );

    await queueOperation(
      "delete-goal",
      goalId
    );

    emitGoalEvent(
      "life-os-goal-changed"
    );

    if (
      typeof window !==
        "undefined" &&
      navigator.onLine
    ) {
      void syncPendingGoals();
    }
  };

/* =========================================================
   COMPLETE GOAL
========================================================= */

export const completeGoal =
  async (
    goalId: string
  ): Promise<void> => {
    const goal =
      await getLocal<Goal>(
        GOALS_STORE,
        goalId
      );

    if (!goal) {
      return;
    }

    const updated: Goal = {
      ...goal,
      status: "completed",
      progress: 100,
      updatedAt:
        new Date().toISOString(),
    };

    await putLocal(
      GOALS_STORE,
      updated
    );

    await queueOperation(
      "update-goal",
      goalId,
      updated
    );

    emitGoalEvent(
      "life-os-goal-changed"
    );

    if (
      typeof window !==
        "undefined" &&
      navigator.onLine
    ) {
      void syncPendingGoals();
    }
  };

/* =========================================================
   GOAL TASKS
========================================================= */

export const addGoalTask =
  async (
    goalId: string,
    title: string
  ): Promise<string> => {
    getCurrentUser();

    const cleanTitle =
      title.trim();

    if (!cleanTitle) {
      throw new Error(
        "টাস্কের নাম লিখুন।"
      );
    }

    const goal =
      await getLocal<Goal>(
        GOALS_STORE,
        goalId
      );

    if (!goal) {
      throw new Error(
        "লক্ষ্যটি খুঁজে পাওয়া যায়নি।"
      );
    }

    const now =
      new Date().toISOString();

    const task: GoalTask = {
      id: createId(
        "goal-task"
      ),
      goalId,
      title: cleanTitle,
      completed: false,
      createdAt: now,
      completedAt: null,
      updatedAt: now,
    };

    await putLocal(
      TASKS_STORE,
      task
    );

    await updateLocalGoalProgress(
      goalId
    );

    await queueOperation(
      "create-task",
      task.id,
      task,
      goalId
    );

    emitGoalEvent(
      "life-os-goal-changed"
    );

    if (
      typeof window !==
        "undefined" &&
      navigator.onLine
    ) {
      void syncPendingGoals();
    }

    return task.id;
  };

export const getGoalTasks =
  async (
    goalId: string
  ): Promise<GoalTask[]> => {
    getCurrentUser();

    const tasks =
      await getAllLocal<GoalTask>(
        TASKS_STORE
      );

    return tasks
      .filter(
        (task) =>
          task.goalId ===
          goalId
      )
      .sort(
        (a, b) =>
          a.createdAt.localeCompare(
            b.createdAt
          )
      );
  };

export const toggleGoalTask =
  async (
    taskId: string,
    completed: boolean
  ): Promise<void> => {
    const task =
      await getLocal<GoalTask>(
        TASKS_STORE,
        taskId
      );

    if (!task) {
      throw new Error(
        "Goal task not found."
      );
    }

    const updated: GoalTask = {
      ...task,
      completed,
      completedAt: completed
        ? new Date().toISOString()
        : null,
      updatedAt:
        new Date().toISOString(),
    };

    await putLocal(
      TASKS_STORE,
      updated
    );

    await updateLocalGoalProgress(
      task.goalId
    );

    await queueOperation(
      "update-task",
      taskId,
      updated,
      task.goalId
    );

    emitGoalEvent(
      "life-os-goal-changed"
    );

    if (
      typeof window !==
        "undefined" &&
      navigator.onLine
    ) {
      void syncPendingGoals();
    }
  };

export const updateGoalTask =
  async (
    taskId: string,
    title: string
  ): Promise<void> => {
    const task =
      await getLocal<GoalTask>(
        TASKS_STORE,
        taskId
      );

    if (!task) {
      throw new Error(
        "Goal task not found."
      );
    }

    const cleanTitle =
      title.trim();

    if (!cleanTitle) {
      throw new Error(
        "টাস্কের নাম লিখুন।"
      );
    }

    const updated: GoalTask = {
      ...task,
      title: cleanTitle,
      updatedAt:
        new Date().toISOString(),
    };

    await putLocal(
      TASKS_STORE,
      updated
    );

    await queueOperation(
      "update-task",
      taskId,
      updated,
      task.goalId
    );

    emitGoalEvent(
      "life-os-goal-changed"
    );

    if (
      typeof window !==
        "undefined" &&
      navigator.onLine
    ) {
      void syncPendingGoals();
    }
  };

export const deleteGoalTask =
  async (
    taskId: string
  ): Promise<void> => {
    const task =
      await getLocal<GoalTask>(
        TASKS_STORE,
        taskId
      );

    if (!task) {
      return;
    }

    await deleteLocal(
      TASKS_STORE,
      taskId
    );

    await updateLocalGoalProgress(
      task.goalId
    );

    await queueOperation(
      "delete-task",
      taskId,
      undefined,
      task.goalId
    );

    emitGoalEvent(
      "life-os-goal-changed"
    );

    if (
      typeof window !==
        "undefined" &&
      navigator.onLine
    ) {
      void syncPendingGoals();
    }
  };

/* =========================================================
   LOCAL PROGRESS
========================================================= */

const updateLocalGoalProgress =
  async (
    goalId: string
  ) => {
    const goal =
      await getLocal<Goal>(
        GOALS_STORE,
        goalId
      );

    if (!goal) {
      return;
    }

    const tasks =
      await getAllLocal<GoalTask>(
        TASKS_STORE
      );

    const goalTasks =
      tasks.filter(
        (task) =>
          task.goalId ===
          goalId
      );

    const totalTasks =
      goalTasks.length;

    const completedTasks =
      goalTasks.filter(
        (task) =>
          task.completed
      ).length;

    const progress =
      totalTasks > 0
        ? Math.round(
            (completedTasks /
              totalTasks) *
              100
          )
        : 0;

    const updated: Goal = {
      ...goal,
      totalTasks,
      completedTasks,
      progress,
      status:
        totalTasks > 0 &&
        completedTasks ===
          totalTasks
          ? "completed"
          : "active",
      updatedAt:
        new Date().toISOString(),
    };

    await putLocal(
      GOALS_STORE,
      updated
    );

    await queueOperation(
      "update-goal",
      goalId,
      updated
    );
  };

/* =========================================================
   BACKGROUND SYNC
========================================================= */

let syncing = false;

export const syncPendingGoals =
  async (): Promise<void> => {
    if (syncing) {
      return;
    }

    if (
      typeof window !==
        "undefined" &&
      !navigator.onLine
    ) {
      return;
    }

    syncing = true;

    try {
      const queue =
        await getQueue();

      for (
        const item of queue
      ) {
        try {
          const user =
            auth.currentUser;

          if (!user) {
            break;
          }

          switch (
            item.operation
          ) {
            case "create-goal": {
              const goal =
                item.data as Goal;

              await setDoc(
                doc(
                  db,
                  "users",
                  user.uid,
                  "goals",
                  item.targetId
                ),
                goalToFirestore(
                  goal
                )
              );

              break;
            }

            case "update-goal": {
              const goal =
                item.data as Goal;

              await setDoc(
                doc(
                  db,
                  "users",
                  user.uid,
                  "goals",
                  item.targetId
                ),
                goalToFirestore(
                  goal
                ),
                {
                  merge: true,
                }
              );

              break;
            }

            case "delete-goal": {
              await deleteDoc(
                doc(
                  db,
                  "users",
                  user.uid,
                  "goals",
                  item.targetId
                )
              );

              break;
            }

            case "create-task": {
              const task =
                item.data as GoalTask;

              await setDoc(
                doc(
                  db,
                  "users",
                  user.uid,
                  "goalTasks",
                  item.targetId
                ),
                taskToFirestore(
                  task
                )
              );

              break;
            }

            case "update-task": {
              const task =
                item.data as GoalTask;

              await setDoc(
                doc(
                  db,
                  "users",
                  user.uid,
                  "goalTasks",
                  item.targetId
                ),
                taskToFirestore(
                  task
                ),
                {
                  merge: true,
                }
              );

              break;
            }

            case "delete-task": {
              await deleteDoc(
                doc(
                  db,
                  "users",
                  user.uid,
                  "goalTasks",
                  item.targetId
                )
              );

              break;
            }
          }

          await deleteLocal(
            QUEUE_STORE,
            item.id
          );
        } catch (error) {
          console.error(
            "Goal sync item failed:",
            error
          );

          /*
           * Stop here.
           * Keep queue item for next retry.
           */
          break;
        }
      }

      emitGoalEvent(
        "life-os-goal-synced"
      );
    } finally {
      syncing = false;
    }
  };

/* =========================================================
   ONLINE LISTENER
========================================================= */

if (
  typeof window !==
  "undefined"
) {
  window.addEventListener(
    "online",
    () => {
      void syncPendingGoals();
    }
  );
}