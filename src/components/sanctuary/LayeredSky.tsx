"use client";

import { useFBO } from "@react-three/drei";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { CloudField } from "./CloudField";
import { SkyEffects } from "./SkyEffects";
import type { RefObject } from "react";
import { exportSkyMaster } from "./exportSky";
import { CleanSkyPlate } from "./CleanSkyPlate";
import type { SanctuaryAtmosphere } from "@/lib/sanctuaryAtmosphere";
import type { SkyStudy } from "./SkyAtmosphericMotion";
import { useCloudArtwork } from "@/hooks/useCloudArtwork";
const SkyAtmosphericMotion = lazy(()=>import("./SkyAtmosphericMotion"));

/** A failed enhancement must not remove an already usable core scene. */
class OptionalEffectsBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function LayeredSky({ paused=false, timeOverride=null, atmosphere, reflectionScene, exporter, onReady, study="none", deferEffects=false, effectsEnabled=true }: { paused?:boolean;timeOverride?:number|null;atmosphere?:RefObject<SanctuaryAtmosphere>;reflectionScene?:RefObject<THREE.Scene|null>;exporter?:RefObject<((progress:(value:string)=>void)=>Promise<void>)|null>;onReady?:()=>void;study?:SkyStudy;deferEffects?:boolean;effectsEnabled?:boolean }) {
  const {gl,size,camera} = useThree();
  const rendererRatio = useThree(state => state.viewport.dpr);
  const artwork=useCloudArtwork();
  const hasMotion=study!=="none"&&study!=="light";
  const [motionReady,setMotionReady]=useState(false);
  const handleMotionReady=useCallback(()=>setMotionReady(true),[]);
  const [cloudsReady, setCloudsReady] = useState(false);
  const [plateReady, setPlateReady] = useState(false);
  const handleCloudsReady = useCallback(() => setCloudsReady(true), []);
  const handlePlateReady = useCallback(() => setPlateReady(true), []);
  useEffect(() => {
    const ready = cloudsReady && plateReady && (deferEffects||!hasMotion||motionReady);
    if (process.env.NODE_ENV === "development") gl.domElement.dataset.skyReady = String(ready);
    if (ready) onReady?.();
  }, [cloudsReady, plateReady, deferEffects, hasMotion, motionReady, gl, onReady]);
  // Keep the portal container stable through Fast Refresh and effect replay.
  const [skyScene] = useState(()=>new THREE.Scene());
  const [skyCamera] = useState(()=>new THREE.PerspectiveCamera());
  const optionalGroup = useRef<THREE.Group>(null);
  const [effectsCompiled, setEffectsCompiled] = useState(!deferEffects);
  const [effectsFailed, setEffectsFailed] = useState(false);
  const handleEffectsError = useCallback(() => setEffectsFailed(true), []);
  const effectsReveal = useRef(deferEffects ? 0 : 1);
  useEffect(() => {
    if (!deferEffects || !effectsEnabled || (hasMotion && !motionReady) || !optionalGroup.current) return;
    let cancelled = false;
    // Compile the already-decoded shared artwork without showing an incomplete
    // optional layer. The core sky/control readiness does not await this work.
    Promise.resolve().then(() => gl.compileAsync(optionalGroup.current!, skyCamera, skyScene)).then(() => {
      if (!cancelled) setEffectsCompiled(true);
    }).catch(() => {
      if (!cancelled) setEffectsFailed(true);
    });
    return () => { cancelled = true; };
  }, [deferEffects, effectsEnabled, hasMotion, motionReady, gl, skyCamera, skyScene]);
  useEffect(() => {
    skyScene.userData.reflectionRevision = (skyScene.userData.reflectionRevision ?? 0) + 1;
  }, [artwork, effectsFailed, skyScene]);
  useEffect(() => {
    // Deferred layers enter the reflection only once their fade finishes.
    // Capturing invisible/preparing layers would repeat six faces for no gain.
    if (!deferEffects) skyScene.userData.reflectionRevision = (skyScene.userData.reflectionRevision ?? 0) + 1;
  }, [deferEffects, motionReady, skyScene]);
  useEffect(() => {
    if (!reflectionScene || !cloudsReady || !plateReady || (!deferEffects&&hasMotion&&!motionReady)) return;
    reflectionScene.current = skyScene;
    return () => { if (reflectionScene.current === skyScene) reflectionScene.current = null; };
  }, [cloudsReady, plateReady, deferEffects, hasMotion, motionReady, reflectionScene, skyScene]);
  // Preserve the source detail through the entire Retina compositing path.
  const ratio=Math.min(rendererRatio,2);
  const target=useFBO(Math.round(size.width*ratio),Math.round(size.height*ratio),{
    // Every sky material disables depth writes and painter order composes its
    // clouds. A depth attachment would be cleared but never contain a surface.
    type:THREE.UnsignedByteType,depthBuffer:false,stencilBuffer:false,
  });
  const composite=useMemo(()=>({sky:{value:target.texture}}),[target.texture]);
  const time = useRef(0);
  const stopped = useRef(false);
  const skip = useRef(true);
  const frameStats=useRef({seconds:0,frames:0});
  const renders = useRef(0);
  const lastRender = useRef({view:new THREE.Matrix4(),projection:new THREE.Matrix4(),phase:NaN,time:NaN,reveal:NaN,revision:-1,width:0,height:0});
  useEffect(() => { lastRender.current.time = NaN; }, [paused, timeOverride, effectsFailed]);
  const group=useRef<THREE.Group>(null);
  useEffect(() => {
    const restored = () => { lastRender.current.time = NaN; };
    gl.domElement.addEventListener("webglcontextrestored", restored);
    return () => gl.domElement.removeEventListener("webglcontextrestored", restored);
  }, [gl]);
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
    const sync=()=>{stopped.current=preference.matches||document.hidden;skip.current=true;lastRender.current.time=NaN;};
    sync();preference.addEventListener("change",sync);document.addEventListener("visibilitychange",sync);
    return()=>{preference.removeEventListener("change",sync);document.removeEventListener("visibilitychange",sync);};
  },[]);
  useFrame((_,delta)=>{
    // The cloud field and color plate share this frame's orbit view.
    skyCamera.copy(camera as THREE.PerspectiveCamera);
    skyCamera.far=3000;skyCamera.updateProjectionMatrix();skyCamera.updateMatrixWorld();
    if(timeOverride!==null)time.current=timeOverride;
    else if(skip.current)skip.current=false;
    else if(!stopped.current&&!paused)time.current+=Math.min(delta,0.1);
    if (deferEffects && effectsCompiled && effectsReveal.current < 1) {
      effectsReveal.current = Math.min(1, effectsReveal.current + Math.min(delta, 0.1) / 0.9);
      if (effectsReveal.current === 1) skyScene.userData.reflectionRevision++;
    }
    if(process.env.NODE_ENV==="development"){
      gl.domElement.dataset.skyMode="layered";
      gl.domElement.dataset.atmosphericMotion=study;
      gl.domElement.dataset.cloudTime=time.current.toFixed(3);
      gl.domElement.dataset.cloudPaused=String(stopped.current||paused);
      gl.domElement.dataset.skyRatio=ratio.toFixed(2);
      gl.domElement.dataset.atmosphereTravel=(atmosphere?.current.userTravel??0).toFixed(4);
      gl.domElement.dataset.atmosphereNight=(atmosphere?.current.night??0).toFixed(4);
      gl.domElement.dataset.worldHour=(Math.round((atmosphere?.current.worldHour??12)*1000)/1000%24).toFixed(3);
      gl.domElement.dataset.skySceneChildren=String(group.current?.children.length??0);
      gl.domElement.dataset.skyOptionalEffects = effectsFailed ? "failed" : !effectsEnabled ? "deferred" : !effectsCompiled ? "preparing" : effectsReveal.current < 1 ? "revealing" : "ready";
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
    if (document.hidden) return;
    const last = lastRender.current;
    const phase = atmosphere?.current.solarPhase ?? 0;
    const revision = skyScene.userData.reflectionRevision ?? 0;
    // Frozen/reduced-motion skies still redraw for orbit, time-of-day, resize,
    // a new layer or its entrance fade. Moving wind keeps its full frame rate.
    if (last.time === time.current && last.phase === phase && last.reveal === effectsReveal.current &&
      last.revision === revision && last.width === target.width && last.height === target.height &&
      last.view.equals(skyCamera.matrixWorldInverse) && last.projection.equals(skyCamera.projectionMatrix)) return;
    const previous=gl.getRenderTarget();
    const xr=gl.xr.enabled;
    try{
      gl.xr.enabled=false;gl.setRenderTarget(target);gl.clear();gl.render(skyScene,skyCamera);
    }finally{gl.setRenderTarget(previous);gl.xr.enabled=xr;}
    last.view.copy(skyCamera.matrixWorldInverse); last.projection.copy(skyCamera.projectionMatrix);
    last.time=time.current;last.phase=phase;last.reveal=effectsReveal.current;last.revision=revision;
    last.width=target.width;last.height=target.height;
    if (process.env.NODE_ENV === "development") gl.domElement.dataset.skyCompositeRenders=String(++renders.current);
  },-0.5);
  return <>
    {createPortal(<group ref={group}>
      <CleanSkyPlate onReady={handlePlateReady} atmosphere={atmosphere} time={time}/>
      <CloudField sources={artwork} onReady={handleCloudsReady} atmosphere={atmosphere} time={time} lightStudy={study==="light"}/>
      {effectsEnabled&&!effectsFailed&&<OptionalEffectsBoundary onError={handleEffectsError}><group ref={optionalGroup} visible={effectsCompiled} name="optional-sky-effects">
        <SkyEffects active={!paused} timeOverride={timeOverride} atmosphere={atmosphere}/>
        {hasMotion&&artwork!==null&&<Suspense fallback={null}><SkyAtmosphericMotion mode={study as Exclude<SkyStudy,"none"|"light">} artwork={artwork} onReady={handleMotionReady} atmosphere={atmosphere} time={time} reveal={effectsReveal}/></Suspense>}
      </group></OptionalEffectsBoundary>}
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
