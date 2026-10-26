import {sceneAt} from './site-fixture.mjs';
import {data as fixtureData} from './site-fixture.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {carouselFrame,carouselLayout,CarouselGesture,mountCarousel,CAROUSEL} from '../src/carousel.mjs';
import {PHASE} from '../src/geometry.mjs';import {domContract} from './dom-contract.mjs';
const data=fixtureData,projects=data.cases;
const close=(a,b,e=1e-5)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
function fixture(options={}){const f=domContract(options),root=f.element('div','case-carousel',undefined,{width:options.width||390,height:options.height||844}),viewport=f.element('div','carousel-viewport',root),track=f.element('div','case-windows',viewport),controls=f.element('div','carousel-controls',root),prev=f.element('button','',controls),next=f.element('button','',controls),status=f.element('p','carousel-status',root);prev.dataset.carouselControl='previous';next.dataset.carouselControl='next';let canMove=true;const carousel=mountCarousel({root,projects:options.projects||projects,ui:data.ui,canMove:()=>canMove,reduced:()=>!!options.reduced,now:f.now});carousel.setState(sceneAt(PHASE.hold,options.width||390,options.height||844,{caseIds:(options.projects||projects).map(p=>p.id)}));return{...f,root,viewport,track,prev,next,status,carousel,set canMove(value){canMove=value;},source:()=>root.querySelector('.case-window')};}
function use(fn,options){const f=fixture(options);try{fn(f);}finally{f.cleanup();}}
test('every periodic carousel frame exposes four distinct stable projects and four inaccessible copies',()=>{
 for(let n=-160;n<160;n++){const f=carouselFrame(n/7,projects),main=f.items.filter(i=>i.active);assert.equal(main.length,4);assert.equal(new Set(main.map(i=>i.project.id)).size,4);assert.equal(f.items.filter(i=>!i.active).length,4);for(const i of main)assert.equal(i.project,projects.find(p=>p.id===i.project.id));}
 for(let n=-20;n<=20;n++){const a=carouselFrame(n-1e-7,projects),b=carouselFrame(n+1e-7,projects);for(const item of a.items.slice(1,-1)){const next=b.items.find(x=>x.project.id===item.project.id&&Math.abs(x.slot-b.fraction-(item.slot-a.fraction))<.01);assert.ok(next,'A seam must not change the visible project or position');}}
});
test('desktop and phone layouts retain four whole windows and a partial neighbour at both edges',()=>{
 for(const [w,h]of [[320,568],[390,844],[568,320],[844,390],[1440,900],[1920,1080]]){const s=sceneAt(PHASE.hold,w,h),l=carouselLayout(s);for(const p of s.windows){assert.ok(p.x-p.width/2>l.left);assert.ok(p.x+p.width/2<l.left+l.width);}const left=s.windows[0].x-l.pitch,right=s.windows[3].x+l.pitch;assert.ok(left-l.windowWidth/2<l.left&&left+l.windowWidth/2>l.left);assert.ok(right-l.windowWidth/2<l.left+l.width&&right+l.windowWidth/2>l.left+l.width);}
});
test('touch intent distinguishes a vertical page gesture before horizontal capture',()=>{
 const g=new CarouselGesture();g.begin({x:100,y:100,pointerId:1,position:0,pitch:80});assert.equal(g.move(104,102).intent,'pending');assert.equal(g.move(108,130).intent,'vertical');g.end();g.begin({x:100,y:100,pointerId:2,position:0,pitch:80});const m=g.move(60,104);assert.equal(m.intent,'horizontal');close(m.position,.5);
});
test('arrows move exactly one project, loop both ways and retain matching labels/IDs',()=>use(f=>{
 const start=f.source().dataset.projectId;for(let i=1;i<=12;i++){f.next.emit('click');f.advance(260);close(f.carousel.position,i);const source=f.source(),p=projects[i%4];assert.equal(source.dataset.projectId,p.id);assert.ok(source.innerHTML.includes(p.window));assert.ok(source.getAttribute('aria-label').includes(p.short));}assert.equal(f.source().dataset.projectId,start);
 for(let i=0;i<13;i++){f.prev.emit('click');f.advance(260);}close(f.carousel.position,-1);assert.equal(f.source().dataset.projectId,projects[3].id);
 const copies=f.root.querySelectorAll('.case-copy');assert.equal(copies.length,4);for(const copy of copies){assert.equal(copy.getAttribute('aria-hidden'),'true');assert.equal(copy.inert,true);assert.equal(copy.querySelector('button'),null);}assert.equal(f.root.querySelectorAll('.case-window').length,4);for(const control of f.root.querySelectorAll('.case-window')){assert.equal(control.tagName,'BUTTON');assert.equal(control.type,'button');}
}));
test('mouse dragging captures horizontal intent, releases outside the source and suppresses its click',()=>use(f=>{
 const source=f.source();source.emit('pointerdown',{clientX:140,clientY:460});f.document.emit('pointermove',{clientX:90,clientY:462});assert.equal(f.carousel.dragging,true);assert.equal(f.viewport.hasPointerCapture(1),true);f.document.emit('pointerup',{clientX:-20,clientY:462});assert.equal(f.viewport.hasPointerCapture(1),false);assert.equal(f.carousel.dragging,false);
 const click=f.source().emit('click');assert.equal(click.defaultPrevented,true);assert.equal(click.stopped,true);f.advance(260);close(f.carousel.position,1);f.advance(CAROUSEL.clickGuard);assert.equal(f.carousel.isActivationSuppressed({detail:1}),false);
}));
test('vertical swipe keeps native page scrolling and never moves or captures the carousel',()=>use(f=>{
 f.source().emit('pointerdown',{pointerType:'touch',clientX:140,clientY:460});const move=f.document.emit('pointermove',{pointerType:'touch',clientX:145,clientY:500});assert.equal(move.defaultPrevented,false);assert.equal(f.viewport.hasPointerCapture(1),false);assert.equal(f.carousel.position,0);assert.equal(f.carousel.dragging,false);
}));
test('section exit cancels a drag, retains fractional presentation and normalizes only when hidden',()=>use(f=>{
 f.source().emit('pointerdown',{clientX:150,clientY:460});f.document.emit('pointermove',{clientX:125,clientY:461});const fraction=f.carousel.phase;assert.ok(fraction>0&&fraction<1);const s=sceneAt(PHASE.pan+.1,390,844),snapshot=JSON.stringify({axes:s.axes,center:s.center,scale:s.scale,target:s.target});f.carousel.setState(s);assert.equal(f.viewport.hasPointerCapture(1),false);assert.equal(f.carousel.phase,fraction);f.advance(1000);assert.equal(f.carousel.phase,fraction);assert.equal(JSON.stringify({axes:s.axes,center:s.center,scale:s.scale,target:s.target}),snapshot);
 f.carousel.normalizeWhenHidden(false);assert.equal(f.carousel.phase,fraction);f.carousel.setState(sceneAt(PHASE.hold,390,844));assert.equal(f.carousel.phase,fraction);f.advance(260);close(f.carousel.phase,0);
 f.carousel.restore(2.4);f.carousel.setState(s);f.carousel.normalizeWhenHidden(true);close(f.carousel.phase,0);close(f.carousel.position,2);
}));
test('pointer cancellation and explicit preview lock cannot leave pointer capture or competing animation',()=>use(f=>{
 f.source().emit('pointerdown',{clientX:150,clientY:460});f.document.emit('pointermove',{clientX:100,clientY:461});f.document.emit('pointercancel');assert.equal(f.viewport.hasPointerCapture(1),false);f.advance(260);close(f.carousel.phase,0);
 const saved=f.carousel.position;f.carousel.setLocked(true);assert.equal(f.next.disabled,true);f.next.emit('click');f.source().emit('pointerdown',{clientX:150,clientY:460});f.document.emit('pointermove',{clientX:30,clientY:461});f.advance(500);close(f.carousel.position,saved);assert.equal(f.carousel.dragging,false);f.carousel.setLocked(false);assert.equal(f.next.disabled,false);
}));
test('return-state restoration and reduced motion preserve the selected project ordering without animation',()=>use(f=>{
 f.carousel.restore(7);assert.equal(f.source().dataset.projectId,projects[3].id);f.next.emit('click');close(f.carousel.position,8);assert.equal(f.source().dataset.projectId,projects[0].id);f.carousel.setState(null);assert.equal(f.root.querySelectorAll('.case-window').length,4);f.prev.emit('click');close(f.carousel.position,7);
},{reduced:true}));
test('pressing during a snap cannot strand fractional clickable windows or open a project on release',()=>use(f=>{
 f.next.emit('click');f.advance(80);assert.ok(f.carousel.phase>0);f.viewport.emit('pointerdown',{clientX:150,clientY:460});f.document.emit('pointerup',{clientX:150,clientY:460});assert.equal(f.carousel.isActivationSuppressed({detail:1}),true);f.advance(260);close(f.carousel.phase,0);
}));
test('orientation resize releases the old drag capture and settles using the new window pitch',()=>use(f=>{
 f.source().emit('pointerdown',{clientX:150,clientY:460});f.document.emit('pointermove',{clientX:110,clientY:461});assert.equal(f.viewport.hasPointerCapture(1),true);f.carousel.setState(sceneAt(PHASE.hold,844,390));assert.equal(f.viewport.hasPointerCapture(1),false);f.advance(260);close(f.carousel.phase,0);assert.equal(f.root.querySelectorAll('.case-window').length,4);
}));
test('reduced-motion document flow hides the presentation without removing keyboard entry controls',()=>use(f=>{
 f.carousel.setState(null);f.carousel.setSectionVisible(false);assert.equal(f.next.disabled,true);for(const slot of f.root.querySelectorAll('.case-slot'))assert.equal(slot.inert,false);const old=f.carousel.position;f.next.emit('click');assert.equal(f.carousel.position,old);f.carousel.setSectionVisible(true);f.next.emit('click');close(f.carousel.position,old+1);
},{reduced:true}));

