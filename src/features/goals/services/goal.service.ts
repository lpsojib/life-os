"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  Goal,
  GoalTask,
  GoalStatus,
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
  data?: Goal | GoalTask;
  createdAt: number;
}

/* =========================================================
   INDEXED DB
========================================================= */

const DB_NAME = "life-os-goals-offline";
const DB_VERSION = 1;

const GOALS_STORE = "goals";
const TASKS_STORE = "tasks";
const QUEUE_STORE = "queue";

let databasePromise: Promise<IDBDatabase> | null =
  null;

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
): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

/* =========================================================
   INDEXED DB
========================================================= */

const openDatabase =
  (): Promise<IDBDatabase> => {
    if (typeof window === "undefined") {
      return Promise.reject(
        new Error(
          "IndexedDB is only available in the browser."
        )
      );
    }

    if (databasePromise) {
      return databasePromise;
    }

    databasePromise = new Promise(
      (resolve, reject) => {
        const request =
          indexedDB.open(
            DB_NAME,
            DB_VERSION
          );

        request.onupgradeneeded = () => {
          const database =
            request.result;

          if (
            !database.objectStoreNames.contains(
              GOALS_STORE
            )
          ) {
            database.createObjectStore(
              GOALS_STORE,
              {
                keyPath: "id",
              }
            );
          }

          if (
            !database.objectStoreNames.contains(
              TASKS_STORE
            )
          ) {
            const store =
              database.createObjectStore(
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
            !database.objectStoreNames.contains(
              QUEUE_STORE
            )
          ) {
            const store =
              database.createObjectStore(
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
          const database =
            request.result;

          database.onversionchange =
            () => {
              database.close();
              databasePromise = null;
            };

          database.onclose = () => {
            databasePromise = null;
          };

          resolve(database);
        };

        request.onerror = () => {
          databasePromise = null;

          reject(
            request.error ??
              new Error(
                "Failed to open Goal IndexedDB."
              )
          );
        };
      }
    );

    return databasePromise;
  };

/* =========================================================
   LOCAL HELPERS
========================================================= */

const putLocal = async <T>(
  storeName: string,
  data: T
): Promise<void> => {
  const database =
    await openDatabase();

  await new Promise<void>(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          storeName,
          "readwrite"
        );

      transaction
        .objectStore(storeName)
        .put(data);

      transaction.oncomplete =
        () => resolve();

      transaction.onerror = () =>
        reject(
          transaction.error ??
            new Error(
              "Local save failed."
            )
        );

      transaction.onabort = () =>
        reject(
          transaction.error ??
            new Error(
              "Local save aborted."
            )
        );
    }
  );
};

const deleteLocal = async (
  storeName: string,
  id: string
): Promise<void> => {
  const database =
    await openDatabase();

  await new Promise<void>(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          storeName,
          "readwrite"
        );

      transaction
        .objectStore(storeName)
        .delete(id);

      transaction.oncomplete =
        () => resolve();

      transaction.onerror = () =>
        reject(
          transaction.error ??
            new Error(
              "Local delete failed."
            )
        );

      transaction.onabort = () =>
        reject(
          transaction.error ??
            new Error(
              "Local delete aborted."
            )
        );
    }
  );
};

const getLocal = async <T>(
  storeName: string,
  id: string
): Promise<T | null> => {
  const database =
    await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          storeName,
          "readonly"
        );

      const request =
        transaction
          .objectStore(storeName)
          .get(id);

      request.onsuccess = () => {
        resolve(
          (request.result ??
            null) as T | null
        );
      };

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              "Local read failed."
            )
        );
      };
    }
  );
};

const getAllLocal = async <T>(
  storeName: string
): Promise<T[]> => {
  const database =
    await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          storeName,
          "readonly"
        );

      const request =
        transaction
          .objectStore(storeName)
          .getAll();

      request.onsuccess = () => {
        resolve(
          (request.result ??
            []) as T[]
        );
      };

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              "Local read failed."
            )
        );
      };
    }
  );
};

/* =========================================================
   QUEUE
========================================================= */

