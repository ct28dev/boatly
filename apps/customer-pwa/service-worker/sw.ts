/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = 'boatly-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.boatly.co.th';

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('boatly-') && key !== STATIC_CACHE && key !== API_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isApiRequest(url: URL): boolean {
  return url.origin === API_BASE || url.pathname.startsWith('/api/');
}

function isImageRequest(url: URL): boolean {
  return /\.(png|jpg|jpeg|gif|webp|avif|svg)$/i.test(url.pathname);
}

function isStaticAsset(url: URL): boolean {
  return /\.(js|css|woff2?|ttf|eot)$/i.test(url.pathname);
}

async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline');
      if (offlinePage) return offlinePage;
    }

    return new Response(
      JSON.stringify({ error: 'offline', message: 'No network connection' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse ?? new Response('', { status: 408 }));

  return cachedResponse ?? fetchPromise;
}

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;

  if (isApiRequest(url)) {
    event.respondWith(networkFirst(event.request, API_CACHE));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
  } else if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(event.request, STATIC_CACHE));
  } else if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, STATIC_CACHE));
  }
});

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    bookingId?: string;
    type?: string;
  };
  actions?: NotificationAction[];
}

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  const payload: PushPayload = event.data.json();

  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-72.png',
    data: payload.data,
    actions: payload.actions || [],
    vibrate: [200, 100, 200],
    tag: payload.data?.type || 'default',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((c) => c.url === targetUrl);
      if (existingClient) {
        return existingClient.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

export {};
