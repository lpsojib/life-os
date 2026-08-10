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
  GoalTask,
} from "../types/goal.types";

/* =========================================================
   COLLECTION HELPERS
========================================================= */

const getCurrentUser = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return user;
};

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
   HELPERS
========================================================= */

const convertTimestampToISOString = (
  value: unknown
): string => {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate ===
      "function"
  ) {
    return (
      value as {
        toDate: () => Date;
      }
    )
      .toDate()
      .toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
};

/* =========================================================
   GOAL
========================================================= */

/**
 * Add Goal
 *
 * Goal + Goal Tasks একসাথে তৈরি হবে।
 */
export const addGoal = async (
  title: string,
  description: string,
  startDate: string,
  endDate: string,
  taskTitles: string[] = []
): Promise<string> => {
  const user = getCurrentUser();

  const cleanTitle = title.trim();
  const cleanDescription = description.trim();

  if (!cleanTitle) {
    throw new Error("লক্ষ্যের নাম লিখুন।");
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

  const cleanTasks = taskTitles
    .map((task) => task.trim())
    .filter(Boolean);

  const now = Timestamp.now();

  /* Create Goal */

  const goalData = {
    title: cleanTitle,
    description: cleanDescription,
    startDate,
    endDate,
    status: "active" as GoalStatus,

    totalTasks: cleanTasks.length,
    completedTasks: 0,
    progress: 0,

    createdAt: now,
    updatedAt: now,
  };

  const goalRef = await addDoc(
    collection(
      db,
      "users",
      user.uid,
      "goals"
    ),
    goalData
  );

  /* Create Goal Tasks */

  if (cleanTasks.length > 0) {
    const goalTasksCollection =
      collection(
        db,
        "users",
        user.uid,
        "goalTasks"
      );

    await Promise.all(
      cleanTasks.map((taskTitle) =>
        addDoc(goalTasksCollection, {
          goalId: goalRef.id,
          title: taskTitle,
          status: "pending",
          createdAt: now,
          completedAt: null,
          updatedAt: now,
        })
      )
    );
  }

  return goalRef.id;
};

/* =========================================================
   GET ACTIVE GOALS
========================================================= */

export const getGoals = async (): Promise<
  Goal[]
> => {
  const goalsQuery = query(
    getGoalsCollection(),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );

  const snapshot =
    await getDocs(goalsQuery);

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,

      title: data.title ?? "",

      description:
        data.description ?? "",

      startDate:
        data.startDate ?? "",

      endDate:
        data.endDate ?? "",

      status:
        "active" as GoalStatus,

      totalTasks:
        data.totalTasks ?? 0,

      completedTasks:
        data.completedTasks ?? 0,

      progress:
        data.progress ?? 0,

      createdAt:
        convertTimestampToISOString(
          data.createdAt
        ),

      updatedAt:
        convertTimestampToISOString(
          data.updatedAt
        ),
    };
  });
};

/* =========================================================
   GET COMPLETED GOALS
========================================================= */

export const getCompletedGoals =
  async (): Promise<Goal[]> => {
    const goalsQuery = query(
      getGoalsCollection(),
      where(
        "status",
        "==",
        "completed"
      ),
      orderBy("createdAt", "desc")
    );

    const snapshot =
      await getDocs(goalsQuery);

    return snapshot.docs.map((item) => {
      const data = item.data();

      return {
        id: item.id,

        title: data.title ?? "",

        description:
          data.description ?? "",

        startDate:
          data.startDate ?? "",

        endDate:
          data.endDate ?? "",

        status:
          "completed" as GoalStatus,

        totalTasks:
          data.totalTasks ?? 0,

        completedTasks:
          data.completedTasks ?? 0,

        progress:
          data.progress ?? 0,

        createdAt:
          convertTimestampToISOString(
            data.createdAt
          ),

        updatedAt:
          convertTimestampToISOString(
            data.updatedAt
          ),
      };
    });
  };

/* =========================================================
   GET EXPIRED GOALS
========================================================= */

export const getExpiredGoals =
  async (): Promise<Goal[]> => {
    const goalsQuery = query(
      getGoalsCollection(),
      where(
        "status",
        "==",
        "expired"
      ),
      orderBy("createdAt", "desc")
    );

    const snapshot =
      await getDocs(goalsQuery);

    return snapshot.docs.map((item) => {
      const data = item.data();

      return {
        id: item.id,

        title: data.title ?? "",

        description:
          data.description ?? "",

        startDate:
          data.startDate ?? "",

        endDate:
          data.endDate ?? "",

        status:
          "expired" as GoalStatus,

        totalTasks:
          data.totalTasks ?? 0,

        completedTasks:
          data.completedTasks ?? 0,

        progress:
          data.progress ?? 0,

        createdAt:
          convertTimestampToISOString(
            data.createdAt
          ),

        updatedAt:
          convertTimestampToISOString(
            data.updatedAt
          ),
      };
    });
  };

