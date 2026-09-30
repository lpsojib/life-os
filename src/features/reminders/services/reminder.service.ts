"use client";

import { Capacitor } from "@capacitor/core";

import type {
  CreateReminderInput,
  Reminder,
  UpdateReminderInput,
} from "../types/reminder.types";

import {
  createFirebaseReminder,
  deleteFirebaseReminder,
  getFirebaseReminders,
  updateFirebaseReminder,
} from "./reminder.firebase";

import {
  completeLocalReminder,
  createLocalReminder,
  deleteLocalReminder,
  getLocalReminders,
  reopenLocalReminder,
  updateLocalReminder,
} from "./reminder.storage";

import LifeOSAlarm from "./lifeos-alarm";

/* =====================================================
   SORT REMINDERS
===================================================== */

function sortReminders(
  reminders: Reminder[]
): Reminder[] {
  return [...reminders].sort((a, b) => {
    const first =
      `${a.date}T${a.time}`;

    const second =
      `${b.date}T${b.time}`;

    return first.localeCompare(second);
  });
}

/* =====================================================
   CHECK NATIVE ANDROID APP
===================================================== */

function isNativeAndroid(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  );
}

/* =====================================================
   GET REMINDER TIMESTAMP
===================================================== */

function getReminderTimestamp(
  reminder: Reminder
): number {
  const dateTime =
    new Date(
      `${reminder.date}T${reminder.time}:00`
    );

  return dateTime.getTime();
}

/* =====================================================
   ENSURE EXACT ALARM PERMISSION
===================================================== */

async function ensureExactAlarmPermission(): Promise<boolean> {
  if (!isNativeAndroid()) {
    return true;
  }

  try {
    const permission =
      await LifeOSAlarm.checkExactAlarmPermission();

    if (permission.granted) {
      return true;
    }

    await LifeOSAlarm.requestExactAlarmPermission();

    /*
     * Android settings screen has been opened.
     *
     * We check again after returning from the
     * native settings screen.
     */

    const updatedPermission =
      await LifeOSAlarm.checkExactAlarmPermission();

    return updatedPermission.granted;
  } catch (error) {
    console.warn(
      "Exact alarm permission check failed:",
      error
    );

    return false;
  }
}

/* =====================================================
   SCHEDULE NATIVE ALARM
===================================================== */

async function scheduleNativeAlarm(
  reminder: Reminder
): Promise<void> {
  if (!isNativeAndroid()) {
    return;
  }

  if (reminder.status === "completed") {
    return;
  }

  const triggerAt =
    getReminderTimestamp(reminder);

  /*
   * Do not schedule alarms that are already
   * in the past.
   */

  if (
    !Number.isFinite(triggerAt) ||
    triggerAt <= Date.now()
  ) {
    return;
  }

  /*
   * Make sure Android exact alarm permission
   * is available before scheduling.
   */

  const permissionGranted =
    await ensureExactAlarmPermission();

  if (!permissionGranted) {
    console.warn(
      "Exact alarm permission is not granted. Native alarm was not scheduled."
    );

    return;
  }

  try {
    await LifeOSAlarm.scheduleAlarm({
      alarmId: reminder.id,
      triggerAt,
      title: reminder.title,
      description: reminder.description,
      sound: "default",
      vibration: true,
    });
  } catch (error) {
    /*
     * Native alarm failure must not break
     * reminder creation/update.
     *
     * The reminder itself is already safely
     * stored in IndexedDB/Firebase.
     */

    console.warn(
      "Native reminder alarm schedule failed:",
      error
    );
  }
}

/* =====================================================
   CANCEL NATIVE ALARM
===================================================== */

async function cancelNativeAlarm(
  reminderId: string
): Promise<void> {
  if (!isNativeAndroid()) {
    return;
  }

  try {
    await LifeOSAlarm.cancelAlarm({
      alarmId: reminderId,
    });
  } catch (error) {
    console.warn(
      "Native reminder alarm cancel failed:",
      error
    );
  }
}

/* =====================================================
   GET REMINDERS
   -----------------------------------------------------
   Local first.
   Firebase refresh runs when online.
===================================================== */

