"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { introMotionBlend } from "@/lib/introMotion";
import { usePortfolioStore } from "@/lib/store";
import { syncGroupToCamera } from "@/lib/viewportAnchor";

/** Fixed viewport shell — always centered on the camera, not world scroll Y. */
const STAR_COUNT = 700;
const STAR_RADIUS = 88;
const STAR_DEPTH = 42;
const STAR_MIN_PIXEL_SIZE = 0.6;
/** Slow dome yaw so the field reads as already in motion when faded in. */
const STAR_FIELD_YAW_SPEED = 0.052;
/** Start intro streaks partway through their cycle before opacity reveals. */
const INTRO_SHOOTING_STAR_PREWARM = 2.4;
const SHOOTING_STAR_COUNT = 4;
const SHOOTING_STAR_DISTANCE = 118;

type ShootingStarPath = {
  duration: number;
  from: [number, number];
  opacity: number;
  startOffset: number;
  to: [number, number];
};

const INTRO_SHOOTING_STARS: ShootingStarPath[] = [
  {
    startOffset: 0.12,
    duration: 0.7,
    from: [-0.82, 0.64],
    to: [-0.2, 0.32],
    opacity: 0.88,
  },
  {
    startOffset: 0.48,
    duration: 0.82,
    from: [0.58, 0.72],
    to: [-0.06, 0.42],
    opacity: 0.72,
  },
  {
    startOffset: 0.88,
    duration: 0.76,
    from: [0.24, -0.08],
    to: [0.84, -0.42],
    opacity: 0.66,
  },
];

const INTRO_SHOOTING_CYCLE = Math.max(
  ...INTRO_SHOOTING_STARS.map((path) => path.startOffset + path.duration),
);

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Stars and streaks share one camera-centered rig (infinite scroll safe). */
function CameraViewportAtmosphere({ children }: { children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    syncGroupToCamera(group, camera);
  });

  return <group ref={groupRef}>{children}</group>;
}

