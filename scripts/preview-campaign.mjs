// Isolated manual QA server. Seeds only its own empty localhost storage. The
// fixture and this script are deliberately absent from the deployment manifest.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {campaignFixture} from '../tests/fixtures/campaign-state.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const seed=JSON.stringify(campaignFixture()).replaceAll('<','\\u003c');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.json':'application/json','.glb':'model/gltf-binary','.woff2':'font/woff2','.mp3':'audio/mpeg'};
http.createServer(async(req,res)=>{try{
 const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname)),rel=path.relative(root,file);
 if(rel.startsWith('..')||path.isAbsolute(rel)||!['index.html','src','assets'].includes(rel.split(path.sep)[0])){res.writeHead(404);res.end();return;}
 let data=await readFile(file);if(rel==='index.html')data=data.toString().replace('<script type="module"',`<script>if(!localStorage.getItem('animal-record-recovery:v1'))localStorage.setItem('animal-record-recovery:v1',JSON.stringify(${seed}));</script><script type="module"`);
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end();}}).listen(4178,'127.0.0.1',()=>console.log('Commission QA fixture: http://127.0.0.1:4178'));
