
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export interface CreateTaskInput {
  title: string;
  priority: "low" | "medium" | "high";
}

export async function createTask(data: CreateTaskInput) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  await addDoc(
    collection(db, "users", user.uid, "tasks"),
    {
      title: data.title,
      priority: data.priority,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );
}