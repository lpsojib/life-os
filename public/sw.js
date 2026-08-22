const CACHE_NAME = "life-os-v1";

const APP_SHELL = [
  "/",
  "/login",
  "/dashboard",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

/**
 * Navigation request
 *
 * Online → Vercel থেকে নতুন page
 * Offline → cached page
 */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy);
          });

          return response;
        })
        .catch(() => {
          return caches.match("/dashboard").then((cached) => {
            return (
              cached ||
              caches.match("/") ||
              new Response(
                "Life OS is currently offline.",
                {
                  status: 503,
                  headers: {
                    "Content-Type": "text/plain",
                  },
                }
              )
            );
          });
        })
    );

    return;
  }

  /**
   * Static files
   *
   * Cache first → network fallback
   */
  if (
    event.request.destination === "script" ||
    event.request.destination === "style" ||
    event.request.destination === "font" ||
    event.request.destination === "image"
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }

            const copy = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy);
            });

            return response;
          })
          .catch(() => {
            return new Response("", {
              status: 503,
            });
          });
      })
    );
  }
});