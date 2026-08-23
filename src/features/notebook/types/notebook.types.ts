export type NoteBlockType =
  | "text"
  | "checklist";

export interface NoteBlock {
  id: string;

  type: NoteBlockType;

  /**
   * Normal text বা HTML formatted text.
   *
   * Example:
   * Hello world
   *
   * অথবা:
   * Hello <strong>world</strong>
   */
  text: string;

  checked?: boolean;
}

export interface Note {
  id: string;

  title: string;

  description?: string;

  type?: string;

  blocks: NoteBlock[];

  pinned?: boolean;

  createdAt: string;

  updatedAt: string;
}