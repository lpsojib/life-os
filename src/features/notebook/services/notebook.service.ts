"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  Note,
  NoteBlock,
} from "../types/notebook.types";

const NOTES_COLLECTION = "notes";

function getUserNotesCollection() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return collection(
    db,
    "users",
    user.uid,
    NOTES_COLLECTION,
  );
}

function now() {
  return new Date().toISOString();
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function normalizeBlocks(
  blocks?: NoteBlock[],
): NoteBlock[] {
  if (
    !Array.isArray(blocks) ||
    blocks.length === 0
  ) {
    return [];
  }

  return blocks.map((block) => {
    if (block.type === "checklist") {
      return {
        id: block.id || createId(),
        type: "checklist",
        text:
          typeof block.text === "string"
            ? block.text
            : "",
        checked: Boolean(block.checked),
      };
    }

    return {
      id: block.id || createId(),
      type: "text",
      text:
        typeof block.text === "string"
          ? block.text
          : "",
    };
  });
}

function normalizeNote(
  data: Partial<Note>,
  id: string,
): Note {
  const createdAt =
    typeof data.createdAt === "string"
      ? data.createdAt
      : now();

  const updatedAt =
    typeof data.updatedAt === "string"
      ? data.updatedAt
      : createdAt;

  return {
    id,

    title:
      typeof data.title === "string"
        ? data.title
        : "",

    type:
      data.type === "checklist"
        ? "checklist"
        : "text",

    content:
      typeof data.content === "string"
        ? data.content
        : "",

    blocks: normalizeBlocks(
      data.blocks,
    ),

    checklist: Array.isArray(
      data.checklist,
    )
      ? data.checklist
      : [],

    pinned: Boolean(data.pinned),

    createdAt,
    updatedAt,
  };
}

/* =========================================================
   GET NOTES
========================================================= */

export async function getNotes(): Promise<Note[]> {
  const snapshot =
    await getDocs(
      getUserNotesCollection(),
    );

  const notes = snapshot.docs.map(
    (item) =>
      normalizeNote(
        item.data() as Partial<Note>,
        item.id,
      ),
  );

  notes.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime(),
  );

  return notes;
}

/* =========================================================
   ADD NOTE
========================================================= */

export async function addNote(
  title = "",
): Promise<Note> {
  const timestamp = now();

  const noteData: Omit<
    Note,
    "id"
  > = {
    title,
    type: "text",
    content: "",
    blocks: [],
    checklist: [],
    pinned: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const reference =
    await addDoc(
      getUserNotesCollection(),
      noteData,
    );

  return {
    id: reference.id,
    ...noteData,
  };
}

/* =========================================================
   SAVE NOTE
========================================================= */

export async function saveNote(
  note: Note,
): Promise<Note> {
  const updatedAt = now();

  const updatedNote: Note = {
    ...note,
    title:
      typeof note.title === "string"
        ? note.title
        : "",
    blocks: normalizeBlocks(
      note.blocks,
    ),
    pinned: Boolean(note.pinned),
    updatedAt,
  };

  const reference = doc(
    getUserNotesCollection(),
    note.id,
  );

  await updateDoc(
    reference,
    {
      title: updatedNote.title,
      type: updatedNote.type,
      content:
        updatedNote.content ?? "",
      blocks: updatedNote.blocks,
      checklist:
        updatedNote.checklist ?? [],
      pinned: updatedNote.pinned,
      updatedAt,
    },
  );

  return updatedNote;
}

/* =========================================================
   DELETE NOTE
========================================================= */

export async function deleteNote(
  noteId: string,
): Promise<void> {
  const reference = doc(
    getUserNotesCollection(),
    noteId,
  );

  await deleteDoc(reference);
}

/* =========================================================
   TOGGLE PIN
========================================================= */

export async function toggleNotePin(
  note: Note,
): Promise<Note> {
  const updatedAt = now();
  const pinned = !Boolean(
    note.pinned,
  );

  const reference = doc(
    getUserNotesCollection(),
    note.id,
  );

  await updateDoc(
    reference,
    {
      pinned,
      updatedAt,
    },
  );

  return {
    ...note,
    pinned,
    updatedAt,
  };
}