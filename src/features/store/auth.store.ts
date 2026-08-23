"use client";

import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import { create } from "zustand";

/* =========================================================
   TYPES
========================================================= */

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
}

/* =========================================================
   AUTH STORE
========================================================= */

export const useAuthStore =
  create<AuthState>((set) => ({
    user: null,

    loading: true,

    initialized: false,

    setUser: (user) =>
      set({
        user,
      }),

    setLoading: (loading) =>
      set({
        loading,
      }),

    setInitialized: (initialized) =>
      set({
        initialized,
      }),
  }));

/* =========================================================
   AUTH LISTENER
========================================================= */

let authListenerStarted = false;

/**
 * Firebase Auth listener.
 *
 * IMPORTANT:
 * This must run only once.
 */
export const initializeAuthListener =
  (): void => {
    if (authListenerStarted) {
      return;
    }

    authListenerStarted = true;

    const {
      setUser,
      setLoading,
      setInitialized,
    } =
      useAuthStore.getState();

    setLoading(true);
    setInitialized(false);

    onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);

        setLoading(false);

        setInitialized(true);
      },
      (error) => {
        console.error(
          "Firebase auth listener error:",
          error
        );

        setUser(null);

        setLoading(false);

        setInitialized(true);
      }
    );
  };