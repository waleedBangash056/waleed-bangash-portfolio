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

function renderProject(project, index) {
  const image = safeExternalUrl(`https://local.invalid${project.image}`).replace('https://local.invalid', '');
  const imageSmall = safeExternalUrl(`https://local.invalid${project.imageSmall}`).replace('https://local.invalid', '');
  const features = project.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('');
  const demoUrl = safeExternalUrl(project.demoUrl);
  const sourceUrl = safeExternalUrl(project.sourceUrl);
  const primaryLinkLabel = escapeHtml(project.primaryLinkLabel || 'Open preview');
  const links = [
    `<a class="project-link project-link-primary" href="${escapeHtml(demoUrl)}" target="_blank" rel="noreferrer">${primaryLinkLabel} <span aria-hidden="true">↗</span></a>`,
    sourceUrl ? `<a class="project-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">View source <span aria-hidden="true">↗</span></a>` : ''
  ].filter(Boolean).join('');
  const reverse = project.layout === 'reverse' ? ' project--reverse' : '';
  const layout = escapeHtml(project.layout || 'split');
  return `
    <article class="project project--${escapeHtml(project.theme)} project--layout-${layout}${reverse}" aria-labelledby="project-${escapeHtml(project.id)}-title">
      <div class="project-media-plane depth-plane" data-depth="${escapeHtml(index % 2 === 0 ? 'project-left' : 'project-right')}" data-direction="${index % 2 === 0 ? '1' : '-1'}">
        <a class="project-image-link" href="${escapeHtml(demoUrl)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeHtml(project.title)} preview">
          <img src="${escapeHtml(image)}" srcset="${escapeHtml(imageSmall)} 640w, ${escapeHtml(image)} 1200w" sizes="(max-width: 760px) 100vw, 62vw" width="1200" height="867" alt="${escapeHtml(project.imageAlt)}" loading="lazy" decoding="async" />
          <span class="image-arrow" aria-hidden="true">↗</span>
        </a>
        <span class="project-sticker"><span>${escapeHtml(project.number)}</span><span>${escapeHtml(project.status)}</span></span>
      </div>
      <div class="project-info">
        <div class="project-meta"><span>${escapeHtml(project.category)}</span><span>${escapeHtml(project.number)} / 03</span></div>
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
