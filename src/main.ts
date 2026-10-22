import { setupScrollStory } from './scroll-story.js';

document.documentElement.classList.add('has-motion');

const menuToggle = document.getElementById('menu-toggle') as HTMLButtonElement | null;
const navigation = document.getElementById('primary-nav') as HTMLElement | null;
const motionToggle = document.getElementById('motion-toggle') as HTMLButtonElement | null;
const stage = document.getElementById('scene-stage');
const introStage = document.getElementById('intro-theatre') as HTMLElement | null;
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
  if (introStage) introStage.dataset.motion = paused || reducedMotionQuery.matches ? 'reduced' : 'full';
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

// The introduction is a real, pre-rendered talking-avatar video. Browser speech synthesis is
// intentionally not used: the same media file carries the voice, lip-sync, facial movement,
// and gestures, so the site can never play narration over a still portrait.
interface IntroSegment {
  phase: string;
  kicker: string;
  title: string;
  caption: string;
  spoken: string;
}

const introData = document.getElementById('intro-script-data');
const introSegments: IntroSegment[] = (() => {
  try {
    const value: unknown = JSON.parse(introData?.textContent || '[]');
    return Array.isArray(value) ? value.filter((item): item is IntroSegment => Boolean(
      item && typeof item.phase === 'string' && typeof item.kicker === 'string' &&
      typeof item.title === 'string' && typeof item.caption === 'string' && typeof item.spoken === 'string'
    )) : [];
  } catch {
    return [];
  }
})();

const playIntroButton = document.getElementById('play-intro') as HTMLButtonElement | null;
const stopIntroButton = document.getElementById('stop-intro') as HTMLButtonElement | null;
const introVideo = document.getElementById('intro-avatar-video') as HTMLVideoElement | null;
const introCanvas = document.getElementById('intro-avatar-canvas') as HTMLCanvasElement | null;

interface AvatarCanvasKeyer {
  draw: () => void;
  dispose: () => void;
}

