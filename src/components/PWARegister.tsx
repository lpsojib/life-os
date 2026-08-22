"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let mounted = true;

    const register = async () => {
      try {
        const registration =
          await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            }
          );

        if (!mounted) {
          return;
        }

        console.log(
          "Life OS Service Worker registered:",
          registration.scope
        );

        /**
         * নতুন Service Worker থাকলে update check
         */
        await registration.update();

        /**
         * Service Worker ready হওয়ার জন্য অপেক্ষা
         */
        await navigator.serviceWorker.ready;

        console.log(
          "Life OS Service Worker ready"
        );
      } catch (error) {
        console.error(
          "Life OS Service Worker error:",
          error
        );
      }
    };

    register();

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}