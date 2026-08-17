"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";
import { createExternalLinkPointerHandlers } from "@/lib/externalLinkPointerHandlers";
import {
  setInteractiveHoverScale,
  setPointerCursor,
} from "@/lib/interactiveHoverZoom";
import type { Project } from "@/lib/projects";

/** Door frame center from project_door_portal.glb bounds; behind frame on −Z. */
export const PORTAL_LOCAL_POSITION: [number, number, number] = [0, 0, -0.16];

type DoorPortalContentProps = {
  project: Project;
  visible: boolean;
  onNavigate: () => void;
};

/** Invisible pick target over the portal (door hit box is disabled while open). */
const PORTAL_HIT_SIZE: [number, number, number] = [1.05, 1.0, 0.22];
const PORTAL_HIT_POSITION: [number, number, number] = [0, 0, 0.42];

/** Record player is tilted — use a taller, deeper pick volume in front of the frame. */
const RECORD_PLAYER_HIT_SIZE: [number, number, number] = [1.2, 1.2, 0.38];
const RECORD_PLAYER_HIT_POSITION: [number, number, number] = [0, 0.06, 0.48];

function getPortalHitBox(projectId: string): {
  size: [number, number, number];
  position: [number, number, number];
} {
  if (projectId === "music") {
    return { size: RECORD_PLAYER_HIT_SIZE, position: RECORD_PLAYER_HIT_POSITION };
  }
  return { size: PORTAL_HIT_SIZE, position: PORTAL_HIT_POSITION };
}

const CYAN = "#7dd3fc";
const CYAN_DIM = "#38bdf8";
const GRAPHITE = "#1a2332";
const GRAPHITE_LIGHT = "#334155";

function noRaycast() {
  return null;
}

/** Pitch portal content toward the viewer (+Z through the door) for a clearer top-down read. */
const RECORD_PLAYER_VIEW_TILT_X = -0.4;

function RecordPlayerPortal({ active }: { active: boolean }) {
  const platterRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!active || !platterRef.current) return;
    platterRef.current.rotation.y += delta * 0.9;
  });

  return (
    <group
      position={[0, 0.1, 0]}
      scale={0.88}
      rotation={[RECORD_PLAYER_VIEW_TILT_X, 0, 0]}
    >
      {/* Cabinet base */}
      <mesh position={[0, -0.28, 0]}>
        <boxGeometry args={[0.88, 0.14, 0.62]} />
        <meshStandardMaterial color="#1c1917" roughness={0.75} metalness={0.15} />
      </mesh>
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[0.82, 0.06, 0.56]} />
        <meshStandardMaterial color="#292524" roughness={0.55} metalness={0.2} />
      </mesh>

      {/* Platter assembly — cylinder faces camera (+Z) */}
      <group ref={platterRef} position={[0.02, -0.1, 0.02]}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.035, 48]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.4}
            roughness={0.4}
            emissive="#0c4a6e"
            emissiveIntensity={0.2}
          />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.01, 32]} />
          <meshStandardMaterial color={GRAPHITE_LIGHT} metalness={0.25} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.022, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.01, 8, 48]} />
          <meshStandardMaterial color="#64748b" metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.024, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.14, 0.008, 8, 40]} />
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* Tonearm pivot + arm */}
      <mesh position={[-0.34, -0.08, 0.08]}>
        <cylinderGeometry args={[0.04, 0.04, 0.05, 16]} />
        <meshStandardMaterial color="#57534e" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[-0.22, -0.02, 0.12]} rotation={[0, 0.55, -0.35]}>
        <boxGeometry args={[0.36, 0.025, 0.025]} />
        <meshStandardMaterial color="#78716c" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.06, 0.02, 0.18]} rotation={[0, 0.55, -0.35]}>
        <boxGeometry args={[0.12, 0.04, 0.04]} />
        <meshStandardMaterial color="#44403c" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Knob + dust cover hint */}
      <mesh position={[0.34, -0.14, 0.18]}>
        <cylinderGeometry args={[0.05, 0.05, 0.03, 20]} />
        <meshStandardMaterial
          color="#334155"
          emissive={CYAN_DIM}
          emissiveIntensity={0.15}
          metalness={0.35}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.08, -0.04]} rotation={[0.22, 0, 0]}>
        <boxGeometry args={[0.78, 0.01, 0.5]} />
        <meshStandardMaterial
          color="#0f172a"
          transparent
          opacity={0.35}
          metalness={0.8}
          roughness={0.1}
        />
      </mesh>

      <pointLight position={[0, 0.2, 0.35]} intensity={0.55} color={CYAN} distance={2.2} />
    </group>
  );
}

const JAZZ_GOLD = "#f5b942";
const JAZZ_COPPER = "#b85c2e";
const JAZZ_PLUM = "#6d2848";

