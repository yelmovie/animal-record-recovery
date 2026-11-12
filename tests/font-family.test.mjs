import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('all application font roles and canvas exports use NanumSquare Neo',async()=>{
 const css=await read('src/inquiry.css');
 assert.match(css,/--font-body:'NanumSquareNeo'/);
 assert.match(css,/--font-display:var\(--font-body\)/);
 assert.match(await read('src/museum-notes.css'),/--font-hand:var\(--font-body\)/);
 assert.doesNotMatch(css,/'Jua'|'Pretendard'/);
 const canvas=await read('src/studio-runtime.js');
 for(const match of canvas.matchAll(/ctx\.font=([^;]+)/g))assert.match(match[1],/NanumSquareNeo/);
 assert.match(canvas,/document\.fonts\.load/);
 const build=await read('scripts/build.mjs');
 for(const file of ['NanumSquareNeoTTF-bRg.woff2','NanumSquareNeoTTF-cBd.woff2','NanumSquareNeo-OFL.txt','NanumSquareNeo-SOURCE.json','landing-regular.woff2','landing-bold.woff2'])assert.ok(build.includes(file));
});

test('every stylesheet uses the shared font or inherits it, including request symbols and colour picker',async()=>{
 for(const name of await readdir(new URL('../src/',import.meta.url))){
  if(!name.endsWith('.css')||name.startsWith('._'))continue;
  const css=(await read('src/'+name)).replace(/\/\*[\s\S]*?\*\//g,'');
  for(const [,family] of css.matchAll(/font-family\s*:\s*([^;}]+)/g)){
   // The two landing faces are glyph subsets of NanumSquare Neo with an OFL-safe name.
   if(name==='landing.css'&&/^'AnimalRecordLanding'(?:, var\(--font-body\)|, system-ui, sans-serif)?$/.test(family.trim()))continue;
   assert.match(family,/^(?:['"]?NanumSquareNeo|var\(--font-|inherit)/,name+': '+family);
  }
 }
});
