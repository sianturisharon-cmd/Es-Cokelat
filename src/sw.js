const CACHE_NAME = "escokelat-v1.0.0";
const API_CACHE_NAME = "escokelat-api-v1.0.0";

// File yang akan di-cache untuk app shell
const APP_SHELL_FILES = [
  "/",
  "/index.html",
  "/bundle.js",
  "/styles.main.css",
  "/assets/icons/es-cokelat-192x192.png",
  "/assets/icons/es-cokelat-512x512.png",
  "/assets/favicon-32x32.png",
  "/assets/favicon-16x16.png",
  "/assets/site.webmanifest",
];

// Install event – cache app shell
self.addEventListener("install", (event) => {
  console.log("🍫 Service Worker: Installing Es Cokelat...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("🍫 Service Worker: Caching app shell...");
        return cache.addAll(APP_SHELL_FILES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event – bersihkan cache lama
self.addEventListener("activate", (event) => {
  console.log("🍫 Service Worker: Activated");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log("🧹 Menghapus cache lama:", cacheName);
              return caches.delete(cacheName);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch event – network first untuk API, cache first untuk statis
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests (misalnya daftar menu, pesanan, dsb)
  if (url.pathname.startsWith("/v1/stories") && request.method === "GET") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches
            .open(API_CACHE_NAME)
            .then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(
              JSON.stringify({
                error: "Kamu sedang offline 🍫",
                items: [],
              }),
              {
                headers: { "Content-Type": "application/json" },
              }
            );
          })
        )
    );
    return;
  }

  // Static assets – Cache First
  if (request.method === "GET") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
  }
});

// Push notification event
self.addEventListener("push", (event) => {
  console.log("🍫 Es Cokelat: Push diterima");

  let notificationData = {
    title: "Es Cokelat",
    body: "Ada menu baru yang wajib kamu coba! 🍫☕",
    icon: "/assets/icons/es-cokelat-192x192.png",
    badge: "/assets/favicon-32x32.png",
    data: { url: "/#/home" },
  };

  // Jika push payload berisi data custom
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch {
      console.log("Push data bukan JSON, gunakan default.");
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      actions: [
        { action: "open", title: "Buka Aplikasi" },
        { action: "dismiss", title: "Tutup" },
      ],
      tag: "escokelat-notification",
    })
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("🍫 Notifikasi diklik");
  event.notification.close();

  if (event.action === "dismiss") return;

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/") && "focus" in client) {
          client.navigate(event.notification.data.url || "/#/home");
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || "/#/home");
      }
    })
  );
});
