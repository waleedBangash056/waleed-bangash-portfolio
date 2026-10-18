import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
const css = await readFile(path.join(root, 'dist/styles/site.css'), 'utf8');
const scrollStory = await readFile(path.join(root, 'dist/app/scroll-story.js'), 'utf8');
const data = JSON.parse(await readFile(path.join(root, 'data/site-data.json'), 'utf8'));

test('generated HTML resolves every token and includes the complete semantic journey', () => {
  assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
  for (const id of ['top', 'work', 'capabilities', 'approach', 'about', 'contact']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /Skip to content/);
  assert.match(html, /id="scene-artwork"/);
  assert.match(html, /class="scene-stage[^"]*"[\s\S]*?scene-artwork/);
  assert.match(html, /data-reveal/);
  assert.match(html, /Nexora One/);
  assert.match(html, /https:\/\/nexora-one\.onrender\.com/);
  assert.match(html, /signature-sculpture\.webp/);
  assert.match(html, /favicon-32\.png/);
  assert.match(html, /aria-label="Primary navigation"/);
  assert.equal((html.match(/class="project project--/g) ?? []).length, 3);
  assert.ok(html.includes(data.profile.aboutCopy), 'about copy is rendered from the central profile object');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size, 'generated HTML IDs are unique');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /backdrop-filter:\s*blur\(3[0-9]px\)/);
  assert.match(css, /--journey-x/);
  assert.match(css, /\.capability-intro[^{]*\{[^}]*backdrop-filter/s);
  assert.match(css, /\.footer-main\s*\{[^}]*border:\s*1px solid/s);
  assert.match(scrollStory, /scene-artwork/);
  assert.match(scrollStory, /data-reveal/);
  assert.match(scrollStory, /--journey-rotate-x/);
  assert.match(scrollStory, /getBoundingClientRect/);
});

test('generated contact links use the profile source and encoded WhatsApp message', () => {
  assert.ok(html.includes(`href="mailto:${data.profile.email}"`));
  assert.ok(html.includes(`href="${encodeURI(data.profile.linkedin)}"`) || html.includes(data.profile.linkedin));
  const encodedHref = html.match(/href="(https:\/\/wa\.me\/[^"]+)"/)?.[1];
  assert.ok(encodedHref);
  const whatsappUrl = new URL(encodedHref.replace(/&amp;/g, '&').replace(/&#39;/g, '\''));
  assert.equal(whatsappUrl.origin + whatsappUrl.pathname, 'https://wa.me/923329275154');
  assert.equal(whatsappUrl.searchParams.get('text'), data.profile.whatsappMessage);
  assert.ok(html.includes(data.profile.github));
});

test('generated project links show all three requested projects and honest project actions', () => {
  assert.match(html, /Open website/);
  assert.match(html, /Open demo/);
  assert.match(html, /Open concept/);
  assert.match(html, /View source/);
  assert.match(html, /Nexora One/);
  assert.match(html, /Aurelia Living/);
  assert.match(html, /Café Aroma/);
  assert.match(html, /Cowboy Burger/);
});

test('favicon files are copied to the production site', async () => {
  assert.match(html, /rel="icon"[^>]*favicon\.svg/);
  assert.match(html, /favicon-32\.png/);
  await assert.doesNotReject(readFile(path.join(root, 'dist/assets/favicon.svg')));
  await assert.doesNotReject(readFile(path.join(root, 'dist/assets/favicon-32.png')));
  await assert.doesNotReject(readFile(path.join(root, 'dist/assets/apple-touch-icon.png')));
  await assert.doesNotReject(readFile(path.join(root, 'dist/assets/favicon.ico')));
});
