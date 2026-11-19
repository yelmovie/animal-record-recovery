// Offline revisit (2026-11-19). The page and code go to the network first and fall back to the copy kept here,
// so a deploy is never hidden behind old code. Pictures, models and fonts come from this build's copy once fetched.
// Range requests and media streams (videos, concept clips, <audio>) always go straight to the network, so iPad
// Safari keeps the 206 replies from worker.js. The build stamps VERSION; a new build drops the old copy.
const VERSION='development',PREFIX='animal-record-recovery-',CACHE=PREFIX+VERSION;
const scope=new URL(self.registration?.scope||'./',self.location.href),ASSETS=new URL('assets/',scope).pathname;
const MEDIA=['assets/videos/','assets/concepts/'].map(p=>new URL(p,scope).pathname);

function cacheable(request){
  const url=new URL(request.url);
  return request.method==='GET'&&url.origin===scope.origin&&!request.headers.has('range')
    &&!['audio','video'].includes(request.destination)&&!MEDIA.some(p=>url.pathname.startsWith(p));
}
async function keep(request,response){
  if(response?.status===200&&response.type==='basic')await (await caches.open(CACHE)).put(request,response.clone());
  return response;
}
const fallback=async request=>(await caches.match(request,{ignoreSearch:true,cacheName:CACHE}))||Response.error();

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.add(new URL('./',scope))).catch(()=>{}));
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(!cacheable(request))return;
  if(request.mode==='navigate'){
    const home=new URL('./',scope).href;
    event.respondWith(fetch(request).then(response=>keep(home,response)).catch(()=>fallback(home)));
  }else if(new URL(request.url).pathname.startsWith(ASSETS)){
    event.respondWith(caches.match(request,{cacheName:CACHE}).then(hit=>hit||fetch(request).then(response=>keep(request,response))));
  }else event.respondWith(fetch(request).then(response=>keep(request,response)).catch(()=>fallback(request)));
});
// The page sends what its first load fetched (before this worker controlled it), so that load works offline too.
self.addEventListener('message',event=>{
  const urls=event.data?.cache;
  if(!Array.isArray(urls))return;
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    for(const url of urls.slice(0,500)){
      let request;try{request=new Request(url);}catch{continue;}
      if(!cacheable(request)||await cache.match(request))continue;
      try{await keep(request,await fetch(request));}catch{}
    }
  })());
});