function createAvatarCanvasKeyer(canvas: HTMLCanvasElement, video: HTMLVideoElement): AvatarCanvasKeyer | null {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, preserveDrawingBuffer: false });
  if (!gl) return null;

  const vertexSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = vec2((a_position.x + 1.0) * 0.5, (a_position.y + 1.0) * 0.5);
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform sampler2D u_video;
    varying vec2 v_uv;
    void main() {
      vec3 rgb = texture2D(u_video, v_uv).rgb;
      float highChannel = max(max(rgb.r, rgb.g), rgb.b);
      float lowChannel = min(min(rgb.r, rgb.g), rgb.b);
      float chroma = highChannel - lowChannel;
      float luma = dot(rgb, vec3(0.299, 0.587, 0.114));
      // The original Gemini MP4 contains a light-gray checkerboard. On Safari,
      // where WebM alpha is unsupported, use its brightness + neutrality as a
      // soft key while retaining colored skin and the dark neutral suit.
      float neutral = 1.0 - smoothstep(0.025, 0.12, chroma);
      float backgroundAlpha = 1.0 - smoothstep(0.70, 0.84, luma);
      float alpha = mix(1.0, backgroundAlpha, neutral);
      vec3 backgroundColor = vec3(0.92);
      vec3 decontaminated = clamp((rgb - (1.0 - alpha) * backgroundColor) / max(alpha, 0.055), 0.0, 1.0);
      vec3 color = mix(rgb, decontaminated, neutral);
      gl_FragColor = vec4(color, alpha);
    }
  `;

  const compile = (type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  if (!buffer || !texture) {
    if (buffer) gl.deleteBuffer(buffer);
    if (texture) gl.deleteTexture(texture);
    gl.deleteProgram(program);
    return null;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, 'u_video'), 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  let animationFrame = 0;
  const draw = (): void => {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0 || video.videoHeight === 0) return;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } catch {
      // Safari can briefly reject a frame while the decoder seeks. The next
      // animation frame will retry rather than interrupting audio playback.
    }
  };
  const renderWhilePlaying = (): void => {
    draw();
    if (!video.paused && !video.ended) animationFrame = requestAnimationFrame(renderWhilePlaying);
  };
  const start = (): void => {
    cancelAnimationFrame(animationFrame);
    renderWhilePlaying();
  };
  video.addEventListener('play', start);
  video.addEventListener('loadeddata', draw);
  video.addEventListener('seeked', draw);
  video.addEventListener('pause', draw);
  video.addEventListener('ended', draw);
  return {
    draw,
    dispose: () => {
      cancelAnimationFrame(animationFrame);
      video.removeEventListener('play', start);
      video.removeEventListener('loadeddata', draw);
      video.removeEventListener('seeked', draw);
      video.removeEventListener('pause', draw);
      video.removeEventListener('ended', draw);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}

const isSafariWithoutWebMAlpha = /Safari/i.test(navigator.userAgent) && !/(Chrome|Chromium|CriOS|Edg|OPR|FxiOS|Firefox|Android)/i.test(navigator.userAgent);
let introVideoReady = introStage?.dataset.videoReady === 'true' && Boolean(introVideo?.querySelector('source'));
let avatarCanvasKeyer: AvatarCanvasKeyer | null = null;
if (introVideoReady && introStage && introVideo && isSafariWithoutWebMAlpha) {
  const keySource = introStage.dataset.keySrc;
  avatarCanvasKeyer = introCanvas ? createAvatarCanvasKeyer(introCanvas, introVideo) : null;
  if (keySource && avatarCanvasKeyer && introCanvas) {
    introStage.dataset.renderer = 'safari-keyer';
    introCanvas.hidden = false;
    introVideo.querySelectorAll('source').forEach((source) => source.remove());
    introVideo.src = keySource;
    introVideo.preload = 'auto';
    introVideo.load();
    avatarCanvasKeyer.draw();
  } else {
    // Keep the borderless world composition and transparent poster even if this
    // Safari build cannot create the canvas keyer; never fall back to the old card.
    introVideoReady = false;
    introStage.dataset.renderer = 'unavailable';
    if (playIntroButton) playIntroButton.disabled = true;
  }
} else if (introStage) {
  introStage.dataset.renderer = 'alpha-webm';
}

const introSceneKicker = document.getElementById('intro-scene-kicker');
const introSceneTitle = document.getElementById('intro-scene-title');
const introSceneCaption = document.getElementById('intro-scene-caption');
const introSceneStatus = document.getElementById('intro-status');
const introSceneIndex = document.getElementById('intro-scene-index');
const introProgressTrack = document.getElementById('intro-progress-track');
const introProgress = document.getElementById('intro-progress');
const introButtonTitle = playIntroButton?.querySelector('.intro-button-title');
const introButtonNote = playIntroButton?.querySelector('.intro-button-note');
let activeIntroSegment = -1;

function setIntroProgress(percent: number, index = 0): void {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  introProgress?.style.setProperty('width', `${safePercent}%`);
  introProgressTrack?.setAttribute('aria-valuenow', String(safePercent));
  if (introSceneIndex) {
    const total = String(introSegments.length).padStart(2, '0');
    if (safePercent >= 100) introSceneIndex.textContent = `${total} / ${total}`;
    else if (safePercent === 0 && introStage?.dataset.state !== 'playing') introSceneIndex.textContent = `00 / ${total}`;
    else introSceneIndex.textContent = `${String(Math.min(index + 1, introSegments.length)).padStart(2, '0')} / ${total}`;
  }
}

function showIntroSegment(segment: IntroSegment, index: number): void {
  if (introStage) introStage.dataset.phase = segment.phase;
  if (introSceneKicker) introSceneKicker.textContent = segment.kicker;
  if (introSceneTitle) introSceneTitle.textContent = segment.title;
  if (introSceneCaption) introSceneCaption.textContent = segment.caption;
  activeIntroSegment = index;
}

// Use the segment word counts as a resilient approximation for the on-screen chapter captions.
// The video remains the source of truth for timing and audio; optional WebVTT captions can be
// added after the final generated clip is reviewed.
function segmentIndexAt(progressRatio: number): number {
  if (introSegments.length <= 1) return 0;
  const wordCounts = introSegments.map((segment) => Math.max(1, segment.spoken.trim().split(/\s+/).length));
  const wordTotal = wordCounts.reduce((sum, count) => sum + count, 0);
  const target = Math.max(0, Math.min(0.9999, progressRatio)) * wordTotal;
  let accumulated = 0;
  for (let index = 0; index < wordCounts.length; index += 1) {
    accumulated += wordCounts[index];
    if (target < accumulated) return index;
  }
  return wordCounts.length - 1;
}

function updateIntroPlayback(): void {
  if (!introVideo || !Number.isFinite(introVideo.duration) || introVideo.duration <= 0) return;
  const ratio = Math.max(0, Math.min(1, introVideo.currentTime / introVideo.duration));
  const index = segmentIndexAt(ratio);
  if (index !== activeIntroSegment && introSegments[index]) showIntroSegment(introSegments[index], index);
  setIntroProgress(ratio * 100, index);
}

function finishIntro(): void {
  if (introStage) {
    introStage.dataset.mediaStarted = 'false';
    introStage.dataset.state = 'complete';
    introStage.dataset.phase = 'complete';
  }
  if (introSceneStatus) introSceneStatus.textContent = 'INTRODUCTION COMPLETE';
  if (stopIntroButton) {
    const hadStopFocus = document.activeElement === stopIntroButton;
    stopIntroButton.hidden = true;
    if (hadStopFocus) playIntroButton?.focus({ preventScroll: true });
  }
  playIntroButton?.setAttribute('aria-busy', 'false');
  if (introButtonTitle) introButtonTitle.textContent = 'Meet me · replay';
  if (introButtonNote) introButtonNote.textContent = 'The avatar is ready when you are';
  playIntroButton?.classList.remove('is-playing');
  setIntroProgress(100, Math.max(0, introSegments.length - 1));
}

function stopIntro(): void {
  if (introVideo) {
    introVideo.pause();
    try { introVideo.currentTime = 0; } catch { /* Metadata may not have loaded yet. */ }
  }
  if (introStage) {
    introStage.dataset.mediaStarted = 'false';
    introStage.dataset.state = 'stopped';
    introStage.dataset.phase = 'idle';
  }
  if (introSceneKicker) introSceneKicker.textContent = 'INTRODUCTION PAUSED';
  if (introSceneTitle) introSceneTitle.textContent = 'Whenever you are ready.';
  if (introSceneCaption) introSceneCaption.textContent = 'The video contains the narration and synchronized facial performance.';
  if (introSceneStatus) introSceneStatus.textContent = 'INTRODUCTION STOPPED';
  if (stopIntroButton) {
    const hadStopFocus = document.activeElement === stopIntroButton;
    stopIntroButton.hidden = true;
    if (hadStopFocus) playIntroButton?.focus({ preventScroll: true });
  }
  playIntroButton?.classList.remove('is-playing');
  playIntroButton?.setAttribute('aria-busy', 'false');
  if (introButtonTitle) introButtonTitle.textContent = 'Meet me · 10 seconds';
  if (introButtonNote) introButtonNote.textContent = 'One voice · synchronized movement';
  activeIntroSegment = -1;
  setIntroProgress(0, 0);
}

async function playIntro(): Promise<void> {
  if (!introVideoReady || !introVideo || !introStage || !playIntroButton) return;
  introVideo.pause();
  try { introVideo.currentTime = 0; } catch { /* The loadedmetadata event sets currentTime once available. */ }
  introStage.dataset.mediaStarted = 'false';
  introStage.dataset.state = 'stopped';
  void introStage.offsetWidth;
  introStage.dataset.state = 'playing';
  if (introSegments[0]) showIntroSegment(introSegments[0], 0);
  if (stopIntroButton) stopIntroButton.hidden = false;
  playIntroButton.classList.add('is-playing');
  playIntroButton.setAttribute('aria-busy', 'true');
  if (introButtonTitle) introButtonTitle.textContent = 'Restart introduction';
  if (introButtonNote) introButtonNote.textContent = 'Playing · click to restart';
  if (introSceneStatus) introSceneStatus.textContent = 'AVATAR SPEAKING · MOTION SYNCED';
  try {
    await introVideo.play();
  } catch {
    introStage.dataset.mediaStarted = 'false';
    introStage.dataset.state = 'error';
    if (introSceneStatus) introSceneStatus.textContent = 'VIDEO PLAYBACK FAILED';
    if (introSceneCaption) introSceneCaption.textContent = 'The talking-avatar media could not be played. Check that the alpha WebM and source MP4 are uploaded to the assets folder.';
    playIntroButton.classList.remove('is-playing');
    playIntroButton.setAttribute('aria-busy', 'false');
    if (introButtonTitle) introButtonTitle.textContent = 'Try introduction again';
    if (stopIntroButton) stopIntroButton.hidden = true;
  }
}

if (!introVideoReady) {
  if (introSceneStatus) introSceneStatus.textContent = introStage?.dataset.renderer === 'unavailable' ? 'AVATAR PLAYBACK UNAVAILABLE' : 'TALKING-AVATAR VIDEO NEEDED';
  if (introStage?.dataset.renderer === 'unavailable' && introSceneCaption) {
    introSceneCaption.textContent = 'The standing portrait remains visible, but this browser could not enable the transparent video renderer.';
  }
} else if (introVideo) {
  introVideo.addEventListener('loadedmetadata', updateIntroPlayback);
  introVideo.addEventListener('timeupdate', updateIntroPlayback);
  introVideo.addEventListener('playing', () => {
    if (introStage) introStage.dataset.mediaStarted = 'true';
    if (introSceneStatus) introSceneStatus.textContent = 'AVATAR SPEAKING · MOTION SYNCED';
  });
  introVideo.addEventListener('ended', finishIntro);
  introVideo.addEventListener('error', () => {
    if (introStage) introStage.dataset.mediaStarted = 'false';
    if (introSceneStatus) introSceneStatus.textContent = 'VIDEO FILE COULD NOT BE LOADED';
    if (introSceneCaption) introSceneCaption.textContent = 'Check that the transparent WebM and its source MP4 are present in the assets folder.';
    playIntroButton?.setAttribute('aria-busy', 'false');
    playIntroButton?.classList.remove('is-playing');
    if (stopIntroButton) stopIntroButton.hidden = true;
  });
}

playIntroButton?.addEventListener('click', playIntro);
stopIntroButton?.addEventListener('click', stopIntro);

const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

// Give desktop pointer users a new tab for the external Nexora demo, while touch-first
// devices keep the familiar same-tab behavior. The static HTML defaults to the safer new tab.
const responsiveProjectTargets = document.querySelectorAll<HTMLAnchorElement>('a[data-project-open-mode="responsive"]');
function updateResponsiveProjectTargets(): void {
  responsiveProjectTargets.forEach((link) => {
    link.target = finePointer.matches ? '_blank' : '_self';
    if (link.target === '_blank') link.rel = 'noopener noreferrer';
    else link.removeAttribute('rel');
  });
}
updateResponsiveProjectTargets();
finePointer.addEventListener('change', updateResponsiveProjectTargets);

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

window.addEventListener('pagehide', () => {
  story.dispose();
  introVideo?.pause();
  avatarCanvasKeyer?.dispose();
}, { once: true });
