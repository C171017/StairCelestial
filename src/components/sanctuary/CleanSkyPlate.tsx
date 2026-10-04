"use client";
import { useEffect, useState } from "react";
import * as THREE from "three";

export function CleanSkyPlate({ onReady }: { onReady?: () => void } = {}){
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    let disposed = false;
    const image = new THREE.TextureLoader().load(
      "/textures/sanctuary/layers/sky-clean.webp",
      loaded => { if (!disposed) { setTexture(loaded); setSettled(true); } },
      undefined,
      () => {
        // The matching procedural color plate is also a complete final state.
        if (!disposed) setSettled(true);
      },
    );
    image.colorSpace = THREE.SRGBColorSpace;
    image.wrapS = THREE.RepeatWrapping;
    return () => { disposed = true; image.dispose(); };
  }, []);
  useEffect(() => {
    if (settled) onReady?.();
  }, [settled, onReady]);
  return <mesh renderOrder={-3000} raycast={()=>null}>
    <sphereGeometry args={[450,64,32]}/>
    {texture ? <meshBasicMaterial map={texture} side={THREE.BackSide} depthWrite={false} toneMapped={false}/> :
      <shaderMaterial side={THREE.BackSide} depthWrite={false} toneMapped={false}
        vertexShader={`varying vec3 direction;void main(){direction=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
        fragmentShader={`varying vec3 direction;
          void main(){
            vec3 d=normalize(direction);float elevation=d.y;
            vec3 color=mix(vec3(0.91,0.88,0.73),vec3(0.23,0.46,0.76),smoothstep(-0.10,0.28,elevation));
            color=mix(color,vec3(0.43,0.59,0.77),smoothstep(0.0,0.65,-elevation));
            float glow=pow(max(0.0,dot(d,normalize(vec3(-0.5,0.04,-0.8)))),10.0)*exp(-elevation*elevation*14.0);
            color+=vec3(0.10,0.065,0.012)*glow;gl_FragColor=vec4(color,1.0);
            #include <colorspace_fragment>
          }`}/>}
  </mesh>;
}
