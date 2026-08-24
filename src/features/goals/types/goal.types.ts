export type GoalStatus =
  | "active"
  | "completed"
  | "expired";

/**
 * Goal Task
 */
export interface GoalTask {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
  updatedAt: string;
}

/**
 * Goal
 */
export interface Goal {
  id: string;

  title: string;

  description: string;

  startDate: string;

  endDate: string;

  status: GoalStatus;

  totalTasks: number;

  completedTasks: number;

  progress: number;

  createdAt: string;

  updatedAt: string;
}