"use client";

import { useSyncExternalStore } from "react";
import { onAuthStateChanged, type Unsubscribe } from "firebase/auth";

import { auth } from "@/lib/firebase";

import { getNotes } from "../services/notebook.service";
import { Note } from "../types/notebook.types";

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

const listeners = new Set<() => void>();

let authUnsubscribe: Unsubscribe | null = null;
let started = false;

function emit() {
  listeners.forEach((listener) => {
    listener();
  });
}

async function loadNotes() {
  const user = auth.currentUser;

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
    const notes = await getNotes();

    snapshot = {
      notes,
      loading: false,
      error: null,
    };

    emit();
  } catch (error) {
    console.error("Failed to load notes:", error);

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

  authUnsubscribe = onAuthStateChanged(auth, () => {
    void loadNotes();
  });
}

function subscribe(listener: () => void) {
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

export function useNotes() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}

export function refreshNotes() {
  void loadNotes();
}