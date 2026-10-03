// Preserve generated alpha: the dedicated upscaler returns RGB, not RGBA.
// Store GPU artwork as sRGB-encoded, linear-premultiplied RGB + straight alpha.
// This lets both linear filtering and generated mipmaps preserve soft edges.
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = 'assets/sky/layered';
const output = 'public/textures/sanctuary/layers';
await fs.mkdir(output,{recursive:true});
const linear = Float32Array.from({length:256},(_,v)=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;});
const encode = v=>Math.round(255*(v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055));
async function prepare(rgbFile,alphaFile,size,destination){
  const rgb=await sharp(rgbFile).removeAlpha().resize(size[0],size[1]).raw().toBuffer();
  const alpha=await sharp(alphaFile).extractChannel('alpha').resize(size[0],size[1]).raw().toBuffer();
  const rgba=Buffer.alloc(size[0]*size[1]*4);
  for(let i=0;i<alpha.length;i++){
    const a=alpha[i]/255;
    for(let c=0;c<3;c++)rgba[i*4+c]=encode(linear[rgb[i*3+c]]*a);
    rgba[i*4+3]=alpha[i];
  }
  await sharp(rgba,{raw:{width:size[0],height:size[1],channels:4}}).png().toFile(destination);
}
const files=[];
for(let i=0;i<4;i++){
  const file=path.join(root,`cumulus-${i}-premult.png`);
  await prepare(path.join(root,`cumulus-${i}-4k.png`),path.join(root,`cumulus-${i}-source.png`),[4096,4096],file);
  files.push(file);
}
// Premultiplied input must be resized without a second alpha multiplication.
const large=await sharp({create:{width:8192,height:8192,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
  .composite(files.map((input,i)=>({input,left:(i%2)*4096,top:Math.floor(i/2)*4096,blend:'over'})))
  .png().toFile(path.join(root,'cumulus-atlas-8k.png'));
void large;
for(let i=0;i<4;i++){
  const alpha=await sharp(path.join(root,'cumulus-atlas-8k.png')).extract({left:(i%2)*4096,top:Math.floor(i/2)*4096,width:4096,height:4096}).extractChannel('alpha').raw().toBuffer();
  if(alpha.reduce((a,b)=>a+b,0)/alpha.length<10)throw new Error(`Cloud atlas quadrant ${i} was erased.`);
}
for(const width of [4096,2048]){
  // Resize color and opacity independently: RGB is already premultiplied.
  const master=path.join(root,'cumulus-atlas-8k.png');
  const rgb=await sharp(master).removeAlpha().resize(width,width).toBuffer();
  const alpha=await sharp(master).extractChannel('alpha').resize(width,width).toBuffer();
  await sharp(rgb).joinChannel(alpha).png().toFile(path.join(root,`cumulus-atlas-${width}.png`));
  await sharp(rgb).joinChannel(alpha).webp({quality:94,alphaQuality:100}).toFile(path.join(output,`cumulus-${width}.webp`));
}
await prepare(path.join(root,'cirrus-source.png'),path.join(root,'cirrus-source.png'),[2048,1024],path.join(root,'cirrus-premult.png'));
await sharp(path.join(root,'cirrus-premult.png')).webp({quality:96,alphaQuality:100}).toFile(path.join(output,'cirrus.webp'));
console.log('Prepared alpha-safe 8K cloud atlas, compact derivatives and wisps.');
