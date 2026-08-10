"use client";

import { useState } from "react";

import AddGoalForm from "@/features/goals/components/AddGoalForm";
import GoalList from "@/features/goals/components/GoalList";

export default function GoalsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddGoal, setShowAddGoal] = useState(false);

  const handleGoalAdded = () => {
    setRefreshKey((current) => current + 1);
    setShowAddGoal(false);
  };

  const handleCloseForm = () => {
    setShowAddGoal(false);
  };

  return (
    <main className="min-h-screen bg-[#f7f9f6]">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#17261e]">
            আমার লক্ষ্য
          </h1>

          <p className="mt-2 text-[#7a877e]">
            আপনার গুরুত্বপূর্ণ লক্ষ্য নির্ধারণ করুন
            এবং ধাপে ধাপে এগিয়ে যান।
          </p>
        </div>

        {/* Goals */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#17261e]">
              চলমান লক্ষ্য
            </h2>
          </div>

          <GoalList refreshKey={refreshKey} />
        </section>
      </div>

      {/* Floating Add Goal Button */}
      <button
        type="button"
        onClick={() => setShowAddGoal(true)}
        aria-label="নতুন লক্ষ্য যোগ করুন"
        className="
          fixed
          bottom-6
          left-1/2
          z-40
          flex
          h-14
          w-14
          -translate-x-1/2
          items-center
          justify-center
          rounded-full
          bg-[#3f7659]
          text-3xl
          font-light
          text-white
          shadow-[0_12px_30px_rgba(63,118,89,0.30)]
          transition
          hover:scale-105
          hover:bg-[#35654d]
          active:scale-95
        "
      >
        +
      </button>

      {/* Bottom Sheet */}
      {showAddGoal && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <button
            type="button"
            aria-label="বন্ধ করুন"
            onClick={handleCloseForm}
            className="
              absolute
              inset-0
              bg-black/40
              backdrop-blur-[2px]
            "
          />

          {/* Sheet */}
          <div
            className="
              absolute
              bottom-0
              left-0
              right-0
              max-h-[92vh]
              overflow-y-auto
              rounded-t-[32px]
              bg-[#f7f9f6]
              px-5
              pb-8
              pt-4
              shadow-[0_-10px_40px_rgba(0,0,0,0.12)]
              sm:left-1/2
              sm:right-auto
              sm:w-full
              sm:max-w-2xl
              sm:-translate-x-1/2
            "
          >
            {/* Top Handle */}
            <div className="mb-5 flex justify-center">
              <div className="h-1.5 w-12 rounded-full bg-[#d5ddd5]" />
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseForm}
              aria-label="বাতিল করুন"
              className="
                absolute
                right-5
                top-5
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-[#e9eee9]
                text-xl
                text-[#66736b]
                transition
                hover:bg-[#dde5dd]
              "
            >
              ×
            </button>

            {/* Add Goal Form */}
            <AddGoalForm
              onGoalAdded={handleGoalAdded}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}
    </main>
  );
}