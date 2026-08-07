import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { Goal } from "../types/goal.types";

const getGoalsCollection = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return collection(db, "users", user.uid, "goals");
};

/**
 * Get all goals for the current user
 */
export const getGoals = async (): Promise<Goal[]> => {
  const goalsQuery = query(
    getGoalsCollection(),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(goalsQuery);

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,
      title: data.title ?? "",
      description: data.description ?? "",
      createdAt:
        data.createdAt?.toDate?.().toISOString() ??
        new Date().toISOString(),
    };
  });
};

/**
 * Create a goal
 */
export const addGoal = async (
  title: string,
  description: string
): Promise<string> => {
  const goalData = {
    title: title.trim(),
    description: description.trim(),
    createdAt: Timestamp.now(),
  };

  const goalRef = await addDoc(
    getGoalsCollection(),
    goalData
  );

  return goalRef.id;
};