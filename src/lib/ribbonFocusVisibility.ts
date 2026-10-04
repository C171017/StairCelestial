import * as THREE from "three";
import { apertureContainsRectangle, type DoorAperture } from "./doorAperture";
import type { DoorSupport } from "./doorSupport";
import { advanceRibbonFocus, createRibbonFocus, type RibbonFocusOptions } from "./ribbonFocus";

/** Compare both finished faces using sightlines through the actual opening.
 * Work in unscrolled ribbon coordinates: scrolling and camera azimuth cancel
 * when the selected anchor is brought to the same focus destination.
 */
export function chooseRibbonFocusSide(
  ribbon: THREE.Object3D,
  support: DoorSupport,
  aperture: DoorAperture,
  options: RibbonFocusOptions & { cameraPosition: THREE.Vector3 },
) {
  const anchor = support.position.clone().add(new THREE.Vector3(0, 1.45 * support.scale, 0));
  const points: THREE.Vector3[] = [];
  for (let row = 0; row < 9; row++) {
    for (let column = 0; column < 7; column++) {
      const point = new THREE.Vector2(
        THREE.MathUtils.lerp(aperture.bounds.min.x, aperture.bounds.max.x, (column + 0.5) / 7),
        THREE.MathUtils.lerp(aperture.bounds.min.y, aperture.bounds.max.y, (row + 0.5) / 9),
      );
      if (!apertureContainsRectangle(aperture, point, 0, 0)) continue;
      points.push(new THREE.Vector3(point.x, point.y, 0)
        .multiplyScalar(support.scale).applyAxisAngle(new THREE.Vector3(0, 1, 0), support.yaw).add(support.position));
    }
  }
  ribbon.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const scores = ([1, -1] as const).map(side => {
    const state = createRibbonFocus();
    advanceRibbonFocus(state, anchor, 1 / 60, {
      ...options, viewYaw: 0, reducedMotion: true,
      doorYaw: support.yaw + (side === -1 ? Math.PI : 0),
    });
    const inverse = new THREE.Matrix4().compose(
      new THREE.Vector3(state.x, state.y, state.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(state.pitch, state.yaw, 0)),
      new THREE.Vector3().setScalar(state.scale),
    ).invert();
    const camera = options.cameraPosition.clone().applyMatrix4(inverse);
    let blocked = 0;
    for (const point of points) {
      const direction = point.clone().sub(camera);
      ray.far = direction.length() - 0.02;
      ray.set(camera, direction.normalize());
      if (ray.intersectObject(ribbon, true).length) blocked++;
    }
    return { side, blocked };
  });
  // Keep the original front when the views are equally clear; never oscillate.
  return scores[1].blocked < scores[0].blocked ? scores[1] : scores[0];
}
