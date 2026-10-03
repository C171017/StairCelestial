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
  // Stencil apertures are rendering controls, not visible surfaces. Moving
  // them to the transparent pass would draw them after the clipped models.
  if (!material.colorWrite) return;
  const opacity = state.localOpacity * state.introOpacity;
  // Keep solid shells in the opaque pass throughout a fade. Alpha hashing
  // removes coverage instead of exposing the hidden gold/back faces through
  // an alpha-blended shell, then abruptly restoring depth at opacity === 1.
  const solid = !state.transparent && state.depthWrite;
  if (solid && !material.alphaHash) {
    material.alphaHash = true;
    material.needsUpdate = true;
  }
  const transparent = state.transparent || (!solid && opacity < 1);
  if (material.transparent !== transparent) {
    material.transparent = transparent;
    material.needsUpdate = true;
  }
  material.opacity = opacity;
  // Hashed fragments that disappear are discarded before writing depth.
  material.depthWrite = state.depthWrite && (solid || opacity >= 1);
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
