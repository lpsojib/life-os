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
    <div className="min-h-full px-2 py-3">
      <div
        className="mx-auto"
        style={{
          maxWidth: "700px",
        }}
      >
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