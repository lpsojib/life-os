export type NoteType = "text" | "checklist";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  type: NoteType;
  content: string;
  checklist: ChecklistItem[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}