"use client";

import { useState } from "react";

import AddHabitForm from "@/features/habits/components/AddHabitForm";
import HabitHistory from "@/features/habits/components/HabitHistory";
import HabitList from "@/features/habits/components/HabitList";
import NotificationPermission from "@/features/habits/components/NotificationPermission";

type HabitTab = "habits" | "history";

export default function HabitsPage() {
  const [activeTab, setActiveTab] =
    useState<HabitTab>("habits");

  const [refreshKey, setRefreshKey] =
    useState(0);

  const handleHabitAdded = () => {
    setRefreshKey(
      (current) => current + 1
    );
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            আমার অভ্যাস
          </h1>

          <p className="mt-2 text-gray-500">
            নিয়মিত অভ্যাস তৈরি করুন এবং
            আপনার অগ্রগতি ধরে রাখুন।
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() =>
              setActiveTab("habits")
            }
            className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
              activeTab === "habits"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            অভ্যাস
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("history")
            }
            className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
              activeTab === "history"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            ইতিহাস
          </button>
        </div>

        {/* Habits Tab */}
        {activeTab === "habits" && (
          <div className="space-y-8">
            {/* Add Habit */}
            <section>
              <AddHabitForm
                onHabitAdded={
                  handleHabitAdded
                }
              />
            </section>

            {/* Notification */}
            <section>
              <NotificationPermission />
            </section>

            {/* Habit List */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                অভ্যাস
              </h2>

              <HabitList
                refreshKey={refreshKey}
              />
            </section>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              ইতিহাস
            </h2>

            <HabitHistory />
          </section>
        )}
      </div>
    </main>
  );
}