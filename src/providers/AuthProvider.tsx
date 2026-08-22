"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  initializeAuthListener,
  useAuthStore,
} from "@/store/auth.store";

interface Props {
  children: ReactNode;
}

const PUBLIC_ROUTES = [
  "/login",
  "/register",
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );
}

export default function AuthProvider({
  children,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore(
    (state) => state.user
  );

  const loading = useAuthStore(
    (state) => state.loading
  );

  const initialized = useAuthStore(
    (state) => state.initialized
  );

  /**
   * Firebase listener only once
   */
  useEffect(() => {
    initializeAuthListener();
  }, []);

  const publicRoute = isPublicRoute(pathname);

  /**
   * Authentication redirect
   */
  useEffect(() => {
    if (!initialized || loading) {
      return;
    }

    // User logged out → protected route
    if (!user && !publicRoute) {
      router.replace("/login");
      return;
    }

    // Already logged in → login/register
    if (user && publicRoute) {
      router.replace("/dashboard");
    }
  }, [
    user,
    loading,
    initialized,
    publicRoute,
    router,
  ]);

  /**
   * Splash screen
   *
   * Firebase auth initialize হওয়া পর্যন্ত
   * LP logo দেখাবে।
   */
  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">

          {/* LP Logo */}
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-black shadow-xl">
            <span className="text-3xl font-black tracking-tight text-white">
              LP
            </span>
          </div>

          <h1 className="mt-4 text-xl font-bold tracking-tight text-gray-900">
            Life OS
          </h1>

          <div className="mt-4 h-1 w-16 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-black" />
          </div>

        </div>
      </div>
    );
  }

  return <>{children}</>;
}