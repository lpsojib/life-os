export type NoteType = "text" | "checklist";

export type NoteBlockType = "text" | "checklist";

export interface NoteBlock {
  id: string;
  type: NoteBlockType;
  text: string;
  completed?: boolean;
}

export interface Note {
  id: string;
  title: string;

  // New block system
  blocks?: NoteBlock[];

  // Old fields kept for compatibility
  content: string;
  checklist: {
    id: string;
    text: string;
    completed: boolean;
  }[];

  type: NoteType;
  pinned: boolean;

  createdAt: string;
  updatedAt: string;
}