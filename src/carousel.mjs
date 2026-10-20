import {AIRCRAFT} from './aircraft.mjs';
import {smoother,clamp} from './geometry.mjs';
import {icon,escapeHTML,formatText} from './content.mjs';
export const CAROUSEL=Object.freeze({threshold:7,intentRatio:1.15,duration:240,clickGuard:360,visible:4});
export const modulo=(value,length)=>((value%length)+length)%length;
export function carouselFrame(position,projects){
 const integer=Math.floor(position+1e-9),fraction=position-integer;
 return{integer,fraction:Math.abs(fraction)<1e-8?0:fraction,items:Array.from({length:8},(_,i)=>{const slot=i-2;return{slot,project:projects[modulo(integer+slot,projects.length)],active:slot>=0&&slot<4};})};
}
export function carouselLayout(s){
 const first=s.windows[0],pitch=AIRCRAFT.windowPitch*s.scale,width=Math.min(s.width,pitch*4.8);
 return{left:(s.width-width)/2,width,pitch,first,windowWidth:first.width,windowHeight:first.height};
}
export class CarouselGesture{
 constructor(){this.gesture=null;}
 begin({x,y,pointerId,position,pitch}){this.gesture={x,y,pointerId,position,pitch,intent:'pending'};}
 move(x,y){const g=this.gesture;if(!g)return{intent:'none'};const dx=x-g.x,dy=y-g.y;if(g.intent==='pending'&&Math.hypot(dx,dy)>=CAROUSEL.threshold){if(Math.abs(dx)>Math.abs(dy)*CAROUSEL.intentRatio)g.intent='horizontal';else if(Math.abs(dy)>Math.abs(dx)*CAROUSEL.intentRatio)g.intent='vertical';}return{intent:g.intent,position:g.position-dx/g.pitch};}
 end(){const g=this.gesture;this.gesture=null;return g;}
}
/** Only this layer moves horizontally. Its periodic frame can be passed to the
 * SVG cabin at a handoff; no camera or aircraft transform receives its offset. */
