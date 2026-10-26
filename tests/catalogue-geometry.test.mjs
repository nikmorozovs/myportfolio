import {sceneAt} from './site-fixture.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {PHASE,S4_TIMING,runwayLayout,TAKEOFF,takeoffPose,routeMapSVG,WORK,END} from '../src/geometry.mjs';
import {AIRCRAFT,getAircraft,aircraftSVG,cabinPatternVisible} from '../src/aircraft.mjs';import {workProgress} from '../src/layout.mjs';
const sizes=[[320,568],[360,640],[390,844],[568,320],[768,1024],[844,390],[1280,720],[1440,900],[1920,1080]],close=(a,b,e=1e-4)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('the miniature is already visible and stationary on the runway before the roll starts',()=>{
 for(const [w,h]of sizes){const r=runwayLayout(w,h),a=sceneAt(1.65,w,h),b=sceneAt(PHASE.takeoff,w,h);close(a.departure.worldY,b.departure.worldY);close(a.scale,b.scale);close(a.center[0],r.cx);close(a.center[1]+a.travel,r.start+r.length*TAKEOFF.parkFraction);assert.ok(a.center[1]>h*.1&&a.center[1]<h-12);assert.equal(a.planeAlpha,1);const firstQuarter=[r.start-b.travel,r.start+r.length*.25-b.travel];assert.ok(firstQuarter.every(y=>y>0&&y<h));}
});
test('ground roll accelerates in runway coordinates and liftoff occurs while its last quarter remains visible',()=>{
 for(const [w,h]of sizes){let previousDelta=0,previous=takeoffPose(PHASE.takeoff,w,h).worldY;for(let i=1;i<=40;i++){const p=takeoffPose(PHASE.takeoff+(PHASE.liftoff-PHASE.takeoff)*i/40,w,h),delta=p.worldY-previous;assert.ok(delta>previousDelta);previousDelta=delta;previous=p.worldY;}
 const s=sceneAt(PHASE.liftoff,w,h),r=runwayLayout(w,h);assert.ok(s.departure.worldY>=r.start+.75*r.length);assert.ok(s.departure.worldY<r.end);assert.ok(r.end-s.travel<h&&r.end-s.travel>0);
 const e=1e-5,a=takeoffPose(PHASE.liftoff-e,w,h),b=takeoffPose(PHASE.liftoff,w,h),c=takeoffPose(PHASE.liftoff+e,w,h);close((b.center[1]-a.center[1])/e,(c.center[1]-b.center[1])/e,.2);
 }
});
test('accelerating departure and enlargement keep the complete aircraft in the viewport and reverse deterministically',()=>{
 const vertices=getAircraft().meshes.flatMap(m=>m.vertices);
 for(const [w,h]of sizes){let scale=0;for(let i=0;i<=100;i++){const u=PHASE.takeoff+(PHASE.turn-PHASE.takeoff)*i/100,s=sceneAt(u,w,h);assert.ok(s.scale>=scale);scale=s.scale;assert.equal(s.planeAlpha,1);const ps=vertices.map(s.project),xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]);assert.ok(Math.min(...xs)>5&&Math.max(...xs)<w-5);assert.ok(Math.min(...ys)>50&&Math.max(...ys)<h-8,`${w}x${h} at ${u}`);sceneAt(END-u,w,h);assert.deepEqual(sceneAt(u,w,h).departure,s.departure);}
 const end=sceneAt(PHASE.turn,w,h);close(end.center[1],h*.57);
 }
});
test('route joins have continuous forward tangents and preserve the wide/narrow title pocket',()=>{
 const cubic=(a,b,c,d,t)=>[0,1].map(k=>(1-t)**3*a[k]+3*(1-t)**2*t*b[k]+3*(1-t)*t*t*c[k]+t**3*d[k]);
 for(const [w,h]of sizes){const s=sceneAt(0,w,h),l=s.intro,left=(w-l.readyWidth)/2,right=left+l.readyWidth,top=l.readyY,bottom=l.readyBottom;
 const paths=[...routeMapSVG(w,h).matchAll(/<path opacity="[^"]+" d="([^"]+)"/g)];assert.equal(paths.length,8);
 for(const [,path]of paths){const commands=path.match(/[MC][^MC]+/g);let point,incoming;for(const command of commands){const values=command.slice(1).match(/-?\d+(?:\.\d+)?/g).map(Number);if(command[0]==='M'){point=values;continue;}const [a,b,c]=[values.slice(0,2),values.slice(2,4),values.slice(4,6)];if(incoming){const outgoing=a.map((v,k)=>v-point[k]),cosine=incoming.reduce((sum,v,k)=>sum+v*outgoing[k],0)/(Math.hypot(...incoming)*Math.hypot(...outgoing));assert.ok(cosine>1-1e-6,'Adjacent cubic tangents must continue in the same direction');}incoming=c.map((v,k)=>v-b[k]);for(let i=0;i<=100;i++){const p=cubic(point,a,b,c,i/100);assert.ok(!(p[0]>=left&&p[0]<=right&&p[1]>=top&&p[1]<=bottom),'Route must not cross the heading pocket');}point=c;}}
 }
});
test('the entire S4 range is 90 percent, with an unchanged entry zoom and a stable interior Work target',()=>{
 close((PHASE.pan-PHASE.zoom)/(S4_TIMING.previousEnd-S4_TIMING.start),.9);close(PHASE.hold-PHASE.zoom,2.15);close(PHASE.orbit-PHASE.pan,2.5);close(PHASE.approach-PHASE.orbit,2);close(PHASE.pan,9.585);close(END,16.235);
 for(const [w,h]of sizes){const u=workProgress({height:h,headerHeight:h<480?56:w<640?80:100});assert.ok(u>PHASE.hold+.25&&u<PHASE.pan-.75);assert.equal(sceneAt(u,w,h).caseReady,true);assert.deepEqual(sceneAt(WORK,w,h).windows,sceneAt(PHASE.hold,w,h).windows);}
});
test('carousel residuals affect cabin presentation only and can be normalized outside the visible cabin crop',()=>{
 for(const [w,h]of sizes){const s=sceneAt(PHASE.pan+.01,w,h),snapshot=JSON.stringify({axes:s.axes,scale:s.scale,center:s.center,target:s.target,engine:s.engine});assert.equal(cabinPatternVisible(s),true);const a=aircraftSVG(s,{windowPhase:0}),b=aircraftSVG(s,{windowPhase:.37});assert.notEqual(a,b);assert.equal(JSON.stringify({axes:s.axes,scale:s.scale,center:s.center,target:s.target,engine:s.engine}),snapshot);assert.equal(cabinPatternVisible(sceneAt(PHASE.approach,w,h)),false);assert.equal(cabinPatternVisible(sceneAt(0,w,h)),false);}
});
test('carried fractional cabin windows never overlap fixed doors when reverse scroll widens the view',()=>{
 const s=sceneAt(PHASE.zoom,1440,900);
 for(const phase of [.01,.25,.5,.75,.99]){const svg=aircraftSVG(s,{windowPhase:phase}),windows=[...svg.matchAll(/data-cabin-window="([^"]+)" d="([^"]*)"/g)];assert.ok(windows.filter(x=>x[2]).length>25);for(const [,x]of windows)for(const door of [-326,-184,151,283])assert.ok(Math.abs(Number(x)-door)>=8.99);}
});
