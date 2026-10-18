type ScrollStoryOptions = {
  isPaused: () => boolean;
};

type DepthPlane = HTMLElement & { dataset: DOMStringMap };

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

function setPlaneAtRest(plane: DepthPlane): void {
  plane.style.setProperty('--story-x', '0px');
  plane.style.setProperty('--story-y', '0px');
  plane.style.setProperty('--story-z', '0px');
  plane.style.setProperty('--story-rotate', '0deg');
  plane.style.setProperty('--story-rotate-x', '0deg');
  plane.style.setProperty('--story-scale', '1');
}

export function setupScrollStory(options: ScrollStoryOptions): { refresh: () => void; dispose: () => void } {
  const planes = Array.from(document.querySelectorAll<DepthPlane>('[data-depth]'));
  const processTrack = document.getElementById('process-track');
  const processFill = document.getElementById('process-line-fill');
  const processSteps = Array.from(document.querySelectorAll<HTMLElement>('.process-step'));
  const globalArtwork = document.getElementById('scene-artwork') as HTMLElement | null;
  const chapters = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'));
  const revealItems = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        revealObserver?.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }) : null;
  revealItems.forEach((item) => revealObserver ? revealObserver.observe(item) : item.classList.add('is-revealed')); 
  let frameId = 0;
  let disposed = false;

  const update = () => {
    frameId = 0;
    if (disposed) return;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pageProgress = clamp(window.scrollY / maxScroll);

    if (globalArtwork) {
      const chapterIndex = chapters.reduce((active, chapter, index) => chapter.getBoundingClientRect().top <= window.innerHeight * 0.52 ? index : active, 0);
      const chapterName = chapters[chapterIndex]?.dataset.chapter ?? 'arrival';
      globalArtwork.dataset.chapter = chapterName;
      if (!options.isPaused() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const x = Math.sin(pageProgress * Math.PI * 2.25 - 0.45) * Math.min(window.innerWidth * 0.12, 145);
        const y = (pageProgress - 0.5) * Math.min(window.innerHeight * 0.46, 390);
        const z = Math.sin(pageProgress * Math.PI * 2) * 70;
        const rotateY = Math.sin(pageProgress * Math.PI * 2.2) * 17;
        const rotateX = Math.cos(pageProgress * Math.PI * 1.8) * 8;
        const rotateZ = (pageProgress - 0.5) * 22;
        const scale = 0.94 + Math.sin(pageProgress * Math.PI) * 0.12;
        globalArtwork.style.setProperty('--journey-x', `${x.toFixed(2)}px`);
        globalArtwork.style.setProperty('--journey-y', `${y.toFixed(2)}px`);
        globalArtwork.style.setProperty('--journey-z', `${z.toFixed(2)}px`);
        globalArtwork.style.setProperty('--journey-rotate-y', `${rotateY.toFixed(2)}deg`);
        globalArtwork.style.setProperty('--journey-rotate-x', `${rotateX.toFixed(2)}deg`);
        globalArtwork.style.setProperty('--journey-rotate-z', `${rotateZ.toFixed(2)}deg`);
        globalArtwork.style.setProperty('--journey-scale', scale.toFixed(3));
      }
    }

    if (options.isPaused() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      planes.forEach((plane) => {
        setPlaneAtRest(plane);
        plane.classList.remove('is-visible');
      });
    } else {
      const viewportCenter = window.innerHeight * 0.54;
      for (const plane of planes) {
        // Measure the stable hero visual container for the sculpture so its own transform
        // cannot feed back into the next scroll-progress calculation.
        const measurementElement = plane.dataset.depth === 'hero-sculpture'
          ? plane.closest<HTMLElement>('.hero-visual') ?? plane
          : plane;
        const rect = measurementElement.getBoundingClientRect();
        const nearViewport = rect.bottom >= -window.innerHeight * 0.45 && rect.top <= window.innerHeight * 1.45;
        plane.classList.toggle('is-visible', nearViewport);
        if (!nearViewport) {
          setPlaneAtRest(plane);
          continue;
        }
        const elementCenter = rect.top + rect.height * 0.5;
        const progress = clamp((viewportCenter - rect.top) / (window.innerHeight + rect.height));
        const balance = 1 - progress * 2;
        const isSculpture = plane.dataset.depth === 'hero-sculpture';
        const isPortrait = plane.dataset.depth?.includes('portrait') ?? false;
        const direction = Number(plane.dataset.direction ?? (plane.dataset.depth === 'project-right' ? -1 : 1));
        const x = balance * direction * (isSculpture ? 27 : isPortrait ? 34 : 48);
        const y = Math.abs(balance) * (isSculpture ? 7 : 10);
        const z = -Math.abs(balance) * (isSculpture ? 112 : 76);
        const rotation = balance * direction * (isSculpture ? 14 : isPortrait ? 5.5 : 10.5);
        const scale = (isSculpture ? 0.955 : 0.965) + (1 - Math.abs(balance)) * (isSculpture ? 0.045 : 0.035);
        plane.style.setProperty('--story-x', `${x.toFixed(2)}px`);
        plane.style.setProperty('--story-y', `${y.toFixed(2)}px`);
        plane.style.setProperty('--story-z', `${z.toFixed(2)}px`);
        plane.style.setProperty('--story-rotate', `${rotation.toFixed(2)}deg`);
        if (isSculpture) plane.style.setProperty('--story-rotate-x', `${(balance * -8).toFixed(2)}deg`);
        plane.style.setProperty('--story-scale', scale.toFixed(4));
        if (plane.dataset.depth === 'hero-portrait') {
          const heroTravel = clamp((window.innerHeight - elementCenter) / Math.max(1, window.innerHeight * 1.7));
          plane.style.setProperty('--story-x', `${(heroTravel * -48).toFixed(2)}px`);
        }
      }
    }

    if (processTrack && processSteps.length) {
      const rect = processTrack.getBoundingClientRect();
      const processProgress = clamp((window.innerHeight * 0.68 - rect.top) / Math.max(1, rect.height * 0.76));
      const activeIndex = Math.min(processSteps.length - 1, Math.floor(processProgress * processSteps.length));
      processSteps.forEach((step, index) => {
        step.classList.toggle('is-active', index === activeIndex);
        if (index === activeIndex) step.setAttribute('aria-current', 'step');
        else step.removeAttribute('aria-current');
      });
      if (processFill) processFill.style.width = `${(processProgress * 100).toFixed(1)}%`;
    }
  };

  const schedule = () => {
    if (!frameId) frameId = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  const fontSet = document.fonts;
  fontSet?.ready.then(schedule).catch(() => undefined);
  window.addEventListener('load', schedule, { once: true });
  schedule();

  return {
    refresh: schedule,
    dispose() {
      disposed = true;
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      revealObserver?.disconnect();
    },
  };
}
