export interface Task {
  id: string;

  title: string;

  description?: string;

  completed: boolean;

  priority: "low" | "medium" | "high";

  createdAt: Date;

  updatedAt: Date;

  completedAt?: Date;

  userId: string;
}