function BrowserSafeStars() {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          introOpacity: { value: 0 },
          pixelRatio: { value: 1 },
          time: { value: 0 },
        },
        vertexShader: `
          uniform float introOpacity;
          uniform float pixelRatio;
          uniform float time;
          attribute float brightness;
          attribute float size;
          attribute float twinkle;
          varying float vBrightness;
          varying float vTwinkle;

          void main() {
            vBrightness = brightness;
            vTwinkle = 0.88 + 0.12 * sin(time * 0.55 + twinkle);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float perspectiveSize = size * pixelRatio * (68.0 / -mvPosition.z);
            gl_PointSize = max(${STAR_MIN_PIXEL_SIZE.toFixed(2)}, perspectiveSize);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float introOpacity;
          varying float vBrightness;
          varying float vTwinkle;

          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            float reveal = introOpacity <= 0.0 ? 0.0 : mix(0.12, 1.0, introOpacity);
            float alpha = smoothstep(0.5, 0.12, d) * vBrightness * vTwinkle * reveal * 0.95;
            gl_FragColor = vec4(vec3(0.88, 0.93, 1.0), min(alpha, 1.0));

            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const { gl } = useThree();

  const geometry = useMemo(() => {
    const random = seededRandom(17017);
    const positions = new Float32Array(STAR_COUNT * 3);
    const brightnesses = new Float32Array(STAR_COUNT);
    const sizes = new Float32Array(STAR_COUNT);
    const twinkles = new Float32Array(STAR_COUNT);
    const spherical = new THREE.Spherical();
    const vector = new THREE.Vector3();

    for (let i = 0; i < STAR_COUNT; i += 1) {
      spherical.radius = STAR_RADIUS + random() * STAR_DEPTH;
      spherical.phi = Math.acos(1 - random() * 2);
      spherical.theta = random() * Math.PI * 2;
      vector.setFromSpherical(spherical);

      const positionIndex = i * 3;
      positions[positionIndex] = vector.x;
      positions[positionIndex + 1] = vector.y;
      positions[positionIndex + 2] = vector.z;

      const tier = random();
      if (tier < 0.72) {
        sizes[i] = 0.8 + random() * 0.8;
        brightnesses[i] = 0.32 + random() * 0.2;
      } else if (tier < 0.96) {
        sizes[i] = 1.4 + random() * 1.2;
        brightnesses[i] = 0.54 + random() * 0.22;
      } else {
        sizes[i] = 2.6 + random() * 1.8;
        brightnesses[i] = 0.82 + random() * 0.18;
      }
      twinkles[i] = random() * Math.PI * 2;
    }

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    bufferGeometry.setAttribute(
      "brightness",
      new THREE.BufferAttribute(brightnesses, 1),
    );
    bufferGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    bufferGeometry.setAttribute(
      "twinkle",
      new THREE.BufferAttribute(twinkles, 1),
    );
    return bufferGeometry;
  }, []);

  useFrame((state, delta) => {
    const motionBlend = introMotionBlend(
      usePortfolioStore.getState().introAtmosphereElapsed,
    );
    const group = groupRef.current;
    if (group) {
      group.rotation.y += delta * STAR_FIELD_YAW_SPEED * motionBlend;
    }

    materialRef.uniforms.time.value = state.clock.elapsedTime;
    materialRef.uniforms.pixelRatio.value = Math.min(gl.getPixelRatio(), 2);
    materialRef.uniforms.introOpacity.value =
      usePortfolioStore.getState().introStarsOpacity;
  });

  return (
    <group ref={groupRef}>
      <points
        geometry={geometry}
        material={materialRef}
        frustumCulled={false}
        renderOrder={-30}
      />
    </group>
  );
}

function setShootingStarGeometry(
  geometry: THREE.BufferGeometry,
  camera: THREE.Camera,
  path: ShootingStarPath,
  progress: number,
) {
  const tailProgress = Math.max(0, progress - 0.2);
  const headNdc = new THREE.Vector3(
    THREE.MathUtils.lerp(path.from[0], path.to[0], progress),
    THREE.MathUtils.lerp(path.from[1], path.to[1], progress),
    0.5,
  );
  const tailNdc = new THREE.Vector3(
    THREE.MathUtils.lerp(path.from[0], path.to[0], tailProgress),
    THREE.MathUtils.lerp(path.from[1], path.to[1], tailProgress),
    0.5,
  );

  headNdc.unproject(camera);
  tailNdc.unproject(camera);
  headNdc.sub(camera.position).normalize();
  tailNdc.sub(camera.position).normalize();

  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  position.setXYZ(
    0,
    tailNdc.x * SHOOTING_STAR_DISTANCE,
    tailNdc.y * SHOOTING_STAR_DISTANCE,
    tailNdc.z * SHOOTING_STAR_DISTANCE,
  );
  position.setXYZ(
    1,
    headNdc.x * SHOOTING_STAR_DISTANCE,
    headNdc.y * SHOOTING_STAR_DISTANCE,
    headNdc.z * SHOOTING_STAR_DISTANCE,
  );
  position.needsUpdate = true;
  geometry.computeBoundingSphere();
}

function makeAmbientShootingStar(random: () => number): ShootingStarPath {
  const fromLeft = random() > 0.5;
  const startY = 0.55 - random() * 0.95;
  const drift = 0.18 + random() * 0.32;

  return {
    startOffset: 0,
    duration: 0.82 + random() * 0.48,
    from: [fromLeft ? -0.92 : 0.92, startY],
    to: [fromLeft ? -0.16 + random() * 0.68 : 0.16 - random() * 0.68, startY - drift],
    opacity: 0.22 + random() * 0.2,
  };
}

function ShootingStars() {
  const ambientRandomRef = useRef(seededRandom(92017));
  const ambientPathRef = useRef<ShootingStarPath | null>(null);
  const ambientStartTimeRef = useRef(0);
  const nextAmbientTimeRef = useRef(12);
  const { camera } = useThree();

  const geometries = useMemo(
    () =>
      Array.from({ length: SHOOTING_STAR_COUNT }, () => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array(6), 3),
        );
        return geometry;
      }),
    [],
  );

  const shootingLines = useMemo(
    () =>
      geometries.map((geometry) => {
        const material = new THREE.LineBasicMaterial({
          blending: THREE.AdditiveBlending,
          color: "#edf6ff",
          depthTest: true,
          depthWrite: false,
          opacity: 0,
          transparent: true,
          toneMapped: false,
        });
        const line = new THREE.Line(geometry, material);
        line.frustumCulled = false;
        line.renderOrder = -20;
        line.visible = false;
        return line;
      }),
    [geometries],
  );

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;
    const store = usePortfolioStore.getState();
    const introIntensity = store.introShootingStarIntensity;

    const atmosphereElapsed =
      store.introAtmosphereElapsed + INTRO_SHOOTING_STAR_PREWARM;

    INTRO_SHOOTING_STARS.forEach((path, index) => {
      const line = shootingLines[index];

      const phase = atmosphereElapsed % INTRO_SHOOTING_CYCLE;
      const progress = (phase - path.startOffset) / path.duration;
      const opacity =
        introIntensity > 0.01 && progress > 0 && progress < 1
          ? Math.sin(progress * Math.PI) * path.opacity * introIntensity
          : 0;

      line.visible = opacity > 0.01;
      const material = line.material as THREE.LineBasicMaterial;
      material.opacity = opacity;

      if (line.visible) {
        setShootingStarGeometry(geometries[index], camera, path, progress);
      }
    });

    const ambientIndex = INTRO_SHOOTING_STARS.length;
    const ambientLine = shootingLines[ambientIndex];
    if (store.introMainOpacity < 0.98) {
      ambientLine.visible = false;
      return;
    }

    const random = ambientRandomRef.current;
    if (!ambientPathRef.current && elapsed >= nextAmbientTimeRef.current) {
      ambientPathRef.current = makeAmbientShootingStar(random);
      ambientStartTimeRef.current = elapsed;
    }

    const ambientPath = ambientPathRef.current;
    if (!ambientPath) return;

    const ambientProgress =
      (elapsed - ambientStartTimeRef.current) / ambientPath.duration;
    if (ambientProgress >= 1) {
      ambientPathRef.current = null;
      nextAmbientTimeRef.current = elapsed + 12 + random() * 14;
      ambientLine.visible = false;
      return;
    }

    const ambientOpacity =
      Math.sin(ambientProgress * Math.PI) * ambientPath.opacity;
    ambientLine.visible = ambientOpacity > 0.01;
    const ambientMaterial = ambientLine.material as THREE.LineBasicMaterial;
    ambientMaterial.opacity = ambientOpacity;
    setShootingStarGeometry(
      geometries[ambientIndex],
      camera,
      ambientPath,
      ambientProgress,
    );
  });

  return (
    <group renderOrder={-20}>
      {shootingLines.map((line, index) => (
        <primitive key={`shooting-star-${index}`} object={line} />
      ))}
    </group>
  );
}

function IntroAtmosphereClock() {
  useFrame(() => {
    const epochMs = usePortfolioStore.getState().introEpochMs;
    if (epochMs === null) return;
    usePortfolioStore
      .getState()
      .setIntroAtmosphereElapsed((performance.now() - epochMs) / 1000);
  });
  return null;
}

export function Atmosphere() {
  return (
    <>
      <color attach="background" args={["#030508"]} />
      <fog attach="fog" args={["#030508", 26, 78]} />
      <IntroAtmosphereClock />
      <CameraViewportAtmosphere>
        <BrowserSafeStars />
        <ShootingStars />
      </CameraViewportAtmosphere>
    </>
  );
}