export async function getReminders(
  uid: string
): Promise<Reminder[]> {
  const localReminders =
    await getLocalReminders(uid);

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine
  ) {
    try {
      const firebaseReminders =
        await getFirebaseReminders(uid);

      const reminderMap =
        new Map<string, Reminder>();

      /*
       * Keep local data first.
       * This protects locally-created/updated
       * pending changes.
       */

      for (
        const reminder of localReminders
      ) {
        reminderMap.set(
          reminder.id,
          reminder
        );
      }

      /*
       * Add Firebase reminders that do not
       * already exist locally.
       */

      for (
        const reminder of firebaseReminders
      ) {
        if (
          !reminderMap.has(reminder.id)
        ) {
          reminderMap.set(
            reminder.id,
            reminder
          );
        }
      }

      return sortReminders(
        Array.from(
          reminderMap.values()
        )
      );
    } catch (error) {
      console.warn(
        "Firebase reminder refresh failed:",
        error
      );
    }
  }

  return localReminders;
}

/* =====================================================
   CREATE
===================================================== */

export async function createReminder(
  uid: string,
  input: CreateReminderInput
): Promise<Reminder> {
  const reminder =
    await createLocalReminder(
      uid,
      input
    );

  /*
   * Schedule native Android alarm.
   * Internet is NOT required.
   *
   * Exact alarm permission will be checked
   * automatically.
   */

  await scheduleNativeAlarm(
    reminder
  );

  /*
   * Firebase sync remains unchanged.
   */

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine
  ) {
    try {
      await createFirebaseReminder(
        uid,
        reminder
      );
    } catch (error) {
      console.warn(
        "Firebase reminder create failed. Keeping local copy:",
        error
      );
    }
  }

  return reminder;
}

/* =====================================================
   UPDATE
===================================================== */

export async function updateReminder(
  uid: string,
  reminderId: string,
  input: UpdateReminderInput
): Promise<Reminder | null> {
  /*
   * Cancel the old native alarm first.
   *
   * This prevents the old date/time from
   * triggering after an edit.
   */

  await cancelNativeAlarm(
    reminderId
  );

  const reminder =
    await updateLocalReminder(
      uid,
      reminderId,
      input
    );

  if (!reminder) {
    return null;
  }

  /*
   * If reminder is still pending,
   * schedule its new date/time.
   */

  await scheduleNativeAlarm(
    reminder
  );

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine
  ) {
    try {
      await updateFirebaseReminder(
        uid,
        reminder
      );
    } catch (error) {
      console.warn(
        "Firebase reminder update failed. Keeping local copy:",
        error
      );
    }
  }

  return reminder;
}

/* =====================================================
   COMPLETE
===================================================== */

export async function completeReminder(
  uid: string,
  reminderId: string
): Promise<Reminder | null> {
  /*
   * Stop/cancel native alarm first.
   */

  await cancelNativeAlarm(
    reminderId
  );

  const reminder =
    await completeLocalReminder(
      uid,
      reminderId
    );

  if (!reminder) {
    return null;
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine
  ) {
    try {
      await updateFirebaseReminder(
        uid,
        reminder
      );
    } catch (error) {
      console.warn(
        "Firebase reminder completion failed. Keeping local copy:",
        error
      );
    }
  }

  return reminder;
}

/* =====================================================
   REOPEN
===================================================== */

export async function reopenReminder(
  uid: string,
  reminderId: string
): Promise<Reminder | null> {
  const reminder =
    await reopenLocalReminder(
      uid,
      reminderId
    );

  if (!reminder) {
    return null;
  }

  /*
   * Reopen করলে আবার native alarm schedule হবে.
   */

  await scheduleNativeAlarm(
    reminder
  );

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine
  ) {
    try {
      await updateFirebaseReminder(
        uid,
        reminder
      );
    } catch (error) {
      console.warn(
        "Firebase reminder reopen failed. Keeping local copy:",
        error
      );
    }
  }

  return reminder;
}

/* =====================================================
   DELETE
===================================================== */

export async function deleteReminder(
  uid: string,
  reminderId: string
): Promise<void> {
  /*
   * Cancel native alarm first.
   */

  await cancelNativeAlarm(
    reminderId
  );

  /*
   * Delete local reminder.
   */

  await deleteLocalReminder(
    uid,
    reminderId
  );

  /*
   * Firebase delete remains unchanged.
   */

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine
  ) {
    try {
      await deleteFirebaseReminder(
        uid,
        reminderId
      );
    } catch (error) {
      console.warn(
        "Firebase reminder delete failed:",
        error
      );
    }
  }
}