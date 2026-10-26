// Static assets answer Range requests with the whole file (200), and iPad Safari will not play an mp4
// without 206 partial responses. Videos go through this worker, which slices the asset for the range.
// ponytail: buffers the whole file per request (videos are ≤20 MB); stream-slice it if larger media arrive.
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('Range') || '');
    if (!range || response.status !== 200 || response.headers.has('Content-Range')) return response;
    const body = await response.arrayBuffer(), size = body.byteLength;
    const start = range[1] === '' ? Math.max(0, size - Number(range[2])) : Number(range[1]);
    const end = range[1] === '' || range[2] === '' ? size - 1 : Math.min(Number(range[2]), size - 1);
    const headers = new Headers(response.headers);
    headers.set('Accept-Ranges', 'bytes');
    if (start >= size || start > end) {
      headers.set('Content-Range', `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(body.slice(start, end + 1), { status: 206, headers });
  },
};
