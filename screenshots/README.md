# Visual verification captures

These captures were rendered in Chromium with the built `index.html`, the exact built CSS/token files, and local image bytes embedded in an isolated page fixture. The environment blocks normal localhost navigation, so this is static/fallback-render evidence, not a production-origin run.

- `desktop-fallback-1440x1000.png`: desktop first impression with the designed sculpture fallback.
- `desktop-motion-1440x1000.png`: same desktop composition with normal motion preference.
- `full-page-fallback-desktop.png`: complete page composition.
- `work-section-desktop.png`: featured projects section.
- `tablet-fallback-768x1024.png`, `mobile-fallback-390x844.png`, `mobile-small-fallback-360x800.png`: responsive states.
- `render-verification.json`: viewport sizes, widths, loaded image counts, project count, CSS glass filter and page errors.
- `interaction-verification.json`: keyboard/navigation and motion-button interaction observations from a module-inlined Playwright harness.

**No image in this directory proves that the active WebGL 2 scene rendered.** The current test container returned `false` for `canvas.getContext('webgl2')`; the static CSS/image fallback was used in screenshots. Verify the active scene in a regular GPU/WebGL-capable browser before production.
