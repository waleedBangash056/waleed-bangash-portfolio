# Nexora CTA Desktop Fix — 22 October 2026

## Reported behavior

The Nexora One “Open website” action did nothing when clicked with a desktop pointer, while the same action navigated normally on mobile.

## Changes

- Kept the canonical destination as `https://nexora-one-dusky.vercel.app`.
- Set the progressive enhancement default to a safe external new tab (`target="_blank"`, `rel="noopener noreferrer"`) for mouse/trackpad devices.
- Added a responsive target policy: touch-first devices use `_self`, matching the reported mobile behavior; fine-pointer devices use `_blank`.
- Applies the same target policy to the Nexora preview image link and its primary “Open website” action.
- Removed parent-panel and CTA hover translations that can shift hit targets under a stationary desktop cursor. Hover feedback now comes from border, background, and shadow changes.
- Raised the project link stack order, retained explicit pointer events, and added a pointer cursor.
- Added regression tests for the rendered URL, desktop/touch target policy, and stationary hit areas.

## Validation

`npm test` and `npm run check` pass. The production build contains all four project cards and points Nexora to the canonical Vercel URL. The local preview returns HTTP 200 for the homepage and sampled local assets.

The remote Vercel site could not be fetched from the build environment, and full browser automation was unavailable, so remote uptime and click behavior on the live host could not be independently observed. The generated HTML and responsive targeting logic have been tested in the project test suite.
