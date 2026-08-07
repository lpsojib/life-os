export type TaskStatus = "daily" | "pending" | "completed";

export type TaskPriority = "low" | "medium" | "high";

export type LifeArea =
  | "work"
  | "learning"
  | "health"
  | "deen"
  | "family"
  | "finance"
  | "personal";

export interface Task {
  id: string;

  title: string;
  description: string;

  lifeArea: LifeArea;
  priority: TaskPriority;

  goalId: string | null;

  status: TaskStatus;

  dueDate: string | null;

  order: number;

  createdAt: string;
  completedAt: string | null;
}