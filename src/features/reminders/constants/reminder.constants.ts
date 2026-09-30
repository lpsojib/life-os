import type { ReminderRepeat } from "../types/reminder.types";

export const REMINDER_REPEAT_OPTIONS: {
  value: ReminderRepeat;
  label: string;
}[] = [
  {
    value: "none",
    label: "Don't repeat",
  },
  {
    value: "daily",
    label: "Every day",
  },
  {
    value: "weekly",
    label: "Every week",
  },
  {
    value: "monthly",
    label: "Every month",
  },
  {
    value: "yearly",
    label: "Every year",
  },
  {
    value: "custom",
    label: "Custom",
  },
];

export const REMINDER_STORAGE_KEY = "reminders";

export const REMINDER_COLLECTION = "reminders";