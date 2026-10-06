"use client";

import { useEffect, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createCloudAdvection, sampleCloudAdvection } from "@/lib/cloudAdvection";
import { createSanctuaryAtmosphere, type SanctuaryAtmosphere } from "@/lib/sanctuaryAtmosphere";

export type SkyStudy = "none" | "mist" | "light" | "rays" | "clouds" | "combined" | "all";
type MotionProps = { atmosphere?: RefObject<SanctuaryAtmosphere>; time: RefObject<number>; balanced?: boolean; reveal?: RefObject<number> };
const WHITE = new THREE.Color(1, 1, 1);
const vertex = `varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const vaporFragment = `
uniform sampler2D artwork;
uniform vec4 offsets;
uniform vec2 atlasOffset;
uniform float blend, atlasScale, opacity, time, mist;
uniform vec3 highlight, shadow;
varying vec2 vUv;
vec4 vaporAt(vec2 uv){
  vec2 edge=smoothstep(vec2(0.),vec2(.1),uv)*(1.-smoothstep(vec2(.9),vec2(1.),uv));
  return texture2D(artwork,atlasOffset+clamp(uv,.002,.998)*atlasScale)*edge.x*edge.y;
}
void main(){
  vec2 uv=vUv;
  // Slow curling of fine vapor rides on a clearly translating silhouette.
  uv.y+=mist*.025*sin(uv.x*12.+time*.55);
  vec4 vapor=mix(vaporAt(uv-offsets.zw),vaporAt(uv-offsets.xy),blend);
  vec2 edge=smoothstep(vec2(0.),vec2(.12),vUv)*(1.-smoothstep(vec2(.88),vec2(1.),vUv));
  float alpha=vapor.a*edge.x*edge.y*opacity;
  if(alpha<.001)discard;
  vec3 source=vapor.rgb/max(vapor.a,.001);
  float detail=smoothstep(.035,.92,dot(source,vec3(.2126,.7152,.0722)));
  vec3 color=mix(shadow,highlight,mix(detail,.68+.32*detail,mist));
  gl_FragColor=vec4(color,alpha);
  #include <colorspace_fragment>
}`;

/** Movement reads ambient seconds only. World time supplies lighting, never wind. */
function WindLayers({ kind, atmosphere, time, source, balanced=false, reveal }: MotionProps & { kind: "mist" | "clouds"; source: THREE.Texture }) {
  const fallback=useMemo(createSanctuaryAtmosphere,[]);
  const resources=useMemo(()=>{
    // Borrow the same uploaded artwork as the slow banks. LayeredSky owns it.
    const texture=source;
    const geometry=new THREE.PlaneGeometry(1,1);
    const items=Array.from({length:8},(_,index)=>{
      const layer=Math.floor(index/4),wisp=kind==="mist",tile=(index+layer)%4;
      const angle=(index%4)*Math.PI/2+layer*.35;
      const radius=wisp?310+layer*170:350+layer*200;
      const width=wisp?700+layer*180:610+layer*190;
      const height=wisp?195:300;
      const cloud={index:index+100,x:Math.sin(angle)*radius,y:wisp?-5+layer*40:-82-layer*15,
        z:Math.cos(angle)*radius,width,height,wisp,tile,opacity:1,haze:0,renderOrder:-62-layer};
      // Roughly one third slower than the first integration. Longer periods
      // preserve the travel distance and let each shape remain recognizable.
      const flow={...createCloudAdvection(cloud,{
        speed:wisp?(layer?4.0:6.8):(layer?3.2:5.4),
        period:wisp?(layer?69:50):(layer?84:62),
      }),phaseOffset:(index*.381966+.27)%1};
      const sample={aU:0,aV:0,bU:0,bV:0,blend:0};
      const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:vaporFragment,
        transparent:true,depthTest:false,depthWrite:false,toneMapped:false,side:THREE.DoubleSide,forceSinglePass:true,
        uniforms:{artwork:{value:texture},offsets:{value:new THREE.Vector4()},blend:{value:0},
          atlasOffset:{value:new THREE.Vector2(wisp?0:(tile%2)*.5,wisp?0:Math.floor(tile/2)*.5)},
          atlasScale:{value:wisp?1:.5},opacity:{value:0},
          mist:{value:wisp?1:0},time:{value:0},highlight:{value:new THREE.Color()},shadow:{value:new THREE.Color()}}});
      const mesh=new THREE.Mesh(geometry,material);
      mesh.position.set(cloud.x,cloud.y,cloud.z);mesh.scale.set(width,height,1);mesh.lookAt(0,wisp?20:25,0);
      mesh.renderOrder=cloud.renderOrder+index*.001;mesh.raycast=()=>null;
      const opacity=balanced?(wisp?(layer?.28:.46):(layer?.50:.78)):(wisp?(layer?.48:.78):(layer?.68:.94));
      return {mesh,material,flow,sample,opacity};
    });
    return {texture,geometry,items};
  },[source,kind,balanced]);
  useFrame(()=>{
    const mood=atmosphere?.current??fallback;
    for(const item of resources.items){
      sampleCloudAdvection(time.current,item.flow,item.sample);
      const u=item.material.uniforms;
      u.offsets.value.set(item.sample.aU,item.sample.aV,item.sample.bU,item.sample.bV);
      u.blend.value=item.sample.blend;u.time.value=time.current*.65;
      // Leave room for stars and moon at night, and pearl detail at noon.
      u.opacity.value=item.opacity*(balanced?(kind==="mist"?1-.18*mood.daylight-.24*mood.night:1-.12*mood.night):1)*(reveal?.current??1);
      u.highlight.value.setRGB(...mood.cloudHighlight);u.shadow.value.setRGB(...mood.cloudShadow);
    }
  },-.65);
  useEffect(()=>()=>{
    resources.geometry.dispose();resources.items.forEach(item=>item.material.dispose());
  },[resources]);
  return <group name={`atmospheric-${kind}`}>{resources.items.map((item,index)=><primitive key={index} object={item.mesh} dispose={null}/>)}</group>;
}

const rayVertex = `varying vec3 direction;
void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const rayFragment = `
uniform vec3 sourceDirection, tint;
uniform float time, strength;
varying vec3 direction;
float beam(float angle,float center,float width){
  float distance=atan(sin(angle-center),cos(angle-center));
  return exp(-distance*distance/(width*width));
}
void main(){
  vec3 d=normalize(direction);
  vec3 right=normalize(cross(vec3(0.,1.,0.),sourceDirection));
  vec3 up=cross(sourceDirection,right);
  vec2 p=vec2(dot(d,right),dot(d,up));
  float r=length(p),angle=atan(p.y,p.x);
  float drift=.22*sin(time*.34)+.07*sin(time*.79);
  float fan=beam(angle,3.32+drift,.19)*(.8+.2*sin(time*.6))
    +beam(angle,2.64-drift*.7,.22)*.78
    +beam(angle,1.8+drift*.8,.16)*.56;
  float taper=smoothstep(.018,.10,r)*(1.-smoothstep(.40,.95,r));
  float hemisphere=smoothstep(.1,.5,dot(d,sourceDirection));
  gl_FragColor=vec4(tint,fan*taper*hemisphere*strength);
  #include <colorspace_fragment>
}`;
function LightShafts({ atmosphere, time, balanced=false, reveal }: MotionProps) {
  const fallback=useMemo(createSanctuaryAtmosphere,[]);
  const resources=useMemo(()=>{
    const geometry=new THREE.SphereGeometry(430,48,24);
    const material=new THREE.ShaderMaterial({vertexShader:rayVertex,fragmentShader:rayFragment,
      side:THREE.BackSide,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
      uniforms:{sourceDirection:{value:new THREE.Vector3()},tint:{value:new THREE.Color()},time:{value:0},strength:{value:0}}});
    const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=-2950;mesh.raycast=()=>null;
    return {geometry,material,mesh};
  },[]);
  useFrame(()=>{
    const mood=atmosphere?.current??fallback,u=resources.material.uniforms;
    const lunar=mood.night>.5;
    u.sourceDirection.value.fromArray(lunar?mood.moonDirection:mood.sunDirection);
    u.tint.value.setRGB(...mood.keyColor).lerp(WHITE,.4);
    u.time.value=time.current*(balanced?.65:1);
    // Fade through the solar/lunar handoff so reversing time cannot snap a fan
    // between opposite horizons. Wind and shaft sway still use ambient time.
    const handoff=Math.abs(mood.night-.5)*2;
    const accentPhase=((time.current+22)%72)/72;
    const accent=THREE.MathUtils.smoothstep(accentPhase,.06,.23)*(1-THREE.MathUtils.smoothstep(accentPhase,.65,.88));
    u.strength.value=(balanced
      ?(.44*mood.dawn+.36*mood.sunset+.07*mood.daylight+.12*mood.night)*accent
      :(.68*mood.dawn+.58*mood.sunset+.12*mood.daylight+.27*mood.night))*handoff*handoff*(reveal?.current??1);
    // The accent spends part of its cycle at exact zero. Skip the full-screen
    // translucent sphere then, retaining every nonzero lighting contribution.
    resources.mesh.visible = u.strength.value > 0;
  },-.65);
  useEffect(()=>()=>{resources.geometry.dispose();resources.material.dispose();},[resources]);
  return <primitive object={resources.mesh} dispose={null}/>;
}

/** Shared production atmosphere and individually selectable comparison modes. */
export default function SkyAtmosphericMotion({ mode, artwork, onReady, ...props }: MotionProps & {
  mode: "mist" | "rays" | "clouds" | "combined" | "all";
  artwork: readonly THREE.Texture[];
  onReady?: () => void;
}) {
  useEffect(()=>{onReady?.();},[onReady,mode,artwork]);
  const balanced=mode==="all";
  return <>
    {artwork.length===2&&(mode==="clouds"||mode==="combined"||balanced)&&<WindLayers kind="clouds" source={artwork[0]} balanced={balanced} {...props}/>}
    {artwork.length===2&&(mode==="mist"||mode==="combined"||balanced)&&<WindLayers kind="mist" source={artwork[1]} balanced={balanced} {...props}/>}
    {(mode==="rays"||balanced)&&<LightShafts balanced={balanced} {...props}/>}
  </>;
}
