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
        h-16
        border-b
        border-gray-100
        bg-white
        shadow-sm
        md:left-64
      "
    >
      {/* Left Side */}
      <div
        className="
          absolute
          left-0
          top-0
          flex
          h-16
          items-center
          px-4
          md:px-6
        "
      >
        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onMenuClick}
          className="
            rounded-lg
            p-2
            text-gray-700
            transition
            hover:bg-gray-100
            md:hidden
          "
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {/* Desktop Search */}
        <div
          className="
            hidden
            items-center
            rounded-xl
            border
            border-gray-200
            bg-gray-50
            px-3
            py-2
            lg:flex
            md:w-56
            xl:w-64
          "
        >
          <Search
            size={17}
            className="text-gray-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="
              ml-2
              w-full
              bg-transparent
              text-sm
              text-gray-700
              outline-none
              placeholder:text-gray-400
            "
          />
        </div>
      </div>

      {/* Center Logo */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          flex
          -translate-x-1/2
          -translate-y-1/2
          items-center
          justify-center
        "
      >
        {/* Logo size is bigger,
            header height remains h-16 */}
        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            bg-transparent
          "
        >
          <Image
            src="/logo.png"
            alt="Life OS"
            width={66}
            height={66}
            priority
            className="
              h-20
              w-20
              object-contain
            "
          />
        </div>
      </div>

      {/* Right Side */}
      <div
        className="
          absolute
          right-0
          top-0
          flex
          h-16
          items-center
          gap-2
          px-4
          md:gap-4
          md:px-6
        "
      >
        {/* Notification */}
        <button
          type="button"
          className="
            relative
            rounded-xl
            p-2
            text-gray-600
            transition
            hover:bg-gray-100
            hover:text-gray-900
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