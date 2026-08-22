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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  /**
   * Startup-এ loading false রাখা হচ্ছে।
   *
   * কারণ Firebase-এর জন্য পুরো app আটকে থাকবে না।
   */
  loading: false,

  /**
   * App শুরুতেই usable থাকবে।
   */
  initialized: true,

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
      /**
       * Local login flag আগে remove করি।
       *
       * এতে offline অবস্থাতেও logout করার পর
       * পরেরবার app খুললে Dashboard-এ ঢুকবে না।
       */
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_KEY);
      }

      await signOut(auth);

      set({
        user: null,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      console.error("Logout error:", error);

      /**
       * Firebase offline হলেও local logout state
       * বজায় থাকবে।
       */
      set({
        user: null,
        loading: false,
        initialized: true,
      });
    }
  },
}));

/**
 * Firebase listener একবারই চালু হবে।
 */
let authListenerStarted = false;

export function initializeAuthListener() {
  if (authListenerStarted) {
    return;
  }

  authListenerStarted = true;

  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      /**
       * Firebase user পাওয়া গেছে।
       */
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
     * Firebase user নেই।
     *
     * কিন্তু offline অবস্থায় Firebase যদি session
     * restore করতে না পারে, local login flag
     * যেন সঙ্গে সঙ্গে remove না হয়ে যায়।
     */
    const hasLocalSession =
      typeof window !== "undefined" &&
      localStorage.getItem(AUTH_KEY) === "true";

    const isOffline =
      typeof navigator !== "undefined" &&
      !navigator.onLine;

    if (hasLocalSession && isOffline) {
      /**
       * Offline অবস্থায় আগের login ধরে রাখি।
       *
       * user object Firebase পরে online হলে restore করবে।
       */
      useAuthStore.setState({
        user: null,
        loading: false,
        initialized: true,
      });

      return;
    }

    /**
     * সত্যিই logged out হলে local flag remove।
     */
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_KEY);
    }

    useAuthStore.setState({
      user: null,
      loading: false,
      initialized: true,
    });
  });
}