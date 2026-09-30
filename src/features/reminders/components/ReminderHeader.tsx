"use client";

import {
  Bell,
  Plus,
} from "lucide-react";

interface ReminderHeaderProps {
  onCreate: () => void;
}

export default function ReminderHeader({
  onCreate,
}: ReminderHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
          <Bell size={21} />
        </div>

        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            Reminders
          </h1>

          <p className="mt-0.5 text-sm text-gray-500">
            Keep track of important things at the right time.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-gray-800"
      >
        <Plus size={17} />

        New Reminder
      </button>
    </div>
  );
}