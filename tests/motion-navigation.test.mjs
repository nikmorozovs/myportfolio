import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneAt,PHASE,END,READING,scrollUnit,previewRect} from '../src/geometry.mjs';
import {ScrollMotion,AircraftVibration,MOTION} from '../src/motion.mjs';
import {aboutTrack,workProgress,sectionTarget} from '../src/layout.mjs';
import {ScrollNavigator,navigationDuration,bindNavigationInterrupts} from '../src/navigation.mjs';
const close=(a,b,tolerance=1e-5)=>assert.ok(Math.abs(a-b)<tolerance,`${a} ≠ ${b}`);
const sizes=[[320,568],[360,640],[390,844],[568,320],[640,900],[768,1024],[844,390],[1280,720],[1440,900],[1920,1080]];

test('extra S4 range holds fully revealed cases and shifts downstream transitions without stretching them',()=>{
 close(PHASE.pan-PHASE.hold,1.25+READING.extraWork);close(PHASE.orbit-PHASE.pan,2.5);close(PHASE.approach-PHASE.orbit,2);close(END-PHASE.fade,.85);
 for(const [w,h]of sizes){const first=sceneAt(PHASE.hold,w,h);for(let i=0;i<30;i++){const s=sceneAt(PHASE.hold+(PHASE.pan-PHASE.hold-.001)*i/29,w,h);assert.equal(s.caseReady,true);assert.deepEqual(s.windows,first.windows);assert.deepEqual(s.axes,first.axes);close(s.scale,first.scale);}}
});
test('Work resolves well inside S4 for either scroll direction, resize and safe header insets',()=>{
 for(const [w,h]of sizes)for(const safe of [0,20,44]){const header=(h<480?56:w<640?80:100)+safe,u=workProgress({height:h,headerHeight:header}),s=sceneAt(u,w,h);assert.equal(s.caseReady,true);assert.ok(u>PHASE.hold+.25);assert.ok(PHASE.pan-u>=.75);for(const p of s.windows)assert.ok(p.y-p.height/2>header+5);const target=u*scrollUnit(w,h);for(const from of [0,target,30000])close(target-from+from,target);}
});
test('About reading track reserves exactly .75 viewport only after a readable view, including long text',()=>{
 for(const h of [320,568,844,900])for(const header of [56,100])for(const content of [200,h*2.4]){
  const r=aboutTrack({viewportHeight:h,headerHeight:header,contentHeight:content}),top=15000,begin=top-r.stickyTop;
  close(r.reserve,h*.75);close(r.trackHeight-r.contentHeight,h*.75);
  const sectionY=y=>Math.min(Math.max(top-y,r.stickyTop),top+r.trackHeight-y-r.contentHeight);
  for(const fraction of [.01,.25,.5,.99])close(sectionY(begin+fraction*r.reserve),r.stickyTop);
  close(r.stickyTop+r.contentHeight,h);assert.ok(begin>=top-header);if(content>h-header){assert.ok(r.stickyTop<header);assert.ok(sectionY(top-header)>r.stickyTop);}
  assert.equal(sceneAt(END,1440,h).fade,0);
 }
});
test('Contact viewport minimum leaves enough native scroll range to align below the header',()=>{
 for(const [w,h]of sizes)for(const content of [200,h*1.8]){const header=h<480?56:w<640?80:100,sectionHeight=Math.max(h-header,content),top=24000,footer=70,max=top+sectionHeight+footer-h;close(sectionTarget(top,header,max),top-header);}
});
test('preview safe bounds account for a real header and bottom safe area',()=>{
 for(const [w,h]of sizes){const header=(h<480?56:w<640?80:100)+(h<480?0:20),p=previewRect(null,w,h,{headerHeight:header,safeBottom:21});assert.ok(p.y>=header+12);assert.ok(p.y+p.height<=h-32.999);}
});
test('scroll signal measures absolute real velocity, smooths acceleration/deceleration and caps jumps',()=>{
 const forward=new ScrollMotion(),reverse=new ScrollMotion();forward.sample(0,0);reverse.sample(100000,0);
 for(let i=1;i<=120;i++){close(forward.sample(i*12,i*1000/60),reverse.sample(100000-i*12,i*1000/60));assert.ok(forward.speed<=MOTION.maxScrollSpeed);}
 const before=forward.speed;forward.sample(1440,2020);assert.ok(forward.speed<before&&forward.speed>0);for(let i=1;i<240;i++)forward.sample(1440,2020+i*1000/60);assert.ok(forward.speed<.1);
 assert.ok(forward.sample(900000,6021)<=MOTION.maxScrollSpeed);const speed=forward.speed;forward.rebase(100,6022,true);close(forward.speed,speed);
});
test('speed sampling gives the same steady signal across 30 and 120 Hz and follows inertial decay',()=>{
 const steady=hz=>{const s=new ScrollMotion();s.sample(0,0);for(let i=1;i<=hz*4;i++)s.sample(900*i/hz,1000*i/hz);return s.speed;};close(steady(30),steady(120),.001);
 const s=new ScrollMotion();let y=0;s.sample(0,0);for(let i=1;i<=60;i++){y+=1600/60;s.sample(y,i*1000/60);}const peak=s.speed;for(let i=1;i<=180;i++){y+=1600*Math.exp(-i/30)/60;s.sample(y,1000+i*1000/60);}assert.ok(s.speed<peak*.05);
});
test('vibration has bounded screen amplitude, a continuous phase and no S4 motion across model changes',()=>{
 const v=new AircraftVibration();for(let i=0;i<600;i++){const s=sceneAt(i%2?4.8:PHASE.approach+.5,1440,900);const p=v.step(1/60,s,4800);assert.ok(Math.abs(p[0])<=MOTION.amplitudeX);assert.ok(Math.abs(p[1])<=MOTION.amplitudeY);}
 const phase=v.phase,frequency=v.frequency;const p=v.step(1/60,sceneAt(PHASE.handoff-.001,390,844),4800);assert.deepEqual(p,[0,0]);assert.ok(v.phase>phase);close(v.frequency,frequency);const atSwitch=v.phase;v.step(1/60,sceneAt(PHASE.handoff+.001,390,844),4800);assert.ok(v.phase>atSwitch);
 for(const [w,h]of sizes)assert.deepEqual(v.step(1/60,sceneAt(PHASE.hold+.5,w,h),0),[0,0]);
 const s=sceneAt(4.8,1440,900);v.phase=1.2;const a=v.offset(s),b=v.offset({...s,scale:s.scale*1000});assert.deepEqual(a,b);
});
test('scroll speed increases vibration frequency rather than amplitude and never changes camera pose',()=>{
 const slow=new AircraftVibration(),fast=new AircraftVibration(),s=sceneAt(4.5,1440,900),snapshot=JSON.stringify({axes:s.axes,scale:s.scale,windows:s.windows});slow.step(.1,s,0);fast.step(.1,s,4800);assert.ok(fast.frequency>slow.frequency);slow.phase=fast.phase;assert.deepEqual(slow.offset(s),fast.offset(s));assert.equal(JSON.stringify({axes:s.axes,scale:s.scale,windows:s.windows}),snapshot);
});
function navigationFixture(reduced=false){let now=0,y=0,next=1;const jobs=new Map(),positions=[],targets={work:8600,about:18000,contact:26000};const nav=new ScrollNavigator({getPosition:()=>y,setPosition:value=>{y=value;positions.push(value);},resolveTarget:id=>targets[id],getHeight:()=>844,reduced:()=>reduced,now:()=>now,requestFrame:fn=>{const id=next++;jobs.set(id,fn);return id;},cancelFrame:id=>jobs.delete(id)});const frame=ms=>{now+=ms;const pending=[...jobs.values()];jobs.clear();pending.forEach(fn=>fn(now));};return{nav,targets,positions,frame,get y(){return y;},set y(value){y=value;},get jobs(){return jobs.size;}};}
test('far navigation is bounded, renders real intermediate positions and supports a shorter nearby move',()=>{
 const f=navigationFixture();f.nav.go('contact');assert.equal(f.y,0);f.frame(400);assert.ok(f.y>0&&f.y<26000);f.frame(421);close(f.y,26000);assert.equal(f.nav.active,null);assert.ok(navigationDuration(26000,844)<=900);assert.ok(navigationDuration(26000,844)>=600);assert.ok(navigationDuration(100,844)<navigationDuration(26000,844));
});
test('a second navigation redirects from the real position without concurrent animations',()=>{
 const f=navigationFixture();f.nav.go('contact');f.frame(300);const actual=f.y;f.nav.go('work');close(f.y,actual);assert.equal(f.jobs,1);f.frame(900);close(f.y,8600);assert.equal(f.jobs,0);f.nav.go('work');assert.equal(f.jobs,0);
});
test('wheel, touch, pointer and keyboard gestures cancel navigation and leave native movement untouched',()=>{
 for(const type of ['wheel','touchstart','pointerdown','keydown']){const f=navigationFixture(),listeners=new Map(),target={addEventListener(type,fn){listeners.set(type,fn);}};bindNavigationInterrupts(f.nav,target);f.nav.go('contact');f.frame(200);listeners.get(type)({key:'PageDown',target:{}});f.y+=100;const manual=f.y;f.frame(900);close(f.y,manual);assert.equal(f.nav.active,null);assert.equal(f.jobs,0);}
});
test('reduced motion is immediate and viewport retargeting uses recalculated targets',()=>{
 const r=navigationFixture(true);r.nav.go('work');close(r.y,8600);assert.equal(r.jobs,0);
 const f=navigationFixture();f.nav.go('work');f.frame(200);f.targets.work=9200;f.nav.retarget();assert.equal(f.jobs,1);f.frame(900);close(f.y,9200);
});
