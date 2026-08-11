"use client";

import { ReactNode, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";

import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth.store";

interface Props {
  children: ReactNode;
}

const PUBLIC_ROUTES = [
  "/login",
  "/register",
];

const isPublicRoute = (pathname: string) => {
  return PUBLIC_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );
};

export default function AuthProvider({
  children,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore(
    (state) => state.loading
  );

  const setUser = useAuthStore(
    (state) => state.setUser
  );

  const setLoading = useAuthStore(
    (state) => state.setLoading
  );

  /**
   * Firebase authentication listener
   */
  useEffect(() => {
    setLoading(true);

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [setUser, setLoading]);

  /**
   * Protect routes
   */
  useEffect(() => {
    if (loading) {
      return;
    }

    /**
     * User is NOT logged in
     *
     * Any protected URL:
     * /dashboard
     * /tasks
     * /habits
     * /goals
     * etc.
     *
     * → Login page
     */
    if (!user && !isPublicRoute(pathname)) {
      router.replace("/login");
      return;
    }

    /**
     * User is already logged in
     *
     * Don't allow logged-in user
     * to stay on Login/Register.
     */
    if (
      user &&
      isPublicRoute(pathname)
    ) {
      router.replace("/dashboard");
    }
  }, [
    user,
    loading,
    pathname,
    router,
  ]);

  /**
   * Firebase এখনো session check করছে।
   *
   * এই সময় Login page বা Dashboard
   * ভুল করে দেখানো হবে না।
   */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm font-medium text-slate-600">
            Checking your account...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}