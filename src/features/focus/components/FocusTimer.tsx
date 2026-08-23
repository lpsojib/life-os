import type { FocusItem } from "../types/focus.types";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

const FOCUS_DOCUMENT_ID = "main";

function getFocusDocument() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return doc(
    db,
    "users",
    user.uid,
    "focusItems",
    FOCUS_DOCUMENT_ID
  );
}

/**
 * Load the user's permanent Focus Timer.
 */
export async function loadFocusItems(): Promise<
  FocusItem[]
> {
  const user = auth.currentUser;

  if (!user) {
    return [];
  }

  try {
    const snapshot = await getDoc(
      getFocusDocument()
    );

    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.data();

    if (
      typeof data.title !== "string" ||
      typeof data.createdAt !== "number"
    ) {
      return [];
    }

    return [
      {
        id: snapshot.id,
        title: data.title,
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
        createdAt: data.createdAt,
      },
    ];
  } catch (error) {
    console.error(
      "Failed to load focus timer:",
      error
    );

    return [];
  }
}

/**
 * Save the Focus Timer permanently
 * to the logged-in user's Firebase account.
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
      getFocusDocument(),
      {
        id: FOCUS_DOCUMENT_ID,
        title: item.title,
        startedAt: item.startedAt,
        elapsed: item.elapsed,
        running: item.running,
        createdAt: item.createdAt,
      },
      {
        merge: true,
      }
    );
  } catch (error) {
    console.error(
      "Failed to save focus timer:",
      error
    );

    throw error;
  }
}

/**
 * Backward-compatible function.
 */
export async function saveFocusItems(
  items: FocusItem[]
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const latestItem = items[0];

  await saveFocusItem(latestItem);
}

/**
 * Create a Focus Timer.
 */
export async function createFocusItem(
  title: string
): Promise<FocusItem> {
  const now = new Date().getTime();

  const item: FocusItem = {
    id: FOCUS_DOCUMENT_ID,
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
 * Get current elapsed time.
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

  return {
    ...item,
    running: true,
    startedAt: new Date().getTime(),
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