import palette from "./doorPalette.json";

/** Shape definitions; permanent project identities are mapped in sanctuaryContent. */
export const doorStudies = [
  { id: "melt", number: "01", name: "Melt", note: "An arch softened by an impossible tide.", tint: palette.doors.melt.color, angle: -0.16 },
  { id: "seed", number: "02", name: "Seed", note: "A tilted seed, holding color within its husk.", tint: palette.doors.seed.color, angle: 0.13 },
  { id: "fault", number: "03", name: "Fault", note: "A shard of architecture, gently displaced.", tint: palette.doors.fault.color, angle: -0.13 },
  { id: "hourglass", number: "04", name: "Hourglass", note: "A passage drawn inward at its waist.", tint: palette.doors.hourglass.color, angle: 0.16 },
  { id: "cloud", number: "05", name: "Cloud", note: "A soft, wandering edge holding a little sky.", tint: palette.doors.cloud.color, angle: -0.12 },
  { id: "orbit", number: "06", name: "Orbit", note: "A continuous oval surrounding a suspended colored slab.", tint: palette.doors.orbit.color, angle: 0.15 },
] as const;

export type DoorStudy = (typeof doorStudies)[number];

// Bump when replacing the exported models so existing previews shed cached GLBs.
export const doorModelUrl = (study: DoorStudy) => `/models/doors/${study.id}.glb?v=7`;
