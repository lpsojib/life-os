const CACHE_NAME = "life-os-v2";

const OFFLINE_FALLBACK = "/dashboard";

/**
 * Install
 *
 * Service Worker install হবে।
 * এখানে শুধু basic app entry cache করছি।
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.add("/");
    })
  );

  self.skipWaiting();
});

/**
 * Activate
 */
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
 * Navigation requests
 *
 * IMPORTANT:
 *
 * আগে Cache
 * তারপর Network
 *
 * ফলে app open করার সময় Vercel-এর response-এর
 * জন্য অপেক্ষা করতে হবে না যদি cached page থাকে।
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  /**
   * Page navigation
   */
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then((cachedPage) => {
        if (cachedPage) {
          /**
           * Cached page সঙ্গে সঙ্গে return
           */
          return cachedPage;
        }

        /**
         * Exact page cache না থাকলে dashboard
         * অথবা root cache থেকে fallback।
         */
        return caches.match("/dashboard").then(
          (cachedDashboard) => {
            if (cachedDashboard) {
              return cachedDashboard;
            }

            return caches.match("/").then((cachedRoot) => {
              if (cachedRoot) {
                return cachedRoot;
              }

              /**
               * একদম cache না থাকলে network
               */
              return fetch(request).then((response) => {
                if (response.ok) {
                  const copy = response.clone();

                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, copy);
                  });
                }

                return response;
              });
            });
          }
        );
      })
    );

    return;
  }

  /**
   * JS / CSS / images / fonts
   *
   * Cache first
   */
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(request)
          .then((response) => {
            if (
              response &&
              response.status === 200
            ) {
              const copy = response.clone();

              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, copy);
              });
            }

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