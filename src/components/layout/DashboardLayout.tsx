"use client";

import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
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

        {/* Content */}
        <main className="pt-16">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}