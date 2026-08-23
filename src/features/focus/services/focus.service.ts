import type { FocusItem } from "../types/focus.types";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

function getFocusCollection() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return collection(
    db,
    "users",
    user.uid,
    "focusItems"
  );
}

/**
 * Load all focus items for the logged-in user.
 */
export async function loadFocusItems(): Promise<
  FocusItem[]
> {
  const user = auth.currentUser;

  if (!user) {
    return [];
  }

  try {
    const snapshot = await getDocs(
      getFocusCollection()
    );

    return snapshot.docs.map((item) => {
      const data = item.data();

      return {
        id: item.id,
        title:
          typeof data.title === "string"
            ? data.title
            : "",
        startedAt:
          typeof data.startedAt === "number"
            ? data.startedAt
            : null,
        elapsed:
          typeof data.elapsed === "number"
            ? data.elapsed
            : 0,
        running:
          data.running === true,
        createdAt:
          typeof data.createdAt === "number"
            ? data.createdAt
            : 0,
      };
    });
  } catch (error) {
    console.error(
      "Failed to load focus items:",
      error
    );

    return [];
  }
}

/**
 * Save all focus items.
 *
 * Existing items are updated in Firestore.
 */
export async function saveFocusItems(
  items: FocusItem[]
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  try {
    const focusCollection =
      getFocusCollection();

    await Promise.all(
      items.map((item) =>
        setDoc(
          doc(
            focusCollection,
            item.id
          ),
          item
        )
      )
    );
  } catch (error) {
    console.error(
      "Failed to save focus items:",
      error
    );

    throw error;
  }
}

/**
 * Create a new focus item.
 */
export async function createFocusItem(
  title: string
): Promise<FocusItem> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const now = new Date().getTime();

  const newItem: FocusItem = {
    id: `${now}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    title: title.trim(),
    startedAt: null,
    elapsed: 0,
    running: false,
    createdAt: now,
  };

  try {
    await setDoc(
      doc(
        getFocusCollection(),
        newItem.id
      ),
      newItem
    );

    return newItem;
  } catch (error) {
    console.error(
      "Failed to create focus item:",
      error
    );

    throw error;
  }
}

/**
 * Delete one focus item.
 */
export async function deleteFocusItem(
  id: string
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  try {
    await deleteDoc(
      doc(
        db,
        "users",
        user.uid,
        "focusItems",
        id
      )
    );
  } catch (error) {
    console.error(
      "Failed to delete focus item:",
      error
    );

    throw error;
  }
}

/**
 * Calculate elapsed time.
 *
 * If timer is running, calculate the latest
 * elapsed time from startedAt.
 */
export function getElapsedTime(
  item: FocusItem
): number {
  if (
    !item.running ||
    item.startedAt === null
  ) {
    return item.elapsed;
  }

  const now = new Date().getTime();

  return (
    item.elapsed +
    (now - item.startedAt)
  );
}

/**
 * Start timer.
 */
export function startFocus(
  item: FocusItem
): FocusItem {
  if (item.running) {
    return item;
  }

  const now = new Date().getTime();

  return {
    ...item,
    running: true,
    startedAt: now,
  };
}

/**
 * Pause timer.
 */
export function pauseFocus(
  item: FocusItem
): FocusItem {
  if (
    !item.running ||
    item.startedAt === null
  ) {
    return item;
  }

  const now = new Date().getTime();

  const additionalTime =
    now - item.startedAt;

  return {
    ...item,
    running: false,
    startedAt: null,
    elapsed:
      item.elapsed + additionalTime,
  };
}

/**
 * Reset timer.
 */
export function resetFocus(
  item: FocusItem
): FocusItem {
  return {
    ...item,
    running: false,
    startedAt: null,
    elapsed: 0,
  };
}