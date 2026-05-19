# 06 - Cleanup And Export Prep Prompt

## Use This Prompt In Blender MCP

```txt
Prepare the celestial spiral staircase scene for use in a Three.js / React Three Fiber website.

Project context:
The scene will be exported or partially exported as GLB assets. The final website will handle looping, camera movement, door animation, project previews, and some background effects in code.

Core rule:
Keep it modular, low-poly, clearly named, and export-ready for Three.js.

Critical animation rule:
Door panel must be separate, with hinge-side pivot/origin.

Goal:
Clean the Blender scene so it is practical for web export and later animation.

Cleanup requirements:
- Check that all important objects have clear names.
- Organize objects into collections:
  - stairs
  - platforms
  - doors
  - celestial_background
  - lights
  - cameras
- Keep modular pieces separate:
  - stair segments
  - platform landings
  - door frames
  - door panels
  - handles
  - emissive strips
  - preview screens
  - celestial bodies
- Confirm every door panel has hinge-side origin/pivot.
- Remove unused materials.
- Remove unnecessary hidden objects.
- Remove experimental clutter.
- Keep geometry low-poly and web-friendly.
- Apply transforms where appropriate, but do not break door pivots.

Export recommendations:
Recommend which objects should become reusable GLB assets and which should be recreated in Three.js code.

Preferred reusable GLB assets:
- stair_segment.glb
- platform_landing.glb
- project_door_portal.glb
- preview_screen.glb
- jupiter_planet.glb
- ringed_planet.glb

Recommended to recreate in code:
- starfield particles
- Milky Way backdrop or skybox
- fog settings
- loop/recycling logic
- camera path
- door open animations
- project preview images

Final report required:
- object summary
- collection summary
- material summary
- door pivot check
- export recommendations
- issues to fix before GLB export
```
