"use client";

import { create } from "zustand";
import { User } from "firebase/auth";

interface AuthState {
  user: User | null;
  loading: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  /**
   * Current logged-in Firebase user
   */
  user: null,

  /**
   * Firebase authentication state
   * প্রথমে true থাকবে।
   * AuthProvider Firebase থেকে session check করার
   * পর false করবে।
   */
  loading: true,

  /**
   * Set current user
   */
  setUser: (user) =>
    set({
      user,
    }),

  /**
   * Set authentication loading state
   */
  setLoading: (loading) =>
    set({
      loading,
    }),

  /**
   * Clear user from Zustand store
   *
   * Actual Firebase logout হবে:
   * logoutUser()
   */
  logout: () =>
    set({
      user: null,
      loading: false,
    }),
}));