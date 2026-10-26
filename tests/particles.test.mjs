import {sceneAt} from './site-fixture.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {ParticleSystem,flowDirection,emissionAllowed,PARTICLES,particleSpeed} from '../src/particles.mjs';import {WORK,PHASE,END} from '../src/geometry.mjs';
const pose=u=>sceneAt(u,1440,900);
const random=()=>.43;
test('flight flow moves up for nose-down, right for side flight and inward at the inlet',()=>{
 assert.ok(flowDirection(pose(3.2),300,300)[1]<-.9);assert.ok(flowDirection(pose(5.8),300,300)[0]>.9);
 const front=pose(PHASE.approach);assert.ok(flowDirection(front,front.center[0]+100,front.center[1])[0]<-.99);assert.ok(flowDirection(front,front.center[0]-100,front.center[1])[0]>.99);
});
test('entering S4 stops spawning without deleting survivors or retargeting their velocity',()=>{
 const sys=new ParticleSystem(random);for(let i=0;i<100;i++)sys.step(.05,pose(5.2));assert.ok(sys.items.length>0);const p=sys.items.at(-1),vx=p.vx,vy=p.vy,count=sys.totalSpawned;
 sys.step(.05,pose(WORK));assert.equal(sys.totalSpawned,count);assert.ok(sys.items.includes(p));assert.equal(p.vx,vx);assert.equal(p.vy,vy);assert.equal(emissionAllowed(pose(WORK)),false);
 for(let i=0;i<800;i++)sys.step(.05,pose(WORK));assert.equal(sys.items.length,0);assert.equal(sys.totalSpawned,count);
});
test('exiting S4 ramps gently, boundary oscillation has no bursts, and all particles leave after the scene',()=>{
 const sys=new ParticleSystem(random);for(let i=0;i<50;i++){sys.step(.05,pose(WORK));sys.step(.05,pose(PHASE.pan+.1));}assert.equal(sys.totalSpawned,0);
 let previous=sys.totalSpawned;for(let i=0;i<250;i++){sys.step(.05,pose(PHASE.orbit+.5));assert.ok(sys.totalSpawned-previous<=1);assert.ok(sys.items.length<=PARTICLES.referenceCap*PARTICLES.densityMultiplier);previous=sys.totalSpawned;}
 const count=sys.totalSpawned;for(let i=0;i<1000;i++)sys.step(.05,pose(END));assert.equal(sys.items.length,0);assert.equal(sys.totalSpawned,count);
});
test('particle time advances independently of the scroll-controlled camera',()=>{
 const s=pose(4.9),snapshot=JSON.stringify({axes:s.axes,windows:s.windows,scale:s.scale});const sys=new ParticleSystem(random);for(let i=0;i<200;i++)sys.step(.05,s);assert.equal(JSON.stringify({axes:s.axes,windows:s.windows,scale:s.scale}),snapshot);assert.ok(sys.totalSpawned>0);
});

test('particle speed has a nonzero floor, a bounded scroll response and no sign-based reversal',()=>{
 for(const [w,h]of [[1440,900],[390,844]]){const s=sceneAt(PHASE.approach,w,h);assert.ok(particleSpeed(s,0)>0);assert.ok(particleSpeed(s,2000)>particleSpeed(s,0));assert.equal(particleSpeed(s,-2000),particleSpeed(s,2000));assert.equal(particleSpeed(s,1e9),s.mobile?PARTICLES.maxMobileSpeed:PARTICLES.maxSpeed);}
});
test('immutable 2× density is not compounded by scene reinitialization and remains visible at matched or faster speeds',()=>{
 assert.ok(Object.isFrozen(PARTICLES));assert.equal(PARTICLES.densityMultiplier,2);assert.ok(PARTICLES.opacity>.28);
 for(const [w,h]of [[1440,900],[390,844]]){
  const s=sceneAt(PHASE.turn,w,h),oldConfig={...PARTICLES,densityMultiplier:1,baseSpeed:200,maxSpeed:200,baseMobileSpeed:145,maxMobileSpeed:145};
  const average=(config,scrollSpeed)=>{const sys=new ParticleSystem(random,config);let sum=0,n=0;for(let i=0;i<650;i++){sys.step(.1,s,scrollSpeed);if(i>200){sum+=sys.items.filter(p=>p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h).length;n++;}}return sum/n;};
  const baseline=average(oldConfig,0);for(const speed of [0,1200,4800]){const actual=average(PARTICLES,speed),ratio=actual/baseline;assert.ok(ratio>1.82&&ratio<2.18,`${w}x${h}, speed ${speed}, density ratio ${ratio}`);}
  assert.equal(new ParticleSystem().config.densityMultiplier,2);
 }
});
test('particles approach the projected moving engine axis from the viewport perimeter',()=>{
 const sys=new ParticleSystem(random),s=pose(PHASE.approach);for(let i=0;i<120;i++)sys.step(.05,s,800);assert.ok(sys.items.length>0);
 for(const p of sys.items){const dx=s.vanishingPoint[0]-p.x,dy=s.vanishingPoint[1]-p.y;assert.ok(dx*p.dx+dy*p.dy>0);}
 const changed=sceneAt(PHASE.orbit+1.4,1440,900);sys.step(.05,changed,800);for(const p of sys.items)assert.deepEqual(p.goal,changed.vanishingPoint);
 const snapshot=sys.items.map(p=>[p.dx,p.dy]);sys.step(.05,pose(WORK),0);for(let i=0;i<sys.items.length;i++){assert.deepEqual([sys.items[i].dx,sys.items[i].dy],snapshot[i]);assert.equal(sys.items[i].seeking,false);}
});
test('particle integration at 30 and 120 FPS advances the same trajectories after scrolling stops',()=>{
 const s=pose(5.2),make=hz=>{const sys=new ParticleSystem(random);for(let i=0;i<hz*4;i++)sys.step(1/hz,s,800);const first=sys.items.at(-1);const p={...first,goal:[...first.goal]};sys.items=[p];for(let i=0;i<hz*2;i++)sys.step(1/hz,pose(WORK),0);return p;};
 const a=make(30),b=make(120);assert.ok(Math.abs(a.x-b.x)<2);assert.ok(Math.abs(a.y-b.y)<2);assert.ok(a.age>2&&b.age>2);
});
