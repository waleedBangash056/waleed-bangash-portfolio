# Art-direction explorations

Date: 18 October 2026. The actual portrait and supplied project assets were inspected before selecting a direction. The portrait is a dark formal studio image; Café Aroma contributes warm coffee photography; Cowboy Burger contributes a dark, warm food-brand image; the new Nexora One project image shows an editorial furniture/interior website branded Aurelia Living. Scores below are design judgments, not user-research results.

## Candidate 1 — Material Index (selected)

- **Thesis:** Treat the portfolio as an index of crafted digital materials: an airy mineral-paper canvas, deliberate editorial grids, and a single glass ribbon wrapping a faceted crystal. Use translucency to distinguish functional controls from the reading surface.
- **Emotional impression:** Refined, dimensional, curious, confident, colorful without turning into a neon dashboard.
- **Visual references:** [Taste Skill](https://github.com/Leonxlnx/taste-skill) for the brief → direction → screenshot critique process; [Microsoft Frontend Design Review](https://github.com/microsoft/skills/tree/main/.github/skills/frontend-design-review) for distinctiveness and clarity; [Apple Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass) for the hierarchy between functional glass layers and readable content.
- **Color relationships:** Soft mineral paper does the reading work; deep teal anchors navigation and high-contrast sections; cobalt and blue-glass provide depth; coral is reserved for emphasis; citrus is a controlled high-luminance accent. Colors are implemented as tokens and contrast-checked on solid surfaces.
- **Typography:** Local system fonts only. The display stack prefers a bookish serif with a humanist system sans and compact mono metadata. It avoids external font requests and the predictable all-geometric sans look that can make AI-generated sites feel interchangeable.
- **Glass treatment:** The header/navigation and selected controls use tinted translucency, saturation, deep blur, edge highlight and layered shadows. Project content remains on stable, clear surfaces instead of turning every card into glass.
- **3D signature:** A custom twisted ribbon and faceted crystal replace the prior atom-like arrangement of toruses and a sphere. The CSS fallback uses the same locally stored sculptural artwork; the WebGL scene is still a genuine geometry-based scene when the browser supports WebGL 2.
- **Scroll choreography:** The stage maps native document scroll to bounded scene progress. Image planes use perspective and lateral movement, then settle so the actual work can be read. No scroll hijacking or forced horizontal scrolling is introduced.
- **Work presentation:** Three projects with status/category, concise descriptions, feature-level evidence and direct links. Nexora One receives a wide lead case; Cowboy Burger reverses the split; Café Aroma uses the standard split. No fake clients, awards, testimonials, business results or impact counters are added.
- **Risks:** The active WebGL scene cannot be visually confirmed in the current container because its Chromium environment does not expose WebGL 2. The Nexora URL/screenshot name also needs final owner confirmation; details are recorded separately.

## Candidate 2 — Field Notes Atelier

- **Thesis:** A tactile portfolio notebook with paper edges, crop marks, handwritten annotations and a restrained frosted-acetate layer.
- **Strengths:** Personal and calm; the café imagery would fit naturally; highly legible at mobile sizes.
- **Reasons not selected:** More likely to read like a design-student journal than a frontend/full-stack developer’s portfolio, and does not satisfy the request for a strong real 3D signature as directly.

## Candidate 3 — Night Signal Lab

- **Thesis:** A dark technical gallery with luminous plates, hard typography, and an immersive camera path.
- **Strengths:** Strong contrast and a clear place for 3D.
- **Reasons not selected:** Dark/neon developer portfolios are common, the formal portrait already has a dark background, and translucent glowing surfaces can make readable project content harder to prioritize.

## Why Material Index won

The portfolio needs to make a clear human claim, show credible projects quickly, and differentiate itself without allowing the 3D object to become the whole point. Material Index gives the scene a recognizable form language, uses glass where it establishes a functional layer, and varies the work composition so each project is not just another card in a repeated grid. The reference sources inform the review process and principles; their layouts, brand identities, images and exact animation sequences are not copied.

## Portrait record

- Source files: `public/assets/portrait-480.webp` and `public/assets/portrait-800.webp`.
- Portrait identity: supplied image retained; no synthetic replacement or face edit.
- The portfolio uses framing, lighting-like CSS effects and composition for visual integration; it does not alter the person's identity.
