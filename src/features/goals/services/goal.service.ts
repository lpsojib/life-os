import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  Goal,
  GoalStatus,
} from "../types/goal.types";

import {
  GoalTask,
  GoalTaskStatus,
} from "../types/goal-task.types";

/* =========================================================
   COLLECTION HELPERS
========================================================= */

const getGoalsCollection = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return collection(
    db,
    "users",
    user.uid,
    "goals"
  );
};

const getGoalTasksCollection = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return collection(
    db,
    "users",
    user.uid,
    "goalTasks"
  );
};

/* =========================================================
   GOAL
========================================================= */

/**
 * Add Goal
 */
export const addGoal = async (
  title: string,
  description: string,
  startDate: string,
  endDate: string
): Promise<string> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const cleanTitle = title.trim();
  const cleanDescription = description.trim();

  if (!cleanTitle) {
    throw new Error("লক্ষ্যের নাম লিখুন।");
  }

  if (!startDate || !endDate) {
    throw new Error("শুরু ও শেষের তারিখ দিন।");
  }

  if (new Date(endDate) < new Date(startDate)) {
    throw new Error(
      "শেষের তারিখ শুরু তারিখের পরে হতে হবে।"
    );
  }

  const now = Timestamp.now();

  const goalData = {
    title: cleanTitle,
    description: cleanDescription,
    startDate,
    endDate,
    status: "active" as GoalStatus,
    totalTasks: 0,
    completedTasks: 0,
    progress: 0,
    createdAt: now,
    updatedAt: now,
  };

  const goalRef = await addDoc(
    getGoalsCollection(),
    goalData
  );

  return goalRef.id;
};

/**
 * Get Active Goals
 */
export const getGoals = async (): Promise<Goal[]> => {
  const goalsQuery = query(
    getGoalsCollection(),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(goalsQuery);

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,
      title: data.title ?? "",
      description: data.description ?? "",
      startDate: data.startDate ?? "",
      endDate: data.endDate ?? "",
      status: "active",
      totalTasks: data.totalTasks ?? 0,
      completedTasks: data.completedTasks ?? 0,
      progress: data.progress ?? 0,
      createdAt:
        data.createdAt?.toDate?.().toISOString() ??
        new Date().toISOString(),
      updatedAt:
        data.updatedAt?.toDate?.().toISOString() ??
        new Date().toISOString(),
    };
  });
};

/**
 * Get Completed Goals
 */
export const getCompletedGoals =
  async (): Promise<Goal[]> => {
    const goalsQuery = query(
      getGoalsCollection(),
      where("status", "==", "completed"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(goalsQuery);

    return snapshot.docs.map((item) => {
      const data = item.data();

      return {
        id: item.id,
        title: data.title ?? "",
        description: data.description ?? "",
        startDate: data.startDate ?? "",
        endDate: data.endDate ?? "",
        status: "completed",
        totalTasks: data.totalTasks ?? 0,
        completedTasks: data.completedTasks ?? 0,
        progress: data.progress ?? 0,
        createdAt:
          data.createdAt?.toDate?.().toISOString() ??
          new Date().toISOString(),
        updatedAt:
          data.updatedAt?.toDate?.().toISOString() ??
          new Date().toISOString(),
      };
    });
  };

/**
 * Complete Goal
 */
export const completeGoal = async (
  goalId: string
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  await updateDoc(
    doc(
      db,
      "users",
      user.uid,
      "goals",
      goalId
    ),
    {
      status: "completed",
      progress: 100,
      updatedAt: Timestamp.now(),
    }
  );
};

/* =========================================================
   GOAL PROGRESS
========================================================= */

const updateGoalProgress = async (
  goalId: string
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const tasksQuery = query(
    getGoalTasksCollection(),
    where("goalId", "==", goalId)
  );

  const snapshot = await getDocs(tasksQuery);

  const totalTasks = snapshot.size;

  const completedTasks = snapshot.docs.filter(
    (item) =>
      item.data().status === "completed"
  ).length;

  const progress =
    totalTasks > 0
      ? Math.round(
          (completedTasks / totalTasks) * 100
        )
      : 0;

  const goalRef = doc(
    db,
    "users",
    user.uid,
    "goals",
    goalId
  );

  if (
    totalTasks > 0 &&
    completedTasks === totalTasks
  ) {
    await updateDoc(goalRef, {
      status: "completed",
      totalTasks,
      completedTasks,
      progress: 100,
      updatedAt: Timestamp.now(),
    });

    return;
  }

  await updateDoc(goalRef, {
    status: "active",
    totalTasks,
    completedTasks,
    progress,
    updatedAt: Timestamp.now(),
  });
};

/* =========================================================
   DELETE GOAL
========================================================= */

export const deleteGoal = async (
  goalId: string
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  await deleteDoc(
    doc(
      db,
      "users",
      user.uid,
      "goals",
      goalId
    )
  );

  const tasksQuery = query(
    getGoalTasksCollection(),
    where("goalId", "==", goalId)
  );

  const snapshot = await getDocs(tasksQuery);

  await Promise.all(
    snapshot.docs.map((item) =>
      deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "goalTasks",
          item.id
        )
      )
    )
  );
};

