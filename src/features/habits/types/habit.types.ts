export interface Habit {
  id: string;

  name: string;

  targetDays: number;

  startDate: string;

  endDate: string;

  time: string;

  status: "active" | "completed";

  createdAt: string;
}

export interface HabitCompletion {
  id: string;

  habitId: string;

  date: string;

  completed: boolean;

  createdAt: string;
}