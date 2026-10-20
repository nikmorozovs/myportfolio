import test from 'node:test';import assert from 'node:assert/strict';
import {mountCompetencies,competencyBounds,COMPETENCIES} from '../src/competencies.mjs';import {domContract} from './dom-contract.mjs';
function fixture(){const f=domContract(),root=f.element('ul','skills'),items=Array.from({length:4},(_,i)=>{const item=f.element('li','',root,{left:i*85,top:600,width:75,height:40});item.dataset.competencyId=`skill-${i}`;const button=f.element('button','competency-toggle',item,{width:75,height:40}),panel=f.element('div','competency-panel',item);panel.hidden=true;return{item,button,panel};}),outside=f.element('button','outside');const controller=mountCompetencies({root,getViewport:()=>({width:390,height:844})});return{...f,root,items,outside,controller};}
function use(fn){const f=fixture();try{fn(f);}finally{f.cleanup();}}
test('hover opens one local explanation and the combined region has a delayed leave, without a project backdrop',()=>use(f=>{
 f.items[0].item.emit('pointerenter');assert.equal(f.controller.activeId,'skill-0');assert.equal(f.items[0].button.getAttribute('aria-expanded'),'true');f.items[0].item.emit('pointerleave');f.advance(150);f.items[0].panel.emit('pointerenter');f.items[0].item.emit('pointerenter');f.advance(300);assert.equal(f.controller.activeId,'skill-0');f.items[0].item.emit('pointerleave');f.advance(COMPETENCIES.leaveDelay+1);assert.equal(f.controller.activeId,null);
 f.items[1].item.emit('pointerenter');f.items[2].item.emit('pointerenter');assert.equal(f.items[1].panel.hidden,true);assert.equal(f.items[2].panel.hidden,false);
}));
test('touch/keyboard activation toggles and an outside tap closes without taking over scrolling',()=>use(f=>{
 f.items[0].button.emit('click',{pointerType:'touch'});assert.equal(f.controller.activeId,'skill-0');f.items[0].button.emit('click',{pointerType:'touch'});assert.equal(f.controller.activeId,null);
 f.items[2].button.focus();f.items[2].button.emit('click',{detail:0});assert.equal(f.controller.activeId,'skill-2');f.items[2].item.emit('pointerleave');f.advance(300);assert.equal(f.controller.activeId,'skill-2');f.outside.emit('pointerdown',{pointerType:'touch'});assert.equal(f.controller.activeId,null);
}));
test('S0 exit clears its explanation and pending callbacks, while focus alone does not toggle it',()=>use(f=>{
 f.items[1].button.focus();assert.equal(f.controller.activeId,null);f.items[1].button.emit('click',{detail:0});f.items[1].item.emit('pointerleave');f.controller.setVisible(false);f.advance(600);assert.equal(f.controller.activeId,null);assert.equal(f.items[1].panel.hidden,true);f.items[1].item.emit('pointerenter');assert.equal(f.controller.activeId,null);f.controller.setVisible(true);f.items[1].item.emit('pointerenter');assert.equal(f.controller.activeId,'skill-1');
}));
test('local panel bounds clamp either edge without moving its competency or changing scene length',()=>{
 for(const width of [320,390,568,1440])for(const center of [20,width/2,width-20]){const b=competencyBounds({center,width:288,viewportWidth:width});assert.ok(b.left>=16);assert.ok(b.left+b.width<=width-16);if(center===width/2)assert.equal(b.left+b.width/2,center);}
});
test('explanations stay under their own heading and close by Escape with a stable accessible state',()=>use(f=>{
 f.items[3].button.emit('click',{detail:0});const panel=f.items[3].panel;assert.ok(parseFloat(panel.style.left)<0);assert.ok(parseFloat(panel.style.width)<=358);assert.equal(f.items[3].item.rect.top,600);panel.emit('keydown',{key:'Escape'});assert.equal(f.controller.activeId,null);assert.equal(f.document.activeElement,f.items[3].button);assert.equal(f.items[3].button.getAttribute('aria-expanded'),'false');
}));
