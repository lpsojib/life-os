"use client";

import { useState } from "react";

import { addHabit } from "../services/habit.service";

interface AddHabitFormProps {
  onHabitAdded?: () => void;
}

export default function AddHabitForm({
  onHabitAdded,
}: AddHabitFormProps) {
  const [name, setName] = useState("");
  const [targetDays, setTargetDays] = useState("21");
  const [startDate, setStartDate] = useState("");
  const [time, setTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /**
   * Submit Habit
   */
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const days = Number(targetDays);

    /**
     * Validation
     */
    if (!trimmedName) {
      setError("Habit name is required.");
      return;
    }

    if (!Number.isInteger(days) || days <= 0) {
      setError("Target days must be greater than 0.");
      return;
    }

    if (!startDate) {
      setError("Start date is required.");
      return;
    }

    if (!time) {
      setError("Habit time is required.");
      return;
    }

    try {
      setLoading(true);

      /**
       * Habit service:
       *
       * Online:
       * Firebase-এ save হবে।
       *
       * Offline:
       * Local storage / IndexedDB-তে save হবে।
       */
      await addHabit(
        trimmedName,
        days,
        startDate,
        time
      );

      /**
       * Reset form
       */
      setName("");
      setTargetDays("21");
      setStartDate("");
      setTime("");

      /**
       * Success message
       */
      setSuccess(
        navigator.onLine
          ? "Habit added successfully."
          : "Habit saved offline. It will sync when you're online."
      );

      /**
       * Parent refresh
       */
      onHabitAdded?.();

      /**
       * Other components-কে notify
       */
      window.dispatchEvent(
        new CustomEvent("life-os-habit-added")
      );
    } catch (error) {
      console.error(
        "Add habit error:",
        error
      );

      setError(
        "Failed to add habit. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Add New Habit
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Create a habit and track it every day.
        </p>
      </div>

      {/* Offline Status */}
      {!navigator.onLine && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          📴 You are offline. This habit will be
          saved locally and synced later.
        </div>
      )}

      {/* Habit Name */}
      <div>
        <label
          htmlFor="habit-name"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Habit Name
        </label>

        <input
          id="habit-name"
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          placeholder="e.g. Read Quran"
          disabled={loading}
          required
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Target Days */}
      <div>
        <label
          htmlFor="habit-target-days"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Target Days
        </label>

        <input
          id="habit-target-days"
          type="number"
          min="1"
          value={targetDays}
          onChange={(event) =>
            setTargetDays(event.target.value)
          }
          placeholder="21"
          disabled={loading}
          required
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />

        <p className="mt-1 text-xs text-slate-400">
          Example: 21 days, 30 days, 90 days
        </p>
      </div>

      {/* Start Date */}
      <div>
        <label
          htmlFor="habit-start-date"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Start Date
        </label>

        <input
          id="habit-start-date"
          type="date"
          value={startDate}
          onChange={(event) =>
            setStartDate(event.target.value)
          }
          disabled={loading}
          required
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Time */}
      <div>
        <label
          htmlFor="habit-time"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Habit Time
        </label>

        <input
          id="habit-time"
          type="time"
          value={time}
          onChange={(event) =>
            setTime(event.target.value)
          }
          disabled={loading}
          required
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          ✓ {success}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Creating Habit..."
          : "Create Habit"}
      </button>
    </form>
  );
}