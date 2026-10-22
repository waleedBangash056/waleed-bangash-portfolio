# Final portfolio polish — 22 October 2026

## Changes

- Nexora One `Open website` CTA and preview image use the exact root URL `https://nexora-one-dusky.vercel.app` without URL-normalization slash drift, navigate in the current tab, and carry a stable `data-project-action="nexora-live"` hook.
- Other project previews preserve their existing new-tab behavior. Source links use `rel="noopener noreferrer"`.
- Project descriptions use a single smoked-petrol content surface: near-opaque dark teal, warm ivory title/body, high-contrast muted support text, and a per-project accent. Description and feature rows no longer appear as separate frosted mini-cards.
- The project links retain focus-visible outlines, pointer interactions, touch target sizing, responsive adjustments, reduced-motion handling, reduced-transparency fallback, and forced-colors styling.
- Added build-output assertions for the direct Nexora destination and target, smoke-material structure, accessibility fallback selectors, and WCAG AA contrast calculations.

## Research basis

The visual choice intentionally reduces the amount of glass used behind long text. Apple’s [Human Interface Guidelines — Materials](https://developer.apple.com/design/human-interface-guidelines/materials) describe Liquid Glass as a functional layer, advise against using it throughout content surfaces, and recommend thicker material when legibility needs protection. Nielsen Norman Group’s [Glassmorphism: Definition and Best Practices](https://www.nngroup.com/articles/glassmorphism/) explains the risk of insufficient text contrast and recommends adjusting materials for readability. W3C’s [WCAG 2.1 criterion 1.4.3: Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) sets a contrast minimum of 4.5:1 for standard text. The implemented color pairs exceed that threshold when measured against the card’s darkest base surface: ivory body text ≈ 12.23:1, pale support text ≈ 9.66:1, and the four project accents against the ink-colored primary-action text range from approximately 6.30:1 to 7.75:1.

## Nexora link caveat

The generated anchor is verified to use the requested exact domain and current-tab behavior. The deployment URL itself could not be fetched from this environment (the remote browsing tool returned a cache-miss error and local network resolution is unavailable), so this report does not claim that the remote Vercel deployment is currently healthy. If the target itself returns a deployment error after clicking, verify in the Vercel dashboard that the deployment still exists and the domain is assigned correctly; this is distinct from the local portfolio href.

## Verification

- `npm test`: 20 passed, 0 failed.
- `npm run check`: passed.
- Static CSS parsing: see packaged verification output.
- Generated HTML asserts: exact Nexora href, `_self` target, action identifier, all four project entries, live demo links, source link, and unique document IDs.
