"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getNotes,
  syncPendingNotes,
} from "../services/notebook.service";

import { Note } from "../types/notebook.types";

export function useNotes() {
  const [notes, setNotes] =
    useState<Note[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const loadNotes =
    useCallback(async () => {
      try {
        setError(null);

        const result =
          await getNotes();

        setNotes(result);
      } catch (error) {
        console.error(
          "Failed to load notes:",
          error,
        );

        setError(
          "Could not load notes.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result =
          await getNotes();

        if (!active) {
          return;
        }

        setNotes(result);
      } catch (error) {
        if (!active) {
          return;
        }

        console.error(
          "Notebook loading failed:",
          error,
        );

        setError(
          "Could not load notes.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleOnline =
      () => {
        void syncPendingNotes().then(
          () => {
            void loadNotes();
          },
        );
      };

    window.addEventListener(
      "online",
      handleOnline,
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline,
      );
    };
  }, [loadNotes]);

  return {
    notes,

    setNotes,

    loading,

    error,

    reload: loadNotes,
  };
}