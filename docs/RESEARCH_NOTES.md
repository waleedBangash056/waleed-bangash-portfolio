# Design research notes — 18 October 2026

This is an implementation brief distilled from current design/engineering sources—not a promise that any visual style is literally worth a stated dollar amount.

## 1. Direction and anti-template review

**Taste Skill v2** says its workflow draws on a study of 247 curated sites and has six steps: inventory what is unique to the client, compare several researched directions, form a specific concept, use real project imagery, check browser output at three widths, and critique/fix the leading issues. See [Taste Skill README](https://github.com/Leonxlnx/taste-skill/blob/main/README.md). The useful lesson is the process, not a preselected layout. This redesign uses the real portrait and real project screenshots, compares three art directions, changes the atom motif, varies project layouts, and records the screenshot critique loop.

**Microsoft Frontend Design Review** evaluates interfaces across frictionless insight-to-action, quality craft, and trustworthy building. It emphasizes distinctive direction, typography, token-driven styling, intentional motion, asymmetrical composition, and a primary action that is easy to identify. See [the review skill](https://github.com/microsoft/skills/blob/main/.github/skills/frontend-design-review/SKILL.md) and [the checklist](https://github.com/microsoft/skills/blob/main/.github/skills/frontend-design-review/references/quick-checklist.md). Applied here: the main route to work/contact remains obvious; case-study information is concise; claims and metrics are not fabricated.

## 2. Liquid Glass without losing hierarchy

Apple's [Materials HIG](https://developer.apple.com/design/human-interface-guidelines/materials) describes Liquid Glass as a functional layer for navigation and controls, while recommending stable standard materials for content and warning against using glass everywhere. Its [Liquid Glass overview](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass) explains its role in establishing hierarchy. Web CSS can approximate tint, blur, saturation, edge lighting and layered reflections, but it does not reproduce Apple's native material/shader behavior.

Applied here: the nav, mobile nav, image action, project sticker, contact affordances and one hero label are translucent with edge highlights and shadow depth. Project descriptions remain on readable surfaces. Reduced-transparency and forced-color alternatives remain available.

## 3. Portfolio evidence and data presentation

[Nielsen Norman Group's portfolio case-study guidance](https://www.nngroup.com/videos/ux-design-portfolio-case-study/) emphasizes describing a design, the process behind the interface, and business impact. In this portfolio, only impact backed by supplied facts should ever be shown. Where there is no documented metric, use inspectable evidence instead: the real site screenshot, what the page contains, the type of project, and a direct link. Future case studies should capture the developer's role, constraints, implementation approach, decisions and tested outcomes—only once Waleed confirms those facts.

Applied here: the projects are not a homogeneous three-card grid. Nexora One is a wide lead case, Cowboy Burger reverses direction, and Café Aroma returns to a split. Labels distinguish website build, interactive demo and independent concept; descriptions/features refer to visible deliverables instead of fictional awards or conversion results.

## 4. Motion design and scroll narrative

[MDN's scroll-driven animations guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations) explains direct mapping between scroll progress and animation progress; it also distinguishes scroll-driven movement from a one-time scroll trigger. A scroll-linked object should advance and reverse with native scrolling rather than trapping the visitor in forced scroll. The page uses one document-progress model for scene and project planes, native anchors, perspective and conservative travel; it does not introduce a smooth-scroll engine that would alter history/restoration.

[MDN's `prefers-reduced-motion` reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) explains that scaling and panning can trigger discomfort for users with vestibular sensitivity. Applied here: static fallback remains, the decorative CSS float is disabled, scroll planes rest, and motion can be paused through an explicit control. A real device check is still required for the active WebGL session.

## 5. WebGL material and performance

[MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) recommends addressing WebGL errors, considering per-pixel VRAM cost and smaller drawing buffers, batching draw calls, and releasing resources when unused. Applied here: the scene uses a small set of custom meshes, caps pixel ratio, uses a single canvas, and retains non-WebGL HTML content/fallback. The geometry was changed from generic ring/sphere forms to a twisted ribbon and faceted crystal to establish a stronger silhouette.

## 6. Image loading and layout stability

[web.dev's CLS guide](https://web.dev/articles/optimize-cls?hl=en) documents image dimensions and reserved aspect ratios as a way to avoid layout shifts; the [responsive-images guide](https://web.dev/learn/design/responsive-images/) describes `srcset` and adapting image crops to viewport constraints. Applied here: project images have local responsive variants, dimensions and reserved aspect ratios; the hero image is prioritized, and lower project images can load lazily.

## 7. Contrast and accessibility

[WCAG 2.2 contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) sets 4.5:1 for normal text and 3:1 for large text. Solid token pairs were calculated; dynamic glass compositions are not claimed as measured because their background varies. Keyboard focus, semantic headings, skip link, menu close behavior, focus restoration, reduced motion, reduced transparency, and forced colors are supported in the implementation and tested where the environment permits.

## 8. Three directions compared

- **Material Index — selected:** editorial mineral paper, high-contrast teal/blue, warm and citrus accents, custom ribbon/crystal geometry, differentiated work composition, glass reserved for functional layers. Strongest balance of individuality, evidence presentation and implementation feasibility.
- **Field Notes Atelier — rejected:** tactile notebook, crop marks and annotation. Human and readable, but less tied to full-stack/interactive engineering.
- **Night Signal Lab — rejected:** dark technical gallery with luminous gates. Dramatic but more category-generic and risks competing with the supplied portrait and actual project screenshots.

No layouts, brand identities, code, or exact animation sequences from the sources were copied. The sources guide the review criteria; the visual concept remains project-specific.
