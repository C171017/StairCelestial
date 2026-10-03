# Sanctuary asset provenance

## Sculptures

Created in the connected Blender instance for this reconstruction, with the original default scene preserved. Source: `blender/sanctuary-assets.blend`. Reproducible generation and export: `blender/build_sanctuary_assets.py`.

Runtime models are `public/models/sanctuary/music.glb`, `jazz.glb`, `atlas.glb`, and `network.glb`. They use local geometry and named PBR materials, with no external textures. The studio preview is a QA image and is not loaded by the website.

## Cloud background

Generated using the built-in image-generation tool, then converted to WebP with Sharp for delivery. Runtime file: `public/textures/sanctuary/cloudscape.webp` (1672×941, 38,138 bytes). The scene and CSS use matching aspect-preserving cover crops. This is a fixed background texture, not live volumetric clouds.

Final generation prompt:

> Use case: stylized-concept. Asset type: production backdrop texture for bright elegant browser 3D art portfolio. Create a very wide 16:9 luminous cloudscape with enormous refined negative space. Soft powder-blue upper sky, palest warm ivory at the lower horizon, spacious celestial sacred serenity. Painterly-photoreal high-end 3D atmosphere; beautiful softly sculpted white clouds gathered LOW in bottom fifth and far left and right edges. Nearly clear quiet pale blue/ivory sky through the center and upper 75% for foreground glass architecture to read. Very subtle late-morning champagne sunlight comes from upper left outside frame. No sun disc, no stars, no planets, no architecture, no objects, no text, no horizon terrain, no trees, no buildings, no ocean, no religious symbols, no purple/pink sunset, no dramatic high contrast, no grain. Crisp tasteful cloud detail along the bottom edges, airy distance and gently feathered vapor at horizon. Consistent perspective, clean modern art direction. Landscape, seamless-feeling edges. Overall brighter than a normal sky photograph, but preserve delicate cool shading in clouds.

## Procedural runtime geometry

The swept ribbon and rounded social plaques are authored in code. The LinkedIn lettering and GitHub emblem identify their destinations; personal profile links remain placeholders. No online model library is required at runtime.
