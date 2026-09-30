
"use client";

import {
  deleteDoc,
  doc,
  getDocs,
  collection,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import type {
  Reminder,
} from "../types/reminder.types";

/* =====================================================
   FIREBASE COLLECTION
===================================================== */

function getReminderCollection(
  uid: string
) {
  return collection(
    db,
    "users",
    uid,
    "reminders"
  );
}

/* =====================================================
   CREATE / SAVE REMINDER
   -----------------------------------------------------
   Uses reminder.id as Firebase document ID.
   This prevents duplicate documents.
===================================================== */

export async function createFirebaseReminder(
  uid: string,
  reminder: Reminder
): Promise<void> {
  const reminderRef = doc(
    db,
    "users",
    uid,
    "reminders",
    reminder.id
  );

  await setDoc(
    reminderRef,
    {
      ...reminder,
    }
  );
}

/* =====================================================
   GET ALL REMINDERS
===================================================== */

export async function getFirebaseReminders(
  uid: string
): Promise<Reminder[]> {
  const collectionRef =
    getReminderCollection(uid);

  const snapshot =
    await getDocs(collectionRef);

  const reminders: Reminder[] = [];

  snapshot.forEach((item) => {
    const data =
      item.data() as Reminder;

    reminders.push({
      ...data,
      id: item.id,
    });
  });

  return reminders.sort(
    (a, b) => {
      const first =
        `${a.date}T${a.time}`;

      const second =
        `${b.date}T${b.time}`;

      return first.localeCompare(
        second
      );
    }
  );
}

/* =====================================================
   UPDATE REMINDER
===================================================== */

export async function updateFirebaseReminder(
  uid: string,
  reminder: Reminder
): Promise<void> {
  const reminderRef = doc(
    db,
    "users",
    uid,
    "reminders",
    reminder.id
  );

  await setDoc(
    reminderRef,
    {
      ...reminder,
    },
    {
      merge: true,
    }
  );
}

/* =====================================================
   DELETE REMINDER
===================================================== */

export async function deleteFirebaseReminder(
  uid: string,
  reminderId: string
): Promise<void> {
  const reminderRef = doc(
    db,
    "users",
    uid,
    "reminders",
    reminderId
  );

  await deleteDoc(reminderRef);
}

