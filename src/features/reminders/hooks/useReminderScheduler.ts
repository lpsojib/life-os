"use client";

import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import type {
  Reminder,
} from "../types/reminder.types";

import {
  clearAllScheduledReminders,
  requestReminderNotificationPermission,
  scheduleReminders,
} from "../services/reminder.scheduler";

/* =====================================================
   TYPES
===================================================== */

interface UseReminderSchedulerOptions {
  enabled?: boolean;
  onTrigger?: (
    reminder: Reminder
  ) => void;
}

/* =====================================================
   HOOK
===================================================== */

export function useReminderScheduler(
  reminders: Reminder[],
  options: UseReminderSchedulerOptions = {}
) {
  const {
    enabled = true,
    onTrigger,
  } = options;

  const triggerRef =
    useRef(onTrigger);

  /*
   * Keep latest callback without
   * forcing the scheduler effect to
   * restart every render.
   */

  useEffect(() => {
    triggerRef.current =
      onTrigger;
  }, [onTrigger]);

  const requestPermission =
    useCallback(async () => {
      return requestReminderNotificationPermission();
    }, []);

  useEffect(() => {
    if (!enabled) {
      clearAllScheduledReminders();
      return;
    }

    if (
      typeof window === "undefined"
    ) {
      return;
    }

    if (
      reminders.length === 0
    ) {
      clearAllScheduledReminders();
      return;
    }

    const handleTrigger = (
      reminder: Reminder
    ) => {
      triggerRef.current?.(
        reminder
      );
    };

    scheduleReminders(
      reminders,
      handleTrigger
    );

    return () => {
      clearAllScheduledReminders();
    };
  }, [
    enabled,
    reminders,
  ]);

  return {
    requestPermission,
  };
}