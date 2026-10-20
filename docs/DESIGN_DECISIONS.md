# Design decisions — October 2026

## Selected direction: Material Index

The redesign uses a high-contrast editorial layout with a tactile material language, treated like a developer's folio of crafted objects rather than a generic tech landing page. A custom glass ribbon wraps a faceted crystal; the shape is echoed through angular image frames and carefully limited reflective edges, not through atom/orbit iconography. The supplied portrait and all project screenshots remain the visual evidence.

The visual system uses an airy mineral paper base, deep teal/blue anchors, a controlled warm accent, and a citrus highlight. Display type is a local serif stack paired with a clean system sans and monospaced metadata. No external fonts or CDNs are needed.

## Research adapted

- [Taste Skill, current v2](https://github.com/Leonxlnx/taste-skill): derive direction from the subject and actual assets; write a section argument before styling; reject generic centered hero + repetitive feature cards; screenshot at multiple viewports; critique the rendered result and fix the most visible defects. Adapted as a process, not copied as site layout or code.
- [Microsoft Frontend Design Review skill](https://github.com/microsoft/skills/tree/main/.github/skills/frontend-design-review): evaluate frictionless insight-to-action, quality craft, and trustworthy presentation. The hero has a clear project CTA and contact pathway; project status is labeled; no testimonials, awards, counters, or performance metrics are invented.
- [Apple Human Interface Guidelines: Materials](https://developer.apple.com/design/human-interface-guidelines/materials) and [Liquid Glass overview](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass): glass is a distinct functional layer for navigation and key controls, with translucent tint, blur, specular edge, and internal highlight; content remains primarily on stable readable surfaces. This is inspired by Apple's guidance and is not a claim to reproduce native iOS rendering in CSS.
- [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices): keep the rendering buffer/resolution bounded, handle resource lifetime/context loss, and use a designed fallback. The site caps pixel ratio and uses only a small mesh set; the HTML remains usable without WebGL.
- [web.dev responsive images](https://web.dev/learn/design/responsive-images/): retain width/height, responsive variants and lazy loading for below-fold evidence; prioritize the hero portrait and object fallback.
- [WCAG 2.2 contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion): preserve readable content, visible keyboard focus, standard anchors, and a static reduced-motion composition.

## Composition changes

- Replaced the nested ring/atom motif with a bespoke twisted ribbon + faceted crystal visual system and transparent, art-directed raster fallback.
- Kept the header as the most visible glass surface and upgraded control-level surfaces; the project text and feature lists remain crisp instead of being buried under glass panels.
- Varied project presentation: Nexora One is a full-width feature case, Cowboy Burger reverses the split, Café Aroma returns to a standard split, and Smash & Sizzle becomes the fourth reversed case with a distinctive locally authored cover artwork. The third layout is not another copy of the first two.
- Project entries show visible names, truthful status, inspectable description/features, and useful outbound actions. They deliberately omit fake client testimonials, awards, revenue, user counts, and impact percentages.
- About imagery uses an offset material plate rather than a second orbit motif. Contact uses a glass editorial plate, not decorative bubbles.
- Favicon and home-brand icon share a distinct glass-prism/monogram motif.

## Known content and verification limits

- The owner explicitly requested the `Nexora One` entry and later updated its destination to `https://nexora-one-dusky.vercel.app`. The supplied screenshot at `starter-assets/nexora-one.webp` visibly brands the website as **Aurelia Living**. The project is included as `Nexora One`, with the visible brand included in metadata to avoid hiding the mismatch. Confirm whether Nexora One is the internal/project name and Aurelia Living the public website brand, or replace the image/name/URL accordingly before production.
- The URL and supplied image were not fetched live in this environment because outbound DNS resolution is blocked. The screenshot asset exists locally and is included. Test the link from your machine before launch.
- A real desktop browser with a working WebGL 2 context is still required to verify the live scene. The CSS/image fallback is available and the build/tests can run offline with TypeScript installed. Lighthouse/Core Web Vitals are not claimed.
- The public portfolio domain is unknown, so canonical URL and absolute social metadata remain unset.
