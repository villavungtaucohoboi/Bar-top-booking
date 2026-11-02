// TopChill service worker tối giản: đủ điều kiện cài app, không lưu cache để nội dung luôn mới.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => { if (e.request.mode === 'navigate') e.respondWith(fetch(e.request).catch(() => new Response('<meta charset="utf-8"><body style="background:#0b0710;color:#fff;font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0">Mất kết nối mạng. Kiểm tra mạng rồi mở lại TopChill.</body>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))); });
