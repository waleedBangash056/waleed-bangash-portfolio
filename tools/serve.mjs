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
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};
const server = createServer(async (request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname); }
  catch { response.writeHead(400).end('Bad Request'); return; }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const target = path.resolve(dist, `.${pathname}`);
  if (!target.startsWith(`${dist}${path.sep}`) && target !== path.join(dist, 'index.html')) {
    response.writeHead(403).end('Forbidden'); return;
  }
  try {
    const body = await readFile(target);
    response.writeHead(200, { 'content-type': mime[path.extname(target)] ?? 'application/octet-stream', 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff' });
    response.end(body);
  } catch (error) {
    const isMissing = error?.code === 'ENOENT' || error?.code === 'ENOTDIR';
    response.writeHead(isMissing ? 404 : 500, { 'content-type': 'text/plain; charset=utf-8' }).end(isMissing ? 'Not Found' : 'Internal Server Error');
  }
});
const port = Number(process.env.PORT ?? 4173);
server.listen(port, '127.0.0.1', () => console.log(`Portfolio preview: http://127.0.0.1:${port}`));
