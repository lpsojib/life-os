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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">

        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-black shadow-lg">
          <span className="text-3xl font-black text-white">
            LP
          </span>
        </div>

        <p className="mt-4 text-lg font-semibold text-gray-900">
          Life OS
        </p>

      </div>
    </div>
  );
}