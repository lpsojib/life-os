export type NoteType =
  | "text"
  | "checklist";

export type NoteBlockType =
  | "text"
  | "checklist";

export interface NoteBlock {
  id: string;
  type: NoteBlockType;
  text: string;
  checked?: boolean;
}

export interface Note {
  id: string;

  title: string;

  type: NoteType;

  content?: string;

  blocks: NoteBlock[];

  checklist?: NoteBlock[];

  pinned: boolean;

  createdAt: string;

  updatedAt: string;
}