test('all collection sizes preserve arrow/key loops, touch identity and inert helpers',()=>{
 for(const count of [0,1,2,3,4,5,6,8,10]){
  const collection=Array.from({length:count},(_,i)=>({...projects[0],id:`case-${i}`,short:`Case ${i}`,window:`Case ${i}`}));
  use(f=>{assert.equal(f.next.disabled,count<2);assert.equal(f.prev.disabled,count<2);if(!count){assert.equal(f.root.querySelectorAll('.case-window').length,0);f.next.emit('click');assert.equal(f.carousel.position,0);return;}
   if(count===1){f.next.emit('click');f.root.emit('keydown',{key:'ArrowRight'});assert.equal(f.carousel.position,0);assert.equal(f.root.querySelectorAll('.case-copy').length,0);return;}
   for(let step=1;step<=count;step++){f.next.emit('click');f.advance(260);assert.equal(f.source().dataset.projectId,collection[step%count].id);}
   f.source().focus();f.root.emit('keydown',{key:'ArrowLeft'});f.advance(260);assert.equal(f.source().dataset.projectId,collection[count-1].id);assert.ok(f.root.contains(f.document.activeElement));
   f.carousel.restore(123,collection[0].id);assert.equal(f.carousel.position,0);
   const pitch=carouselLayout(sceneAt(PHASE.hold,390,844,{caseIds:collection.map(p=>p.id)})).pitch;
   f.source().emit('pointerdown',{pointerType:'touch',clientX:200,clientY:460});f.document.emit('pointermove',{pointerType:'touch',clientX:200-pitch*.75,clientY:461});f.document.emit('pointerup',{pointerType:'touch'});f.advance(260);assert.equal(f.source().dataset.projectId,collection[1].id);
   for(const copy of f.root.querySelectorAll('.case-copy')){assert.equal(copy.inert,true);assert.equal(copy.getAttribute('aria-hidden'),'true');assert.equal(copy.querySelector('button'),null);}
  },{projects:collection});
 }
});
