"use client";

import { Bell, Menu, Moon, Search } from "lucide-react";
import UserMenu from "./UserMenu";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({
  onMenuClick,
}: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      {/* Left Side */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-gray-100 md:hidden"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        <h2 className="text-xl font-semibold text-gray-900">
          Dashboard
        </h2>
      </div>

      {/* Search */}
      <div className="hidden w-full max-w-md lg:block">
        <div className="flex items-center rounded-lg border px-3 py-2">
          <Search
            size={18}
            className="text-gray-500"
          />

          <input
            type="text"
            placeholder="Search..."
            className="ml-2 w-full bg-transparent outline-none"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Dark Mode */}
        <button
          type="button"
          className="rounded-lg p-2 hover:bg-gray-100"
          aria-label="Toggle dark mode"
        >
          <Moon size={20} />
        </button>

        {/* Notification */}
        <button
          type="button"
          className="relative rounded-lg p-2 hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell size={20} />

          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}