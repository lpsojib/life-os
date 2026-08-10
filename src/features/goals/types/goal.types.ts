export type GoalStatus =
  | "active"
  | "completed"
  | "expired";

/**
 * Goal Task
 *
 * প্রতিটি Goal-এর ভিতরের আলাদা Task।
 */
export interface GoalTask {
  id: string;

  /**
   * কোন Goal-এর অধীনে Task
   */
  goalId: string;

  /**
   * Task title
   */
  title: string;

  /**
   * Task completed কিনা
   */
  completed: boolean;

  /**
   * Task তৈরি হওয়ার সময়
   */
  createdAt: string;

  /**
   * Task complete হওয়ার সময়
   */
  completedAt: string | null;

  /**
   * Task update হওয়ার সময়
   */
  updatedAt: string;
}

/**
 * Goal
 */
export interface Goal {
  id: string;

  /**
   * Goal name
   *
   * Example:
   * Become Web Developer
   */
  title: string;

  /**
   * Optional description
   */
  description: string;

  /**
   * Goal start date
   *
   * Format: YYYY-MM-DD
   */
  startDate: string;

  /**
   * Goal end date
   *
   * Format: YYYY-MM-DD
   */
  endDate: string;

  /**
   * active / completed / expired
   */
  status: GoalStatus;

  /**
   * Total tasks under this goal
   */
  totalTasks: number;

  /**
   * Completed tasks under this goal
   */
  completedTasks: number;

  /**
   * Progress percentage
   *
   * 0 - 100
   */
  progress: number;

  /**
   * Firebase created time
   */
  createdAt: string;

  /**
   * Firebase updated time
   */
  updatedAt: string;
}