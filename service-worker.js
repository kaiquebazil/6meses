// service-worker.js
const CACHE_NAME = "ingles-6meses-v1.0";
const urlsToCache = [
  "/",
  "/index.html",
  "/index.html",
  "/css/6meses.css",
  "/js/6meses.js",
  "/js/utils/helpers.js",
  "/data/studyPlan.js",
  "/data/resources.js",
  "/data/complementaryData.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
];

// Instalar Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker instalando...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache aberto");
      return cache.addAll(urlsToCache);
    })
  );
});

// Ativar Service Worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker ativando...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Removendo cache antigo:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições
self.addEventListener("fetch", (event) => {
  // Ignorar requisições não GET
  if (event.request.method !== "GET") return;

  // Ignorar requisições para YouTube/recursos externos
  if (event.request.url.includes("youtube.com")) return;
  if (event.request.url.includes("googleapis.com")) return;
  if (event.request.url.includes("cdnjs.cloudflare.com")) return;

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Cache hit - retorna resposta do cache
        if (response) {
          return response;
        }

        // Clone da requisição
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Verifica se recebemos uma resposta válida
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone da resposta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // Fallback para página offline
        if (event.request.headers.get("accept").includes("text/html")) {
          return caches.match("index.html");
        }
      })
  );
});

// Notificações push (opcional)
self.addEventListener("push", (event) => {
  const title = "Inglês em 6 Meses";
  const options = {
    body: event.data.text(),
    icon: "icons/icon-192x192.png",
    badge: "icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Continuar Estudos",
        icon: "icons/study-icon.png",
      },
      {
        action: "close",
        title: "Fechar",
        icon: "icons/close-icon.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  console.log("Notificação clicada:", event.notification.tag);
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("index.html"));
  }
});
