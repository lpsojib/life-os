import type { FocusItem } from "../types/focus.types";

import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { auth, db } from "@/lib/firebase";

const TIMER_DOCUMENT = "main";

function getTimerRef(user: User) {
  return doc(
    db,
    "users",
    user.uid,
    "focusTimer",
    TIMER_DOCUMENT
  );
}

/* =========================================================
   DEFAULT TIMER
   ========================================================= */

export function createDefaultFocusItem(): FocusItem {
  return {
    id: TIMER_DOCUMENT,
    title: "Focus Timer",
    startedAt: null,
    elapsed: 0,
    running: false,
    createdAt: new Date().getTime(),
  };
}

/* =========================================================
   LOAD TIMER
   ========================================================= */

export async function loadFocusTimer(): Promise<
  FocusItem | null
> {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  try {
    const timerRef = getTimerRef(user);

    const snapshot = await getDoc(timerRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    return {
      id: TIMER_DOCUMENT,

      title:
        typeof data.title === "string"
          ? data.title
          : "Focus Timer",

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
          : new Date().getTime(),
    };
  } catch (error) {
    console.error(
      "Failed to load focus timer:",
      error
    );

    return null;
  }
}

/* =========================================================
   SAVE TIMER
   ========================================================= */

export async function saveFocusTimer(
  timer: FocusItem
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  try {
    await setDoc(
      getTimerRef(user),
      {
        id: TIMER_DOCUMENT,
        title: timer.title,
        startedAt: timer.startedAt,
        elapsed: timer.elapsed,
        running: timer.running,
        createdAt: timer.createdAt,
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
  }
}

/* =========================================================
   RESET TIMER
   ========================================================= */

export async function resetFocusTimer(): Promise<FocusItem> {
  const existing =
    await loadFocusTimer();

  const timer: FocusItem = {
    ...(existing ?? createDefaultFocusItem()),

    startedAt: null,

    elapsed: 0,

    running: false,
  };

  await saveFocusTimer(timer);

  return timer;
}

/* =========================================================
   AUTH READY
   ========================================================= */

export function subscribeToAuth(
  callback: (user: User | null) => void
) {
  return onAuthStateChanged(
    auth,
    callback
  );
}

/* =========================================================
   REAL-TIME TIMER LISTENER
   ========================================================= */

export function subscribeToFocusTimer(
  user: User,
  callback: (
    timer: FocusItem | null
  ) => void
) {
  return onSnapshot(
    getTimerRef(user),

    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      const data = snapshot.data();

      const timer: FocusItem = {
        id: TIMER_DOCUMENT,

        title:
          typeof data.title === "string"
            ? data.title
            : "Focus Timer",

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
            : new Date().getTime(),
      };

      callback(timer);
    },

    (error) => {
      console.error(
        "Focus timer listener error:",
        error
      );
    }
  );
}

/* =========================================================
   ELAPSED TIME
   ========================================================= */

export function getElapsedTime(
  timer: FocusItem,
  currentTime: number
): number {
  if (
    !timer.running ||
    timer.startedAt === null
  ) {
    return timer.elapsed;
  }

  return (
    timer.elapsed +
    (currentTime - timer.startedAt)
  );
}

/* =========================================================
   START
   ========================================================= */

export function startFocus(
  timer: FocusItem,
  currentTime: number
): FocusItem {
  if (timer.running) {
    return timer;
  }

  return {
    ...timer,

    running: true,

    startedAt: currentTime,
  };
}

/* =========================================================
   PAUSE
   ========================================================= */

export function pauseFocus(
  timer: FocusItem,
  currentTime: number
): FocusItem {
  if (
    !timer.running ||
    timer.startedAt === null
  ) {
    return timer;
  }

  const additionalTime =
    currentTime - timer.startedAt;

  return {
    ...timer,

    running: false,

    startedAt: null,

    elapsed:
      timer.elapsed +
      additionalTime,
  };
}