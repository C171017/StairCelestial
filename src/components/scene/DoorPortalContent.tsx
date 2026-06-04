"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Project } from "@/lib/projects";

/** Door frame center (matches invisible hit box at y=1.1); behind frame on −Z. */
export const PORTAL_LOCAL_POSITION: [number, number, number] = [0, 1.1, -0.16];

type DoorPortalContentProps = {
  project: Project;
  visible: boolean;
  onNavigate: () => void;
};

/** Invisible pick target over the portal (door hit box is disabled while open). */
const PORTAL_HIT_SIZE: [number, number, number] = [1.05, 1.0, 0.22];

const CYAN = "#7dd3fc";
const CYAN_DIM = "#38bdf8";
const GRAPHITE = "#1a2332";
const GRAPHITE_LIGHT = "#334155";

function noRaycast() {
  return null;
}

function RecordPlayerPortal({ active }: { active: boolean }) {
  const platterRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!active || !platterRef.current) return;
    platterRef.current.rotation.y += delta * 0.9;
  });

  return (
    <group position={[0, 0.1, 0]} scale={0.88}>
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

function StarsPortal({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const starPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const rand = seededRandom(42);
    for (let i = 0; i < 48; i++) {
      const r = 0.12 + rand() * 0.38;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      positions.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi) * 0.45,
      ]);
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (!active || !groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.12;
    groupRef.current.children.forEach((child, i) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mat = child.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.35 + Math.sin(t * 2.2 + i * 0.7) * 0.2;
    });
  });

  return (
    <group ref={groupRef} scale={0.82}>
      <mesh>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial
          color="#0c1929"
          emissive={CYAN_DIM}
          emissiveIntensity={0.5}
          metalness={0.1}
          roughness={0.85}
        />
      </mesh>
      {starPositions.map((pos, i) => (
        <mesh key={i} position={pos} scale={0.025 + (i % 5) * 0.006}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color="#f8fafc"
            emissive={CYAN}
            emissiveIntensity={0.55}
            toneMapped={false}
          />
        </mesh>
      ))}
      <pointLight position={[0, 0.15, 0.25]} intensity={0.85} color={CYAN} distance={2.5} />
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

  return (
    <group scale={0.8}>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[1.05, 0.78]} />
        <meshStandardMaterial
          map={mapTexture}
          emissive="#0ea5e9"
          emissiveIntensity={0.12}
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[1.08, 0.82, 0.04]} />
        <meshStandardMaterial color={GRAPHITE} roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[1.12, 0.86, 0.02]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive={CYAN_DIM}
          emissiveIntensity={0.08}
          wireframe
        />
      </mesh>
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
    case "stars":
      return <StarsPortal active={active} />;
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
  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      onNavigate();
    },
    [onNavigate],
  );

  const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = "pointer";
  }, []);

  const handlePointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = "";
  }, []);

  if (!visible) return null;

  const portalPointerHandlers = {
    onPointerDown: handlePointerDown,
    onPointerOver: handlePointerOver,
    onPointerOut: handlePointerOut,
  };

  return (
    <group position={PORTAL_LOCAL_POSITION}>
      <group raycast={noRaycast}>
        <PortalByProject projectId={project.id} active={visible} />
      </group>
      <mesh position={[0, 0, 0.06]} {...portalPointerHandlers}>
        <boxGeometry args={PORTAL_HIT_SIZE} />
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

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
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
