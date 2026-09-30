
"use client";

import type {
  CreateReminderInput,
  Reminder,
  UpdateReminderInput,
} from "../types/reminder.types";

import {
  deleteOfflineData,
  getOfflineCollection,
  getOfflineData,
  saveOfflineData,
  type OfflineRecord,
} from "@/lib/offline/db";

/* =====================================================
   CONSTANTS
===================================================== */

const REMINDER_COLLECTION = "reminders";

/* =====================================================
   COLLECTION KEY
===================================================== */

function getReminderCollection(
  uid: string
): string {
  return `${REMINDER_COLLECTION}:${uid}`;
}

/* =====================================================
   RECORD ID
===================================================== */

function getReminderRecordId(
  uid: string,
  reminderId: string
): string {
  return `${getReminderCollection(uid)}:${reminderId}`;
}

/* =====================================================
   CONVERT RECORD TO REMINDER
===================================================== */

function recordToReminder(
  record: OfflineRecord
): Reminder | null {
  if (!record.data) {
    return null;
  }

  const data =
    record.data as Partial<Reminder>;

  if (
    typeof data.id !== "string" ||
    typeof data.userId !== "string" ||
    typeof data.title !== "string" ||
    typeof data.date !== "string" ||
    typeof data.time !== "string"
  ) {
    return null;
  }

  return {
    id: data.id,
    userId: data.userId,

    title: data.title,

    description:
      typeof data.description === "string"
        ? data.description
        : "",

    date: data.date,
    time: data.time,

    repeat:
      data.repeat ?? "none",

    repeatDays:
      Array.isArray(data.repeatDays)
        ? data.repeatDays
        : undefined,

    status:
      data.status === "completed"
        ? "completed"
        : "pending",

    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date().toISOString(),

    completedAt:
      typeof data.completedAt === "string"
        ? data.completedAt
        : null,
  };
}

/* =====================================================
   SORT REMINDERS
===================================================== */

function sortReminders(
  reminders: Reminder[]
): Reminder[] {
  return [...reminders].sort(
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
   GET LOCAL REMINDERS
===================================================== */

export async function getLocalReminders(
  uid: string
): Promise<Reminder[]> {
  const collection =
    getReminderCollection(uid);

  const records: OfflineRecord[] =
    await getOfflineCollection(
      collection
    );

  const reminders: Reminder[] = [];

  for (
    const record of records
  ) {
    const reminder =
      recordToReminder(record);

    if (reminder) {
      reminders.push(reminder);
    }
  }

  return sortReminders(reminders);
}

/* =====================================================
   GET ONE LOCAL REMINDER
===================================================== */

export async function getLocalReminder(
  uid: string,
  reminderId: string
): Promise<Reminder | null> {
  const recordId =
    getReminderRecordId(
      uid,
      reminderId
    );

  const record =
    await getOfflineData(recordId);

  if (!record) {
    return null;
  }

  return recordToReminder(record);
}

/* =====================================================
   CREATE LOCAL REMINDER
===================================================== */

export async function createLocalReminder(
  uid: string,
  input: CreateReminderInput
): Promise<Reminder> {
  const now =
    new Date().toISOString();

  const reminder: Reminder = {
    id: crypto.randomUUID(),

    userId: uid,

    title: input.title.trim(),

    description:
      input.description?.trim() ?? "",

    date: input.date,

    time: input.time,

    repeat:
      input.repeat ?? "none",

    repeatDays:
      input.repeat === "custom"
        ? input.repeatDays ?? []
        : undefined,

    status: "pending",

    createdAt: now,

    completedAt: null,
  };

  const record: OfflineRecord = {
    id: getReminderRecordId(
      uid,
      reminder.id
    ),

    collection:
      getReminderCollection(uid),

    data: reminder,

    updatedAt: Date.now(),

    syncStatus: "pending",
  };

  await saveOfflineData(record);

  return reminder;
}

/* =====================================================
   UPDATE LOCAL REMINDER
===================================================== */

export async function updateLocalReminder(
  uid: string,
  reminderId: string,
  input: UpdateReminderInput
): Promise<Reminder | null> {
  const existing =
    await getLocalReminder(
      uid,
      reminderId
    );

  if (!existing) {
    return null;
  }

  const updated: Reminder = {
    ...existing,

    ...(input.title !== undefined
      ? {
          title: input.title.trim(),
        }
      : {}),

    ...(input.description !== undefined
      ? {
          description:
            input.description.trim(),
        }
      : {}),

    ...(input.date !== undefined
      ? {
          date: input.date,
        }
      : {}),

    ...(input.time !== undefined
      ? {
          time: input.time,
        }
      : {}),

    ...(input.repeat !== undefined
      ? {
          repeat: input.repeat,
          repeatDays:
            input.repeat === "custom"
              ? input.repeatDays ?? []
              : undefined,
        }
      : {}),

    ...(input.repeat === "custom" &&
    input.repeatDays !== undefined
      ? {
          repeatDays:
            input.repeatDays,
        }
      : {}),

    ...(input.status !== undefined
      ? {
          status: input.status,
        }
      : {}),

    ...(input.completedAt !== undefined
      ? {
          completedAt:
            input.completedAt,
        }
      : {}),
  };

  const record: OfflineRecord = {
    id: getReminderRecordId(
      uid,
      reminderId
    ),

    collection:
      getReminderCollection(uid),

    data: updated,

    updatedAt: Date.now(),

    syncStatus: "pending",
  };

  await saveOfflineData(record);

  return updated;
}

/* =====================================================
   COMPLETE LOCAL REMINDER
===================================================== */

export async function completeLocalReminder(
  uid: string,
  reminderId: string
): Promise<Reminder | null> {
  return updateLocalReminder(
    uid,
    reminderId,
    {
      status: "completed",
      completedAt:
        new Date().toISOString(),
    }
  );
}

/* =====================================================
   REOPEN LOCAL REMINDER
===================================================== */

export async function reopenLocalReminder(
  uid: string,
  reminderId: string
): Promise<Reminder | null> {
  return updateLocalReminder(
    uid,
    reminderId,
    {
      status: "pending",
      completedAt: null,
    }
  );
}

/* =====================================================
   DELETE LOCAL REMINDER
===================================================== */

export async function deleteLocalReminder(
  uid: string,
  reminderId: string
): Promise<void> {
  const recordId =
    getReminderRecordId(
      uid,
      reminderId
    );

  await deleteOfflineData(
    recordId
  );
}

