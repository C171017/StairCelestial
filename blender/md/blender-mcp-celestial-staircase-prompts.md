# Blender MCP Prompt Playbook: Celestial Spiral Stair Portfolio Scene

## Purpose

Use this document as a step-by-step prompt plan for creating a web-friendly Blender scene with an LLM connected to Blender MCP.

The output should support a Three.js / React Three Fiber personal portfolio website where users scroll through an endless celestial spiral staircase and interact with project doors.

## Project Overview Context

We are creating 3D assets and a scene prototype for an interactive personal portfolio website built with Three.js / React Three Fiber. The main concept is an endless celestial spiral staircase floating through space. As the user scrolls, the camera travels upward around the staircase. Along the outer curve of the stairs, there are modern project doors or portal frames. Each door represents a portfolio project. In the final website, the first click/tap will open the door and reveal a preview of the project, and the second click/tap will navigate to the project or detail page.

The desired visual style is fancy, modern, mysterious, cinematic, and premium. The scene should feel like a clean architectural gallery floating in a cosmic void, not a fantasy castle, not a spaceship interior, and not a cluttered sci-fi environment. The stairway should feel infinite, but this will be achieved through modular repeated geometry, fog, camera movement, and distant silhouettes rather than building a truly infinite staircase.

The final website needs to be smooth and fast on desktop and mobile, so all Blender output should be web-friendly: low-poly where possible, modular, clearly named, easy to export as GLB assets, and not dependent on heavy simulations or huge textures. Nearby stairs, platforms, and doors can have more detail, while distant stairs and celestial objects should be simplified. The celestial background should include one large Jupiter-like planet, one smaller distant ringed planet, a subtle Milky Way/starfield backdrop, and mist/fog to create depth and hide repetition.

The most important exported assets are reusable stair segments, platform landings, door/portal assets, preview screen planes, and lightweight celestial background elements. Door panels must be separate objects with hinge-side origins/pivots so they can be animated open in Three.js.

## Recommended Number Of Blender MCP Passes

Use six passes instead of one large prompt.

```txt
Go 1: Scene blockout
Go 2: Stair + platform modular refinement
Go 3: Door / portal assets with correct pivots
Go 4: Celestial background elements
Go 5: Lighting, fog, and camera composition
Go 6: Optimization and export cleanup
```

This keeps the result easier to inspect, correct, and optimize.

## General Prompting Rules

Always ask for:

```txt
Modular objects
Low-poly / web-friendly geometry
Clear object names
Clear material names
Separated animated parts
No unnecessary dense details
No heavy simulations
No huge textures
Export-ready GLB assets
```

Critical door rule:

```txt
Door panels must be separate objects with hinge-side origins/pivots, not center pivots.
```

## Go 1: Scene Blockout

```txt
Create a Blender blockout for a modern celestial infinite-stair portfolio scene.

Goal:
A wide spiral staircase floating in a cosmic void, designed for later use in Three.js / React Three Fiber.

Style:
Modern, premium, mysterious, architectural, minimal. Avoid fantasy, medieval, clutter, characters, and excessive decoration.

Scene requirements:
- Create a wide upward spiral staircase path using simple low-poly geometry.
- Use about 24 stair segments arranged in a slow helix.
- Add 4 small floating platform landings along the outer curve.
- Place simple placeholder rectangular door frames on the platforms.
- Keep the center of the spiral open, like a vertical cosmic void.
- Add a preview camera named camera_preview, positioned slightly outside the spiral, looking upward along the outer edge.
- Use simple materials:
  - mat_stair_matte_white
  - mat_platform_soft_gray
  - mat_door_graphite
  - mat_emissive_cyan
- Name objects clearly with prefixes:
  - stair_01, stair_02
  - platform_01
  - door_placeholder_01
  - camera_preview

Performance constraints:
- Low-poly geometry only.
- No heavy textures.
- Keep all parts modular and separated.
- Do not join the doors, platforms, and stairs into one mesh.

After creating it, summarize the object count, materials, and camera placement.
```

## Go 2: Refine Stairs And Platforms

```txt
Refine the staircase and platform assets from the current blockout.

Requirements:
- Make the stairs look like modern floating architectural slabs.
- Keep each stair segment as a separate object.
- Add subtle bevels to stair edges, but keep geometry web-friendly.
- Platforms should be larger landing slabs where project doors can sit.
- Add simple thin glass or metal edge details only where useful.
- Keep the visual style clean, premium, and minimal.
- Ensure the staircase still forms a slow wide spiral, not a tight spiral.
- Keep naming consistent.

Materials:
- matte warm white stairs
- soft gray platforms
- subtle glass or graphite trim if needed

Do not add complex ornaments, characters, or dense geometry.
```

