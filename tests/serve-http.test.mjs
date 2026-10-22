import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function unusedLocalPort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const address = probe.address();
  if (!address || typeof address === 'string') throw new Error('Could not reserve a local test port');
  const { port } = address;
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Preview server exited early with code ${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(300) });
      if (response.ok) { await response.arrayBuffer(); return; }
    } catch { /* Server is still starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  throw new Error('Preview server did not start within five seconds');
}

test('local media server supports byte ranges and correct media types', async () => {
  const port = await unusedLocalPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [path.join(root, 'tools/serve.mjs')], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore'
  });
  try {
    await waitForServer(baseUrl, child);
    const mediaPath = '/assets/waleed-introduction-alpha.webm';
    const expected = await readFile(path.join(root, 'dist/assets/waleed-introduction-alpha.webm'));
    const rangeResponse = await fetch(`${baseUrl}${mediaPath}`, { headers: { Range: 'bytes=0-127' } });
    assert.equal(rangeResponse.status, 206);
    assert.equal(rangeResponse.headers.get('content-type'), 'video/webm');
    assert.equal(rangeResponse.headers.get('accept-ranges'), 'bytes');
    assert.equal(rangeResponse.headers.get('content-range'), `bytes 0-127/${expected.length}`);
    assert.deepEqual(Buffer.from(await rangeResponse.arrayBuffer()), expected.subarray(0, 128));

    const headResponse = await fetch(`${baseUrl}/assets/waleed-introduction-source.mp4`, { method: 'HEAD' });
    assert.equal(headResponse.status, 200);
    assert.equal(headResponse.headers.get('content-type'), 'video/mp4');
    assert.equal(headResponse.headers.get('accept-ranges'), 'bytes');
    assert.equal(headResponse.headers.get('content-length'), String((await readFile(path.join(root, 'dist/assets/waleed-introduction-source.mp4'))).length));

    const invalidRange = await fetch(`${baseUrl}${mediaPath}`, { headers: { Range: 'bytes=999999999-999999999' } });
    assert.equal(invalidRange.status, 416);
    assert.match(invalidRange.headers.get('content-range') ?? '', /^bytes \*\//);
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => {
      if (child.exitCode !== null) resolve();
      else { child.once('exit', resolve); setTimeout(resolve, 1000).unref(); }
    });
  }
});
