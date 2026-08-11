import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  getOfflineCollection,
  getOfflineData,
  getPendingOfflineData,
  markOfflineDataSynced,
  saveOfflineData,
} from "@/lib/offline/db";

import {
  LifeArea,
  Task,
  TaskPriority,
  TaskStatus,
} from "../types/task.types";

/* =========================================================
   TYPES
   ========================================================= */

type OfflineTaskOperation =
  | "create"
  | "update"
  | "delete";

interface OfflineTaskData {
  operation: OfflineTaskOperation;
  task: Task;
}

/* =========================================================
   HELPERS
   ========================================================= */

/**
 * Get current authenticated user.
 */
const getCurrentUser = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return user;
};

/**
 * Get current user's Firestore tasks collection.
 */
const getTasksCollection = () => {
  const user = getCurrentUser();

  return collection(
    db,
    "users",
    user.uid,
    "tasks"
  );
};

/**
 * Get today's local date.
 *
 * Format:
 * YYYY-MM-DD
 */
const getTodayString = (): string => {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
};

/**
 * Generate local task ID.
 */
const generateTaskId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

/**
 * Check whether browser is online.
 */
const isOnline = (): boolean => {
  return (
    typeof window !== "undefined" &&
    navigator.onLine
  );
};

/**
 * Convert Firestore task to application Task.
 */
const firestoreTaskToTask = (
  id: string,
  data: Record<string, unknown>
): Task => {
  const createdAt =
    data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : new Date().toISOString();

  const completedAt =
    data.completedAt instanceof Timestamp
      ? data.completedAt.toDate().toISOString()
      : null;

  return {
    id,

    title:
      typeof data.title === "string"
        ? data.title
        : "",

    description:
      typeof data.description === "string"
        ? data.description
        : "",

    lifeArea:
      data.lifeArea as LifeArea,

    priority:
      data.priority as TaskPriority,

    goalId:
      typeof data.goalId === "string"
        ? data.goalId
        : null,

    status:
      data.status as TaskStatus,

    activeDate:
      typeof data.activeDate === "string"
        ? data.activeDate
        : null,

    order:
      typeof data.order === "number"
        ? data.order
        : 0,

    createdAt,

    completedAt,
  };
};

/**
 * Convert application Task to Firestore data.
 */
const taskToFirestoreData = (
  task: Task
) => {
  return {
    title: task.title,
    description: task.description,
    lifeArea: task.lifeArea,
    priority: task.priority,
    goalId: task.goalId,
    status: task.status,
    activeDate: task.activeDate,
    order: task.order,

    createdAt: Timestamp.fromDate(
      new Date(task.createdAt)
    ),

    completedAt:
      task.completedAt
        ? Timestamp.fromDate(
            new Date(task.completedAt)
          )
        : null,
  };
};

/**
 * Save task operation into IndexedDB.
 */
const saveLocalTask = async (
  task: Task,
  operation: OfflineTaskOperation
): Promise<void> => {
  const user = getCurrentUser();

  const recordId =
    `task:${user.uid}:${task.id}`;

  const data: OfflineTaskData = {
    operation,
    task,
  };

  await saveOfflineData({
    id: recordId,
    collection: `tasks:${user.uid}`,
    data,
    updatedAt: Date.now(),
    syncStatus: "pending",
  });
};

/**
 * Get local task.
 */
const getLocalTask = async (
  taskId: string
): Promise<Task | null> => {
  const user = getCurrentUser();

  const record =
    await getOfflineData(
      `task:${user.uid}:${taskId}`
    );

  if (!record) {
    return null;
  }

  const data =
    record.data as OfflineTaskData;

  if (
    data.operation === "delete"
  ) {
    return null;
  }

  return data.task;
};

/**
 * Get Firebase task by ID.
 */
