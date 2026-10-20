import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneAt,previewRect,routeMapSVG,TIMES,END,WORK,PHASE,STROKE} from '../src/geometry.mjs';
import {AIRCRAFT,CASE_WINDOWS,PASSENGER_WINDOWS,getAircraft,pointVisible} from '../src/aircraft.mjs';
const sizes=[[320,568],[360,640],[390,844],[568,320],[640,900],[768,1024],[844,390],[1280,720],[1440,900],[1920,1080]];
const close=(a,b,eps=1e-4)=>assert.ok(Math.abs(a-b)<eps,`${a} differs from ${b}`);
test('fixed aircraft has paired engines, airfoil surfaces and many decorative windows, exactly four case entrances',()=>{
 const a=getAircraft('overview'),b=getAircraft('detail');assert.equal(a.meshes.filter(x=>x.name.startsWith('nacelle-')).length,2);assert.equal(b.meshes.filter(x=>x.name.startsWith('nacelle-')).length,1);
 assert.ok(a.triangles.length>15000);assert.ok(b.triangles.length>a.triangles.length);assert.ok(PASSENGER_WINDOWS.length>50);assert.equal(PASSENGER_WINDOWS.filter(x=>x.caseIndex>=0).length,4);
 assert.equal(AIRCRAFT.length,900);assert.ok(AIRCRAFT.length/(AIRCRAFT.radius*2)>10);
 for(const kind of ['fuselage','wing-1','fin','stabiliser-1','pylon-1'])assert.ok(a.meshes.find(x=>x.name===kind),kind);
});
test('engine proportions are compact and each pylon penetrates both the wing and nacelle surfaces',()=>{
 const model=getAircraft('overview');
 const part=name=>{const i=model.meshes.findIndex(m=>m.name===name),start=model.meshes.slice(0,i).reduce((n,m)=>n+m.faces.length,0);return{triangles:model.triangles.slice(start,start+model.meshes[i].faces.length),bvh:null};};
 for(const sign of [-1,1]){
  const wing=part(`wing-${sign}`),nacelle=part(`nacelle-${sign}`),pylon=model.meshes.find(m=>m.name===`pylon-${sign}`),housing=model.meshes.find(m=>m.name===`nacelle-${sign}`);
  const length=Math.max(...housing.vertices.map(p=>p[0]))-Math.min(...housing.vertices.map(p=>p[0]));assert.ok(length/(AIRCRAFT.engineRadius*2)>1.6&&length/(AIRCRAFT.engineRadius*2)<2.1);
  for(const p of pylon.vertices){const target=p[1]>-20?wing:nacelle;assert.equal(pointVisible(target,p,[0,1,0]),false);assert.equal(pointVisible(target,p,[0,-1,0]),false);}
 }
});
test('A/B models have identical visible window curves and engine anchors, with no layout re-spacing',()=>{
 const a=getAircraft('overview'),b=getAircraft('detail');assert.deepEqual(a.anchors,b.anchors);
 for(let i=0;i<4;i++)assert.deepEqual(a.curves.find(x=>x.caseIndex===i).points,b.curves.find(x=>x.caseIndex===i).points);
 for(const [w,h]of sizes){const s=sceneAt(PHASE.handoff,w,h);assert.equal(s.model,'detail');assert.equal(sceneAt(PHASE.handoff-.0001,w,h).model,'overview');
  // Nose, fin, opposite engine and trim boundaries are outside the window crop.
  for(const p of [[-380,28,10],[369,180,0],[AIRCRAFT.engineX,AIRCRAFT.engineY,-AIRCRAFT.engineZ],[-400,0,0],[80,0,0]]){
   const [x,y]=s.project(p);assert.ok(x<0||x>w||y<s.clip.y||y>s.clip.y+s.clip.height,`Different geometry in crop at ${w}x${h}`);
  }
 }
});
test('the route is static in world space and intro/route travel is native scroll distance',()=>{
 for(const [w,h]of sizes){const route=routeMapSVG(w,h);assert.ok((route.match(/C/g)||[]).length>=24);assert.ok(route.includes('stroke-dasharray'));
  for(const u of [0,.3,1.2,2.2]){const s=sceneAt(u,w,h);close(s.worldTranslate[1],-u*s.unit);assert.equal(routeMapSVG(w,h),route);assert.equal(s.planeAlpha,1);}
 }
});
test('top nose points down, side nose points left, orbit is 90 degrees with camera descent',()=>{
 for(const [w,h]of sizes){const top=sceneAt(PHASE.turn,w,h),a=top.project([-450,0,0]),b=top.project([450,0,0]);close(a[0],b[0]);assert.ok(a[1]>b[1]);
 const side=sceneAt(PHASE.zoom,w,h),c=side.project([-450,0,0]),d=side.project([450,0,0]);assert.ok(c[0]<d[0]);close(c[1],d[1]);
 const orbit=sceneAt(PHASE.orbit,w,h),front=sceneAt(PHASE.approach,w,h);close(front.yaw,Math.PI/2);assert.ok(orbit.axes[2][1]>front.axes[2][1]);close(front.axes[2][0],-1);
 const p=front.project(front.intake),y=front.project([front.intake[0],front.intake[1]+18.7,front.intake[2]]),z=front.project([front.intake[0],front.intake[1],front.intake[2]+18.7]);close(Math.hypot(y[0]-p[0],y[1]-p[1]),Math.hypot(z[0]-p[0],z[1]-p[1]));}
});
test('camera and projected construction remain continuous at all phase boundaries',()=>{
 for(const [w,h]of sizes)for(const u of TIMES.slice(1,-1)){const a=sceneAt(u-1e-7,w,h),b=sceneAt(u+1e-7,w,h);
  for(const p of [[-450,0,0],[0,38,0],[-110,-66,122],[390,180,0]]){const pa=a.project(p),pb=b.project(p);close(pa[0],pb[0],.02);close(pa[1],pb[1],.02);}close(a.scale,b.scale,.001);
 }
});
test('four windows fit and remain still throughout S4; touch centres remain separated',()=>{
 for(const [w,h]of sizes){const a=sceneAt(PHASE.hold,w,h),b=sceneAt(PHASE.pan-.0001,w,h);
 for(let i=0;i<4;i++){const x=a.windows[i],y=b.windows[i];close(x.width/x.height,.76);assert.ok(x.x-x.width/2>=20);assert.ok(x.x+x.width/2<=w-20);close(x.x,y.x);close(x.y,y.y);close(x.width,y.width);if(i)assert.ok(x.x-a.windows[i-1].x>44);}
 }
});
test('the engine pan frames both ends of the physical connection before closing on the nacelle',()=>{
 for(const [w,h]of sizes){const s=sceneAt(PHASE.pan+(PHASE.orbit-PHASE.pan)*.45,w,h);
  for(const point of [CASE_WINDOWS[1].world,s.engine]){const [x,y]=s.project(point);assert.ok(x>0&&x<w);assert.ok(y>s.clip.y&&y<s.clip.y+s.clip.height);}
  assert.ok(AIRCRAFT.length*s.scale>w*1.3,'The full aircraft must not return during the close-up transition');
 }
});
test('previews are centred, safe in portrait/landscape and use one final width for every origin',()=>{
 for(const [w,h]of sizes){const windows=sceneAt(WORK,w,h).windows,layout=previewRect(windows[0],w,h);for(const win of windows)assert.deepEqual(previewRect(win,w,h),layout);
 const p=layout;close(p.width/p.height,.76);close(p.x+p.width/2,w/2);assert.ok(p.x>=19.999);assert.ok(p.x+p.width<=w-19.999);assert.ok(p.y>=(h<480?64:90));assert.ok(p.y+p.height<=h-(h<480?17.999:23.999));
 const cornerDistance=Math.hypot(Math.max(0,p.radius-p.paddingX),Math.max(0,p.radius-p.paddingY));assert.ok(cornerDistance<=p.radius);assert.ok(p.paddingX>=26);assert.ok(p.width>250||h<480);
 }
});
test('reference depth test hides the far cabin and exposes the near cabin',()=>{
 const m=getAircraft('overview');assert.equal(pointVisible(m,CASE_WINDOWS[0].world,[0,0,1]),true);const p=CASE_WINDOWS[0].world;assert.equal(pointVisible(m,[p[0],p[1],-p[2]],[0,0,1]),false);
});
test('reverse, fast scrubbing and stopping do not accumulate camera transforms; S7 ends fully clear',()=>{
 for(const [w,h]of sizes){for(const u of [0,2.6,4.6,WORK,10.4,12.4,14.6,END]){const a=sceneAt(u,w,h);sceneAt(END-u,w,h);const b=sceneAt(u,w,h);assert.deepEqual(a.axes,b.axes);assert.deepEqual(a.windows,b.windows);close(a.scale,b.scale);assert.equal(a.planeAlpha,1);}
 assert.equal(sceneAt(END,w,h).fade,0);assert.ok(sceneAt(END-.3,w,h).fade>0);assert.equal(STROKE,1.5);}
});
