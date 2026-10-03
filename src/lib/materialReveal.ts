import type { Material } from "three";

type RevealState = {
  localOpacity: number;
  introOpacity: number;
  transparent: boolean;
  depthWrite: boolean;
};

const states = new WeakMap<Material, RevealState>();

function stateFor(material: Material) {
  let state = states.get(material);
  if (!state) {
    state = {
      localOpacity: material.opacity,
      introOpacity: 1,
      transparent: material.transparent,
      depthWrite: material.depthWrite,
    };
    states.set(material, state);
  }
  return state;
}

function apply(material: Material, state: RevealState) {
  const opacity = state.localOpacity * state.introOpacity;
  const transparent = state.transparent || opacity < 1;
  if (material.transparent !== transparent) {
    material.transparent = transparent;
    material.needsUpdate = true;
  }
  material.opacity = opacity;
  // A nearly invisible surface must not occlude the objects behind it.
  material.depthWrite = state.depthWrite && opacity >= 1;
}

/** Scene and object animation own separate factors, regardless of frame order. */
export function setIntroMaterialOpacity(material: Material, opacity: number) {
  const state = stateFor(material);
  state.introOpacity = Math.max(0, Math.min(1, opacity));
  apply(material, state);
}

export function setLocalMaterialOpacity(material: Material, opacity: number) {
  const state = stateFor(material);
  state.localOpacity = Math.max(0, Math.min(1, opacity));
  apply(material, state);
}
