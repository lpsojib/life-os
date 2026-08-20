"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

interface FocusItem {
  id: string;
  title: string;
  createdAt: number;
  startedAt: number | null;
  elapsed: number;
  running: boolean;
}

interface TimeBreakdown {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const STORAGE_KEY = "life-os-focus";

const getElapsedMs = (item: FocusItem, now: number): number => {
  if (item.running && item.startedAt) {
    return item.elapsed + (now - item.startedAt);
  }

  return item.elapsed;
};

const getBreakdown = (milliseconds: number): TimeBreakdown => {
  let totalSeconds = Math.floor(milliseconds / 1000);

  const years = Math.floor(totalSeconds / (365 * 24 * 60 * 60));
  totalSeconds -= years * 365 * 24 * 60 * 60;

  const months = Math.floor(totalSeconds / (30 * 24 * 60 * 60));
  totalSeconds -= months * 30 * 24 * 60 * 60;

  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  totalSeconds -= days * 24 * 60 * 60;

  const hours = Math.floor(totalSeconds / (60 * 60));
  totalSeconds -= hours * 60 * 60;

  const minutes = Math.floor(totalSeconds / 60);
  totalSeconds -= minutes * 60;

  const seconds = totalSeconds;

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
  };
};

const pad = (value: number): string => {
  return String(value).padStart(2, "0");
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("bn-BD").format(value);
};

const createId = (): string => {
  return `focus-${crypto.randomUUID()}`;
};

