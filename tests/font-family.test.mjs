import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
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
 for(const file of ['NanumSquareNeoTTF-bRg.woff2','NanumSquareNeoTTF-cBd.woff2','NanumSquareNeo-OFL.txt','NanumSquareNeo-SOURCE.json'])assert.ok(build.includes(file));
});
