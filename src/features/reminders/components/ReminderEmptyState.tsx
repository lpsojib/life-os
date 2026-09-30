"use client";

import {
  Bell,
  Plus,
} from "lucide-react";

interface ReminderEmptyStateProps {
  onCreate: () => void;
}

export default function ReminderEmptyState({
  onCreate,
}: ReminderEmptyStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
        <Bell size={25} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-gray-900">
        No reminders yet
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-5 text-gray-500">
        Create your first reminder so you don&apos;t forget something important.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-gray-800"
      >
        <Plus size={16} />

        Create Reminder
      </button>
    </div>
  );
}