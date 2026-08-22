"use client";

import {
  ReactNode,
  useEffect,
  useState,
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
   * Local cached login state।
   *
   * App open হওয়ার সময় এটা Firebase-এর
   * জন্য অপেক্ষা করবে না।
   */
  const [hasLocalSession, setHasLocalSession] =
    useState(false);

  const [offline, setOffline] =
    useState(false);

  /**
   * Browser-এর local login session
   * immediately read করি।
   */
  useEffect(() => {
    const checkSession = () => {
      const saved =
        localStorage.getItem(AUTH_KEY) ===
        "true";

      setHasLocalSession(saved);
      setOffline(!navigator.onLine);
    };

    checkSession();

    const handleOnline = () => {
      setOffline(false);
    };

    const handleOffline = () => {
      setOffline(true);
    };

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );
    };
  }, []);

  /**
   * Firebase listener।
   *
   * এটা background-এ চলবে।
   */
  useEffect(() => {
    initializeAuthListener();
  }, []);

  const publicRoute =
    isPublicRoute(pathname);

  /**
   * Local session থাকলে offline অবস্থায়
   * protected page থেকে Login-এ পাঠাব না।
   */
  const locallyAuthenticated =
    hasLocalSession && offline;

  useEffect(() => {
    /**
     * Firebase initialization-এর জন্য
     * আর পুরো app block করব না।
     */
    if (!initialized || loading) {
      return;
    }

    /**
     * Offline + previous login
     *
     * → current page-এ থাকতে দাও।
     */
    if (
      locallyAuthenticated &&
      !publicRoute
    ) {
      return;
    }

    /**
     * Firebase user আছে
     * → Login/Register থেকে Dashboard
     */
    if (user && publicRoute) {
      router.replace("/dashboard");
      return;
    }

    /**
     * Firebase user নেই + local session নেই
     * → protected page থেকে Login
     */
    if (
      !user &&
      !locallyAuthenticated &&
      !publicRoute
    ) {
      router.replace("/login");
      return;
    }

    /**
     * Logged-in user login page-এ গেলে
     * Dashboard।
     */
    if (
      user &&
      publicRoute
    ) {
      router.replace("/dashboard");
    }
  }, [
    user,
    loading,
    initialized,
    publicRoute,
    locallyAuthenticated,
    router,
  ]);

  /**
   * আর Firebase auth-এর জন্য
   * Logo দেখিয়ে অনেকক্ষণ অপেক্ষা করব না।
   *
   * App immediately render হবে।
   */
  return <>{children}</>;
}