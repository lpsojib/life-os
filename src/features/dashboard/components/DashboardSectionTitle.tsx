"use client";

import type { LucideIcon } from "lucide-react";

interface DashboardSectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
}

export default function DashboardSectionTitle({
  title,
  subtitle,
  icon: Icon,
}: DashboardSectionTitleProps) {
  return (
    <div className="flex items-start gap-2 mb-4">
      {Icon && (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "#E3EFEA",
          }}
        >
          <Icon
            size={15}
            color="#2A6459"
            strokeWidth={2.2}
          />
        </div>
      )}

      <div>
        <h2
          style={{
            fontFamily:
              "'Noto Serif Bengali', serif",
            fontWeight: 700,
            fontSize: "16px",
            color: "#2A2318",
          }}
        >
          {title}
        </h2>

        {subtitle && (
          <p
            className="text-xs mt-0.5"
            style={{
              color: "#B5AB98",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}