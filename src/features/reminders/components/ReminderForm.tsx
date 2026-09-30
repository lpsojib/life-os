"use client";

import {
  useState,
  type FormEvent,
} from "react";

import {
  CalendarDays,
  Clock3,
  Save,
  X,
} from "lucide-react";

import type {
  CreateReminderInput,
  Reminder,
  ReminderRepeat,
  UpdateReminderInput,
} from "../types/reminder.types";

import {
  REMINDER_REPEAT_OPTIONS,
} from "../constants/reminder.constants";

interface ReminderFormProps {
  reminder?: Reminder | null;
  loading?: boolean;
  onSubmit: (
    input:
      | CreateReminderInput
      | UpdateReminderInput
  ) => Promise<void> | void;
  onCancel?: () => void;
}

interface FormState {
  title: string;
  description: string;
  date: string;
  time: string;
  repeat: ReminderRepeat;
  repeatDays: number[];
}

const WEEK_DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

function getToday(): string {
  const date = new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentTime(): string {
  const date = new Date();

  const hours =
    String(
      date.getHours()
    ).padStart(2, "0");

  const minutes =
    String(
      date.getMinutes()
    ).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function getDefaultFormState(): FormState {
  return {
    title: "",
    description: "",
    date: getToday(),
    time: getCurrentTime(),
    repeat: "none",
    repeatDays: [],
  };
}

function getReminderFormState(
  reminder: Reminder
): FormState {
  return {
    title: reminder.title,
    description:
      reminder.description ?? "",
    date: reminder.date,
    time: reminder.time,
    repeat: reminder.repeat,
    repeatDays:
      reminder.repeatDays ?? [],
  };
}

export default function ReminderForm({
  reminder = null,
  loading = false,
  onSubmit,
  onCancel,
}: ReminderFormProps) {
  /*
   * The form is initialized directly from the
   * current reminder. No setState inside useEffect.
   */
  const [form, setForm] =
    useState<FormState>(() =>
      reminder
        ? getReminderFormState(
            reminder
          )
        : getDefaultFormState()
    );

  const [submitting, setSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);

  const isEditMode =
    Boolean(reminder);

  const isSaving =
    submitting || loading;

  /* =====================================================
     INPUT CHANGE
  ===================================================== */

  function updateField<
    K extends keyof FormState
  >(
    field: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (formError) {
      setFormError(null);
    }
  }

  /* =====================================================
     CUSTOM REPEAT DAYS
  ===================================================== */

  function toggleRepeatDay(
    day: number
  ) {
    setForm((current) => {
      const exists =
        current.repeatDays.includes(
          day
        );

      return {
        ...current,
        repeatDays: exists
          ? current.repeatDays.filter(
              (item) =>
                item !== day
            )
          : [
              ...current.repeatDays,
              day,
            ].sort(
              (a, b) => a - b
            ),
      };
    });

    if (formError) {
      setFormError(null);
    }
  }

  /* =====================================================
     SUBMIT
  ===================================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const title =
      form.title.trim();

    if (!title) {
      setFormError(
        "Please enter a reminder title."
      );
      return;
    }

    if (!form.date) {
      setFormError(
        "Please select a date."
      );
      return;
    }

    if (!form.time) {
      setFormError(
        "Please select a time."
      );
      return;
    }

    if (
      form.repeat === "custom" &&
      form.repeatDays.length === 0
    ) {
      setFormError(
        "Please select at least one day."
      );
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const input:
        | CreateReminderInput
        | UpdateReminderInput = {
        title,
        description:
          form.description.trim(),
        date: form.date,
        time: form.time,
        repeat: form.repeat,
        repeatDays:
          form.repeat === "custom"
            ? form.repeatDays
            : undefined,
      };

      await onSubmit(input);
    } catch (error) {
      console.error(
        "Failed to save reminder:",
        error
      );

      setFormError(
        "Failed to save reminder. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* =================================================
          TITLE
      ================================================= */}

      <div>
        <label
          htmlFor="reminder-title"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Title
        </label>

        <input
          id="reminder-title"
          type="text"
          value={form.title}
          onChange={(event) =>
            updateField(
              "title",
              event.target.value
            )
          }
          placeholder="Enter reminder title"
          disabled={isSaving}
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-50"
        />
      </div>

      {/* =================================================
          DESCRIPTION
      ================================================= */}

      <div>
        <label
          htmlFor="reminder-description"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Description
        </label>

        <textarea
          id="reminder-description"
          value={form.description}
          onChange={(event) =>
            updateField(
              "description",
              event.target.value
            )
          }
          placeholder="Add a description (optional)"
          rows={4}
          disabled={isSaving}
          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm leading-5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-50"
        />
      </div>

      {/* =================================================
          DATE + TIME
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* DATE */}

        <div>
          <label
            htmlFor="reminder-date"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Date
          </label>

          <div className="relative">
            <CalendarDays
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="reminder-date"
              type="date"
              value={form.date}
              onChange={(event) =>
                updateField(
                  "date",
                  event.target.value
                )
              }
              disabled={isSaving}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </div>
        </div>

        {/* TIME */}

        <div>
          <label
            htmlFor="reminder-time"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Time
          </label>

          <div className="relative">
            <Clock3
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="reminder-time"
              type="time"
              value={form.time}
              onChange={(event) =>
                updateField(
                  "time",
                  event.target.value
                )
              }
              disabled={isSaving}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* =================================================
          REPEAT
      ================================================= */}

      <div>
        <label
          htmlFor="reminder-repeat"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Repeat
        </label>

        <select
          id="reminder-repeat"
          value={form.repeat}
          onChange={(event) =>
            updateField(
              "repeat",
              event.target
                .value as ReminderRepeat
            )
          }
          disabled={isSaving}
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-50"
        >
          {REMINDER_REPEAT_OPTIONS.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            )
          )}
        </select>
      </div>

      {/* =================================================
          CUSTOM REPEAT
      ================================================= */}

      {form.repeat === "custom" && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">
            Repeat on
          </p>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {WEEK_DAYS.map((day) => {
              const selected =
                form.repeatDays.includes(
                  day.value
                );

              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() =>
                    toggleRepeatDay(
                      day.value
                    )
                  }
                  disabled={isSaving}
                  className={[
                    "h-10 rounded-lg border text-sm font-medium transition",
                    selected
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                    isSaving
                      ? "cursor-not-allowed opacity-50"
                      : "",
                  ].join(" ")}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {formError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-600">
          {formError}
        </div>
      )}

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={16} />
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={16} />

          {isSaving
            ? "Saving..."
            : isEditMode
            ? "Update Reminder"
            : "Save Reminder"}
        </button>
      </div>
    </form>
  );
}