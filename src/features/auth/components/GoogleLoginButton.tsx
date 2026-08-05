"use client";

import { useRouter } from "next/navigation";
import { loginWithGoogle } from "../services/auth.service";

export default function GoogleLoginButton() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();

      router.push("/dashboard");
    } catch (error) {
      console.error(error);

      alert("Google Login Failed");
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full rounded-lg border p-3 font-semibold transition hover:bg-gray-100"
    >
      Continue with Google
    </button>
  );
}