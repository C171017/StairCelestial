import { projects } from "./projects";

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

// LinkedIn remains explicitly unconfigured until the owner supplies their URL.
export const socialDestinations = {
  github: null as string | null,
  linkedin: null as string | null,
};
