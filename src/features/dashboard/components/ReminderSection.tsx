"use client";

import { useState } from "react";
import {
  Bell,
  Plus,
  Trash2,
} from "lucide-react";

import DashboardCard from "./DashboardCard";
import DashboardSectionTitle from "./DashboardSectionTitle";

interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
}

const initialReminders: Reminder[] = [];

export default function ReminderSection() {
  const [reminders, setReminders] =
    useState<Reminder[]>(initialReminders);

  const [title, setTitle] =
    useState("");

  const [date, setDate] =
    useState("");

  const [time, setTime] =
    useState("");

  const addReminder = () => {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      return;
    }

    const reminder: Reminder = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      date: date.trim() || "শীঘ্রই",
      time: time.trim(),
    };

    setReminders((current) => [
      ...current,
      reminder,
    ]);

    setTitle("");
    setDate("");
    setTime("");
  };

  const deleteReminder = (id: string) => {
    setReminders((current) =>
      current.filter(
        (reminder) =>
          reminder.id !== id
      )
    );
  };

  return (
    <DashboardCard>
      <DashboardSectionTitle
        icon={Bell}
        title="রিমাইন্ডার"
        subtitle={`${reminders.length}টি আসন্ন রিমাইন্ডার`}
      />

      {/* Add reminder */}
      <div className="flex flex-col gap-2 mb-4">
        <input
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              addReminder();
            }
          }}
          placeholder="নতুন রিমাইন্ডার লিখো..."
          className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none"
          style={{
            background: "#FAF5EA",
            border: "1px solid #E9E0CC",
            color: "#2A2318",
          }}
        />

        <div className="flex gap-2">
          <input
            type="text"
            value={date}
            onChange={(event) =>
              setDate(event.target.value)
            }
            placeholder="তারিখ"
            className="flex-1 min-w-0 text-sm px-3.5 py-2.5 rounded-xl outline-none"
            style={{
              background: "#FAF5EA",
              border: "1px solid #E9E0CC",
              color: "#2A2318",
            }}
          />

          <input
            type="text"
            value={time}
            onChange={(event) =>
              setTime(event.target.value)
            }
            placeholder="সময়"
            className="flex-1 min-w-0 text-sm px-3.5 py-2.5 rounded-xl outline-none"
            style={{
              background: "#FAF5EA",
              border: "1px solid #E9E0CC",
              color: "#2A2318",
            }}
          />

          <button
            type="button"
            onClick={addReminder}
            aria-label="Add reminder"
            className="w-11 h-11 flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              background: "#FAF5EA",
              color: "#7C4F6E",
              border:
                "1px solid #E9E0CC",
            }}
          >
            <Plus
              size={17}
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {reminders.length === 0 && (
        <div
          className="text-sm text-center py-5"
          style={{
            color: "#B5AB98",
          }}
        >
          এখনো কোনো রিমাইন্ডার নেই।
        </div>
      )}

      {/* Reminder list */}
      {reminders.length > 0 && (
        <div className="flex flex-col gap-2">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
              style={{
                background: "#FAF5EA",
                border:
                  "1px solid #E9E0CC",
              }}
            >
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "#F0E3EC",
                }}
              >
                <Bell
                  size={13}
                  color="#7C4F6E"
                />
              </div>

              {/* Title */}
              <span
                className="text-sm flex-1 min-w-0"
                style={{
                  color: "#2A2318",
                  overflowWrap:
                    "anywhere",
                }}
              >
                {reminder.title}
              </span>

              {/* Date / time */}
              <div className="text-right flex-shrink-0">
                <div
                  style={{
                    fontFamily:
                      "'IBM Plex Mono', monospace",
                    fontSize: "11px",
                    color: "#7C4F6E",
                    fontWeight: 600,
                  }}
                >
                  {reminder.date}
                </div>

                {reminder.time && (
                  <div
                    style={{
                      fontFamily:
                        "'IBM Plex Mono', monospace",
                      fontSize: "10px",
                      color: "#B5AB98",
                    }}
                  >
                    {reminder.time}
                  </div>
                )}
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() =>
                  deleteReminder(
                    reminder.id
                  )
                }
                aria-label="Delete reminder"
                className="flex-shrink-0"
                style={{
                  color: "#B5AB98",
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}