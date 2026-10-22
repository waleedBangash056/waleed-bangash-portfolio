import { createHash } from 'node:crypto';
import { rm, mkdir, readFile, writeFile, cp, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildWhatsAppUrl, escapeHtml, safeExternalUrl } from './site-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const data = JSON.parse(await readFile(path.join(root, 'data/site-data.json'), 'utf8'));
const template = await readFile(path.join(root, 'src/index.template.html'), 'utf8');
const { profile, projects } = data;
const introVideoPath = path.join(root, 'public/assets/waleed-introduction-alpha.webm');
const introKeyVideoPath = path.join(root, 'public/assets/waleed-introduction-source.mp4');
const introPosterPath = path.join(root, 'public/assets/waleed-avatar-poster.webp');
const introManifestPath = path.join(root, 'data/intro-media-manifest.json');
const introCaptionsPath = path.join(root, 'public/assets/waleed-introduction.vtt');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
let introVideoReady = false;
if (existsSync(introVideoPath) && existsSync(introKeyVideoPath) && existsSync(introPosterPath) && existsSync(introManifestPath)) {
  const [alphaBytes, keyBytes, posterBytes, manifest] = await Promise.all([
    readFile(introVideoPath),
    readFile(introKeyVideoPath),
    readFile(introPosterPath),
    readFile(introManifestPath, 'utf8').then(JSON.parse),
  ]);
  const webmSignature = alphaBytes.length > 50000 && alphaBytes[0] === 0x1a && alphaBytes[1] === 0x45 && alphaBytes[2] === 0xdf && alphaBytes[3] === 0xa3;
  const mp4Signature = keyBytes.length > 1024 && keyBytes.toString('ascii', 4, 8) === 'ftyp';
  const webpSignature = posterBytes.length > 1024 && posterBytes.toString('ascii', 0, 4) === 'RIFF' && posterBytes.toString('ascii', 8, 12) === 'WEBP';
  const exactReviewedAssets = manifest.schemaVersion === 1 &&
    manifest.alphaVideoFile === path.basename(introVideoPath) && sha256(alphaBytes) === manifest.alphaVideoSha256 &&
    manifest.sourceVideoFile === path.basename(introKeyVideoPath) && sha256(keyBytes) === manifest.sourceVideoSha256 &&
    manifest.posterFile === path.basename(introPosterPath) && sha256(posterBytes) === manifest.posterSha256 &&
    manifest.validation?.format === 'WebM / VP9 with an alpha plane and Opus audio' &&
    manifest.validation?.alphaPlaneChecked === true && manifest.validation?.audioPreserved === true &&
    Array.isArray(manifest.validation?.alphaPlaneSignalRange) && manifest.validation.alphaPlaneSignalRange[0] === 0 && manifest.validation.alphaPlaneSignalRange[1] === 255 &&
    manifest.validation?.frames === 240 && manifest.validation?.fps === 24 && manifest.validation?.width === 720 && manifest.validation?.height === 1280 &&
    Number.isFinite(manifest.validation?.durationSeconds) && manifest.validation.durationSeconds >= 9.8 && manifest.validation.durationSeconds <= 10.2;
  // Header checks alone cannot prove alpha exists. The recorded, frame-by-frame alpha QA is
  // bound to the exact three media assets using SHA-256 so an accidental replacement fails closed.
  introVideoReady = webmSignature && mp4Signature && webpSignature && exactReviewedAssets;
}
const introCaptionsReady = introVideoReady && existsSync(introCaptionsPath) && (await stat(introCaptionsPath)).size > 0;
const introTranscript = (profile.introSegments || []).map((segment) => segment.spoken).join(' ');

