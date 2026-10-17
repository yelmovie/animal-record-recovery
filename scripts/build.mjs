import { mkdir, copyFile, readFile, writeFile, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSETS } from '../src/assets.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['index.html',...['inquiry.js','inquiry-views.js','inquiry.css','adventure-app.js','expedition.js','model.js','navigation.js','audio.js','drag.js','assets.js','presentation.js','mission-views.js','shell-views.js','trail-map.js','adventure.css'].map(f=>`src/${f}`),
  ...['raccoon','biomes','investigation'].map(f=>`assets/${f}.webp`),
  ...Object.entries(ASSETS).filter(([id])=>id!=='case').map(([,a])=>`assets/generated/${a.src}.webp`),
  ...['trail-map','explorer','duck','butterfly','goldfish','bee','snail','bat','hen','field-kit','field-desk'].map(f=>`assets/adventure/${f}.webp`),
  ...['tap','correct','retry','star','stamp','fanfare'].map(f=>`assets/sfx/${f}.mp3`),
  ...['jua-korean-400.woff2','jua-latin-400.woff2','Jua-OFL.txt','Pretendard-Regular.subset.woff2','Pretendard-Bold.subset.woff2','Pretendard-OFL.txt'].map(f=>`assets/fonts/${f}`)];
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
for(const file of files){
  const source=path.join(root,file),dest=path.join(root,'dist',file);
  await mkdir(path.dirname(dest),{recursive:true});
  await copyFile(source,dest);
  manifest.push({file,bytes:(await stat(source)).size});
}
for(const css of ['src/adventure.css','src/inquiry.css']){
  for(const match of (await readFile(path.join(root,css),'utf8')).matchAll(/url\(['"]?(\.\.\/assets\/[^'"\)]+)['"]?\)/g)){
    const asset=path.posix.normalize(path.posix.join('src',match[1]));
    if(!files.includes(asset))throw new Error(`Missing build asset: ${asset}`);
  }
}
await writeFile(path.join(root,'dist','build-manifest.json'),JSON.stringify({version:'0.4.0',files:manifest},null,2));
console.log(`Built ${files.length} runtime files, ${(manifest.reduce((n,f)=>n+f.bytes,0)/1024/1024).toFixed(2)} MiB → dist/`);
