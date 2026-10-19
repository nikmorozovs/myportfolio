import {previewRect} from './geometry.mjs';
const $=(s,r=document)=>r.querySelector(s);
const inside=(p,r,pad=0)=>p.x>=r.left-pad&&p.x<=r.right+pad&&p.y>=r.top-pad&&p.y<=r.bottom+pad;
export function inPreviewBridge(point,a,b,padding=14){
 if(inside(point,a,padding)||inside(point,b,padding))return true;
 const from={x:(a.left+a.right)/2,y:(a.top+a.bottom)/2},to={x:(b.left+b.right)/2,y:(b.top+b.bottom)/2};
 const dx=to.x-from.x,dy=to.y-from.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((point.x-from.x)*dx+(point.y-from.y)*dy)/l)):0;
 const distance=Math.hypot(point.x-from.x-t*dx,point.y-from.y-t*dy);
 return distance<=Math.min(Math.max(a.width,a.height)*.55+padding,58);
}
export function mountPreviews({slots,layer,canOpen,onNavigate}){
 const card=$('.preview-card',layer),content=$('.preview-content',card),closeButton=$('.preview-close',card),coarse=matchMedia('(hover: none)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let destination=null,active=null,closing=null,generation=0,timers=[],pointer={x:-100,y:-100},intent=0,leave=0,suppress=false,focusOnReveal=null;
 const clear=()=>{generation++;for(const t of timers)clearTimeout(t);timers=[];clearTimeout(leave);clearTimeout(intent);};
 const later=(fn,ms)=>{const g=generation;timers.push(setTimeout(()=>{if(g===generation)fn();},ms));};
 function rectStyle(r){card.style.left=`${r.left??r.x}px`;card.style.top=`${r.top??r.y}px`;card.style.width=`${r.width}px`;card.style.height=`${r.height}px`;}
 function sourceLink(slot){return $('.case-window',slot);}
 function close({focus=false,immediate=false}={}){
  if(!active&&!closing)return;clear();const source=active||closing;active=null;closing=source;focusOnReveal=null;
  sourceLink(source).setAttribute('aria-expanded','false');layer.classList.remove('is-open','is-opening','is-dimmed');layer.classList.add('is-closing');card.inert=true;
  if(focus){suppress=true;sourceLink(source).focus({preventScroll:true});queueMicrotask(()=>{suppress=false;});}
  const collapse=()=>{const r=source.getBoundingClientRect();rectStyle(r);};
  if(immediate||reduced.matches){collapse();layer.classList.remove('is-closing');layer.hidden=true;closing=null;return;}
  later(collapse,85);later(()=>{layer.hidden=true;layer.classList.remove('is-closing');closing=null;},480);
 }
 function open(slot,{refresh=false}={}){
  if(suppress||!canOpen())return;clear();const wasVisible=!layer.hidden,oldRect=wasVisible?card.getBoundingClientRect():slot.getBoundingClientRect();
  if(active===slot&&layer.classList.contains('is-open')&&!refresh)return;
  if(active)sourceLink(active).setAttribute('aria-expanded','false');active=slot;closing=null;focusOnReveal=null;
  const final=previewRect(null,document.documentElement.clientWidth,innerHeight);destination={left:final.x,right:final.x+final.width,top:final.y,bottom:final.y+final.height,width:final.width,height:final.height};
  content.replaceChildren($('template',slot).content.cloneNode(true));
  const copy=$('[data-full]',content);if(copy)copy.textContent=final.compact?copy.dataset.compact:copy.dataset.full;
  layer.hidden=false;layer.classList.remove('is-open','is-closing');layer.classList.add('is-opening');
  card.style.setProperty('--final-w',`${final.width}px`);card.style.setProperty('--final-h',`${final.height}px`);card.style.setProperty('--pad-x',`${final.paddingX}px`);card.style.setProperty('--pad-y',`${final.paddingY}px`);card.classList.toggle('compact',final.compact);
  card.setAttribute('aria-label',`${sourceLink(slot).dataset.title} preview`);card.inert=false;content.inert=true;closeButton.tabIndex=-1;
  sourceLink(slot).setAttribute('aria-expanded','true');
  if(!wasVisible){card.style.transition='none';rectStyle(oldRect);card.getBoundingClientRect();card.style.transition='';}
  const reveal=()=>{if(active===slot){layer.classList.remove('is-opening');layer.classList.add('is-open');content.inert=false;closeButton.tabIndex=0;if(focusOnReveal===slot){$('.open-case',card)?.focus({preventScroll:true});focusOnReveal=null;}}};
  const openingGeneration=generation;requestAnimationFrame(()=>{if(active===slot&&generation===openingGeneration){layer.classList.add('is-dimmed');rectStyle(final);if(reduced.matches)reveal();}});
  if(!reduced.matches)later(reveal,390);
 }
 function retain(){
  if(!active||coarse.matches)return;
  const focused=card.contains(document.activeElement)||active.contains(document.activeElement);
  if(focused||(inPreviewBridge(pointer,active.getBoundingClientRect(),card.getBoundingClientRect())||inPreviewBridge(pointer,active.getBoundingClientRect(),destination))){clearTimeout(leave);return;}
  clearTimeout(leave);leave=setTimeout(()=>{if(active&&!card.contains(document.activeElement)&&!active.contains(document.activeElement)&&!(inPreviewBridge(pointer,active.getBoundingClientRect(),card.getBoundingClientRect())||inPreviewBridge(pointer,active.getBoundingClientRect(),destination)))close();},190);
 }
 for(const slot of slots){
  sourceLink(slot).setAttribute('aria-controls','case-preview');sourceLink(slot).setAttribute('aria-expanded','false');
  slot.addEventListener('pointerenter',ev=>{if(ev.pointerType==='mouse'&&!coarse.matches){clearTimeout(intent);intent=setTimeout(()=>open(slot),active?130:55);}});
  slot.addEventListener('pointerleave',ev=>{if(ev.pointerType==='mouse'){clearTimeout(intent);pointer={x:ev.clientX,y:ev.clientY};retain();}});
  sourceLink(slot).addEventListener('focus',()=>open(slot));
  sourceLink(slot).addEventListener('click',ev=>{if(coarse.matches||ev.pointerType==='touch'){ev.preventDefault();open(slot);}else onNavigate();});
  sourceLink(slot).addEventListener('keydown',ev=>{if(ev.key==='Tab'&&!ev.shiftKey&&active===slot){ev.preventDefault();if(layer.classList.contains('is-open'))$('.open-case',card)?.focus({preventScroll:true});else focusOnReveal=slot;}});
 }
 document.addEventListener('pointermove',ev=>{if(ev.pointerType==='mouse'){pointer={x:ev.clientX,y:ev.clientY};retain();}},{passive:true});
 document.addEventListener('pointerdown',ev=>{if(active&&!card.contains(ev.target)&&!active.contains(ev.target))close();},{capture:true});
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&active){ev.preventDefault();close({focus:true});}});
 document.addEventListener('focusin',ev=>{if(active&&!card.contains(ev.target)&&!active.contains(ev.target)&&!slots.some(s=>s.contains(ev.target)))close();});
 card.addEventListener('keydown',ev=>{if(ev.key==='Tab'&&ev.shiftKey&&ev.target===closeButton&&active){ev.preventDefault();suppress=true;sourceLink(active).focus({preventScroll:true});queueMicrotask(()=>{suppress=false;});}});
 card.addEventListener('click',ev=>{if(ev.target.closest('.open-case'))onNavigate();});
 closeButton.addEventListener('click',()=>close({focus:true}));
 return{close,refresh(){if(active){const slot=active,hadFocus=card.contains(document.activeElement);open(slot,{refresh:true});if(hadFocus)focusOnReveal=slot;}},get active(){return active;}};
}
