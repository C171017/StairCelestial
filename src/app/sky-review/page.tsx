"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { LayeredSky } from "@/components/sanctuary/LayeredSky";

type CapturedFrame = {
  pixels: Uint8ClampedArray;
  hash: string;
  width: number;
  height: number;
  blockSize: number;
};
type Capture = (degrees: number, waitFrames?: number) => Promise<CapturedFrame>;
type FrameDifference = ReturnType<typeof compareFrames>;
type OrbitStep = FrameDifference & { fromDegrees: number; toDegrees: number };
type DenseWindow = { centerDegrees: number; steps: OrbitStep[]; worst: OrbitStep };
type ProbeReport = {
  completedAt: string;
  durationSeconds: number;
  fixedTimeSeconds: number;
  sample: { width: number; height: number; blockSize: number };
  fullLoop: FrameDifference;
  reverseMismatches: number[];
  sameViewAfterDenseSweep: FrameDifference;
  sameViewAfter60Frames: FrameDifference;
  worstForward: OrbitStep[];
  worstReverse: OrbitStep[];
  dense: DenseWindow[];
  forward: OrbitStep[];
  reverse: OrbitStep[];
};

function View({azimuth,probeAzimuth}:{azimuth:number;probeAzimuth:RefObject<number|null>}) {
  useFrame(({camera,gl})=>{
    const angle=probeAzimuth.current??azimuth;
    camera.position.set(Math.sin(angle)*24,2.8,Math.cos(angle)*24);
    camera.lookAt(0,0,0);
    camera.updateMatrixWorld();
    gl.domElement.dataset.viewAzimuthDegrees=(angle*180/Math.PI).toFixed(6);
  },-1);
  return null;
}

// The review page owns this final render so the sampled canvas is always the
// completed GPU frame, including the sky portal's earlier offscreen pass.
function FrameCapture({capture,probeAzimuth}:{capture:RefObject<Capture|null>;probeAzimuth:RefObject<number|null>}) {
  const pending=useRef<{remaining:number;resolve:(frame:CapturedFrame)=>void;reject:(error:unknown)=>void}|null>(null);
  const sampler=useRef<HTMLCanvasElement|null>(null);
  useEffect(()=>{
    capture.current=(degrees,waitFrames=1)=>new Promise((resolve,reject)=>{
      if(pending.current){reject(new Error("A frame capture is already pending"));return;}
      probeAzimuth.current=degrees*Math.PI/180;
      pending.current={remaining:waitFrames,resolve,reject};
    });
    return()=>{capture.current=null;pending.current?.reject(new Error("Review canvas closed"));pending.current=null;};
  },[capture,probeAzimuth]);
  useFrame(({gl,scene,camera})=>{
    gl.render(scene,camera);
    const request=pending.current;
    if(!request||--request.remaining>0)return;
    pending.current=null;
    try{
      const source=gl.domElement;
      const scale=Math.min(1,384/source.width,192/source.height);
      const width=Math.max(1,Math.round(source.width*scale));
      const height=Math.max(1,Math.round(source.height*scale));
      const sample=sampler.current??(sampler.current=document.createElement("canvas"));
      if(sample.width!==width||sample.height!==height){sample.width=width;sample.height=height;}
      const context=sample.getContext("2d",{willReadFrequently:true});
      if(!context)throw new Error("Canvas frame sampling is unavailable");
      context.drawImage(source,0,0,width,height);
      const pixels=context.getImageData(0,0,width,height).data;
      let hash=2166136261,checksum=0;
      for(let i=0;i<pixels.length;i++){
        hash=Math.imul(hash^pixels[i],16777619)>>>0;
        checksum=(checksum+pixels[i]*(i%65521+1))>>>0;
      }
      request.resolve({pixels,hash:`${hash.toString(16)}:${checksum.toString(16)}`,width,height,blockSize:Math.max(1,Math.round(32*width/source.clientWidth))});
    }catch(error){request.reject(error);}
  },1);
  return null;
}

