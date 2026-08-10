"use client";

import { useState } from "react";

import {
  addGoal,
  addGoalTask,
} from "../services/goal.service";

interface AddGoalFormProps {
  onGoalAdded?: () => void;
  onCancel?: () => void;
}

export default function AddGoalForm({
  onGoalAdded,
  onCancel,
}: AddGoalFormProps) {
  const [title, setTitle] = useState("");
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

  /**
   * Add new goal task input
   */
  const handleAddTask = () => {
    setTasks((currentTasks) => [
      ...currentTasks,
      "",
    ]);
  };

  /**
   * Update goal task input
   */
  const handleTaskChange = (
    index: number,
    value: string
  ) => {
    setTasks((currentTasks) =>
      currentTasks.map(
        (task, taskIndex) =>
          taskIndex === index
            ? value
            : task
      )
    );
  };

  /**
   * Remove goal task input
   */
  const handleRemoveTask = (
    index: number
  ) => {
    setTasks((currentTasks) => {
      if (currentTasks.length === 1) {
        return [""];
      }

      return currentTasks.filter(
        (_, taskIndex) =>
          taskIndex !== index
      );
    });
  };

  /**
   * Create Goal + Goal Tasks
   */
  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");

    /**
     * Validate Goal title
     */
    if (!title.trim()) {
      setError(
        "লক্ষ্যের নাম লিখুন।"
      );
      return;
    }

    /**
     * Validate start date
     */
    if (!startDate) {
      setError(
        "শুরুর তারিখ নির্বাচন করুন।"
      );
      return;
    }

    /**
     * Validate end date
     */
    if (!endDate) {
      setError(
        "শেষের তারিখ নির্বাচন করুন।"
      );
      return;
    }

    /**
     * Validate date range
     */
    if (endDate < startDate) {
      setError(
        "শেষের তারিখ শুরুর তারিখের আগে হতে পারবে না।"
      );
      return;
    }

    /**
     * Remove empty task inputs
     */
    const validTasks = tasks
      .map((task) => task.trim())
      .filter(
        (task) => task.length > 0
      );

    try {
      setLoading(true);

      /**
       * 1. Create Goal
       */
      const goalId = await addGoal(
        title.trim(),
        description.trim(),
        startDate,
        endDate
      );

      /**
       * 2. Create Goal Tasks
       *
       * Goal তৈরি হওয়ার পর
       * প্রতিটি Task Firebase-এ save হবে।
       */
      if (validTasks.length > 0) {
        await Promise.all(
          validTasks.map((taskTitle) =>
            addGoalTask(
              goalId,
              taskTitle
            )
          )
        );
      }

      /**
       * Reset form
       */
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setTasks([""]);

      /**
       * Notify parent
       */
      onGoalAdded?.();
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
      {/* Top Handle */}
      <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-[#dce5d8]" />

      {/* Header */}
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
        {/* Goal Name */}
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
              setTitle(event.target.value)
            }
            placeholder="যেমন: ৩ মাসে ওয়েব ডেভেলপার হওয়া"
            className="
              w-full
              rounded-2xl
              border
              border-[#dce5d8]
              bg-white
              px-5
              py-4
              text-base
              text-[#17261e]
              outline-none
              placeholder:text-[#9aa39d]
              focus:border-[#3f7659]
              focus:ring-2
              focus:ring-[#3f7659]/15
            "
          />
        </div>

        {/* Timeline */}
        <div>
          <label className="mb-2 block text-base font-semibold text-[#748078]">
            টাইমলাইন
          </label>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <input
                id="goal-start-date"
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(
                    event.target.value
                  )
                }
                className="
                  w-full
                  rounded-2xl
                  border
                  border-[#dce5d8]
                  bg-white
                  px-4
                  py-4
                  text-base
                  text-[#17261e]
                  outline-none
                  focus:border-[#3f7659]
                  focus:ring-2
                  focus:ring-[#3f7659]/15
                "
              />
            </div>

            {/* End Date */}
            <div>
              <input
                id="goal-end-date"
                type="date"
                min={
                  startDate || undefined
                }
                value={endDate}
                onChange={(event) =>
                  setEndDate(
                    event.target.value
                  )
                }
                className="
                  w-full
                  rounded-2xl
                  border
                  border-[#dce5d8]
                  bg-white
                  px-4
                  py-4
                  text-base
                  text-[#17261e]
                  outline-none
                  focus:border-[#3f7659]
                  focus:ring-2
                  focus:ring-[#3f7659]/15
                "
              />
            </div>
          </div>
        </div>

        {/* Goal Tasks */}
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
                    onChange={(event) =>
                      handleTaskChange(
                        index,
                        event.target.value
                      )
                    }
                    placeholder={`টাস্ক ${
                      index + 1
                    }`}
                    className="
                      min-w-0
                      flex-1
                      rounded-2xl
                      border
                      border-[#dce5d8]
                      bg-white
                      px-5
                      py-4
                      text-base
                      text-[#17261e]
                      outline-none
                      placeholder:text-[#9aa39d]
                      focus:border-[#3f7659]
                      focus:ring-2
                      focus:ring-[#3f7659]/15
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveTask(
                        index
                      )
                    }
                    aria-label={`টাস্ক ${
                      index + 1
                    } মুছে ফেলুন`}
                    className="
                      flex
                      h-12
                      w-12
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#f6dcd5]
                      text-xl
                      font-semibold
                      text-[#bd624e]
                      transition
                      hover:bg-[#f1cfc6]
                    "
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>

          {/* Add Task */}
          <button
            type="button"
            onClick={handleAddTask}
            className="
              mt-3
              w-full
              rounded-2xl
              border-2
              border-dashed
              border-[#dce5d8]
              px-5
              py-4
              text-left
              font-semibold
              text-[#3f7659]
              transition
              hover:bg-[#eef4ee]
            "
          >
            <span className="mr-2 text-xl">
              +
            </span>

            নতুন টাস্ক যোগ করো
          </button>
        </div>

        {/* Description */}
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
            className="
              w-full
              resize-none
              rounded-2xl
              border
              border-[#dce5d8]
              bg-white
              px-5
              py-4
              text-base
              text-[#17261e]
              outline-none
              placeholder:text-[#9aa39d]
              focus:border-[#3f7659]
              focus:ring-2
              focus:ring-[#3f7659]/15
            "
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* Create */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            rounded-2xl
            bg-[#3f7659]
            px-5
            py-4
            text-lg
            font-bold
            text-white
            shadow-sm
            transition
            hover:bg-[#35654d]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {loading
            ? "লক্ষ্য তৈরি হচ্ছে..."
            : "লক্ষ্য তৈরি করো"}
        </button>

        {/* Cancel */}
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="
            block
            w-full
            text-center
            text-base
            font-medium
            text-[#7a877e]
            transition
            hover:text-[#17261e]
            disabled:opacity-50
          "
        >
          বাতিল করো
        </button>
      </form>
    </div>
  );
}