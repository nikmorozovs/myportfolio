import test from 'node:test';import assert from 'node:assert/strict';
import {caseWindowLayout,getAircraft,AIRCRAFT,aircraftSVG} from '../src/aircraft.mjs';
import {sceneAt,PHASE,TIMES} from '../src/geometry.mjs';
import {carouselFrame,carouselLayout,modulo} from '../src/carousel.mjs';
const counts=[0,1,2,3,4,5,6,8,10],sizes=[[320,568],[390,844],[768,1024],[1440,900],[1920,1080],[844,390]];
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
for(const count of counts)test(`shared aircraft/camera/carousel geometry handles ${count} published cases`,()=>{
 const ids=Array.from({length:count},(_,i)=>`project-${i}`),projects=ids.map(id=>({id}));
 for(const [width,height] of sizes){const layout=caseWindowLayout(ids,width,height);assert.equal(layout,caseWindowLayout(ids,width,height),'layout cache reused');assert.equal(layout.windows.length,count);assert.equal(new Set(layout.windows.map(w=>w.id)).size,count);for(let i=0;i<count;i++){near((layout.windows[i].x+layout.windows[count-i-1].x)/2,AIRCRAFT.caseX);if(i)near(layout.windows[i].x-layout.windows[i-1].x,AIRCRAFT.windowPitch);assert.ok(![-326,-184,151,283].some(x=>Math.abs(layout.windows[i].x-x)<11));}
 const scene=sceneAt(PHASE.hold,width,height,{caseLayout:layout}),carousel=carouselLayout(scene);assert.ok(Number.isFinite(scene.scale));assert.equal(scene.windows.length,count);for(const w of scene.windows.slice(0,layout.visibleCount)){assert.ok(w.x-w.width/2>=0&&w.x+w.width/2<=width);assert.ok(w.y-w.height/2>80&&w.y+w.height/2<height);if(w.i)near(w.x-scene.windows[w.i-1].x,carousel.pitch);}
 const visible=new Set();for(let position=-count-1;position<=count+1;position++){const frame=carouselFrame(position,projects,layout.visibleCount),active=frame.items.filter(x=>x.active);assert.equal(active.length,layout.visibleCount);assert.equal(new Set(active.map(x=>x.project.id)).size,active.length);for(const item of active)visible.add(item.project.id);if(count)assert.equal(active[0].project.id,ids[modulo(position,count)]);}assert.equal(visible.size,count);
 for(const u of TIMES.slice(1,-1)){const a=sceneAt(u-1e-8,width,height,{caseLayout:layout}),b=sceneAt(u+1e-8,width,height,{caseLayout:layout});assert.ok(Math.abs(a.scale-b.scale)<.001);for(let i=0;i<count;i++)assert.ok(Math.hypot(a.windows[i].x-b.windows[i].x,a.windows[i].y-b.windows[i].y)<.01);}
 }
 const layout=caseWindowLayout(ids),a=getAircraft('overview',layout),b=getAircraft('detail',layout);assert.equal(a,getAircraft('overview',layout));assert.deepEqual(a.anchors.windows,b.anchors.windows);for(const model of [a,b]){const windows=model.curves.filter(c=>c.caseIndex>=0);assert.equal(windows.length,count);assert.deepEqual(windows.map(w=>w.caseIndex),ids.map((_,i)=>i));}
 if(count){const s=sceneAt(PHASE.hold,1440,900,{caseLayout:layout}),svg=aircraftSVG(s);for(const w of layout.windows)assert.ok(svg.includes(`data-cabin-window="${Number(w.x.toFixed(2))}"`));}
});
test('physical bay overflow has an explicit diagnostic instead of losing identities',()=>{assert.throws(()=>caseWindowLayout(Array.from({length:100},(_,i)=>`p-${i}`)),/cannot fit 100 cases/);});
