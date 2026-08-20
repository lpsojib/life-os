import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import type { FocusItem } from "../types/focus.types";

const getFocusCollection = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return collection(db, "users", user.uid, "focus");
};

const getCurrentTime = (): number => {
  return Date.now();
};

export const getFocusItems = async (): Promise<FocusItem[]> => {
  const snapshot = await getDocs(getFocusCollection());

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,
      title:
        typeof data.title === "string"
          ? data.title
          : "",
      elapsed:
        typeof data.elapsed === "number"
          ? data.elapsed
          : 0,
      startedAt:
        typeof data.startedAt === "number"
          ? data.startedAt
          : null,
      running:
        data.running === true,
      createdAt:
        typeof data.createdAt === "number"
          ? data.createdAt
          : getCurrentTime(),
    };
  });
};

export const addFocus = async (
  title: string
): Promise<FocusItem> => {
  const cleanTitle = title.trim();

  if (!cleanTitle) {
    throw new Error("Focus title is required.");
  }

  const createdAt = getCurrentTime();

  const data = {
    title: cleanTitle,
    elapsed: 0,
    startedAt: null,
    running: false,
    createdAt,
    createdAtServer: serverTimestamp(),
  };

  const reference = await addDoc(
    getFocusCollection(),
    data
  );

  return {
    id: reference.id,
    title: cleanTitle,
    elapsed: 0,
    startedAt: null,
    running: false,
    createdAt,
  };
};

export const startFocus = async (
  id: string
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const currentTime = getCurrentTime();

  await updateDoc(
    doc(db, "users", user.uid, "focus", id),
    {
      running: true,
      startedAt: currentTime,
    }
  );
};

export const pauseFocus = async (
  item: FocusItem
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  if (!item.running || !item.startedAt) {
    return;
  }

  const currentTime = getCurrentTime();

  const elapsed =
    item.elapsed +
    (currentTime - item.startedAt);

  await updateDoc(
    doc(db, "users", user.uid, "focus", item.id),
    {
      running: false,
      startedAt: null,
      elapsed,
    }
  );
};

export const resetFocus = async (
  id: string
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  await updateDoc(
    doc(db, "users", user.uid, "focus", id),
    {
      running: false,
      startedAt: null,
      elapsed: 0,
    }
  );
};

export const deleteFocus = async (
  id: string
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  await deleteDoc(
    doc(db, "users", user.uid, "focus", id)
  );
};