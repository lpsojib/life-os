"use client";

import DashboardHeader from "./DashboardHeader";
import IslamicQuote from "./IslamicQuote";
import OverviewSection from "./OverviewSection";
import ReminderSection from "./ReminderSection";
import TodayTasks from "./TodayTasks";
import TodayHabits from "./TodayHabits";
import DashboardGoals from "./DashboardGoals";
import QuickSummary from "./QuickSummary";

export default function Dashboard() {
  return (
    <div className="min-h-full px-1 py-2">
      <div
        className="mx-auto"
        style={{
          maxWidth: "750px",
        }}
      >
        {/* CACHE TEST */}
        <div className="mb-4 rounded-xl bg-red-500 p-4 text-center font-bold text-white">
          CACHE TEST — NEW CODE
        </div>
        
        {/* Header */}
        <DashboardHeader />

        {/* Islamic Quote */}
        <IslamicQuote />

        <div className="flex flex-col gap-4">
          {/* Overview */}
          <OverviewSection />

          {/* Reminders */}
          <ReminderSection />

          {/* Today's Tasks */}
          <TodayTasks />

          {/* Today's Habits */}
          <TodayHabits />

          {/* Goals */}
          <DashboardGoals />

          {/* Quick Summary */}
          <QuickSummary />
        </div>
      </div>
    </div>
  );
}