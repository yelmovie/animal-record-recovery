import { mkdir, copyFile, readFile, writeFile, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSETS } from '../src/assets.js';
import { STORIES } from '../src/story-player.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['index.html',...['korean.js','research-report.js','motion-video.js','tablet.css','campaign.js','campaign-views.js','campaign.css','inquiry.js','inquiry-views.js','inquiry.css','adventure-app.js','expedition.js','model.js','navigation.js','audio.js','drag.js','assets.js','presentation.js','settings-content.js','mission-views.js','shell-views.js','trail-map.js','village.js','adventure.css','view3d.js','stage3d.js','scanner3d.js','dome3d.js',...['three.module.min.js','three.core.min.js','GLTFLoader.js','BufferGeometryUtils.js','LICENSE.txt'].map(f=>`vendor/three/${f}`)].map(f=>`src/${f}`),
  ...['raccoon','biomes','investigation'].map(f=>`assets/${f}.webp`),
  ...Object.entries(ASSETS).filter(([id])=>id!=='case').map(([,a])=>`assets/generated/${a.src}.webp`),
  ...['dome-ground','nature-materials','workshop-atlas','terrain-atlas','museum-opening','trail-map','explorer','duck','butterfly','goldfish','bee','snail','bat','hen','field-kit','field-desk'].map(f=>`assets/adventure/${f}.webp`),
  ...['tap','correct','retry','star','stamp','fanfare','talk','step','door','page','drop'].map(f=>`assets/sfx/${f}.mp3`),
  'assets/music/village-theme.mp3',
  ...['frog','crab','duck','rabbit','butterfly','marine','camel','penguin'].flatMap(id=>['mp4','webp'].map(ext=>`assets/videos/motion/${id}.${ext}`)),
  ...['frog','crab','duck','rabbit','butterfly','marine','camel','penguin'].map(f=>`assets/models/${f}.glb`),
  ...['village.json','map-base.webp','map-restored.webp',...['1','2','3','4','5','core','gallery'].map(id=>`restore-${id}.webp`),...['haru','mori','researcher','ranger','engineer'].map(id=>`${id}.webp`),...['talk','enter','lock','unlock','sparkle'].map(id=>`marker-${id}.webp`)].map(f=>`assets/village/${f}`),
  ...['jua-korean-400.woff2','jua-latin-400.woff2','Jua-OFL.txt','Pretendard-Regular.subset.woff2','Pretendard-Bold.subset.woff2','Pretendard-OFL.txt'].map(f=>`assets/fonts/${f}`)];
files.push('src/workspace.css',...['researcher','curator','ranger','detective','engineer'].map(id=>`assets/residents/${id}-v2.webp`),...['researcher','curator','ranger','detective','engineer'].map(id=>`assets/village/npc-${id}.webp`),...[1,2,3,4,5].flatMap(id=>[`assets/tools/${id}-v2.webp`,`assets/village/recovery-${id}-v2.webp`]),'src/landing.css','assets/adventure/title-logo-v1.webp','src/story-player.js','src/story.css',...Object.keys(STORIES).map(kind=>`assets/videos/story/${kind}.mp4`),...['intro','outro'].flatMap(kind=>[1,2,3,4].map(i=>`assets/story/${kind}-0${i}.webp`)));
// Remove only previously generated files named in our own build manifest.
// Authoring assets / unknown files are never recursively removed.
let previous=[];
try{previous=JSON.parse(await readFile(path.join(root,'dist','build-manifest.json'),'utf8')).files||[];}catch{}
for(const item of previous){
  if(typeof item.file!=='string'||files.includes(item.file))continue;
  const target=path.resolve(root,'dist',item.file),relative=path.relative(path.join(root,'dist'),target);
  if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Invalid old build path');
  await unlink(target).catch(error=>{if(error.code!=='ENOENT')throw error;});
}
const manifest=[];
files.push('src/studio-brush.js','src/studio.js','src/studio-views.js','src/studio-runtime.js','src/studio.css','src/readability.css');
for(const file of files){
  const source=path.join(root,file),dest=path.join(root,'dist',file);
  await mkdir(path.dirname(dest),{recursive:true});
  await copyFile(source,dest);
  manifest.push({file,bytes:(await stat(source)).size});
}
for(const css of ['src/adventure.css','src/inquiry.css','src/campaign.css','src/tablet.css']){
  for(const match of (await readFile(path.join(root,css),'utf8')).matchAll(/url\(['"]?(\.\.\/assets\/[^'"\)]+)['"]?\)/g)){
    const asset=path.posix.normalize(path.posix.join('src',match[1]));
    if(!files.includes(asset))throw new Error(`Missing build asset: ${asset}`);
  }
}
await writeFile(path.join(root,'dist','build-manifest.json'),JSON.stringify({version:'0.5.0',files:manifest},null,2));
console.log(`Built ${files.length} runtime files, ${(manifest.reduce((n,f)=>n+f.bytes,0)/1024/1024).toFixed(2)} MiB → dist/`);
