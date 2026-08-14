"use client";

import { create } from "zustand";
import {
  onAuthStateChanged,
  User,
  signOut,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // 🔐 Firebase saved authentication session check
  onAuthStateChanged(auth, (user) => {
    set({
      user,
      loading: false,
    });
  });

  return {
    user: null,

    // প্রথমে Firebase session check করবে
    loading: true,

    setUser: (user) =>
      set({
        user,
      }),

    setLoading: (loading) =>
      set({
        loading,
      }),

    logout: async () => {
      try {
        await signOut(auth);

        set({
          user: null,
          loading: false,
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    },
  };
});