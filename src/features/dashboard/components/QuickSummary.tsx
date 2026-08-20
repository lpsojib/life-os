"use client";

import {
  CheckSquare,
  Flame,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
        {/* Background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={background}
          strokeWidth={stroke}
        />

        {/* Progress */}
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
      <div className="flex items-start justify-between gap-3">
        {/* Left */}
        <div className="min-w-0">
          {/* Icon */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
            style={{
              background:
                "#FFFFFF",
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

          {/* Completed / Remaining */}
          <div
            className="mt-1 text-[10px] leading-4"
            style={{
              color: COLORS.muted,
            }}
          >
            {data.completed}টি সম্পন্ন
            {" · "}
            {data.remaining}টি বাকি
          </div>
        </div>

        {/* Circle */}
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
    useState<QuickSummaryData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  /* =======================================================
     LOAD SUMMARY
  ======================================================= */

  const loadSummary =
    useCallback(async () => {
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
    }, []);

  /* =======================================================
     INITIAL LOAD + UPDATE LISTENER
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
  }, [loadSummary]);

  /* =======================================================
     LOADING DATA
  ======================================================= */

  const data: QuickSummaryData = summary ?? {
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

  /* =======================================================
     UI
  ======================================================= */

  return (
    <DashboardCard>
      <DashboardSectionTitle
        title="ওভারভিউ"
      />

      <div className="grid grid-cols-2 gap-3">
        {/* Tasks */}
        <OverviewItem
          icon={CheckSquare}
          title="আজকের টাস্ক"
          data={data.tasks}
          foreground={
            COLORS.task
          }
          background={
            COLORS.taskBg
          }
        />

        {/* Habits */}
        <OverviewItem
          icon={Flame}
          title="আজকের অভ্যাস"
          data={data.habits}
          foreground={
            COLORS.habit
          }
          background={
            COLORS.habitBg
          }
        />

        {/* Goals */}
        <OverviewItem
          icon={Target}
          title="আজকের লক্ষ্য"
          data={data.goals}
          foreground={
            COLORS.goal
          }
          background={
            COLORS.goalBg
          }
        />

        {/* Overall */}
        <div
          className="rounded-2xl p-3.5"
          style={{
            background:
              "#F6E4D8",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
                style={{
                  background:
                    "#FFFFFF",
                }}
              >
                <CheckSquare
                  size={15}
                  color="#B15A38"
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
                  color: "#B15A38",
                }}
              >
                {Math.round(
                  (
                    data.tasks.progress +
                    data.habits.progress +
                    data.goals.progress
                  ) / 3
                )}
                %
              </div>
            </div>

            <ProgressCircle
              progress={Math.round(
                (
                  data.tasks.progress +
                  data.habits.progress +
                  data.goals.progress
                ) / 3
              )}
              foreground="#B15A38"
              background="#FFFFFF"
            />
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}