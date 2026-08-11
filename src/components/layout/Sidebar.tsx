"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  CheckSquare,
  Flame,
  Target,
  BookOpen,
  Timer,
  Wallet,
  Bell,
  Info,
  Bot,
  Settings,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Habits",
    href: "/habits",
    icon: Flame,
  },
  {
    title: "Goals",
    href: "/goals",
    icon: Target,
  },
  {
    title: "Journal",
    href: "/journal",
    icon: BookOpen,
  },
  {
    title: "Focus",
    href: "/focus",
    icon: Timer,
  },
  {
    title: "Finance",
    href: "/finance",
    icon: Wallet,
  },
  {
    title: "Reminder",
    href: "/reminder",
    icon: Bell,
  },
  {
    title: "About",
    href: "/about",
    icon: Info,
  },
  {
    title: "AI",
    href: "/ai",
    icon: Bot,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* =========================
          Mobile Overlay
          ========================= */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* =========================
          Sidebar
          ========================= */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-in-out md:shadow-none ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* =========================
            Logo / Header
            ========================= */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-5">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="text-xl font-bold text-blue-600"
          >
            Life OS
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 md:hidden"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* =========================
            Navigation
            ========================= */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Icon
                      size={20}
                      strokeWidth={2}
                    />

                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
