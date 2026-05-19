# 01 - Scene Blockout Prompt

## Use This Prompt In Blender MCP

```txt
Create a Blender blockout for a modern celestial infinite-stair portfolio scene.

Project context:
This scene will become part of a Three.js / React Three Fiber personal portfolio website. The final website uses scroll movement to guide the camera upward through an endless celestial spiral staircase. Project doors appear along the outer edge of the stairs.

Core rule:
Keep it modular, low-poly, clearly named, and export-ready for Three.js.

Goal:
Create the first rough composition only. Focus on scale, spiral shape, object placement, and camera readability.

Style:
Modern, premium, mysterious, architectural, minimal. Avoid fantasy, medieval, clutter, characters, spaceship interiors, and excessive decoration.

Scene requirements:
- Create a wide upward spiral staircase using simple low-poly geometry.
- Use about 24 stair segments arranged in a slow helix.
- Keep the spiral wide, not tight.
- Keep the center of the spiral open like a vertical cosmic void.
- Add 4 small floating platform landings along the outer curve.
- Place simple rectangular placeholder door frames on the platforms.
- Add a camera named camera_preview.
- Position camera_preview slightly outside the spiral, looking upward along the outer edge.

Materials:
- mat_stair_matte_white
- mat_platform_soft_gray
- mat_door_graphite
- mat_emissive_cyan

Naming:
- stair_01, stair_02, stair_03, etc.
- platform_01, platform_02, etc.
- door_placeholder_01, door_placeholder_02, etc.
- camera_preview

Constraints:
- Low-poly geometry only.
- No heavy textures.
- Keep stairs, platforms, and doors as separate objects.
- Do not join everything into one mesh.
- Do not add final decorative detail yet.

After creating the blockout, summarize:
- object count
- material list
- camera placement
- whether the spiral reads clearly from camera_preview
```
