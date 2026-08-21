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
  syncPendingNotes,
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

/* ================================================= */
/* EMIT */
/* ================================================= */

function emit() {
  listeners.forEach(
    (listener) => {
      listener();
    },
  );
}

/* ================================================= */
/* LOAD NOTES */
/* ================================================= */

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

/* ================================================= */
/* START STORE */
/* ================================================= */

function startStore() {
  if (started) {
    return;
  }

  started = true;

  authUnsubscribe =
    onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          snapshot = {
            notes: [],
            loading: false,
            error: null,
          };

          emit();

          return;
        }

        void loadNotes();

        /*
         * Try pending offline
         * notes when user logs in.
         */
        if (
          typeof navigator !==
            "undefined" &&
          navigator.onLine
        ) {
          void syncPendingNotes();
        }
      },
    );
}

/* ================================================= */
/* SUBSCRIBE */
/* ================================================= */

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

/* ================================================= */
/* SNAPSHOT */
/* ================================================= */

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

/* ================================================= */
/* ADD NOTE */
/* ================================================= */

export function addNoteToStore(
  note: Note,
) {
  /*
   * Prevent duplicate note.
   */
  const exists =
    snapshot.notes.some(
      (item) =>
        item.id === note.id,
    );

  if (exists) {
    return;
  }

  snapshot = {
    ...snapshot,

    notes: [
      note,
      ...snapshot.notes,
    ],
  };

  emit();
}

/* ================================================= */
/* UPDATE NOTE */
/* ================================================= */

export function updateNoteInStore(
  updatedNote: Note,
) {
  const exists =
    snapshot.notes.some(
      (note) =>
        note.id ===
        updatedNote.id,
    );

  if (!exists) {
    /*
     * If the note isn't loaded yet,
     * add it to the beginning.
     */
    snapshot = {
      ...snapshot,

      notes: [
        updatedNote,
        ...snapshot.notes,
      ],
    };

    emit();

    return;
  }

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

/* ================================================= */
/* DELETE NOTE */
/* ================================================= */

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

/* ================================================= */
/* PIN NOTE */
/* ================================================= */

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
                updatedAt:
                  new Date().toISOString(),
              }
            : note,
      ),
  };

  emit();
}

/* ================================================= */
/* HOOK */
/* ================================================= */

export function useNotes() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}

/* ================================================= */
/* REFRESH */
/* ================================================= */

export function refreshNotes() {
  void loadNotes();
}

/* ================================================= */
/* ONLINE EVENT */
/* ================================================= */

if (
  typeof window !==
  "undefined"
) {
  window.addEventListener(
    "online",
    () => {
      void syncPendingNotes();

      /*
       * Reload after pending
       * notes have been synced.
       */
      window.setTimeout(() => {
        void loadNotes();
      }, 500);
    },
  );
}