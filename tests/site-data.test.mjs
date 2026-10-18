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

test('features only evidence-backed projects with distinct IDs and local imagery', async () => {
  const projects = data.projects;
  assert.deepEqual(projects.map(({ id }) => id), ['nexora-one', 'cowboy-burger', 'cafe-aroma']);
  assert.equal(new Set(projects.map(({ id }) => id)).size, projects.length);
  for (const project of projects) {
    assert.ok(project.title);
    assert.ok(project.status);
    assert.ok(project.description);
    assert.ok(project.image);
    await assert.doesNotReject(readFile(path.join(root, 'public', project.image.replace(/^\//, ''))));
  }
  const nexoraProject = projects[0];
  assert.equal(nexoraProject.demoUrl, 'https://nexora-one.onrender.com');
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
