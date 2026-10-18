# Implementation plan and checkpoints

Updated: 18 October 2026

## Phase 0 — Audit and research

- Inspected the generated source archive, data model, static HTML generator, CSS tokens, WebGL renderer, scroll story, existing tests, and provided project imagery.
- Reviewed the Taste Skill v2 process, Microsoft's Frontend Design Review guidance, Apple's Liquid Glass material guidance, MDN WebGL and scroll-driven animation docs, web.dev layout stability guidance, WCAG contrast requirements, and Nielsen Norman Group portfolio case-study guidance. The design decisions and direct source links are in `RESEARCH_NOTES.md` and `DESIGN_DECISIONS.md`.
- Compared three distinct directions and selected Material Index. The direction changes are documented in `ART_DIRECTION_EXPLORATIONS.md`.

## Phase 1 — Project evidence, assets and identity

- Updated `data/site-data.json` as the central source of truth for biography, contact links and project metadata.
- Added Nexora One as the lead case at the owner's explicit request and reused the actual supplied `nexora-one.webp`/`nexora-one-640.webp` assets rather than inventing a screenshot. The card explicitly identifies the visible Aurelia Living brand in its category so the naming relationship is not hidden.
- Reworked project composition: Nexora One is wide; Cowboy Burger is reversed; Café Aroma is split. Each has a truthful category/status label, features and a direct destination.
- Added a new SVG/PNG/ICO favicon set and iOS touch icon. Updated the site wordmark to use the shared icon asset.

## Phase 2 — Art direction and material language

- Replaced the atom-like rings/sphere fallback with a custom sculptural ribbon-and-crystal visual and a custom WebGL mesh version.
- Strengthened Liquid-Glass-inspired navigation and selected functional controls with translucent tint, `backdrop-filter`, saturation, edge light, inset highlights and shadows; kept body copy on stable surfaces.
- Changed the About plate and Contact composition so neither repeats circular orbit motifs.
- Updated the headline, eyebrow and project-section copy to be specific and restrained. No unverified outcomes or commercial claims were added.

## Phase 3 — Runtime and cross-platform build

- Hardened `tools/build.mjs` to launch a local TypeScript compiler through Node when present, with a Windows-safe fallback.
- Replaced the absolute Windows import in the test with the relative `../tools/site-data.mjs` ESM import.
- Added a TypeScript dev dependency in `package.json`; `npm install` creates a local lockfile for the environment that installs it.
- Kept native page scrolling, URL anchors, static first paint, CSS fallback and reduced-motion behavior.

## Phase 4 — Verification

- `npm test`: 8 tests passed, 0 failed.
- `npm run check`: passed.
- `npm run build`: passed; `dist/index.html` contains 3 project cases.
- `curl` checks verify the preview server serves HTML, styles, compiled JS and favicon/project assets.
- Playwright rendered the generated markup, local images, tokens and CSS at 1440, 768, 390 and 360px widths. No horizontal overflow; all 8 image elements decoded; no page errors in the static capture harness. Full-page, work-section, desktop, tablet, mobile and small-mobile screenshots are in `screenshots/`.
- Inline isolated-page interaction checks passed: opening/closing the mobile nav, Escape-key focus restoration, pause/resume state, and native `#work` hash navigation.
- Solid color-token contrast ratios were calculated; details are in `VERIFICATION_REPORT.md`.

## Remaining release gates

- Active WebGL 2 rendering could not be photographed or verified: `canvas.getContext('webgl2')` returned false under the available Chromium runtime even when trying SwiftShader flags. Do not mistake the designed static fallback screenshots for live-WebGL evidence.
- The production-host browser run, full Lighthouse/Core Web Vitals audit and composite contrast measurement over dynamic translucent backgrounds remain outstanding.
- Confirm the Nexora One / Aurelia Living name relationship and test all supplied live links from a regular browser before publishing.
- Add canonical and absolute Open Graph URL metadata after the production domain is known.

The scope does not claim a literal “multi-million-dollar” valuation. It aims for the craft, clarity, differentiation and reliability associated with premium portfolio work while remaining honest about unmeasured results.
