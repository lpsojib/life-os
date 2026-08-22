"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  Note,
  NoteBlock,
} from "../types/notebook.types";

/* =========================================================
   CONSTANTS
========================================================= */

const COLLECTION_NAME = "notes";

/* =========================================================
   HELPERS
========================================================= */

function getUserNotesCollection() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return collection(
    db,
    "users",
    user.uid,
    COLLECTION_NAME,
  );
}

function getUserNoteDocument(
  noteId: string,
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return doc(
    db,
    "users",
    user.uid,
    COLLECTION_NAME,
    noteId,
  );
}

function now() {
  return new Date().toISOString();
}

function createId() {
  return crypto.randomUUID();
}

function normalizeBlocks(
  blocks: unknown,
): NoteBlock[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks
    .filter(
      (block): block is Record<string, unknown> =>
        Boolean(
          block &&
          typeof block === "object",
        ),
    )
    .map((block) => {
      const type =
        block.type === "checklist"
          ? "checklist"
          : "text";

      return {
        id:
          typeof block.id === "string"
            ? block.id
            : createId(),

        type,

        text:
          typeof block.text === "string"
            ? block.text
            : "",

        ...(type === "checklist"
          ? {
              checked:
                Boolean(
                  block.checked,
                ),
            }
          : {}),
      };
    });
}

/* =========================================================
   CREATE NOTE
========================================================= */

export async function addNote(
  title = "",
): Promise<Note> {
  const id = createId();
  const timestamp = now();

  const note: Note = {
    id,

    title,

    type: "text",

    content: "",

    blocks: [
      {
        id: createId(),
        type: "text",
        text: "",
      },
    ],

    checklist: [],

    pinned: false,

    createdAt: timestamp,

    updatedAt: timestamp,
  };

  /*
   * Firebase save.
   *
   * IMPORTANT:
   * No serverTimestamp().
   */

  const ref =
    getUserNoteDocument(id);

  await setDoc(ref, {
    ...note,
    syncStatus: "synced",
  });

  return note;
}

/* =========================================================
   GET NOTES
========================================================= */

export async function getNotes(): Promise<
  Note[]
> {
  const snapshot =
    await getDocs(
      getUserNotesCollection(),
    );

  return snapshot.docs.map(
    (item) => {
      const data =
        item.data();

      return {
        id: item.id,

        title:
          typeof data.title ===
          "string"
            ? data.title
            : "",

        type:
          data.type === "checklist"
            ? "checklist"
            : "text",

        content:
          typeof data.content ===
          "string"
            ? data.content
            : "",

        blocks:
          normalizeBlocks(
            data.blocks,
          ),

        checklist:
          Array.isArray(
            data.checklist,
          )
            ? data.checklist
            : [],

        pinned:
          Boolean(data.pinned),

        createdAt:
          typeof data.createdAt ===
          "string"
            ? data.createdAt
            : now(),

        updatedAt:
          typeof data.updatedAt ===
          "string"
            ? data.updatedAt
            : now(),
      };
    },
  );
}

/* =========================================================
   SAVE NOTE
========================================================= */

export async function saveNote(
  note: Note,
): Promise<Note> {
  const updatedNote: Note = {
    ...note,

    title:
      note.title ?? "",

    type:
      note.type ?? "text",

    content:
      note.content ?? "",

    blocks:
      normalizeBlocks(
        note.blocks,
      ),

    checklist:
      Array.isArray(
        note.checklist,
      )
        ? note.checklist
        : [],

    pinned:
      Boolean(note.pinned),

    updatedAt: now(),
  };

  const ref =
    getUserNoteDocument(
      updatedNote.id,
    );

  /*
   * IMPORTANT:
   * Firebase receives normal values only.
   * No serverTimestamp().
   */

  await setDoc(
    ref,
    {
      id:
        updatedNote.id,

      title:
        updatedNote.title,

      type:
        updatedNote.type,

      content:
        updatedNote.content,

      blocks:
        updatedNote.blocks,

      checklist:
        updatedNote.checklist,

      pinned:
        updatedNote.pinned,

      createdAt:
        updatedNote.createdAt,

      updatedAt:
        updatedNote.updatedAt,

      syncStatus:
        "synced",
    },
    {
      merge: true,
    },
  );

  return updatedNote;
}

/* =========================================================
   UPDATE NOTE
========================================================= */

export async function updateNote(
  noteId: string,
  data: Partial<Note>,
): Promise<void> {
  const ref =
    getUserNoteDocument(
      noteId,
    );

  const updateData: Record<
    string,
    unknown
  > = {
    ...data,
    updatedAt: now(),
    syncStatus: "synced",
  };

  if (data.blocks) {
    updateData.blocks =
      normalizeBlocks(
        data.blocks,
      );
  }

  await updateDoc(
    ref,
    updateData,
  );
}

/* =========================================================
   DELETE NOTE
========================================================= */

export async function deleteNote(
  noteId: string,
): Promise<void> {
  const ref =
    getUserNoteDocument(
      noteId,
    );

  await deleteDoc(ref);
}

/* =========================================================
   TOGGLE PIN
========================================================= */

export async function toggleNotePin(
  note: Note,
): Promise<Note> {
  const updatedNote: Note = {
    ...note,

    pinned:
      !note.pinned,

    updatedAt: now(),
  };

  const ref =
    getUserNoteDocument(
      note.id,
    );

  await updateDoc(
    ref,
    {
      pinned:
        updatedNote.pinned,

      updatedAt:
        updatedNote.updatedAt,

      syncStatus:
        "synced",
    },
  );

  return updatedNote;
}

/* =========================================================
   GET SINGLE NOTE
========================================================= */

export async function getNote(
  noteId: string,
): Promise<Note | null> {
  const snapshot =
    await getDocs(
      getUserNotesCollection(),
    );

  const found =
    snapshot.docs.find(
      (item) =>
        item.id === noteId,
    );

  if (!found) {
    return null;
  }

  const data =
    found.data();

  return {
    id: found.id,

    title:
      typeof data.title ===
      "string"
        ? data.title
        : "",

    type:
      data.type === "checklist"
        ? "checklist"
        : "text",

    content:
      typeof data.content ===
      "string"
        ? data.content
        : "",

    blocks:
      normalizeBlocks(
        data.blocks,
      ),

    checklist:
      Array.isArray(
        data.checklist,
      )
        ? data.checklist
        : [],

    pinned:
      Boolean(data.pinned),

    createdAt:
      typeof data.createdAt ===
      "string"
        ? data.createdAt
        : now(),

    updatedAt:
      typeof data.updatedAt ===
      "string"
        ? data.updatedAt
        : now(),
  };
}