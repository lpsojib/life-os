"use client";

import {
  useCallback,
  useSyncExternalStore,
} from "react";

import {
  getNotes,
} from "../services/notebook.service";

import {
  Note,
} from "../types/notebook.types";

/* =========================================================
   NOTE STORE
========================================================= */

let notes: Note[] = [];

let loading = true;

let error: string | null = null;

let initialized = false;

let loadingPromise:
  | Promise<void>
  | null = null;

const listeners = new Set<
  () => void
>();

/* =========================================================
   SUBSCRIBE
========================================================= */

function subscribe(
  listener: () => void,
) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/* =========================================================
   SNAPSHOT
========================================================= */

function getSnapshot() {
  return {
    notes,
    loading,
    error,
  };
}

function getServerSnapshot() {
  return {
    notes: [] as Note[],
    loading: true,
    error: null as string | null,
  };
}

/* =========================================================
   NOTIFY
========================================================= */

function notify() {
  listeners.forEach(
    (listener) => {
      listener();
    },
  );
}

/* =========================================================
   LOAD NOTES
========================================================= */

async function loadNotes() {
  if (loadingPromise) {
    return loadingPromise;
  }

  loading = true;
  error = null;

  notify();

  loadingPromise =
    getNotes()
      .then((result) => {
        notes = result;
        error = null;
        initialized = true;
      })
      .catch((reason) => {
        console.error(
          "Failed to load notes:",
          reason,
        );

        error =
          reason instanceof Error
            ? reason.message
            : "Failed to load notes.";

        initialized = true;
      })
      .finally(() => {
        loading = false;
        loadingPromise = null;

        notify();
      });

  return loadingPromise;
}

/* =========================================================
   INITIAL LOAD
========================================================= */

if (
  typeof window !== "undefined" &&
  !initialized
) {
  void loadNotes();
}

/* =========================================================
   SET NOTES
========================================================= */

function setNotes(
  value:
    | Note[]
    | ((
        previous: Note[],
      ) => Note[]),
) {
  if (typeof value === "function") {
    notes = value(notes);
  } else {
    notes = value;
  }

  notify();
}

/* =========================================================
   RELOAD
========================================================= */

async function reload() {
  await loadNotes();
}

/* =========================================================
   HOOK
========================================================= */

export function useNotes() {
  const snapshot =
    useSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot,
    );

  const reloadNotes =
    useCallback(
      async () => {
        await reload();
      },
      [],
    );

  return {
    notes: snapshot.notes,
    setNotes,
    loading: snapshot.loading,
    error: snapshot.error,
    reload: reloadNotes,
  };
}