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

import { auth, db } from "@/lib/firebase";

import {
  LifeArea,
  Task,
  TaskPriority,
  TaskStatus,
} from "../types/task.types";

/**
 * Get current user's tasks collection
 */
const getTasksCollection = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return collection(db, "users", user.uid, "tasks");
};

/**
 * Add Daily Task
 *
 * Daily task = আজকের task
 * এখানে কোনো date থাকবে না।
 */
export const addDailyTask = async (
  title: string,
  description: string,
  lifeArea: LifeArea,
  priority: TaskPriority,
  goalId: string | null
): Promise<string> => {
  const taskData = {
    title: title.trim(),
    description: description.trim(),

    lifeArea,
    priority,

    goalId,

    status: "daily" as TaskStatus,

    activeDate: null,

    order: Date.now(),

    createdAt: Timestamp.now(),

    completedAt: null,
  };

  const taskRef = await addDoc(
    getTasksCollection(),
    taskData
  );

  return taskRef.id;
};

/**
 * Add Pending Task
 *
 * Pending task-এর Active Date থাকবে।
 *
 * Example:
 * activeDate = 2026-08-10
 *
 * 10 August এ task automatically Daily হবে।
 */
export const addPendingTask = async (
  title: string,
  description: string,
  lifeArea: LifeArea,
  priority: TaskPriority,
  goalId: string | null,
  activeDate: string
): Promise<string> => {
  if (!activeDate) {
    throw new Error("Active date is required.");
  }

  const taskData = {
    title: title.trim(),
    description: description.trim(),

    lifeArea,
    priority,

    goalId,

    status: "pending" as TaskStatus,

    activeDate,

    order: Date.now(),

    createdAt: Timestamp.now(),

    completedAt: null,
  };

  const taskRef = await addDoc(
    getTasksCollection(),
    taskData
  );

  return taskRef.id;
};

/**
 * Get all tasks
 *
 * গুরুত্বপূর্ণ:
 * Pending task-এর activeDate আজ বা তার আগের হলে
 * সেটাকে automatically Daily করা হবে।
 */
export const getTasks = async (): Promise<Task[]> => {
  const tasksQuery = query(
    getTasksCollection(),
    orderBy("order", "asc")
  );

  const snapshot = await getDocs(tasksQuery);

  const today = new Date();

  const todayString =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

  const tasks: Task[] = [];

  for (const item of snapshot.docs) {
    const data = item.data();

    let status = data.status as TaskStatus;

    let activeDate =
      data.activeDate ?? null;

    /**
     * Pending task-এর Active Date আজ হলে
     * Pending → Daily
     */
    if (
      status === "pending" &&
      activeDate &&
      activeDate <= todayString
    ) {
      status = "daily";

      activeDate = null;

      await updateDoc(item.ref, {
        status: "daily",
        activeDate: null,
      });
    }

    tasks.push({
      id: item.id,

      title: data.title ?? "",

      description: data.description ?? "",

      lifeArea: data.lifeArea,

      priority: data.priority,

      goalId: data.goalId ?? null,

      status,

      activeDate,

      order: data.order ?? 0,

      createdAt:
        data.createdAt?.toDate?.().toISOString() ??
        new Date().toISOString(),

      completedAt:
        data.completedAt?.toDate?.().toISOString() ??
        null,
    });
  }

  return tasks;
};

/**
 * Complete Task
 */
export const completeTask = async (
  taskId: string
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

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
 *
 * Completed → Daily
 */
export const restoreTask = async (
  taskId: string
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const taskRef = doc(
    db,
    "users",
    user.uid,
    "tasks",
    taskId
  );

  await updateDoc(taskRef, {
    status: "daily",
    activeDate: null,
    completedAt: null,
  });
};

/**
 * Delete Task
 */
export const deleteTask = async (
  taskId: string
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

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
    activeDate: string | null;
    status: TaskStatus;
  }>
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const taskRef = doc(
    db,
    "users",
    user.uid,
    "tasks",
    taskId
  );

  await updateDoc(taskRef, updates);
};