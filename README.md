# Waleed Bangash — Developer Portfolio

<p align="center">
  <img src="public/assets/social-card.png" alt="Waleed Bangash portfolio cover: frontend and full-stack web development with a sculptural visual identity" width="100%" />
</p>

<p align="center">
  <strong>Design that draws you in. Engineering that keeps it useful.</strong>
  <br />
  A personal portfolio showcasing frontend and full-stack web work through considered visual design, purposeful interaction, and practical engineering.
</p>

---

## Overview

This portfolio presents selected website builds and concepts through an editorial layout, responsive project storytelling, and a distinctive sculptural visual layer. It is designed to show how a strong visual direction and thoughtful implementation can work together without sacrificing clarity, usability, or accessibility.

## Featured projects

| Project | Description | Live experience |
| --- | --- | --- |
| **Nexora One** | Furniture and interiors storefront focused on curated collections, showroom discovery, and consultation pathways. | [Open website](https://nexora-one-dusky.vercel.app) |
| **Cowboy Burger** | Interactive food-brand demo with a bold hero, scroll-led storytelling, menu exploration, and clear order or visit pathways. | [Open demo](https://cowboy.infinityfree.io) · [Source code](https://github.com/waleedBangash056/arena-cowboy-burger) |
| **Café Aroma** | Hospitality website concept featuring warm coffee imagery, menu discovery, and visit-oriented actions. | [Open concept](https://waleed-cafe.infinityfreeapp.com) |
| **Smash & Sizzle** | Restaurant website demo with food-first visual storytelling and clear paths to explore the restaurant experience. | [Open demo](https://smash-and-sizzle-demo.vercel.app) |

The Smash & Sizzle portfolio card uses original editorial cover artwork; open the live demo to inspect that project's deployed experience.

## Highlights

- **Scroll-driven visual story** — a persistent crystal artwork travels through the page with CSS perspective transforms and chapter-aware emphasis.
- **Selective glassmorphism** — translucent material effects are reserved for key surfaces instead of being applied indiscriminately.
- **Purposeful interactions** — selected project, process, and contact surfaces use subtle depth and pointer interactions.
- **Responsive layout** — content adapts to desktop, tablet, and mobile viewport sizes.
- **Accessible motion controls** — includes a user-facing motion toggle, respects the operating system's reduced-motion preference, and provides reduced-transparency and forced-colors fallbacks.
- **Lightweight static output** — no frontend framework, backend service, runtime JavaScript package dependencies, analytics, or external font/CDN requests are required to serve the built site.
- **Centralized project content** — profile details and featured project entries are maintained in `data/site-data.json`.

> **Implementation note:** The crystal is transparent artwork animated on a CSS perspective-transformed image plane. It is not a volumetric WebGL or GLB model. This preserves the intended artwork silhouette without shipping the earlier experimental mesh.

## Technology

- Semantic HTML
- Modern CSS, including perspective transforms, responsive layout, and material effects
- TypeScript for interaction and scroll-story behavior
- Node.js-based static build scripts
- npm for development tooling and tests

## Run locally

### Requirements

- [Node.js](https://nodejs.org/) 22 or newer
- npm, included with Node.js

### Setup

```bash
git clone https://github.com/waleedBangash056/waleed-bangash-portfolio.git
cd waleed-bangash-portfolio
npm install
npm run dev
```

The development server prints its local address. By default, it is `http://127.0.0.1:4173`.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install the project's development tooling. |
| `npm run dev` | Build the site and start the local development server. |
| `npm run build` | Generate the deployable static site in `dist/`. |
| `npm run preview` | Serve the most recently built `dist/` output locally. |
| `npm test` | Build the site and run the automated tests. |
| `npm run check` | Run the TypeScript check without emitting files. |

## Project structure

```text
.
├── data/
│   └── site-data.json          # Profile, contact details, and project content
├── design-assets/
│   └── smash-and-sizzle-cover.svg  # Editable vector master for the project cover
├── public/
│   └── assets/                 # Images, icons, and social preview artwork
├── src/
│   ├── index.template.html     # Page structure and content placeholders
│   ├── main.ts                 # Motion controls and pointer interactions
│   ├── scroll-story.ts         # Scroll-linked artwork and reveal behavior
│   └── scene.ts                # Experimental scene code; excluded from production build
├── styles/
│   ├── tokens.css              # Shared design tokens
│   └── site.css                # Layout, materials, effects, and responsive styles
├── tests/                      # Build-output and site-data tests
├── tools/                      # Static build and local-server scripts
├── docs/                       # Design decisions, implementation notes, and verification records
├── screenshots/                # Captured layout references and verification artifacts
├── package.json
├── tsconfig.json
└── README.md
```

The `data/site-data.json` file is the main place to update profile details and the featured project entries. The static build combines this data with the HTML template, copies public assets and styles, and compiles the TypeScript interaction code. The experimental `src/scene.ts` file is intentionally excluded from the production build.

## Build and deploy

Generate the production website:

```bash
npm install
npm run build
```

The deployable website is written to `dist/`. For a static host such as InfinityFree, upload the **contents** of `dist/` to the domain's web root (commonly `htdocs/`). The web root should contain `index.html` alongside the `app/`, `assets/`, and `styles/` folders. Do not upload the source project as a nested directory in place of those files.

The repository stores the source project. The generated `dist/` directory is excluded by `.gitignore`, so build output does not need to be committed for normal source control.

## Accessibility and motion

Motion is an enhancement, not a requirement for reading the content. The project includes a user-facing motion toggle, respects `prefers-reduced-motion`, and provides fallbacks for reduced transparency and forced-colors modes. Key information remains in document content rather than being conveyed only through animation.

## Contact

- **GitHub:** [@waleedBangash056](https://github.com/waleedBangash056)
- **LinkedIn:** [Waleed Ahmed Khan](https://www.linkedin.com/in/waleed-ahmed-khan-31807b3b1/)

For project enquiries, use the contact options on the portfolio website.

## License and asset rights

No open-source license is currently included. Unless a license is added, do not assume that others have permission to reuse, redistribute, or adapt this code. The images, logos, and branding shown in featured project entries may have separate rights and permissions; confirm those rights before publishing or reusing them.
