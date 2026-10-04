# Visual direction previews

October 4, 2026. Image-generation concept studies requested before implementation. These are approximate art-direction previews, not screenshots of completed code or performance-tested renders.

**Current decision:** the owner chose B2 floating porcelain and authorized implementation, including a reversible scroll-driven lighting clock. The homepage now implements that direction; see [implementation and actual browser evidence](../../docs/PORCELAIN-IMPLEMENTATION.md). The preview-stage notes below record the sequence of decisions and are superseded by this selection. Visual quality currently takes priority over performance tuning.

All four use `docs/validation/premium-pass/before-desktop.jpg` as the same composition reference. At generation time the live website remained at its pre-polish baseline. Interrupted early implementation work is retained in `docs/validation/premium-pass/paused-implementation.patch` and was not applied.

- A — Porcelain daylight: a faithful refinement of the current glass, porcelain and champagne palette.
- B — Carved alabaster: a warmer, quieter, mostly opaque architectural ribbon.
- C — Smoked crystal: a cool blue-hour variation, preview only; no day-to-night mechanism is implemented.
- D — Liquid silver: a bolder sculptural metal treatment with simple environment reflections.

Built-in image generation is used. Exact prompts and output details are recorded alongside the completed images. Geometry, contact shading, restrained material detail, environment reflections and image-based clouds are plausible implementation methods; generated lighting/reflections are an artistic target, not a guarantee of identical real-time output.

## Astra high review

These scores evaluate the generated concepts, not the implemented website or measured performance.

- **A: 8.2/10.** Best continuity with the current identity. Busy clouds and a glossy ribbon remain somewhat decorative.
- **B: 8.7/10.** Strongest material weight, craftsmanship and tactile quality. The tradeoff is losing the transparent ribbon's lightness.
- **C: 8.5/10.** Strongest atmosphere and contrast. Some portal illumination is too bright for the twilight environment; retain as a mood reference.
- **D: 7.8/10.** Elegant but closer to polished jewelry than organic tactility; uniformly glossy chrome is a risk.

Astra recommends B with A's cooler sky balance and clearer colored-glass interiors. If ribbon transparency is essential, choose A with B's satin frame profiles and fitted junctions. Exact generated reflections, refraction, contact glow, and cloud depth are not promises of real-time parity.

At this preview stage implementation awaited the owner's visual selection. The original device targets were M4-class or newer computers and A18/A19-class mobile devices; no performance was measured for these concept images.

## Porcelain connection comparison

The owner selected B for further exploration and requested a connected-versus-floating comparison before B implementation. Both new images use a warmer milk-ivory porcelain ribbon against pearl-white clouds with cool blue-grey shadows and a powder-blue sky. The floating image was generated from the connected one to keep their composition and palette closely matched.

- `b1-connected-pearl-sky.png` — portals sit directly on the ribbon with small integral fitted joints and contact shading.
- `b2-floating-pearl-sky.png` — portals hover above the ribbon with clear air gaps and soft cast shadows. This is intentional levitation, not failed contact.

Connected is the recommended starting point for B's calm architectural character. Floating is a valid alternative for a more playful, surreal character. Porcelain is an equally deliberate premium material direction, not a lesser-quality substitute for glass. Palette choices remain provisional until the owner chooses the connection treatment; avoid a uniform yellow wash or flat pure-white clouds.

Exact built-in generation prompts are in `porcelain-comparison-prompts.json`. Both remain concept images, not implemented rendering.

The owner separately authorized a new Astra Ultra chat and worktree to implement C with polished glass/reflections and continuous scroll-controlled daylight/sunset/night transitions. That request superseded the earlier day/night deferral for C. This original chat subsequently received approval to implement floating B2 and its own scroll-controlled lighting clock.
