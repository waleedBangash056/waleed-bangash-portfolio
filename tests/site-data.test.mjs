import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(path.join(root, 'data/site-data.json'), 'utf8'));
const { buildWhatsAppUrl } = await import('../tools/site-data.mjs');

test('publishes the approved display identity and exact contact channels', () => {
  assert.equal(data.profile.displayName, 'Waleed Bangash');
  assert.equal(data.profile.role, 'Frontend & Full-Stack Web Developer');
  assert.equal(data.profile.email, 'wbangash053@gmail.com');
  assert.equal(data.profile.whatsappDigits, '923329275154');
  assert.equal(data.profile.github, 'https://github.com/waleedBangash056');
  assert.equal(data.profile.linkedin, 'https://www.linkedin.com/in/waleed-ahmed-khan-31807b3b1');
});

test('encodes the one approved WhatsApp message into a wa.me URL', () => {
  const expectedMessage = "Hi Waleed, I'm interested in discussing a website development project.";
  assert.equal(data.profile.whatsappMessage, expectedMessage);
  const url = new URL(buildWhatsAppUrl(data.profile));
  assert.equal(url.origin + url.pathname, 'https://wa.me/923329275154');
  assert.equal(url.searchParams.get('text'), expectedMessage);
  assert.equal(url.pathname.includes('+'), false);
});

test('includes unique project entries with resolvable local media', async () => {
  const projects = data.projects;
  assert.deepEqual(projects.map(({ id }) => id), ['nexora-one', 'cowboy-burger', 'cafe-aroma', 'smash-and-sizzle']);
  assert.equal(new Set(projects.map(({ id }) => id)).size, projects.length);
  for (const project of projects) {
    assert.ok(project.title);
    assert.ok(project.status);
    assert.ok(project.description);
    assert.ok(project.image);
    await assert.doesNotReject(readFile(path.join(root, 'public', project.image.replace(/^\//, ''))));
  }
  const nexoraProject = projects[0];
  assert.equal(nexoraProject.demoUrl, 'https://nexora-one-dusky.vercel.app');
  assert.equal(nexoraProject.demoOpenMode, 'responsive', 'Nexora should open a new tab for desktop pointers and stay in the current tab on touch devices');
  assert.equal(nexoraProject.primaryActionId, 'nexora-live');
  assert.equal(projects.some(({ demoUrl }) => demoUrl === 'https://nexora-one.onrender.com'), false);
  const smashAndSizzle = projects.find(({ id }) => id === 'smash-and-sizzle');
  assert.ok(smashAndSizzle, 'new restaurant project is included');
  assert.equal(smashAndSizzle.title, 'Smash & Sizzle');
  assert.equal(smashAndSizzle.demoUrl, 'https://smash-and-sizzle-demo.vercel.app');
  assert.equal(smashAndSizzle.sourceUrl, 'https://github.com/waleedBangash056/fast-food-ordering-system');
  assert.equal(smashAndSizzle.number, '04');
  assert.equal(smashAndSizzle.primaryLinkLabel, 'Open demo');
  assert.ok(smashAndSizzle.features.length >= 3);
  await assert.doesNotReject(readFile(path.join(root, 'public', smashAndSizzle.image.replace(/^\//, ''))));
  await assert.doesNotReject(readFile(path.join(root, 'public', smashAndSizzle.imageSmall.replace(/^\//, ''))));
  assert.equal(nexoraProject.title, 'Nexora One');
  assert.equal(nexoraProject.layout, 'wide');
  assert.match(nexoraProject.image, /nexora-one\.webp$/);
});

test('keeps production-domain metadata unset until the owner supplies a domain', async () => {
  const html = await readFile(path.join(root, 'src/index.template.html'), 'utf8');
  assert.equal(data.profile.productionDomain, '');
  assert.doesNotMatch(html, /<link[^>]+rel=["']canonical/i);
  assert.doesNotMatch(html, /property=["']og:url/i);
});


test('includes a factual four-part introduction script for voice and caption playback', () => {
  const segments = data.profile.introSegments;
  assert.equal(segments.length, 4);
  assert.deepEqual(segments.map(({ phase }) => phase), ['opening', 'craft', 'detail', 'invitation']);
  for (const segment of segments) {
    assert.ok(segment.title.trim());
    assert.ok(segment.caption.trim());
    assert.ok(segment.spoken.trim());
    assert.equal(segment.spoken.includes('undefined'), false);
  }
  assert.match(segments[0].spoken, /Waleed Bangash/);
  assert.match(segments[1].spoken, /thoughtful digital experiences/);
  assert.match(segments[2].spoken, /bold design, smooth interactions, and reliable engineering/);
  assert.match(segments[3].spoken, /Welcome to my portfolio/);
});
