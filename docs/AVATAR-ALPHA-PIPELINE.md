# Transparent talking-avatar pipeline

## Shipped files

| File | Role |
| --- | --- |
| `public/assets/waleed-introduction-alpha.webm` | Primary VP9/WebM video with a real alpha plane and Opus audio. Used by Chromium and Firefox. |
| `public/assets/waleed-introduction-source.mp4` | Original 10-second Gemini H.264/AAC file. The checkerboard was baked into its pixels; do not serve this file directly as a transparent video. Used only by the Safari fallback. |
| `public/assets/waleed-avatar-poster.webp` | Still full-body cutout with WebP alpha. Shown before the introduction starts and after it ends. |
| `public/assets/intro-studio.webp` | Studio background layer. |
| `data/intro-media-manifest.json` | SHA-256 hashes and recorded validation metadata for the exact reviewed source, alpha video, and poster. |

## Why a matte pass was needed

The Gemini source looked checkerboard-transparent in its preview, but the MP4 used standard H.264 `yuv420p` and did not contain alpha. The checkerboard was therefore present as ordinary gray pixels. A source-specific neutral-checkerboard matte was calculated across all 240 frames, with neutral-edge decontamination to reduce gray halos. On 2026-10-22, a localized cleanup pass additionally removed residual pale patches from the left-hand/finger gaps and the inner viewer-right elbow/sleeve gap. The cleanup is restricted to those audited regions rather than globally keying bright pixels, preserving the surrounding skin, glasses, clothing, and hair. The frames were encoded as VP9 WebM with `yuva420p`, preserving the original synchronized narration as Opus. The idle poster received the same targeted hand-gap correction and was exported as WebP RGBA.

This is a reconstructed matte, not an alpha channel emitted by Gemini. The final encoded file was decoded again, and the two target regions were checked across all frames for opaque near-neutral background components. Those checks found none. Fine hair wisps and unrelated fast-moving edges can still retain minor matte artifacts; the original MP4 itself cannot be recovered as true transparency without processing.

## Media checks performed

The final WebM is 720 × 1280, 24 fps, about 10.008 seconds, containing VP9 and Opus streams. FFmpeg's libvpx-vp9 decoder was explicitly used to extract the alpha channel across all 240 frames. The plane included values from 0 to 255, showing transparent and opaque areas. The source MP4 is about 2.3 MB, the alpha WebM about 2.1 MB, and the poster about 42 KB.

The build checks EBML/WebM, MP4 `ftyp`, and RIFF/WEBP signatures; it then validates SHA-256 hashes against `data/intro-media-manifest.json`, including a recorded alpha-plane check. This is a fail-closed guard against replacing an asset without revalidating it. A checksum does not itself decode video; the actual alpha-channel check is recorded in the manifest only after the frame-wide FFmpeg inspection.

To re-run the alpha-plane check on a machine with FFmpeg compiled with libvpx VP9 support:

```bash
ffmpeg -hide_banner -loglevel error \
  -c:v libvpx-vp9 \
  -i public/assets/waleed-introduction-alpha.webm \
  -vf "alphaextract,signalstats,metadata=print:file=alpha-plane-stats.txt" \
  -an -f null -
```

The report should include 240 video frames and alpha-plane `YMIN`/`YMAX` values spanning 0–255. Do not rely on a default `ffprobe` pixel-format field alone: WebM VP9 alpha is encoded using WebM's additional alpha data and the default decoder may report `yuv420p` while discarding the alpha plane.

## Localized edge correction — 2026-10-22

A review identified pale checkerboard remnants near the left-side hand/finger gaps and a white/gray wedge inside the viewer-right elbow-to-torso gap. A local matte pass was applied to all 240 frames in two protected regions and to the still poster. It detects connected, neutral background-colored pixels and expands only within those small regions; it does not globally key bright pixels. After VP9 re-encoding, the alpha stream was extracted again across the complete video. No remaining opaque neutral components were found in the validated hand and inner-elbow test regions. See `screenshots/avatar-alpha-contact-sheet.jpg` and `screenshots/avatar-matte-correction-before-after.jpg` for visual QA.

## Browser playback

- **Chromium and Firefox:** play `waleed-introduction-alpha.webm` directly. The audio, facial motion, and gestures remain synchronized in one media timeline.
- **Safari:** Safari does not consistently support alpha transparency in VP8/VP9 WebM. The code uses the original H.264 MP4 as a source texture, keys the neutral gray checkerboard in a WebGL canvas, and keeps the audio from that same video element. This fallback uses a chroma/luma approximation; the alpha WebM is preferred for best edges.
- **Fallback behavior:** if WebGL initialization fails on Safari, the UI retains the standing transparent poster and scene but disables Play. It never shows the checkerboard or displays the old framed picture-card.
- **User control:** the video starts only on the visitor's click; no autoplay sound is used. The visitor can stop or replay it and scroll the rest of the page normally. The transcript remains available separately.

## Shared hosting / InfinityFree

The build outputs the finished files to `dist/`. Upload the **contents** of `dist/` to `htdocs`, preserving `assets/`, `app/`, and `styles/`. The `.htaccess` in `dist/` explicitly declares `video/webm`, `video/mp4`, `image/webp`, and `text/vtt` MIME types for shared hosting. Do not upload the source tree as a nested directory in place of the web root.

## Replacing the avatar later

After generating a new video:

1. Keep an untouched copy of the provider's source file outside the deployment folder.
2. Confirm the source contains real alpha before assuming it is transparent. If it contains a checkerboard, it must be matted again.
3. Re-export the primary WebM with a verifiable alpha plane and synchronized audio; update the Safari fallback MP4 and poster.
4. Run the full-frame alpha extraction test, check the edges on light and dark backgrounds, and audition the voice/lip-sync.
5. Update the corresponding SHA-256 values and media metadata in `data/intro-media-manifest.json` only after those checks.
6. Run `npm run build`, `npm test`, `npm run check`, and inspect the page in current desktop and mobile browsers before deploying.

Never update the manifest merely to make the Play button available: the hashes are intended to keep unreviewed opaque media from silently appearing as a transparent avatar.


## Research references

- [MDN: Web video codecs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs) documents VP8/VP9 alpha support in Chromium/Firefox and the Safari transparency limitation that motivates the canvas fallback.
- [web.dev: Animations and performance](https://web.dev/articles/animations-overview) recommends preferring `transform` and `opacity` for smooth animations rather than repeatedly changing layout geometry. The surrounding studio uses CSS perspective and transforms, not continuous DOM layout changes.
- [MDN: `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion) explains the system preference used by the site to reduce nonessential movement.
- [Robust Video Matting (official repository)](https://github.com/PeterL1n/RobustVideoMatting) is a possible future upgrade for source clips without a clean, consistent background. This release uses a source-specific checkerboard matte because the supplied clip had a stable near-neutral background; RVM was not used to create these files.
