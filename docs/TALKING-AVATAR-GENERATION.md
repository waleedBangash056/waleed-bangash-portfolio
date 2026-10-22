# Talking-avatar generation notes

The owner has generated the 10-second introduction using Gemini. The generated source MP4 contains the checkerboard visible in its frame; it is **not an alpha-transparent video** despite the checkerboard appearance. The current production asset is produced by processing that MP4 into a real alpha-channel WebM.

The existing approved media files are:

- `public/assets/waleed-introduction-alpha.webm` — primary VP9 alpha video with the synchronized voice encoded as Opus.
- `public/assets/waleed-introduction-source.mp4` — original Gemini MP4, used only by the Safari WebGL canvas-keying fallback.
- `public/assets/waleed-avatar-poster.webp` — transparent still pose for the idle/finished state.
- `data/intro-media-manifest.json` — SHA-256 checksums and the alpha/audio verification record used by the build.

Do not replace the production WebM with the original MP4. The MP4 checkerboard must be removed by a real matting/segmentation operation and the resulting alpha plane verified before the manifest is updated. CSS movement or browser text-to-speech is not an alternative to the synchronized video.

For the actual conversion and browser compatibility details, see [`AVATAR-ALPHA-PIPELINE.md`](AVATAR-ALPHA-PIPELINE.md).
