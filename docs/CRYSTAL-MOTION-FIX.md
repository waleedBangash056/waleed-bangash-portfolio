# Crystal Motion Fix

## What caused the static crystal

The accurate `signature-sculpture.webp` artwork was restored by hiding the procedural WebGL canvas. However, the image wrapper was not marked as a scroll-story depth plane. As a result, the existing scroll controller did not transform it.

## What changed

- The `.scene-fallback` wrapper is now a `depth-plane` with `data-depth="hero-sculpture"`.
- `styles/site.css` uses CSS perspective plus scroll-driven translate-Z, X/Y rotation, and scale custom properties on that wrapper.
- `src/scroll-story.ts` now sets those values for the sculpture and measures the stable `.hero-visual` container to prevent transform feedback.
- The canvas remains hidden so the inaccurate procedural shark-like mesh cannot cover the artwork.
- The artwork keeps its light idle float, and the motion toggle/reduced-motion preferences remain respected.

## What kind of 3D this is

The original sculpture is a transparent 2D image depicting a 3D object. This fix moves and tilts that image plane in perspective (a 2.5D / CSS 3D effect) as the page scrolls. It preserves the exact artwork and provides depth movement without creating a new volumetric crystal mesh. A true volumetric model would require a properly authored `.glb` asset and a matching Three.js/WebGL material setup.

## Verify locally

Run `npm run check`, `npm test`, and `npm run dev`. Scroll down slowly through the hero section: the crystal should translate laterally and in depth, tilt with perspective, and settle as the hero leaves the viewport. If it remains at rest, check that the site motion control is not paused and the operating system/browser does not request reduced motion.
