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
  syncPendingNotes,
} from "../services/notebook.service";

import {
  Note,
} from "../types/notebook.types";

/* =========================================================
   HOOK
========================================================= */

export function useNotes() {
  const [notes, setNotes] =
    useState<Note[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [user, setUser] =
    useState<User | null>(
      auth.currentUser,
    );

  /* =======================================================
     LOAD NOTES
  ======================================================= */

  const reload = useCallback(
    async () => {
      /*
       * User না থাকলে notes load করার
       * চেষ্টা করবে না।
       */
      if (!auth.currentUser) {
        setNotes([]);
        setLoading(false);
        return;
      }

      setError(null);

      try {
        /*
         * IMPORTANT:
         *
         * getNotes() প্রথমে IndexedDB থেকে
         * local notes নেয়।
         *
         * তাই refresh করার পরও
         * local note ফিরে আসবে।
         */
        const localNotes =
          await getNotes();

        setNotes(
          Array.isArray(localNotes)
            ? localNotes
            : [],
        );
      } catch (err) {
        console.warn(
          "Could not load notebook notes:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Could not load notes.",
        );

        /*
         * Error হলেও আগের notes
         * সরিয়ে দেব না।
         */
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /* =======================================================
     AUTH LISTENER
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          if (cancelled) {
            return;
          }

          setUser(currentUser);

          /*
           * Auth পাওয়া যাওয়ার পর
           * notes load হবে।
           *
           * setTimeout ব্যবহার করা হয়েছে যাতে
           * Firebase auth state এবং IndexedDB
           * একই render-এর মধ্যে race না করে।
           */
          if (currentUser) {
            void Promise.resolve().then(
              async () => {
                if (cancelled) {
                  return;
                }

                try {
                  setLoading(true);

                  setError(null);

                  const loadedNotes =
                    await getNotes();

                  if (cancelled) {
                    return;
                  }

                  setNotes(
                    Array.isArray(
                      loadedNotes,
                    )
                      ? loadedNotes
                      : [],
                  );
                } catch (err) {
                  if (cancelled) {
                    return;
                  }

                  console.warn(
                    "Notebook initial load failed:",
                    err,
                  );

                  setError(
                    err instanceof Error
                      ? err.message
                      : "Could not load notes.",
                  );
                } finally {
                  if (!cancelled) {
                    setLoading(false);
                  }
                }
              },
            );
          } else {
            setNotes([]);
            setLoading(false);
            setError(null);
          }
        },
      );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  /* =======================================================
     ONLINE SYNC
  ======================================================= */

  useEffect(() => {
    if (!user) {
      return;
    }

    const handleOnline =
      () => {
        void syncPendingNotes()
          .then(() => {
            /*
             * Firebase sync শেষ হলে
             * local notes আবার পড়ি।
             */
            return getNotes();
          })
          .then((latestNotes) => {
            setNotes(
              Array.isArray(
                latestNotes,
              )
                ? latestNotes
                : [],
            );
          })
          .catch((err) => {
            console.warn(
              "Notebook online sync failed:",
              err,
            );
          });
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
  }, [user]);

  /* =======================================================
     RETURN
  ======================================================= */

  return {
    notes,
    setNotes,
    loading,
    error,
    reload,
  };
}