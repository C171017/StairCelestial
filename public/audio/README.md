# Site audio assets

| File | Purpose |
|------|---------|
| `consent-sting.m4a` | Short **opt-in** sound (~0.5s) on unmute during the eye overlay — **not** the background track |
| `ambient-loop.webm` | Background music (WebM/Opus); preferred when supported |
| `ambient-loop.m4a` | Same background music (AAC); Safari / iOS fallback |

Replace `consent-sting.m4a` with your own space-themed UI sting when ready (see below).

---

## Good sources for a “space opt-in” sting

**Libraries (search terms: `space ui`, `sci-fi confirm`, `cosmic whoosh`, `ethereal chime`)**

| Source | Notes |
|--------|--------|
| [Freesound.org](https://freesound.org) | Huge CC library; filter by license (CC0 easiest). Check attribution. |
| [Mixkit Sound Effects](https://mixkit.co/free-sound-effects/) | Free for projects; sci-fi / cinematic categories |
| [Pixabay Sound Effects](https://pixabay.com/sound-effects/) | Royalty-free; search “space” / “ambient” |
| [Sonniss GDC bundles](https://sonniss.com/gameaudiogdc) | Large free professional packs each year |
| [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/) | Strong atmosphere; read [licensing](https://sound-effects.bbcrewind.co.uk/licensing) for web use |

**AI-generated SFX (good for custom “outer space unlock” tones)**

| Tool | Notes |
|------|--------|
| [ElevenLabs Sound Effects](https://elevenlabs.io/sound-effects) | Text-to-SFX; e.g. “soft cosmic chime, deep space, 0.5 seconds, no melody” |
| [Stable Audio](https://stableaudio.com) | Short clips from prompts; watch license on free tier |
| [Meta AudioGen](https://github.com/facebookresearch/audiocraft) | Open model; run locally for full control |
| **DAW + synth** | Ableton/Logic + reverb + low-pass noise sweep — often beats generic AI for UI stings |

**Prompt ideas for AI**

- “Short UI confirmation, deep space ambience, soft synthetic chime, no drums, under one second, subtle reverb”
- “Ethereal sci-fi interface activate, quiet, non-musical, cinematic”

**Export tips**

- Mono or stereo, **0.3–0.8 s**, normalized but not loud (site plays at ~60% volume in code)
- **M4A (AAC)** is enough for the sting; keep background music as WebM + M4A

The current `consent-sting.m4a` is a **generated placeholder** (pink noise + low tone), not your song — swap the file and hard-refresh to test.
