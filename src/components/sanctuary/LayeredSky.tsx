"use client";

import { useFBO } from "@react-three/drei";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FlowingClouds } from "./FlowingClouds";
import { SkyEffects } from "./SkyEffects";
import type { RefObject } from "react";
import { exportSkyMaster } from "./exportSky";
import { CleanSkyPlate } from "./CleanSkyPlate";

export function LayeredSky({ paused=false, deformation=true, timeOverride=null, exporter }: { paused?:boolean;deformation?:boolean;timeOverride?:number|null;exporter?:RefObject<((progress:(value:string)=>void)=>Promise<void>)|null> }) {
  const {gl,size,camera} = useThree();
  // Keep the portal container stable through Fast Refresh and effect replay.
  const [skyScene] = useState(()=>new THREE.Scene());
  const [skyCamera] = useState(()=>new THREE.PerspectiveCamera());
  // Cloud artwork retains its source resolution. The composited sky needs one
  // sample per CSS pixel on large displays, while narrow views retain 1.5x.
  const ratio=Math.min(gl.getPixelRatio(),size.width<700?1.5:1);
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
    skyCamera.copy(camera as THREE.PerspectiveCamera);
    skyCamera.far=3000;skyCamera.updateProjectionMatrix();skyCamera.updateMatrixWorld();
    const previous=gl.getRenderTarget();
    const xr=gl.xr.enabled;
    try{
      gl.xr.enabled=false;gl.setRenderTarget(target);gl.clear();gl.render(skyScene,skyCamera);
    }finally{gl.setRenderTarget(previous);gl.xr.enabled=xr;}
  },-0.5);
  return <>
    {createPortal(<group ref={group}>
      <CleanSkyPlate />
      <SkyEffects active={!paused} time={time}/>
      <Suspense fallback={null}><FlowingClouds time={time} deformation={deformation}/></Suspense>
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
