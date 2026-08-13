"use client";

import {
  useState,
} from "react";

import {
  addGoal,
} from "../services/goal.service";

interface AddGoalFormProps {
  onGoalAdded?: () => void;
  onCancel?: () => void;
}

export default function AddGoalForm({
  onGoalAdded,
  onCancel,
}: AddGoalFormProps) {
  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [tasks, setTasks] =
    useState<string[]>([""]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleAddTask = () => {
    setTasks(
      (current) => [
        ...current,
        "",
      ]
    );
  };

  const handleTaskChange = (
    index: number,
    value: string
  ) => {
    setTasks(
      (current) =>
        current.map(
          (task, taskIndex) =>
            taskIndex === index
              ? value
              : task
        )
    );
  };

  const handleRemoveTask = (
    index: number
  ) => {
    setTasks(
      (current) => {
        if (
          current.length ===
          1
        ) {
          return [""];
        }

        return current.filter(
          (_, taskIndex) =>
            taskIndex !== index
        );
      }
    );
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError(
        "লক্ষ্যের নাম লিখুন।"
      );
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

    const validTasks =
      tasks
        .map((task) =>
          task.trim()
        )
        .filter(Boolean);

    try {
      setLoading(true);

      /*
       * Goal + all tasks
       * LOCAL FIRST.
       */
      await addGoal(
        title.trim(),
        description.trim(),
        startDate,
        endDate,
        validTasks
      );

      /*
       * Reset.
       */
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setTasks([""]);

      /*
       * Parent update.
       */
      onGoalAdded?.();

      /*
       * GoalList direct update.
       */
      if (
        typeof window !==
        "undefined"
      ) {
        window.dispatchEvent(
          new CustomEvent(
            "life-os-goal-added"
          )
        );
      }
    } catch (error) {
      console.error(
        "Add goal error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "লক্ষ্য তৈরি করা যায়নি। আবার চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-[#dce5d8]" />

      <div className="mb-7">
        <h2 className="text-[30px] font-bold tracking-tight text-[#17261e]">
          নতুন লক্ষ্য তৈরি করো
        </h2>

        <p className="mt-2 text-sm text-[#7a877e]">
          কী অর্জন করতে চাও এবং কীভাবে করবে তা ঠিক করো।
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div>
          <label
            htmlFor="goal-title"
            className="mb-2 block text-base font-semibold text-[#748078]"
          >
            লক্ষ্যের নাম
          </label>

          <input
            id="goal-title"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
            placeholder="যেমন: ৩ মাসে ওয়েব ডেভেলপার হওয়া"
            disabled={loading}
            className="w-full rounded-2xl border border-[#dce5d8] bg-white px-5 py-4 text-base text-[#17261e] outline-none placeholder:text-[#9aa39d] focus:border-[#3f7659] focus:ring-2 focus:ring-[#3f7659]/15"
          />
        </div>

        <div>
          <label className="mb-2 block text-base font-semibold text-[#748078]">
            টাইমলাইন
          </label>

          <div className="grid grid-cols-2 gap-4">
            <input
              id="goal-start-date"
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(
                  event.target.value
                )
              }
              disabled={loading}
              className="w-full rounded-2xl border border-[#dce5d8] bg-white px-4 py-4 text-base text-[#17261e] outline-none focus:border-[#3f7659] focus:ring-2 focus:ring-[#3f7659]/15"
            />

            <input
              id="goal-end-date"
              type="date"
              min={
                startDate ||
                undefined
              }
              value={endDate}
              onChange={(event) =>
                setEndDate(
                  event.target.value
                )
              }
              disabled={loading}
              className="w-full rounded-2xl border border-[#dce5d8] bg-white px-4 py-4 text-base text-[#17261e] outline-none focus:border-[#3f7659] focus:ring-2 focus:ring-[#3f7659]/15"
            />
          </div>
        </div>

        <div>
          <label className="mb-3 block text-base font-semibold text-[#748078]">
            লক্ষ্য যোগ করো
          </label>

          <div className="space-y-3">
            {tasks.map(
              (task, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={task}
                    onChange={(
                      event
                    ) =>
                      handleTaskChange(
                        index,
                        event.target
                          .value
                      )
                    }
                    placeholder={`টাস্ক ${
                      index + 1
                    }`}
                    disabled={loading}
                    className="min-w-0 flex-1 rounded-2xl border border-[#dce5d8] bg-white px-5 py-4 text-base text-[#17261e] outline-none placeholder:text-[#9aa39d] focus:border-[#3f7659] focus:ring-2 focus:ring-[#3f7659]/15"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveTask(
                        index
                      )
                    }
                    disabled={loading}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f6dcd5] text-xl font-semibold text-[#bd624e] transition hover:bg-[#f1cfc6]"
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>

          <button
            type="button"
            onClick={
              handleAddTask
            }
            disabled={loading}
            className="mt-3 w-full rounded-2xl border-2 border-dashed border-[#dce5d8] px-5 py-4 text-left font-semibold text-[#3f7659] transition hover:bg-[#eef4ee]"
          >
            <span className="mr-2 text-xl">
              +
            </span>
            নতুন টাস্ক যোগ করো
          </button>
        </div>

        <div>
          <label
            htmlFor="goal-description"
            className="mb-2 block text-base font-semibold text-[#748078]"
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
            placeholder="এই লক্ষ্যটি কেন গুরুত্বপূর্ণ..."
            rows={3}
            disabled={loading}
            className="w-full resize-none rounded-2xl border border-[#dce5d8] bg-white px-5 py-4 text-base text-[#17261e] outline-none placeholder:text-[#9aa39d] focus:border-[#3f7659] focus:ring-2 focus:ring-[#3f7659]/15"
          />
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-[#3f7659] px-5 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-[#35654d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "সেভ হচ্ছে..."
            : "লক্ষ্য তৈরি করো"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="block w-full text-center text-base font-medium text-[#7a877e] transition hover:text-[#17261e]"
        >
          বাতিল করো
        </button>
      </form>
    </div>
  );
}