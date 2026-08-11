"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuthStore } from "@/store/auth.store";

interface AppShellProps {
  children: ReactNode;
}

const publicRoutes = ["/login", "/register"];

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { user, loading } = useAuthStore();

  const [menuOpen, setMenuOpen] = useState(false);

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (loading) return;

    // Not logged in → protected page থেকে Login
    if (!user && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    // Logged in অবস্থায় Login/Register এ গেলে Dashboard
    if (user && isPublicRoute) {
      router.replace("/dashboard");
    }
  }, [
    user,
    loading,
    isPublicRoute,
    router,
  ]);

  // Login/Register page-এ Header + Sidebar থাকবে না
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Firebase auth check হওয়া পর্যন্ত অপেক্ষা
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  // User না থাকলে redirect হবে
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Overlay + Sidebar */}
      <Sidebar
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      {/* Main Area */}
      <div className="md:ml-64">
        {/* Fixed Header */}
        <Header
          onMenuClick={() => setMenuOpen(true)}
        />

        {/* Page Content */}
        <main className="pt-16">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}