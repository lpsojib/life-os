"use client";

import { ReactNode, useEffect } from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

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

  const initialized = useAuthStore(
    (state) => state.initialized
  );

  /**
   * Firebase listener background-এ চলবে।
   * App startup আটকে রাখবে না।
   */
  useEffect(() => {
    initializeAuthListener();
  }, []);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    const publicRoute =
      isPublicRoute(pathname);

    /**
     * আগে login করা user-এর local session
     */
    const hasLocalSession =
      typeof window !== "undefined" &&
      localStorage.getItem(
        "life-os-authenticated"
      ) === "true";

    /**
     * Logged in
     */
    if (user && publicRoute) {
      router.replace("/dashboard");
      return;
    }

    /**
     * Offline কিন্তু আগে login করা ছিল
     *
     * Firebase-এর user object এখনো না থাকলেও
     * Dashboard থেকে বের করব না।
     */
    if (
      !user &&
      hasLocalSession &&
      !navigator.onLine
    ) {
      return;
    }

    /**
     * সত্যিই logged out
     */
    if (
      !user &&
      !hasLocalSession &&
      !publicRoute
    ) {
      router.replace("/login");
    }
  }, [
    user,
    initialized,
    pathname,
    router,
  ]);

  /**
   * এখানে আর loading screen নেই।
   *
   * Firebase-এর জন্য app আটকে থাকবে না।
   */
  return <>{children}</>;
}