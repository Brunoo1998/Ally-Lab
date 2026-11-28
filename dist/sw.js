'use strict';
const CACHE='ally-lab-offline-v1';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.add('/offline.html'))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ally-lab-offline-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{const r=event.request,u=new URL(r.url);if(r.method!=='GET'||r.mode!=='navigate'||u.origin!==self.location.origin||u.pathname.startsWith('/api/'))return;event.respondWith(fetch(r).catch(()=>caches.match('/offline.html')));});
