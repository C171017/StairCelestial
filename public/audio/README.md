# Site music

The background track is [Cocteau Twins — Iceblink Luck (Instrumental) [Stem Filtered]](https://youtu.be/z2QKPDDApTE), uploaded by Acoolrocket DaJams. The complete track is approximately 199 seconds. `source.json` records its origin, stream IDs, output sizes, and SHA-256 hashes.

The audio-only streams were downloaded with yt-dlp:

- `ambient-loop.m4a`: native AAC-LC, approximately 130 kbps, 44.1 kHz stereo (format 140). Remuxed as a regular MP4 with `faststart` for Apple compatibility and progressive playback.
- `ambient-loop.webm`: native Opus, approximately 128 kbps, 48 kHz stereo (format 251).
- `ambient-loop.opus`: the same Opus stream remuxed into Ogg without re-encoding.
- `ambient-loop.mp3`: an MP3 VBR quality-2 fallback made from the native Opus stream. This is the only transcoded variant; converting to MP3 does not improve the source quality.
- `ambient-loop-low.m4a`: native HE-AAC, approximately 49 kbps (format 139), for browsers that explicitly support it and request data saving.
- `consent-sting.m4a`: the existing short opt-in sound, separate from the music.

`siteAudioPaths.ts` probes each MIME/codec combination with `canPlayType()`. Confident support takes priority over tentative support. Apple devices prefer AAC; other devices prefer Opus/WebM, then Opus/Ogg, AAC, and MP3. A data-saving request puts supported compact AAC first. Loading or decoding failures advance to the next supported source. Autoplay permission failures return the sculpture to its triangle so the visitor can retry. Only the selected source is requested; music uses `preload="none"` until a click. Music URLs include the source video ID to refresh the previous track in browser caches.

Clicking the triangle changes it into a cube and starts the music immediately with a 1.2-second smooth fade to 35% gain. Clicking the cube changes it back and fades to silence over 1.4 seconds before pausing. Resuming retains the playback position. Reversing a fade begins at the current gain; cancelled playback requests cannot restart the music. The track ends naturally without looping and the sculpture returns to its triangle. Clicking the triangle after the track ends replays it from the beginning.

Fades use a Web Audio GainNode on desktop and mobile. Context creation/resume and media playback happen synchronously in the click handler to satisfy mobile gesture requirements. The audio thread schedules the gain envelope independently of rendering. Browsers without Web Audio fall back to media-element volume. Automatic scene entry remains silent.

Reproduce the assets with:

```sh
python3 scripts/prepare-site-audio.py --ffmpeg /path/to/ffmpeg
```

The script downloads the three native streams, packages all variants, and decodes each complete result before replacing its public asset. Add `--source-dir /path/to/downloads` to reuse `source-140.m4a`, `source-251.webm`, and `source-139.m4a` without downloading them again.

Browser behavior references: [media codec support](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Audio_codecs), [media-element audio routing](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource), and [Web Audio autoplay practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).