function compareFrames(a:CapturedFrame,b:CapturedFrame) {
  if(a.width!==b.width||a.height!==b.height)throw new Error("Keep the review viewport unchanged while probing");
  const {width,height,blockSize}=a;
  const columns=Math.ceil(width/blockSize),rows=Math.ceil(height/blockSize);
  const sums=new Float64Array(columns*rows),counts=new Uint32Array(columns*rows);
  let total=0,changed=0,changedAny=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4;
    const r=Math.abs(a.pixels[i]-b.pixels[i]),g=Math.abs(a.pixels[i+1]-b.pixels[i+1]),blue=Math.abs(a.pixels[i+2]-b.pixels[i+2]);
    const delta=(r+g+blue)/3;
    total+=delta;
    if(Math.max(r,g,blue)>15)changed++;
    if(r||g||blue)changedAny++;
    const block=Math.floor(y/blockSize)*columns+Math.floor(x/blockSize);
    sums[block]+=delta;counts[block]++;
  }
  let worstBlock=0;
  for(let i=0;i<sums.length;i++)worstBlock=Math.max(worstBlock,sums[i]/counts[i]);
  return {meanAbsoluteRgbDelta:total/(width*height),changedOver15Percent:100*changed/(width*height),changedAnyPercent:100*changedAny/(width*height),worst32CssPixelBlockMeanDelta:worstBlock};
}

function saveReport(report:unknown) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:"application/json"}));
  const link=document.createElement("a");link.href=url;link.download="sky-continuity-probe.json";link.click();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}