/* =========================================================
   GOAL TASK
========================================================= */

/**
 * Add Goal Task
 */
export const addGoalTask = async (
  goalId: string,
  title: string
): Promise<string> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const cleanTitle = title.trim();

  if (!cleanTitle) {
    throw new Error("টাস্কের নাম লিখুন।");
  }

  const taskData = {
    goalId,
    title: cleanTitle,
    status: "pending" as GoalTaskStatus,
    createdAt: Timestamp.now(),
    completedAt: null,
  };

  const taskRef = await addDoc(
    getGoalTasksCollection(),
    taskData
  );

  await updateGoalProgress(goalId);

  return taskRef.id;
};

/**
 * Get Tasks of a Goal
 */
export const getGoalTasks = async (
  goalId: string
): Promise<GoalTask[]> => {
  const tasksQuery = query(
    getGoalTasksCollection(),
    where("goalId", "==", goalId),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(tasksQuery);

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,
      goalId: data.goalId ?? goalId,
      title: data.title ?? "",
      status:
        data.status === "completed"
          ? "completed"
          : "pending",
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
 * Toggle Goal Task
 */
export const toggleGoalTask = async (
  taskId: string,
  completed: boolean
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const taskRef = doc(
    db,
    "users",
    user.uid,
    "goalTasks",
    taskId
  );

  const taskSnapshot = await getDoc(taskRef);

  if (!taskSnapshot.exists()) {
    throw new Error("Goal task not found.");
  }

  const taskData = taskSnapshot.data();

  const goalId = taskData.goalId;

  if (!goalId) {
    throw new Error("Goal ID not found.");
  }

  await updateDoc(taskRef, {
    status: completed ? "completed" : "pending",
    completedAt: completed
      ? Timestamp.now()
      : null,
  });

  await updateGoalProgress(goalId);
};

/**
 * Update Goal Task
 */
export const updateGoalTask = async (
  taskId: string,
  title: string
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const cleanTitle = title.trim();

  if (!cleanTitle) {
    throw new Error("টাস্কের নাম লিখুন।");
  }

  await updateDoc(
    doc(
      db,
      "users",
      user.uid,
      "goalTasks",
      taskId
    ),
    {
      title: cleanTitle,
    }
  );
};

/**
 * Delete Goal Task
 */
export const deleteGoalTask = async (
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
    "goalTasks",
    taskId
  );

  const taskSnapshot = await getDoc(taskRef);

  if (!taskSnapshot.exists()) {
    throw new Error("Goal task not found.");
  }

  const goalId = taskSnapshot.data().goalId;

  await deleteDoc(taskRef);

  if (goalId) {
    await updateGoalProgress(goalId);
  }
};