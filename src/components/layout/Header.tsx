"use client";

import Image from "next/image";
import {
  Bell,
  Menu,
  Search,
} from "lucide-react";

import UserMenu from "./UserMenu";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({
  onMenuClick,
}: HeaderProps) {
  return (
    <header
      className="
        fixed
        left-0
        right-0
        top-0
        z-30
        flex
        h-16
        items-center
        justify-between
        border-b
        bg-white
        px-4
        md:left-64
        md:px-6
      "
    >
      {/* Left Side */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onMenuClick}
          className="
            rounded-lg
            p-2
            hover:bg-gray-100
            md:hidden
          "
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        <div className="flex items-center">
          <Image
            src="/logo.png"
            alt="Life OS"
            width={42}
            height={42}
            priority
            className="
              h-10
              w-10
              object-contain
            "
          />
        </div>
      </div>

      {/* Search */}
      <div
        className="
          hidden
          w-full
          max-w-md
          lg:block
        "
      >
        <div
          className="
            flex
            items-center
            rounded-lg
            border
            px-3
            py-2
          "
        >
          <Search
            size={18}
            className="text-gray-500"
          />

          <input
            type="text"
            placeholder="Search..."
            className="
              ml-2
              w-full
              bg-transparent
              outline-none
            "
          />
        </div>
      </div>

      {/* Right Side */}
      <div
        className="
          flex
          items-center
          gap-2
          md:gap-4
        "
      >
        {/* Notification */}
        <button
          type="button"
          className="
            relative
            rounded-lg
            p-2
            hover:bg-gray-100
          "
          aria-label="Notifications"
        >
          <Bell size={20} />

          <span
            className="
              absolute
              right-1
              top-1
              h-2
              w-2
              rounded-full
              bg-red-500
            "
          />
        </button>

        {/* User */}
        <UserMenu />
      </div>
    </header>
  );
}