const queueOperation = async (
  operation: GoalQueueOperation,
  targetId: string,
  data?: Goal | GoalTask,
  goalId?: string
): Promise<void> => {
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
   EVENTS
========================================================= */

const emitGoalEvent = (
  eventName: string
): void => {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(eventName)
  );
};

/* =========================================================
   FIREBASE CONVERTERS
========================================================= */

const goalToFirestore = (
  goal: Goal
) => {
  return {
    title: goal.title,

    description:
      goal.description,

    startDate:
      goal.startDate,

    endDate:
      goal.endDate,

    status:
      goal.status,

    totalTasks:
      goal.totalTasks,

    completedTasks:
      goal.completedTasks,

    progress:
      goal.progress,

    createdAt:
      Timestamp.fromDate(
        new Date(
          goal.createdAt
        )
      ),

    updatedAt:
      Timestamp.fromDate(
        new Date(
          goal.updatedAt
        )
      ),
  };
};

const taskToFirestore = (
  task: GoalTask
) => {
  return {
    goalId:
      task.goalId,

    title:
      task.title,

    status:
      task.completed
        ? "completed"
        : "pending",

    completed:
      task.completed,

    createdAt:
      Timestamp.fromDate(
        new Date(
          task.createdAt
        )
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
        new Date(
          task.updatedAt
        )
      ),
  };
};

/* =========================================================
   FIREBASE HELPERS
========================================================= */

const getStringValue = (
  value: unknown,
  fallback = ""
): string => {
  return typeof value ===
    "string"
    ? value
    : fallback;
};

const getNumberValue = (
  value: unknown,
  fallback = 0
): number => {
  return typeof value ===
    "number"
    ? value
    : fallback;
};

const getGoalStatus = (
  value: unknown
): GoalStatus => {
  if (
    value === "completed" ||
    value === "expired" ||
    value === "active"
  ) {
    return value;
  }

  return "active";
};

const getISOString = (
  value: unknown
): string => {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate ===
      "function"
  ) {
    const date =
      value.toDate();

    if (
      date instanceof Date
    ) {
      return date.toISOString();
    }
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  return new Date().toISOString();
};

/* =========================================================
   UPDATE GOAL PROGRESS
========================================================= */

const updateLocalGoalProgress =
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

    const tasks =
      await getAllLocal<GoalTask>(
        TASKS_STORE
      );

    const goalTasks =
      tasks.filter(
        (task) =>
          task.goalId === goalId
      );

    const totalTasks =
      goalTasks.length;

    const completedTasks =
      goalTasks.filter(
        (task) =>
          task.completed
      ).length;

    const progress =
      totalTasks === 0
        ? 0
        : Math.round(
            (completedTasks /
              totalTasks) *
              100
          );

    /*
     * IMPORTANT:
     *
     * Goal নিজে complete হবে
     * শুধুমাত্র যখন সব task
     * complete হবে।
     */
    const isCompleted =
      totalTasks > 0 &&
      completedTasks ===
        totalTasks;

    const updatedGoal: Goal = {
      ...goal,

      totalTasks,

      completedTasks,

      progress,

      status: isCompleted
        ? "completed"
        : "active",

      updatedAt:
        new Date().toISOString(),
    };

    await putLocal(
      GOALS_STORE,
      updatedGoal
    );
  };

/* =========================================================
   ADD GOAL
========================================================= */

