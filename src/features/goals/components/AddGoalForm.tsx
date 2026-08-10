"use client";

import { useState } from "react";

import { addGoal } from "../services/goal.service";

interface AddGoalFormProps {
  onGoalAdded?: () => void;
}

export default function AddGoalForm({
  onGoalAdded,
}: AddGoalFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [startDate, setStartDate] =
    useState("");
  const [endDate, setEndDate] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("লক্ষ্যের নাম লিখুন।");
      return;
    }

    if (!startDate) {
      setError(
        "শুরুর তারিখ নির্বাচন করুন।"
      );
      return;
    }

    if (!endDate) {
      setError(
        "শেষের তারিখ নির্বাচন করুন।"
      );
      return;
    }

    if (endDate < startDate) {
      setError(
        "শেষের তারিখ শুরুর তারিখের আগে হতে পারবে না।"
      );
      return;
    }

    try {
      setLoading(true);

      await addGoal(
        title,
        description,
        startDate,
        endDate
      );

      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");

      onGoalAdded?.();
    } catch (error) {
      console.error(
        "Add goal error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "লক্ষ্য যোগ করা যায়নি। আবার চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-5 shadow-sm"
    >
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          নতুন লক্ষ্য
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          আপনি কী অর্জন করতে চান?
        </p>
      </div>

      <div className="space-y-4">
        {/* Goal Title */}
        <div>
          <label
            htmlFor="goal-title"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            লক্ষ্যের নাম
          </label>

          <input
            id="goal-title"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="যেমন: Web Developer হওয়া"
            className="w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="goal-description"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            লক্ষ্য সম্পর্কে বিস্তারিত
          </label>

          <textarea
            id="goal-description"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="এই লক্ষ্যটি কেন গুরুত্বপূর্ণ এবং কী অর্জন করতে চান..."
            rows={4}
            className="w-full resize-none rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dates */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Start Date */}
          <div>
            <label
              htmlFor="goal-start-date"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              শুরুর তারিখ
            </label>

            <input
              id="goal-start-date"
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(
                  event.target.value
                )
              }
              className="w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label
              htmlFor="goal-end-date"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              শেষের তারিখ
            </label>

            <input
              id="goal-end-date"
              type="date"
              min={startDate || undefined}
              value={endDate}
              onChange={(event) =>
                setEndDate(
                  event.target.value
                )
              }
              className="w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "যোগ হচ্ছে..."
            : "লক্ষ্য যোগ করুন"}
        </button>
      </div>
    </form>
  );
}