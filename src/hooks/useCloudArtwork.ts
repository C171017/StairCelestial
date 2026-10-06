"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

export function useCloudArtwork() {
  const {gl,size}=useThree();
  // Keep this visit's immutable artwork through orientation/layout changes;
  // resizing must not dispose textures that the visible scene still borrows.
  const [compact]=useState(()=>size.width<700);
  const [maps,setMaps]=useState<THREE.Texture[]|null>(null);
  useEffect(()=>{
    let disposed=false;
    const owned=new Set<THREE.Texture>();
    const prepare=(texture:THREE.Texture)=>{
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.anisotropy=Math.min(8,gl.capabilities.getMaxAnisotropy());
      texture.needsUpdate=true;
      if(disposed)texture.dispose();else owned.add(texture);
      return texture;
    };
    const loader=new THREE.TextureLoader();
    // Resolve one final bank before publishing it. Compressed-capable browsers
    // need not download/decode an unused 4K WebP before starting the same KTX.
    const loadBank=async()=>{
      const compressed=gl.extensions.has('WEBGL_compressed_texture_astc')||gl.extensions.has('EXT_texture_compression_bptc')||gl.extensions.has('WEBGL_compressed_texture_s3tc')||gl.extensions.has('WEBGL_compressed_texture_etc');
      if(compressed&&gl.capabilities.maxTextureSize>=4096){
        const width=compact||gl.capabilities.maxTextureSize<8192?4096:8192;
        const decoder=new KTX2Loader().setTranscoderPath('/basis/').setWorkerLimit(1).detectSupport(gl);
        try{
          // KTX rows are exported to match TextureLoader's orientation.
          return prepare(await decoder.loadAsync(`/textures/sanctuary/layers/cumulus-${width}.ktx2`));
        }catch{
          if(disposed)throw new Error("Cloud artwork load cancelled");
          // Transcoding/network failure keeps the established WebP fallback.
        }finally{decoder.dispose();}
      }
      return prepare(await loader.loadAsync(`/textures/sanctuary/layers/cumulus-${compact||gl.capabilities.maxTextureSize<4096?2048:4096}.webp`));
    };
    Promise.all([
      loadBank(),loader.loadAsync('/textures/sanctuary/layers/cirrus.webp').then(prepare),
    ]).then(textures=>{
      if(!disposed)setMaps(textures);
    }).catch(()=>{
      // The procedural clean plate stays visible if even the fallback cannot load.
      // An empty settled result lets the intro proceed with that complete fallback.
      if(!disposed)setMaps([]);
    });
    // KTX2Loader.dispose terminates workers without settling pending promises.
    // Let in-flight decoding settle and release its worker in finally; prepare
    // disposes any late texture immediately instead of publishing stale state.
    return()=>{disposed=true;owned.forEach(t=>t.dispose());};
  },[compact,gl]);
  return maps;
}
