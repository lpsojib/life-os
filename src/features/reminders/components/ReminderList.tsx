"use client";

import type { Reminder } from "../types/reminder.types";

import ReminderCard from "./ReminderCard";

interface ReminderListProps {
  reminders: Reminder[];
  onEdit?: (reminder: Reminder) => void;
  onComplete?: (reminder: Reminder) => void;
  onReopen?: (reminder: Reminder) => void;
  onDelete?: (reminder: Reminder) => void;
}

export default function ReminderList({
  reminders,
  onEdit,
  onComplete,
  onReopen,
  onDelete,
}: ReminderListProps) {
  if (reminders.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {reminders.map((reminder) => (
        <ReminderCard
          key={reminder.id}
          reminder={reminder}
          onEdit={() =>
            onEdit?.(reminder)
          }
          onComplete={() =>
            onComplete?.(reminder)
          }
          onReopen={() =>
            onReopen?.(reminder)
          }
          onDelete={() =>
            onDelete?.(reminder)
          }
        />
      ))}
    </div>
  );
}