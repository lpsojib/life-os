"use client";

import type {
  Reminder,
} from "../types/reminder.types";

/* =====================================================
   TYPES
===================================================== */

type ReminderNotificationHandler = (
  reminder: Reminder
) => void;

interface ScheduledReminder {
  reminderId: string;
  timeoutId: ReturnType<typeof setTimeout>;
}

/* =====================================================
   STORAGE
===================================================== */

const scheduledReminders =
  new Map<
    string,
    ScheduledReminder
  >();

/* =====================================================
   CONSTANTS
===================================================== */

const MAX_TIMEOUT =
  2147483647;

/* =====================================================
   NOTIFICATION PERMISSION
===================================================== */

export async function requestReminderNotificationPermission(): Promise<NotificationPermission | null> {
  if (
    typeof window === "undefined" ||
    typeof Notification === "undefined"
  ) {
    return null;
  }

  if (
    Notification.permission ===
    "granted"
  ) {
    return "granted";
  }

  if (
    Notification.permission ===
    "denied"
  ) {
    return "denied";
  }

  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.warn(
      "Unable to request notification permission:",
      error
    );

    return null;
  }
}

/* =====================================================
   DATE HELPERS
===================================================== */

function createDate(
  date: string,
  time: string
): Date | null {
  const result = new Date(
    `${date}T${time}:00`
  );

  if (
    Number.isNaN(
      result.getTime()
    )
  ) {
    return null;
  }

  return result;
}

/* =====================================================
   NEXT DAILY
===================================================== */

function getNextDailyDate(
  date: Date
): Date {
  const next = new Date(date);

  next.setDate(
    next.getDate() + 1
  );

  return next;
}

/* =====================================================
   NEXT WEEKLY
===================================================== */

function getNextWeeklyDate(
  date: Date
): Date {
  const next = new Date(date);

  next.setDate(
    next.getDate() + 7
  );

  return next;
}

/* =====================================================
   NEXT MONTHLY
===================================================== */

function getNextMonthlyDate(
  date: Date
): Date {
  const next = new Date(date);

  const originalDay =
    date.getDate();

  next.setDate(1);

  next.setMonth(
    next.getMonth() + 1
  );

  const lastDayOfMonth =
    new Date(
      next.getFullYear(),
      next.getMonth() + 1,
      0
    ).getDate();

  next.setDate(
    Math.min(
      originalDay,
      lastDayOfMonth
    )
  );

  return next;
}

/* =====================================================
   NEXT YEARLY
===================================================== */

function getNextYearlyDate(
  date: Date
): Date {
  const next = new Date(date);

  const originalMonth =
    date.getMonth();

  const originalDay =
    date.getDate();

  next.setDate(1);

  next.setFullYear(
    next.getFullYear() + 1
  );

  next.setMonth(
    originalMonth
  );

  const lastDayOfMonth =
    new Date(
      next.getFullYear(),
      originalMonth + 1,
      0
    ).getDate();

  next.setDate(
    Math.min(
      originalDay,
      lastDayOfMonth
    )
  );

  return next;
}

/* =====================================================
   NEXT CUSTOM DAY
   -----------------------------------------------------
   0 = Sunday
   1 = Monday
   ...
   6 = Saturday
===================================================== */

function getNextCustomDate(
  date: Date,
  repeatDays: number[]
): Date | null {
  if (
    repeatDays.length === 0
  ) {
    return null;
  }

  const sortedDays =
    [...repeatDays].sort(
      (a, b) => a - b
    );

  const currentDay =
    date.getDay();

  for (
    const day of sortedDays
  ) {
    if (
      day > currentDay
    ) {
      const next =
        new Date(date);

      next.setDate(
        next.getDate() +
          (day - currentDay)
      );

      return next;
    }
  }

  /*
   * No remaining day this week.
   * Go to the first selected day
   * of next week.
   */

  const firstDay =
    sortedDays[0];

  const daysUntilNext =
    7 -
    currentDay +
    firstDay;

  const next =
    new Date(date);

  next.setDate(
    next.getDate() +
      daysUntilNext
  );

  return next;
}

/* =====================================================
   GET NEXT OCCURRENCE
===================================================== */

function getNextOccurrence(
  reminder: Reminder,
  currentDate: Date
): Date | null {
  switch (reminder.repeat) {
    case "daily":
      return getNextDailyDate(
        currentDate
      );

    case "weekly":
      return getNextWeeklyDate(
        currentDate
      );

    case "monthly":
      return getNextMonthlyDate(
        currentDate
      );

    case "yearly":
      return getNextYearlyDate(
        currentDate
      );

    case "custom":
      return getNextCustomDate(
        currentDate,
        reminder.repeatDays ?? []
      );

    case "none":
    default:
      return null;
  }
}

