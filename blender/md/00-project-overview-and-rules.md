# 00 - Project Overview And Blender MCP Rules

## Project Goal

Create a web-friendly 3D scene prototype for a personal portfolio website built with Three.js / React Three Fiber.

The scene is an endless celestial spiral staircase floating through space. As the user scrolls, a guided third-person camera travels upward around the outer edge of the staircase. Along the staircase are modern project doors or portal frames. Each door represents a portfolio project. In the final website, the first click opens the door and reveals a project preview, and the second click navigates to the project or detail page.

## Visual Direction

The scene should feel fancy, modern, mysterious, cinematic, and premium. Think of a clean architectural gallery floating in a cosmic void.

Use this direction:

```txt
A slow wide spiral staircase.
A guided third-person camera slightly outside the staircase.
Modern graphite project doors on floating platforms.
Thin cyan-white emissive portal accents.
One large distant Jupiter-like planet.
One smaller distant ringed planet.
A subtle Milky Way band and sparse starfield.
Fog or mist hiding repeated geometry.
```

Avoid fantasy castles, medieval styling, spaceship interiors, cluttered sci-fi details, characters, dense decoration, or heavy simulations.

## Most Important Rules

Repeat these constraints in every Blender MCP pass:

```txt
Keep it modular, low-poly, clearly named, and export-ready for Three.js.
```

For interactive doors:

```txt
Door panel must be separate, with hinge-side pivot/origin.
```

These rules matter because the final website needs to animate doors, recycle stair segments, and run smoothly on desktop and mobile.

## Performance Strategy

Do not build a true infinite staircase. Build reusable nearby geometry and use visual tricks to imply infinity.

Use real geometry for:

```txt
Nearby stair segments
Platform landings
Door frames
Door panels
Preview screen planes
A few major celestial bodies
```

Use lightweight tricks for:

```txt
Starfield
Milky Way backdrop
Fog and depth fade
Distant stair silhouettes
Loop hiding
Camera movement illusion
```

## Recommended Blender MCP Sequence

Use seven files total:

```txt
00 - Project overview and rules
01 - Scene blockout
02 - Stair and platform refinement
03 - Door and portal assets
04 - Celestial background
05 - Lighting, fog, and camera
06 - Cleanup and export prep
```

Do not try to produce the final polished scene in one prompt. Build, inspect, refine, and keep the scene controllable.
