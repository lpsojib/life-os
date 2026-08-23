import type { FocusItem } from "../types/focus.types";

import {
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
 * Load Focus Timer data
 * from the currently logged-in user's
 * Firestore account.
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

    return snapshot.docs.map((itemDoc) => {
      const data = itemDoc.data();

      return {
        id: itemDoc.id,
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
 * Save one Focus Timer item
 * to the logged-in user's account.
 */
export async function saveFocusItem(
  item: FocusItem
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  try {
    await setDoc(
      doc(
        db,
        "users",
        user.uid,
        "focusItems",
        item.id
      ),
      item
    );
  } catch (error) {
    console.error(
      "Failed to save focus item:",
      error
    );

    throw error;
  }
}

/**
 * Save multiple Focus Timer items.
 */
export async function saveFocusItems(
  items: FocusItem[]
): Promise<void> {
  await Promise.all(
    items.map((item) =>
      saveFocusItem(item)
    )
  );
}

/**
 * Create a new Focus Timer item.
 */
export async function createFocusItem(
  title: string
): Promise<FocusItem> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const now = new Date().getTime();

  const item: FocusItem = {
    id: `${now}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    title: title.trim(),
    startedAt: null,
    elapsed: 0,
    running: false,
    createdAt: now,
  };

  await saveFocusItem(item);

  return item;
}

/**
 * Delete a Focus Timer item.
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
 * Get current elapsed time.
 *
 * If timer is running, elapsed time is
 * calculated using startedAt.
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
 * Start Focus Timer.
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
 * Pause Focus Timer.
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
 * Reset Focus Timer.
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