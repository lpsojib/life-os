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
  deleteOfflineData,
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

const getCurrentUser = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return user;
};

const getTasksCollection = () => {
  const user = getCurrentUser();

  return collection(
    db,
    "users",
    user.uid,
    "tasks"
  );
};

const isOnline = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return navigator.onLine;
};

/**
 * Today's local date.
 *
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
 * Get tomorrow's date.
 *
 * YYYY-MM-DD
 */
const getTomorrowString = (): string => {
  const tomorrow = new Date();

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  return [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, "0"),
    String(tomorrow.getDate()).padStart(2, "0"),
  ].join("-");
};

/**
 * Generate task ID.
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

/* =========================================================
   FIRESTORE CONVERSION
   ========================================================= */

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

    dueDate:
      typeof data.dueDate === "string"
        ? data.dueDate
        : null,

    activeDate:
      typeof data.activeDate === "string"
        ? data.activeDate
        : null,

    /**
     * Old tasks may not have repeatDaily.
     *
     * তাই undefined হলে false.
     */
    repeatDaily:
      data.repeatDaily === true,

    order:
      typeof data.order === "number"
        ? data.order
        : 0,

    createdAt,

    completedAt,
  };
};

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

    dueDate: task.dueDate,

    activeDate: task.activeDate,

    repeatDaily: task.repeatDaily,

    order: task.order,

    createdAt: Timestamp.fromDate(
      new Date(task.createdAt)
    ),

    completedAt: task.completedAt
      ? Timestamp.fromDate(
          new Date(task.completedAt)
        )
      : null,
  };
};

/* =========================================================
   OFFLINE TASK
   ========================================================= */

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

    collection:
      `tasks:${user.uid}`,

    data,

    updatedAt: Date.now(),

    syncStatus: "pending",
  });
};

const cacheRemoteTask = async (
  task: Task
): Promise<void> => {
  const user = getCurrentUser();

  const recordId =
    `task:${user.uid}:${task.id}`;

  const existing =
    await getOfflineData(recordId);

  /**
   * Pending local changes should
   * never be overwritten.
   */
  if (
    existing &&
    existing.syncStatus === "pending"
  ) {
    return;
  }

  const data: OfflineTaskData = {
    operation: "update",
    task,
  };

  await saveOfflineData({
    id: recordId,

    collection:
      `tasks:${user.uid}`,

    data,

    updatedAt: Date.now(),

    syncStatus: "synced",
  });
};

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

const getLocalTasks = async (): Promise<Task[]> => {
  const user = getCurrentUser();

  const records =
    await getOfflineCollection(
      `tasks:${user.uid}`
    );

  const taskMap =
    new Map<string, Task>();

  for (const record of records) {
    const data =
      record.data as OfflineTaskData;

    if (
      data.operation === "delete"
    ) {
      taskMap.delete(
        data.task.id
      );

      continue;
    }

    taskMap.set(
      data.task.id,
      data.task
    );
  }

  return Array.from(
    taskMap.values()
  ).sort(
    (a, b) =>
      a.order - b.order
  );
};

/* =========================================================
   ACTIVATE PENDING TASKS
   ========================================================= */

const activateDueLocalTasks =
  async (
    tasks: Task[]
  ): Promise<Task[]> => {
    const today =
      getTodayString();

    const updatedTasks: Task[] = [];

    for (const task of tasks) {
      if (
        task.status === "pending" &&
        task.activeDate &&
        task.activeDate <= today
      ) {
        const updatedTask: Task = {
          ...task,

          status: "daily",

          activeDate: null,
        };

        await saveLocalTask(
          updatedTask,
          "update"
        );

        updatedTasks.push(
          updatedTask
        );
      } else {
        updatedTasks.push(task);
      }
    }

    return updatedTasks;
  };

/* =========================================================
   SYNC
   ========================================================= */

export const syncPendingTasks =
  async (): Promise<void> => {
    if (!isOnline()) {
      return;
    }

    const user =
      auth.currentUser;

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

      for (
        const record of userRecords
      ) {
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

            await markOfflineDataSynced(
              record.id
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

            await markOfflineDataSynced(
              record.id
            );
          }

          /* =========================
             DELETE
             ========================= */

          else if (
            offlineData.operation ===
            "delete"
          ) {
            await deleteDoc(
              taskRef
            );

            await deleteOfflineData(
              record.id
            );
          }
        } catch (error) {
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
 * repeatDaily = true হলে
 * task প্রতিদিন automatically
 * আবার তৈরি হবে।
 */
export const addDailyTask =
  async (
    title: string,
    description: string,
    lifeArea: LifeArea,
    priority: TaskPriority,
    goalId: string | null,
    repeatDaily: boolean
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

      dueDate: null,

      activeDate: null,

      repeatDaily,

      order: Date.now(),

      createdAt:
        new Date().toISOString(),

      completedAt: null,
    };

    /**
     * Local first.
     */
    await saveLocalTask(
      task,
      "create"
    );

    /**
     * Firebase background sync.
     */
    if (isOnline()) {
      void syncPendingTasks();
    }

    return taskId;
  };

/* =========================================================
   ADD PENDING TASK
   ========================================================= */

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

      dueDate: activeDate,

      activeDate,

      /**
       * Pending tasks are
       * one-time tasks by default.
       */
      repeatDaily: false,

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
      void syncPendingTasks();
    }

    return taskId;
  };

