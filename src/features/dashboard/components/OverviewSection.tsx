"use client";

import {
  CheckSquare,
  Flame,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

import DashboardCard from "./DashboardCard";
import DashboardSectionTitle from "./DashboardSectionTitle";

import { getQuickSummary } from "../services/summary.service";

interface Summary {
  taskCompletion: number;
  habitCompletion: number;
  goalProgress: number;
}

interface OverviewCardProps {
  icon: typeof CheckSquare;
  label: string;
  value: number;
  foreground: string;
  background: string;
}

function OverviewCard({
  icon: Icon,
  label,
  value,
  foreground,
  background,
}: OverviewCardProps) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;

  const offset =
    circumference -
    (value / 100) * circumference;

  return (
    <div
      className="rounded-2xl p-3.5 flex items-center justify-between gap-3"
      style={{
        background,
      }}
    >
      <div className="min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
          style={{
            background: "#FFFFFF",
          }}
        >
          <Icon
            size={15}
            color={foreground}
            strokeWidth={2.2}
          />
        </div>

        <div
          style={{
            fontFamily:
              "'IBM Plex Mono', monospace",
            fontSize: "18px",
            fontWeight: 600,
            color: foreground,
          }}
        >
          {value}%
        </div>

        <div
          className="text-xs mt-0.5"
          style={{
            color: "#2A2318",
            fontWeight: 500,
            opacity: 0.75,
          }}
        >
          {label}
        </div>
      </div>

      {/* Round Progress */}
      <div
        className="relative flex-shrink-0"
        style={{
          width: 52,
          height: 52,
        }}
      >
        <svg
          width="52"
          height="52"
          viewBox="0 0 52 52"
          className="-rotate-90"
        >
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="5"
            opacity="0.7"
          />

          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            stroke={foreground}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
      </div>
    </div>
  );
}

export default function OverviewSection() {
  const [summary, setSummary] =
    useState<Summary>({
      taskCompletion: 0,
      habitCompletion: 0,
      goalProgress: 0,
    });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data =
          await getQuickSummary();

        if (!cancelled) {
          setSummary(data);
        }
      } catch (error) {
        console.error(
          "Overview summary failed:",
          error
        );
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const overallProgress = Math.round(
    (
      summary.taskCompletion +
      summary.habitCompletion +
      summary.goalProgress
    ) / 3
  );

  return (
    <DashboardCard>
      <DashboardSectionTitle title="ওভারভিউ" />

      <div className="grid grid-cols-2 gap-3">
        <OverviewCard
          icon={CheckSquare}
          label="আজকের টাস্ক"
          value={summary.taskCompletion}
          foreground="#2A6459"
          background="#E3EFEA"
        />

        <OverviewCard
          icon={Flame}
          label="অভ্যাস"
          value={summary.habitCompletion}
          foreground="#B4842A"
          background="#F5EACB"
        />

        <OverviewCard
          icon={Target}
          label="সক্রিয় লক্ষ্য"
          value={summary.goalProgress}
          foreground="#7C4F6E"
          background="#F0E3EC"
        />

        <OverviewCard
          icon={TrendingUp}
          label="সম্পন্নতা"
          value={overallProgress}
          foreground="#B15A38"
          background="#F6E4D8"
        />
      </div>
    </DashboardCard>
  );
}