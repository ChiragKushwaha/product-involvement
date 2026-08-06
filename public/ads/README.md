# Advertisement videos

The eight stimulus videos from the study Drive folder are already here, mapped
in the folder's own numbering order:

```
public/ads/ad-1.mp4   Search Situation (h)L — Laptop, high involvement
public/ads/ad-2.mp4   Search Situation (l)L — Laptop, low involvement
public/ads/ad-3.mp4   Search Situation (h)F — Footwear, high involvement
public/ads/ad-4.mp4   Search Situation (l)F — Footwear, low involvement
public/ads/ad-5.mp4   Search Situation (h)H — Online course, high involvement
public/ads/ad-6.mp4   Search Situation (l)H — Online course, low involvement
public/ads/ad-7.mp4   Search Situation (h)D — Cold drinks, high involvement
public/ads/ad-8.mp4   Search Situation (l)D — Cold drinks, low involvement
```

Source: the `videos` subfolder of the study Drive folder. The Drive file
numbering matches the ad numbering exactly (1 = high-involvement laptop,
2 = low-involvement laptop, and so on).

To replace one, overwrite the file — no code change needed. Any ad *without* a
file falls back to the generated motion advertisement built from that
situation's `adScript` in `src/lib/situations-data.ts`, which autoplays and is
measured identically.

**Captions.** These files ship without captions. WCAG 1.2.2 requires captions
for prerecorded video with audio, so for a public deployment add a `.vtt`
beside each video and set `captionsSrc` on that situation in
`src/lib/situations-data.ts` (e.g. `captionsSrc: '/ads/ad-1.vtt'`). The player
renders the track only when that field is set.

## Requirements

- **Format** — MP4 (H.264 + AAC) plays everywhere. Add a `.webm` alongside only
  if you need it.
- **Aspect** — real videos play at 16:9 and are letterboxed rather than
  cropped, so nothing in frame is ever cut off.
- **Length** — the current set runs ~45 s. Watch time and completion are
  recorded regardless of length.
- **Size** — keep under ~10 MB each so playback starts quickly on mobile data.

## Playback behaviour

Playback starts automatically when the participant reaches the ad screen. It
attempts to play **with sound**; browsers that block unattended audio get a
muted retry plus a visible "Tap for sound" control. Participants can pause,
mute, and use *Rewatch again*.

## What gets recorded

- `videoWatchedSec` — seconds of advertisement actually played
- `videoCompleted` — whether it was played through to the end at least once
- `stimulusExposureSec` — total time on the ad screen, including rewatches
- `rewatchCount` — number of rewatches
