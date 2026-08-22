const CACHE_NAME = "life-os-v4";

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
          const response = await fetch(url, {
            cache: "no-store",
          });

          if (response.ok) {
            await cache.put(url, response);
          }
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
 * ================================
 * ACTIVATE
 * ================================
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (name) => name !== CACHE_NAME
            )
            .map((name) =>
              caches.delete(name)
            )
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * ================================
 * FETCH
 * ================================
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /**
   * শুধু নিজের Life OS domain-এর request
   * handle করব।
   */
  if (url.origin !== self.location.origin) {
    return;
  }

  /**
   * ================================
   * PAGE NAVIGATION
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
   * NEXT.JS STATIC FILES
   * ================================
   *
   * এগুলো offline app-এর জন্য সবচেয়ে
   * গুরুত্বপূর্ণ।
   */
  if (
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      handleStaticAsset(request)
    );

    return;
  }

  /**
   * ================================
   * IMAGES / FONTS / CSS / JS
   * ================================
   */
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      handleStaticAsset(request)
    );

    return;
  }
});

/**
 * ================================
 * NAVIGATION
 * ================================
 */
async function handleNavigation(request) {
  /**
   * 1. Exact page cache
   */
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  /**
   * 2. Network
   */
  try {
    const response = await fetch(request);

    if (response.ok) {
      const copy = response.clone();

      const cache = await caches.open(
        CACHE_NAME
      );

      await cache.put(
        request,
        copy
      );
    }

    return response;
  } catch (error) {
    console.warn(
      "Life OS navigation offline:",
      error
    );

    /**
     * 3. Dashboard fallback
     */
    const dashboard =
      await caches.match("/dashboard");

    if (dashboard) {
      return dashboard;
    }

    /**
     * 4. Root fallback
     */
    const root = await caches.match("/");

    if (root) {
      return root;
    }

    /**
     * 5. Final offline page
     */
    return createOfflinePage();
  }
}

/**
 * ================================
 * STATIC ASSETS
 * ================================
 */
async function handleStaticAsset(request) {
  /**
   * Cache first
   */
  const cached =
    await caches.match(request);

  if (cached) {
    return cached;
  }

  /**
   * Network
   */
  try {
    const response =
      await fetch(request);

    if (
      response &&
      response.ok
    ) {
      const copy =
        response.clone();

      const cache =
        await caches.open(
          CACHE_NAME
        );

      await cache.put(
        request,
        copy
      );
    }

    return response;
  } catch (error) {
    console.warn(
      "Life OS asset offline:",
      request.url
    );

    return new Response("", {
      status: 503,
    });
  }
}

/**
 * ================================
 * OFFLINE FALLBACK
 * ================================
 */
function createOfflinePage() {
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
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              min-height: 100vh;

              display: flex;
              align-items: center;
              justify-content: center;

              background: #f8fafc;

              font-family:
                Arial,
                Helvetica,
                sans-serif;
            }

            .container {
              text-align: center;
            }

            .logo {
              width: 80px;
              height: 80px;

              margin: 0 auto 18px;

              display: flex;
              align-items: center;
              justify-content: center;

              border-radius: 24px;

              background: #000;
              color: #fff;

              font-size: 28px;
              font-weight: 900;

              box-shadow:
                0 10px 30px
                rgba(0, 0, 0, 0.15);
            }

            h1 {
              margin: 0;

              font-size: 21px;
              font-weight: 700;

              color: #111827;
            }

            p {
              margin-top: 8px;

              font-size: 14px;

              color: #64748b;
            }
          </style>
        </head>

        <body>
          <div class="container">

            <div class="logo">
              LP
            </div>

            <h1>
              Life OS
            </h1>

            <p>
              You're offline
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