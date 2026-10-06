# Honed ivory material study

October 5, 2026. Generated with the built-in image tool using the **implemented**
material pass as the image-edit reference. The tool exposes no model selector;
the requested GPT Image 2.5 identifier is unverified.

- [Generated study](faithful-material-study.png)
- [Exact prompt](prompt.txt)
- [Actual browser render](../../../docs/validation/texture-refinement/after-day.jpg)
- [Baseline browser render](../../../docs/validation/texture-refinement/before.jpg)
- [Design and implementation notes](../../../docs/TEXTURE-REFINEMENT.md)

The study preserves the overall composition, shape count, placement and color
family closely. It slightly strengthens veining, warmth and local contrast,
reinterprets some cloud detail, and removes the development badge. It is not a
pixel-identical website screenshot or a replacement background. The actual
browser capture and local website are the reference for implemented quality.

The generation call used `after-day.jpg` as its single local edit target and
requested an opaque output. The original generated file remains under Codex's
generated-images directory; this project copy is the review artifact.
