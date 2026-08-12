export type TaskStatus =
  | "daily"
  | "pending"
  | "completed";

export type TaskPriority =
  | "low"
  | "medium"
  | "high";

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

  /**
   * Future Goal connection.
   * Currently optional.
   */
  goalId: string | null;

  /**
   * daily / pending / completed
   */
  status: TaskStatus;

  /**
   * Task due date.
   *
   * YYYY-MM-DD
   */
  dueDate: string | null;

  /**
   * Pending task active date.
   *
   * YYYY-MM-DD
   */
  activeDate?: string | null;

  /**
   * If true:
   *
   * Task will automatically remain
   * as a Daily Task every day.
   *
   * If false:
   *
   * It is a normal one-time task.
   */
  repeatDaily: boolean;

  /**
   * Used for task ordering.
   */
  order: number;

  /**
   * Task creation time.
   */
  createdAt: string;

  /**
   * Completion time.
   */
  completedAt: string | null;
}