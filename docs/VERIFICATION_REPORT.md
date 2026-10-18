# Verification Report — Scroll Experience Redesign

Date: 2026-10-18

## Automated checks

- `npm run build`: passed. Generated `dist/` with three project cases.
- `npm test`: passed, 8 tests / 0 failures.
- `npm run check`: passed.
- CSS syntax parse with `tinycss2`: 46 top-level rules, zero parse errors.
- Local HTTP checks: `/`, `/styles/site.css`, and `/assets/signature-sculpture.webp` returned HTTP 200.
- The unused experimental procedural scene is excluded from the TypeScript build output, so it cannot load over the approved artwork.

## Behavior covered in code/tests

- The accurate sculpture is now a persistent fixed layer outside the hero and is driven by whole-document scroll progress.
- The sculpture has chapter-specific opacity and moves in X/Y/Z with perspective rotation and scale.
- Capabilities title is a glass material panel with fine-pointer tilt; selected capability/process cards and contact/project surfaces receive restrained tilt/depth treatment.
- IntersectionObserver reveals selected sections as they enter view, with a visible-by-default fallback when the API is unavailable.
- The motion toggle freezes scroll-driven transforms. `prefers-reduced-motion`, `prefers-reduced-transparency`, and forced-colors fallbacks are retained.
- The footer and metadata are part of the reveal system.

## Not verified in this container

Headless Chromium timed out during startup, so no trustworthy live browser screenshot, console trace, interaction run, or Lighthouse/Core Web Vitals report could be captured for this iteration. The user should run `npm run dev` locally in Chrome or Edge, scroll from top to footer, test the motion toggle and reduced-motion preference, and run Lighthouse before production deployment.

## Important distinction

The scrolling crystal is the supplied transparent artwork on a perspective-transformed image plane. It is not a volumetric GLB model. This preserves the approved silhouette and avoids the previous shark-like procedural mesh. A true 3D crystal would require a bespoke model and a separate validated lighting/material pipeline.
