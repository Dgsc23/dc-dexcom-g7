/* Offline support. A medical reference should not stop working because the
   signal did. Cache name is content-derived, so a redeploy replaces it. */
const CACHE = 'dexcom-g7-dae91ffc418e';
const ASSETS = ["./","index.html","manifest.webmanifest","audio/manifest.json","family.html","icon.svg","icon-180.png","icon-192.png","icon-512.png","audio/card-0.mp3","audio/card-1.mp3","audio/card-10.mp3","audio/card-11.mp3","audio/card-12.mp3","audio/card-13.mp3","audio/card-14.mp3","audio/card-15.mp3","audio/card-2.mp3","audio/card-3.mp3","audio/card-4.mp3","audio/card-5.mp3","audio/card-6.mp3","audio/card-7.mp3","audio/card-8.mp3","audio/card-9.mp3","audio/qa-0.mp3","audio/qa-1.mp3","audio/qa-10.mp3","audio/qa-11.mp3","audio/qa-2.mp3","audio/qa-3.mp3","audio/qa-4.mp3","audio/qa-5.mp3","audio/qa-6.mp3","audio/qa-7.mp3","audio/qa-8.mp3","audio/qa-9.mp3","audio/qq-0.mp3","audio/qq-1.mp3","audio/qq-10.mp3","audio/qq-11.mp3","audio/qq-2.mp3","audio/qq-3.mp3","audio/qq-4.mp3","audio/qq-5.mp3","audio/qq-6.mp3","audio/qq-7.mp3","audio/qq-8.mp3","audio/qq-9.mp3","audio/run-alarm-0.mp3","audio/run-alarm-1.mp3","audio/run-alarm-2.mp3","audio/run-alarm-3.mp3","audio/run-alarm-4.mp3","audio/run-family-0.mp3","audio/run-family-1.mp3","audio/run-family-2.mp3","audio/run-family-3.mp3","audio/run-insert-0.mp3","audio/run-insert-1.mp3","audio/run-insert-2.mp3","audio/run-insert-3.mp3","audio/run-insert-4.mp3","audio/run-insert-5.mp3","audio/run-insert-6.mp3","audio/run-insert-7.mp3","audio/run-nonum-0.mp3","audio/run-nonum-1.mp3","audio/run-nonum-2.mp3","audio/run-nonum-3.mp3","audio/run-nonum-4.mp3","audio/run-practice-0.mp3","audio/run-practice-1.mp3","audio/run-practice-2.mp3","audio/run-practice-3.mp3","audio/run-practice-4.mp3","audio/run-practice-5.mp3","audio/run-practice-6.mp3","audio/run-practice-7.mp3","audio/run-read-0.mp3","audio/run-read-1.mp3","audio/run-read-2.mp3","audio/run-read-3.mp3","audio/run-swap-0.mp3","audio/run-swap-1.mp3","audio/run-swap-2.mp3","audio/run-swap-3.mp3","audio/run-swap-4.mp3","audio/run-unwell-0.mp3","audio/run-unwell-1.mp3","audio/run-unwell-2.mp3","audio/run-unwell-3.mp3","audio/run-unwell-4.mp3","audio/screen.mp3","audio/ver.mp3"];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {
    // One bad asset must not abort the whole install.
    return Promise.all(ASSETS.map(a => c.add(a).catch(() => null)));
  })));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // never touch the AI worker

  // Page itself: network first, so an update is picked up when online.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return r;
      }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
    );
    return;
  }

  // Recordings and icons: cache first, they never change within a version.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r && r.status === 200) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return r;
    }).catch(() => hit))
  );
});
