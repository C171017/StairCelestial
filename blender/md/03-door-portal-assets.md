# 03 - Door And Portal Assets Prompt

## Use This Prompt In Blender MCP

```txt
Create reusable modern project door / portal assets on the staircase platforms.

Project context:
Each door represents a portfolio project. In the final Three.js website, the first click opens the door and reveals a preview screen. The second click navigates to the project or detail page.

Core rule:
Keep it modular, low-poly, clearly named, and export-ready for Three.js.

Critical animation rule:
Door panel must be separate, with hinge-side pivot/origin.

Goal:
Create clean, modern, web-friendly door assets that can be animated in Three.js.

Door requirements:
- Create one door / portal asset on each platform.
- Use a rectangular graphite metal frame.
- Add a separate rotating door panel.
- Set each door panel origin/pivot on the left hinge edge.
- Add a thin cyan-white emissive outline around the inner frame.
- Add a small simple handle.
- Add a flat preview screen plane behind each door.
- Keep preview screens separate objects.
- Keep all parts low-poly and easy to select.

Required names for door 01:
- door_01_frame
- door_01_panel
- door_01_handle
- door_01_emissive_strip
- door_01_preview_screen

Repeat this structure for each platform:
- door_02_frame, door_02_panel, etc.
- door_03_frame, door_03_panel, etc.
- door_04_frame, door_04_panel, etc.

Materials:
- mat_door_graphite
- mat_door_panel_dark_graphite
- mat_emissive_cyan_white
- mat_preview_screen_soft_glow

Constraints:
- Do not merge the door panel with the frame.
- Do not put the door panel pivot in the center.
- Do not create ornate doors.
- Do not use heavy texture maps.
- Do not make emissive strips too bright.

After creating the doors, summarize:
- each door object group
- whether each panel has hinge-side pivot/origin
- preview screen placement
- material list
```
