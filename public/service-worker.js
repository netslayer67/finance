const STATIC_CACHE = 'financial-dashboard-static-v1';
const DATA_CACHE = 'financial-dashboard-data-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.map((key) => {
                    if (![STATIC_CACHE, DATA_CACHE].includes(key)) {
                        return caches.delete(key);
                    }
                    return null;
                })
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    if (url.pathname.startsWith('/api')) {
        event.respondWith(networkThenCache(request));
        return;
    }

    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(request));
    }
});

const cacheFirst = async (request) => {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
};

const networkThenCache = async (request) => {
    const cache = await caches.open(DATA_CACHE);
    try {
        const networkResponse = await fetch(request);
        cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
};
