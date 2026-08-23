import type { User } from "firebase/auth";

import {
  onAuthStateChanged,
  type Unsubscribe,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import type { FocusItem } from "../types/focus.types";

/* =========================================================
   FIRESTORE PATH
   ========================================================= */

const TIMER_ID = "main";

function getTimerRef(user: User) {
  return doc(
    db,
    "users",
    user.uid,
    "focusTimer",
    TIMER_ID
  );
}

/* =========================================================
   DEFAULT TIMER
   ========================================================= */

export function createDefaultFocusItem(): FocusItem {
  return {
    id: TIMER_ID,
    title: "Focus Timer",
    startedAt: null,
    elapsed: 0,
    running: false,
    createdAt: Date.now(),
  };
}

/* =========================================================
   AUTH LISTENER
   ========================================================= */

export function subscribeToAuth(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(
    auth,
    callback
  );
}

/* =========================================================
   LOAD TIMER FROM FIRESTORE
   ========================================================= */

export async function loadFocusTimer(
  user: User
): Promise<FocusItem | null> {
  try {
    const timerRef =
      getTimerRef(user);

    const snapshot =
      await getDoc(timerRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    return {
      id: TIMER_ID,

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
          : Date.now(),
    };
  } catch (error) {
    console.error(
      "FOCUS TIMER LOAD ERROR:",
      error
    );

    throw error;
  }
}

/* =========================================================
   SAVE TIMER TO FIRESTORE
   ========================================================= */

export async function saveFocusTimer(
  user: User,
  timer: FocusItem
): Promise<void> {
  try {
    const timerRef =
      getTimerRef(user);

    await setDoc(
      timerRef,
      {
        id: TIMER_ID,
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
      "FOCUS TIMER SAVE ERROR:",
      error
    );

    throw error;
  }
}

/* =========================================================
   CREATE TIMER FOR NEW USER
   ========================================================= */

export async function createFocusTimer(
  user: User
): Promise<FocusItem> {
  const timer =
    createDefaultFocusItem();

  await saveFocusTimer(
    user,
    timer
  );

  return timer;
}

/* =========================================================
   RESET TIMER
   ========================================================= */

export async function resetFocusTimer(
  user: User,
  timer: FocusItem
): Promise<FocusItem> {
  const resetTimer: FocusItem = {
    ...timer,

    running: false,

    startedAt: null,

    elapsed: 0,
  };

  await saveFocusTimer(
    user,
    resetTimer
  );

  return resetTimer;
}

/* =========================================================
   GET ELAPSED TIME
   ========================================================= */

export function getElapsedTime(
  timer: FocusItem,
  now: number
): number {
  if (
    !timer.running ||
    timer.startedAt === null
  ) {
    return timer.elapsed;
  }

  return (
    timer.elapsed +
    (now - timer.startedAt)
  );
}

/* =========================================================
   START
   ========================================================= */

export function startFocus(
  timer: FocusItem,
  now: number
): FocusItem {
  if (timer.running) {
    return timer;
  }

  return {
    ...timer,

    running: true,

    startedAt: now,
  };
}

/* =========================================================
   PAUSE
   ========================================================= */

export function pauseFocus(
  timer: FocusItem,
  now: number
): FocusItem {
  if (
    !timer.running ||
    timer.startedAt === null
  ) {
    return timer;
  }

  const additionalTime =
    now - timer.startedAt;

  return {
    ...timer,

    running: false,

    startedAt: null,

    elapsed:
      timer.elapsed +
      additionalTime,
  };
}