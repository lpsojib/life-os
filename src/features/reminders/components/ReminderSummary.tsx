"use client";

import {
  Bell,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import type { Reminder } from "../types/reminder.types";

interface ReminderSummaryProps {
  reminders: Reminder[];
}

export default function ReminderSummary({
  reminders,
}: ReminderSummaryProps) {
  const total =
    reminders.length;

  const completed =
    reminders.filter(
      (reminder) =>
        reminder.status ===
        "completed"
    ).length;

  const pending =
    reminders.filter(
      (reminder) =>
        reminder.status ===
        "pending"
    ).length;

  const items = [
    {
      label: "Total",
      value: total,
      icon: Bell,
    },
    {
      label: "Pending",
      value: pending,
      icon: Clock3,
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => {
        const Icon =
          item.icon;

        return (
          <div
            key={item.label}
            className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4"
          >
            <div className="flex items-center gap-2 text-gray-500">
              <Icon size={16} />

              <span className="text-xs font-medium sm:text-sm">
                {item.label}
              </span>
            </div>

            <p className="mt-2 text-xl font-semibold text-gray-900 sm:text-2xl">
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}