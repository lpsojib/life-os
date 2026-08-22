"use client";

import { create } from "zustand";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

import { auth } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => {
    set({
      user,
    });
  },

  setLoading: (loading) => {
    set({
      loading,
    });
  },

  setInitialized: (initialized) => {
    set({
      initialized,
    });
  },

  logout: async () => {
    try {
      await signOut(auth);

      if (typeof window !== "undefined") {
        localStorage.removeItem("life-os-authenticated");
      }

      set({
        user: null,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  },
}));

/**
 * Firebase auth listener
 *
 * IMPORTANT:
 * এই listener একবারই initialize হবে।
 */
let authListenerStarted = false;

export function initializeAuthListener() {
  if (authListenerStarted) {
    return;
  }

  authListenerStarted = true;

  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "life-os-authenticated",
          "true"
        );
      }

      useAuthStore.setState({
        user: firebaseUser,
        loading: false,
        initialized: true,
      });
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem(
          "life-os-authenticated"
        );
      }

      useAuthStore.setState({
        user: null,
        loading: false,
        initialized: true,
      });
    }
  });
}