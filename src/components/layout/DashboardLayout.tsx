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
  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = () => {
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar / Mobile Menu */}
      <Sidebar
        isOpen={menuOpen}
        onClose={closeMenu}
      />

      {/* Main Area */}
      <div className="md:ml-64">
        {/* Fixed Header */}
        <Header onMenuClick={openMenu} />

        {/* Page Content */}
        <main className="pt-16">
          <div className="px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}