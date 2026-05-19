# 3D Infinite Stair Portfolio Tech Stack

## Project Concept

The website is a 3D personal portfolio built around an infinite stairway illusion. The user moves up and down a staircase that appears endless, with project doors placed along the path. Each door represents a project, experiment, website, or personal showcase item.

Interaction flow:

1. The user scrolls or moves along the stairway.
2. Doors appear along the staircase in a repeating loop.
3. The first interaction opens a door and reveals a project preview.
4. A second interaction opens the actual project link or detail page.
5. The stairway feels infinite, but technically reuses a limited number of stair and door objects.

The experience should work on both desktop and mobile. On mobile, scrolling should move the user up and down the stairway, with tap interactions for doors. On desktop, scroll and pointer interactions should behave similarly.

## Recommended Tech Stack

Minimum recommended stack:

```txt
Next.js
TypeScript
React
Three.js
React Three Fiber
Drei
GSAP
Zustand
Tailwind CSS
Blender
glTF / GLB
Vercel
```

## Why This Stack

### Next.js

Next.js should be used as the main website framework. It provides routing, page structure, metadata, SEO support, image handling, and a clean deployment path.

The 3D stairway can live on the homepage, while individual project pages can use regular HTML, CSS, and React components. This keeps the website visually impressive while still being usable, accessible, and searchable.

### TypeScript

TypeScript should be used to make the project easier to maintain as the 3D scene grows. It helps define project data, door states, animation states, and component props clearly.

Example data structure:

```ts
type Project = {
  id: string;
  title: string;
  description: string;
  previewImage: string;
  url: string;
  doorIndex: number;
};
```

### React Three Fiber

React Three Fiber is the React renderer for Three.js. It allows Three.js scenes to be written as React components.

Instead of manually creating and updating Three.js objects, the site can use components like:

```tsx
<Canvas>
  <Stairway />
  <ProjectDoor />
  <Lights />
  <CameraRig />
</Canvas>
```

This is a good fit because the portfolio will combine normal React UI with a 3D world.

## Key Libraries To Understand

## Drei

Drei is a helper library for React Three Fiber. It provides ready-made tools that make common 3D website tasks much easier.

Useful Drei features for this project:

```txt
ScrollControls
useScroll
Html
Text
useGLTF
Environment
ContactShadows
Float
PresentationControls
```

Recommended uses:

- `ScrollControls` can connect the user's scroll position to movement through the stairway.
- `useScroll` can read scroll progress and use it to move the camera or scene.
- `Html` can place regular HTML labels or buttons inside the 3D world.
- `Text` can render 3D text labels near doors.
- `useGLTF` can load GLB models exported from Blender.
- `Environment` can add realistic lighting and reflections.
- `ContactShadows` can make stairs and doors feel grounded.

For this portfolio, Drei should be treated as the practical toolkit that reduces the amount of low-level Three.js code needed.

## GSAP

GSAP is an animation library. It is useful for precise, cinematic animations that need to feel smooth and controlled.

Recommended uses:

- Animate the camera moving up or down the stairs.
- Open and close doors with smooth rotation.
- Animate project previews fading or sliding into view.
- Coordinate scroll progress with scene movement.
- Create polished transitions between idle, hover, open, and navigate states.

Example interaction idea:

```txt
User clicks door
Door rotates open
Preview image fades in behind door
Camera subtly moves closer
Second click navigates to project
```

GSAP is especially helpful because this website depends on timing and presentation. The project does not need a physics engine at first; it needs strong animation control.

## Zustand

Zustand is a small state management library for React. It is useful for sharing state between the 3D scene and regular UI components.

Recommended state to store:

```txt
activeDoorId
openedDoorId
currentProject
scrollProgress
isPreviewOpen
cameraMode
isMobile
```

Example use cases:

- A door component can update `activeDoorId` when hovered or tapped.
- The overlay UI can read `currentProject` and show project information.
- The camera controller can react when `openedDoorId` changes.
- The navigation system can know whether the next click should open a preview or go to the project.

Zustand keeps the interaction logic organized without passing props through many nested 3D components.

## glTF / GLB

`glTF` and `GLB` are 3D model formats commonly used on the web.

For this project, Blender should be used to create or edit models such as:

```txt
stairs
doors
door frames
handles
platforms
clouds
portal frames
small decorative objects
```

The final models should usually be exported as `.glb` files.

Difference between formats:

- `.gltf` is usually a JSON file with separate texture and binary files.
- `.glb` is a single packed binary file containing the model, materials, and texture references.

Recommended approach:

```txt
Create or edit models in Blender
Export as GLB
Place files in /public/models
Load them with Drei's useGLTF
```

Example:

```tsx
const stairModel = useGLTF('/models/stair-segment.glb');
```

GLB is recommended because it is easier to manage in a web project.

## Suggested Architecture

```txt
app/
  page.tsx
  projects/
    [slug]/
      page.tsx

components/
  scene/
    StairwayScene.tsx
    StairSegment.tsx
    ProjectDoor.tsx
    CameraRig.tsx
    DoorPreview.tsx
    Lights.tsx
  ui/
    ProjectOverlay.tsx
    Navigation.tsx
    LoadingScreen.tsx

lib/
  projects.ts
  store.ts
  animation.ts

public/
  models/
    stair-segment.glb
    door.glb
    door-frame.glb
  previews/
    project-one.png
    project-two.png
```

## Implementation Notes

The stairway should not actually be infinite. Instead, create a limited set of stair and door segments, then loop or recycle them as the user scrolls.

Recommended illusion strategy:

```txt
Create 12-20 stair segments
Create 6-10 reusable door positions
Move or recycle segments based on scroll progress
Keep the camera moving in a controlled path
Use fog, clouds, lighting, or distance fade to hide repetition
```

For the first version, project previews should be static images rather than live iframes. Static previews are faster, easier to optimize, and more reliable on mobile.

Live previews can be added later for selected projects if performance allows.

## Build Priority

Recommended MVP order:

1. Build the basic Next.js site.
2. Add a React Three Fiber canvas.
3. Create a simple stairway path using repeated geometry.
4. Add scroll-based camera movement.
5. Add simple placeholder doors.
6. Add click or tap interaction.
7. Add door opening animation with GSAP.
8. Add project preview images.
9. Add Zustand state management.
10. Replace placeholder geometry with GLB models from Blender.
11. Optimize for mobile performance.
12. Deploy on Vercel.

## Final Recommendation

Use this stack:

```txt
Next.js + TypeScript + React Three Fiber + Drei + GSAP + Zustand + Tailwind CSS + Blender/GLB + Vercel
```

This stack is strong for a portfolio that is part website, part interactive 3D experience. It avoids unnecessary complexity while still supporting cinematic camera movement, interactive doors, reusable project data, and custom 3D assets.