export default function FocusPage() {
  const [items, setItems] = useState<FocusItem[]>([]);
  const [now, setNow] = useState<number>(0);
  const [hydrated, setHydrated] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");

  /*
   * Initial browser load.
   *
   * State update is moved into a timeout so React's
   * cascading-render lint rule does not complain.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);

        if (saved) {
          const parsed: unknown = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            const validItems = parsed.filter(
              (item): item is FocusItem => {
                if (!item || typeof item !== "object") {
                  return false;
                }

                const value = item as Record<string, unknown>;

                return (
                  typeof value.id === "string" &&
                  typeof value.title === "string" &&
                  typeof value.createdAt === "number" &&
                  typeof value.elapsed === "number" &&
                  typeof value.running === "boolean"
                );
              }
            );

            setItems(validItems);
          }
        }
      } catch (error) {
        console.error("Failed to load focus data:", error);
      }

      setNow(performance.timeOrigin + performance.now());
      setHydrated(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /*
   * Timer.
   *
   * performance.now() avoids using Date.now() inside
   * the state update logic.
   */
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(performance.timeOrigin + performance.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [hydrated]);

  /*
   * Save whenever items change.
   */
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error("Failed to save focus data:", error);
    }
  }, [items, hydrated]);

  const runningCount = useMemo(() => {
    return items.filter((item) => item.running).length;
  }, [items]);

  const sortedItems = useMemo(() => {
    return [...items].sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }, [items]);

  const handleAdd = useCallback(() => {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      return;
    }

    const createdAt =
      performance.timeOrigin + performance.now();

    const newItem: FocusItem = {
      id: createId(),
      title: cleanTitle,
      createdAt,
      startedAt: null,
      elapsed: 0,
      running: false,
    };

    setItems((current) => [newItem, ...current]);

    setTitle("");
    setShowAdd(false);
  }, [title]);

  const handleStartPause = useCallback(
    (id: string) => {
      const currentTime =
        performance.timeOrigin + performance.now();

      setItems((current) =>
        current.map((item) => {
          if (item.id !== id) {
            return item;
          }

          if (item.running && item.startedAt) {
            const currentElapsed =
              item.elapsed +
              (currentTime - item.startedAt);

            return {
              ...item,
              elapsed: currentElapsed,
              startedAt: null,
              running: false,
            };
          }

          return {
            ...item,
            startedAt: currentTime,
            running: true,
          };
        })
      );
    },
    []
  );

  const handleReset = useCallback((id: string) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          elapsed: 0,
          startedAt: null,
          running: false,
        };
      })
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setItems((current) =>
      current.filter((item) => item.id !== id)
    );
  }, []);

  const handleCancelAdd = useCallback(() => {
    setTitle("");
    setShowAdd(false);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        handleAdd();
      }

      if (event.key === "Escape") {
        handleCancelAdd();
      }
    },
    [handleAdd, handleCancelAdd]
  );

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-white px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-100" />

          <div className="mt-6 h-28 animate-pulse rounded-2xl bg-gray-100" />

          <div className="mt-4 h-28 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-[#2A2318] sm:px-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#D9A441]">
              <Clock3
                size={21}
                className="text-[#D9A441]"
              />

              <span className="absolute h-1.5 w-1.5 rounded-full bg-[#D9A441]" />
            </div>

            <div>
              <h1 className="text-xl font-bold">
                ফোকাস টাইমার
              </h1>

              <p className="mt-0.5 text-xs text-gray-500">
                {items.length === 0
                  ? "এখনো কোনো ফোকাস যোগ করা হয়নি"
                  : `${formatNumber(
                      items.length
                    )}টি ফোকাস • ${formatNumber(
                      runningCount
                    )}টি চলছে`}
              </p>
            </div>
          </div>

          {/* Add */}
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex shrink-0 items-center gap-2 rounded-full bg-[#D9A441] px-4 py-2.5 text-sm font-semibold text-[#1A1408] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Plus size={17} />

            <span className="hidden sm:inline">
              নতুন ফোকাস
            </span>
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:flex-row">
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              onKeyDown={handleKeyDown}
              maxLength={60}
              placeholder="যেমন: বই পড়া, কোডিং, পড়াশোনা..."
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#D9A441]"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 rounded-xl bg-[#7FA88F] px-5 py-3 text-sm font-semibold text-[#0F1A14] transition hover:opacity-90 sm:flex-none"
              >
                যোগ করুন
              </button>

              <button
                type="button"
                onClick={handleCancelAdd}
                className="flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-gray-500 transition hover:bg-gray-50"
                aria-label="বাতিল"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-20 text-center">
            <Clock3
              size={52}
              strokeWidth={1.4}
              className="mx-auto text-gray-300"
            />

            <h2 className="mt-4 text-lg font-semibold">
              এখনো কোনো ফোকাস নেই
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              নতুন ফোকাস বাটনে ক্লিক করে শুরু করুন
            </p>
          </div>
        )}

        {/* Focus cards */}
        <div className="flex flex-col gap-4">
          {sortedItems.map((item) => {
            const elapsed = getElapsedMs(item, now);
            const time = getBreakdown(elapsed);

            const circumference = 2 * Math.PI * 14;

            const progress =
              (time.seconds / 60) *
              circumference;

            const offset =
              circumference - progress;

            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition ${
                  item.running
                    ? "border-[#D9A441]/50 shadow-[#D9A441]/10"
                    : "border-gray-100"
                }`}
              >
                {/* Card top */}
                <div className="mb-4 flex items-start gap-3">
                  {/* Ring */}
                  <div className="relative h-9 w-9 shrink-0">
                    <svg
                      viewBox="0 0 34 34"
                      className="-rotate-90"
                    >
                      <circle
                        cx="17"
                        cy="17"
                        r="14"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="3"
                      />

                      <circle
                        cx="17"
                        cy="17"
                        r="14"
                        fill="none"
                        stroke="#D9A441"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={
                          circumference
                        }
                        strokeDashoffset={
                          item.running
                            ? offset
                            : circumference
                        }
                      />
                    </svg>

                    <span
                      className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                        item.running
                          ? "animate-pulse bg-[#D9A441]"
                          : "bg-[#7FA88F]"
                      }`}
                    />
                  </div>

                  {/* Title */}
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-base font-semibold text-[#2A2318]">
                      {item.title}
                    </h2>

                    <div
                      className={`mt-1 flex items-center gap-1.5 text-xs ${
                        item.running
                          ? "text-[#D9A441]"
                          : "text-gray-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          item.running
                            ? "bg-[#D9A441]"
                            : "bg-gray-400"
                        }`}
                      />

                      {item.running
                        ? "চলছে"
                        : "থেমে আছে"}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(item.id)
                    }
                    className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    aria-label="ফোকাস মুছে ফেলুন"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                {/* Time */}
                <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  <TimeChip
                    value={time.years}
                    label="বছর"
                    numeric={false}
                  />

                  <TimeChip
                    value={time.months}
                    label="মাস"
                    numeric={false}
                  />

                  <TimeChip
                    value={time.days}
                    label="দিন"
                    numeric={false}
                  />

                  <TimeChip
                    value={time.hours}
                    label="ঘণ্টা"
                    numeric
                  />

                  <TimeChip
                    value={time.minutes}
                    label="মিনিট"
                    numeric
                  />

                  <TimeChip
                    value={time.seconds}
                    label="সেকেন্ড"
                    numeric
                    active={item.running}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleStartPause(item.id)
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      item.running
                        ? "border border-[#D9A441]/40 bg-[#D9A441]/10 text-[#B4842A]"
                        : "bg-[#D9A441] text-[#1A1408] hover:opacity-90"
                    }`}
                  >
                    {item.running ? (
                      <>
                        <Pause size={16} />
                        থামান
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        শুরু করুন
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleReset(item.id)
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-500 transition hover:border-[#7FA88F] hover:text-[#2A6459]"
                  >
                    <RotateCcw size={16} />
                    রিসেট
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

interface TimeChipProps {
  value: number;
  label: string;
  numeric: boolean;
  active?: boolean;
}

function TimeChip({
  value,
  label,
  numeric,
  active = false,
}: TimeChipProps) {
  return (
    <div
      className={`rounded-xl bg-gray-50 px-2 py-2 text-center ${
        value === 0 ? "opacity-50" : ""
      }`}
    >
      <span
        className={`block font-mono text-sm font-semibold sm:text-base ${
          active
            ? "text-[#D9A441]"
            : "text-[#2A2318]"
        }`}
      >
        {numeric ? pad(value) : value}
      </span>

      <span className="mt-0.5 block text-[10px] text-gray-500">
        {label}
      </span>
    </div>
  );
}