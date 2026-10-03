"use client";

import { LayeredSky } from "./LayeredSky";

/** A fixed sky with independent cloud advection, shared by every orbit angle. */
export function OrbitSky({active=true}:{active?:boolean}) {
  return <LayeredSky paused={!active}/>;
}
