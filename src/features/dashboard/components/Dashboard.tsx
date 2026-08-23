"use client";

import DashboardHeader from "./DashboardHeader";
import IslamicQuote from "./IslamicQuote";
import OverviewSection from "./OverviewSection";
import ReminderSection from "./ReminderSection";
import TodayTasks from "./TodayTasks";
import TodayHabits from "./TodayHabits";
import DashboardGoals from "./DashboardGoals";
import ProductivityChart from "./ProductivityChart";

export default function Dashboard() {
  return (
    <div className="min-h-full px-1 py-2">
      <div
        className="mx-auto"
        style={{
          maxWidth: "750px",
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

          {/* Productivity Chart */}
          <ProductivityChart />
        </div>
      </div>
    </div>
  );
}