const CACHE_NAME = 'taoist-venting-v2';
const urlsToCache = [
    './',
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    '2D.png',
    'audio.mp3',
    'taoist.mp3',
    'icon.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache).catch(err => {
                console.warn('缓存部分资源失败（可能文件缺失）', err);
            });
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        })
    );
});