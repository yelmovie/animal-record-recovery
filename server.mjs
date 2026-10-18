import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), process.argv[2] || '.');
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.mp4':'video/mp4','.glb':'model/gltf-binary' };
const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const target = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = path.resolve(root, '.' + target);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !['index.html','src','assets'].includes(relative.split(path.sep)[0])) { res.writeHead(404); return res.end('Not found'); }
    const data = await readFile(file);
    const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
    const range=req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    if(req.headers.range){
      let start=range?.[1]?Number(range[1]):Math.max(0,data.length-Number(range?.[2])),end=range?.[1]?(range[2]?Math.min(Number(range[2]),data.length-1):data.length-1):data.length-1;
      if(!range||(!range[1]&&!range[2])||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>end||start>=data.length){res.writeHead(416,{'Content-Range':`bytes */${data.length}`});return res.end();}
      res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});return res.end(data.subarray(start,end+1));
    }
    res.writeHead(200,{...headers,'Content-Length':data.length});res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
const port=Number(process.env.PORT)||4173;
server.listen(port, '127.0.0.1', () => console.log(`Animal Record Recovery: http://127.0.0.1:${port}`));
