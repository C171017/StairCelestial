import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudPosition,cloudVisibility,CLOUD_FIELD_SIZE,CLOUD_WIND} from './cloudMotion';

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
