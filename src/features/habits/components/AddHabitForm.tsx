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
  const [startDate, setStartDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [time, setTime] = useState("07:00");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");

    const days = Number(targetDays);

    if (!name.trim()) {
      setError("অভ্যাসের নাম লিখুন।");
      return;
    }

    if (!days || days < 1) {
      setError("সঠিক দিনের সংখ্যা দিন।");
      return;
    }

    if (!startDate) {
      setError("শুরুর তারিখ নির্বাচন করুন।");
      return;
    }

    if (!time) {
      setError("অভ্যাস করার সময় নির্বাচন করুন।");
      return;
    }

    try {
      setLoading(true);

      await addHabit(
        name,
        days,
        startDate,
        time
);

      setName("");
      setTargetDays("21");

      setStartDate(
        new Date().toISOString().split("T")[0]
      );

      setTime("07:00");

      onHabitAdded?.();
    } catch (error) {
      console.error(
        "Add habit error:",
        error
      );

      setError(
        "অভ্যাস যোগ করা যায়নি। আবার চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-white p-5 shadow-sm"
    >
      <h2 className="mb-5 text-xl font-semibold text-gray-900">
        নতুন অভ্যাস
      </h2>

      <div className="space-y-4">
        {/* Habit Name */}
        <div>
          <label
            htmlFor="habit-name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            অভ্যাসের নাম
          </label>

          <input
            id="habit-name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="যেমন: প্রতিদিন হাঁটা"
            className="w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Target Days */}
        <div>
          <label
            htmlFor="target-days"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            কত দিন
          </label>

          <input
            id="target-days"
            type="number"
            min="1"
            value={targetDays}
            onChange={(event) =>
              setTargetDays(event.target.value)
            }
            placeholder="যেমন ২১"
            className="w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Start Date */}
        <div>
          <label
            htmlFor="habit-start-date"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            কবে থেকে শুরু করবেন
          </label>

          <input
            id="habit-start-date"
            type="date"
            value={startDate}
            onChange={(event) =>
              setStartDate(event.target.value)
            }
            className="w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Time */}
        <div>
          <label
            htmlFor="habit-time"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            কোন সময় করবেন
          </label>

          <input
            id="habit-time"
            type="time"
            value={time}
            onChange={(event) =>
              setTime(event.target.value)
            }
            className="w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "যোগ হচ্ছে..."
            : "যোগ করুন"}
        </button>
      </div>
    </form>
  );
}