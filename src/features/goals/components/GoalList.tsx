"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";

import {
  getGoals,
} from "../services/goal.service";

import { Goal } from "../types/goal.types";

import GoalCard from "./GoalCard";

interface GoalListProps {
  refreshKey?: number;
}

export default function GoalList({
  refreshKey = 0,
}: GoalListProps) {
  const [goals, setGoals] =
    useState<Goal[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /**
   * Load Active Goals
   */
  const loadGoals = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getGoals();

        setGoals(data);
      } catch (error) {
        console.error(
          "Load goals error:",
          error
        );

        setError(
          "লক্ষ্যগুলো লোড করা যায়নি।"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Wait for Firebase Authentication
   * before loading Goals.
   */
  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) {
            setGoals([]);
            setLoading(false);

            setError(
              "লক্ষ্য দেখতে আগে লগইন করুন।"
            );

            return;
          }

          await loadGoals();
        }
      );

    return () => {
      unsubscribe();
    };
  }, [
    loadGoals,
    refreshKey,
  ]);

  /**
   * Loading State
   */
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center">
        <p className="text-sm text-gray-500">
          লক্ষ্য লোড হচ্ছে...
        </p>
      </div>
    );
  }

  /**
   * Error State
   */
  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
        <p className="text-sm text-red-600">
          {error}
        </p>
      </div>
    );
  }

  /**
   * No Goals
   */
  if (goals.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />

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

        <h3 className="mt-4 font-semibold text-gray-900">
          এখনো কোনো লক্ষ্য নেই
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          নতুন লক্ষ্য তৈরি করলে এখানে দেখা যাবে।
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