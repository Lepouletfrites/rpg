// sw.js
const CACHE_NAME = 'rpg-js-v2';
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

// 1. Installation du Service Worker (Mise en cache des fichiers)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Mise en cache des fichiers');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Activation (Nettoyage des vieux caches si on change de version)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Suppression ancien cache', key);
                    return caches.delete(key);
                }
            }));
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
