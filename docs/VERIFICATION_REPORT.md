# Verification report — transparent avatar release

## Media provenance and technical properties

- Input: owner-provided Gemini MP4, 720 × 1280, approximately 10 seconds, containing video and audio. Its checkerboard was baked into the pixels and the original file did not have an alpha plane.
- Output: `public/assets/waleed-introduction-alpha.webm`, VP9 video with WebM alpha plus Opus audio, 720 × 1280, 24 fps, 10.028 seconds.
- Supporting files: `public/assets/waleed-introduction-source.mp4` for the Safari fallback and `public/assets/waleed-avatar-poster.webp` as an alpha-transparent still.
- Validation: FFmpeg's libvpx-vp9 decoder extracted the alpha plane across all 240 frames. The extracted plane spans 0–255, confirming transparent and opaque pixels rather than an opaque checkerboard. The WebM stream includes a synchronized audio track.
- Integrity: `data/intro-media-manifest.json` records SHA-256 digests of the exact reviewed video and poster files. The build only enables the player when those hashes, media headers, dimensions, frame count, and review markers match.
- Screenshot: `public/assets/smash-and-sizzle.webp` and `smash-and-sizzle-640.webp` use the actual screenshot supplied by the owner, not the earlier generated cover.

## Engineering decisions

- Chromium and Firefox use the alpha WebM directly, which keeps voice, lip-sync, and body motion on one timeline. The video is user-initiated and has no native player chrome.
- Safari is detected separately because its WebM VP8/VP9 alpha support is not equivalent. The site uses the original MP4 as a source for a WebGL canvas keyer that removes the baked neutral checkerboard per frame while preserving audio timing. If WebGL setup fails, the UI keeps the transparent poster and 3D scene but disables playback rather than exposing the checkerboard or showing the old framed portrait card.
- `.htaccess` explicitly declares WebM, MP4, WebP, and WebVTT MIME types for shared-host deployments.
- The build compares asset SHA-256 digests to the checked-in manifest so accidentally replacing the video with an opaque file cannot silently turn on playback.

## Localized matte refinement — 2026-10-22

- User-reported issue: white/gray source-checkerboard fragments near the hanging left-side hand during the opening/closing poses, plus a pale wedge inside the viewer-right elbow/sleeve gap.
- Fix: applied source-specific, connected-component cleanup restricted to the hand/finger negative-space region and inner-elbow gap across the complete 240-frame clip; refined the same hand gap in the idle poster. The rest of the avatar alpha matte was not globally altered.
- Verification: re-encoded the WebM with the existing Opus audio, decoded the final file again with the libvpx-vp9 alpha extractor, and inspected frames at 0, 1, 2, 8, and 9 seconds. Alpha values still span 0–255. The targeted regions had zero opaque near-neutral background candidates under their QA thresholds after re-encoding.
- Media hashes were updated in `data/intro-media-manifest.json`; the build/test suite asserts the reviewed local correction metadata and checks the exact asset digests.
- QA images: `screenshots/avatar-alpha-contact-sheet.jpg` and `screenshots/avatar-matte-correction-before-after.jpg`.

## Automated checks

- `npm test`: 17 tests passed (the suite checks generated markup, project links, local assets, MIME configuration, the reviewed media manifest, and the four segment introduction script).
- `npm run check`: TypeScript check passed.
- `npm run build`: production static build succeeded.
- Local HTTP checks: main document, compiled JavaScript, CSS, alpha WebM, Safari source MP4, avatar poster, office backdrop, and both Smash & Sizzle screenshot sizes were served successfully; WebM was returned as `video/webm`.
- Archive QA: deployment and source archives are assembled after the final build; file hashes are checked against the built output before release.

## Known limitations

- The original clip was generated against a checkerboard rather than a true alpha background, so the transparent result is reconstructed by matte extraction. The background scene was also refined to provide clear floor space under the full-body avatar, and the portal graphic is open at the bottom so it reads as spatial architecture rather than a video frame. The edge quality was inspected over contrasting backgrounds; very fine hair strands and some edge motion may retain minor matting artifacts. This is a more honest limitation than calling the original MP4 natively transparent.
- Safari's canvas keyer is a browser-side fallback and can produce slightly less precise edges than the preprocessed alpha WebM.
- A Playwright navigation attempt was blocked by the container browser policy (`net::ERR_BLOCKED_BY_ADMINISTRATOR` for localhost), so a browser-rendered current-page screenshot and a live Safari audition could not be completed here. The avatar cutout was still composited and inspected across ten video timestamps against the final office scene. This is useful media QA, but not a substitute for testing the real website in a normal browser. Automated checks and direct alpha-plane validation were completed, but they are not a substitute for the owner trying the published page on a real desktop and phone.