function JazzNote({
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[-0.035, -0.13, 0]} rotation={[0, 0, -0.25]}>
        <sphereGeometry args={[0.075, 16, 12]} />
        <meshStandardMaterial
          color={JAZZ_GOLD}
          emissive={JAZZ_COPPER}
          emissiveIntensity={0.5}
          metalness={0.72}
          roughness={0.24}
        />
      </mesh>
      <mesh position={[0.025, 0.05, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.34, 10]} />
        <meshStandardMaterial color={JAZZ_GOLD} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.09, 0.2, 0]} rotation={[0, 0, -0.28]}>
        <boxGeometry args={[0.15, 0.025, 0.025]} />
        <meshStandardMaterial color={JAZZ_GOLD} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function JazzTreePortal({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const notesRef = useRef<THREE.Group>(null);
  const trunkGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.16, -0.42, 0),
      new THREE.Vector3(-0.05, -0.24, 0.02),
      new THREE.Vector3(0.02, -0.02, 0),
      new THREE.Vector3(-0.06, 0.22, -0.02),
      new THREE.Vector3(0.08, 0.42, 0),
    ]);
    return new THREE.TubeGeometry(curve, 28, 0.045, 10, false);
  }, []);

  useFrame((state) => {
    if (!active || !groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = Math.sin(t * 0.55) * 0.1;
    groupRef.current.rotation.z = Math.sin(t * 0.75) * 0.025;
    if (notesRef.current) {
      notesRef.current.position.y = Math.sin(t * 1.4) * 0.025;
      notesRef.current.children.forEach((note, i) => {
        note.rotation.z = Math.sin(t * 1.6 + i * 1.3) * 0.12;
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.01, 0]} scale={0.9}>
      {/* A brass trunk curves like the body of a saxophone. */}
      <mesh geometry={trunkGeometry}>
        <meshStandardMaterial
          color={JAZZ_GOLD}
          emissive={JAZZ_COPPER}
          emissiveIntensity={0.28}
          metalness={0.78}
          roughness={0.22}
        />
      </mesh>

      {/* Sax bell / tree roots. */}
      <mesh position={[-0.17, -0.44, 0.02]} rotation={[0, 0, -0.38]}>
        <coneGeometry args={[0.13, 0.2, 24, 1, true]} />
        <meshStandardMaterial
          color={JAZZ_GOLD}
          emissive={JAZZ_COPPER}
          emissiveIntensity={0.22}
          metalness={0.82}
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Branches become the staff that holds the notes. */}
      {[
        { p: [-0.18, 0.18, 0] as [number, number, number], r: -0.78, l: 0.38 },
        { p: [0.18, 0.24, 0] as [number, number, number], r: 0.72, l: 0.42 },
        { p: [-0.12, 0.37, 0] as [number, number, number], r: -0.58, l: 0.3 },
      ].map((branch, i) => (
        <mesh key={i} position={branch.p} rotation={[0, 0, branch.r]}>
          <cylinderGeometry args={[0.018, 0.032, branch.l, 10]} />
          <meshStandardMaterial color={JAZZ_COPPER} metalness={0.65} roughness={0.32} />
        </mesh>
      ))}

      <group ref={notesRef}>
        <JazzNote position={[-0.34, 0.31, 0.03]} rotation={[0, -0.18, -0.15]} scale={0.9} />
        <JazzNote position={[0.33, 0.39, 0.01]} rotation={[0, 0.2, 0.08]} scale={1.05} />
        <JazzNote position={[-0.2, 0.52, -0.02]} rotation={[0, -0.1, -0.08]} scale={0.72} />
      </group>

      {/* Piano keys ground the sculpture in a tiny stage. */}
      <group position={[0.08, -0.48, 0.02]} rotation={[-0.08, 0, 0]}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[(i - 3) * 0.09, 0, 0]}>
            <boxGeometry args={[0.078, 0.055, 0.26]} />
            <meshStandardMaterial
              color={i % 3 === 1 ? JAZZ_PLUM : "#f4ead5"}
              emissive={i % 3 === 1 ? JAZZ_PLUM : "#5b3a22"}
              emissiveIntensity={0.12}
              metalness={0.15}
              roughness={0.5}
            />
          </mesh>
        ))}
      </group>

      <pointLight position={[0, 0.22, 0.35]} intensity={1.15} color="#ffb347" distance={2.6} />
    </group>
  );
}

const NETWORK_NODES: [number, number, number][] = [
  [0, 0, 0],
  [-0.3, -0.12, 0.05],
  [0.32, -0.1, -0.04],
  [-0.14, -0.28, 0.02],
  [0.12, 0.28, -0.03],
  [0.36, 0.14, 0.06],
  [-0.34, 0.14, -0.05],
];

const NETWORK_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 6],
  [1, 3],
  [2, 5],
  [3, 6],
  [4, 5],
  [1, 6],
  [2, 4],
];

