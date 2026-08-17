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
    id: "music",
    title: "Music",
    description: "music.c171017.com",
    previewImage: "/previews/project-alpha.svg",
    url: "https://music.c171017.com",
    doorIndex: 0,
  },
  {
    id: "jazztree",
    title: "JazzTree",
    description: "jazztree.c171017.com",
    previewImage: "/previews/project-beta.svg",
    url: "https://jazztree.c171017.com",
    doorIndex: 1,
  },
  {
    id: "guanchang",
    title: "Guanchang",
    description: "guanchang.me",
    previewImage: "/previews/project-gamma.svg",
    url: "https://guanchang.me",
    doorIndex: 2,
  },
  {
    id: "columbia-network",
    title: "Columbia-Barnard Network",
    description: "Six degrees social network visualization.",
    previewImage: "/previews/project-delta.svg",
    url: "https://c171017.github.io/Social-Network-Columbia-Barnard/",
    doorIndex: 3,
  },
];

export function getProjectByDoorIndex(doorIndex: number): Project | undefined {
  return projects.find((p) => p.doorIndex === doorIndex);
}
