import test from 'node:test';import assert from 'node:assert/strict';
import {ParticleSystem,flowDirection,emissionAllowed} from '../src/particles.mjs';import {sceneAt,WORK,PHASE,END} from '../src/geometry.mjs';
const pose=u=>sceneAt(u,1440,900);
const random=()=>.43;
test('flight flow moves up for nose-down, right for side flight and radially at the inlet',()=>{
 assert.ok(flowDirection(pose(3.2),300,300)[1]<-.9);assert.ok(flowDirection(pose(5.8),300,300)[0]>.9);
 const front=pose(PHASE.approach);assert.ok(flowDirection(front,front.center[0]+100,front.center[1])[0]>.99);assert.ok(flowDirection(front,front.center[0]-100,front.center[1])[0]<-.99);
});
test('entering S4 stops spawning without deleting survivors or retargeting their velocity',()=>{
 const sys=new ParticleSystem(random);for(let i=0;i<100;i++)sys.step(.05,pose(5.2));assert.ok(sys.items.length>0);const p=sys.items.at(-1),vx=p.vx,vy=p.vy,count=sys.totalSpawned;
 sys.step(.05,pose(WORK));assert.equal(sys.totalSpawned,count);assert.ok(sys.items.includes(p));assert.equal(p.vx,vx);assert.equal(p.vy,vy);assert.equal(emissionAllowed(pose(WORK)),false);
 for(let i=0;i<800;i++)sys.step(.05,pose(WORK));assert.equal(sys.items.length,0);assert.equal(sys.totalSpawned,count);
});
test('exiting S4 ramps gently, boundary oscillation has no bursts, and all particles leave after the scene',()=>{
 const sys=new ParticleSystem(random);for(let i=0;i<50;i++){sys.step(.05,pose(WORK));sys.step(.05,pose(PHASE.pan+.1));}assert.equal(sys.totalSpawned,0);
 let previous=sys.totalSpawned;for(let i=0;i<250;i++){sys.step(.05,pose(12));assert.ok(sys.totalSpawned-previous<=1);assert.ok(sys.items.length<=20);previous=sys.totalSpawned;}
 const count=sys.totalSpawned;for(let i=0;i<1000;i++)sys.step(.05,pose(END));assert.equal(sys.items.length,0);assert.equal(sys.totalSpawned,count);
});
test('particle time advances independently of the scroll-controlled camera',()=>{
 const s=pose(4.9),snapshot=JSON.stringify({axes:s.axes,windows:s.windows,scale:s.scale});const sys=new ParticleSystem(random);for(let i=0;i<200;i++)sys.step(.05,s);assert.equal(JSON.stringify({axes:s.axes,windows:s.windows,scale:s.scale}),snapshot);assert.ok(sys.totalSpawned>0);
});
