const CACHE_NAME = 'budgetsync-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'expense-sync') {
    event.waitUntil(syncExpenses());
  }
});

async function syncExpenses() {
  // Sync queued expenses when online
  const syncService = await import('./src/services/syncService.js');
  return syncService.syncQueuedExpenses();
}