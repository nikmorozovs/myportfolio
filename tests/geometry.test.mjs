import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneAt,previewRect,sceneSVG,standaloneSVG,TIMES,END,WORK,STROKE} from '../src/geometry.mjs';
const sizes=[[320,568],[360,640],[390,844],[568,320],[640,900],[768,1024],[844,390],[1280,720],[1440,900],[1920,1080]];
const close=(a,b,eps=1e-4)=>assert.ok(Math.abs(a-b)<eps,`${a} differs from ${b}`);

test('S2 points down; S3 side view points left; S6 reaches a 90 degree front view',()=>{
 for(const [w,h] of sizes){
  const top=sceneAt(1.74,w,h),nose=top.project([-380,0,0]),tail=top.project([350,0,0]);
  close(nose[0],tail[0]);assert.ok(nose[1]>tail[1]);
  const side=sceneAt(3.35,w,h),n=side.project([-380,0,0]),t=side.project([350,0,0]);
  assert.ok(n[0]<t[0]);close(n[1],t[1]);
  const front=sceneAt(9.55,w,h);close(front.yaw,Math.PI/2);close(front.axes[2][0],-1);
  const [x,y,z]=front.engine,p=front.project([x-78,y,z]),a=front.project([x-78,y+36,z]),b=front.project([x-78,y,z+36]);
  close(Math.hypot(a[0]-p[0],a[1]-p[1]),Math.hypot(b[0]-p[0],b[1]-p[1]));
 }
});

test('camera, projected points and zoom are continuous at every phase boundary',()=>{
 for(const [w,h] of sizes)for(const u of TIMES.slice(1,-1)){
  const a=sceneAt(u-1e-7,w,h),b=sceneAt(u+1e-7,w,h);
  for(const p of [[-380,0,0],[0,44,60],[350,100,0],[-92,-250,76]]){
   const pa=a.project(p),pb=b.project(p);close(pa[0],pb[0],.01);close(pa[1],pb[1],.01);
  }
  close(a.scale,b.scale,.0001);
 }
});

test('all four portrait windows fit the viewport and remain still throughout the reading interval',()=>{
 for(const [w,h] of sizes){
  const start=sceneAt(5.15,w,h),end=sceneAt(6.149,w,h);
  for(let i=0;i<4;i++){
   const a=start.windows[i],b=end.windows[i];close(a.width/a.height,.76);
   assert.ok(a.x-a.width/2>=19);assert.ok(a.x+a.width/2<=w-19);
   assert.ok(a.y-a.height/2>85);assert.ok(a.y+a.height/2<h-80);
   close(a.x,b.x);close(a.y,b.y);close(a.width,b.width);
  }
 }
});

test('preview geometry preserves aspect and corner curvature and cannot leave the safe viewport',()=>{
 for(const [w,h] of sizes)for(const win of sceneAt(WORK,w,h).windows){
  const p=previewRect(win,w,h);close(p.width/p.height,.76);close(p.radius/p.width,win.radius/win.width);
  assert.ok(p.x>=20);assert.ok(p.x+p.width<=w-19.999);
  assert.ok(p.y>=(h<480?64:88));assert.ok(p.y+p.height<=h-(h<480?17.999:29.999));
 }
});

test('reverse and arbitrary fast scrubbing produce the same states without accumulated transforms',()=>{
 for(const [w,h] of sizes){
  const positions=[0,.5,1.74,2.4,3.35,WORK,6.8,8.4,9.55,10.95,END];
  const reference=new Map(positions.map(u=>[u,sceneSVG(sceneAt(u,w,h))]));
  for(const u of positions.toReversed().concat([8.4,0,END,WORK,2.4]))assert.equal(sceneSVG(sceneAt(u,w,h)),reference.get(u));
 }
});

test('engine disappears completely and zoom remains finite after the scene',()=>{
 for(const [w,h] of sizes){
  const end=sceneAt(END,w,h);close(end.fade,0);assert.ok(Number.isFinite(end.scale));
  assert.deepEqual(sceneAt(END+20,w,h).windows,end.windows);
  assert.ok(sceneAt(END-.3,w,h).fade>0);
 }
});

test('all aviation contours use screen-space coordinates and one non-scaling stroke width',()=>{
 assert.equal(STROKE,1.5);
 for(const [w,h] of sizes)for(const u of [0,1.5,2.5,WORK,8,9.55,11.2]){
  const svg=standaloneSVG(sceneAt(u,w,h));
  assert.ok(!svg.includes('NaN'));assert.ok(!svg.includes('Infinity'));
  assert.ok(!/transform=["'].*scale\(/.test(svg));
  assert.ok(svg.includes('vector-effect:non-scaling-stroke'));
  assert.ok(svg.includes('stroke-width:1.5'));
 }
});
