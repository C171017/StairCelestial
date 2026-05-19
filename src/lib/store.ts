import { create } from "zustand";
import type { Project } from "./projects";

type PortfolioState = {
  activeDoorId: string | null;
  openedDoorId: string | null;
  currentProject: Project | null;
  scrollProgress: number;
  setActiveDoor: (doorId: string | null) => void;
  setOpenedDoor: (doorId: string | null, project: Project | null) => void;
  setScrollProgress: (progress: number) => void;
  resetDoors: () => void;
};

export const usePortfolioStore = create<PortfolioState>((set) => ({
  activeDoorId: null,
  openedDoorId: null,
  currentProject: null,
  scrollProgress: 0,
  setActiveDoor: (doorId) => set({ activeDoorId: doorId }),
  setOpenedDoor: (doorId, project) =>
    set({
      openedDoorId: doorId,
      currentProject: project,
      activeDoorId: doorId,
    }),
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  resetDoors: () =>
    set({
      activeDoorId: null,
      openedDoorId: null,
      currentProject: null,
    }),
}));
