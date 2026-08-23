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
   FIRESTORE
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
   AUTH
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
   LOAD TIMER
   ========================================================= */

export async function loadFocusTimer(
  user: User
): Promise<FocusItem | null> {
  const timerRef =
    getTimerRef(user);

  const snapshot =
    await getDoc(timerRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    id:
      typeof data.id === "string"
        ? data.id
        : TIMER_ID,

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
}

/* =========================================================
   SAVE TIMER
   ========================================================= */

export async function saveFocusTimer(
  user: User,
  timer: FocusItem
): Promise<void> {
  const timerRef =
    getTimerRef(user);

  await setDoc(
    timerRef,
    {
      id: timer.id,
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
}

/* =========================================================
   ELAPSED TIME
   ========================================================= */

export function getElapsedTime(
  timer: FocusItem
): number {
  if (
    !timer.running ||
    timer.startedAt === null
  ) {
    return timer.elapsed;
  }

  return (
    timer.elapsed +
    (Date.now() -
      timer.startedAt)
  );
}

/* =========================================================
   START
   ========================================================= */

export function startFocus(
  timer: FocusItem
): FocusItem {
  if (timer.running) {
    return timer;
  }

  return {
    ...timer,

    running: true,

    startedAt: Date.now(),
  };
}

/* =========================================================
   PAUSE
   ========================================================= */

export function pauseFocus(
  timer: FocusItem
): FocusItem {
  if (
    !timer.running ||
    timer.startedAt === null
  ) {
    return timer;
  }

  const additionalTime =
    Date.now() -
    timer.startedAt;

  return {
    ...timer,

    running: false,

    startedAt: null,

    elapsed:
      timer.elapsed +
      additionalTime,
  };
}

/* =========================================================
   RESET
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