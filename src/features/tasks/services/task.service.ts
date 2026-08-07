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
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { db, auth } from "@/lib/firebase";

import {
  Task,
  TaskPriority,
  LifeArea,
} from "../types/task.types";

/**
 * Wait until Firebase finishes checking authentication.
 */
const getAuthenticatedUser = (): Promise<NonNullable<typeof auth.currentUser>> => {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();

      if (user) {
        resolve(user);
      } else {
        reject(new Error("User is not authenticated."));
      }
    });
  });
};

/**
 * Get current user's Tasks collection
 */
const getTasksCollection = async () => {
  const user = await getAuthenticatedUser();

  return collection(
    db,
    "users",
    user.uid,
    "tasks"
  );
};

/**
 * Create Task
 */
export const addTask = async (
  title: string,
  description: string,
  lifeArea: LifeArea,
  priority: TaskPriority,
  goalId: string | null,
  dueDate: string | null
): Promise<string> => {
  const now = new Date();

  const status =
    dueDate && new Date(dueDate) > now
      ? "pending"
      : "daily";

  const taskData = {
    title: title.trim(),
    description: description.trim(),

    lifeArea,
    priority,

    goalId,

    status,

    dueDate,

    order: Date.now(),

    createdAt: Timestamp.now(),

    completedAt: null,
  };

  const tasksCollection =
    await getTasksCollection();

  const taskRef = await addDoc(
    tasksCollection,
    taskData
  );

  return taskRef.id;
};

/**
 * Get User Tasks
 */
export const getTasks = async (): Promise<Task[]> => {
  const tasksCollection =
    await getTasksCollection();

  const tasksQuery = query(
    tasksCollection,
    orderBy("order", "asc")
  );

  const snapshot = await getDocs(tasksQuery);

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,

      title: data.title ?? "",
      description: data.description ?? "",

      lifeArea: data.lifeArea,
      priority: data.priority,

      goalId: data.goalId ?? null,

      status: data.status,

      dueDate: data.dueDate ?? null,

      order: data.order ?? 0,

      createdAt:
        data.createdAt?.toDate?.().toISOString() ??
        new Date().toISOString(),

      completedAt:
        data.completedAt?.toDate?.().toISOString() ??
        null,
    };
  });
};

/**
 * Complete Task
 */
export const completeTask = async (
  taskId: string
): Promise<void> => {
  const user = await getAuthenticatedUser();

  const taskRef = doc(
    db,
    "users",
    user.uid,
    "tasks",
    taskId
  );

  await updateDoc(taskRef, {
    status: "completed",
    completedAt: Timestamp.now(),
  });
};

/**
 * Restore Completed Task
 */
export const restoreTask = async (
  taskId: string
): Promise<void> => {
  const user = await getAuthenticatedUser();

  const taskRef = doc(
    db,
    "users",
    user.uid,
    "tasks",
    taskId
  );

  await updateDoc(taskRef, {
    status: "daily",
    completedAt: null,
  });
};

/**
 * Delete Task
 */
export const deleteTask = async (
  taskId: string
): Promise<void> => {
  const user = await getAuthenticatedUser();

  const taskRef = doc(
    db,
    "users",
    user.uid,
    "tasks",
    taskId
  );

  await deleteDoc(taskRef);
};

/**
 * Update Task
 */
export const updateTask = async (
  taskId: string,
  updates: Partial<{
    title: string;
    description: string;
    lifeArea: LifeArea;
    priority: TaskPriority;
    goalId: string | null;
    dueDate: string | null;
  }>
): Promise<void> => {
  const user = await getAuthenticatedUser();

  const taskRef = doc(
    db,
    "users",
    user.uid,
    "tasks",
    taskId
  );

  await updateDoc(taskRef, updates);
};