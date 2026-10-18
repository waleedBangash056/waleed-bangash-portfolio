import { setupScrollStory } from './scroll-story.js';

document.documentElement.classList.add('has-motion');

const menuToggle = document.getElementById('menu-toggle') as HTMLButtonElement | null;
const navigation = document.getElementById('primary-nav') as HTMLElement | null;
const motionToggle = document.getElementById('motion-toggle') as HTMLButtonElement | null;
const stage = document.getElementById('scene-stage');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotionQuery.matches;

function setMenuOpen(open: boolean): void {
  if (!menuToggle || !navigation) return;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  navigation.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-is-open', open);
}

menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  setMenuOpen(open);
  if (open) navigation?.querySelector('a')?.focus({ preventScroll: true });
});

navigation?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false));
});

document.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false);
    menuToggle.focus({ preventScroll: true });
  }
});

function updateMotionControl(): void {
  if (!motionToggle) return;
  motionToggle.setAttribute('aria-pressed', String(paused));
  motionToggle.setAttribute('aria-label', paused ? 'Enable motion effects' : 'Pause motion effects');
  const systemReduced = reducedMotionQuery.matches;
  motionToggle.disabled = systemReduced;
  motionToggle.setAttribute('aria-label', systemReduced ? 'Motion reduced by system preference' : (paused ? 'Enable motion effects' : 'Pause motion effects'));
  const label = motionToggle.querySelector('.motion-label');
  if (label) label.textContent = systemReduced ? 'Motion reduced' : (paused ? 'Resume motion' : 'Pause motion');
  if (stage) stage.dataset.paused = String(paused);
}

const story = setupScrollStory({
  isPaused: () => paused,
});

motionToggle?.addEventListener('click', () => {
  paused = !paused;
  updateMotionControl();
  story.refresh();
});

reducedMotionQuery.addEventListener('change', (event) => {
  if (event.matches) {
    paused = true;
    updateMotionControl();
    story.refresh();
  }
  updateMotionControl();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) story.refresh();
});

updateMotionControl();

const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
if (finePointer.matches) {
  document.querySelectorAll<HTMLElement>('.glass-story-panel, .glass-story-card, .project-image-link, .contact-action').forEach((card) => {
    card.addEventListener('pointermove', (event: PointerEvent) => {
      if (paused || reducedMotionQuery.matches) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(1, rect.width);
      const y = (event.clientY - rect.top) / Math.max(1, rect.height);
      card.style.setProperty('--tilt-x', `${((0.5 - y) * 5).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${((x - 0.5) * 7).toFixed(2)}deg`);
      card.style.setProperty('--shine-x', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--shine-y', `${(y * 100).toFixed(1)}%`);
      card.classList.add('is-tilting');
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.classList.remove('is-tilting');
    });
  });
}

// The global artwork is the intentionally art-directed scene layer. The procedural mesh is
// not activated because it does not match the approved sculpture silhouette.

window.addEventListener('pagehide', () => story.dispose(), { once: true });
