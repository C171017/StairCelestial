# Contrasting spiral and frame finishes

**Final owner choice:** softly polished white marble stair and deep dark black
frames with restrained gold accents. This supersedes the brown/bronze frame
proposals below. See [the next-session build handoff](../../../docs/MATERIAL-BUILD-HANDOFF.md).
No final black/gold preview or runtime implementation has been produced here.

October 5, 2026. The owner requested several ranked color/material pairings
before choosing. The spiral and frames should have different identities, for
example warm frames against a white spiral or the inverse.

These are **generated proposals, not implemented alternatives**. All four use
the same actual browser capture as their image-edit reference and preserve the
overall scene, glass palette, composition and silhouettes closely. Small
differences in texture, lighting, reflections and cloud detail remain. Keep the
real-time implementation as the eventual acceptance reference; do not replace
the interactive scene with a generated image.

## Design ranking

This is an art-direction judgment for the owner's requested restrained,
high-end finish, not a measured award score.

| Rank / option | Spiral | Main frame | Character and tradeoff |
| --- | --- | --- | --- |
| 1 | Neutral-white honed marble | Satin champagne metal | Best balance of airy stone and warm frame contrast. Keep the gold desaturated to avoid an ornate impression. |
| 2 | Warm ivory alabaster | Pearl-white satin porcelain | Softer and luminous; the warm/cool hierarchy is reversed. Broad mineral movement should stay restrained. |
| 3 | Neutral-white honed marble | Muted brushed bronze | Strongest silhouette separation and architectural weight; darker frames attract more attention. |
| 4 | Cool-white satin porcelain | Pale brushed titanium | Most minimal and contemporary. Color contrast is subtle; the distinction relies more on metal versus ceramic response. |

1. [White marble / champagne](01-white-marble-champagne.png)
2. [Warm alabaster / pearl white](02-warm-alabaster-pearl.png)
3. [White marble / bronze](03-white-marble-bronze.png)
4. [White porcelain / titanium](04-porcelain-titanium.png)

At this intermediate stage the owner selected the **bronze frame family from
option 3**, requesting a slightly darker version. The final choice at the top
of this document supersedes that stage. The existing local marble trial remains
active; the chosen black/gold finish still needs implementation.

### Darker bronze follow-up

[Revised preview](03b-white-marble-darker-bronze.png) deepens the outer bronze
frame while retaining its lighter inner champagne reveal. It was generated
with the built-in image tool as an edit of option 3; [exact prompt](darker-bronze-prompt.txt).
The requested small perceived-brightness reduction is an art-direction target,
not a measured calibration. This image has not been applied to the runtime.

Recommended stair ranking with that frame: (1) white marble with a soft polish,
the stair family shared by options 1 and 3; (2) softly glazed pearl porcelain,
option 4; (3) honed warm alabaster, option 2. This ranks intended visual
character and finish, not measured reflectivity in the generated images.
Surface roughness and the lighting/reflection environment matter more to
reflection sharpness than the material label. Equal surface finishes can
produce similar reflection sharpness across these dielectric materials.

## Generation record

Built-in image generation; a specific GPT Image 2.5 model is not exposed or
verified. Each option was an independent edit of
`docs/validation/texture-refinement/after-day.jpg`; opaque output was requested.
[Exact prompts](prompts.json) are retained. Option 4 reuses the porcelain and
titanium study made immediately before the owner clarified contrasting pairs.
The earlier same-color warm alabaster preview is superseded by option 2.

These finishes can be explored using the existing meshes, mapped stone/ceramic
surfaces and tuned metallic response. New stone-map selection and live-render
matching follow the owner's choice. No new material assets were downloaded and
no runtime scene code was changed for this comparison.
