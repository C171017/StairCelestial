import * as THREE from "three";
import type { DoorAperture } from "./doorAperture";
import type { DoorSupport } from "./doorSupport";

/** Nine points inside the actual opening, including concave/narrow waists. */
export function doorPresentationSamples(support: DoorSupport, aperture: DoorAperture) {
  const samples: THREE.Vector3[] = [];
  const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), support.yaw);
  for (const row of [0.18, 0.5, 0.82]) {
    const y = THREE.MathUtils.lerp(aperture.bounds.min.y, aperture.bounds.max.y, row);
    const crossings = aperture.segments.filter(({ a, b }) => (a.y > y) !== (b.y > y))
      .map(({ a, b }) => a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y)).sort((a, b) => a - b);
    let left = aperture.center.x, right = aperture.center.x, closest = Infinity;
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const distance = Math.abs((crossings[i] + crossings[i + 1]) / 2 - aperture.center.x);
      if (distance < closest) { closest = distance; left = crossings[i]; right = crossings[i + 1]; }
    }
    for (const column of [0.18, 0.5, 0.82]) samples.push(
      new THREE.Vector3(THREE.MathUtils.lerp(left, right, column), y, 0)
        .multiplyScalar(support.scale).applyQuaternion(rotation).add(support.position),
    );
  }
  return samples;
}

/** Reused ray resources; callers sample a bounded set on a staggered cadence. */
export function createPortalOcclusionProbe() {
  const ray = new THREE.Raycaster();
  const direction = new THREE.Vector3();
  const hits: THREE.Intersection[] = [];
  return (obstacle: THREE.Object3D, camera: THREE.Vector3, samples: THREE.Vector3[]) => {
    let clear = 0;
    for (const point of samples) {
      direction.subVectors(point, camera);
      ray.near = 0.03;
      ray.far = Math.max(0, direction.length() - 0.035);
      ray.set(camera, direction.normalize());
      hits.length = 0;
      ray.intersectObject(obstacle, true, hits);
      if (!hits.length) clear++;
    }
    return samples.length ? clear / samples.length : 1;
  };
}

/** Compact views favor complete floating silhouettes over a denser portal
 * field; a ribbon crossing a full sample row hides that occurrence. */
export function portalOcclusionVisibility(clearFraction: number, compact = false) {
  return compact
    // Discrete samples must not leave a solid porcelain frame permanently
    // dithered. GlassDoor supplies the temporal fade between these targets.
    ? (clearFraction >= 8 / 9 ? 1 : 0)
    : THREE.MathUtils.smoothstep(clearFraction, 0.45, 0.8);
}

/** Fade before an opening becomes only a cropped sliver at a vertical edge. */
export function portalViewportVisibility(samples: THREE.Vector3[], localToClip: THREE.Matrix4) {
  const projected = new THREE.Vector3();
  let bottom = Infinity, top = -Infinity, inDepth = false;
  for (const point of samples) {
    projected.copy(point).applyMatrix4(localToClip);
    bottom = Math.min(bottom, projected.y); top = Math.max(top, projected.y);
    if (projected.z > -1 && projected.z < 1) inDepth = true;
  }
  if (!inDepth || !samples.length) return 0;
  const center = (bottom + top) / 2;
  const coverage = Math.max(0, Math.min(top, 1) - Math.max(bottom, -1)) / Math.max(top - bottom, 0.001);
  return (1 - THREE.MathUtils.smoothstep(Math.abs(center), 0.79, 1.08))
    * THREE.MathUtils.smoothstep(coverage, 0.25, 0.8);
}
