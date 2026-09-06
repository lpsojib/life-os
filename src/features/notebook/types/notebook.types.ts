export type NoteBlockType =
  | "text"
  | "checklist";

export type NoteBlock = {
  id: string;
  type: NoteBlockType;
  text: string;
  checked?: boolean;
};

export type Note = {
  id: string;
  title: string;
  blocks: NoteBlock[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
};

export type LocalNote = Note & {
  syncStatus?: "pending" | "synced";
};