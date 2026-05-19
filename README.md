# Celestial Stairway Portfolio

Interactive 3D portfolio homepage: scroll up a celestial spiral staircase and interact with project doors.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Controls

- **Scroll** — move camera up the spiral
- **Click door once** — open + preview
- **Click door again** — open project URL

## Project data

Edit `src/lib/projects.ts` and add preview images under `public/previews/`.

## Documentation (for agents & contributors)

**Start here:** [`docs/README.md`](docs/README.md)

| Doc | Purpose |
|-----|---------|
| [`docs/PROJECT.md`](docs/PROJECT.md) | Vision, rules, status, current focus |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Code map, GLBs, spiral, doors, state |
| [`docs/WEB-PHASES.md`](docs/WEB-PHASES.md) | Web implementation phases W1–W6 |
| [`blender/md/`](blender/md/) | Blender MCP prompts (complete) |

## Stack

Next.js · TypeScript · React Three Fiber · Drei · GSAP · Zustand · Tailwind · GLB assets from Blender
