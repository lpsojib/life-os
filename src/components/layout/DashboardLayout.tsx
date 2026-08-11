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
      {/* =========================
          Sidebar / Mobile Menu
          ========================= */}
      <Sidebar
        isOpen={menuOpen}
        onClose={closeMenu}
      />

      {/* =========================
          Main Area
          ========================= */}
      <div className="md:ml-64">
        {/* =========================
            Fixed Header
            ========================= */}
        <Header onMenuClick={openMenu} />

        {/* =========================
            Page Content
            ========================= */}
        <main className="pt-16">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}