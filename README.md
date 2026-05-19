# Celestial Stairway Portfolio

Interactive 3D portfolio homepage: scroll up an endless-feeling celestial spiral staircase and interact with project doors.

## Stack

- Next.js 15 + TypeScript
- React Three Fiber + Drei
- GSAP (door animation)
- Zustand (interaction state)
- Tailwind CSS 4

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Assets

GLB models live in `public/models/` (exported from Blender). Preview placeholders are in `public/previews/`.

## Controls

- **Scroll** — move the camera up the spiral
- **Click door once** — open door and show project preview
- **Click door again** — open project URL

## Project data

Edit `src/lib/projects.ts` to wire real project titles, preview images, and URLs.
