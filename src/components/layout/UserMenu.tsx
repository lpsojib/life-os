"use client";

import { useRouter } from "next/navigation";
import { logoutUser } from "@/features/auth/services/auth.service";

export default function UserMenu() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutUser();

      router.replace("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
    >
      Logout
    </button>
  );
}