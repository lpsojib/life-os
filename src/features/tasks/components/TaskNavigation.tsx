"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    name: "Daily",
    href: "/tasks",
    icon: "☀️",
  },
  {
    name: "Pending",
    href: "/tasks/pending",
    icon: "📅",
  },
  {
    name: "Completed",
    href: "/tasks/completed",
    icon: "✓",
  },
];

export default function TaskNavigation() {
  const pathname = usePathname();

  return (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const active =
            tab.href === "/tasks"
              ? pathname === "/tasks"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all sm:text-base ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}