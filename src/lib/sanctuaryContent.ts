import { projects } from "./projects";
import type { DoorStudy } from "./doorStudies";

export const sanctuaryProjects = projects.map((project, index) => ({
  ...project,
  number: String(index + 1).padStart(2, "0"),
  category: ["SOUND & EXPERIMENT", "MUSIC & DISCOVERY", "MAPS & PERSPECTIVE", "PEOPLE & CONNECTION"][index],
  summary: [
    "A space for music, listening, and exploration.",
    "Follow the branches. Discover a world of jazz.",
    "A different perspective on the places around us.",
    "Discover the connections that bring a community together.",
  ][index],
  model: ["music", "jazz", "atlas", "network"][index],
}));

export type SanctuaryProject = (typeof sanctuaryProjects)[number];

/** Shape identity owns the destination and its model, independent of placement. */
export const doorProjectIds = {
  melt: "music",
  seed: "jazztree",
  fault: "guanchang",
  hourglass: "columbia-network",
  cloud: "music",
  orbit: "jazztree",
} as const satisfies Record<DoorStudy["id"], string>;

export function projectIndexForDoor(shape: DoorStudy["id"]) {
  const index = sanctuaryProjects.findIndex(project => project.id === doorProjectIds[shape]);
  if (index < 0) throw new Error(`Missing project for door shape ${shape}`);
  return index;
}

export const socialDestinations = {
  github: "https://github.com/C171017",
  linkedin: "https://www.linkedin.com/in/howie-h-a6b065408",
};