export function mountCarousel({root,projects,ui,canMove=()=>true,reduced=()=>false,onPosition=()=>{},requestFrame=fn=>requestAnimationFrame(fn),cancelFrame=id=>cancelAnimationFrame(id),now=()=>performance.now()}){
 root.classList.add('has-carousel');
 const viewport=root.querySelector('.carousel-viewport'),track=root.querySelector('.case-windows'),arrows=[...root.querySelectorAll('[data-carousel-control]')],status=root.querySelector('.carousel-status');
 let position=0,layout=null,ready=false,staticMode=false,available=true,locked=false,animation=0,generation=0,suppressUntil=0,lastIdentity='',nodes=[];const gesture=new CarouselGesture();
 function stop(){generation++;if(animation)cancelFrame(animation);animation=0;}
 function capture(id,on){try{if(on)viewport.setPointerCapture(id);else if(viewport.hasPointerCapture(id))viewport.releasePointerCapture(id);}catch{}}
 function release(){const g=gesture.end();if(g)capture(g.pointerId,false);root.classList.remove('is-dragging');return g;}
 const blocked=()=>locked||!canMove()||!ready||!available;
 function face(project,active){const el=document.createElement(active?'button':'div');el.className=active?'case-face case-window':'case-face case-decoration';
  el.innerHTML=`<span class="case-icon">${icon(project.icon)}</span><span class="window-name">${escapeHTML(project.window)}</span><span class="window-arrow" aria-hidden="true">${escapeHTML(ui.arrow)}</span>`;
  if(active){el.type='button';el.dataset.projectId=project.id;el.setAttribute('aria-label',formatText(ui.windowLabel,{project:project.short}));el.setAttribute('aria-expanded','false');el.setAttribute('aria-controls','case-preview');}
  else{el.setAttribute('aria-hidden','true');el.inert=true;}return el;
 }
 function render(){
  if(!layout)return;const f=carouselFrame(position,projects),identity=f.items.map(x=>x.project.id).join('|');
  if(identity!==lastIdentity){const focused=nodes.find(n=>n.el.contains(document.activeElement))?.project.id;lastIdentity=identity;nodes=f.items.map(item=>{const el=document.createElement('div');el.className=item.active?'case-item case-slot':'case-item case-copy';el.dataset.projectId=item.project.id;if(!item.active){el.setAttribute('aria-hidden','true');el.inert=true;}el.append(face(item.project,item.active));return{...item,el};});track.replaceChildren(...nodes.map(n=>n.el));if(focused&&!gesture.gesture&&!animation)nodes.find(n=>n.active&&n.project.id===focused)?.el.querySelector('button')?.focus({preventScroll:true});}
  for(const item of nodes){const el=item.el;el.style.left=`${layout.first.x-layout.left+(item.slot-f.fraction)*layout.pitch-layout.windowWidth/2}px`;el.style.top='12px';el.style.width=`${layout.windowWidth}px`;el.style.height=`${layout.windowHeight}px`;el.classList.toggle('mini',layout.windowWidth<42);if(item.active)el.inert=!ready||!!gesture.gesture||!!animation;}
  viewport.style.left=`${layout.left}px`;viewport.style.top=`${layout.first.y-layout.windowHeight/2-12}px`;viewport.style.height=`${layout.windowHeight+24}px`;viewport.style.width=`${layout.width}px`;root.style.setProperty('--window-bottom',`${layout.first.y+layout.windowHeight/2}px`);root.style.setProperty('--band-left',`${layout.left}px`);root.style.setProperty('--band-right',`${layout.left+layout.width}px`);
  for(const arrow of arrows)arrow.disabled=blocked();root.classList.toggle('is-busy',!!animation);onPosition(position);
 }
 function announce(){if(status)status.textContent=formatText(ui.carouselPosition,{project:projects[modulo(Math.round(position),projects.length)].short});}
 function snap(to=Math.round(position)){
  stop();if(blocked())return;const from=position;if(reduced()||Math.abs(to-from)<1e-7){position=to;render();announce();return;}
  const start=now(),g=generation;const step=time=>{if(g!==generation||!ready)return;const t=clamp((time-start)/CAROUSEL.duration);position=from+(to-from)*smoother(t);if(t<1){animation=requestFrame(step);render();}else{animation=0;position=to;render();announce();}};animation=requestFrame(step);render();
 }
 function endGesture({cancel=false}={}){const g=release();if(!g)return;const unsettled=Math.abs(position-Math.round(position))>1e-6;if(g.intent!=='pending'||unsettled)suppressUntil=now()+CAROUSEL.clickGuard;if((g.intent==='horizontal'||unsettled)&&!cancel&&ready)snap();else render();}
 viewport.addEventListener('pointerdown',event=>{
  if(blocked()||event.isPrimary===false||event.pointerType==='mouse'&&event.button!==0)return;stop();gesture.begin({x:event.clientX,y:event.clientY,pointerId:event.pointerId,position,pitch:layout.pitch});
 });
 document.addEventListener('pointermove',event=>{
  const g=gesture.gesture;if(!g||event.pointerId!==g.pointerId)return;const move=gesture.move(event.clientX,event.clientY);
  if(move.intent==='horizontal'){if(event.cancelable)event.preventDefault();capture(g.pointerId,true);root.classList.add('is-dragging');position=move.position;render();}
  else if(move.intent==='vertical'){suppressUntil=now()+CAROUSEL.clickGuard;release();render();}
 },{passive:false});
 document.addEventListener('pointerup',event=>{if(event.pointerId===gesture.gesture?.pointerId)endGesture();});
 document.addEventListener('pointercancel',event=>{if(event.pointerId===gesture.gesture?.pointerId)endGesture();});
 viewport.addEventListener('lostpointercapture',event=>{if(event.pointerId===gesture.gesture?.pointerId)endGesture();});
 globalThis.addEventListener?.('blur',()=>endGesture());
 root.addEventListener('dragstart',event=>event.preventDefault());
 root.addEventListener('selectstart',event=>{if(gesture.gesture?.intent==='horizontal')event.preventDefault();});
 document.addEventListener('click',event=>{if(root.contains(event.target)&&event.detail!==0&&now()<suppressUntil){event.preventDefault();event.stopPropagation();}},{capture:true});
 for(const arrow of arrows)arrow.addEventListener('click',event=>{event.preventDefault();if(blocked())return;snap(Math.round(position)+(arrow.dataset.carouselControl==='next'?1:-1));});
 return{
  setState(s){const was=ready;staticMode=!s;if(s)available=true;ready=!s||s.caseReady;const changed=!!s&&!!layout&&Math.abs(carouselLayout(s).pitch-layout.pitch)>1;
   if(changed&&gesture.gesture){stop();endGesture({cancel:true});}
   if(!ready){stop();endGesture({cancel:true});}
   if(s)layout=carouselLayout(s);else{const width=root.clientWidth||document.documentElement.clientWidth,pitch=Math.min(165,width/4.8),ww=pitch*AIRCRAFT.windowWidth/AIRCRAFT.windowPitch;root.style.height=`${ww/.76+100}px`;layout={left:0,width,pitch,first:{x:(width-3*pitch)/2,y:ww/.76/2+10},windowWidth:ww,windowHeight:ww/.76};}
   if(!staticMode)root.style.height='';render();if((!was||changed)&&ready&&Math.abs(position-Math.round(position))>1e-6&&!blocked())snap();
  },
  setLocked(value){locked=value;if(value){stop();endGesture({cancel:true});}render();},
  setSectionVisible(value){const was=available;available=value;if(!value){stop();endGesture({cancel:true});}render();if(value&&!was&&!blocked()&&Math.abs(position-Math.round(position))>1e-6)snap();},
  getOrigin(id){return nodes.find(n=>n.active&&n.project.id===id)?.el.querySelector('button')||null;},
  isActivationSuppressed(event){return !!animation||!!gesture.gesture||event.detail!==0&&now()<suppressUntil;},
  normalizeWhenHidden(hidden){if(hidden&&!ready){stop();release();position=Math.round(position);render();}},
  restore(value){stop();release();if(Number.isFinite(value))position=value;render();announce();},
  get position(){return position;},get phase(){return carouselFrame(position,projects).fraction;},get dragging(){return gesture.gesture?.intent==='horizontal';}
 };
}
