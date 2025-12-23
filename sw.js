// sw.js - VERSION FORCE UPDATE
const CACHE_NAME = 'rpg-js-v4'; // Pense à changer ce numéro à chaque modif !
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './game.js',
    './classes.js',
    './skills.js',
    './loot.js',
    './entities.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// 1. Installation : On force l'attente à zéro
self.addEventListener('install', (event) => {
    // Cette ligne force la nouvelle version à s'installer immédiatement
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Mise en cache des fichiers');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Activation : On prend le contrôle tout de suite
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Suppression ancien cache', key);
                    return caches.delete(key);
                }
            }));
        }).then(() => {
            // Cette ligne force la nouvelle version à contrôler la page active
            return self.clients.claim();
        })
    );
});

// 3. Fetch : Stratégie Cache First, mais on pourrait changer pour Network First
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
        })
    );
});

// 3. Interception des requêtes (Stratégie : Cache d'abord, puis Réseau)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Si le fichier est dans le cache, on le sert
            return response || fetch(event.request);
        })
    );
});
