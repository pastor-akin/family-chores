const CACHE = 'family-chores-v4';

const LOCAL_ASSETS = ['/', '/index.html', '/manifest.json', '/icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(LOCAL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Let CDN and Supabase requests go straight to network — never intercept them
  if (url.includes('supabase.co') ||
      url.includes('unpkg.com') ||
      url.includes('jsdelivr.net') ||
      url.includes('fonts.googleapis.com') ||
      url.includes('fonts.gstatic.com')) {
    return;
  }

  // For local files: cache-first, fall back to network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        return r;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
