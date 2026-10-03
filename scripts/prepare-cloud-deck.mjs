import sharp from 'sharp';
import fs from 'node:fs/promises';

// Only cloud tops, below the old horizon; no stationary sky travels with them.
const {data,info}=await sharp('assets/sky/source/panorama-8k-master.png')
  .extract({left:2700,top:2450,width:1400,height:1400}).removeAlpha().raw().toBuffer({resolveWithObject:true});
const linear=v=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;};
const encode=v=>Math.round(255*(v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055));
const pixels=Float32Array.from(data,linear);
const band=210;
for(let axis=0;axis<2;axis++)for(let a=0;a<1400;a++)for(let b=0;b<band;b++){
  const t=b/(band-1),weight=.5*(1-t*t*(3-2*t));
  const left=(axis===0?a*1400+b:b*1400+a)*3;
  const right=(axis===0?a*1400+1399-b:(1399-b)*1400+a)*3;
  for(let c=0;c<3;c++){
    const x=pixels[left+c],y=pixels[right+c];
    pixels[left+c]=x*(1-weight)+y*weight;pixels[right+c]=y*(1-weight)+x*weight;
  }
}
const bytes=Buffer.alloc(pixels.length);
for(let i=0;i<pixels.length;i++)bytes[i]=encode(pixels[i]);
await sharp(bytes,{raw:{width:info.width,height:info.height,channels:3}}).png().toFile('assets/sky/layered/deck-tile.png');
await sharp(bytes,{raw:{width:info.width,height:info.height,channels:3}}).webp({quality:94}).toFile('public/textures/sanctuary/layers/deck.webp');
await fs.writeFile('assets/sky/layered/deck-manifest.json',JSON.stringify({source:'assets/sky/source/panorama-8k-master.png',crop:[2700,2450,1400,1400],overlap:band,blend:'symmetric, linear light on both axes'},null,2));
