import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
const css = await readFile(path.join(root, 'dist/styles/site.css'), 'utf8');
const scrollStory = await readFile(path.join(root, 'dist/app/scroll-story.js'), 'utf8');
const data = JSON.parse(await readFile(path.join(root, 'data/site-data.json'), 'utf8'));

test('generated HTML resolves every token and includes the complete semantic journey', async () => {
  assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
  for (const id of ['top', 'work', 'capabilities', 'approach', 'about', 'contact']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /Skip to content/);
  assert.match(html, /id="scene-artwork"/);
  assert.match(html, /id="play-intro"/);
  assert.match(html, /id="intro-theatre"/);
  assert.match(html, /id="intro-avatar-video"/);
  assert.match(html, /data-video-ready="true"/);
  assert.match(html, /data-renderer="alpha-webm"/);
  assert.match(html, /intro-studio\.webp/);
  const introJson = html.match(/<script id="intro-script-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(introJson, 'the data-driven intro script is embedded as inert JSON');
  assert.deepEqual(JSON.parse(introJson), data.profile.introSegments);
  assert.match(html, /id="stop-intro"[^>]+hidden/);
  assert.match(html, /role="progressbar"/);
  assert.match(html, /class="scene-stage[^"]*"[\s\S]*?scene-artwork/);
  assert.match(html, /data-reveal/);
  assert.match(html, /Nexora One/);
  assert.match(html, /https:\/\/nexora-one-dusky\.vercel\.app/);
  assert.doesNotMatch(html, /https:\/\/nexora-one\.onrender\.com/);
  assert.match(html, /https:\/\/smash-and-sizzle-demo\.vercel\.app/);
  assert.match(html, /Smash &amp; Sizzle/);
  assert.match(html, /signature-sculpture\.webp/);
  assert.match(html, /favicon-32\.png/);
  assert.match(html, /aria-label="Primary navigation"/);
  assert.equal((html.match(/class="project project--/g) ?? []).length, 4);
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
  const mainScript = await readFile(path.join(root, 'dist/app/main.js'), 'utf8');
  assert.match(mainScript, /intro-avatar-video/);
  assert.doesNotMatch(mainScript, /speechSynthesis|SpeechSynthesisUtterance/);
  assert.match(mainScript, /prefers-reduced-motion/);
  assert.match(css, /intro-theatre/);
  assert.match(css, /intro-world-architecture/);
  assert.match(css, /intro-avatar-still/);
  assert.match(css, /intro-avatar-canvas/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*?intro-theatre/s);
  assert.match(css, /perspective\([0-9]+px\)/);
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


test('Nexora CTA defaults to a safe desktop new tab while touch devices keep same-tab navigation', async () => {
  const article = html.match(/<article class="project project--nexora[\s\S]*?<\/article>/)?.[0];
  assert.ok(article, 'Nexora project is rendered');
  const action = article.match(/<a class="project-link project-link-primary"[^>]*>Open website[\s\S]*?<\/a>/)?.[0];
  assert.ok(action, 'the Open website CTA is rendered');
  assert.match(action, /href="https:\/\/nexora-one-dusky\.vercel\.app"/);
  assert.match(action, /target="_blank"/);
  assert.match(action, /rel="noopener noreferrer"/);
  assert.match(action, /data-project-open-mode="responsive"/);
  assert.match(action, /data-project-action="nexora-live"/);
  const mainScript = await readFile(path.join(root, 'dist/app/main.js'), 'utf8');
  assert.match(mainScript, /data-project-open-mode/);
  assert.match(mainScript, /function updateResponsiveProjectTargets/);
  assert.match(mainScript, /link\.target = finePointer\.matches \? '_blank' : '_self'/);
});

test('desktop project-action hit areas stay stable during hover', () => {
  const cardHover = css.match(/\.project:hover \.project-info--smoked\s*\{([^}]+)\}/)?.[1];
  assert.ok(cardHover, 'project card hover styling exists');
  assert.doesNotMatch(cardHover, /transform\s*:/, 'hover should not move the parent panel away from the pointer');
  const linkHover = css.match(/\.project-info--smoked \.project-link:hover\s*\{([^}]+)\}/)?.[1];
  assert.ok(linkHover, 'project link hover styling exists');
  assert.doesNotMatch(linkHover, /transform\s*:/, 'hover should keep the CTA hit box stable');
  assert.match(css, /\.project-info--smoked \.project-link\s*\{[^}]*cursor:\s*pointer/s);
  assert.match(css, /\.project-info--smoked \.project-links\s*\{[^}]*pointer-events:\s*auto/s);
});

test('generated project links show all four requested projects and honest project actions', () => {
  assert.match(html, /Open website/);
  assert.match(html, /Open demo/);
  assert.match(html, /Open concept/);
  assert.match(html, /View source/);
  assert.match(html, /Nexora One/);
  assert.match(html, /Aurelia Living/);
  assert.match(html, /Café Aroma/);
  assert.match(html, /Cowboy Burger/);
  assert.match(html, /Smash &amp; Sizzle/);
  assert.match(html, /04 \/ 04/);
  assert.match(html, /04<\/span><span>Website demo<\/span>/);
  assert.match(html, /SELECTED WORK \/ 04/);
  assert.match(html, /01—04/);
  assert.match(html, /project--smash/);
  assert.match(html, /smash-and-sizzle\.webp/);
  assert.match(html, /Screenshot of the Smash &amp; Sizzle restaurant website/);
  assert.match(css, /project--smash[^{}]*\{[^}]*aspect-ratio:\s*1600\s*\/\s*780/s);
});

test('local preview declares the correct media types for video and WebVTT captions', async () => {
  const server = await readFile(path.join(root, 'tools/serve.mjs'), 'utf8');
  assert.match(server, /['"]\.mp4['"]\s*:\s*['"]video\/mp4['"]/);
  assert.match(server, /['"]\.webm['"]\s*:\s*['"]video\/webm['"]/);
  assert.match(server, /['"]\.vtt['"]\s*:\s*['"]text\/vtt; charset=utf-8['"]/);
});

test('intro studio backdrop is copied to the production site', async () => {
  await assert.doesNotReject(readFile(path.join(root, 'dist/assets/intro-studio.webp')));
});

test('favicon files are copied to the production site', async () => {
  assert.match(html, /rel="icon"[^>]*favicon\.svg/);
  assert.match(html, /favicon-32\.png/);
  await assert.doesNotReject(readFile(path.join(root, 'dist/assets/favicon.svg')));
  await assert.doesNotReject(readFile(path.join(root, 'dist/assets/favicon-32.png')));
  await assert.doesNotReject(readFile(path.join(root, 'dist/assets/apple-touch-icon.png')));
  await assert.doesNotReject(readFile(path.join(root, 'dist/assets/favicon.ico')));
});

test('transparent talking avatar uses the generated alpha video and real MP4 fallback', async () => {
  assert.match(html, /class="intro-button-title">Meet me · 10 seconds<\/strong>/);
  assert.doesNotMatch(html, /id="play-intro"[^>]*disabled/);
  assert.match(html, /waleed-introduction-alpha\.webm/);
  assert.match(html, /waleed-introduction-source\.mp4/);
  assert.match(html, /waleed-avatar-poster\.webp/);
  const mainScript = await readFile(path.join(root, 'dist/app/main.js'), 'utf8');
  assert.doesNotMatch(mainScript, /speechSynthesis|SpeechSynthesisUtterance/);
  assert.match(mainScript, /createAvatarCanvasKeyer/);
  const alphaVideo = await readFile(path.join(root, 'dist/assets/waleed-introduction-alpha.webm'));
  assert.deepEqual([...alphaVideo.subarray(0, 4)], [0x1a, 0x45, 0xdf, 0xa3]);
  const manifest = JSON.parse(await readFile(path.join(root, 'data/intro-media-manifest.json'), 'utf8'));
  for (const [file, expectedHash] of [
    [manifest.alphaVideoFile, manifest.alphaVideoSha256],
    [manifest.sourceVideoFile, manifest.sourceVideoSha256],
    [manifest.posterFile, manifest.posterSha256],
  ]) {
    const bytes = await readFile(path.join(root, 'dist/assets', file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash, `${file} must match the reviewed media manifest`);
  }
  assert.equal(manifest.validation.alphaPlaneChecked, true);
  assert.equal(manifest.validation.audioPreserved, true);
  const matteCorrection = manifest.validation.localizedMatteCorrection;
  assert.equal(matteCorrection.applied, true);
  assert.equal(matteCorrection.framesAudited, 240);
  assert.deepEqual(matteCorrection.beforeAfterReviewedAtSeconds, [0, 1, 2, 8, 9]);
  assert.equal(matteCorrection.opaqueBackgroundComponentsRemainingInTargetRegions, 0);
  assert.equal(matteCorrection.postEncodeAlphaPlaneRevalidated, true);
  assert.deepEqual(matteCorrection.regions.map((region) => region.id), [
    'left-hand-negative-space',
    'inner-elbow-negative-space',
  ]);
  await assert.doesNotReject(readFile(path.join(root, 'dist/assets/smash-and-sizzle.webp')));
  await assert.doesNotReject(readFile(path.join(root, 'dist/assets/smash-and-sizzle-640.webp')));
});


test('hero renders the avatar as a full-scene layer rather than a framed video card', async () => {
  assert.match(html, /class="intro-world-architecture"/);
  assert.match(html, /class="intro-world-floor"/);
  assert.match(html, /class="intro-avatar-still"[^>]+waleed-avatar-poster\.webp/);
  assert.match(css, /\.intro-theatre\[data-video-ready="true"\]\s*\{[^}]*overflow:\s*visible;[^}]*border:\s*0;[^}]*border-radius:\s*0;/s);
  assert.match(css, /\.intro-theatre\[data-video-ready="true"\] \.intro-avatar-plane \{ display: none; \}/);
  assert.match(css, /\.intro-avatar-video \{[^}]*background:\s*transparent/s);
});

test('avatar video only fades in after media playback genuinely starts', async () => {
  const mainScript = await readFile(path.join(root, 'dist/app/main.js'), 'utf8');
  assert.match(html, /data-media-started="false"/);
  assert.match(css, /data-state="playing"\]\[data-media-started="true"\] \.intro-avatar-video \{ opacity: 1; \}/);
  assert.match(css, /data-state="playing"\]\[data-media-started="true"\] \.intro-avatar-still \{ opacity: 0; \}/);
  assert.match(mainScript, /dataset\.mediaStarted = 'true'/);
  assert.match(mainScript, /introStage\.dataset\.mediaStarted = 'false'/);
});

test('the avatar surround is open architectural depth, not an enclosed video frame', () => {
  assert.match(css, /\.intro-world-arch \{[^}]*border-bottom:\s*0;/s);
  assert.match(css, /\.intro-world-arch::before/);
  assert.match(css, /\.intro-world-floor \{[^}]*perspective\(520px\)/s);
  assert.match(css, /@keyframes intro-world-arch-drift/);
});

test('deployment includes explicit media MIME types for shared hosting', async () => {
  const htaccess = await readFile(path.join(root, 'dist/.htaccess'), 'utf8');
  assert.match(htaccess, /AddType video\/webm \.webm/);
  assert.match(htaccess, /AddType video\/mp4 \.mp4/);
  assert.match(htaccess, /AddType image\/webp \.webp/);
});
