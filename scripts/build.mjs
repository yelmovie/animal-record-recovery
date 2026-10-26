import { mkdir, copyFile, readFile, writeFile, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ASSETS } from '../src/assets.js';
import { STORIES } from '../src/story-player.js';
import { CONCEPTS } from '../src/concepts.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['index.html',...['korean.js','research-report.js','motion-video.js','tablet.css','campaign.js','campaign-views.js','campaign.css','inquiry.js','inquiry-views.js','inquiry.css','adventure-app.js','expedition.js','model.js','navigation.js','audio.js','drag.js','assets.js','presentation.js','settings-content.js','mission-views.js','shell-views.js','trail-map.js','village.js','adventure.css','view3d.js','stage3d.js','scanner3d.js','dome3d.js',...['three.module.min.js','three.core.min.js','GLTFLoader.js','BufferGeometryUtils.js','LICENSE.txt'].map(f=>`vendor/three/${f}`)].map(f=>`src/${f}`),
  ...['raccoon','biomes','investigation'].map(f=>`assets/${f}.webp`),
  ...Object.entries(ASSETS).filter(([id])=>id!=='case').map(([,a])=>`assets/generated/${a.src}.webp`),
  ...['dome-ground','nature-materials','workshop-atlas','terrain-atlas','museum-opening','trail-map','explorer','duck','butterfly','goldfish','bee','snail','bat','hen','field-kit','field-desk','sparrow','spider','ant','penguin','ostrich','dolphin','mole'].map(f=>`assets/adventure/${f}.webp`),
  ...['tap','correct','retry','star','stamp','fanfare','talk','step','door','page'].map(f=>`assets/sfx/${f}.mp3`),
  'assets/music/village-theme.mp3','assets/adventure/swim-shoe-v2.webp','assets/adventure/swim-blade-v2.webp',...['compare','sorting','verify','link','experiment','showcase','letter-paper','museum-wall','request-hall','exhibit-plaque'].map(f=>`assets/scenes/${f}.webp`),
  ...['frog','crab','duck','rabbit','butterfly','marine','camel','penguin'].flatMap(id=>['mp4','webp'].map(ext=>`assets/videos/motion/${id}.${ext}`)),
  // The scanner loads models/scan/ (40k, 1024px) and the dome models/dome/; full models stay out of the deploy.
  ...['frog','crab','duck','rabbit'].map(f=>`assets/models/scan/${f}.glb`),
  ...['frog','crab','duck','rabbit','butterfly','marine','camel','penguin'].map(f=>`assets/models/dome/${f}.glb`),
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
const buildInfo={sha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),builtAt:new Date().toISOString(),dirty:Boolean(execFileSync('git',['diff','HEAD','--','src','scripts','index.html'],{cwd:root,encoding:'utf8'}).trim())};
files.push('src/record-storage.js','src/build-info.js');
files.push('src/broadcast.css','src/research-diary.css','src/flashlight.js','src/flashlight.css','src/responsive.css','src/museum-notes.css','src/request-sheet.css','assets/fonts/research-hand-400.woff2','assets/fonts/NanumPenScript-OFL.txt',...['observation-notebook','museum-placard','museum-pedestal'].map(f=>`assets/museum/${f}.webp`));
// Concept clips (rendered by tools/concept-clips): WebM, MP4 and the last-frame WebP poster for each id.
files.push('src/concepts.js','src/concept-video.js',...CONCEPTS.flatMap(c=>['webm','mp4','webp'].map(ext=>`assets/concepts/${c.id}.${ext}`)));
files.push('src/stage-map.css','src/layout.css','src/compact.css','src/gallery.css','src/motion-player.css','assets/scenes/museum-gallery-v2.webp','src/studio-brush.js','src/studio.js','src/studio-views.js','src/studio-runtime.js','src/studio.css','src/readability.css');
for(const file of files){
  const source=path.join(root,file),dest=path.join(root,'dist',file);
  await mkdir(path.dirname(dest),{recursive:true});
  if(file==='src/build-info.js')await writeFile(dest,'export const BUILD_INFO='+JSON.stringify(buildInfo)+';\n');else await copyFile(source,dest);
  manifest.push({file,bytes:(await stat(dest)).size,sha256:createHash('sha256').update(await readFile(dest)).digest('hex')});
}
// Check image paths in every stylesheet index.html links, so a newly added sheet can't ship a missing asset.
const sheets=[...(await readFile(path.join(root,'index.html'),'utf8')).matchAll(/<link[^>]+rel="stylesheet"[^>]+href="\.\/(src\/[^"]+\.css)"/g)].map(m=>m[1]);
for(const css of sheets){
  if(!files.includes(css))throw new Error(`Missing build stylesheet: ${css}`);
  for(const match of (await readFile(path.join(root,css),'utf8')).matchAll(/url\(['"]?(\.\.\/assets\/[^'"\)]+)['"]?\)/g)){
    const asset=path.posix.normalize(path.posix.join('src',match[1]));
    if(!files.includes(asset))throw new Error(`Missing build asset: ${asset}`);
  }
}
// One stylesheet instead of ~20: each separate request cost a round trip on classroom Wi-Fi before the first screen.
// Same cascade order as index.html; every sheet lives in src/, so relative url() paths stay valid.
const bundle=(await Promise.all(sheets.map(async css=>`/* ${css} */\n`+await readFile(path.join(root,css),'utf8')))).join('\n');
await writeFile(path.join(root,'dist','src','app.css'),bundle);
manifest.push({file:'src/app.css',bytes:Buffer.byteLength(bundle),sha256:createHash('sha256').update(bundle).digest('hex')});
const html=await readFile(path.join(root,'dist','index.html'),'utf8'),links=[...html.matchAll(/[ \t]*<link[^>]+rel="stylesheet"[^>]+href="\.\/src\/[^"]+\.css"[^>]*>\r?\n?/g)];
let built=html.replace(links[0][0],'<link rel="stylesheet" href="./src/app.css?v='+buildInfo.sha.slice(0,8)+'">\n');for(const m of links.slice(1))built=built.replace(m[0],'');
// Modules otherwise load as a chain (each import found only after its parent arrives). Preload the entry's
// static import graph so they download in parallel; dynamic imports (3D) stay lazy.
const preload=new Set(),walk=async file=>{if(preload.has(file))return;preload.add(file);
  for(const m of (await readFile(path.join(root,file),'utf8')).matchAll(/^\s*import\s[^'"]*?from\s*['"](\.\/[^'"]+)['"]/gm))await walk(path.posix.join(path.posix.dirname(file),m[1]));};
await walk('src/adventure-app.js');
built=built.replace('</head>',[...preload].map(f=>`<link rel="modulepreload" href="./${f}">`).join('\n')+'\n</head>');
await writeFile(path.join(root,'dist','index.html'),built);
manifest.find(f=>f.file==='index.html').bytes=Buffer.byteLength(built);
await writeFile(path.join(root,'dist','build-manifest.json'),JSON.stringify({...buildInfo,version:JSON.parse(await readFile(path.join(root,'package.json'),'utf8')).version,files:manifest},null,2));
console.log(`Built ${files.length} runtime files, ${(manifest.reduce((n,f)=>n+f.bytes,0)/1024/1024).toFixed(2)} MiB → dist/`);
