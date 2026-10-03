"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

export function useCloudArtwork() {
  const {gl,size}=useThree();
  const compact=size.width<700;
  const [maps,setMaps]=useState<THREE.Texture[]|null>(null);
  useEffect(()=>{
    let disposed=false;
    const owned=new Set<THREE.Texture>();
    let decoder:KTX2Loader|null=null;
    const prepare=(texture:THREE.Texture)=>{
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.anisotropy=1;
      texture.needsUpdate=true;
      if(disposed)texture.dispose();else owned.add(texture);
      return texture;
    };
    const loader=new THREE.TextureLoader();
    // Begin with a complete low-cost scene; refine after the compressed asset arrives.
    Promise.all([
      loader.loadAsync(`/textures/sanctuary/layers/cumulus-${compact||gl.capabilities.maxTextureSize<4096?2048:4096}.webp`).then(prepare),
      loader.loadAsync('/textures/sanctuary/layers/cirrus.webp').then(prepare),
    ]).then(async textures=>{
      if(disposed)return;
      setMaps(textures);
      const compressed=gl.extensions.has('WEBGL_compressed_texture_astc')||gl.extensions.has('EXT_texture_compression_bptc')||gl.extensions.has('WEBGL_compressed_texture_s3tc')||gl.extensions.has('WEBGL_compressed_texture_etc');
      if(!compressed||gl.capabilities.maxTextureSize<4096)return;
      const width=compact||gl.capabilities.maxTextureSize<8192?4096:8192;
      decoder=new KTX2Loader().setTranscoderPath('/basis/').setWorkerLimit(1).detectSupport(gl);
      try{
        const enhanced=prepare(await decoder.loadAsync(`/textures/sanctuary/layers/cumulus-${width}.ktx2`));
        if(disposed){enhanced.dispose();return;}
        // KTX pixel rows are exported flipped to match TextureLoader's convention.
        setMaps([enhanced,textures[1]]);
      }catch{
        // Keep the already decoded WebP when compression/transcoding is unavailable.
      }
    }).catch(()=>{
      // The procedural clean plate stays visible if even the fallback cannot load.
    });
    return()=>{disposed=true;decoder?.dispose();owned.forEach(t=>t.dispose());};
  },[compact,gl]);
  return maps;
}
