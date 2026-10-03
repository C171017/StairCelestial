"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import { LayeredSky } from "@/components/sanctuary/LayeredSky";

function View({azimuth}:{azimuth:number}) {
  useFrame(({camera})=>{camera.position.set(Math.sin(azimuth)*24,2.8,Math.cos(azimuth)*24);camera.lookAt(0,0,0);},-1);
  return null;
}

export default function SkyReview() {
  const [azimuth,setAzimuth]=useState(0);
  const [paused,setPaused]=useState(false);
  const [flow,setFlow]=useState(true);
  const [status,setStatus]=useState('');
  const [busy,setBusy]=useState(false);
  const [moment,setMoment]=useState<number|null>(null);
  const exporter=useRef<((progress:(value:string)=>void)=>Promise<void>)|null>(null);
  const pointer=useRef<number|null>(null);
  return <main style={{width:"100vw",height:"100dvh"}} onWheel={e=>setAzimuth(a=>a+e.deltaY*0.0015)}
    onPointerDown={e=>{pointer.current=e.clientX;}} onPointerMove={e=>{if(pointer.current!==null){setAzimuth(a=>a+(e.clientX-pointer.current!)*0.005);pointer.current=e.clientX;}}}
    onPointerUp={()=>{pointer.current=null;}} onPointerCancel={()=>{pointer.current=null;}} onPointerLeave={()=>{pointer.current=null;}}>
    <Canvas dpr={[1,1.5]} camera={{position:[0,2.8,24],fov:42,far:3000}} gl={{antialias:false}}
      onCreated={({gl})=>{gl.toneMapping=THREE.NoToneMapping;}}>
      <View azimuth={azimuth}/><Suspense fallback={null}><LayeredSky paused={paused} timeOverride={moment} deformation={flow} exporter={exporter}/></Suspense>
    </Canvas>
    <div style={{position:"absolute",bottom:20,left:20,right:20,width:"fit-content",maxWidth:"calc(100% - 40px)",display:"flex",flexWrap:"wrap",gap:12,color:"#17394b",background:"#ffffffdd",padding:12,borderRadius:12}} onPointerDown={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()}>
      <button onClick={()=>{setMoment(null);setPaused(v=>!v);}}>{paused?"Resume clouds":"Pause clouds"}</button>
      <button onClick={()=>setFlow(v=>!v)}>{flow?"Flow on":"Translation only"}</button>
      <button onClick={()=>setAzimuth(0)}>Entrance view</button>
      <label>Time <input aria-label="Cloud time in seconds" type="number" min="0" max="36000" value={moment??''} style={{width:66}} onChange={e=>{const value=Number(e.target.value);setMoment(Number.isFinite(value)?Math.min(36000,Math.max(0,value)):0);setPaused(true);}}/></label>
      <button disabled={busy} onClick={async()=>{setPaused(true);setBusy(true);try{if(!exporter.current)throw new Error('Sky is still loading');await exporter.current(setStatus);setStatus('Master saved');}catch{setStatus('Export failed — try again after the sky loads.');}finally{setBusy(false);}}}>Save master</button>
      <button disabled={busy} onClick={()=>{
        const canvas=document.querySelector('canvas');if(!canvas)return;
        if(typeof MediaRecorder==='undefined'||!MediaRecorder.isTypeSupported('video/webm')){setStatus('Recording is unavailable in this browser.');return;}
        setMoment(null);setPaused(false);setBusy(true);setStatus('Recording ten seconds…');
        const stream=canvas.captureStream(30);const recorder=new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:16000000});const chunks:Blob[]=[];
        recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
        recorder.onstop=()=>{const url=URL.createObjectURL(new Blob(chunks,{type:'video/webm'}));const link=document.createElement('a');link.href=url;link.download='flowing-clouds-review.webm';link.click();stream.getTracks().forEach(track=>track.stop());setBusy(false);setStatus('Recording saved');setTimeout(()=>URL.revokeObjectURL(url),60000);};
        recorder.onerror=()=>{stream.getTracks().forEach(track=>track.stop());setBusy(false);setStatus('Recording failed');};
        recorder.start();setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop();},10000);
      }}>Record motion</button>
      {status&&<span role="status">{status}</span>}
      <span>Scroll or drag to orbit</span>
    </div>
  </main>;
}
