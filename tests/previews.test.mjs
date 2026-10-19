import test from 'node:test';
import assert from 'node:assert/strict';
import {mountPreviews} from '../src/preview.mjs';

// Controller tests use a minimal DOM contract and a deterministic clock. They
// deliberately do not claim to exercise CSS layout, hit testing or a browser.
function fixture({coarse=false}={}){
 const originals=new Map(),setGlobal=(name,value)=>{originals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{value,writable:true,configurable:true});};
 let now=0,next=1;const jobs=new Map(),later=(fn,delay=0)=>{const id=next++;jobs.set(id,{fn,at:now+delay});return id;};
 const document={activeElement:null,listeners:new Map(),addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);},dispatch(type,event={}){for(const fn of this.listeners.get(type)||[])fn(event);}};
 class Element{
  constructor(name,rect={left:0,top:0,width:64,height:84}){this.name=name;this.rect=rect;this.parent=null;this.listeners=new Map();this.attrs={};this.hidden=false;this.inert=false;this.children=[];this.queries={};this.dataset={};this.style={setProperty(k,v){this[k]=v;}};const classes=new Set();this.classList={add(...xs){xs.forEach(x=>classes.add(x));},remove(...xs){xs.forEach(x=>classes.delete(x));},contains(x){return classes.has(x);},toggle(x,on){if(on)classes.add(x);else classes.delete(x);return !!on;}};}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}
  dispatch(type,event={}){const e={target:this,pointerType:'mouse',preventDefault(){this.defaultPrevented=true;},...event};for(const fn of this.listeners.get(type)||[])fn(e);return e;}
  querySelector(selector){return this.queries[selector]||null;}
  contains(node){while(node){if(node===this)return true;node=node.parent;}return false;}
  setAttribute(k,v){this.attrs[k]=v;}
  getBoundingClientRect(){const left=parseFloat(this.style.left??this.rect.left),top=parseFloat(this.style.top??this.rect.top),width=parseFloat(this.style.width??this.rect.width),height=parseFloat(this.style.height??this.rect.height);return{left,top,width,height,right:left+width,bottom:top+height};}
  replaceChildren(){const copy=new Element('copy'),link=new Element('open-case');copy.dataset={full:'Detailed project preview.',compact:'Short preview.'};copy.parent=this;link.parent=this;this.children=[copy,link];this.queries={'[data-full]':copy,'.open-case':link};}
  focus(){document.activeElement=this;this.dispatch('focus');document.dispatch('focusin',{target:this});}
  closest(selector){return selector==='.open-case'&&this.name==='open-case'?this:null;}
 }
 const layer=new Element('layer'),card=new Element('card'),content=new Element('content'),button=new Element('button');layer.hidden=true;
 card.parent=layer;content.parent=card;button.parent=card;layer.queries={'.preview-card':card};card.queries={'.preview-content':content,'.preview-close':button,'.open-case':null};
 const query=card.querySelector.bind(card);card.querySelector=selector=>selector==='.open-case'?content.querySelector(selector):query(selector);
 const slots=Array.from({length:4},(_,i)=>{const slot=new Element(`slot-${i}`,{left:30+i*100,top:400,width:60,height:79}),link=new Element(`source-${i}`);link.parent=slot;link.dataset.title=`Case ${i}`;slot.queries={'.case-window':link,template:{content:{cloneNode(){return{};}}}};return slot;});
 setGlobal('document',document);setGlobal('innerHeight',844);document.documentElement={clientWidth:390};setGlobal('matchMedia',q=>({matches:q==='(hover: none)'?coarse:false}));setGlobal('setTimeout',later);setGlobal('clearTimeout',id=>jobs.delete(id));setGlobal('requestAnimationFrame',fn=>later(fn,16));
 let navigations=0;const controller=mountPreviews({slots,layer,canOpen:()=>true,onNavigate:()=>navigations++});
 const advance=ms=>{const end=now+ms;while(true){let id=null,job=null;for(const [k,v]of jobs)if(v.at<=end&&(!job||v.at<job.at)){id=k;job=v;}if(!job)break;jobs.delete(id);now=job.at;job.fn();}now=end;};
 return{controller,slots,layer,card,content,button,document,advance,get navigations(){return navigations;},source:i=>slots[i].querySelector('.case-window'),cleanup(){for(const [name,desc]of originals){if(desc)Object.defineProperty(globalThis,name,desc);else delete globalThis[name];}}};
}
function withFixture(fn,options){const f=fixture(options);try{fn(f);}finally{f.cleanup();}}

