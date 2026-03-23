const CACHE_NAME = 'galle-ventas-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './herramientas.js',
    './materias.js',
    './precios.js',
    './productos.js',
    './reportes.js',
    './ventas.js',
    'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Failsafe caching in case some assets throw 404
            return cache.addAll(ASSETS).catch(err => console.log('SW Cache error:', err));
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
