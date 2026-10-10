/* Only the public application shell is cached. Never cache routing or map tiles. */
const CACHE='velunivo-shell-__BUILD__';
function shell(url) {return url.origin===self.location.origin && (/^\/(?:_expo\/static|assets|pwa)\//.test(url.pathname) || url.pathname==='/maplibre-gl-worker.mjs' || url.pathname==='/manifest.webmanifest' || url.pathname==='/favicon.ico');}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE),response=await fetch('/index.html',{cache:'reload'});
 if(!response.ok)throw new Error('App shell unavailable');await cache.put('/index.html',response.clone());
 const html=await response.text(),urls=[...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m=>new URL(m[1],self.location.origin)).filter(shell);
 await Promise.all(urls.map(async url=>{const r=await fetch(url,{cache:'reload'});if(r.ok)await cache.put(url,r);}));
 await cache.addAll(['/manifest.webmanifest','/pwa/icon-192.png','/pwa/icon-512.png','/pwa/apple-touch-icon.png']);
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('velunivo-shell-') && key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET' || url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){event.respondWith((async()=>{try {const r=await fetch(req);if(r.ok)(await caches.open(CACHE)).put('/index.html',r.clone());return r;}catch{return await (await caches.open(CACHE)).match('/index.html') || Response.error();}})());return;}
 if(shell(url))event.respondWith((async()=>{const cache=await caches.open(CACHE),stored=await cache.match(req);if(stored)return stored;const r=await fetch(req);if(r.ok)await cache.put(req,r.clone());return r;})());
});
