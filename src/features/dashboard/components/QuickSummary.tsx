"use client";

import { useEffect, useState } from "react";

import {
  getQuickSummary,
  QuickSummaryData,
} from "../services/summary.service";

interface SummaryItemProps {
  title: string;
  value: number;
  description: string;
}

function CircularProgress({
  title,
  value,
  description,
}: SummaryItemProps) {
  const radius = 44;

  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (value / 100) * circumference;

  return (
    <div className="flex flex-1 flex-col items-center rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {/* Circular Progress */}
      <div className="relative h-28 w-28">
        <svg
          className="h-28 w-28 -rotate-90"
          viewBox="0 0 100 100"
        >
          {/* Background */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="9"
            className="text-gray-200 dark:text-gray-700"
          />

          {/* Progress */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-indigo-500 transition-all duration-700 ease-out"
          />
        </svg>

        {/* Percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {value}%
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>

      {/* Description */}
      <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

export default function QuickSummary() {
  const [summary, setSummary] =
    useState<QuickSummaryData>({
      taskCompletion: 0,
      habitCompletion: 0,
      goalProgress: 0,
    });

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data =
          await getQuickSummary();

        if (!cancelled) {
          setSummary(data);
          setLoading(false);
        }
      } catch (error) {
        console.error(
          "Failed to load quick summary:",
          error
        );

        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ================================
     Loading State
  ================================= */

  if (loading) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Quick Summary
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your overall progress at a glance
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex h-48 animate-pulse flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="h-28 w-28 rounded-full bg-gray-200 dark:bg-gray-800" />

              <div className="mt-4 h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* ================================
     Main
  ================================= */

  return (
    <section className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Quick Summary
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your overall progress at a glance
        </p>
      </div>

      {/* Circular Progress Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <CircularProgress
          title="Task Completion"
          value={summary.taskCompletion}
          description="Completed tasks"
        />

        <CircularProgress
          title="Habit Completion"
          value={summary.habitCompletion}
          description="Today's habits"
        />

        <CircularProgress
          title="Goal Progress"
          value={summary.goalProgress}
          description="Active goals"
        />
      </div>
    </section>
  );
}