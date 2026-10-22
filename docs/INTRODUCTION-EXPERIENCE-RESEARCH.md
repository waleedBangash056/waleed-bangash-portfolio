# Talking-avatar introduction — research and implementation decisions

**Updated:** 2026-10-21

## Intended experience

A visitor explicitly presses **Play my introduction**. The portrait is then replaced by a real talking-avatar video of Waleed in a dark, modern creative office that fits the site's glass-and-crystal art direction. The person must visibly speak, maintain eye contact, blink naturally, make restrained professional gestures, and have mouth movement synchronized to one consistent voice. One video file carries picture and sound together. The visitor can stop or replay it and can continue scrolling the portfolio normally at any time.

The previous implementation failed this goal because it used a static photograph with browser speech synthesis and CSS movement. That behavior has been removed; the site never intentionally plays speech over a static portrait.

## Research and technology choice

- **Best fit for a photo-based, realistic presenter:** HeyGen Avatar IV's photo-avatar workflow. HeyGen's official documentation states that Avatar IV generates natural facial motion and can add gestures from a single image, with more expressive timing and emotion than a basic static-photo animation. A current HeyGen guide says Avatar IV is the appropriate default for Photo Avatars; Avatar V's newer real-person consistency is aimed at video-based avatars and does not support photo-based looks. Sources: https://help.heygen.com/en/articles/11269603-heygen-avatar-iv-complete-guide and https://help.heygen.com/en/articles/15544929-avatar-voice-faq-troubleshooting-best-practices-and-credits
- **Current product/API availability:** HeyGen announced Avatar IV API on 2026-10-20, describing photo-to-video generation with lip-sync, facial movement and gestures. Its announcement says API self-serve access is on Pro and Scale tiers. This portfolio does not call that API from the browser because a static site must not expose provider credentials. Source: https://www.heygen.com/blog/announcing-the-avatar-iv-api
- **Consistent professional voice:** render the whole introduction as one clip with one selected voice, not as separate browser TTS segments. For greatest authenticity, an owner-recorded voice track can be uploaded to the avatar workflow, subject to the provider's supported audio format. Using one continuous audio/video asset avoids browser/device voice differences and keeps the audio, lip-sync and gesture timeline together. HeyGen's official single-scene instructions document both script and uploaded-audio input and a custom motion prompt. Source: https://help.heygen.com/en/articles/12623520-animate-your-avatar-from-a-photo-using-the-single-scene-tool
- **Static-host deployment:** after rendering and matting, serve the transparent WebM locally at `/assets/waleed-introduction-alpha.webm`; retain the original MP4 only for the Safari canvas-keying fallback. This removes runtime dependence on a generation API, hides credentials, and keeps the visitor's experience independent of service uptime. `preload="none"` defers the large media request until the visitor chooses to play it.
- **Why not add Three.js or Live2D for this use case:** Three.js renders real-time WebGL scenes, but an engine alone cannot turn the supplied photograph into convincing speech, facial expressions or body gestures. Live2D requires an authored/rigged model and is stylized rather than a faithful photorealistic digital twin. The user asked for a realistic likeness with professional speaking behavior, so the rendered talking-avatar video is the better production fit. Sources: https://threejs.org/docs/pages/WebGLRenderer and https://docs.live2d.com/en/cubism-sdk-manual/cubism-sdk-for-web/
- **Accessible motion:** the introduction starts only after a user action; stop and replay controls are present, the script transcript remains available, the rest of the page stays scrollable, and CSS effects honor `prefers-reduced-motion`. Source: https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html

## Final narration script

> Hi, I'm Waleed Bangash. I build thoughtful digital experiences that combine bold design, smooth interactions, and reliable engineering. Welcome to my portfolio.

Use the script above in one generation pass so the same voice and audio track span the entire introduction. It describes only the role and approach already stated on the portfolio; it makes no unverified client or business-outcome claims.

## Recommended generation settings

- **Source photo:** `public/assets/portrait-800.webp`, the existing portrait supplied for this site. Keep glasses, facial hair, haircut, and identity consistent; avoid re-styling the face.
- **Workflow:** create/use a Photo Avatar; choose the single-scene Presenter Mode / Avatar IV photo workflow; use one full script or one uploaded narration track; choose one voice for the full clip.
- **Framing:** the supplied generated clip is full-body portrait orientation, with a locked camera and modest hand gestures. The website places that transparent cutout inside a tall stage over the office backdrop, then uses its own camera-like depth effects behind the person.
- **Motion prompt:** “A calm, confident software developer introducing his work to camera in a refined modern creative office. Preserve the person's identity and facial features. Maintain natural eye contact and blinking, subtle head nods, small shoulder and upper-body adjustments, a brief friendly smile, and one or two restrained open-palm gestures near chest height. Professional, warm and composed—not a sales pitch. No exaggerated hand movement, no sudden turns, no jump cuts, no dramatic camera motion, no on-screen text or logos. Dark teal and charcoal office, soft warm practical lights, understated glass and metal details, refined cinematic depth.”
- **Voice:** use one professional conversational English voice with measured pacing and natural pauses, not a theatrical announcer. If voice authenticity matters most, record your own voice with a clean microphone and upload the audio; a voice clone should only be created/used with your consent.
- **Delivery:** generate one MP4 containing the complete performance, then create a validated transparent WebM with the audio synchronized. The supplied clip is 720 × 1280, 24 fps, approximately 10 seconds and 10 MB or less. Avoid baking the checkerboard or captions into the person; if a future source includes an actual alpha channel, preserve it directly instead of keying.

Provider limits and pricing change. HeyGen's official pricing page currently lists a free tier and paid Creator tier, while Avatar IV uses credits with limits dependent on plan/account. Check the in-product cost before rendering; this portfolio does not require a recurring API integration. Sources: https://www.heygen.com/pricing and https://help.heygen.com/en/articles/15125761-heygen-credit-based-pricing-plans-subscriptions-explained

## Implementation state

- The HTML has a full-stage transparent video, a transparent idle poster, and custom controls. Video and audio play from one timeline; no browser speech synthesis is used.
- The build requires the WebM, MP4 fallback, poster, and their exact SHA-256 values in `data/intro-media-manifest.json`. It also validates container signatures and recorded QA metadata before enabling the intro.
- Chromium and Firefox use the WebM alpha track. Safari uses the source MP4 and a WebGL canvas keyer because alpha transparency in VP8/VP9 WebM is not supported consistently in Safari. If this fallback cannot initialize, the site keeps the borderless scene and idle avatar but disables play instead of showing the opaque checkerboard or reviving the old card.
- `public/assets/waleed-introduction.vtt` is optional. If present with the MP4, the build adds it as the English captions track. A transcript is available even without the video.
- Stop resets playback; the video `timeupdate` event drives progress and chapter captions; `ended` exposes the replay state. No browser `SpeechSynthesis` calls remain.
- The genuine user-supplied Smash & Sizzle screenshot is now used in the portfolio instead of the old generated cover. The wide image layout preserves the screenshot's full composition.

## Final media processing

The owner supplied a 10-second Gemini clip whose checkerboard was baked into the source pixels. The shipped transparent WebM was produced via a neutral-checkerboard matte extraction pass, with a Safari canvas-keying fallback using the original MP4. See `AVATAR-ALPHA-PIPELINE.md` and `VERIFICATION_REPORT.md` for the exact pipeline and remaining limitations.

## Verification scope

Build, TypeScript checking, automated tests, asset hashes, served paths and the encoded alpha plane have been checked. This environment timed out during headless Chromium startup, so a final website screenshot and real Safari playback audition still need confirmation on a local desktop/mobile browser.
