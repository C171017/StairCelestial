import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {cloudPosition,cloudVisibility,cloudRenderOrder,CLOUD_FIELD_SIZE,CLOUD_WIND} from './cloudMotion';

test('clouds travel in a shared world wind independently of camera position',()=>{
  const before=cloudPosition(5,-300,10),after=cloudPosition(5,-300,15);
  assert.ok(Math.abs(after.x-before.x-CLOUD_WIND.x*5)<1e-9);
  assert.ok(Math.abs(after.z-before.z-CLOUD_WIND.z*5)<1e-9);
  const upper=cloudPosition(5,-300,15,0.7),upperBefore=cloudPosition(5,-300,10,0.7);
  assert.ok(Math.abs(upper.x-upperBefore.x-(after.x-before.x)*0.7)<1e-9);
});

test('every world recycling boundary is fully invisible from every orbit azimuth',()=>{
  for(let z=-CLOUD_FIELD_SIZE/2;z<=CLOUD_FIELD_SIZE/2;z+=10){
    for(const x of [-CLOUD_FIELD_SIZE/2,CLOUD_FIELD_SIZE/2])assert.equal(cloudVisibility(Math.hypot(x,z)),0);
  }
  const wrapAt=(CLOUD_FIELD_SIZE/2-10)/CLOUD_WIND.x;
  for(const offset of [-0.001,0,0.001]){
    const p=cloudPosition(10,0,wrapAt+offset);
    assert.equal(cloudVisibility(Math.hypot(p.x,p.z)),0);
  }
});

test('long sessions retain finite positions with no unbounded scene geometry',()=>{
  for(const t of [0,600,3600,86400,1e9]){
    const p=cloudPosition(10,-300,t);
    assert.ok(p.x>=-840&&p.x<840&&p.z>=-840&&p.z<840);
  }
});

// Actual lower-left patches that exchanged radial distance at 21.091 seconds.
const overlappingBanks = [
  {x:-295.0408815099945,y:-122.10767145830687,z:-323.2458055842653},
  {x:-155.1849014669824,y:-174.36151514444646,z:-366.4193715007241},
];
const movingBanks = (seconds:number) => overlappingBanks.map(bank=>{
  const position=cloudPosition(bank.x,bank.z,seconds);
  return new THREE.Vector3(position.x,bank.y,position.z);
});

test('sideways wind cannot flip overlapping banks in a stationary view',()=>{
  const camera=new THREE.PerspectiveCamera(42,1382/1426,0.1,3000);
  camera.position.set(0,2.8,24);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const radialDifference=(seconds:number)=>{
    const [a,b]=movingBanks(seconds);
    return a.distanceTo(camera.position)-b.distanceTo(camera.position);
  };
  // Verify this fixture straddles the original visible failure, not an arbitrary time.
  assert.ok(radialDifference(21.08)*radialDifference(21.10)<0);
  for(let frame=0;frame<=30*60;frame++){
    const [a,b]=movingBanks(frame/60);
    assert.ok(cloudRenderOrder(b,camera.matrixWorldInverse.elements)<cloudRenderOrder(a,camera.matrixWorldInverse.elements));
  }
});

test('cloud depth follows the orbit view and shared wind preserves relative order',()=>{
  const camera=new THREE.PerspectiveCamera();
  for(let azimuth=0;azimuth<Math.PI*2;azimuth+=Math.PI/8){
    camera.position.set(Math.sin(azimuth)*24,2.8,Math.cos(azimuth)*24);
    camera.lookAt(0,0,0);camera.updateMatrixWorld();
    const inverse=camera.matrixWorldInverse.elements;
    const direction=camera.getWorldDirection(new THREE.Vector3());
    const near=camera.position.clone().addScaledVector(direction,100);
    const far=camera.position.clone().addScaledVector(direction,800);
    assert.ok(cloudRenderOrder(far,inverse)<cloudRenderOrder(near,inverse));
    assert.ok(cloudRenderOrder(far,inverse)>-90,'meteors must remain behind clouds');
    const difference=(time:number)=>{const [a,b]=movingBanks(time);return cloudRenderOrder(a,inverse)-cloudRenderOrder(b,inverse);};
    for(const time of [5,10,15,21.08,21.10,30])assert.ok(Math.abs(difference(time)-difference(0))<1e-10);
  }
});
