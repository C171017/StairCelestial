import * as THREE from "three";
import { RIBBON_PHASE, RIBBON_PITCH, ribbonPoint } from "./ribbonGeometry";
import type { doorPlacement } from "./doorPlacement";

export type DoorBase = { minX: number; maxX: number; bottom: number };
export type DoorSupport = {
  position: THREE.Vector3;
  scale: number;
  yaw: number;
  turn: number;
  base: DoorBase;
  perimeter: THREE.Vector2[];
};

/** Use the lower ceramic contour, not the much wider upper lobes. */
export function getDoorBase(scene: THREE.Object3D): DoorBase {
  scene.updateWorldMatrix(true, true);
  const inverse = scene.matrixWorld.clone().invert();
  const points: THREE.Vector3[] = [];
  scene.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || !mesh.name.startsWith("Fixed_GlassFrame")) return;
    const matrix = inverse.clone().multiply(mesh.matrixWorld);
    const positions = mesh.geometry.getAttribute("position");
    for (let i = 0; i < positions.count; i++) points.push(new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(matrix));
  });
  if (!points.length) throw new Error("Door model has no ceramic base");
  const bottom = Math.min(...points.map(point => point.y));
  const bounds = new THREE.Box3().setFromPoints(points.filter(point => point.y <= bottom + 0.2));
  return { minX: bounds.min.x - 0.07, maxX: bounds.max.x + 0.07, bottom };
}

const HALF_DEPTH = 0.17;
const EDGE_CLEARANCE = 0.12;

function basePerimeter(base: DoorBase) {
  const points: THREE.Vector2[] = [];
  const rounding = 0.075;
  for (let corner = 0; corner < 4; corner++) {
    const x = corner === 0 || corner === 3 ? base.maxX - rounding : base.minX + rounding;
    const z = corner < 2 ? HALF_DEPTH - rounding : -HALF_DEPTH + rounding;
    for (let i = 0; i <= 4; i++) {
      const angle = corner * Math.PI / 2 + i * Math.PI / 8;
      points.push(new THREE.Vector2(x + Math.cos(angle) * rounding, z + Math.sin(angle) * rounding));
    }
  }
  return points;
}

/** Height on this helix turn, including the ribbon's flat upper surface. */
export function ribbonSurfaceHeight(x: number, z: number, turn: number) {
  const angle = turn * Math.PI * 2 + RIBBON_PHASE;
  const delta = Math.atan2(Math.sin(Math.atan2(z, x) - angle), Math.cos(Math.atan2(z, x) - angle));
  return (turn + delta / (Math.PI * 2)) * RIBBON_PITCH - 2.5 + 0.105;
}

export function doorBaseWorldPoint(support: DoorSupport, point: THREE.Vector2) {
  const c = Math.cos(support.yaw), s = Math.sin(support.yaw);
  return new THREE.Vector3(
    support.position.x + (c * point.x + s * point.y) * support.scale,
    0,
    support.position.z + (-s * point.x + c * point.y) * support.scale,
  );
}

/** Keep the base footprint inside the ribbon, preserving stable seeded variation. */
export function fitDoorSupport(placement: ReturnType<typeof doorPlacement>, base: DoorBase, radius: number, width: number, compact: boolean): DoorSupport {
  const angle = placement.turn * Math.PI * 2 + RIBBON_PHASE;
  // Across the slope, with a little variation and either finished face forward.
  const jitter = Math.sin(placement.yaw) * 0.065;
  const yaw = -angle + jitter + (placement.yaw < 0 ? Math.PI : 0);
  const projectedWidth = (base.maxX - base.minX) * Math.cos(jitter) + HALF_DEPTH * 2 * Math.abs(Math.sin(jitter));
  const scale = Math.min(placement.scale * (compact ? 0.78 : 1), (width - EDGE_CLEARANCE * 2 - 0.06) / projectedWidth);
  const support: DoorSupport = { position: new THREE.Vector3(), scale, yaw, turn: placement.turn, base, perimeter: basePerimeter(base) };
  const inner = radius - width / 2 + EDGE_CLEARANCE;
  const outer = radius + width / 2 - EDGE_CLEARANCE;
  let minRadius = inner, maxRadius = outer;
  // Keep a conservative clearance around the lower frame footprint.
  for (const x of [base.minX - 0.015, base.maxX + 0.015]) {
    for (const z of [-HALF_DEPTH - 0.015, HALF_DEPTH + 0.015]) {
      const point = doorBaseWorldPoint(support, new THREE.Vector2(x, z));
      const radial = point.x * Math.cos(angle) + point.z * Math.sin(angle);
      const tangent = -point.x * Math.sin(angle) + point.z * Math.cos(angle);
      minRadius = Math.max(minRadius, Math.sqrt(Math.max(0, inner * inner - tangent * tangent)) - radial);
      maxRadius = Math.min(maxRadius, Math.sqrt(outer * outer - tangent * tangent) - radial);
    }
  }
  const centerRadius = THREE.MathUtils.clamp(radius + placement.lateral * width, minRadius, maxRadius);
  ribbonPoint(placement.turn, centerRadius, support.position);
  const baseCenter = doorBaseWorldPoint(support, new THREE.Vector2((base.minX + base.maxX) / 2, 0));
  // Seat the frame directly on the ribbon now that there is no raised sill.
  support.position.y = ribbonSurfaceHeight(baseCenter.x, baseCenter.z, placement.turn) - base.bottom * scale;
  return support;
}
