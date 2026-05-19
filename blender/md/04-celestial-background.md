# 04 - Celestial Background Prompt

## Use This Prompt In Blender MCP

```txt
Add lightweight celestial background elements to the existing staircase scene.

Project context:
The website should feel mysterious and cosmic, but it must remain smooth and fast. Celestial bodies should create atmosphere, not become heavy foreground assets.

Core rule:
Keep it modular, low-poly, clearly named, and export-ready for Three.js.

Goal:
Create a vast cosmic feeling using simple, lightweight elements.

Requirements:
- Add one large Jupiter-like planet far in the background.
- Make the Jupiter-like planet partially visible from camera_preview.
- Add one smaller distant ringed planet.
- Add a subtle diagonal Milky Way band using a lightweight plane, backdrop, or simple material.
- Add a sparse starfield using lightweight points or simple emissive dots.
- Add soft fog or mist elements to hide far staircase repetition.

Composition:
- The staircase and nearby door should remain the main subject.
- The large planet should feel distant and majestic, not overpowering.
- The ringed planet should be smaller and farther away.
- The Milky Way should be subtle, not noisy.
- Stars should be sparse and refined.

Performance constraints:
- Do not create thousands of separate star mesh objects.
- Do not use high-poly planets.
- Do not add animated simulations.
- Do not use huge texture files.
- Prefer simple procedural materials or lightweight image planes.

Suggested names:
- planet_jupiter_large
- planet_ringed_small
- milky_way_backdrop
- starfield_points
- mist_depth_01

After adding background elements, summarize:
- celestial object list
- starfield method
- fog/mist method
- any elements that should be recreated in Three.js instead of exported
```
