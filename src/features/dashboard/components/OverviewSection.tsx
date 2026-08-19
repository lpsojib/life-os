"use client";

import {
  CheckSquare,
  Flame,
  Target,
  TrendingUp,
} from "lucide-react";

import DashboardCard from "./DashboardCard";
import DashboardSectionTitle from "./DashboardSectionTitle";

interface OverviewCardProps {
  icon: typeof CheckSquare;
  label: string;
  foreground: string;
  background: string;
}

function OverviewCard({
  icon: Icon,
  label,
  foreground,
  background,
}: OverviewCardProps) {
  return (
    <div
      className="rounded-2xl p-3.5 flex flex-col gap-2.5"
      style={{
        background,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          background: "#FFFFFF",
        }}
      >
        <Icon
          size={15}
          color={foreground}
          strokeWidth={2.2}
        />
      </div>

      <div>
        <div
          style={{
            fontFamily:
              "'IBM Plex Mono', monospace",
            fontSize: "18px",
            fontWeight: 600,
            color: foreground,
          }}
        >
          —
        </div>

        <div
          className="text-xs mt-0.5"
          style={{
            color: "#2A2318",
            fontWeight: 500,
            opacity: 0.75,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

export default function OverviewSection() {
  return (
    <DashboardCard>
      <DashboardSectionTitle title="ওভারভিউ" />

      <div className="grid grid-cols-2 gap-3">
        <OverviewCard
          icon={CheckSquare}
          label="আজকের টাস্ক"
          foreground="#2A6459"
          background="#E3EFEA"
        />

        <OverviewCard
          icon={Flame}
          label="অভ্যাস"
          foreground="#B4842A"
          background="#F5EACB"
        />

        <OverviewCard
          icon={Target}
          label="সক্রিয় লক্ষ্য"
          foreground="#7C4F6E"
          background="#F0E3EC"
        />

        <OverviewCard
          icon={TrendingUp}
          label="সম্পন্নতা"
          foreground="#B15A38"
          background="#F6E4D8"
        />
      </div>
    </DashboardCard>
  );
}