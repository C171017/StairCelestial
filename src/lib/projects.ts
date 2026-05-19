export type Project = {
  id: string;
  title: string;
  description: string;
  previewImage: string;
  url: string;
  doorIndex: number;
};

export const projects: Project[] = [
  {
    id: "project-alpha",
    title: "Project Alpha",
    description: "A modern web experience with cinematic motion.",
    previewImage: "/previews/project-alpha.svg",
    url: "https://example.com/project-alpha",
    doorIndex: 0,
  },
  {
    id: "project-beta",
    title: "Project Beta",
    description: "Interactive product storytelling in the browser.",
    previewImage: "/previews/project-beta.svg",
    url: "https://example.com/project-beta",
    doorIndex: 1,
  },
  {
    id: "project-gamma",
    title: "Project Gamma",
    description: "Design systems and component libraries at scale.",
    previewImage: "/previews/project-gamma.svg",
    url: "https://example.com/project-gamma",
    doorIndex: 2,
  },
  {
    id: "project-delta",
    title: "Project Delta",
    description: "Experimental interfaces blending 2D and 3D.",
    previewImage: "/previews/project-delta.svg",
    url: "https://example.com/project-delta",
    doorIndex: 3,
  },
];

export function getProjectByDoorIndex(doorIndex: number): Project | undefined {
  return projects.find((p) => p.doorIndex === doorIndex);
}
