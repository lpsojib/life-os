"use client";

import { Leaf, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const COLORS = {
  paper: "#FAF5EA",
  ink: "#2A2318",
  mutedSoft: "#B5AB98",
  teal: "#2A6459",
};

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return "শুভ সকাল";
  }

  if (hour >= 12 && hour < 17) {
    return "শুভ দুপুর";
  }

  if (hour >= 17 && hour < 20) {
    return "শুভ সন্ধ্যা";
  }

  return "শুভ রাত্রি";
}

function toBanglaNumber(value: number): string {
  const numbers = [
    "০",
    "১",
    "২",
    "৩",
    "৪",
    "৫",
    "৬",
    "৭",
    "৮",
    "৯",
  ];

  return String(value)
    .split("")
    .map((digit) => numbers[Number(digit)] ?? digit)
    .join("");
}

function getBanglaDate(date: Date): string {
  const weekdays = [
    "রবিবার",
    "সোমবার",
    "মঙ্গলবার",
    "বুধবার",
    "বৃহস্পতিবার",
    "শুক্রবার",
    "শনিবার",
  ];

  const months = [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
  ];

  return `${toBanglaNumber(date.getDate())} ${
    months[date.getMonth()]
  }, ${toBanglaNumber(
    date.getFullYear()
  )} · ${weekdays[date.getDay()]}`;
}

export default function DashboardHeader() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateTime = () => {
      setNow(new Date());
    };

    updateTime();

    const interval = window.setInterval(
      updateTime,
      60 * 1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const greeting = now
    ? getGreeting(now.getHours())
    : "শুভ সকাল";

  const dateText = now
    ? getBanglaDate(now)
    : "";

  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <div
          className="flex items-center gap-1.5"
          style={{
            color: COLORS.mutedSoft,
          }}
        >
          <Sun size={13} />

          <span
            className="text-xs"
            style={{
              fontFamily:
                "'IBM Plex Mono', monospace",
            }}
          >
            {dateText}
          </span>
        </div>

        <h1
          style={{
            fontFamily:
              "'Noto Serif Bengali', serif",
            fontWeight: 700,
            fontSize: "24px",
            color: COLORS.ink,
            marginTop: "2px",
          }}
        >
          {greeting}
        </h1>
      </div>

      <button
        type="button"
        aria-label="Dashboard action"
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: COLORS.teal,
          flexShrink: 0,
        }}
      >
        <Leaf
          size={19}
          color={COLORS.paper}
        />
      </button>
    </div>
  );
}