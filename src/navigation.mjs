import {clamp,smoother} from './geometry.mjs';
export function navigationDuration(distance,viewportHeight){return 220+600*clamp(Math.abs(distance)/(Math.max(viewportHeight,1)*6));}
/** One cancelable page scroll. The scene only ever sees the real page position. */
export class ScrollNavigator{
 constructor({getPosition,setPosition,resolveTarget,getHeight,reduced=()=>false,requestFrame=fn=>requestAnimationFrame(fn),cancelFrame=id=>cancelAnimationFrame(id),now=()=>performance.now(),onPosition=()=>{},onFinish=()=>{}}){Object.assign(this,{getPosition,setPosition,resolveTarget,getHeight,reduced,requestFrame,cancelFrame,now,onPosition,onFinish});this.active=null;this.raf=0;this.generation=0;}
 cancel(){this.generation++;if(this.raf)this.cancelFrame(this.raf);this.raf=0;this.active=null;}
 go(id,{instant=false,focus=true}={}){
  this.cancel();const to=this.resolveTarget(id);if(!Number.isFinite(to))return;
  const from=this.getPosition();if(instant||this.reduced()||Math.abs(to-from)<2){this.setPosition(to);this.onPosition();this.onFinish(id,focus);return;}
  const start=this.now(),duration=navigationDuration(to-from,this.getHeight()),generation=this.generation;this.active={id,focus};
  const frame=now=>{if(generation!==this.generation)return;const target=this.resolveTarget(id);if(!Number.isFinite(target)){this.cancel();return;}const t=clamp((now-start)/duration);this.setPosition(from+(target-from)*smoother(t));this.onPosition();if(t<1)this.raf=this.requestFrame(frame);else{this.raf=0;this.active=null;this.onFinish(id,focus);}};
  this.raf=this.requestFrame(frame);
 }
 retarget(){if(this.active){const {id,focus}=this.active;this.go(id,{focus});}}
}
export function bindNavigationInterrupts(navigator,target){
 const interrupt=()=>navigator.cancel();
 for(const type of ['wheel','touchstart','pointerdown'])target.addEventListener(type,interrupt,{passive:true,capture:true});
 target.addEventListener('keydown',ev=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Escape'].includes(ev.key)&&!ev.target?.closest?.('input,textarea,select,[contenteditable="true"]'))interrupt();},{capture:true});
}
