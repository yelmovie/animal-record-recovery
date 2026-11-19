import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../sw.js',import.meta.url),'utf8');
const SCOPE='https://app.test/';

function load({network=async()=>new Response('net',{status:200}),stored=new Map(),keys=[]}={}){
  const handlers={},fetched=[];
  const cache={
    put:async(req,res)=>{stored.set(typeof req==='string'?req:req.url,res);},
    match:async req=>stored.get(typeof req==='string'?req:req.url),
    add:async()=>{},
  };
  const deleted=[];
  const caches={open:async()=>cache,match:async(req,opts)=>{const url=typeof req==='string'?req:req.url;return stored.get(opts?.ignoreSearch?url.split('?')[0]:url)||stored.get(url);},keys:async()=>keys,delete:async k=>{deleted.push(k);return true;}};
  const self={registration:{scope:SCOPE},location:{href:SCOPE+'sw.js'},addEventListener:(t,h)=>{handlers[t]=h;},skipWaiting(){},clients:{claim:async()=>{}}};
  vm.runInNewContext(source,{self,caches,URL,Request,Response,fetch:async req=>{fetched.push(req.url||req);return network(req);}});
  return {handlers,fetched,stored,deleted};
}
function fetchEvent(url,{headers,mode='no-cors',destination=''}={}){
  const request=new Request(url,{headers});
  Object.defineProperty(request,'mode',{value:mode});Object.defineProperty(request,'destination',{value:destination});
  const event={request,responded:null,respondWith(p){this.responded=p;}};
  return event;
}

test('range requests, media streams and other origins are left to the network', ()=>{
  const {handlers}=load();
  for(const event of [
    fetchEvent(SCOPE+'assets/sfx/tap.mp3',{headers:{Range:'bytes=0-'}}),
    fetchEvent(SCOPE+'assets/videos/motion/frog-web.mp4'),
    fetchEvent(SCOPE+'assets/concepts/a.webm'),
    fetchEvent(SCOPE+'assets/audio/broadcast/opening.mp3',{destination:'audio'}),
    fetchEvent('https://other.test/x.js'),
  ]){handlers.fetch(event);assert.equal(event.responded,null,event.request.url);}
});

test('pictures come from the kept copy before the network', async()=>{
  const stored=new Map([[SCOPE+'assets/village/map-base-light.webp',new Response('kept')]]);
  const {handlers,fetched}=load({stored});
  const event=fetchEvent(SCOPE+'assets/village/map-base-light.webp');handlers.fetch(event);
  assert.equal(await (await event.responded).text(),'kept');
  assert.deepEqual(fetched,[]);
});

test('code goes to the network first and falls back to the kept copy offline', async()=>{
  const stored=new Map([[SCOPE+'src/app.css',new Response('old css')]]);
  const online=load({stored:new Map(stored)});
  const live=fetchEvent(SCOPE+'src/app.css?v=new');online.handlers.fetch(live);
  assert.equal(await (await live.responded).text(),'net');
  const offline=load({stored,network:async()=>{throw new TypeError('offline');}});
  const event=fetchEvent(SCOPE+'src/app.css?v=new');offline.handlers.fetch(event);
  assert.equal(await (await event.responded).text(),'old css');
});

test('a new build drops only this app\'s older copies', async()=>{
  const {handlers,deleted}=load({keys:['animal-record-recovery-development','animal-record-recovery-old','other-app']});
  let done;handlers.activate({waitUntil(p){done=p;}});await done;
  assert.deepEqual(deleted,['animal-record-recovery-old']);
});

test('the build stamps a version and registers the worker only from the deployed build', async()=>{
  const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');
  assert.match(build,/file==='sw\.js'/);
  assert.match(source,/const VERSION='development'/);
  const frontdoor=await readFile(new URL('../src/frontdoor.js',import.meta.url),'utf8');
  assert.match(frontdoor,/BUILD_INFO\.sha!=='development'&&'serviceWorker' in navigator/);
});
