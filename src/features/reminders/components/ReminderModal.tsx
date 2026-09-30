"use client";

import {
  X,
} from "lucide-react";

import type {
  CreateReminderInput,
  Reminder,
  UpdateReminderInput,
} from "../types/reminder.types";

import ReminderForm from "./ReminderForm";

interface ReminderModalProps {
  open: boolean;
  reminder?: Reminder | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (
    input:
      | CreateReminderInput
      | UpdateReminderInput
  ) => Promise<void> | void;
}

export default function ReminderModal({
  open,
  reminder = null,
  loading = false,
  onClose,
  onSubmit,
}: ReminderModalProps) {
  if (!open) {
    return null;
  }

  const isEditMode =
    Boolean(reminder);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditMode
                ? "Edit Reminder"
                : "New Reminder"}
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              {isEditMode
                ? "Update your reminder"
                : "Create a new reminder"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        {/* Form */}

        <div className="p-5">
          <ReminderForm
            reminder={reminder}
            loading={loading}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}