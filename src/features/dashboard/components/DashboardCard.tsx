"use client";

import { ReactNode } from "react";

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
}

export default function DashboardCard({
  children,
  className = "",
}: DashboardCardProps) {
  return (
    <div
      className={`rounded-3xl p-5 ${className}`}
      style={{
        background: "#FFFFFF",
        border: "1px solid #E9E0CC",
        boxShadow:
          "0 2px 14px rgba(42,35,24,0.05)",
      }}
    >
      {children}
    </div>
  );
}