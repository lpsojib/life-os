"use client";

import { ReactNode, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth.store";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({
  children,
}: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}