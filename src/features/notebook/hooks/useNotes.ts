"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

import {
  getNotes,
} from "../services/notebook.service";

import {
  Note,
} from "../types/notebook.types";

interface UseNotesReturn {
  notes: Note[];
  setNotes: React.Dispatch<
    React.SetStateAction<Note[]>
  >;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useNotes(): UseNotesReturn {
  const [notes, setNotes] =
    useState<Note[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  const [authReady, setAuthReady] =
    useState(false);

  /* =====================================================
     AUTH LISTENER
  ===================================================== */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
          setAuthReady(true);
        },
      );

    return unsubscribe;
  }, []);

  /* =====================================================
     LOAD NOTES
  ===================================================== */

  const reload =
    useCallback(
      async () => {
        /*
         * Firebase auth এখনো ready না হলে
         * কিছুই করবো না।
         */
        if (!authReady) {
          return;
        }

        /*
         * User login করা না থাকলে
         * Firebase query চালাবো না।
         */
        if (!user) {
          setNotes([]);
          setLoading(false);
          setError(null);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const result =
            await getNotes();

          setNotes(
            Array.isArray(result)
              ? result
              : [],
          );
        } catch (err) {
          console.error(
            "Could not load notes:",
            err,
          );

          setError(
            err instanceof Error
              ? err.message
              : "Could not load notes",
          );
        } finally {
          setLoading(false);
        }
      },
      [
        authReady,
        user,
      ],
    );

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    if (!authReady) {
      return;
    }

    const reloadTimer = setTimeout(() => {
      void reload();
    }, 0);

    return () => {
      clearTimeout(reloadTimer);
    };
  }, [
    authReady,
    user,
    reload,
  ]);

  /* =====================================================
     RETURN
  ===================================================== */

  return {
    notes,
    setNotes,
    loading,
    error,
    reload,
  };
}