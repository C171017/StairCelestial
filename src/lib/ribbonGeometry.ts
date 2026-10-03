import * as THREE from "three";

export const RIBBON_PITCH = 10.6;
export const RIBBON_PHASE = Math.PI / 2;

export function ribbonPoint(turn: number, radius: number, target = new THREE.Vector3()) {
  const a = turn * Math.PI * 2 + RIBBON_PHASE;
  return target.set(Math.cos(a) * radius, turn * RIBBON_PITCH - 2.5, Math.sin(a) * radius);
}

/** A closed, rounded cross-section swept along a continuous helix. */
export function createRibbonGeometry(radius: number, width: number) {
  const segments = 1152;
  const cross: [number, number][] = [];
  const halfWidth = width / 2;
  const halfHeight = 0.105;
  const bevel = 0.085;
  for (let corner = 0; corner < 4; corner++) {
    const signX = corner === 0 || corner === 3 ? 1 : -1;
    const signY = corner < 2 ? 1 : -1;
    for (let j = 0; j <= 4; j++) {
      const a = corner * Math.PI / 2 + j * Math.PI / 8;
      cross.push([signX * (halfWidth - bevel) + Math.cos(a) * bevel,
        signY * (halfHeight - bevel) + Math.sin(a) * bevel]);
    }
  }
  const vertices: number[] = [];
  const indices: number[] = [];
  const uv: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const turn = -3 + (i / segments) * 6;
    const a = turn * Math.PI * 2 + RIBBON_PHASE;
    const center = ribbonPoint(turn, radius);
    for (const [x, y] of cross) {
      vertices.push(center.x + Math.cos(a) * x, center.y + y, center.z + Math.sin(a) * x);
      uv.push(i / segments, x / width + 0.5);
    }
  }
  const count = cross.length;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < count; j++) {
      const a = i * count + j;
      const b = i * count + (j + 1) % count;
      indices.push(a, b, a + count, b, b + count, a + count);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

class RibbonEdge extends THREE.Curve<THREE.Vector3> {
  constructor(private radius: number) { super(); }
  getPoint(t: number, target = new THREE.Vector3()) {
    return ribbonPoint(-3 + t * 6, this.radius, target).add(new THREE.Vector3(0, 0.082, 0));
  }
}

export function createRibbonEdge(radius: number) {
  return new THREE.TubeGeometry(new RibbonEdge(radius), 768, 0.018, 5, false);
}