export const addGoal =
  async (
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

    if (
      !startDate ||
      !endDate
    ) {
      throw new Error(
        "শুরু ও শেষের তারিখ দিন।"
      );
    }

    if (
      endDate < startDate
    ) {
      throw new Error(
        "শেষের তারিখ শুরুর তারিখের পরে হতে হবে।"
      );
    }

    const cleanTasks =
      taskTitles
        .map((task) =>
          task.trim()
        )
        .filter(Boolean);

    const now =
      new Date().toISOString();

    const goalId =
      createId("goal");

    const goal: Goal = {
      id: goalId,

      title:
        cleanTitle,

      description:
        cleanDescription,

      startDate,

      endDate,

      status:
        "active",

      totalTasks:
        cleanTasks.length,

      completedTasks:
        0,

      progress:
        0,

      createdAt:
        now,

      updatedAt:
        now,
    };

    await putLocal(
      GOALS_STORE,
      goal
    );

    await queueOperation(
      "create-goal",
      goalId,
      goal
    );

    for (
      const taskTitle of
        cleanTasks
    ) {
      const task: GoalTask = {
        id: createId(
          "goal-task"
        ),

        goalId,

        title:
          taskTitle,

        completed:
          false,

        createdAt:
          now,

        completedAt:
          null,

        updatedAt:
          now,
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

    emitGoalEvent(
      "life-os-goal-added"
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

    return goalId;
  };

/* =========================================================
   GET ACTIVE GOALS
========================================================= */

export const getGoals =
  async (): Promise<
    Goal[]
  > => {
    getCurrentUser();

    const goals =
      await getAllLocal<Goal>(
        GOALS_STORE
      );

    return goals
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
   GET COMPLETED GOALS
========================================================= */

export const getCompletedGoals =
  async (): Promise<
    Goal[]
  > => {
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
          b.updatedAt.localeCompare(
            a.updatedAt
          )
      );
  };

/* =========================================================
   GET EXPIRED GOALS
========================================================= */

export const getExpiredGoals =
  async (): Promise<
    Goal[]
  > => {
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
          b.updatedAt.localeCompare(
            a.updatedAt
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

    if (
      !startDate ||
      !endDate
    ) {
      throw new Error(
        "শুরু ও শেষের তারিখ দিন।"
      );
    }

    if (
      endDate < startDate
    ) {
      throw new Error(
        "শেষের তারিখ শুরুর তারিখের আগে হতে পারবে না।"
      );
    }

    const updatedGoal: Goal =
      {
        ...oldGoal,

        title:
          cleanTitle,

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
    getCurrentUser();

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

    /*
     * Manual complete করার পরিবর্তে
     * task status-এর উপর নির্ভর করবো।
     */
    const total =
      goalTasks.length;

    const completed =
      goalTasks.filter(
        (task) =>
          task.completed
      ).length;

    if (
      total === 0 ||
      completed !== total
    ) {
      return;
    }

    const updatedGoal: Goal =
      {
        ...goal,

        status:
          "completed",

        totalTasks:
          total,

        completedTasks:
          completed,

        progress:
          100,

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
      "life-os-goal-completed"
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
   ADD GOAL TASK
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

      title:
        cleanTitle,

      completed:
        false,

      createdAt:
        now,

      completedAt:
        null,

      updatedAt:
        now,
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

/* =========================================================
   GET GOAL TASKS
========================================================= */

export const getGoalTasks =
  async (
    goalId: string
  ): Promise<
    GoalTask[]
  > => {
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

/* =========================================================
   TOGGLE GOAL TASK
========================================================= */

export const toggleGoalTask =
  async (
    taskId: string,
    completed: boolean
  ): Promise<void> => {
    getCurrentUser();

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

    const updatedTask: GoalTask =
      {
        ...task,

        completed,

        completedAt:
          completed
            ? new Date().toISOString()
            : null,

        updatedAt:
          new Date().toISOString(),
      };

    await putLocal(
      TASKS_STORE,
      updatedTask
    );

    /*
     * প্রথমে progress update।
     *
     * সব task complete হলে
     * Goal status completed হবে।
     */
    await updateLocalGoalProgress(
      task.goalId
    );

    const updatedGoal =
      await getLocal<Goal>(
        GOALS_STORE,
        task.goalId
      );

    await queueOperation(
      "update-task",
      taskId,
      updatedTask,
      task.goalId
    );

    /*
     * Goal completed হলে
     * Firebase-এ Goal update queue হবে।
     */
    if (
      updatedGoal &&
      updatedGoal.status ===
        "completed"
    ) {
      await queueOperation(
        "update-goal",
        updatedGoal.id,
        updatedGoal
      );

      emitGoalEvent(
        "life-os-goal-completed"
      );
    }

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
   UPDATE GOAL TASK
========================================================= */

export const updateGoalTask =
  async (
    taskId: string,
    title: string
  ): Promise<void> => {
    getCurrentUser();

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

    const updatedTask: GoalTask =
      {
        ...task,

        title:
          cleanTitle,

        updatedAt:
          new Date().toISOString(),
      };

    await putLocal(
      TASKS_STORE,
      updatedTask
    );

    await queueOperation(
      "update-task",
      taskId,
      updatedTask,
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
   DELETE GOAL TASK
========================================================= */

export const deleteGoalTask =
  async (
    taskId: string
  ): Promise<void> => {
    getCurrentUser();

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
   REFRESH GOALS FROM FIREBASE
========================================================= */

export const refreshGoalsFromFirebase =
  async (
    emitEvent = true
  ): Promise<void> => {
    if (
      typeof window ===
        "undefined" ||
      !navigator.onLine ||
      !auth.currentUser
    ) {
      return;
    }

    const snapshot =
      await getDocs(
        getGoalsCollection()
      );

    for (
      const item of snapshot.docs
    ) {
      const data =
        item.data();

      const goal: Goal = {
        id: item.id,

        title:
          getStringValue(
            data.title
          ),

        description:
          getStringValue(
            data.description
          ),

        startDate:
          getStringValue(
            data.startDate
          ),

        endDate:
          getStringValue(
            data.endDate
          ),

        status:
          getGoalStatus(
            data.status
          ),

        totalTasks:
          getNumberValue(
            data.totalTasks
          ),

        completedTasks:
          getNumberValue(
            data.completedTasks
          ),

        progress:
          getNumberValue(
            data.progress
          ),

        createdAt:
          getISOString(
            data.createdAt
          ),

        updatedAt:
          getISOString(
            data.updatedAt
          ),
      };

      await putLocal(
        GOALS_STORE,
        goal
      );
    }

    if (emitEvent) {
      emitGoalEvent(
        "life-os-goal-changed"
      );
    }
  };

/* =========================================================
   REFRESH GOAL TASKS
========================================================= */

export const refreshGoalTasksFromFirebase =
  async (
    emitEvent = true
  ): Promise<void> => {
    if (
      typeof window ===
        "undefined" ||
      !navigator.onLine ||
      !auth.currentUser
    ) {
      return;
    }

    const snapshot =
      await getDocs(
        getGoalTasksCollection()
      );

    for (
      const item of snapshot.docs
    ) {
      const data =
        item.data();

      const completed =
        typeof data.completed ===
        "boolean"
          ? data.completed
          : data.status ===
            "completed";

      const task: GoalTask = {
        id: item.id,

        goalId:
          getStringValue(
            data.goalId
          ),

        title:
          getStringValue(
            data.title
          ),

        completed,

        createdAt:
          getISOString(
            data.createdAt
          ),

        completedAt:
          data.completedAt
            ? getISOString(
                data.completedAt
              )
            : null,

        updatedAt:
          getISOString(
            data.updatedAt
          ),
      };

      await putLocal(
        TASKS_STORE,
        task
      );
    }

    /*
     * Firebase tasks update হওয়ার
     * পরে local goal progress আবার
     * calculate করা হবে।
     */
    const goals =
      await getAllLocal<Goal>(
        GOALS_STORE
      );

    for (
      const goal of goals
    ) {
      await updateLocalGoalProgress(
        goal.id
      );
    }

    if (emitEvent) {
      emitGoalEvent(
        "life-os-goal-changed"
      );
    }
  };

/* =========================================================
   SYNC
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

    if (!auth.currentUser) {
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

          break;
        }
      }

      /*
       * Sync শেষে Firebase-এর
       * latest data local-এ আনা হবে।
       */
      await refreshGoalsFromFirebase(
        false
      );

      await refreshGoalTasksFromFirebase(
        false
      );

      emitGoalEvent(
        "life-os-goal-synced"
      );

      emitGoalEvent(
        "life-os-goal-changed"
      );
    } catch (error) {
      console.error(
        "Goal sync failed:",
        error
      );
    } finally {
      syncing = false;
    }
  };

/* =========================================================
   ONLINE LISTENER
========================================================= */

if (
  typeof window !== "undefined"
) {
  window.addEventListener(
    "online",
    () => {
      void syncPendingGoals();
    }
  );
}