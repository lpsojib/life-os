"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("Life OS Service Worker registered");
      } catch (error) {
        console.error(
          "Life OS Service Worker registration failed:",
          error
        );
      }
    };

    registerServiceWorker();
  }, []);

  return null;
}