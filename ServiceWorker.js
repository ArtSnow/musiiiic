const CACHE_NAME = "nik-v1"; // Увеличиваем версию кэша
const urlsToCache = [
  "/musiiiic/",
  "/musiiiic/manifest.json",
  "/musiiiic/icon.png",
  "/musiiiic/style.css",
  "/musiiiic/script.js",
  "/musiiiic/play.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("activate", (event) => {
  // Удаляем устаревшие кэши
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  console.log(event.request)
  if (event.request.fetch == 'no-store') {
    event.respondWith(
      // Пытаемся загрузить ресурс из сети
      fetch(event.request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(() => {
          // Если сеть недоступна, пытаемся загрузить из кеша
          return caches.match(event.request);
        })
    );
  } else {
    event.respondWith(
      // Пытаемся загрузить ресурс из сети
      fetch(event.request)
        .then((networkResponse) => {
          // Клонируем сетевой ответ перед кэшированием
          const responseToCache = networkResponse.clone();
  
          // Кэшируем сетевой ответ
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
              return cache.put(event.request, responseToCache);
            })
          );
  
          // Возвращаем оригинальный сетевой ответ
          return networkResponse;
        })
        .catch(() => {
          // Если сеть недоступна, пытаемся загрузить из кеша
          return caches.match(event.request);
        })
    );
  }
});
