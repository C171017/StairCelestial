// A cloud-free, world-fixed color plate. Fine detail belongs to moving artwork.
import sharp from 'sharp';
const width=1024,height=512,pixels=Buffer.alloc(width*height*3);
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
const encode=v=>Math.round(255*(v<=.0031308?v*12.92:1.055*Math.min(1,v)**(1/2.4)-.055));
const sun=[-.5,.04,-.8],length=Math.hypot(...sun);sun.forEach((v,i)=>sun[i]=v/length);
for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const theta=(y+.5)/height*Math.PI,phi=(x+.5)/width*Math.PI*2;
  const d=[-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta)];
  const elevation=d[1],a=smooth(-.10,.28,elevation),b=smooth(0,.65,-elevation);
  const glow=Math.max(0,d.reduce((sum,v,i)=>sum+v*sun[i],0))**10*Math.exp(-elevation*elevation*14);
  for(let c=0;c<3;c++){
    const base=[.91,.88,.73][c]*(1-a)+[.23,.46,.76][c]*a;
    const color=base*(1-b)+[.43,.59,.77][c]*b+[.10,.065,.012][c]*glow;
    pixels[(y*width+x)*3+c]=encode(color);
  }
}
await sharp(pixels,{raw:{width,height,channels:3}}).webp({lossless:true}).toFile('public/textures/sanctuary/layers/sky-clean.webp');
