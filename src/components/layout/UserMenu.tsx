"use client";

import { useRouter } from "next/navigation";
import { logoutUser } from "@/features/auth/services/auth.service";

const AUTH_KEY = "life-os-authenticated";

export default function UserMenu() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Firebase থেকে logout
      await logoutUser();

      // Local authentication session remove
      localStorage.removeItem(AUTH_KEY);

      // Login page-এ পাঠাও
      router.replace("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
    >
      Logout
    </button>
  );
}

