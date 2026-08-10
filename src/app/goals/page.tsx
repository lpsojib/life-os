"use client";

import { useState } from "react";

import AddGoalForm from "@/features/goals/components/AddGoalForm";
import GoalList from "@/features/goals/components/GoalList";

export default function GoalsPage() {
  const [refreshKey, setRefreshKey] =
    useState(0);

  const handleGoalAdded = () => {
    setRefreshKey(
      (current) => current + 1
    );
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            আমার লক্ষ্য
          </h1>

          <p className="mt-2 text-gray-500">
            আপনার গুরুত্বপূর্ণ লক্ষ্য নির্ধারণ করুন
            এবং ধাপে ধাপে এগিয়ে যান।
          </p>
        </div>

        {/* Add Goal */}
        <section className="mb-8">
          <AddGoalForm
            onGoalAdded={
              handleGoalAdded
            }
          />
        </section>

        {/* Goals */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              চলমান লক্ষ্য
            </h2>
          </div>

          <GoalList
            refreshKey={refreshKey}
          />
        </section>
      </div>
    </main>
  );
}