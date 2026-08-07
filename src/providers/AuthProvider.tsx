"use client";

import { useEffect, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth.store";

interface Props {
  children: ReactNode;
}

export default function AuthProvider({ children }: Props) {
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