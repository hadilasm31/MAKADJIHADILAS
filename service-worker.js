// Service Worker LAMITI SHOP
const CACHE_VERSION = 'v3.0.0';
const CACHE_NAME = `lamiti-shop-${CACHE_VERSION}`;

// Fichiers à mettre en cache
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/products.html',
    '/cart.html',
    '/track-order.html',
    '/admin.html',
    
    // Scripts
    '/js/config.js',
    '/js/main.js',
    '/js/admin.js',
    
    // Images
    '/resources/product-placeholder.jpg',
    '/resources/category-placeholder.jpg',
    
    // CDN
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js',
    'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js'
];

// Installation
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installation...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Mise en cache des fichiers');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Installation terminée');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Erreur installation:', error);
            })
    );
});

// Activation
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activation...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] Suppression ancien cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activation terminée');
                return self.clients.claim();
            })
    );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes non-GET
    if (event.request.method !== 'GET') return;
    
    const url = new URL(event.request.url);
    
    // Stratégie: Cache d'abord, puis réseau
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Mettre à jour le cache en arrière-plan
                    fetchAndCache(event.request);
                    return cachedResponse;
                }
                
                // Aller sur le réseau
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Ne pas mettre en cache les erreurs
                        if (!networkResponse.ok) {
                            return networkResponse;
                        }
                        
                        // Mettre en cache
                        return caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, networkResponse.clone());
                                return networkResponse;
                            });
                    })
                    .catch(() => {
                        // Fallback pour les pages HTML
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                        
                        // Fallback générique
                        return new Response('Hors ligne', {
                            status: 503,
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
            })
    );
});

// Mettre à jour le cache en arrière-plan
function fetchAndCache(request) {
    return fetch(request)
        .then((response) => {
            if (response.ok) {
                return caches.open(CACHE_NAME)
                    .then((cache) => cache.put(request, response));
            }
        })
        .catch(() => {
            // Ignorer les erreurs
        });
}

// Synchronisation des données
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-cart') {
        event.waitUntil(syncCartData());
    }
    
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrdersData());
    }
});

async function syncCartData() {
    // Synchronisation du panier
    const cart = JSON.parse(localStorage.getItem('lamiti-cart') || '[]');
    if (cart.length > 0) {
        // Simuler l'envoi au serveur
        console.log('[Service Worker] Synchronisation panier:', cart.length, 'articles');
        
        // Marquer comme synchronisé
        localStorage.setItem('lamiti-cart-synced', Date.now().toString());
    }
}

async function syncOrdersData() {
    // Synchronisation des commandes
    const orders = JSON.parse(localStorage.getItem('lamiti-orders') || '[]');
    if (orders.length > 0) {
        console.log('[Service Worker] Synchronisation commandes:', orders.length, 'commandes');
        localStorage.setItem('lamiti-orders-synced', Date.now().toString());
    }
}

// Notifications push
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Nouvelle notification LAMITI SHOP',
        icon: '/resources/icon-192x192.png',
        badge: '/resources/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        },
        actions: [
            {
                action: 'explore',
                title: 'Voir la boutique',
                icon: '/resources/checkmark.png'
            },
            {
                action: 'close',
                title: 'Fermer',
                icon: '/resources/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('LAMITI SHOP', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        // Ouvrir la boutique
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    for (const client of clientList) {
                        if (client.url === '/' && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
});

// Messages depuis la page
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME);
    }
    
    if (event.data && event.data.type === 'GET_CACHE_INFO') {
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.keys();
            })
            .then((requests) => {
                event.ports[0].postMessage({
                    type: 'CACHE_INFO',
                    size: requests.length,
                    urls: requests.map(req => req.url)
                });
            });
    }
});
