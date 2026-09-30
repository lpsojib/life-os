"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  CreateReminderInput,
  Reminder,
  UpdateReminderInput,
} from "../types/reminder.types";

import {
  completeReminder,
  createReminder,
  deleteReminder,
  getReminders,
  reopenReminder,
  updateReminder,
} from "../services/reminder.service";

/* =====================================================
   TYPES
===================================================== */

interface UseRemindersReturn {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;

  refreshReminders: () => Promise<void>;

  addReminder: (
    input: CreateReminderInput
  ) => Promise<Reminder | null>;

  editReminder: (
    reminderId: string,
    input: UpdateReminderInput
  ) => Promise<Reminder | null>;

  complete: (
    reminderId: string
  ) => Promise<Reminder | null>;

  reopen: (
    reminderId: string
  ) => Promise<Reminder | null>;

  remove: (
    reminderId: string
  ) => Promise<boolean>;
}

/* =====================================================
   SORT
===================================================== */

function sortReminders(
  reminders: Reminder[]
): Reminder[] {
  return [...reminders].sort((a, b) => {
    const first =
      `${a.date}T${a.time}`;

    const second =
      `${b.date}T${b.time}`;

    return first.localeCompare(second);
  });
}

/* =====================================================
   HOOK
===================================================== */

export function useReminders(
  uid: string | null | undefined
): UseRemindersReturn {
  const [reminders, setReminders] =
    useState<Reminder[]>([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);

  /* ===================================================
     LOAD REMINDERS
  =================================================== */

  const loadReminders =
    useCallback(async () => {
      if (!uid) {
        return {
          reminders: [],
          error: null,
        };
      }

      try {
        const data =
          await getReminders(uid);

        return {
          reminders: sortReminders(data),
          error: null,
        };
      } catch (err) {
        console.error(
          "Failed to load reminders:",
          err
        );

        return {
          reminders: [],
          error: "Failed to load reminders.",
        };
      }
    }, [uid]);

  /* ===================================================
     INITIAL LOAD / UID CHANGE
  =================================================== */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const result =
        await loadReminders();

      if (cancelled) return;

      setReminders(result.reminders);
      setError(result.error);
      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [loadReminders]);

  /* ===================================================
     REFRESH
  =================================================== */

  const refreshReminders =
    useCallback(async () => {
      if (!uid) {
        setReminders([]);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data =
          await getReminders(uid);

        setReminders(
          sortReminders(data)
        );
      } catch (err) {
        console.error(
          "Failed to refresh reminders:",
          err
        );

        setError(
          "Failed to load reminders."
        );
      } finally {
        setLoading(false);
      }
    }, [uid]);

  /* ===================================================
     ADD REMINDER
  =================================================== */

  const addReminder =
    useCallback(
      async (
        input: CreateReminderInput
      ): Promise<Reminder | null> => {
        if (!uid) {
          setError(
            "User is not authenticated."
          );

          return null;
        }

        try {
          setError(null);

          const reminder =
            await createReminder(
              uid,
              input
            );

          setReminders((current) =>
            sortReminders([
              ...current,
              reminder,
            ])
          );

          return reminder;
        } catch (err) {
          console.error(
            "Failed to create reminder:",
            err
          );

          setError(
            "Failed to create reminder."
          );

          return null;
        }
      },
      [uid]
    );

  /* ===================================================
     EDIT REMINDER
  =================================================== */

  const editReminder =
    useCallback(
      async (
        reminderId: string,
        input: UpdateReminderInput
      ): Promise<Reminder | null> => {
        if (!uid) {
          setError(
            "User is not authenticated."
          );

          return null;
        }

        try {
          setError(null);

          const updated =
            await updateReminder(
              uid,
              reminderId,
              input
            );

          if (!updated) {
            setError(
              "Reminder not found."
            );

            return null;
          }

          setReminders((current) =>
            sortReminders(
              current.map(
                (reminder) =>
                  reminder.id ===
                  reminderId
                    ? updated
                    : reminder
              )
            )
          );

          return updated;
        } catch (err) {
          console.error(
            "Failed to update reminder:",
            err
          );

          setError(
            "Failed to update reminder."
          );

          return null;
        }
      },
      [uid]
    );

  /* ===================================================
     COMPLETE REMINDER
  =================================================== */

  const complete =
    useCallback(
      async (
        reminderId: string
      ): Promise<Reminder | null> => {
        if (!uid) {
          setError(
            "User is not authenticated."
          );

          return null;
        }

        try {
          setError(null);

          const updated =
            await completeReminder(
              uid,
              reminderId
            );

          if (!updated) {
            setError(
              "Reminder not found."
            );

            return null;
          }

          setReminders((current) =>
            current.map(
              (reminder) =>
                reminder.id ===
                reminderId
                  ? updated
                  : reminder
            )
          );

          return updated;
        } catch (err) {
          console.error(
            "Failed to complete reminder:",
            err
          );

          setError(
            "Failed to complete reminder."
          );

          return null;
        }
      },
      [uid]
    );

  /* ===================================================
     REOPEN REMINDER
  =================================================== */

  const reopen =
    useCallback(
      async (
        reminderId: string
      ): Promise<Reminder | null> => {
        if (!uid) {
          setError(
            "User is not authenticated."
          );

          return null;
        }

        try {
          setError(null);

          const updated =
            await reopenReminder(
              uid,
              reminderId
            );

          if (!updated) {
            setError(
              "Reminder not found."
            );

            return null;
          }

          setReminders((current) =>
            current.map(
              (reminder) =>
                reminder.id ===
                reminderId
                  ? updated
                  : reminder
            )
          );

          return updated;
        } catch (err) {
          console.error(
            "Failed to reopen reminder:",
            err
          );

          setError(
            "Failed to reopen reminder."
          );

          return null;
        }
      },
      [uid]
    );

  /* ===================================================
     DELETE REMINDER
  =================================================== */

  const remove =
    useCallback(
      async (
        reminderId: string
      ): Promise<boolean> => {
        if (!uid) {
          setError(
            "User is not authenticated."
          );

          return false;
        }

        try {
          setError(null);

          await deleteReminder(
            uid,
            reminderId
          );

          setReminders((current) =>
            current.filter(
              (reminder) =>
                reminder.id !==
                reminderId
            )
          );

          return true;
        } catch (err) {
          console.error(
            "Failed to delete reminder:",
            err
          );

          setError(
            "Failed to delete reminder."
          );

          return false;
        }
      },
      [uid]
    );

  /* ===================================================
     RETURN
  =================================================== */

  return {
    reminders,
    loading,
    error,
    refreshReminders,
    addReminder,
    editReminder,
    complete,
    reopen,
    remove,
  };
}