function renderProject(project, index) {
  const image = safeExternalUrl(`https://local.invalid${project.image}`).replace('https://local.invalid', '');
  const imageSmall = safeExternalUrl(`https://local.invalid${project.imageSmall}`).replace('https://local.invalid', '');
  const imageWidth = Number.isInteger(project.imageWidth) ? project.imageWidth : 1200;
  const imageHeight = Number.isInteger(project.imageHeight) ? project.imageHeight : 867;
  const imageSmallWidth = Number.isInteger(project.imageSmallWidth) ? project.imageSmallWidth : 640;
  const features = project.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('');
  const validatedDemoUrl = safeExternalUrl(project.demoUrl);
  const parsedDemoUrl = new URL(validatedDemoUrl);
  const demoUrl = ['same-tab', 'responsive'].includes(project.demoOpenMode) && parsedDemoUrl.pathname === '/' && !parsedDemoUrl.search && !parsedDemoUrl.hash
    ? parsedDemoUrl.origin
    : validatedDemoUrl;
  const demoTarget = project.demoOpenMode === 'same-tab' ? '_self' : '_blank';
  const demoRel = demoTarget === '_blank' ? ' rel="noopener noreferrer"' : '';
  const responsiveOpenMode = project.demoOpenMode === 'responsive' ? ' data-project-open-mode="responsive"' : '';
  const primaryActionId = project.primaryActionId ? ` data-project-action="${escapeHtml(project.primaryActionId)}"` : '';
  const sourceUrl = safeExternalUrl(project.sourceUrl);
  const primaryLinkLabel = escapeHtml(project.primaryLinkLabel || 'Open preview');
  const links = [
    `<a class="project-link project-link-primary" href="${escapeHtml(demoUrl)}" target="${demoTarget}"${demoRel}${responsiveOpenMode}${primaryActionId} aria-label="${escapeHtml(primaryLinkLabel)}: ${escapeHtml(project.title)}">${primaryLinkLabel} <span aria-hidden="true">↗</span></a>`,
    sourceUrl ? `<a class="project-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">View source <span aria-hidden="true">↗</span></a>` : ''
  ].filter(Boolean).join('');
  const reverse = project.layout === 'reverse' ? ' project--reverse' : '';
  const layout = escapeHtml(project.layout || 'split');
  return `
    <article class="project project--${escapeHtml(project.theme)} project--layout-${layout}${reverse}" data-reveal aria-labelledby="project-${escapeHtml(project.id)}-title">
      <div class="project-media-plane depth-plane" data-depth="${escapeHtml(index % 2 === 0 ? 'project-left' : 'project-right')}" data-direction="${index % 2 === 0 ? '1' : '-1'}">
        <a class="project-image-link" href="${escapeHtml(demoUrl)}" target="${demoTarget}"${demoRel}${responsiveOpenMode} aria-label="Open ${escapeHtml(project.title)} preview">
          <img src="${escapeHtml(image)}" srcset="${escapeHtml(imageSmall)} ${imageSmallWidth}w, ${escapeHtml(image)} ${imageWidth}w" sizes="(max-width: 760px) 100vw, 62vw" width="${imageWidth}" height="${imageHeight}" alt="${escapeHtml(project.imageAlt)}" loading="lazy" decoding="async" />
          <span class="image-arrow" aria-hidden="true">↗</span>
        </a>
        <span class="project-sticker"><span>${escapeHtml(project.number)}</span><span>${escapeHtml(project.status)}</span></span>
      </div>
      <div class="project-info project-info--smoked">
        <div class="project-meta"><span>${escapeHtml(project.category)}</span><span>${escapeHtml(project.number)} / ${String(projects.length).padStart(2, '0')}</span></div>
        <h3 id="project-${escapeHtml(project.id)}-title">${escapeHtml(project.title)}<span class="heading-period">.</span></h3>
        <p class="project-description">${escapeHtml(project.description)}</p>
        <ul class="project-features">${features}</ul>
        <div class="project-links">${links}</div>
      </div>
    </article>`;
}

