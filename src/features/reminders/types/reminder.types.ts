export type ReminderRepeat =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export type ReminderStatus = "pending" | "completed";

export interface Reminder {
  id: string;
  userId: string;

  title: string;
  description: string;

  date: string; // YYYY-MM-DD
  time: string; // HH:mm

  repeat: ReminderRepeat;
  repeatDays?: number[];

  status: ReminderStatus;

  createdAt: string;
  completedAt: string | null;
}

export interface CreateReminderInput {
  title: string;
  description?: string;

  date: string;
  time: string;

  repeat?: ReminderRepeat;
  repeatDays?: number[];
}

export interface UpdateReminderInput {
  title?: string;
  description?: string;

  date?: string;
  time?: string;

  repeat?: ReminderRepeat;
  repeatDays?: number[];

  status?: ReminderStatus;
  completedAt?: string | null;
}