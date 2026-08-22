const CACHE_NAME = "life-os-v8";

const APP_SHELL = [
  "/",
  "/dashboard",
  "/login",
  "/register",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of APP_SHELL) {
        try {
          const response = await fetch(url);

          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (error) {
          console.warn(
            "Could not cache:",
            url
          );
        }
      }
    })
  );

  self.skipWaiting();
});


self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
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
      .then(() =>
        self.clients.claim()
      )
  );
});


self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (
    url.origin !==
    self.location.origin
  ) {
    return;
  }

  /**
   * Page navigation
   *
   * Cache first.
   */
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then(
        async (cached) => {
          if (cached) {
            return cached;
          }

          try {
            const response =
              await fetch(request);

            if (response.ok) {
              const cache =
                await caches.open(
                  CACHE_NAME
                );

              await cache.put(
                request,
                response.clone()
              );
            }

            return response;
          } catch (error) {
            /**
             * Offline হলে Dashboard fallback।
             */
            const dashboard =
              await caches.match(
                "/dashboard"
              );

            if (dashboard) {
              return dashboard;
            }

            const root =
              await caches.match("/");

            if (root) {
              return root;
            }

            return new Response(
              "Life OS is offline",
              {
                status: 503,
                headers: {
                  "Content-Type":
                    "text/plain",
                },
              }
            );
          }
        }
      )
    );

    return;
  }


  /**
   * JS / CSS / images / fonts
   *
   * Cache first.
   */
  event.respondWith(
    caches.match(request).then(
      async (cached) => {
        if (cached) {
          return cached;
        }

        try {
          const response =
            await fetch(request);

          if (
            response.ok &&
            response.type === "basic"
          ) {
            const cache =
              await caches.open(
                CACHE_NAME
              );

            await cache.put(
              request,
              response.clone()
            );
          }

          return response;
        } catch (error) {
          return new Response("", {
            status: 503,
          });
        }
      }
    )
  );
});