/* =========================================================
   COMPLETE GOAL
========================================================= */

export const completeGoal = async (
  goalId: string
): Promise<void> => {
  const user = getCurrentUser();

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
   DELETE GOAL
========================================================= */

/**
 * Goal delete করলে তার সব Goal Task-ও delete হবে।
 */
export const deleteGoal = async (
  goalId: string
): Promise<void> => {
  const user = getCurrentUser();

  const goalRef = doc(
    db,
    "users",
    user.uid,
    "goals",
    goalId
  );

  await deleteDoc(goalRef);

  const tasksQuery = query(
    getGoalTasksCollection(),
    where("goalId", "==", goalId)
  );

  const snapshot =
    await getDocs(tasksQuery);

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
   GOAL PROGRESS
========================================================= */

const updateGoalProgress = async (
  goalId: string
): Promise<void> => {
  const user = getCurrentUser();

  const tasksQuery = query(
    getGoalTasksCollection(),
    where("goalId", "==", goalId)
  );

  const snapshot =
    await getDocs(tasksQuery);

  const totalTasks = snapshot.size;

  const completedTasks =
    snapshot.docs.filter(
      (item) =>
        item.data().status ===
        "completed"
    ).length;

  const progress =
    totalTasks > 0
      ? Math.round(
          (completedTasks /
            totalTasks) *
            100
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
   GOAL TASK
========================================================= */

/**
 * Add Goal Task
 */
export const addGoalTask = async (
  goalId: string,
  title: string
): Promise<string> => {
  const user = getCurrentUser();

  const cleanTitle = title.trim();

  if (!cleanTitle) {
    throw new Error(
      "টাস্কের নাম লিখুন।"
    );
  }

  const goalRef = doc(
    db,
    "users",
    user.uid,
    "goals",
    goalId
  );

  const goalSnapshot =
    await getDoc(goalRef);

  if (!goalSnapshot.exists()) {
    throw new Error(
      "লক্ষ্যটি খুঁজে পাওয়া যায়নি।"
    );
  }

  const now = Timestamp.now();

  const taskData = {
    goalId,
    title: cleanTitle,
    status: "pending",
    createdAt: now,
    completedAt: null,
    updatedAt: now,
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
  getCurrentUser();

  const tasksQuery = query(
    getGoalTasksCollection(),
    where("goalId", "==", goalId),
    orderBy("createdAt", "asc")
  );

  const snapshot =
    await getDocs(tasksQuery);

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,

      goalId:
        data.goalId ?? goalId,

      title:
        data.title ?? "",

      completed:
        data.status ===
        "completed",

      createdAt:
        convertTimestampToISOString(
          data.createdAt
        ),

      completedAt:
        data.completedAt
          ? convertTimestampToISOString(
              data.completedAt
            )
          : null,

      updatedAt:
        convertTimestampToISOString(
          data.updatedAt
        ),
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
  const user = getCurrentUser();

  const taskRef = doc(
    db,
    "users",
    user.uid,
    "goalTasks",
    taskId
  );

  const taskSnapshot =
    await getDoc(taskRef);

  if (!taskSnapshot.exists()) {
    throw new Error(
      "Goal task not found."
    );
  }

  const taskData =
    taskSnapshot.data();

  const goalId =
    taskData.goalId;

  if (!goalId) {
    throw new Error(
      "Goal ID not found."
    );
  }

  await updateDoc(taskRef, {
    status: completed
      ? "completed"
      : "pending",

    completedAt: completed
      ? Timestamp.now()
      : null,

    updatedAt: Timestamp.now(),
  });

  await updateGoalProgress(
    goalId
  );
};

/**
 * Update Goal Task
 */
export const updateGoalTask = async (
  taskId: string,
  title: string
): Promise<void> => {
  const user = getCurrentUser();

  const cleanTitle = title.trim();

  if (!cleanTitle) {
    throw new Error(
      "টাস্কের নাম লিখুন।"
    );
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
      updatedAt: Timestamp.now(),
    }
  );
};

/**
 * Delete Goal Task
 */
export const deleteGoalTask = async (
  taskId: string
): Promise<void> => {
  const user = getCurrentUser();

  const taskRef = doc(
    db,
    "users",
    user.uid,
    "goalTasks",
    taskId
  );

  const taskSnapshot =
    await getDoc(taskRef);

  if (!taskSnapshot.exists()) {
    throw new Error(
      "Goal task not found."
    );
  }

  const goalId =
    taskSnapshot.data().goalId;

  await deleteDoc(taskRef);

  if (goalId) {
    await updateGoalProgress(
      goalId
    );
  }
};