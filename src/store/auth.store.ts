"use client";

import { create } from "zustand";
import {
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

const AUTH_KEY = "life-os-authenticated";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;

  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(
  (set) => ({
    user: null,

    /**
     * App startup Firebase-এর জন্য অপেক্ষা করবে না।
     */
    loading: false,

    initialized: true,

    setUser: (user) => {
      set({ user });
    },

    setLoading: (loading) => {
      set({ loading });
    },

    setInitialized: (initialized) => {
      set({ initialized });
    },

    logout: async () => {
      /**
       * IMPORTANT:
       * Explicit logout হলেই শুধু local session
       * delete হবে।
       */
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_KEY);
      }

      try {
        await signOut(auth);
      } catch (error) {
        console.warn(
          "Firebase logout:",
          error
        );
      }

      set({
        user: null,
        loading: false,
        initialized: true,
      });
    },
  })
);


/**
 * Firebase listener একবারই চালু হবে।
 */
let authListenerStarted = false;

export function initializeAuthListener() {
  if (authListenerStarted) {
    return;
  }

  authListenerStarted = true;

  onAuthStateChanged(
    auth,
    (firebaseUser) => {
      /**
       * Firebase user পাওয়া গেছে।
       */
      if (firebaseUser) {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            AUTH_KEY,
            "true"
          );
        }

        useAuthStore.setState({
          user: firebaseUser,
          loading: false,
          initialized: true,
        });

        return;
      }

      /**
       * IMPORTANT:
       *
       * Firebase null দিলেই local session
       * delete করা যাবে না।
       *
       * কারণ offline অবস্থায় Firebase সাময়িকভাবে
       * null দিতে পারে।
       *
       * Explicit logout ছাড়া session থাকবে।
       */
      useAuthStore.setState({
        user: null,
        loading: false,
        initialized: true,
      });
    }
  );
}