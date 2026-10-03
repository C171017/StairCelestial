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

/** Local bounds let glass sort by the visible arc instead of the whole helix. */
export function createRibbonSections(radius: number, width: number) {
  const source = createRibbonGeometry(radius, width);
  const ringsPerSection = 16;
  const verticesPerRing = 20;
  const indicesPerSection = ringsPerSection * verticesPerRing * 6;
  const sections = Array.from({ length: 72 }, (_, index) => {
    const geometry = new THREE.BufferGeometry();
    const firstVertex = index * ringsPerSection * verticesPerRing;
    const endVertex = firstVertex + (ringsPerSection + 1) * verticesPerRing;
    // Slice the completed mesh so shared boundaries retain identical normals.
    for (const name of ["position", "normal", "uv"]) {
      const attribute = source.getAttribute(name) as THREE.BufferAttribute;
      geometry.setAttribute(name, new THREE.BufferAttribute(
        attribute.array.slice(firstVertex * attribute.itemSize, endVertex * attribute.itemSize), attribute.itemSize));
    }
    const indices = source.getIndex()!.array.slice(index * indicesPerSection, (index + 1) * indicesPerSection);
    geometry.setIndex(new THREE.BufferAttribute(indices.map(vertex => vertex - firstVertex), 1));
    geometry.computeBoundingSphere();
    return geometry;
  });
  source.dispose();
  return sections;
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
