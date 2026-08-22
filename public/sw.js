const CACHE_NAME = "life-os-v6";

const APP_SHELL = [
  "/",
  "/dashboard",
  "/login",
  "/register",
];

/**
 * INSTALL
 *
 * App shell cache করি।
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

  /**
   * নতুন Service Worker-কে
   * waiting অবস্থায় না রেখে activate করি।
   */
  self.skipWaiting();
});


/**
 * ACTIVATE
 *
 * পুরোনো Life OS cache delete করি।
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (name) =>
                name.startsWith("life-os-") &&
                name !== CACHE_NAME
            )
            .map((name) =>
              caches.delete(name)
            )
        );
      })
      .then(() => {
        /**
         * বর্তমানে open থাকা page-গুলোকেও
         * নতুন Service Worker control করবে।
         */
        return self.clients.claim();
      })
  );
});


/**
 * FETCH
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  /**
   * শুধু GET request cache করব।
   */
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /**
   * অন্য domain-এর request Service Worker
   * handle করবে না।
   */
  if (url.origin !== self.location.origin) {
    return;
  }


  /**
   * ----------------------------------------
   * NAVIGATION REQUEST
   * ----------------------------------------
   *
   * User যখন page/app open করে।
   *
   * আগে cache → তারপর network।
   *
   * Offline হলে cache থেকে page দেওয়া হবে।
   */
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then((cachedPage) => {
        /**
         * Cached page থাকলে
         * সঙ্গে সঙ্গে return করি।
         */
        if (cachedPage) {
          /**
           * Background-এ network update করার
           * চেষ্টা করি।
           */
          fetch(request)
            .then((response) => {
              if (
                response &&
                response.ok
              ) {
                caches.open(CACHE_NAME).then(
                  (cache) => {
                    cache.put(
                      request,
                      response.clone()
                    );
                  }
                );
              }
            })
            .catch(() => {
              /**
               * Offline হলে কিছু করার নেই।
               */
            });

          return cachedPage;
        }


        /**
         * Cache-এ page নেই।
         *
         * Network try করব।
         */
        return fetch(request)
          .then((response) => {
            if (
              response &&
              response.ok
            ) {
              const copy =
                response.clone();

              caches.open(CACHE_NAME).then(
                (cache) => {
                  cache.put(
                    request,
                    copy
                  );
                }
              );
            }

            return response;
          })
          .catch(() => {
            /**
             * Network unavailable হলে
             * Dashboard cache থেকে দেওয়ার চেষ্টা।
             */
            return caches.match(
              "/dashboard"
            );
          });
      })
    );

    return;
  }


  /**
   * ----------------------------------------
   * STATIC / JS / CSS / IMAGE / FONT
   * ----------------------------------------
   *
   * Cache থাকলে cache থেকে।
   * না থাকলে network থেকে এনে cache করি।
   */
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          /**
           * Valid response হলে cache করি।
           */
          if (
            response &&
            response.ok &&
            response.type === "basic"
          ) {
            const copy =
              response.clone();

            caches.open(CACHE_NAME).then(
              (cache) => {
                cache.put(
                  request,
                  copy
                );
              }
            );
          }

          return response;
        })
        .catch(() => {
          /**
           * Image request হলে fallback।
           */
          if (
            request.destination ===
            "image"
          ) {
            return new Response(
              "",
              {
                status: 200,
                headers: {
                  "Content-Type":
                    "image/svg+xml",
                },
              }
            );
          }

          /**
           * অন্য resource পাওয়া না গেলে
           * browser-এর default error।
           */
          return new Response(
            "",
            {
              status: 503,
              statusText:
                "Offline",
            }
          );
        });
    })
  );
});