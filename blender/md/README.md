# Blender pipeline — agent reference (complete)

**Status: complete.** GLBs live in `public/models/`. Source: `blender/stairCelestial.blend`.

Do **not** run blockout prompts (`01`) unless the user explicitly wants to rebuild assets from scratch.

## When to use these files

| Situation | File |
|-----------|------|
| Re-export or fix modular naming/pivots | `06-cleanup-export-prep.md` |
| Add/refine door hinge or emissive | `03-door-portal-assets.md` |
| Understand visual rules | `00-project-overview-and-rules.md` |
| Full MCP prompt copy-paste | `blender-mcp-celestial-staircase-prompts.md` |

## Exported assets (expected)

```txt
stair_segment.glb
platform_landing.glb
project_door_portal.glb
preview_screen.glb
jupiter_planet.glb
ringed_planet.glb
```

## Critical export rules

```txt
Keep it modular, low-poly, clearly named, export-ready for Three.js.
Door panel separate; hinge-side pivot/origin (not center).
```

## Web work

Active implementation phases: [`../../docs/WEB-PHASES.md`](../../docs/WEB-PHASES.md)
