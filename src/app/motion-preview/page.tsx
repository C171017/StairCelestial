"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LayeredSky } from "@/components/sanctuary/LayeredSky";
import type { SkyStudy } from "@/components/sanctuary/SkyAtmosphericMotion";
import { advanceSanctuaryAtmosphere, createSanctuaryAtmosphere, type SanctuaryAtmosphere } from "@/lib/sanctuaryAtmosphere";
import type { RefObject } from "react";
import styles from "./preview.module.css";

const choices = [
  {id:"clouds",number:"01",name:"Sailing clouds",description:"Billowing clouds cross the anchored landscape."},
  {id:"mist",number:"02",name:"Flowing mist",description:"Faster ribbons of vapor curl between the banks."},
  {id:"rays",number:"03",name:"Shifting light",description:"Broad shafts of sunlight sway through the sky."},
  {id:"all",number:"＋",name:"All together",description:"The balanced cloud, mist and light mix used on the homepage."},
] as const;
const moods=[{name:"Pearl daylight",travel:0},{name:"Pink sunset",travel:2},{name:"Moonlit night",travel:4},{name:"Golden sunrise",travel:6}];

function Clock({travel,atmosphere}:{travel:number;atmosphere:RefObject<SanctuaryAtmosphere>}){
  useFrame((_,delta)=>advanceSanctuaryAtmosphere(atmosphere.current,travel,delta),-1);
  return null;
}

export default function MotionPreview(){
  const [study,setStudy]=useState<SkyStudy>("all");
  const [travel,setTravel]=useState(6);
  const [paused,setPaused]=useState(false);
  const [original,setOriginal]=useState(false);
  const atmosphere=useRef(createSanctuaryAtmosphere());
  useEffect(()=>{
    const query=new URLSearchParams(window.location.search),choice=query.get("effect");
    if(choice==="combined")setStudy("all");
    else if(choices.some(item=>item.id===choice))setStudy(choice as SkyStudy);
  },[]);
  const wrapped=((travel%8)+8)%8;
  const selectStudy=(id:SkyStudy)=>{setStudy(id);setOriginal(false);};
  return <main className={styles.stage} onWheel={event=>{
    if(event.ctrlKey)return;
    const units=event.deltaMode===1?16:event.deltaMode===2?window.innerHeight:1;
    setTravel(value=>value+Math.max(-.6,Math.min(.6,event.deltaY*units/1800)));
  }}>
    <div className={styles.scene}>
      <Canvas dpr={[1,1.5]} camera={{position:[0,2.8,24],fov:42,far:3000}}
        gl={{antialias:false}} onCreated={({camera,gl})=>{camera.lookAt(0,0,0);gl.toneMapping=THREE.NoToneMapping;}}>
        <Clock travel={travel} atmosphere={atmosphere}/>
        <Suspense fallback={null}><LayeredSky atmosphere={atmosphere} paused={paused} study={original?"none":study}/></Suspense>
      </Canvas>
    </div>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>SANCTUARY / MOTION STUDIES</p><h1>Watch the wind.</h1>
        <p className={styles.intro}>Stay still. The sky keeps moving.</p></div>
      <div className={styles.actions}>
        <button aria-pressed={original} onClick={()=>setOriginal(value=>!value)}>{original?"Return to effect":"Compare original"}</button>
        <button aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?"Resume motion":"Pause motion"}</button>
      </div>
    </header>
    <section className={styles.panel} aria-label="Motion comparison">
      <div className={styles.timeRow}>
        <span className={styles.status}><i className={paused?styles.stopped:""}/>{paused?"Motion paused":original?"Original sky":"Independent wind"}</span>
        <div className={styles.moods} aria-label="Time of day">{moods.map(mood=><button key={mood.travel}
          aria-pressed={Math.abs(wrapped-mood.travel)<.08} onClick={()=>setTravel(mood.travel)}>{mood.name}</button>)}</div>
      </div>
      <div className={styles.choices}>{choices.map(choice=><button key={choice.id} aria-pressed={study===choice.id&&!original}
        onClick={()=>selectStudy(choice.id)} className={styles.choice}>
        <span className={styles.number}>{choice.number}</span><span><strong>{choice.name}</strong><small>{choice.description}</small></span>
      </button>)}</div>
      <p className={styles.footnote}>Scroll to move through the day. Wind keeps its own pace and direction. <span>Comparison view</span></p>
    </section>
  </main>;
}
