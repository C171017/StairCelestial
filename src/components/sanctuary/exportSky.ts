import * as THREE from "three";

/** A tiled master avoids the browser's maximum single-canvas area/texture size. */
export async function exportSkyMaster(gl: THREE.WebGLRenderer, scene: THREE.Scene, onProgress: (value:string)=>void) {
  const {zipSync,strToU8}=await import('fflate');
  const size=Math.min(6144,gl.capabilities.maxTextureSize);
  const target=new THREE.WebGLRenderTarget(size,size,{type:THREE.UnsignedByteType,depthBuffer:true});
  target.texture.colorSpace=THREE.SRGBColorSpace;
  const camera=new THREE.PerspectiveCamera(90,1,0.1,3000);
  camera.position.set(0,2.8,0);
  const faces=[
    {name:'px',direction:[1,0,0],up:[0,-1,0]},
    {name:'nx',direction:[-1,0,0],up:[0,-1,0]},
    {name:'py',direction:[0,1,0],up:[0,0,1]},
    {name:'ny',direction:[0,-1,0],up:[0,0,-1]},
    {name:'pz',direction:[0,0,1],up:[0,-1,0]},
    {name:'nz',direction:[0,0,-1],up:[0,-1,0]},
  ];
  const files:Record<string,Uint8Array>={};
  const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
  const context=canvas.getContext('2d');
  if(!context)throw new Error('Image export is unavailable.');
  try{
    for(const [index,face]of faces.entries()){
      onProgress(`Saving view ${index+1} of 6…`);
      await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
      camera.up.fromArray(face.up);camera.lookAt(camera.position.clone().add(new THREE.Vector3().fromArray(face.direction)));
      camera.updateMatrixWorld();
      const previous=gl.getRenderTarget();
      const pixels=new Uint8Array(size*size*4);
      try{
        gl.setRenderTarget(target);gl.clear();gl.render(scene,camera);gl.readRenderTargetPixels(target,0,0,size,size,pixels);
      }finally{gl.setRenderTarget(previous);}
      const image=context.createImageData(size,size);
      // CubeCamera convention already uses downward up vectors. Retaining
      // WebGL's row order produces upright standard cubemap face images.
      image.data.set(pixels);
      context.putImageData(image,0,0);
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image encoding failed.')),'image/png'));
      files[`${face.name}.png`]=new Uint8Array(await blob.arrayBuffer());
    }
    files['manifest.json']=strToU8(JSON.stringify({faceSize:size,format:'cubemap',order:faces.map(f=>f.name),cameraPosition:[0,2.8,0],faces,panoramaTarget:[24576,12288],colorSpace:'sRGB',note:'Frozen layered-cloud artwork. Convert to equirectangular for the 24K reference; runtime uses separate cloud textures.'},null,2));
    onProgress('Preparing master download…');
    const zip=zipSync(files,{level:0});
    const url=URL.createObjectURL(new Blob([zip as BlobPart],{type:'application/zip'}));
    const link=document.createElement('a');link.href=url;link.download=`layered-sky-master-${size}.zip`;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }finally{target.dispose();canvas.width=1;canvas.height=1;}
}
