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

const getTodayString = (): string => {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
};

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
   LOCAL STORAGE
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
   LOCAL PENDING ACTIVATION
   ========================================================= */

const activateDueLocalTasks =
  async (
    tasks: Task[]
  ): Promise<Task[]> => {
    const today =
      getTodayString();

    const activated: Task[] = [];

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

        activated.push(updatedTask);

        /*
         * Important:
         * Do not block the returned task list.
         */
        void saveLocalTask(
          updatedTask,
          "update"
        ).catch((error) => {
          console.error(
            "Failed to activate local task:",
            error
          );
        });
      } else {
        activated.push(task);
      }
    }

    return activated;
  };

/* =========================================================
   SYNC LOCK
   ========================================================= */

let syncPromise: Promise<void> | null = null;

/* =========================================================
   BACKGROUND SYNC
   ========================================================= */

export const syncPendingTasks =
  async (): Promise<void> => {
    if (!isOnline()) {
      return;
    }

    if (syncPromise) {
      return syncPromise;
    }

    syncPromise = (async () => {
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

        if (
          userRecords.length === 0
        ) {
          return;
        }

        /*
         * Sync tasks in parallel instead
         * of waiting one-by-one.
         */
        await Promise.all(
          userRecords.map(
            async (record) => {
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

                  return;
                }

                if (
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

                  return;
                }

                if (
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
          )
        );
      } catch (error) {
        console.error(
          "Task sync error:",
          error
        );
      }
    })();

    try {
      await syncPromise;
    } finally {
      syncPromise = null;
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
      /*
       * Give the browser a tiny chance
       * to stabilize the connection.
       */
      window.setTimeout(() => {
        void syncPendingTasks();
      }, 300);
    }
  );
}

/* =========================================================
   ADD DAILY TASK
   ========================================================= */

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

    /*
     * Local storage is the source
     * of truth for immediate use.
     */
    await saveLocalTask(
      task,
      "create"
    );

    /*
     * NEVER wait for Firebase.
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

    /*
     * Firebase runs separately.
     */
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
    getCurrentUser();

    /*
     * FIRST:
     * Read local data.
     */
    const localTasks =
      await getLocalTasks();

    const activatedLocalTasks =
      await activateDueLocalTasks(
        localTasks
      );

    /*
     * Offline:
     * return immediately.
     */
    if (!isOnline()) {
      return activatedLocalTasks;
    }

    /*
     * IMPORTANT:
     * Return local tasks first.
     *
     * Firebase refresh happens
     * in the background.
     */
    void refreshTasksFromFirebase();

    return activatedLocalTasks;
  };

/* =========================================================
   FIREBASE BACKGROUND REFRESH
   ========================================================= */

const refreshTasksFromFirebase =
  async (): Promise<void> => {
    const user =
      auth.currentUser;

    if (!user || !isOnline()) {
      return;
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

      const todayString =
        getTodayString();

      /*
       * Cache Firebase results
       * in parallel.
       */
      await Promise.all(
        snapshot.docs.map(
          async (item) => {
            const data =
              item.data();

            let status =
              data.status as TaskStatus;

            let activeDate =
              typeof data.activeDate ===
              "string"
                ? data.activeDate
                : null;

            if (
              status === "pending" &&
              activeDate &&
              activeDate <= todayString
            ) {
              status = "daily";
              activeDate = null;

              /*
               * Do not block the
               * complete refresh.
               */
              void updateDoc(
                item.ref,
                {
                  status: "daily",
                  activeDate: null,
                }
              ).catch((error) => {
                console.error(
                  "Failed to activate Firebase task:",
                  error
                );
              });
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

            /*
             * Only cache if there is
             * no pending local change.
             */
            const userRecord =
              await getOfflineData(
                `task:${user.uid}:${task.id}`
              );

            if (
              userRecord?.syncStatus ===
              "pending"
            ) {
              return;
            }

            await saveOfflineData({
              id:
                `task:${user.uid}:${task.id}`,

              collection:
                `tasks:${user.uid}`,

              data: {
                operation: "update",
                task,
              } satisfies OfflineTaskData,

              updatedAt: Date.now(),

              syncStatus: "synced",
            });
          }
        )
      );

      /*
       * Sync any local changes created
       * while Firebase was refreshing.
       */
      void syncPendingTasks();
    } catch (error) {
      console.warn(
        "Firebase refresh failed. Local tasks remain available.",
        error
      );
    }
  };

/* =========================================================
   COMPLETE TASK
   ========================================================= */

export const completeTask =
  async (
    taskId: string
  ): Promise<void> => {
    getCurrentUser();

    let task =
      await getLocalTask(
        taskId
      );

    if (!task && isOnline()) {
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

    const completedTask: Task = {
      ...task,

      status: "completed",

      completedAt:
        new Date().toISOString(),
    };

    await saveLocalTask(
      completedTask,
      "update"
    );

    if (task.repeatDaily) {
      const tomorrow =
        getTomorrowString();

      const tomorrowTask: Task = {
        ...task,

        id: generateTaskId(),

        status: "pending",

        dueDate: tomorrow,

        activeDate: tomorrow,

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

    /*
     * Background Firebase.
     */
    if (isOnline()) {
      void syncPendingTasks();
    }
  };

/* =========================================================
   RESTORE TASK
   ========================================================= */

export const restoreTask =
  async (
    taskId: string
  ): Promise<void> => {
    getCurrentUser();

    let task =
      await getLocalTask(
        taskId
      );

    if (!task && isOnline()) {
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

    /*
     * Background Firebase delete.
     */
    if (isOnline()) {
      void syncPendingTasks();
    }
  };

/* =========================================================
   UPDATE TASK
   ========================================================= */

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

    if (!task && isOnline()) {
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

      repeatDaily:
        updates.repeatDaily !==
        undefined
          ? updates.repeatDaily
          : task.repeatDaily,
    };

    await saveLocalTask(
      updatedTask,
      "update"
    );

    /*
     * Background Firebase.
     */
    if (isOnline()) {
      void syncPendingTasks();
    }
  };

/* =========================================================
   GET REMOTE SINGLE TASK
   ========================================================= */

const getRemoteTask = async (
  taskId: string
): Promise<Task | null> => {
  const user =
    getCurrentUser();

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