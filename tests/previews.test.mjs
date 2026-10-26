import {data as fixtureData} from './site-fixture.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mountPreviews} from '../src/preview.mjs';import {domContract} from './dom-contract.mjs';
const data=fixtureData;
function fixture(options={}){
 const f=domContract(options),el=f.element,root=el('section','work-zone'),layer=el('div','preview-layer'),card=el('article','preview-card',layer),button=el('button','preview-close',card),content=el('div','preview-content',card),outside=el('button','outside'),arrow=el('button','carousel-arrow',root);arrow.dataset.carouselControl='next';layer.hidden=true;
 const sources=data.cases.map((p,i)=>{const source=el('button','case-window',root,{left:30+i*80,top:400,width:45,height:60});source.dataset.projectId=p.id;return source;});
 for(const project of data.cases){const template=el('template','',root);template.dataset.projectId=project.id;template.content={cloneNode(){const fragment=new f.Element('#fragment'),h=new f.Element('h3'),link=new f.Element('a','project-title'),copy=new f.Element('p');link.setAttribute('href',`cases/${project.slug}/`);link.textContent=project.short;h.append(link);copy.dataset={full:project.preview,compact:project.compact};fragment.append(h,copy);return fragment;}};}
 let navigated=null,locked=false,suppressed=false,available=true;const viewport={width:options.width||390,height:options.height||844,headerHeight:80,safeBottom:0};
 const controller=mountPreviews({root,layer,projects:data.cases,ui:data.ui,canOpen:()=>available,onNavigate:id=>navigated=id,getViewport:()=>viewport,getOrigin:id=>sources.find(s=>s.dataset.projectId===id),onSelectionChange:open=>locked=open,isActivationSuppressed:()=>suppressed});controller.setSectionVisible(true);
 return{...f,root,layer,card,button,content,sources,outside,arrow,controller,viewport,get locked(){return locked;},get navigated(){return navigated;},set suppressed(value){suppressed=value;},set available(value){available=value;}};
}
function use(fn,options){const f=fixture(options);try{fn(f);}finally{f.cleanup();}}
test('hover, focus and pointer departure never open or close a project',()=>use(f=>{
 f.sources[0].emit('pointerenter');f.sources[0].focus();f.advance(500);assert.equal(f.controller.selectedId,null);assert.equal(f.layer.hidden,true);
 f.sources[0].emit('click');f.advance(410);f.sources[0].emit('pointerleave');f.outside.focus();f.advance(1000);assert.equal(f.controller.selectedId,data.cases[0].id);assert.equal(f.layer.hidden,false);
}));
test('the opening click previews without navigation or same-event outside-close; only its heading navigates',()=>use(f=>{
 const event=f.sources[2].emit('click');assert.equal(event.defaultPrevented,true);assert.equal(f.navigated,null);assert.equal(f.controller.selectedId,data.cases[2].id);assert.equal(f.locked,true);f.advance(410);
 const link=f.content.querySelector('.project-title');assert.equal(link.getAttribute('href'),`cases/${data.cases[2].slug}/`);link.emit('click');assert.equal(f.navigated,data.cases[2].id);
}));
test('project content follows its stable ID after a position changes, with one selected preview',()=>use(f=>{
 f.sources[0].dataset.projectId=data.cases[3].id;f.sources[3].dataset.projectId=data.cases[0].id;f.sources[0].emit('click');f.advance(410);
 assert.equal(f.controller.selectedId,data.cases[3].id);assert.equal(f.content.querySelector('.project-title').textContent,data.cases[3].short);assert.equal(f.content.querySelector('[data-full]').textContent,data.cases[3].preview);
 f.sources[1].emit('click');f.advance(410);assert.equal(f.controller.selectedId,data.cases[1].id);assert.equal(f.sources[0].getAttribute('aria-expanded'),'false');assert.equal(f.sources[1].getAttribute('aria-expanded'),'true');
}));
test('leaving S4 hides its layer but preserves selection; reverse entry restores the same card',()=>use(f=>{
 f.sources[1].emit('click');f.advance(100);f.controller.setSectionVisible(false);assert.equal(f.layer.hidden,true);assert.equal(f.controller.selectedId,data.cases[1].id);f.advance(1000);f.outside.emit('click');assert.equal(f.controller.selectedId,data.cases[1].id);
 f.controller.setSectionVisible(true);assert.equal(f.layer.hidden,false);assert.ok(f.layer.classList.contains('is-open'));assert.equal(f.content.inert,false);f.button.emit('click');f.advance(500);assert.equal(f.controller.selectedId,null);assert.equal(f.layer.hidden,true);assert.equal(f.locked,false);
}));
test('outside activation closes, whereas the carousel arrows never compete with it',()=>use(f=>{
 f.sources[0].emit('click');f.advance(410);f.arrow.emit('click');assert.equal(f.controller.selectedId,data.cases[0].id);f.outside.emit('click');assert.equal(f.controller.selectedId,null);f.advance(500);assert.equal(f.layer.hidden,true);
}));
test('fixed final text width survives opening and viewport resize; stale close callbacks cannot hide a new project',()=>use(f=>{
 f.sources[0].emit('click');const width=f.card.style['--final-w'];f.advance(160);assert.equal(f.card.style['--final-w'],width);assert.equal(f.content.inert,true);
 f.viewport.width=320;f.viewport.height=568;f.controller.refresh();assert.notEqual(f.card.style['--final-w'],width);assert.equal(f.content.inert,false);f.controller.close();f.advance(25);f.sources[3].emit('click');f.advance(600);assert.equal(f.controller.selectedId,data.cases[3].id);assert.equal(f.layer.hidden,false);assert.ok(f.layer.classList.contains('is-open'));
}));
test('keyboard activation waits for readable linked title; Escape returns focus without reopening',()=>use(f=>{
 f.sources[2].focus();f.sources[2].emit('click',{detail:0});f.advance(200);assert.equal(f.document.activeElement,f.sources[2]);f.advance(210);assert.equal(f.document.activeElement,f.content.querySelector('.project-title'));
 f.content.querySelector('.project-title').emit('keydown',{key:'Escape'});assert.equal(f.controller.selectedId,null);assert.equal(f.document.activeElement,f.sources[2]);f.advance(500);assert.equal(f.layer.hidden,true);
}));
test('post-drag activation is ignored, while restored selection and reduced motion remain usable',()=>use(f=>{
 f.suppressed=true;f.sources[0].emit('click');assert.equal(f.controller.selectedId,null);f.suppressed=false;f.controller.restoreSelected(data.cases[2].id);assert.equal(f.controller.selectedId,data.cases[2].id);assert.equal(f.content.inert,false);f.button.emit('click');assert.equal(f.layer.hidden,true);
},{reduced:true}));
