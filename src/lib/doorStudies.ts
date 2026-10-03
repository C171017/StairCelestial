/** Shape definitions; permanent project identities are mapped in sanctuaryContent. */
export const doorStudies = [
  { id: "melt", number: "01", name: "Melt", note: "An arch softened by an impossible tide.", tint: "#b0d8d0", angle: -0.16 },
  { id: "seed", number: "02", name: "Seed", note: "A tilted seed, opening along its husk.", tint: "#c7d7aa", angle: 0.13 },
  { id: "fault", number: "03", name: "Fault", note: "A shard of architecture, gently displaced.", tint: "#b6cde8", angle: -0.13 },
  { id: "hourglass", number: "04", name: "Hourglass", note: "A passage drawn inward at its waist.", tint: "#d6bdd8", angle: 0.16 },
  { id: "cloud", number: "05", name: "Cloud", note: "A soft, wandering edge holding a little sky.", tint: "#ded0b1", angle: -0.12 },
  { id: "orbit", number: "06", name: "Orbit", note: "An unfinished loop with a floating central pivot.", tint: "#b7d5e5", angle: 0.15 },
] as const;

export type DoorStudy = (typeof doorStudies)[number];
export type DoorOpening = "hinge" | "dissolve";

// Bump when replacing the exported models so existing previews shed cached GLBs.
export const doorModelUrl = (study: DoorStudy) => `/models/doors/${study.id}.glb?v=${study.id === "orbit" ? 4 : 3}`;
