"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth.store";

export default function Home() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore(
    (state) => state.initialized
  );

  useEffect(() => {
    if (!initialized || loading) {
      return;
    }

    if (user) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [
    user,
    loading,
    initialized,
    router,
  ]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">

        {/* LP Logo */}
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-black shadow-xl">
          <span className="text-3xl font-black tracking-tight text-white">
            LP
          </span>
        </div>

        <h1 className="mt-4 text-xl font-bold text-gray-900">
          Life OS
        </h1>

        <div className="mt-4 h-1 w-16 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-black" />
        </div>

      </div>
    </main>
  );
}