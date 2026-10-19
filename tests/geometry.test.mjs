import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneAt,previewRect,routeMapSVG,TIMES,END,WORK,PHASE,STROKE} from '../src/geometry.mjs';
import {AIRCRAFT,CASE_WINDOWS,PASSENGER_WINDOWS,getAircraft,pointVisible} from '../src/aircraft.mjs';
import {inPreviewBridge} from '../src/preview.mjs';
const sizes=[[320,568],[360,640],[390,844],[568,320],[640,900],[768,1024],[844,390],[1280,720],[1440,900],[1920,1080]];
const close=(a,b,eps=1e-4)=>assert.ok(Math.abs(a-b)<eps,`${a} differs from ${b}`);
test('fixed aircraft has paired engines, airfoil surfaces and many decorative windows, exactly four case entrances',()=>{
 const a=getAircraft('overview'),b=getAircraft('detail');assert.equal(a.meshes.filter(x=>x.name.startsWith('nacelle-')).length,2);assert.equal(b.meshes.filter(x=>x.name.startsWith('nacelle-')).length,1);
 assert.ok(a.triangles.length>15000);assert.ok(b.triangles.length>a.triangles.length);assert.ok(PASSENGER_WINDOWS.length>50);assert.equal(PASSENGER_WINDOWS.filter(x=>x.caseIndex>=0).length,4);
 assert.equal(AIRCRAFT.length,900);assert.ok(AIRCRAFT.length/(AIRCRAFT.radius*2)>10);
 for(const kind of ['fuselage','wing-1','fin','stabiliser-1','pylon-1'])assert.ok(a.meshes.find(x=>x.name===kind),kind);
});
test('A/B models have identical visible window curves and engine anchors, with no layout re-spacing',()=>{
 const a=getAircraft('overview'),b=getAircraft('detail');assert.deepEqual(a.anchors,b.anchors);
 for(let i=0;i<4;i++)assert.deepEqual(a.curves.find(x=>x.caseIndex===i).points,b.curves.find(x=>x.caseIndex===i).points);
 for(const [w,h]of sizes){const s=sceneAt(PHASE.handoff,w,h);assert.equal(s.model,'detail');assert.equal(sceneAt(PHASE.handoff-.0001,w,h).model,'overview');
  // Nose, fin, opposite engine and trim boundaries are outside the window crop.
  for(const p of [[-380,28,10],[369,180,0],[-110,-66,-122],[-400,0,0],[80,0,0]]){
   const [x,y]=s.project(p);assert.ok(x<0||x>w||y<s.clip.y||y>s.clip.y+s.clip.height,`Different geometry in crop at ${w}x${h}`);
  }
 }
});
test('the route is static in world space and intro/route travel is native scroll distance',()=>{
 for(const [w,h]of sizes){const route=routeMapSVG(w,h);assert.ok((route.match(/C/g)||[]).length>=24);assert.ok(route.includes('stroke-dasharray'));
  for(const u of [0,.3,1.2,2.2]){const s=sceneAt(u,w,h);close(s.worldTranslate[1],-u*s.unit);assert.equal(routeMapSVG(w,h),route);assert.equal(s.planeAlpha,1);}
 }
});
test('aircraft enters from offscreen at full opacity, grows along runway direction and settles in the centre',()=>{
 for(const [w,h]of sizes){const a=sceneAt(PHASE.takeoff,w,h),b=sceneAt(PHASE.turn,w,h);assert.ok(a.center[1]<0);assert.ok(b.center[1]>h*.5&&b.center[1]<h*.65);assert.ok(b.scale>a.scale*20);
  let previous=a;for(let i=1;i<=40;i++){const s=sceneAt(PHASE.takeoff+i/40*(PHASE.turn-PHASE.takeoff),w,h);assert.equal(s.planeAlpha,1);assert.ok(s.center[1]>=previous.center[1]);assert.ok(s.scale>=previous.scale);close(s.center[0],w*.5);previous=s;}
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
test('previews are centred, safe in portrait/landscape and use one final width for every origin',()=>{
 for(const [w,h]of sizes){const windows=sceneAt(WORK,w,h).windows,layout=previewRect(windows[0],w,h);for(const win of windows)assert.deepEqual(previewRect(win,w,h),layout);
 const p=layout;close(p.width/p.height,.76);close(p.x+p.width/2,w/2);assert.ok(p.x>=19.999);assert.ok(p.x+p.width<=w-19.999);assert.ok(p.y>=(h<480?64:90));assert.ok(p.y+p.height<=h-(h<480?17.999:23.999));
 const cornerDistance=Math.hypot(Math.max(0,p.radius-p.paddingX),Math.max(0,p.radius-p.paddingY));assert.ok(cornerDistance<=p.radius);assert.ok(p.paddingX>=26);assert.ok(p.width>250||h<480);
 }
});
test('pointer can travel from any original window to the displaced card without leaving its bridge',()=>{
 for(const [w,h]of sizes)for(const win of sceneAt(WORK,w,h).windows){const p=previewRect(win,w,h),a={left:win.x-win.width/2,right:win.x+win.width/2,top:win.y-win.height/2,bottom:win.y+win.height/2,width:win.width,height:win.height},b={left:p.x,right:p.x+p.width,top:p.y,bottom:p.y+p.height,width:p.width,height:p.height};
 for(let i=0;i<=100;i++){const t=i/100;assert.ok(inPreviewBridge({x:win.x*(1-t)+(p.x+p.width/2)*t,y:win.y*(1-t)+(p.y+p.height/2)*t},a,b));}
 assert.equal(inPreviewBridge({x:-1000,y:-1000},a,b),false);
 }
});
test('reference depth test hides the far cabin and exposes the near cabin',()=>{
 const m=getAircraft('overview');assert.equal(pointVisible(m,CASE_WINDOWS[0].world,[0,0,1]),true);const p=CASE_WINDOWS[0].world;assert.equal(pointVisible(m,[p[0],p[1],-p[2]],[0,0,1]),false);
});
test('reverse, fast scrubbing and stopping do not accumulate camera transforms; S7 ends fully clear',()=>{
 for(const [w,h]of sizes){for(const u of [0,2.6,4.6,WORK,10.4,12.4,14.6,END]){const a=sceneAt(u,w,h);sceneAt(END-u,w,h);const b=sceneAt(u,w,h);assert.deepEqual(a.axes,b.axes);assert.deepEqual(a.windows,b.windows);close(a.scale,b.scale);assert.equal(a.planeAlpha,1);}
 assert.equal(sceneAt(END,w,h).fade,0);assert.ok(sceneAt(END-.3,w,h).fade>0);assert.equal(STROKE,1.5);}
});
