/* ═══════════════════════════════════════════════════════════════
   YP WORK · SERVICE WORKER
   service-worker.js
   Static cache + offline shell (demo พอใช้ได้)
   ═══════════════════════════════════════════════════════════════ */

const VERSION = 'yp-work-v7.3';
const CACHE = `${VERSION}-cache`;
const PRECACHE = [
  './',
  './index.html',
  './app.html',
  './manifest.json',
  './assets/css/tokens.css',
  './assets/css/base.css',
  './assets/css/layout.css',
  './assets/css/components.css',
  './assets/css/pages.css',
  './assets/css/framework/bottom-sheet.css',
  './assets/js/app.js',
  './assets/js/core/store.js',
  './assets/js/core/auth.js',
  './assets/js/core/router.js',
  './assets/js/core/ui.js',
  './assets/js/framework/app-shell.js',
  './assets/js/framework/route-meta.js',
  './assets/js/framework/bottom-sheet.js',
  './assets/js/framework/avatar.js',
  './assets/js/framework/scroll-lock.js',
  './assets/js/framework/history-manager.js',
  './assets/js/views/today.js',
  './assets/js/views/calendar.js',
  './assets/js/views/profile.js',
  './assets/js/views/events/index.js',
  './assets/js/views/events/list.js',
  './assets/js/views/events/detail-single.js',
  './assets/js/views/events/detail-group.js',
  './assets/js/views/events/create.js',
  './assets/js/views/events/edit.js',
  './assets/js/views/events/manage.js',
  './assets/js/views/events/add-task.js',
  './assets/js/views/events/edit-task.js',
  './assets/js/views/events/day.js',
  './assets/js/views/events/task-row.js',
  './assets/icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Don't cache cross-origin (e.g. fonts.googleapis.com)
  if (url.origin !== self.location.origin) {
    return; // Let network handle it (fonts via CDN)
  }

  // For navigation requests → network-first, fallback ตาม URL
  if (req.mode === 'navigate') {
    const url = new URL(req.url);
    const isLoginPage = url.pathname.endsWith('index.html') || url.pathname.endsWith('/');
    const fallbackPage = isLoginPage ? './index.html' : './app.html';
    event.respondWith(
      fetch(req)
        .then(response => {
          // Cache successful navigation responses
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(req, clone));
          }
          return response;
        })
        .catch(() => caches.match(fallbackPage).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // For everything else → cache-first with background update
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