const getRemoteTask = async (
  taskId: string
): Promise<Task | null> => {
  const user = getCurrentUser();

  const taskRef = doc(
    db,
    "users",
    user.uid,
    "tasks",
    taskId
  );

  const snapshot =
    await getDoc(taskRef);

  if (!snapshot.exists()) {
    return null;
  }

  return firestoreTaskToTask(
    snapshot.id,
    snapshot.data()
  );
};

/* =========================================================
   SYNC
   ========================================================= */

/**
 * Sync all pending local task operations
 * with Firebase.
 *
 * This function is safe to call multiple times.
 */
export const syncPendingTasks =
  async (): Promise<void> => {
    if (!isOnline()) {
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      return;
    }

    try {
      const pendingRecords =
        await getPendingOfflineData();

      const userCollection =
        `tasks:${user.uid}`;

      const userRecords =
        pendingRecords.filter(
          (record) =>
            record.collection ===
            userCollection
        );

      for (const record of userRecords) {
        try {
          const offlineData =
            record.data as OfflineTaskData;

          const task =
            offlineData.task;

          const taskRef = doc(
            db,
            "users",
            user.uid,
            "tasks",
            task.id
          );

          /* =========================
             CREATE
             ========================= */

          if (
            offlineData.operation ===
            "create"
          ) {
            await setDoc(
              taskRef,
              taskToFirestoreData(task)
            );
          }

          /* =========================
             UPDATE
             ========================= */

          else if (
            offlineData.operation ===
            "update"
          ) {
            await setDoc(
              taskRef,
              taskToFirestoreData(task),
              {
                merge: true,
              }
            );
          }

          /* =========================
             DELETE
             ========================= */

          else if (
            offlineData.operation ===
            "delete"
          ) {
            await deleteDoc(taskRef);
          }

          /**
           * Firebase operation successful.
           * Mark local operation as synced.
           */
          await markOfflineDataSynced(
            record.id
          );
        } catch (error) {
          /**
           * One failed task should not stop
           * other pending tasks from syncing.
           */
          console.error(
            "Failed to sync task:",
            record.id,
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Task sync error:",
        error
      );
    }
  };

/* =========================================================
   ONLINE EVENT
   ========================================================= */

/**
 * Automatically sync when internet
 * connection comes back.
 *
 * This only runs in browser.
 */
if (
  typeof window !== "undefined"
) {
  window.addEventListener(
    "online",
    () => {
      void syncPendingTasks();
    }
  );
}

/* =========================================================
   ADD DAILY TASK
   ========================================================= */

/**
 * Add Daily Task.
 *
 * Offline:
 * IndexedDB → immediately available
 *
 * Online:
 * IndexedDB → Firebase
 */
export const addDailyTask = async (
  title: string,
  description: string,
  lifeArea: LifeArea,
  priority: TaskPriority,
  goalId: string | null
): Promise<string> => {
  getCurrentUser();

  const taskId =
    generateTaskId();

  const task: Task = {
    id: taskId,

    title: title.trim(),

    description:
      description.trim(),

    lifeArea,

    priority,

    goalId,

    status: "daily",

    activeDate: null,

    order: Date.now(),

    createdAt:
      new Date().toISOString(),

    completedAt: null,
  };

  /**
   * Always save locally first.
   */
  await saveLocalTask(
    task,
    "create"
  );

  /**
   * If online, sync immediately.
   */
  if (isOnline()) {
    await syncPendingTasks();
  }

  return taskId;
};

/* =========================================================
   ADD PENDING TASK
   ========================================================= */

/**
 * Add Pending Task.
 *
 * Example:
 * activeDate = "2026-08-15"
 *
 * On or before that date:
 * pending → daily
 */
export const addPendingTask =
  async (
    title: string,
    description: string,
    lifeArea: LifeArea,
    priority: TaskPriority,
    goalId: string | null,
    activeDate: string
  ): Promise<string> => {
    if (!activeDate) {
      throw new Error(
        "Active date is required."
      );
    }

    getCurrentUser();

    const taskId =
      generateTaskId();

    const task: Task = {
      id: taskId,

      title: title.trim(),

      description:
        description.trim(),

      lifeArea,

      priority,

      goalId,

      status: "pending",

      activeDate,

      order: Date.now(),

      createdAt:
        new Date().toISOString(),

      completedAt: null,
    };

    await saveLocalTask(
      task,
      "create"
    );

    if (isOnline()) {
      await syncPendingTasks();
    }

    return taskId;
  };

/* =========================================================
   GET TASKS
   ========================================================= */

/**
 * Get all tasks.
 *
 * Offline:
 * IndexedDB
 *
 * Online:
 * Firebase + local pending changes
 */
export const getTasks =
  async (): Promise<Task[]> => {
    const user =
      getCurrentUser();

    const todayString =
      getTodayString();

    /* =====================================================
       OFFLINE
       ===================================================== */

    if (!isOnline()) {
      const localRecords =
        await getOfflineCollection(
          `tasks:${user.uid}`
        );

      return localRecords
        .filter(
          (record) =>
            record.syncStatus ===
            "pending"
        )
        .map((record) => {
          const data =
            record.data as OfflineTaskData;

          return data.task;
        })
        .filter(
          (task) =>
            task.status !==
            "completed"
        )
        .sort(
          (a, b) =>
            a.order - b.order
        );
    }

    /* =====================================================
       ONLINE
       ===================================================== */

    try {
      const tasksQuery =
        query(
          getTasksCollection(),
          orderBy("order", "asc")
        );

      const snapshot =
        await getDocs(
          tasksQuery
        );

      const remoteTasks: Task[] =
        [];

      for (
        const item of snapshot.docs
      ) {
        const data =
          item.data();

        let status =
          data.status as TaskStatus;

        let activeDate =
          typeof data.activeDate ===
          "string"
            ? data.activeDate
            : null;

        /**
         * Pending → Daily
         *
         * If activeDate is today
         * or already passed.
         */
        if (
          status === "pending" &&
          activeDate &&
          activeDate <=
            todayString
        ) {
          status = "daily";

          activeDate = null;

          await updateDoc(
            item.ref,
            {
              status: "daily",
              activeDate: null,
            }
          );
        }

        remoteTasks.push(
          firestoreTaskToTask(
            item.id,
            {
              ...data,
              status,
              activeDate,
            }
          )
        );
      }

      /* ===================================================
         MERGE LOCAL PENDING CHANGES
         =================================================== */

      const localRecords =
        await getOfflineCollection(
          `tasks:${user.uid}`
        );

      const localPending =
        localRecords.filter(
          (record) =>
            record.syncStatus ===
            "pending"
        );

      const taskMap =
        new Map<string, Task>();

      /**
       * Firebase tasks first.
       */
      for (
        const task of remoteTasks
      ) {
        taskMap.set(
          task.id,
          task
        );
      }

      /**
       * Local pending changes
       * override Firebase.
       */
      for (
        const record of localPending
      ) {
        const data =
          record.data as OfflineTaskData;

        if (
          data.operation ===
          "delete"
        ) {
          taskMap.delete(
            data.task.id
          );
        } else {
          taskMap.set(
            data.task.id,
            data.task
          );
        }
      }

      /**
       * Start background sync.
       */
      void syncPendingTasks();

      return Array.from(
        taskMap.values()
      ).sort(
        (a, b) =>
          a.order - b.order
      );
    } catch (error) {
      /**
       * Firebase unavailable.
       * Use local data.
       */
      console.warn(
        "Firebase unavailable. Using local tasks.",
        error
      );

      const localRecords =
        await getOfflineCollection(
          `tasks:${user.uid}`
        );

      return localRecords
        .filter(
          (record) =>
            record.syncStatus ===
            "pending"
        )
        .map((record) => {
          const data =
            record.data as OfflineTaskData;

          return data.task;
        })
        .filter(
          (task) =>
            task.status !==
            "completed"
        )
        .sort(
          (a, b) =>
            a.order - b.order
        );
    }
  };

/* =========================================================
   COMPLETE TASK
   ========================================================= */

/**
 * Complete task.
 *
 * Works offline.
 */
export const completeTask =
  async (
    taskId: string
  ): Promise<void> => {
    getCurrentUser();

    let task =
      await getLocalTask(
        taskId
      );

    /**
     * If task is not locally available,
     * get it from Firebase.
     */
    if (!task) {
      if (!isOnline()) {
        throw new Error(
          "Task is not available offline."
        );
      }

      task =
        await getRemoteTask(
          taskId
        );
    }

    if (!task) {
      throw new Error(
        "Task not found."
      );
    }

    const updatedTask: Task =
      {
        ...task,

        status: "completed",

        completedAt:
          new Date().toISOString(),
      };

    await saveLocalTask(
      updatedTask,
      "update"
    );

    if (isOnline()) {
      await syncPendingTasks();
    }
  };

/* =========================================================
   RESTORE TASK
   ========================================================= */

/**
 * Restore completed task.
 *
 * Completed → Daily
 */
export const restoreTask =
  async (
    taskId: string
  ): Promise<void> => {
    getCurrentUser();

    let task =
      await getLocalTask(
        taskId
      );

    if (!task) {
      if (!isOnline()) {
        throw new Error(
          "Task is not available offline."
        );
      }

      task =
        await getRemoteTask(
          taskId
        );
    }

    if (!task) {
      throw new Error(
        "Task not found."
      );
    }

    const updatedTask: Task =
      {
        ...task,

        status: "daily",

        activeDate: null,

        completedAt: null,
      };

    await saveLocalTask(
      updatedTask,
      "update"
    );

    if (isOnline()) {
      await syncPendingTasks();
    }
  };

/* =========================================================
   DELETE TASK
   ========================================================= */

/**
 * Delete task.
 *
 * Works offline.
 */
export const deleteTask =
  async (
    taskId: string
  ): Promise<void> => {
    const user =
      getCurrentUser();

    let task =
      await getLocalTask(
        taskId
      );

    /**
     * If task is not local,
     * create minimal delete record.
     */
    if (!task) {
      task = {
        id: taskId,

        title: "",

        description: "",

        lifeArea: "personal",

        priority: "low",

        goalId: null,

        status: "completed",

        activeDate: null,

        order: Date.now(),

        createdAt:
          new Date().toISOString(),

        completedAt: null,
      };
    }

    await saveOfflineData({
      id: `task:${user.uid}:${taskId}`,

      collection:
        `tasks:${user.uid}`,

      data: {
        operation: "delete",
        task,
      } satisfies OfflineTaskData,

      updatedAt: Date.now(),

      syncStatus: "pending",
    });

    if (isOnline()) {
      await syncPendingTasks();
    }
  };

/* =========================================================
   UPDATE TASK
   ========================================================= */

/**
 * Update task.
 *
 * Works offline.
 */
export const updateTask =
  async (
    taskId: string,
    updates: Partial<{
      title: string;
      description: string;
      lifeArea: LifeArea;
      priority: TaskPriority;
      goalId: string | null;
      activeDate: string | null;
      status: TaskStatus;
    }>
  ): Promise<void> => {
    getCurrentUser();

    let task =
      await getLocalTask(
        taskId
      );

    /**
     * Get Firebase task if
     * it does not exist locally.
     */
    if (!task) {
      if (!isOnline()) {
        throw new Error(
          "Task is not available offline."
        );
      }

      task =
        await getRemoteTask(
          taskId
        );
    }

    if (!task) {
      throw new Error(
        "Task not found."
      );
    }

    const updatedTask: Task =
      {
        ...task,

        ...updates,

        title:
          updates.title !==
          undefined
            ? updates.title.trim()
            : task.title,

        description:
          updates.description !==
          undefined
            ? updates.description.trim()
            : task.description,
      };

    await saveLocalTask(
      updatedTask,
      "update"
    );

    if (isOnline()) {
      await syncPendingTasks();
    }
  };