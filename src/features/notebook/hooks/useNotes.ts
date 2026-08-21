"use client";

import {
  useSyncExternalStore,
} from "react";

import {
  onAuthStateChanged,
  type Unsubscribe,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

import {
  getNotes,
} from "../services/notebook.service";

import {
  Note,
} from "../types/notebook.types";

interface NotesSnapshot {
  notes: Note[];
  loading: boolean;
  error: string | null;
}

let snapshot: NotesSnapshot = {
  notes: [],
  loading: true,
  error: null,
};

const listeners =
  new Set<() => void>();

let authUnsubscribe:
  | Unsubscribe
  | null = null;

let started = false;

function emit() {
  listeners.forEach(
    (listener) => {
      listener();
    },
  );
}

async function loadNotes() {
  const user =
    auth.currentUser;

  if (!user) {
    snapshot = {
      notes: [],
      loading: false,
      error: null,
    };

    emit();

    return;
  }

  snapshot = {
    ...snapshot,
    loading: true,
    error: null,
  };

  emit();

  try {
    const notes =
      await getNotes();

    snapshot = {
      notes,
      loading: false,
      error: null,
    };

    emit();
  } catch (error) {
    console.error(
      "Failed to load notes:",
      error,
    );

    snapshot = {
      ...snapshot,
      loading: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load notes.",
    };

    emit();
  }
}

function startStore() {
  if (started) {
    return;
  }

  started = true;

  authUnsubscribe =
    onAuthStateChanged(
      auth,
      () => {
        void loadNotes();
      },
    );
}

function subscribe(
  listener: () => void,
) {
  listeners.add(listener);

  startStore();

  return () => {
    listeners.delete(
      listener,
    );

    if (
      listeners.size === 0 &&
      authUnsubscribe
    ) {
      authUnsubscribe();

      authUnsubscribe =
        null;

      started = false;
    }
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot(): NotesSnapshot {
  return {
    notes: [],
    loading: true,
    error: null,
  };
}

/* -------------------------------- */
/* ADD NOTE */
/* -------------------------------- */

export function addNoteToStore(
  note: Note,
) {
  snapshot = {
    ...snapshot,

    notes: [
      note,
      ...snapshot.notes,
    ],
  };

  emit();
}

/* -------------------------------- */
/* UPDATE NOTE */
/* -------------------------------- */

export function updateNoteInStore(
  updatedNote: Note,
) {
  snapshot = {
    ...snapshot,

    notes:
      snapshot.notes.map(
        (note) =>
          note.id ===
          updatedNote.id
            ? updatedNote
            : note,
      ),
  };

  emit();
}

/* -------------------------------- */
/* DELETE NOTE */
/* -------------------------------- */

export function deleteNoteFromStore(
  noteId: string,
) {
  snapshot = {
    ...snapshot,

    notes:
      snapshot.notes.filter(
        (note) =>
          note.id !== noteId,
      ),
  };

  emit();
}

/* -------------------------------- */
/* PIN NOTE */
/* -------------------------------- */

export function updateNotePinInStore(
  noteId: string,
  pinned: boolean,
) {
  snapshot = {
    ...snapshot,

    notes:
      snapshot.notes.map(
        (note) =>
          note.id === noteId
            ? {
                ...note,
                pinned,
              }
            : note,
      ),
  };

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
/* REFRESH */
/* -------------------------------- */

export function refreshNotes() {
  void loadNotes();
}