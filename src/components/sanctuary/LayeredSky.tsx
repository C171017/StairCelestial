"use client";

import { useFBO } from "@react-three/drei";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CloudField } from "./CloudField";
import { SkyEffects } from "./SkyEffects";
import type { RefObject } from "react";
import { exportSkyMaster } from "./exportSky";
import { CleanSkyPlate } from "./CleanSkyPlate";
import { SkyStars } from "./SkyStars";
import { registerSkyReflectionSource } from "./skyReflectionSource";

export function LayeredSky({ paused=false, timeOverride=null, exporter, onReady }: { paused?:boolean;timeOverride?:number|null;exporter?:RefObject<((progress:(value:string)=>void)=>Promise<void>)|null>;onReady?:()=>void }) {
  const {gl,size,camera,scene:foregroundScene} = useThree();
  const [cloudsReady, setCloudsReady] = useState(false);
  const [plateReady, setPlateReady] = useState(false);
  const handleCloudsReady = useCallback(() => setCloudsReady(true), []);
  const handlePlateReady = useCallback(() => setPlateReady(true), []);
  useEffect(() => {
    const ready = cloudsReady && plateReady;
    if (process.env.NODE_ENV === "development") gl.domElement.dataset.skyReady = String(ready);
    if (ready) onReady?.();
  }, [cloudsReady, plateReady, gl, onReady]);
  // Keep the portal container stable through Fast Refresh and effect replay.
  const [skyScene] = useState(()=>new THREE.Scene());
  const [skyCamera] = useState(()=>new THREE.PerspectiveCamera());
  useEffect(() => registerSkyReflectionSource(foregroundScene, {
    scene: skyScene, ready: cloudsReady && plateReady,
  }), [foregroundScene, skyScene, cloudsReady, plateReady]);
  // Version C prioritizes the fine cloud edges and reflected sky detail on
  // desktop as well as mobile. Resource size remains bounded by the DPR cap.
  const ratio=Math.min(gl.getPixelRatio(),1.5);
  const target=useFBO(Math.round(size.width*ratio),Math.round(size.height*ratio),{
    type:THREE.UnsignedByteType,depthBuffer:true,stencilBuffer:false,
  });
  const composite=useMemo(()=>({sky:{value:target.texture}}),[target.texture]);
  const time = useRef(0);
  const stopped = useRef(false);
  const skip = useRef(true);
  const frameStats=useRef({seconds:0,frames:0});
  const group=useRef<THREE.Group>(null);
  useEffect(()=>{
    if(process.env.NODE_ENV==='development'){
      const context=gl.getContext();const debug=context.getExtension('WEBGL_debug_renderer_info');
      if(debug)gl.domElement.dataset.skyGpu=String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL));
    }
    if(!exporter)return;
    const action=async(progress:(value:string)=>void)=>{
      if(!group.current)return;
      const scene=new THREE.Scene();
      const copy=group.current.clone(true);
      const effects=copy.getObjectByName('sky-effects');if(effects)effects.visible=false;
      scene.add(copy);
      try{await exportSkyMaster(gl,scene,progress);}finally{scene.clear();}
    };
    exporter.current=action;
    return()=>{if(exporter.current===action)exporter.current=null;};
  },[exporter,gl]);
  useEffect(()=>{
    const preference=matchMedia("(prefers-reduced-motion: reduce)");
    const sync=()=>{stopped.current=preference.matches||document.hidden;skip.current=true;};
    sync();preference.addEventListener("change",sync);document.addEventListener("visibilitychange",sync);
    return()=>{preference.removeEventListener("change",sync);document.removeEventListener("visibilitychange",sync);};
  },[]);
  useFrame((_,delta)=>{
    // The fixed cloud field and color plate share this frame's orbit view.
    skyCamera.copy(camera as THREE.PerspectiveCamera);
    skyCamera.far=3000;skyCamera.updateProjectionMatrix();skyCamera.updateMatrixWorld();
    if(timeOverride!==null)time.current=timeOverride;
    else if(skip.current)skip.current=false;
    else if(!stopped.current&&!paused)time.current+=Math.min(delta,0.1);
    if(process.env.NODE_ENV==="development"){
      gl.domElement.dataset.skyMode="layered";
      gl.domElement.dataset.cloudTime=time.current.toFixed(3);
      gl.domElement.dataset.cloudPaused=String(stopped.current||paused);
      gl.domElement.dataset.skySceneChildren=String(group.current?.children.length??0);
      if(!stopped.current&&!paused&&delta>0&&delta<0.25){
        frameStats.current.seconds+=delta;frameStats.current.frames++;
        if(frameStats.current.seconds>=2){
          gl.domElement.dataset.skyFrameMs=(1000*frameStats.current.seconds/frameStats.current.frames).toFixed(2);
          gl.domElement.dataset.skyTextures=String(gl.info.memory.textures);
          gl.domElement.dataset.skyDrawCalls=String(gl.info.render.calls);
          frameStats.current={seconds:0,frames:0};
        }
      }
    }
  },-0.9);
  useFrame(()=>{
    const previous=gl.getRenderTarget();
    const xr=gl.xr.enabled;
    try{
      gl.xr.enabled=false;gl.setRenderTarget(target);gl.clear();gl.render(skyScene,skyCamera);
    }finally{gl.setRenderTarget(previous);gl.xr.enabled=xr;}
  },-0.5);
  return <>
    {createPortal(<group ref={group}>
      <CleanSkyPlate onReady={handlePlateReady}/>
      <SkyStars/>
      <SkyEffects active={!paused || timeOverride !== null} time={time}/>
      <Suspense fallback={null}><CloudField onReady={handleCloudsReady}/></Suspense>
    </group>,skyScene,{camera:skyCamera})}
    <mesh renderOrder={-3000} frustumCulled={false} raycast={()=>null}>
      <planeGeometry args={[2,2]}/>
      <shaderMaterial uniforms={composite} depthWrite={false} depthTest={false} toneMapped={false}
        vertexShader={`varying vec2 screenUv;void main(){screenUv=uv;gl_Position=vec4(position.xy,1.0,1.0);}`}
        fragmentShader={`uniform sampler2D sky;varying vec2 screenUv;void main(){gl_FragColor=texture2D(sky,screenUv);
          #include <colorspace_fragment>
        }`}/>
    </mesh>
  </>;
}
