const CACHE_NAME = "life-os-v7";

const APP_SHELL = [
  "/",
  "/login",
  "/register",
];

/**
 * INSTALL
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of APP_SHELL) {
        try {
          await cache.add(url);
        } catch (error) {
          console.warn(
            "Life OS cache failed:",
            url,
            error
          );
        }
      }
    })
  );

  self.skipWaiting();
});


/**
 * ACTIVATE
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) =>
                name.startsWith("life-os-") &&
                name !== CACHE_NAME
            )
            .map((name) =>
              caches.delete(name)
            )
        )
      )
      .then(() => self.clients.claim())
  );
});


/**
 * FETCH
 *
 * IMPORTANT:
 * Navigation request এখানে intercept করছি না।
 *
 * এতে Next.js-এর routing/reload নষ্ট হবে না।
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  /**
   * Page navigation browser/Next.js-কে
   * সরাসরি handle করতে দাও।
   */
  if (request.mode === "navigate") {
    return;
  }

  /**
   * Static files:
   *
   * Cache first → Network fallback
   */
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          if (
            response &&
            response.ok &&
            response.type === "basic"
          ) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(
              (cache) => {
                cache.put(request, copy);
              }
            );
          }

          return response;
        })
        .catch(() => {
          return new Response("", {
            status: 503,
            statusText: "Offline",
          });
        });
    })
  );
});