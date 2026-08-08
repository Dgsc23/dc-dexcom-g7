/* Offline support. A medical reference should not stop working because the
   signal did. Cache name is content-derived, so a redeploy replaces it. */
const CACHE = 'dexcom-g7-5f70dc16ece8';
const ASSETS = ["./","index.html","manifest.webmanifest","audio/manifest.json","family.html","icon.svg","icon-180.png","icon-192.png","icon-512.png","audio/card-24dbb809.mp3","audio/card-33a225b9.mp3","audio/card-458047ac.mp3","audio/card-49420a3e.mp3","audio/card-4d1a77d4.mp3","audio/card-5480ef49.mp3","audio/card-5dbd2434.mp3","audio/card-76e0d801.mp3","audio/card-7c1c2000.mp3","audio/card-81d1a350.mp3","audio/card-82287e83.mp3","audio/card-8a838ec8.mp3","audio/card-aa2c97ee.mp3","audio/card-ade7ac9f.mp3","audio/card-b259254f.mp3","audio/card-d7912b12.mp3","audio/card-feecff5f.mp3","audio/pg-47115863.mp3","audio/pg-8f01a182.mp3","audio/qa-0ed9a057.mp3","audio/qa-12b5e7da.mp3","audio/qa-36940ac6.mp3","audio/qa-4b7acdca.mp3","audio/qa-5164a172.mp3","audio/qa-63868458.mp3","audio/qa-64be196e.mp3","audio/qa-68d3ec65.mp3","audio/qa-9ab1c4ac.mp3","audio/qa-cd13ef2f.mp3","audio/qa-d30e9ca3.mp3","audio/qa-db622e3d.mp3","audio/qq-1fc6dadf.mp3","audio/qq-28462d4d.mp3","audio/qq-440066f4.mp3","audio/qq-4990f25b.mp3","audio/qq-4ba26ed9.mp3","audio/qq-759ccda3.mp3","audio/qq-80c6ef99.mp3","audio/qq-98e31902.mp3","audio/qq-9e5fc451.mp3","audio/qq-ab0c1887.mp3","audio/qq-b80728d4.mp3","audio/qq-f1e16eb3.mp3","audio/run-019e5b1e.mp3","audio/run-03eee8b3.mp3","audio/run-0baa8ecf.mp3","audio/run-1c2bf6b9.mp3","audio/run-1ced8120.mp3","audio/run-1eaca696.mp3","audio/run-2cf6cfed.mp3","audio/run-30dcd35a.mp3","audio/run-3c2f61ca.mp3","audio/run-3f97c344.mp3","audio/run-4645e443.mp3","audio/run-47c86169.mp3","audio/run-5011a266.mp3","audio/run-5849d775.mp3","audio/run-5b3799d1.mp3","audio/run-60061af6.mp3","audio/run-60bc0dcc.mp3","audio/run-622df798.mp3","audio/run-632ca7f7.mp3","audio/run-66ab0415.mp3","audio/run-742c4b24.mp3","audio/run-7591aeb3.mp3","audio/run-77011bd8.mp3","audio/run-7d00e524.mp3","audio/run-7ef4b613.mp3","audio/run-86252b9f.mp3","audio/run-90ca1ca6.mp3","audio/run-92a85b20.mp3","audio/run-94c0a4e0.mp3","audio/run-a5aee942.mp3","audio/run-a9060ad7.mp3","audio/run-ac13e2ca.mp3","audio/run-adc682ac.mp3","audio/run-b41ffb3d.mp3","audio/run-b69bf638.mp3","audio/run-b6e6ab1f.mp3","audio/run-bbf911f0.mp3","audio/run-bc994960.mp3","audio/run-c1c724a3.mp3","audio/run-c667a0ce.mp3","audio/run-d616424b.mp3","audio/run-d744cb8f.mp3","audio/run-d895cbb8.mp3","audio/run-f0dafde3.mp3","audio/run-fadd4ed3.mp3"];

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
