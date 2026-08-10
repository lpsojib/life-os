export type GoalTaskStatus =
  | "pending"
  | "completed";

export interface GoalTask {
  id: string;
  goalId: string;
  title: string;
  status: GoalTaskStatus;
  createdAt: string;
  completedAt: string | null;
}