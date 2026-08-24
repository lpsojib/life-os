"use client";

import { useState } from "react";

import AddGoalForm from "@/features/goals/components/AddGoalForm";
import GoalList from "@/features/goals/components/GoalList";

export default function GoalsPage() {
  const [showAddGoal, setShowAddGoal] =
    useState(false);

  /* =========================================================
     GOAL ADDED
  ========================================================= */

  const handleGoalAdded = () => {
    /*
     * Goal service নিজেই:
     *
     * IndexedDB → instantly save
     * life-os-goal-changed → event emit
     * Firebase → background sync
     *
     * তাই এখানে GoalList force refresh করার
     * কোনো দরকার নেই।
     */
    setShowAddGoal(false);
  };

  /* =========================================================
     CLOSE FORM
  ========================================================= */

  const handleCloseForm = () => {
    setShowAddGoal(false);
  };

  return (
    <main className="min-h-screen bg-white">
      <div
        className="
          w-full
          px-0
          pb-28
          pt-5
          sm:pt-6
        "
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div
          className="
            px-4
            sm:px-6
            lg:px-8
          "
        >
          <div className="mb-6">
            <h1
              className="
                text-3xl
                font-bold
                tracking-tight
                text-[#22261F]
              "
            >
              আমার লক্ষ্য
            </h1>

            <p
              className="
                mt-1.5
                max-w-xl
                text-sm
                leading-6
                text-[#767C70]
              "
            >
              আপনার গুরুত্বপূর্ণ লক্ষ্য নির্ধারণ করুন
              এবং ধাপে ধাপে এগিয়ে যান।
            </p>
          </div>
        </div>

        {/* =====================================================
            GOALS

            এখানে refreshKey নেই।
            GoalList নিজেই local event শুনবে।
        ===================================================== */}

        <section className="w-full">
          <GoalList />
        </section>
      </div>

      {/* =======================================================
          FLOATING ADD GOAL BUTTON
      ======================================================= */}

      <button
        type="button"
        onClick={() =>
          setShowAddGoal(true)
        }
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
          bg-[#173C30]
          text-[30px]
          font-light
          leading-none
          text-white
          shadow-[0_12px_30px_rgba(23,60,48,0.28)]
          transition-all
          duration-200
          hover:scale-105
          hover:bg-[#123126]
          active:scale-95
        "
      >
        +
      </button>

      {/* =======================================================
          ADD GOAL BOTTOM SHEET
      ======================================================= */}

      {showAddGoal && (
        <div className="fixed inset-0 z-50">
          {/* ===================================================
              OVERLAY
          =================================================== */}

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

          {/* ===================================================
              SHEET
          =================================================== */}

          <div
            className="
              absolute
              bottom-0
              left-0
              right-0
              max-h-[92vh]
              overflow-y-auto
              rounded-t-[28px]
              bg-white
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
            {/* =================================================
                HANDLE
            ================================================= */}

            <div className="mb-5 flex justify-center">
              <div
                className="
                  h-1.5
                  w-12
                  rounded-full
                  bg-[#D8DDD8]
                "
              />
            </div>

            {/* =================================================
                CLOSE BUTTON
            ================================================= */}

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
                bg-[#F1F3F0]
                text-xl
                text-[#66736B]
                transition
                hover:bg-[#E5EAE5]
              "
            >
              ×
            </button>

            {/* =================================================
                ADD GOAL FORM
            ================================================= */}

            <AddGoalForm
              onGoalAdded={
                handleGoalAdded
              }
              onCancel={
                handleCloseForm
              }
            />
          </div>
        </div>
      )}
    </main>
  );
}