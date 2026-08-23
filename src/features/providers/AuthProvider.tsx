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

/* =========================================================
   PROPS
========================================================= */

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
     INITIALIZE AUTH
  ======================================================= */

  useEffect(() => {
    initializeAuthListener();
  }, []);

  /* =======================================================
     ROUTE PROTECTION
  ======================================================= */

  useEffect(() => {
    /*
     * Firebase এখনো user check করছে।
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

    /* =====================================================
       USER LOGGED IN
    ===================================================== */

    if (user) {
      /*
       * Logged-in user login/register
       * page-এ থাকলে dashboard-এ পাঠাবো।
       */
      if (publicRoute) {
        router.replace(
          "/dashboard"
        );
      }

      return;
    }

    /* =====================================================
       USER NOT LOGGED IN
    ===================================================== */

    /*
     * Public page হলে থাকতে পারবে।
     */
    if (publicRoute) {
      return;
    }

    /*
     * Protected page + no user
     * => Login
     */
    router.replace("/login");
  }, [
    user,
    loading,
    initialized,
    pathname,
    router,
  ]);

  /* =======================================================
     AUTH INITIALIZATION SCREEN
  ======================================================= */

  /*
   * সবচেয়ে গুরুত্বপূর্ণ change:
   *
   * Firebase Auth ready হওয়ার আগে
   * dashboard render হবে না।
   *
   * তাই refresh-এর সময়
   * auth.currentUser = null দেখে
   * getTasks()/getHabits()/getGoals()
   * ভুলভাবে execute করবে না।
   */

  if (
    loading ||
    !initialized
  ) {
    return (
      <div
        className="
          min-h-screen
          flex
          items-center
          justify-center
        "
        style={{
          background:
            "#FAF5EA",
        }}
      >
        <div
          className="
            flex
            flex-col
            items-center
            gap-3
          "
        >
          <div
            className="
              w-9
              h-9
              rounded-full
              border-2
              animate-spin
            "
            style={{
              borderColor:
                "#E9E0CC",

              borderTopColor:
                "#2A6459",
            }}
          />

          <span
            className="text-sm"
            style={{
              color:
                "#8D8271",
            }}
          >
            Life OS লোড হচ্ছে...
          </span>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return <>{children}</>;
}