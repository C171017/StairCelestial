# Agent documentation index

**Read this first.** These files are written as prompts for AI agents working on this repo.

## Keeping docs in sync (required)

**If you change design, UX, interaction, layout constants, or add/remove key files**, update the docs in the **same task** before finishing — especially before push/PR.

| You changed… | Update at minimum |
|--------------|-------------------|
| Door click / zoom / scroll behavior | [ARCHITECTURE.md](./ARCHITECTURE.md) § Door interaction & zoom |
| `spiral.ts` placement or camera constants | [ARCHITECTURE.md](./ARCHITECTURE.md) § Spiral layout |
| `projects.ts` URLs or project list | [PROJECT.md](./PROJECT.md) status + [WEB-PHASES.md](./WEB-PHASES.md) W4 |
| New `src/lib/*.ts` module agents must know | [ARCHITECTURE.md](./ARCHITECTURE.md) folder map |
| User-facing controls copy | Root [README.md](../README.md) Controls + `ProjectOverlay.tsx` |
| Phase completed or new priority | [PROJECT.md](./PROJECT.md) checklist + [WEB-PHASES.md](./WEB-PHASES.md) |
| Something not covered anywhere | Add a short section to ARCHITECTURE or WEB-PHASES — avoid orphan knowledge |

**Do not** assume Blender `blender/md/` files describe current web behavior; they are export-time prompts. **Do** treat `docs/` + root `README.md` as the live web spec.

When the user asks to push: verify docs match code; if they diverge, update docs in that commit.

## Read order

1. **[PROJECT.md](./PROJECT.md)** — vision, constraints, status, current focus
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — repo map, spiral/pool/scroll/camera, doors & zoom
3. **[WEB-PHASES.md](./WEB-PHASES.md)** — web phases W1–W6 and what to do next

## Blender (complete — reference only)

Do **not** restart Blender blockout unless the user asks to re-export assets.

- Blender prompts and rules: [`../blender/md/`](../blender/md/)
- Source file (tracked): `blender/stairCelestial.blend`
- Exported GLBs: `public/models/`
- Stray root `.blend` files and `.cursor/` logs are gitignored

## Human onboarding

See root [`README.md`](../README.md) for install and run commands.
