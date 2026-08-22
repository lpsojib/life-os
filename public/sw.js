const CACHE_NAME = "life-os-v3";

const APP_SHELL = [
  "/",
  "/dashboard",
];

/**
 * ================================
 * INSTALL
 * ================================
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of APP_SHELL) {
        try {
          await cache.add(url);
        } catch (error) {
          console.warn(
            `Life OS: failed to cache ${url}`,
            error
          );
        }
      }
    })
  );

  self.skipWaiting();
});

/**
 * ================================
 * ACTIVATE
 * ================================
 *
 * পুরোনো Life OS cache মুছে ফেলবে।
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

/**
 * ================================
 * FETCH
 * ================================
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // শুধু GET request handle করব
  if (request.method !== "GET") {
    return;
  }

  /**
   * ================================
   * PAGE / NAVIGATION
   * ================================
   */
  if (request.mode === "navigate") {
    event.respondWith(
      handleNavigation(request)
    );

    return;
  }

  /**
   * ================================
   * STATIC FILES
   * ================================
   *
   * JS
   * CSS
   * Images
   * Fonts
   */
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      handleStaticFile(request)
    );

    return;
  }
});

/**
 * ================================
 * NAVIGATION HANDLER
 * ================================
 *
 * CACHE FIRST
 *
 * Offline হলে cached page immediately.
 */
async function handleNavigation(request) {
  try {
    /**
     * 1. Exact URL cache
     */
    const cachedPage = await caches.match(request);

    if (cachedPage) {
      return cachedPage;
    }

    /**
     * 2. Dashboard cache
     *
     * আগে login করা app-এর জন্য
     * dashboard fallback হিসেবে ব্যবহার হবে।
     */
    const dashboardCache = await caches.match(
      "/dashboard"
    );

    if (dashboardCache) {
      return dashboardCache;
    }

    /**
     * 3. Root cache
     */
    const rootCache = await caches.match("/");

    if (rootCache) {
      return rootCache;
    }

    /**
     * 4. কোনো cache নেই
     * তখন network try করবে।
     */
    const response = await fetch(request);

    /**
     * Successful page cache করি
     */
    if (
      response &&
      response.status === 200
    ) {
      const responseClone =
        response.clone();

      const cache = await caches.open(
        CACHE_NAME
      );

      await cache.put(
        request,
        responseClone
      );
    }

    return response;
  } catch (error) {
    console.warn(
      "Life OS navigation offline:",
      error
    );

    /**
     * Network + cache দুইটাই fail করলে
     * offline fallback দেখাবে।
     */
    const dashboardCache =
      await caches.match("/dashboard");

    if (dashboardCache) {
      return dashboardCache;
    }

    const rootCache =
      await caches.match("/");

    if (rootCache) {
      return rootCache;
    }

    return new Response(
      `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <title>Life OS</title>
            <style>
              body {
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f8fafc;
                font-family: Arial, sans-serif;
              }

              .container {
                text-align: center;
              }

              .logo {
                width: 80px;
                height: 80px;
                margin: 0 auto 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 24px;
                background: #000;
                color: #fff;
                font-size: 28px;
                font-weight: 900;
              }

              h1 {
                margin: 0;
                font-size: 20px;
              }

              p {
                margin-top: 8px;
                color: #64748b;
                font-size: 14px;
              }
            </style>
          </head>

          <body>
            <div class="container">
              <div class="logo">
                LP
              </div>

              <h1>Life OS</h1>

              <p>
                You are currently offline.
              </p>
            </div>
          </body>
        </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type":
            "text/html; charset=utf-8",
        },
      }
    );
  }
}

/**
 * ================================
 * STATIC FILE HANDLER
 * ================================
 *
 * Cache first
 * তারপর network
 */
async function handleStaticFile(request) {
  /**
   * আগে cache
   */
  const cached =
    await caches.match(request);

  if (cached) {
    return cached;
  }

  /**
   * Cache-এ না থাকলে network
   */
  try {
    const response =
      await fetch(request);

    if (
      response &&
      response.status === 200
    ) {
      const responseClone =
        response.clone();

      const cache =
        await caches.open(
          CACHE_NAME
        );

      await cache.put(
        request,
        responseClone
      );
    }

    return response;
  } catch (error) {
    console.warn(
      "Life OS static file offline:",
      error
    );

    /**
     * Static file না পেলে empty response
     */
    return new Response("", {
      status: 503,
    });
  }
}