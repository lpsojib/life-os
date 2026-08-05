"use client";

import { Bell, Menu, Moon, Search } from "lucide-react";
import UserMenu from "./UserMenu";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-8">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        <button className="lg:hidden">
          <Menu size={24} />
        </button>

        <h2 className="text-xl font-semibold">
          Dashboard
        </h2>
      </div>

      {/* Center Search */}
      <div className="hidden w-full max-w-md lg:block">
        <div className="flex items-center rounded-lg border px-3 py-2">
          <Search size={18} className="text-gray-500" />

          <input
            type="text"
            placeholder="Search..."
            className="ml-2 w-full bg-transparent outline-none"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        <button className="rounded-lg p-2 hover:bg-gray-100">
          <Moon size={20} />
        </button>

        <button className="relative rounded-lg p-2 hover:bg-gray-100">
          <Bell size={20} />

          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
          U
        </div> */}
        <UserMenu />
      </div>
    </header>
  );
}