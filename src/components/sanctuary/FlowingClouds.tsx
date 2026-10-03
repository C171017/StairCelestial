"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, type RefObject } from "react";
import * as THREE from "three";
import { CLOUD_FIELD_SIZE, cloudHash, cloudPosition, cloudVisibility, cloudRenderOrder } from "@/lib/cloudMotion";
import { useCloudArtwork } from "@/hooks/useCloudArtwork";

const vertex = `
  varying vec2 cloudUv;
  void main() {
    cloudUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragment = `
  uniform sampler2D artwork;
  uniform vec2 atlasOffset;
  uniform float atlasScale;
  uniform float phase;
  uniform float opacity;
  uniform float haze;
  uniform float deformation;
  varying vec2 cloudUv;
  vec4 cloud(vec2 p) {
    vec2 edge = smoothstep(vec2(0.0),vec2(0.018),p) * (1.0-smoothstep(vec2(0.982),vec2(1.0),p));
    vec4 sampleColor = texture2D(artwork, atlasOffset + clamp(p,0.002,0.998)*atlasScale);
    // The artwork already contains linear-premultiplied RGB, encoded as sRGB.
    return sampleColor * edge.x * edge.y;
  }
  void main() {
    // Translation lives in world space; this bounded flow only softens edges.
    float angle = phase * 6.28318530718;
    vec2 flow = vec2(sin(cloudUv.y*13.0 + sin(cloudUv.x*9.0) + angle),cos(cloudUv.x*11.0-angle)) * deformation;
    vec4 c = cloud(cloudUv + flow);
    if(c.a*opacity<0.002)discard;
    #ifdef CLOUD_CORE
      if(c.a*opacity<0.995)discard;
    #else
      if(c.a*opacity>=0.995)discard;
    #endif
    vec3 color = c.rgb / max(c.a,0.0001);
    color = mix(color, vec3(0.69,0.76,0.82), haze);
    #ifdef CLOUD_CORE
      gl_FragColor = vec4(color,1.0);
    #else
      gl_FragColor = vec4(color,c.a*opacity);
    #endif
    #include <colorspace_fragment>
  }
`;

export function FlowingClouds({ time, deformation = true }: { time: RefObject<number>; deformation?: boolean }) {
  const sources = useCloudArtwork();
  const resources = useMemo(() => {
    const textures = (sources??[]).map(source => {
      const texture = source.clone();
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 1;
      texture.needsUpdate = true;
      return texture;
    });
    const geometry = new THREE.PlaneGeometry(1,1,12,4);
    const positions = geometry.attributes.position;
    for (let i=0;i<positions.count;i++) positions.setZ(i,0.1*(0.25-positions.getX(i)**2));
    geometry.computeVertexNormals();
    const clouds = Array.from({length:sources?80:0},(_,i)=>{
      const wisp = i>=64;
      const n = wisp ? i-64 : i;
      const grid = wisp ? 4 : 8;
      const spacing = CLOUD_FIELD_SIZE/grid;
      const x = (n%grid+0.5)*spacing-CLOUD_FIELD_SIZE/2 + (cloudHash(i+70)-0.5)*spacing*0.5;
      const z = (Math.floor(n/grid)+0.5)*spacing-CLOUD_FIELD_SIZE/2 + (cloudHash(i+140)-0.5)*spacing*0.5;
      const tile = Math.floor(cloudHash(i+99)*4);
      const material = new THREE.ShaderMaterial({
        vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,
        depthTest:true,toneMapped:false,side:THREE.DoubleSide,forceSinglePass:true,
        uniforms:{artwork:{value:textures[wisp?1:0]},atlasScale:{value:wisp?1:0.5},
          atlasOffset:{value:new THREE.Vector2(wisp?0:(tile%2)*0.5,wisp?0:Math.floor(tile/2)*0.5)},
          phase:{value:0},opacity:{value:0},haze:{value:0},deformation:{value:0}},
      });
      const mesh = new THREE.Mesh(geometry,material);
      mesh.frustumCulled=true;
      mesh.raycast = ()=>null;
      const coreMaterial=new THREE.ShaderMaterial({
        vertexShader:vertex,fragmentShader:fragment,defines:{CLOUD_CORE:1},
        uniforms:material.uniforms,transparent:false,depthWrite:true,depthTest:true,
        toneMapped:false,side:THREE.DoubleSide,
      });
      const core=new THREE.Mesh(geometry,coreMaterial);core.frustumCulled=true;core.raycast=()=>null;
      const scale = wisp ? 570+cloudHash(i)*180 : 300+cloudHash(i)*150;
      mesh.scale.set(scale,wisp?scale*0.42:scale*(0.5+cloudHash(i+123)*0.18),1);
      const y = wisp ? 125+cloudHash(i+17)*90 : -120-cloudHash(i+17)*55;
      return {mesh,material,core,coreMaterial,x,z,y,wisp,seed:cloudHash(i+500)};
    });
    return {textures,geometry,clouds};
  },[sources]);
  const target = useMemo(()=>new THREE.Vector3(),[]);
  const projected=useMemo(()=>new THREE.Vector3(),[]);
  useFrame(({camera,gl,size})=>{
    for(const [index,c]of resources.clouds.entries()){
      const p=cloudPosition(c.x,c.z,time.current,c.wisp?0.7:1);
      const distance=Math.hypot(p.x,p.z);
      c.mesh.position.set(p.x,c.y,p.z);
      // Faces the environment's center, not the scrolling camera.
      target.set(0,c.wisp?20:25,0);
      c.mesh.lookAt(target);
      c.mesh.renderOrder = cloudRenderOrder(c.mesh.position, camera.matrixWorldInverse.elements);
      c.material.uniforms.opacity.value=cloudVisibility(distance)*(c.wisp?0.38:1);
      c.mesh.visible=c.material.uniforms.opacity.value>0.001;
      c.core.visible=c.mesh.visible&&!c.wisp&&c.material.uniforms.opacity.value>=0.995;
      c.core.position.copy(c.mesh.position);c.core.quaternion.copy(c.mesh.quaternion);c.core.scale.copy(c.mesh.scale);
      c.core.renderOrder=-2000+distance;
      c.material.uniforms.haze.value=Math.min(0.42,Math.max(0,(distance-250)/1400));
      c.material.uniforms.phase.value=(time.current%18)/18+c.seed;
      c.material.uniforms.deformation.value=deformation?(c.wisp?0.005:0.0025):0;
      if(process.env.NODE_ENV==='development'&&index===19){
        projected.copy(c.mesh.position).project(camera);
        gl.domElement.dataset.cloudLandmarkX=((projected.x+1)*size.width/2).toFixed(2);
        gl.domElement.dataset.cloudLandmarkZ=c.mesh.position.z.toFixed(2);
        gl.domElement.dataset.cloudArtwork=String(resources.textures[0]?.image?.width??0);
      }
    }
  },-0.7);
  useEffect(()=>()=>{
    resources.geometry.dispose();resources.textures.forEach(t=>t.dispose());
    resources.clouds.forEach(c=>{c.material.dispose();c.coreMaterial.dispose();});
  },[resources]);
  return <group>{resources.clouds.map((c,i)=><group key={i}><primitive object={c.core} dispose={null}/><primitive object={c.mesh} dispose={null}/></group>)}</group>;
}
