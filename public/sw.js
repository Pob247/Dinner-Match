const CACHE_NAME = 'dinner-match-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/images/hero.png',
    '/images/avatar_dad.png',
    '/images/avatar_mum.png',
    '/images/avatar_ozzie.png',
    '/images/avatar_dirge.png',
    '/images/biryani.png',
    '/images/burger.png',
    '/images/chicken.png',
    '/images/curry.png',
    '/images/fish.png',
    '/images/pasta.png',
    '/images/pizza.png',
    '/images/salad.png',
    '/images/soup.png',
    '/images/steak.png',
    '/images/tacos.png'
];

// Install
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Clone and cache successful responses
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
