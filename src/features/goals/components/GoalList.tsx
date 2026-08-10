"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";

import { getGoals } from "../services/goal.service";

import { Goal } from "../types/goal.types";

import GoalCard from "./GoalCard";

interface GoalListProps {
  refreshKey?: number;
}

export default function GoalList({
  refreshKey = 0,
}: GoalListProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Load Active Goals
   */
  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getGoals();

      setGoals(data);
    } catch (error) {
      console.error("Load goals error:", error);

      setError(
        "লক্ষ্যগুলো লোড করা যায়নি।"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Wait for Firebase Authentication
   * before loading Goals.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          setGoals([]);
          setLoading(false);
          setError(
            "লক্ষ্য দেখতে আগে লগইন করুন।"
          );

          return;
        }

        void loadGoals();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [loadGoals, refreshKey]);

  /**
   * Loading State
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-sm text-gray-500">
          লক্ষ্য লোড হচ্ছে...
        </div>
      </div>
    );
  }

  /**
   * Error State
   */
  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 px-4 py-4 text-center text-sm font-medium text-red-600">
        {error}
      </div>
    );
  }

  /**
   * No Goals
   */
  if (goals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-gray-400"
          >
            <circle
              cx="12"
              cy="12"
              r="5"
            />

            <circle
              cx="12"
              cy="12"
              r="1"
            />
          </svg>
        </div>

        <p className="text-base font-semibold text-gray-700">
          এখনো কোনো লক্ষ্য নেই
        </p>

        <p className="mt-1 text-sm text-gray-400">
          নতুন একটি লক্ষ্য তৈরি করে শুরু করো।
        </p>
      </div>
    );
  }

  /**
   * Goal List
   */
  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
        />
      ))}
    </div>
  );
}