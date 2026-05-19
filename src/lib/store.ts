import { create } from "zustand";
import type { Project } from "./projects";

type PortfolioState = {
  activeDoorId: string | null;
  openedDoorId: string | null;
  currentProject: Project | null;
  scrollProgress: number;
  virtualStairIndex: number;
  /** Per pool slot: virtual stair index for door, or -1 if hidden */
  doorPoolVirtualIndices: number[];
  setActiveDoor: (doorId: string | null) => void;
  setOpenedDoor: (doorId: string | null, project: Project | null) => void;
  setScrollProgress: (progress: number) => void;
  setVirtualStairIndex: (index: number) => void;
  setDoorPoolVirtualIndices: (indices: number[]) => void;
  resetDoors: () => void;
};

export const usePortfolioStore = create<PortfolioState>((set) => ({
  activeDoorId: null,
  openedDoorId: null,
  currentProject: null,
  scrollProgress: 0,
  virtualStairIndex: 0,
  doorPoolVirtualIndices: [-1, -1, -1, -1],
  setActiveDoor: (doorId) => set({ activeDoorId: doorId }),
  setOpenedDoor: (doorId, project) =>
    set({
      openedDoorId: doorId,
      currentProject: project,
      activeDoorId: doorId,
    }),
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  setVirtualStairIndex: (virtualStairIndex) => set({ virtualStairIndex }),
  setDoorPoolVirtualIndices: (doorPoolVirtualIndices) =>
    set({ doorPoolVirtualIndices }),
  resetDoors: () =>
    set({
      activeDoorId: null,
      openedDoorId: null,
      currentProject: null,
    }),
}));