## Go 3: Create Door / Portal Assets

```txt
Create one reusable modern project door / portal asset on each platform.

Critical animation requirement:
Each door panel must be a separate object with its origin/pivot on the left hinge edge, so it can rotate open in Three.js.

Door requirements:
- Rectangular graphite metal frame.
- Separate rotating door panel.
- Thin cyan-white emissive outline around the inner frame.
- Small simple handle.
- Flat preview screen plane behind the door.
- Preview screen should be separate and named clearly.
- Keep the door web-optimized and low-poly.

Names:
- door_01_frame
- door_01_panel
- door_01_handle
- door_01_emissive_strip
- door_01_preview_screen

Repeat this structure for each platform door:
door_02, door_03, door_04.

Do not merge the door panel with the frame. Do not put the pivot in the center.
```

## Go 4: Add Celestial Background

```txt
Add lightweight celestial background elements to the scene.

Requirements:
- Add one large Jupiter-like planet far in the background, partially visible from camera_preview.
- Add one smaller distant ringed planet.
- Add a subtle diagonal Milky Way band using a simple plane or backdrop object.
- Add a sparse starfield using lightweight small points or simple emissive dots.
- Add soft fog or mist volumes/planes to hide the far staircase repetition.

Performance constraints:
- Celestial bodies should be distant visual elements, not high-detail heavy models.
- Use simple spheres with procedural or simple materials.
- Keep star count reasonable.
- Do not create thousands of high-poly objects.
- Do not add animated simulations.

Composition:
The planets should support the staircase, not overpower it. The nearby door and staircase should remain the main subject.
```

## Go 5: Improve Lighting And Camera

```txt
Improve lighting and composition for a cinematic website hero view.

Requirements:
- Set camera_preview to a third-person view slightly outside the spiral staircase.
- Camera should look upward along the outer edge of the staircase.
- Nearby stairs and one nearby door should be clearly visible.
- Far stairs should fade into mist.
- Add soft area lighting and subtle rim lighting.
- Emissive door outlines should be visible but not too bright.
- The mood should be mysterious, premium, modern, and calm.

Add:
- key light
- soft fill light
- subtle rim light
- world background suitable for a cosmic scene
- fog/mist for depth

Avoid:
- harsh contrast
- overexposed neon
- cluttered stars
- dark unreadable stairs
```

## Go 6: Cleanup And Export Prep

```txt
Prepare the scene for use in a Three.js / React Three Fiber website.

Requirements:
- Check that all important objects have clear names.
- Keep modular pieces separate:
  - stairs
  - platforms
  - door frames
  - door panels
  - preview screens
  - celestial bodies
- Confirm each door panel has its hinge-side origin/pivot.
- Remove unnecessary hidden objects or unused materials.
- Keep geometry low-poly and web-friendly.
- Apply transforms where appropriate, but do not break animation pivots.
- Organize objects into collections:
  - stairs
  - platforms
  - doors
  - celestial_background
  - lights
  - cameras

Export guidance:
Recommend which objects should become reusable GLB assets and which should be recreated in code.

At the end, provide:
- object summary
- material summary
- export recommendations
- any issues to fix before GLB export
```

## Recommended Export Strategy

Prefer exporting reusable assets rather than one huge scene.

Recommended GLB assets:

```txt
stair_segment.glb
platform_landing.glb
project_door_portal.glb
preview_screen.glb
jupiter_planet.glb
ringed_planet.glb
```

Recommended things to recreate in Three.js code:

```txt
Starfield particles
Milky Way background plane or skybox
Fog settings
Loop/recycling logic
Camera movement path
Door open animations
Project preview images
```

## Final Design Direction Summary

```txt
Shape:
A slow wide spiral staircase.

Camera:
Guided third-person camera, slightly outside the staircase, scrolling upward around the outer edge.

Celestial bodies:
One large distant Jupiter-like planet, one smaller distant ringed planet, subtle Milky Way band, sparse starfield.

Performance sweet spot:
Real geometry only for nearby stairs, platforms, and doors. Use recycled segments, fog, simple silhouettes, particles, and background textures to create the infinite cosmic illusion.
```
