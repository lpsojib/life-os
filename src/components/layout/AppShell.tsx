"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";

import Sidebar from "./Sidebar";
import Header from "./Header";

interface AppShellProps {
  children: ReactNode;
}

const PUBLIC_ROUTES = [
  "/login",
  "/register",
];

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  // Login/Register → শুধু page
  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <Sidebar
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="md:ml-64">

        <Header
          onMenuClick={() => setMenuOpen(true)}
        />

        <main className="pt-16">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}