test('viewport resize keeps an open preview visible and recomputes its final text column',()=>withFixture(f=>{
 f.source(0).focus();f.advance(410);assert.equal(f.layer.hidden,false);assert.ok(f.layer.classList.contains('is-open'));const before=f.card.style['--final-w'];
 f.document.documentElement.clientWidth=320;globalThis.innerHeight=568;f.controller.refresh();assert.equal(f.controller.active,f.slots[0]);assert.equal(f.layer.hidden,false);assert.notEqual(f.card.style['--final-w'],before);
 const finalWidth=f.card.style['--final-w'];f.advance(200);assert.equal(f.card.style['--final-w'],finalWidth);assert.equal(f.content.inert,true);f.advance(210);assert.ok(f.layer.classList.contains('is-open'));assert.equal(f.content.inert,false);
}));
test('rapid close and reopen cancels stale collapse and reveal callbacks',()=>withFixture(f=>{
 f.source(0).focus();f.advance(100);f.controller.close();f.advance(25);f.source(1).focus();f.advance(600);
 assert.equal(f.controller.active,f.slots[1]);assert.equal(f.layer.hidden,false);assert.ok(f.layer.classList.contains('is-open'));assert.equal(f.source(0).attrs['aria-expanded'],'false');assert.equal(f.source(1).attrs['aria-expanded'],'true');
 f.controller.close({immediate:true});f.advance(1000);assert.equal(f.layer.hidden,true);assert.equal(f.controller.active,null);
}));
test('keyboard waits for readable content, Escape closes and focus does not reopen the card',()=>withFixture(f=>{
 f.source(2).focus();const event=f.source(2).dispatch('keydown',{key:'Tab',shiftKey:false});assert.equal(event.defaultPrevented,true);assert.equal(f.document.activeElement,f.source(2));
 f.advance(410);assert.equal(f.document.activeElement,f.content.querySelector('.open-case'));
 f.document.dispatch('keydown',{key:'Escape',preventDefault(){}});assert.equal(f.controller.active,null);assert.equal(f.document.activeElement,f.source(2));f.advance(500);assert.equal(f.layer.hidden,true);
}));
test('first coarse-pointer activation previews; explicit case link navigates',()=>withFixture(f=>{
 const event=f.source(3).dispatch('click',{pointerType:'touch'});assert.equal(event.defaultPrevented,true);assert.equal(f.navigations,0);f.advance(410);assert.equal(f.controller.active,f.slots[3]);
 const link=f.content.querySelector('.open-case');f.card.dispatch('click',{target:link});assert.equal(f.navigations,1);
},{coarse:true}));
test('pointer transfer uses the destination corridor; leaving both surfaces closes after intent delay',()=>withFixture(f=>{
 f.slots[0].dispatch('pointerenter');f.advance(500);assert.equal(f.controller.active,f.slots[0]);
 const r=f.card.getBoundingClientRect();f.document.dispatch('pointermove',{pointerType:'mouse',clientX:r.left+r.width/2,clientY:r.top+r.height/2});f.advance(500);assert.equal(f.controller.active,f.slots[0]);
 f.document.dispatch('pointermove',{pointerType:'mouse',clientX:-100,clientY:-100});f.advance(189);assert.equal(f.controller.active,f.slots[0]);f.advance(2);assert.equal(f.controller.active,null);f.advance(500);assert.equal(f.layer.hidden,true);
}));
