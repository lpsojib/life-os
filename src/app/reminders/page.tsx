"use client";

import {
  useState,
} from "react";

import type {
  CreateReminderInput,
  Reminder,
  UpdateReminderInput,
} from "@/features/reminders/types/reminder.types";

import ReminderEmptyState from "@/features/reminders/components/ReminderEmptyState";
import ReminderHeader from "@/features/reminders/components/ReminderHeader";
import ReminderList from "@/features/reminders/components/ReminderList";
import ReminderModal from "@/features/reminders/components/ReminderModal";
import ReminderSummary from "@/features/reminders/components/ReminderSummary";

import {
  useReminders,
} from "@/features/reminders/hooks/useReminders";

import {
  useReminderScheduler,
} from "@/features/reminders/hooks/useReminderScheduler";

import {
  useAuthStore,
} from "@/store/auth.store";

export default function RemindersPage() {
  const user =
    useAuthStore(
      (state) => state.user
    );

  const uid =
    user?.uid ?? null;

  const {
    reminders,
    loading,
    error,
    addReminder,
    editReminder,
    complete,
    reopen,
    remove,
  } = useReminders(uid);

  /*
   * Schedule all pending reminders.
   *
   * Notification permission is requested
   * only when the user creates/uses a
   * reminder through the browser.
   */

  const {
    requestPermission,
  } = useReminderScheduler(
    reminders
  );

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingReminder,
    setEditingReminder,
  ] = useState<Reminder | null>(
    null
  );

  /* =====================================================
     CREATE MODAL
  ===================================================== */

  function handleCreate() {
    setEditingReminder(null);
    setModalOpen(true);
  }

  /* =====================================================
     EDIT MODAL
  ===================================================== */

  function handleEdit(
    reminder: Reminder
  ) {
    setEditingReminder(reminder);
    setModalOpen(true);
  }

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  function handleClose() {
    setModalOpen(false);
    setEditingReminder(null);
  }

  /* =====================================================
     SAVE REMINDER
  ===================================================== */

  async function handleSubmit(
    input:
      | CreateReminderInput
      | UpdateReminderInput
  ) {
    /*
     * Ask browser for notification
     * permission when saving.
     *
     * No notification setting/toggle
     * is shown in the UI.
     */

    await requestPermission();

    if (editingReminder) {
      const updated =
        await editReminder(
          editingReminder.id,
          input as UpdateReminderInput
        );

      if (updated) {
        handleClose();
      }

      return;
    }

    const created =
      await addReminder(
        input as CreateReminderInput
      );

    if (created) {
      handleClose();
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-full p-4 sm:p-6">
        <div className="mx-auto w-full max-w-7xl">
          <ReminderHeader
            onCreate={handleCreate}
          />

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-2xl bg-gray-100"
                />
              )
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl bg-gray-100"
                />
              )
            )}
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <>
      <main className="min-h-full p-4 sm:p-6">
        <div className="mx-auto w-full max-w-7xl">
          {/* Header */}

          <ReminderHeader
            onCreate={handleCreate}
          />

          {/* Summary */}

          <div className="mt-6">
            <ReminderSummary
              reminders={reminders}
            />
          </div>

          {/* Error */}

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Reminder List */}

          <div className="mt-6">
            {reminders.length === 0 ? (
              <ReminderEmptyState
                onCreate={handleCreate}
              />
            ) : (
              <ReminderList
                reminders={reminders}
                onEdit={handleEdit}
                onComplete={(reminder) => {
                  void complete(
                    reminder.id
                  );
                }}
                onReopen={(reminder) => {
                  void reopen(
                    reminder.id
                  );
                }}
                onDelete={(reminder) => {
                  void remove(
                    reminder.id
                  );
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* =================================================
          REMINDER MODAL
      ================================================= */}

      <ReminderModal
        open={modalOpen}
        reminder={editingReminder}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    </>
  );
}