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

/* =========================================================
   PUBLIC ROUTES
   ========================================================= */

const PUBLIC_ROUTES = [
  "/login",
  "/register",
];

/* =========================================================
   CHECK PUBLIC ROUTE
   ========================================================= */

function isPublicRoute(
  pathname: string
): boolean {
  return PUBLIC_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(
        `${route}/`
      )
  );
}

/* =========================================================
   AUTH PROVIDER
   ========================================================= */

export default function AuthProvider({
  children,
}: Props) {
  const router = useRouter();

  const pathname =
    usePathname();

  const user =
    useAuthStore(
      (state) => state.user
    );

  const loading =
    useAuthStore(
      (state) => state.loading
    );

  const initialized =
    useAuthStore(
      (state) => state.initialized
    );

  /* =======================================================
     START FIREBASE AUTH LISTENER
     ======================================================= */

  useEffect(() => {
    initializeAuthListener();
  }, []);

  /* =======================================================
     ROUTE PROTECTION
     ======================================================= */

  useEffect(() => {
    /*
     * Firebase এখনো cached auth/session
     * check করছে।
     *
     * এই সময় কোনো redirect হবে না।
     */
    if (
      loading ||
      !initialized
    ) {
      return;
    }

    const publicRoute =
      isPublicRoute(pathname);

    /*
     * User logged in আছে।
     */
    if (user) {
      /*
       * Login/Register page থেকে
       * Dashboard-এ পাঠাবে।
       */
      if (publicRoute) {
        router.replace(
          "/dashboard"
        );
      }

      return;
    }

    /*
     * User নেই।
     *
     * Public page হলে থাকতে পারবে।
     */
    if (publicRoute) {
      return;
    }

    /*
     * Protected page + user নেই
     * => Login page।
     */
    router.replace("/login");
  }, [
    user,
    loading,
    initialized,
    pathname,
    router,
  ]);

  /*
   * IMPORTANT:
   *
   * Auth check চলাকালীন children block করছি না।
   *
   * তাই dashboard দ্রুত render হবে।
   */
  return <>{children}</>;
}