export default function SkyReview() {
  const [azimuth,setAzimuth]=useState(0);
  const [paused,setPaused]=useState(true);
  const [status,setStatus]=useState('');
  const [busy,setBusy]=useState(false);
  const [moment,setMoment]=useState<number|null>(null);
  const exporter=useRef<((progress:(value:string)=>void)=>Promise<void>)|null>(null);
  const pointer=useRef<number|null>(null);
  const capture=useRef<Capture|null>(null);
  const probeAzimuth=useRef<number|null>(null);
  const [report,setReport]=useState<ProbeReport|null>(null);
  async function runProbe() {
    if(!capture.current||!exporter.current){setStatus("Sky is still loading; try again shortly.");return;}
    const original={paused,moment};
    const sample=capture.current;
    setBusy(true);setPaused(true);setMoment(moment??0);setReport(null);
    try{
      setStatus("Continuity probe: fixing the scene and sampling the forward orbit…");
      const start=performance.now();
      const first=await sample(0,3);
      const hashes=new Map<number,string>([[0,first.hash]]);
      const forward:OrbitStep[]=[],reverse:OrbitStep[]=[];
      const reverseMismatches:number[]=[];
      let previous=first;
      for(let degrees=1;degrees<=360;degrees++){
        const frame=await sample(degrees%360);
        forward.push({fromDegrees:degrees-1,toDegrees:degrees,...compareFrames(previous,frame)});
        if(degrees<360)hashes.set(degrees,frame.hash);
        previous=frame;
        if(degrees%45===0)setStatus(`Continuity probe: forward ${degrees}/360°`);
      }
      const fullLoop=compareFrames(first,previous);
      for(let degrees=359;degrees>=0;degrees--){
        const frame=await sample(degrees);
        reverse.push({fromDegrees:degrees+1,toDegrees:degrees,...compareFrames(previous,frame)});
        if(hashes.get(degrees)!==frame.hash)reverseMismatches.push(degrees);
        previous=frame;
        if(degrees%45===0)setStatus(`Continuity probe: reverse ${360-degrees}/360°`);
      }
      const dense:DenseWindow[]=[];
      for(const center of [19.55,72.55,195.475,340.65]){
        setStatus(`Continuity probe: inspecting ${center}° in 0.01° steps…`);
        let priorAngle=center-0.1;
        let priorFrame=await sample(priorAngle);
        const steps:OrbitStep[]=[];
        for(let step=1;step<=20;step++){
          const angle=center-0.1+step*0.01;
          const frame=await sample(angle);
          steps.push({fromDegrees:priorAngle,toDegrees:angle,...compareFrames(priorFrame,frame)});
          priorAngle=angle;priorFrame=frame;
        }
        dense.push({centerDegrees:center,steps,worst:steps.toSorted((a,b)=>b.worst32CssPixelBlockMeanDelta-a.worst32CssPixelBlockMeanDelta)[0]});
      }
      setStatus("Continuity probe: checking the same view after elapsed render frames…");
      const returned=await sample(0);
      const delayed=await sample(0,60);
      const result={
        completedAt:new Date().toISOString(),durationSeconds:(performance.now()-start)/1000,
        fixedTimeSeconds:moment??0,sample:{width:first.width,height:first.height,blockSize:first.blockSize},
        fullLoop,reverseMismatches,sameViewAfterDenseSweep:compareFrames(first,returned),sameViewAfter60Frames:compareFrames(returned,delayed),
        worstForward:forward.toSorted((a,b)=>b.worst32CssPixelBlockMeanDelta-a.worst32CssPixelBlockMeanDelta).slice(0,8),
        worstReverse:reverse.toSorted((a,b)=>b.worst32CssPixelBlockMeanDelta-a.worst32CssPixelBlockMeanDelta).slice(0,8),
        dense,forward,reverse,
      };
      setReport(result);
      const worstDense=Math.max(...dense.map(window=>window.worst.worst32CssPixelBlockMeanDelta));
      setStatus(`Probe complete. Reverse mismatches: ${reverseMismatches.length}/360. Loop changed pixels: ${fullLoop.changedAnyPercent.toFixed(4)}%. Worst 0.01° block delta: ${worstDense.toFixed(3)}/255.`);
    }catch(error){setStatus(`Probe failed: ${error instanceof Error?error.message:String(error)}`);}
    finally{probeAzimuth.current=null;setPaused(original.paused);setMoment(original.moment);setBusy(false);}
  }
  async function recordOrbit() {
    const canvas=document.querySelector("canvas");
    if(!canvas||!capture.current||!exporter.current){setStatus("Sky is still loading; try again shortly.");return;}
    if(typeof MediaRecorder==="undefined"||!MediaRecorder.isTypeSupported("video/webm")){setStatus("Recording is unavailable in this browser.");return;}
    const original={paused,moment};
    let stream:MediaStream|null=null;
    let animation:number|null=null;
    let finished=false;
    const restore=()=>{
      if(finished)return;
      finished=true;
      if(animation!==null)cancelAnimationFrame(animation);
      stream?.getTracks().forEach(track=>track.stop());
      probeAzimuth.current=null;
      setPaused(original.paused);setMoment(original.moment);setBusy(false);
    };
    setBusy(true);setPaused(true);setMoment(moment??0);pointer.current=null;
    setStatus("Recording a complete ten-second orbit with the sky fixed…");
    try{
      await capture.current(0,3);
      stream=canvas.captureStream(30);
      const recorder=new MediaRecorder(stream,{mimeType:"video/webm",videoBitsPerSecond:16000000});
      const chunks:Blob[]=[];
      recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      recorder.onstop=()=>{
        if(finished)return;
        const url=URL.createObjectURL(new Blob(chunks,{type:"video/webm"}));
        const link=document.createElement("a");link.href=url;link.download="fixed-sky-orbit-review.webm";link.click();
        restore();setStatus("Full orbit recording saved.");
        setTimeout(()=>URL.revokeObjectURL(url),60000);
      };
      recorder.onerror=()=>{restore();setStatus("Recording failed.");};
      recorder.start();
      const start=performance.now();
      const advance=(now:number)=>{
        if(finished)return;
        const progress=Math.min(1,(now-start)/10000);
        probeAzimuth.current=progress*Math.PI*2;
        if(progress<1){animation=requestAnimationFrame(advance);return;}
        // Render the exact starting view before ending the completed loop.
        capture.current?.(0,2).then(()=>{if(recorder.state!=="inactive")recorder.stop();}).catch(()=>{restore();setStatus("Recording failed.");});
      };
      animation=requestAnimationFrame(advance);
    }catch(error){restore();setStatus(`Recording failed: ${error instanceof Error?error.message:String(error)}`);}
  }
  return <main style={{width:"100vw",height:"100dvh"}} onWheel={e=>{if(!busy)setAzimuth(a=>a+e.deltaY*0.0015);}}
    onPointerDown={e=>{if(!busy)pointer.current=e.clientX;}} onPointerMove={e=>{if(!busy&&pointer.current!==null){setAzimuth(a=>a+(e.clientX-pointer.current!)*0.005);pointer.current=e.clientX;}}}
    onPointerUp={()=>{pointer.current=null;}} onPointerCancel={()=>{pointer.current=null;}} onPointerLeave={()=>{pointer.current=null;}}>
    <Canvas dpr={[1,1.5]} camera={{position:[0,2.8,24],fov:42,far:3000}} gl={{antialias:false}}
      onCreated={({gl})=>{gl.toneMapping=THREE.NoToneMapping;}}>
      <View azimuth={azimuth} probeAzimuth={probeAzimuth}/><Suspense fallback={null}><LayeredSky paused={paused} timeOverride={moment} exporter={exporter}/></Suspense>
      <FrameCapture capture={capture} probeAzimuth={probeAzimuth}/>
    </Canvas>
    <div style={{position:"absolute",bottom:20,left:20,right:20,width:"fit-content",maxWidth:"calc(100% - 40px)",display:"flex",flexWrap:"wrap",gap:12,color:"#17394b",background:"#ffffffdd",padding:12,borderRadius:12}} onPointerDown={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()}>
      <button disabled={busy} onClick={()=>{setMoment(null);setPaused(v=>!v);}}>{paused?"Resume effects":"Pause effects"}</button>
      <button disabled={busy} onClick={()=>setAzimuth(0)}>Entrance view</button>
      <label>View ° <input disabled={busy} aria-label="View azimuth in degrees" type="number" step="0.01" value={azimuth*180/Math.PI} style={{width:90}} onChange={e=>setAzimuth(Number(e.target.value)*Math.PI/180)}/></label>
      <label>Effect time <input disabled={busy} aria-label="Effect time in seconds" type="number" min="0" max="36000" value={moment??''} style={{width:66}} onChange={e=>{const value=Number(e.target.value);setMoment(Number.isFinite(value)?Math.min(36000,Math.max(0,value)):0);setPaused(true);}}/></label>
      <button disabled={busy} onClick={runProbe}>Run continuity probe</button>
      {report&&<button disabled={busy} onClick={()=>saveReport(report)}>Save probe report</button>}
      <button disabled={busy} onClick={async()=>{setPaused(true);setBusy(true);try{if(!exporter.current)throw new Error('Sky is still loading');await exporter.current(setStatus);setStatus('Master saved');}catch{setStatus('Export failed — try again after the sky loads.');}finally{setBusy(false);}}}>Save master</button>
      <button disabled={busy} onClick={recordOrbit}>Record orbit</button>
      {status&&<span role="status">{status}</span>}
      <span>Scroll or drag to orbit</span>
      {report&&<details style={{flexBasis:"100%",maxHeight:"40vh",overflow:"auto"}}><summary>Probe results</summary><pre aria-label="Continuity probe results" style={{fontSize:11,whiteSpace:"pre-wrap"}}>{JSON.stringify({...report,forward:undefined,reverse:undefined,dense:report.dense.map(({centerDegrees,worst})=>({centerDegrees,worst}))},null,2)}</pre></details>}
    </div>
  </main>;
}
