"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    /**
     * Service Worker registration
     * background-এ হবে।
     *
     * App startup block করবে না।
     */
    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
      })
      .then((registration) => {
        console.log(
          "Life OS Service Worker registered:",
          registration.scope
        );

        /**
         * Update check background-এ।
         *
         * await করা হচ্ছে না।
         */
        registration.update().catch(
          () => {}
        );
      })
      .catch((error) => {
        console.warn(
          "Life OS Service Worker:",
          error
        );
      });
  }, []);

  return null;
}