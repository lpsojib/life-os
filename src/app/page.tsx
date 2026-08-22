"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth.store";

export default function Home() {
  const router = useRouter();

  const user = useAuthStore(
    (state) => state.user
  );

  const initialized = useAuthStore(
    (state) => state.initialized
  );

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (user) {
      window.location.replace("/dashboard");
      return;
    }

    window.location.replace("/login");
  }, [user, initialized]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-black shadow-xl">
          <span className="text-3xl font-black text-white">
            LP
          </span>
        </div>

        <h1 className="mt-4 text-xl font-bold text-gray-900">
          Life OS
        </h1>
      </div>
    </main>
  );
}