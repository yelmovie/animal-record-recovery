import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), process.argv[2] || '.');
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.glb':'model/gltf-binary' };
const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const target = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = path.resolve(root, '.' + target);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !['index.html','src','assets'].includes(relative.split(path.sep)[0])) { res.writeHead(404); return res.end('Not found'); }
    const data = await readFile(file);
    res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
const port=Number(process.env.PORT)||4173;
server.listen(port, '127.0.0.1', () => console.log(`Animal Record Recovery: http://127.0.0.1:${port}`));
