import { Habit } from "../types/habit.types";

/**
 * Habit notification দেখানোর জন্য
 */
export const showHabitNotification = (
  habit: Habit
) => {
  if (
    typeof window === "undefined" ||
    !("Notification" in window)
  ) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  new Notification("অভ্যাসের সময় হয়েছে 🔔", {
    body: `${habit.name} — এখন আপনার অভ্যাসটি করুন।`,
    icon: "/icon-192.png",
  });
};

/**
 * নির্দিষ্ট Habit-এর সময় হয়েছে কি না
 */
export const isHabitTime = (
  habit: Habit
): boolean => {
  const now = new Date();

  const [hour, minute] =
    habit.time.split(":").map(Number);

  return (
    now.getHours() === hour &&
    now.getMinutes() === minute
  );
};

/**
 * আজকের তারিখ
 */
export const getTodayKey = (): string => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * আজ এই Habit-এর notification
 * ইতিমধ্যে দেখানো হয়েছে কি না
 */
const getNotificationKey = (
  habitId: string
): string => {
  return `habit-notification-${habitId}-${getTodayKey()}`;
};

/**
 * Notification দেখানোর জন্য
 *
 * একই দিনে একই Habit-এর জন্য
 * একবারের বেশি notification হবে না।
 */
export const notifyHabitIfNeeded = (
  habit: Habit
) => {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  if (habit.status !== "active") {
    return;
  }

  if (!habit.time) {
    return;
  }

  if (!isHabitTime(habit)) {
    return;
  }

  const notificationKey =
    getNotificationKey(habit.id);

  const alreadyNotified =
    localStorage.getItem(
      notificationKey
    );

  if (alreadyNotified) {
    return;
  }

  showHabitNotification(habit);

  localStorage.setItem(
    notificationKey,
    "true"
  );
};