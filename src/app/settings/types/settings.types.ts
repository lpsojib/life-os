export type ResetModule =
  | "tasks"
  | "habits"
  | "goals"
  | "notebook"
  | "focus"
  | "finance"
  | "reminder"
  | "ai";

export interface ResetModuleItem {
  id: ResetModule;
  label: string;
  description: string;
}

export const RESET_MODULES: ResetModuleItem[] = [
  {
    id: "tasks",
    label: "Tasks",
    description: "All tasks and task history",
  },
  {
    id: "habits",
    label: "Habits",
    description: "Habits, completions and streaks",
  },
  {
    id: "goals",
    label: "Goals",
    description: "Goals and progress data",
  },
  {
    id: "notebook",
    label: "Notebook",
    description: "All notes and notebook data",
  },
  {
    id: "focus",
    label: "Focus & Timer",
    description: "Focus sessions and timer data",
  },
  {
    id: "finance",
    label: "Finance",
    description: "Transactions and finance records",
  },
  {
    id: "reminder",
    label: "Reminder",
    description: "Reminder and alarm data",
  },
  {
    id: "ai",
    label: "AI Data",
    description: "Saved AI-related data",
  },
];