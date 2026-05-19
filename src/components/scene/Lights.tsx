"use client";

export function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[12, 24, 10]}
        intensity={1.1}
        color="#dfe8ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-16, 10, -8]} intensity={0.35} color="#6ec8ff" />
      <pointLight position={[0, 8, 14]} intensity={0.45} color="#88e8ff" distance={40} />
    </>
  );
}
