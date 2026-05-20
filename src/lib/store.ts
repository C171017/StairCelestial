import { create } from "zustand";
import type { DoorFocusTarget } from "./doorCameraFocus";
import type { Project } from "./projects";

type PortfolioState = {
  activeDoorId: string | null;
  openedDoorId: string | null;
  currentProject: Project | null;
  scrollProgress: number;
  virtualStairIndex: number;
  /** Per pool slot: virtual stair index for door, or -1 if hidden */
  doorPoolVirtualIndices: number[];
  focusedDoorId: string | null;
  doorFocusTarget: DoorFocusTarget | null;
  /** Door stair index the camera zooms toward */
  focusVirtualIndex: number | null;
  /** Camera scroll index when focus started — scroll delta clears focus */
  focusScrollAnchor: number | null;
  setActiveDoor: (doorId: string | null) => void;
  setOpenedDoor: (doorId: string | null, project: Project | null) => void;
  setScrollProgress: (progress: number) => void;
  setVirtualStairIndex: (index: number) => void;
  setDoorPoolVirtualIndices: (indices: number[]) => void;
  setDoorFocus: (
    doorId: string,
    target: DoorFocusTarget,
    virtualIndex: number,
  ) => void;
  clearDoorFocus: () => void;
  resetDoors: () => void;
};

export const usePortfolioStore = create<PortfolioState>((set) => ({
  activeDoorId: null,
  openedDoorId: null,
  currentProject: null,
  scrollProgress: 0,
  virtualStairIndex: 0,
  doorPoolVirtualIndices: [-1, -1, -1, -1],
  focusedDoorId: null,
  doorFocusTarget: null,
  focusVirtualIndex: null,
  focusScrollAnchor: null,
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
  setDoorFocus: (doorId, doorFocusTarget, focusVirtualIndex) =>
    set((state) => ({
      focusedDoorId: doorId,
      doorFocusTarget,
      focusVirtualIndex,
      focusScrollAnchor: state.virtualStairIndex,
    })),
  clearDoorFocus: () =>
    set({
      focusedDoorId: null,
      doorFocusTarget: null,
      focusVirtualIndex: null,
      focusScrollAnchor: null,
    }),
  resetDoors: () =>
    set({
      activeDoorId: null,
      openedDoorId: null,
      currentProject: null,
      focusedDoorId: null,
      doorFocusTarget: null,
      focusVirtualIndex: null,
      focusScrollAnchor: null,
    }),
}));