/* =========================================================
   GET TASKS
   ========================================================= */

export const getTasks =
  async (): Promise<Task[]> => {
    const user =
      getCurrentUser();

    const todayString =
      getTodayString();

    /**
     * Local first.
     */
    const localTasks =
      await getLocalTasks();

    const activatedLocalTasks =
      await activateDueLocalTasks(
        localTasks
      );

    /**
     * Offline.
     */
    if (!isOnline()) {
      return activatedLocalTasks;
    }

    try {
      const tasksQuery =
        query(
          getTasksCollection(),
          orderBy(
            "order",
            "asc"
          )
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
         */
        if (
          status === "pending" &&
          activeDate &&
          activeDate <= todayString
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

        const task =
          firestoreTaskToTask(
            item.id,
            {
              ...data,
              status,
              activeDate,
            }
          );

        remoteTasks.push(
          task
        );

        await cacheRemoteTask(
          task
        );
      }

      /* ===================================================
         MERGE FIREBASE + LOCAL
         =================================================== */

      const taskMap =
        new Map<string, Task>();

      /**
       * Firebase first.
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
       * Latest local data.
       */
      const latestLocalTasks =
        await getLocalTasks();

      const activatedTasks =
        await activateDueLocalTasks(
          latestLocalTasks
        );

      for (
        const task of activatedTasks
      ) {
        const localRecord =
          await getOfflineData(
            `task:${user.uid}:${task.id}`
          );

        if (
          localRecord?.syncStatus ===
          "pending"
        ) {
          taskMap.set(
            task.id,
            task
          );
        }
      }

      void syncPendingTasks();

      return Array.from(
        taskMap.values()
      ).sort(
        (a, b) =>
          a.order - b.order
      );
    } catch (error) {
      console.warn(
        "Firebase unavailable. Using local tasks.",
        error
      );

      return activatedLocalTasks;
    }
  };

/* =========================================================
   COMPLETE TASK
   ========================================================= */

/**
 * Complete task.
 *
 * Normal task:
 * Daily → Completed
 *
 * Repeat Daily task:
 * Current task → Completed
 * Next day's task → Pending
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

    /**
     * Current task completed.
     */
    const completedTask: Task = {
      ...task,

      status: "completed",

      completedAt:
        new Date().toISOString(),
    };

    /**
     * Save completed task locally.
     */
    await saveLocalTask(
      completedTask,
      "update"
    );

    /**
     * If this is a repeating task,
     * create tomorrow's task.
     */
    if (task.repeatDaily) {
      const tomorrowTask: Task = {
        ...task,

        id: generateTaskId(),

        status: "pending",

        dueDate:
          getTomorrowString(),

        activeDate:
          getTomorrowString(),

        completedAt: null,

        createdAt:
          new Date().toISOString(),

        order:
          Date.now() + 1,

        repeatDaily: true,
      };

      await saveLocalTask(
        tomorrowTask,
        "create"
      );
    }

    /**
     * Firebase background sync.
     */
    if (isOnline()) {
      void syncPendingTasks();
    }
  };

/* =========================================================
   RESTORE TASK
   ========================================================= */

/**
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

    const updatedTask: Task = {
      ...task,

      status: "daily",

      dueDate: null,

      activeDate: null,

      completedAt: null,
    };

    await saveLocalTask(
      updatedTask,
      "update"
    );

    if (isOnline()) {
      void syncPendingTasks();
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
     * If local task does not exist,
     * create minimum data for delete operation.
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

        dueDate: null,

        activeDate: null,

        repeatDaily: false,

        order: Date.now(),

        createdAt:
          new Date().toISOString(),

        completedAt: null,
      };
    }

    await saveOfflineData({
      id:
        `task:${user.uid}:${taskId}`,

      collection:
        `tasks:${user.uid}`,

      data: {
        operation: "delete",
        task,
      } satisfies OfflineTaskData,

      updatedAt: Date.now(),

      syncStatus: "pending",
    });

    /**
     * Online হলে background Firebase delete.
     */
    if (isOnline()) {
      void syncPendingTasks();
    }
  };

/* =========================================================
   UPDATE TASK
   ========================================================= */

/**
 * Edit task.
 *
 * Supports:
 * - title
 * - description
 * - lifeArea
 * - priority
 * - goalId
 * - dueDate
 * - activeDate
 * - status
 * - repeatDaily
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
      dueDate: string | null;
      activeDate: string | null;
      status: TaskStatus;
      repeatDaily: boolean;
    }>
  ): Promise<void> => {
    getCurrentUser();

    let task =
      await getLocalTask(
        taskId
      );

    /**
     * Local task না থাকলে Firebase থেকে load.
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

    const updatedTask: Task = {
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

      /**
       * Explicitly preserve existing
       * repeatDaily value if not updated.
       */
      repeatDaily:
        updates.repeatDaily !==
        undefined
          ? updates.repeatDaily
          : task.repeatDaily,
    };

    /**
     * Local first.
     */
    await saveLocalTask(
      updatedTask,
      "update"
    );

    /**
     * Firebase background sync.
     */
    if (isOnline()) {
      void syncPendingTasks();
    }
  };