function NetworkPortal({ active }: { active: boolean }) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const linePositions = useMemo(() => {
    const positions: number[] = [];
    for (const [a, b] of NETWORK_EDGES) {
      const from = NETWORK_NODES[a];
      const to = NETWORK_NODES[b];
      positions.push(...from, ...to);
    }
    return new Float32Array(positions);
  }, []);

  useFrame((state) => {
    if (!active || !linesRef.current) return;
    const mat = linesRef.current.material as THREE.LineBasicMaterial;
    mat.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 1.8) * 0.15;
  });

  return (
    <group scale={0.82}>
      <lineSegments ref={linesRef} raycast={noRaycast}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={CYAN} transparent opacity={0.65} />
      </lineSegments>
      {NETWORK_NODES.map((pos, i) => (
        <mesh key={i} position={pos} scale={i === 0 ? 0.09 : 0.055}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial
            color={i === 0 ? "#f0f9ff" : GRAPHITE_LIGHT}
            emissive={CYAN}
            emissiveIntensity={i === 0 ? 0.85 : 0.45}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function MapPortal() {
  const mapTexture = useMemo(() => createStylizedMapTexture(), []);
  const borderGeometry = useMemo(() => {
    const w = 1.05;
    const h = 0.78;
    const hw = w / 2;
    const hh = h / 2;
    const points = [
      new THREE.Vector3(-hw, -hh, 0),
      new THREE.Vector3(hw, -hh, 0),
      new THREE.Vector3(hw, hh, 0),
      new THREE.Vector3(-hw, hh, 0),
      new THREE.Vector3(-hw, -hh, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <group scale={0.8}>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[1.05, 0.78]} />
        <meshStandardMaterial
          map={mapTexture}
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[1.08, 0.82, 0.04]} />
        <meshStandardMaterial color={GRAPHITE} roughness={0.7} metalness={0.2} />
      </mesh>
      <lineLoop
        geometry={borderGeometry}
        position={[0, 0, 0.03]}
        raycast={noRaycast}
      >
        <lineBasicMaterial color={CYAN} transparent opacity={0.45} />
      </lineLoop>
    </group>
  );
}

function PortalByProject({
  projectId,
  active,
}: {
  projectId: string;
  active: boolean;
}) {
  switch (projectId) {
    case "music":
      return <RecordPlayerPortal active={active} />;
    case "jazztree":
      return <JazzTreePortal active={active} />;
    case "guanchang":
      return <MapPortal />;
    case "columbia-network":
      return <NetworkPortal active={active} />;
    default:
      return null;
  }
}

export function DoorPortalContent({
  project,
  visible,
  onNavigate,
}: DoorPortalContentProps) {
  const portalVisualRef = useRef<THREE.Group>(null);
  const hoverTweenRef = useRef<gsap.core.Tween | null>(null);
  const { size: hitSize, position: hitPosition } = getPortalHitBox(project.id);

  const linkPointerHandlers = useMemo(
    () => createExternalLinkPointerHandlers(onNavigate),
    [onNavigate],
  );

  const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setPointerCursor(true);
    setInteractiveHoverScale(portalVisualRef.current, true, hoverTweenRef);
  }, []);

  const handlePointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setPointerCursor(false);
    setInteractiveHoverScale(portalVisualRef.current, false, hoverTweenRef);
  }, []);

  if (!visible) return null;

  const portalPointerHandlers = {
    ...linkPointerHandlers,
    onPointerOver: handlePointerOver,
    onPointerOut: handlePointerOut,
  };

  return (
    <group position={PORTAL_LOCAL_POSITION}>
      <group ref={portalVisualRef} raycast={noRaycast}>
        <PortalByProject projectId={project.id} active={visible} />
      </group>
      <mesh position={hitPosition} {...portalPointerHandlers}>
        <boxGeometry args={hitSize} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function createStylizedMapTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = "#0c1929";
  ctx.fillRect(0, 0, size, size);

  const regions: { fill: string; path: () => void }[] = [
    {
      fill: "#1e3a5f",
      path: () => {
        ctx.beginPath();
        ctx.ellipse(72, 95, 38, 52, -0.2, 0, Math.PI * 2);
        ctx.fill();
      },
    },
    {
      fill: "#2563eb",
      path: () => {
        ctx.beginPath();
        ctx.ellipse(175, 88, 42, 38, 0.15, 0, Math.PI * 2);
        ctx.fill();
      },
    },
    {
      fill: "#0e7490",
      path: () => {
        ctx.beginPath();
        ctx.ellipse(128, 165, 55, 28, 0, 0, Math.PI * 2);
        ctx.fill();
      },
    },
    {
      fill: "#164e63",
      path: () => {
        ctx.beginPath();
        ctx.ellipse(48, 175, 22, 18, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(205, 168, 26, 20, -0.3, 0, Math.PI * 2);
        ctx.fill();
      },
    },
  ];

  for (const region of regions) {
    ctx.fillStyle = region.fill;
    region.path();
  }

  ctx.strokeStyle = "rgba(125, 211, 252, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, size - 16, size - 16);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
