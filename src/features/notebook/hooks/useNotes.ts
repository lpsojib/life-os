"use client";

import { useSyncExternalStore } from "react";
import {
  onAuthStateChanged,
  type Unsubscribe,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

import { getNotes } from "../services/notebook.service";
import { Note } from "../types/notebook.types";

interface NotesSnapshot {
  notes: Note[];
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = "life-os-notebook-notes";

let snapshot: NotesSnapshot = {
  notes: [],
  loading: true,
  error: null,
};

const listeners = new Set<() => void>();

let authUnsubscribe: Unsubscribe | null = null;
let started = false;
let loadedLocal = false;

function emit() {
  listeners.forEach((listener) => {
    listener();
  });
}

/* -------------------------------- */
/* Local Storage */
/* -------------------------------- */

function readLocalNotes(): Note[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(
      STORAGE_KEY,
    );

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as Note[];
  } catch (error) {
    console.error(
      "Failed to read local notes:",
      error,
    );

    return [];
  }
}

function writeLocalNotes(
  notes: Note[],
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notes),
    );
  } catch (error) {
    console.error(
      "Failed to save local notes:",
      error,
    );
  }
}

/* -------------------------------- */
/* Load Local Notes Immediately */
/* -------------------------------- */

function loadLocalNotes() {
  const localNotes =
    readLocalNotes();

  snapshot = {
    notes: localNotes,
    loading: false,
    error: null,
  };

  loadedLocal = true;

  emit();
}

/* -------------------------------- */
/* Firebase Sync */
/* -------------------------------- */

async function syncFromFirebase() {
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  /*
   * Local notes are already visible.
   * Firebase must NEVER block the UI.
   */
  try {
    const firebaseNotes =
      await getNotes();

    snapshot = {
      notes: firebaseNotes,
      loading: false,
      error: null,
    };

    writeLocalNotes(
      firebaseNotes,
    );

    emit();
  } catch (error) {
    console.warn(
      "Firebase unavailable. Using local notes.",
      error,
    );

    /*
     * Keep local notes visible.
     */
    snapshot = {
      ...snapshot,
      loading: false,
      error: null,
    };

    emit();
  }
}

/* -------------------------------- */
/* Start Store */
/* -------------------------------- */

function startStore() {
  if (started) {
    return;
  }

  started = true;

  /*
   * IMPORTANT:
   * Load local data immediately.
   */
  if (!loadedLocal) {
    loadLocalNotes();
  }

  /*
   * Firebase works in background.
   */
  authUnsubscribe =
    onAuthStateChanged(
      auth,
      () => {
        void syncFromFirebase();
      },
    );
}

/* -------------------------------- */
/* Subscribe */
/* -------------------------------- */

function subscribe(
  listener: () => void,
) {
  listeners.add(listener);

  startStore();

  return () => {
    listeners.delete(listener);

    if (
      listeners.size === 0 &&
      authUnsubscribe
    ) {
      authUnsubscribe();

      authUnsubscribe = null;
      started = false;
    }
  };
}

/* -------------------------------- */
/* Snapshot */
/* -------------------------------- */

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot(): NotesSnapshot {
  return {
    notes: [],
    loading: false,
    error: null,
  };
}

/* -------------------------------- */
/* ADD */
/* -------------------------------- */

export function addNoteToStore(
  note: Note,
) {
  const exists =
    snapshot.notes.some(
      (item) =>
        item.id === note.id,
    );

  if (exists) {
    return;
  }

  const notes = [
    note,
    ...snapshot.notes,
  ];

  snapshot = {
    ...snapshot,
    notes,
    loading: false,
    error: null,
  };

  writeLocalNotes(notes);

  emit();
}

/* -------------------------------- */
/* UPDATE */
/* -------------------------------- */

export function updateNoteInStore(
  updatedNote: Note,
) {
  const exists =
    snapshot.notes.some(
      (note) =>
        note.id ===
        updatedNote.id,
    );

  let notes: Note[];

  if (exists) {
    notes = snapshot.notes.map(
      (note) =>
        note.id ===
        updatedNote.id
          ? updatedNote
          : note,
    );
  } else {
    notes = [
      updatedNote,
      ...snapshot.notes,
    ];
  }

  snapshot = {
    ...snapshot,
    notes,
    loading: false,
    error: null,
  };

  writeLocalNotes(notes);

  emit();
}

/* -------------------------------- */
/* DELETE */
/* -------------------------------- */

export function deleteNoteFromStore(
  noteId: string,
) {
  const notes =
    snapshot.notes.filter(
      (note) =>
        note.id !== noteId,
    );

  snapshot = {
    ...snapshot,
    notes,
    loading: false,
    error: null,
  };

  writeLocalNotes(notes);

  emit();
}

/* -------------------------------- */
/* PIN */
/* -------------------------------- */

export function updateNotePinInStore(
  noteId: string,
  pinned: boolean,
) {
  const notes =
    snapshot.notes.map(
      (note) =>
        note.id === noteId
          ? {
              ...note,
              pinned,
              updatedAt:
                new Date().toISOString(),
            }
          : note,
    );

  snapshot = {
    ...snapshot,
    notes,
    loading: false,
    error: null,
  };

  writeLocalNotes(notes);

  emit();
}

/* -------------------------------- */
/* HOOK */
/* -------------------------------- */

export function useNotes() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}

/* -------------------------------- */
/* Refresh */
/* -------------------------------- */

export function refreshNotes() {
  /*
   * Local data first.
   */
  loadLocalNotes();

  /*
   * Firebase in background.
   */
  void syncFromFirebase();
}