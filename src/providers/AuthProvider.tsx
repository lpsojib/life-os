"use client";

import {
  ReactNode,
  useEffect,
} from "react";

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

const AUTH_KEY =
  "life-os-authenticated";

function isPublicRoute(
  pathname: string
) {
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
   * Firebase listener background-এ শুরু হবে।
   */
  useEffect(() => {
    initializeAuthListener();
  }, []);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    /**
     * আগের login session আছে কি না।
     */
    const hasLocalSession =
      typeof window !== "undefined" &&
      localStorage.getItem(
        AUTH_KEY
      ) === "true";

    const publicRoute =
      isPublicRoute(pathname);

    /**
     * --------------------------------
     * 1. আগে login করা ছিল
     * --------------------------------
     *
     * Firebase user এখন null হলেও
     * redirect করব না।
     *
     * Explicit logout না করা পর্যন্ত
     * Dashboard-এ থাকতে পারবে।
     */
    if (hasLocalSession) {
      /**
       * Login/Register page-এ থাকলে
       * Dashboard-এ পাঠাও।
       */
      if (publicRoute) {
        router.replace("/dashboard");
      }

      return;
    }

    /**
     * --------------------------------
     * 2. Firebase user আছে
     * --------------------------------
     */
    if (user) {
      if (publicRoute) {
        router.replace("/dashboard");
      }

      return;
    }

    /**
     * --------------------------------
     * 3. Login session নেই
     * --------------------------------
     */
    if (!publicRoute) {
      router.replace("/login");
    }
  }, [
    user,
    initialized,
    pathname,
    router,
  ]);

  /**
   * IMPORTANT:
   *
   * Firebase loading-এর জন্য
   * পুরো UI block করা হচ্ছে না।
   */
  return <>{children}</>;
}