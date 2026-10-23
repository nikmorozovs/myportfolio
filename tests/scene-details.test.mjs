import test from 'node:test';import assert from 'node:assert/strict';
import {sceneAt,sceneSVG,routeMapSVG,runwayLayout,RUNWAY,PHASE,END,STROKE,scrollUnit} from '../src/geometry.mjs';
import {AIRCRAFT,getAircraft,aircraftOcclusion,pointVisible,rotateFanPoint} from '../src/aircraft.mjs';
const sizes=[[320,568],[390,844],[568,320],[844,390],[1440,900],[1920,1080]];
const close=(a,b,e=1e-5)=>assert.ok(Math.abs(a-b)<e,`${a} ≠ ${b}`);
const inside=(point,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [x,y]=poly[i],[xx,yy]=poly[j];if(((y>point[1])!==(yy>point[1]))&&point[0]<(xx-x)*(point[1]-y)/(yy-y)+x)yes=!yes;}return yes;};
function part(name){const m=getAircraft(),i=m.meshes.findIndex(x=>x.name===name),offset=m.meshes.slice(0,i).reduce((n,x)=>n+x.faces.length,0);return{triangles:m.triangles.slice(offset,offset+m.meshes[i].faces.length),bvh:null};}
test('runway is exactly half the former body size and shares marking/clip longitudinal bounds',()=>{
 for(const [w,h]of sizes){const r=runwayLayout(w,h),svg=routeMapSVG(w,h),unit=scrollUnit(w,h);close(r.width,16*.5);close(r.length,1.35*unit*.5);close(r.end-r.start,r.length);assert.ok(r.blendStart>r.thinStart);assert.ok((r.start-r.blendStart)/unit<=.15);close(r.cx,sceneAt(3.2,w,h).center[0]);assert.ok(svg.includes('fill="#AB7753"'));assert.ok(svg.includes('stroke="#F6F5F0"'));assert.ok(svg.includes('clip-path="url(#runway-body-clip)"'));assert.equal(STROKE,1.5);}
});
test('thin route and filled runway expansion have vertical matching endpoint tangents',()=>{
 const r=runwayLayout(1440,900),d=r.start-r.blendStart;
 const leftStart=[r.cx-.75,r.blendStart],c1=[r.cx-.75,r.blendStart+d*.35],c2=[r.cx-r.width/2,r.start-d*.35],leftEnd=[r.cx-r.width/2,r.start];
 close(c1[0]-leftStart[0],0);close(leftEnd[0]-c2[0],0);assert.ok(c1[1]>leftStart[1]);assert.ok(leftEnd[1]>c2[1]);
 const centre=routeMapSVG(1440,900).match(/<path d="M([-\d.]+),([-\d.]+)V([-\d.]+)"\/>/);
 assert.ok(centre,'shared centre stroke exists');close(Number(centre[1]),r.cx);close(Number(centre[2]),r.thinStart);
 assert.ok(Number(centre[3])>r.blendStart&&Number(centre[3])<=r.blendStart+3.01,'route slightly overlaps copper fill to avoid a seam');
});
test('far engine masks agree with wing ray occlusion over intermediate angles and retain visible portions',()=>{
 const wing=part('wing--1'),engine=part('nacelle--1'),mesh=getAircraft().meshes.find(m=>m.name==='nacelle--1');let hidden=0,visible=0;
 for(let k=0;k<=16;k++){const u=PHASE.turn+(PHASE.zoom-PHASE.turn)*k/16,s=sceneAt(u,1440,900),d=s.axes[2],masks=aircraftOcclusion(s).filter(m=>m.part==='wing--1');
  const svg=sceneSVG(s);assert.ok(svg.includes('data-aircraft-part="engine--1" mask="url(#far-engine-mask)"'));assert.ok(svg.includes('mask-type:luminance'));
  for(let i=0;i<mesh.vertices.length;i+=17){const p=mesh.vertices[i];if(!pointVisible(engine,p,d))continue;const covered=!pointVisible(wing,p,d),projected=masks.some(m=>inside(s.project(p),m.points));if(covered){hidden++;assert.ok(projected);}else if(!projected)visible++;}
 }
 assert.ok(hidden>100);assert.ok(visible>50);
});
test('one aircraft group contains the opaque particle blocker and matching masks through the fade',()=>{
 const s=sceneAt(PHASE.fade+.3,1440,900),svg=sceneSVG(s);assert.ok(svg.startsWith('<g class="aircraft-motion">'));assert.ok(svg.indexOf('class="particle-occlusion"')<svg.indexOf('class="aircraft-drawing" opacity='));assert.ok(aircraftOcclusion(s).some(m=>m.part==='engine-1'));assert.ok(svg.includes('clip-path="url(#inlet-engine-1)"'));assert.ok(svg.includes('class="fan-rotor"'));assert.equal(sceneSVG(sceneAt(END,1440,900)),'');
});
test('fan rotates clockwise from the front and remains scroll-controlled through the last visible fade',()=>{
 const s=sceneAt(PHASE.approach,1440,900),point=[AIRCRAFT.engineX-26,AIRCRAFT.engineY+12,AIRCRAFT.engineZ],a=s.project(point),b=s.project(rotateFanPoint(point,.1));assert.ok(b[0]>a[0]);
 let angle=0;for(let i=0;i<=200;i++){const u=PHASE.approach+(END-PHASE.approach)*i/200,p=sceneAt(u,1440,900);assert.ok(p.fanAngle>=angle);angle=p.fanAngle;assert.equal(sceneAt(u,1440,900).fanAngle,p.fanAngle);}
 close(angle,3*Math.PI);const before=sceneAt(END-.001,1440,900),earlier=sceneAt(END-.1,1440,900);assert.ok(before.fade>0);assert.ok(before.fanAngle>earlier.fanAngle);close(sceneAt(PHASE.approach-.001,1440,900).fanAngle,0);
});
