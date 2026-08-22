"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const hasSession =
      localStorage.getItem(
        "life-os-authenticated"
      ) === "true";

    if (hasSession) {
      window.location.replace(
        "/dashboard"
      );
    } else {
      window.location.replace(
        "/login"
      );
    }
  }, []);

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