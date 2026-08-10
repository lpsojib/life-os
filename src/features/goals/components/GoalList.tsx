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
  expireGoal,
} from "../services/goal.service";

import { Goal } from "../types/goal.types";

import GoalCard from "./GoalCard";

interface GoalListProps {
  refreshKey?: number;
}

const parseDate = (
  dateString: string
) => {
  const [year, month, day] =
    dateString.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
};

const getToday = () => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return today;
};

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
   * Load active goals
   */
  const loadGoals = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const activeGoals =
          await getGoals();

        const today = getToday();

        const validGoals: Goal[] =
          [];

        /**
         * Automatically expire goals
         * whose End Date has passed.
         */
        for (const goal of activeGoals) {
          const endDate =
            parseDate(
              goal.endDate
            );

          if (today > endDate) {
            await expireGoal(
              goal.id
            );
          } else {
            validGoals.push(goal);
          }
        }

        setGoals(validGoals);
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
  }, [loadGoals, refreshKey]);

  /**
   * Loading
   */
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <p className="text-sm text-gray-500">
          লক্ষ্য লোড হচ্ছে...
        </p>
      </div>
    );
  }

  /**
   * Error
   */
  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  /**
   * Empty state
   */
  if (goals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
        <p className="font-medium text-gray-700">
          এখনো কোনো সক্রিয় লক্ষ্য নেই।
        </p>

        <p className="mt-1 text-sm text-gray-500">
          নতুন লক্ষ্য যোগ করে শুরু করুন।
        </p>
      </div>
    );
  }

  /**
   * Goal list
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