"use client";

import { useSyncExternalStore, useState } from "react";

type NotificationStatus =
  | "default"
  | "granted"
  | "denied"
  | "unsupported"
  | "loading";

function getNotificationPermission(): NotificationStatus {
  if (typeof window === "undefined") {
    return "loading";
  }

  if (!("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

function subscribeToNotificationPermission() {
  return () => {};
}

function getServerNotificationPermission(): NotificationStatus {
  return "loading";
}

export default function NotificationPermission() {
  const permission = useSyncExternalStore(
    subscribeToNotificationPermission,
    getNotificationPermission,
    getServerNotificationPermission
  );

  const [isRequesting, setIsRequesting] = useState(false);

  const requestPermission = async () => {
    if (typeof window === "undefined") {
      return;
    }

    if (!("Notification" in window)) {
      return;
    }

    try {
      setIsRequesting(true);

      const result = await Notification.requestPermission();

      // Browser permission changed.
      // Force a small state update so the component re-renders.
      if (result !== permission) {
        window.dispatchEvent(new Event("notification-permission-change"));
      }
    } catch (error) {
      console.error("Notification permission error:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  if (permission === "loading") {
    return null;
  }

  if (permission === "unsupported") {
    return (
      <div className="rounded-xl bg-yellow-50 p-4">
        <p className="text-sm font-medium text-yellow-700">
          এই ব্রাউজারে Notification সাপোর্ট করে না।
        </p>
      </div>
    );
  }

  if (permission === "granted") {
    return (
      <div className="rounded-xl bg-green-50 p-4">
        <p className="font-medium text-green-700">
          ✓ Notification চালু আছে
        </p>

        <p className="mt-1 text-sm text-green-600">
          Habit-এর নির্দিষ্ট সময়ে notification দেওয়া যাবে।
        </p>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="rounded-xl bg-red-50 p-4">
        <p className="font-medium text-red-700">
          Notification বন্ধ আছে
        </p>

        <p className="mt-1 text-sm text-red-600">
          Browser settings থেকে Notification অনুমতি চালু করুন।
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-blue-50 p-4">
      <p className="font-medium text-blue-700">
        Habit Notification
      </p>

      <p className="mt-1 text-sm text-gray-500">
        Habit-এর সময় হলে মনে করিয়ে দিতে Notification চালু করুন।
      </p>

      <button
        type="button"
        onClick={requestPermission}
        disabled={isRequesting}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRequesting
          ? "অনুমতি নেওয়া হচ্ছে..."
          : "Notification চালু করুন"}
      </button>
    </div>
  );
}