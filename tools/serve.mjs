import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
if (process.argv.includes('--build')) {
  const result = spawnSync(process.execPath, [path.join(root, 'tools/build.mjs')], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
try { await stat(path.join(dist, 'index.html')); } catch {
  console.error('No dist/index.html found. Run `npm run build` or use `npm run dev`.');
  process.exit(1);
}
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.vtt': 'text/vtt; charset=utf-8'
};
const mediaTypes = new Set(['.mp4', '.webm']);

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { allow: 'GET, HEAD' }).end('Method Not Allowed');
    return;
  }

  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname); }
  catch { response.writeHead(400).end('Bad Request'); return; }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const target = path.resolve(dist, `.${pathname}`);
  if (!target.startsWith(`${dist}${path.sep}`) && target !== path.join(dist, 'index.html')) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const info = await stat(target);
    if (!info.isFile()) { response.writeHead(404).end('Not Found'); return; }
    const extension = path.extname(target).toLowerCase();
    const isMedia = mediaTypes.has(extension);
    const headers = {
      'content-type': mime[extension] ?? 'application/octet-stream',
      'cache-control': 'no-cache',
      'x-content-type-options': 'nosniff',
      'content-length': info.size,
      ...(isMedia ? { 'accept-ranges': 'bytes' } : {})
    };

    if (isMedia && request.headers.range) {
      const rangeMatch = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range.trim());
      if (!rangeMatch || (!rangeMatch[1] && !rangeMatch[2])) {
        response.writeHead(416, { ...headers, 'content-range': `bytes */${info.size}` }).end();
        return;
      }
      let start;
      let end;
      if (!rangeMatch[1]) {
        const suffixLength = Number(rangeMatch[2]);
        if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
          response.writeHead(416, { ...headers, 'content-range': `bytes */${info.size}` }).end();
          return;
        }
        start = Math.max(0, info.size - suffixLength);
        end = info.size - 1;
      } else {
        start = Number(rangeMatch[1]);
        end = rangeMatch[2] ? Number(rangeMatch[2]) : info.size - 1;
      }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= info.size || end < start) {
        response.writeHead(416, { ...headers, 'content-range': `bytes */${info.size}` }).end();
        return;
      }
      end = Math.min(end, info.size - 1);
      const length = end - start + 1;
      response.writeHead(206, {
        ...headers,
        'content-length': length,
        'content-range': `bytes ${start}-${end}/${info.size}`
      });
      if (request.method === 'HEAD') { response.end(); return; }
      createReadStream(target, { start, end }).pipe(response);
      return;
    }

    response.writeHead(200, headers);
    if (request.method === 'HEAD') { response.end(); return; }
    response.end(await readFile(target));
  } catch (error) {
    const isMissing = error?.code === 'ENOENT' || error?.code === 'ENOTDIR';
    if (response.headersSent) { response.destroy(); return; }
    response.writeHead(isMissing ? 404 : 500, { 'content-type': 'text/plain; charset=utf-8' }).end(isMissing ? 'Not Found' : 'Internal Server Error');
  }
});
const port = Number(process.env.PORT ?? 4173);
server.listen(port, '127.0.0.1', () => console.log(`Portfolio preview: http://127.0.0.1:${port}`));
