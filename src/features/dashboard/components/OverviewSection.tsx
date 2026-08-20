"use client";

import {
  CheckSquare,
  Flame,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import DashboardCard from "./DashboardCard";
import DashboardSectionTitle from "./DashboardSectionTitle";

import {
  getQuickSummary,
  QuickSummaryData,
} from "../services/summary.service";

/* =========================================================
   COLORS
========================================================= */

const COLORS = {
  ink: "#2A2318",
  muted: "#8F8677",

  task: "#2A6459",
  taskBg: "#E3EFEA",

  habit: "#B4842A",
  habitBg: "#F5EACB",

  goal: "#7C4F6E",
  goalBg: "#F0E3EC",

  overall: "#B15A38",
  overallBg: "#F6E4D8",
};

/* =========================================================
   EMPTY SUMMARY
========================================================= */

const EMPTY_SUMMARY: QuickSummaryData = {
  tasks: {
    total: 0,
    completed: 0,
    remaining: 0,
    progress: 0,
  },

  habits: {
    total: 0,
    completed: 0,
    remaining: 0,
    progress: 0,
  },

  goals: {
    total: 0,
    completed: 0,
    remaining: 0,
    progress: 0,
  },
};

/* =========================================================
   PROGRESS CIRCLE
========================================================= */

interface ProgressCircleProps {
  progress: number;
  foreground: string;
  background: string;
}

function ProgressCircle({
  progress,
  foreground,
  background,
}: ProgressCircleProps) {
  const size = 54;
  const stroke = 5;

  const radius =
    (size - stroke) / 2;

  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (progress / 100) *
      circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={background}
          strokeWidth={stroke}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={foreground}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={
            circumference
          }
          strokeDashoffset={offset}
        />
      </svg>

      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          fontFamily:
            "'IBM Plex Mono', monospace",
          fontSize: "11px",
          fontWeight: 700,
          color: foreground,
        }}
      >
        {progress}%
      </div>
    </div>
  );
}

/* =========================================================
   OVERVIEW ITEM
========================================================= */

interface OverviewItemProps {
  icon: typeof CheckSquare;
  title: string;
  data: QuickSummaryData["tasks"];
  foreground: string;
  background: string;
}

function OverviewItem({
  icon: Icon,
  title,
  data,
  foreground,
  background,
}: OverviewItemProps) {
  return (
    <div
      className="rounded-2xl p-3.5"
      style={{
        background,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {/* Icon */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
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

          {/* Title */}
          <div
            className="text-xs"
            style={{
              color: COLORS.ink,
              fontWeight: 600,
            }}
          >
            {title}
          </div>

          {/* Number */}
          <div
            className="mt-1 flex items-baseline gap-1"
            style={{
              fontFamily:
                "'IBM Plex Mono', monospace",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: foreground,
              }}
            >
              {data.completed}
            </span>

            <span
              style={{
                fontSize: "13px",
                color: COLORS.muted,
              }}
            >
              / {data.total}
            </span>
          </div>

          {/* Remaining */}
          <div
            className="mt-1 text-[10px]"
            style={{
              color: COLORS.muted,
            }}
          >
            {data.completed}টি সম্পন্ন ·{" "}
            {data.remaining}টি বাকি
          </div>
        </div>

        {/* Progress */}
        <ProgressCircle
          progress={data.progress}
          foreground={foreground}
          background="#FFFFFF"
        />
      </div>
    </div>
  );
}

/* =========================================================
   OVERVIEW SECTION
========================================================= */

export default function OverviewSection() {
  const [summary, setSummary] =
    useState<QuickSummaryData>(
      EMPTY_SUMMARY
    );

  const [loading, setLoading] =
    useState(true);

  /* =======================================================
     LOAD SUMMARY
  ======================================================= */

  const loadSummary = async () => {
    try {
      const data =
        await getQuickSummary();

      setSummary(data);
    } catch (error) {
      console.error(
        "Failed to load dashboard summary:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     EFFECT
  ======================================================= */

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
        if (!cancelled) {
          console.error(
            "Failed to load dashboard summary:",
            error
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    const handleUpdate = () => {
      void load();
    };

    window.addEventListener(
      "life-os-task-changed",
      handleUpdate
    );

    window.addEventListener(
      "life-os-habit-changed",
      handleUpdate
    );

    window.addEventListener(
      "life-os-goal-changed",
      handleUpdate
    );

    window.addEventListener(
      "life-os-task-synced",
      handleUpdate
    );

    window.addEventListener(
      "life-os-habit-synced",
      handleUpdate
    );

    window.addEventListener(
      "life-os-goal-synced",
      handleUpdate
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "life-os-task-changed",
        handleUpdate
      );

      window.removeEventListener(
        "life-os-habit-changed",
        handleUpdate
      );

      window.removeEventListener(
        "life-os-goal-changed",
        handleUpdate
      );

      window.removeEventListener(
        "life-os-task-synced",
        handleUpdate
      );

      window.removeEventListener(
        "life-os-habit-synced",
        handleUpdate
      );

      window.removeEventListener(
        "life-os-goal-synced",
        handleUpdate
      );
    };
  }, []);

  /* =======================================================
     OVERALL PROGRESS
  ======================================================= */

  const overallProgress =
    Math.round(
      (
        summary.tasks.progress +
        summary.habits.progress +
        summary.goals.progress
      ) / 3
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <DashboardCard>
        <DashboardSectionTitle
          title="ওভারভিউ"
        />

        <div className="grid grid-cols-2 gap-3">
          {[
            "task",
            "habit",
            "goal",
            "overall",
          ].map((item) => (
            <div
              key={item}
              className="h-[150px] rounded-2xl animate-pulse"
              style={{
                background:
                  "#F0EBE1",
              }}
            />
          ))}
        </div>
      </DashboardCard>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <DashboardCard>
      <DashboardSectionTitle
        title="ওভারভিউ"
      />

      <div className="grid grid-cols-2 gap-3">
        {/* TODAY TASK */}
        <OverviewItem
          icon={CheckSquare}
          title="আজকের টাস্ক"
          data={summary.tasks}
          foreground={COLORS.task}
          background={COLORS.taskBg}
        />

        {/* TODAY HABIT */}
        <OverviewItem
          icon={Flame}
          title="আজকের অভ্যাস"
          data={summary.habits}
          foreground={COLORS.habit}
          background={COLORS.habitBg}
        />

        {/* TODAY GOAL */}
        <OverviewItem
          icon={Target}
          title="আজকের লক্ষ্য"
          data={summary.goals}
          foreground={COLORS.goal}
          background={COLORS.goalBg}
        />

        {/* OVERALL */}
        <div
          className="rounded-2xl p-3.5"
          style={{
            background:
              COLORS.overallBg,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
                style={{
                  background:
                    "#FFFFFF",
                }}
              >
                <TrendingUp
                  size={15}
                  color={COLORS.overall}
                  strokeWidth={2.2}
                />
              </div>

              <div
                className="text-xs"
                style={{
                  color: COLORS.ink,
                  fontWeight: 600,
                }}
              >
                মোট সম্পন্নতা
              </div>

              <div
                className="mt-1"
                style={{
                  fontFamily:
                    "'IBM Plex Mono', monospace",
                  fontSize: "18px",
                  fontWeight: 700,
                  color:
                    COLORS.overall,
                }}
              >
                {overallProgress}%
              </div>
            </div>

            <ProgressCircle
              progress={
                overallProgress
              }
              foreground={
                COLORS.overall
              }
              background="#FFFFFF"
            />
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}