const replacements = {
  '{{DISPLAY_NAME}}': escapeHtml(profile.displayName),
  '{{ROLE}}': escapeHtml(profile.role),
  '{{HERO_HEADLINE}}': escapeHtml(profile.heroHeadline),
  '{{HERO_SUMMARY}}': escapeHtml(profile.heroSummary),
  '{{ABOUT_COPY}}': escapeHtml(profile.aboutCopy),
  '{{PROJECT_COUNT}}': String(projects.length).padStart(2, '0'),
  '{{INTRO_SCRIPT_JSON}}': JSON.stringify(profile.introSegments || []).replaceAll('<', '\\u003c').replaceAll('&', '\\u0026'),
  '{{INTRO_VIDEO_READY}}': String(introVideoReady),
  '{{INTRO_VIDEO_SOURCE}}': introVideoReady ? '<source src="/assets/waleed-introduction-alpha.webm" type="video/webm" />' : '',
  '{{INTRO_ALPHA_VIDEO_SRC}}': introVideoReady ? '/assets/waleed-introduction-alpha.webm' : '',
  '{{INTRO_KEY_VIDEO_SRC}}': introVideoReady ? '/assets/waleed-introduction-source.mp4' : '',
  '{{INTRO_VIDEO_TRACK}}': introCaptionsReady ? '<track kind="captions" src="/assets/waleed-introduction.vtt" srclang="en" label="English" default />' : '',
  '{{INTRO_BUTTON_DISABLED}}': introVideoReady ? '' : 'disabled',
  '{{INTRO_BUTTON_TITLE}}': introVideoReady ? 'Meet me · 10 seconds' : 'Talking-avatar video pending',
  '{{INTRO_BUTTON_NOTE}}': introVideoReady ? 'A real voice · naturally moving avatar' : 'Setup needed · real video required',
  '{{INTRO_VOICE_NOTE}}': introVideoReady
    ? 'Press play to meet Waleed. The transparent avatar keeps the original speech, facial movement, and gestures synchronized inside the scene.'
    : 'Add a validated alpha WebM at public/assets/waleed-introduction-alpha.webm and the matching source MP4 at public/assets/waleed-introduction-source.mp4. Play stays disabled until the real media is present.',
  '{{INTRO_TRANSCRIPT}}': escapeHtml(introTranscript),
  '{{EMAIL}}': escapeHtml(profile.email),
  '{{EMAIL_HREF}}': `mailto:${escapeHtml(profile.email)}`, 
  '{{WHATSAPP_DISPLAY}}': escapeHtml(profile.whatsappDisplay),
  '{{WHATSAPP_URL}}': escapeHtml(buildWhatsAppUrl(profile)),
  '{{GITHUB_URL}}': escapeHtml(safeExternalUrl(profile.github)),
  '{{LINKEDIN_URL}}': escapeHtml(safeExternalUrl(profile.linkedin)),
  '{{PROJECTS_HTML}}': projects.map(renderProject).join('\n'),
  '{{YEAR}}': String(new Date().getFullYear()),
};
let html = template;
for (const [token, value] of Object.entries(replacements)) html = html.replaceAll(token, value);
if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error('Unresolved template token remains in generated HTML.');
if (!profile.productionDomain) {
  if (/<link[^>]+rel=["']canonical/i.test(html) || /property=["']og:url/i.test(html)) throw new Error('Do not publish canonical URL metadata without a confirmed domain.');
}
await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'app'), { recursive: true });
await mkdir(path.join(dist, 'styles'), { recursive: true });
await mkdir(path.join(dist, 'assets'), { recursive: true });
await writeFile(path.join(dist, 'index.html'), html);
await cp(path.join(root, 'styles'), path.join(dist, 'styles'), { recursive: true });
await cp(path.join(root, 'public/assets'), path.join(dist, 'assets'), { recursive: true });
if (existsSync(path.join(root, 'public/.htaccess'))) await cp(path.join(root, 'public/.htaccess'), path.join(dist, '.htaccess'));
const compilerArgs = ['--pretty', 'false', '-p', path.join(root, 'tsconfig.json')];
const localCompiler = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const compiler = existsSync(localCompiler)
  ? spawnSync(process.execPath, [localCompiler, ...compilerArgs], { cwd: root, encoding: 'utf8' })
  : spawnSync(process.platform === 'win32' ? 'tsc.cmd' : 'tsc', compilerArgs, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
if (compiler.stdout) process.stdout.write(compiler.stdout);
if (compiler.stderr) process.stderr.write(compiler.stderr);
if (compiler.error) throw new Error(`Could not start TypeScript compiler: ${compiler.error.message}`);
if (compiler.status !== 0) throw new Error(`TypeScript compilation failed with exit code ${compiler.status}`);
const htmlStat = await stat(path.join(dist, 'index.html'));
console.log(`Built static site: ${path.relative(root, dist)} (index.html ${htmlStat.size.toLocaleString()} bytes, ${projects.length} project cases).`);
console.log('No runtime package dependencies or external font/CDN requests are required.');
