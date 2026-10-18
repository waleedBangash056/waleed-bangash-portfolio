# Scroll Experience Redesign

## Decision

Use the supplied, art-directed transparent sculpture as a persistent fixed scene layer and move it through the full page with scroll-linked CSS 3D transforms. Do not activate the previous procedural WebGL mesh until its silhouette and materials are replaced with an approved model. Add motion to selected content surfaces (capability title, process steps, project media, contact actions) and use glass selectively for the functional title panel and a few structural surfaces.

## Why this approach

- The reference artwork is visually accurate; the old procedural mesh is not. The image-plane approach preserves the approved silhouette rather than drawing a visibly different object.
- A single persistent layer creates continuity across chapters without forcing a large 3D object into every section's foreground. Its opacity is tuned by the currently active chapter so the object is prominent in the hero and subdued behind dense reading sections.
- CSS `transform` is the primary animated property. The animation does not repeatedly measure and mutate layout dimensions, and it uses one requestAnimationFrame-scheduled scroll update.
- The `prefers-reduced-motion` preference disables the scroll transform and entrance transitions. The visible content remains present if JavaScript is unavailable or IntersectionObserver is unsupported.
- Glass is focused on the capabilities title, navigation, process surfaces, selected hover states and footer structure. It is not applied to every card, keeping contrast and hierarchy intact.

## Interactions

- Whole-page scroll progress updates the artwork's x/y/z translation, X/Y/Z rotation and scale. Chapter-aware opacity keeps it from overpowering copy.
- `IntersectionObserver` reveals selected sections as they enter the viewport; it unobserves each item after reveal.
- Fine-pointer devices receive a small pointer-driven tilt on selected cards and actions. Touch/coarse-pointer devices do not get pointer tilt.
- The existing motion toggle pauses the scroll-linked transforms and card tilt. System reduced-motion preferences take precedence.

## Research references

- Taste Skill v2: design read, intentional composition, and screenshot review loop. https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md
- Apple's Materials guidance: reserve Liquid Glass primarily for navigation and functional controls, avoid applying it indiscriminately to content. https://developer.apple.com/design/human-interface-guidelines/materials
- MDN, CSS scroll-driven animations: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations
- web.dev, animation performance: transform and opacity are generally the most efficient properties to animate. https://web.dev/articles/animations-overview
- MDN, prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

## Trade-offs and release checks

- This is perspective-transformed 2D artwork, not a volumetric crystal mesh. It gives a stable, art-directed result without requiring WebGL. A true 3D version needs a bespoke GLB model and lighting/material work; simply turning the old WebGL mesh back on reintroduces the inaccurate shape.
- The isolated Chromium process in this environment timed out before producing a reliable screenshot. Automated tests and TypeScript checks pass, but verify the live animation in Chrome/Edge on the target machine and run Lighthouse before deployment.