/* =====================================================
   SHOW NOTIFICATION
===================================================== */

function showReminderNotification(
  reminder: Reminder
): void {
  if (
    typeof window === "undefined" ||
    typeof Notification === "undefined"
  ) {
    return;
  }

  if (
    Notification.permission !==
    "granted"
  ) {
    return;
  }

  try {
    const notification =
      new Notification(
        reminder.title ||
          "Reminder",
        {
          body:
            reminder.description ||
            "You have a reminder.",
          tag:
            `life-os-reminder-${reminder.id}`,
          requireInteraction: true,
        }
      );

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.warn(
      "Failed to show reminder notification:",
      error
    );
  }
}

/* =====================================================
   CLEAR ONE
===================================================== */

export function clearScheduledReminder(
  reminderId: string
): void {
  const scheduled =
    scheduledReminders.get(
      reminderId
    );

  if (!scheduled) {
    return;
  }

  clearTimeout(
    scheduled.timeoutId
  );

  scheduledReminders.delete(
    reminderId
  );
}

/* =====================================================
   CLEAR ALL
===================================================== */

export function clearAllScheduledReminders(): void {
  for (
    const scheduled of
    scheduledReminders.values()
  ) {
    clearTimeout(
      scheduled.timeoutId
    );
  }

  scheduledReminders.clear();
}

/* =====================================================
   SCHEDULE ONE
===================================================== */

export function scheduleReminder(
  reminder: Reminder,
  onTrigger?: ReminderNotificationHandler
): boolean {
  clearScheduledReminder(
    reminder.id
  );

  if (
    reminder.status !==
    "pending"
  ) {
    return false;
  }

  const reminderDate =
    createDate(
      reminder.date,
      reminder.time
    );

  if (!reminderDate) {
    return false;
  }

  const now =
    new Date();

  /*
   * If the reminder is in the past,
   * calculate its next repeat occurrence.
   */

  let targetDate =
    reminderDate;

  if (
    targetDate.getTime() <=
    now.getTime()
  ) {
    const next =
      getNextOccurrence(
        reminder,
        targetDate
      );

    if (!next) {
      return false;
    }

    targetDate = next;

    /*
     * If the calculated occurrence
     * is still in the past, continue
     * until we reach the future.
     */

    while (
      targetDate.getTime() <=
      now.getTime()
    ) {
      const nextOccurrence =
        getNextOccurrence(
          reminder,
          targetDate
        );

      if (!nextOccurrence) {
        return false;
      }

      targetDate =
        nextOccurrence;
    }
  }

  const delay =
    targetDate.getTime() -
    Date.now();

  if (delay <= 0) {
    return false;
  }

  /*
   * setTimeout maximum delay protection.
   */

  const actualDelay =
    Math.min(
      delay,
      MAX_TIMEOUT
    );

  const timeoutId =
    setTimeout(() => {
      /*
       * For very distant reminders,
       * schedule again instead of
       * trying to wait beyond the
       * browser timeout limit.
       */

      if (
        delay >
        MAX_TIMEOUT
      ) {
        scheduleReminder(
          reminder,
          onTrigger
        );

        return;
      }

      scheduledReminders.delete(
        reminder.id
      );

      showReminderNotification(
        reminder
      );

      onTrigger?.(
        reminder
      );

      /*
       * Automatically schedule the
       * next occurrence for repeating
       * reminders.
       */

      if (
        reminder.repeat !==
        "none"
      ) {
        scheduleReminder(
          reminder,
          onTrigger
        );
      }
    }, actualDelay);

  scheduledReminders.set(
    reminder.id,
    {
      reminderId:
        reminder.id,
      timeoutId,
    }
  );

  return true;
}

/* =====================================================
   SCHEDULE MANY
===================================================== */

export function scheduleReminders(
  reminders: Reminder[],
  onTrigger?: ReminderNotificationHandler
): void {
  for (
    const reminder of
    reminders
  ) {
    scheduleReminder(
      reminder,
      onTrigger
    );
  }
}

/* =====================================================
   RESCHEDULE
===================================================== */

export function rescheduleReminder(
  reminder: Reminder,
  onTrigger?: ReminderNotificationHandler
): boolean {
  clearScheduledReminder(
    reminder.id
  );

  return scheduleReminder(
    reminder,
    onTrigger
  );
}

/* =====================================================
   CHECK STATUS
===================================================== */

export function isReminderScheduled(
  reminderId: string
): boolean {
  return scheduledReminders.has(
    reminderId
  );
}