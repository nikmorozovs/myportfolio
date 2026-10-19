import {END,WORK,PHASE,clamp,smooth,interval,sceneAt,sceneSVG,routeMapSVG,scrollUnit} from './geometry.mjs';
import {mountParticles} from './particles.mjs';
import {mountPreviews} from './preview.mjs';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),journey=$('.journey');
const read=key=>{try{return JSON.parse(sessionStorage.getItem(key));}catch{return null;}};
const write=(key,v)=>{try{sessionStorage.setItem(key,JSON.stringify(v));}catch{}};
$$('[data-return]').forEach(a=>a.addEventListener('click',()=>write('portfolio:return',true)));
if(journey){
 const svg=$('.scene'),world=$('.intro-world'),route=$('.route-map'),intro=$('.intro'),skills=$('.skills'),work=$('.work-zone'),slots=$$('.case-slot');
 const heading=$('.work-heading'),windows=$('.case-windows'),hint=$('.work-hint'),caption=$('.scene-caption'),footer=$('.stage-label');
 const particles=mountParticles($('.flight-particles'));
 let motion=false,state=null,w=innerWidth,h=innerHeight,unit=h,start=0,target=0,raf=0,resizeTimer=0;
 const remember=()=>{if(motion)write('portfolio:work',{u:clamp(target,PHASE.hold,PHASE.pan-.1)});setTimeout(()=>previews.close({immediate:true}),0);};
 const previews=mountPreviews({slots,layer:$('.preview-layer'),canOpen:()=>!motion||(!!state?.caseReady&&target<PHASE.pan-.08),onNavigate:remember});
 const names=['THE STARTING POINT','CONNECTED COMPETENCIES','READY FOR TAKEOFF','A CHANGE OF PERSPECTIVE','SELECTED WORK','UNDER THE WING','A DIFFERENT PERSPECTIVE','BEYOND THE WORK'];
 function paint(){
  state=sceneAt(target,w,h);
  // Text, labels and route are children of this same translated world element.
  world.style.transform=`translate3d(0,${-state.travel}px,0)`;
  svg.innerHTML=sceneSVG(state,{hideCaseWindows:state.caseReady});
  intro.inert=state.travel>h;intro.style.pointerEvents=state.travel>h?'none':'auto';
  work.style.opacity=1;work.inert=!state.caseReady;work.style.pointerEvents=state.caseReady?'auto':'none';
  heading.style.opacity=smooth(interval(target,PHASE.hold-.35,PHASE.hold))*(1-smooth(interval(target,PHASE.pan-.1,PHASE.pan)));
  windows.style.visibility=state.caseReady?'visible':'hidden';hint.style.opacity=state.caseReady?1:0;
  for(let i=0;i<4;i++){const p=state.windows[i],slot=slots[i];slot.style.left=`${p.x-p.width/2}px`;slot.style.top=`${p.y-p.height/2}px`;slot.style.width=`${p.width}px`;slot.style.height=`${p.height}px`;slot.classList.toggle('mini',p.width<42);}
  if(!state.caseReady)previews.close({immediate:true});
  let label='',title='',alpha=0;
  if(state.state===2){label='A SHARED DIRECTION';title='Ready for takeoff.';alpha=smooth(interval(target,PHASE.turn-.4,PHASE.turn));}
  if(state.state===3){label='A CHANGE OF PERSPECTIVE';title='From the big picture<br>to the details.';alpha=1-smooth(interval(target,PHASE.zoom-.6,PHASE.zoom));}
  $('.eyebrow',caption).textContent=label;$('h2',caption).innerHTML=title;$('p',caption).textContent='';caption.style.opacity=alpha;
  footer.textContent=`0${state.state+1} — ${names[state.state]}`;$('.scroll-cue').style.opacity=state.caseReady?0:1;
  journey.style.setProperty('--progress',target/END);journey.classList.toggle('scene-retired',target>=END);
  particles.setState(state);
 }
 function reset(){
  motion=false;cancelAnimationFrame(raf);raf=0;previews.close({immediate:true});particles.stop();
  document.documentElement.classList.remove('motion-enabled');journey.classList.remove('motion-ready','scene-retired');journey.removeAttribute('style');world.removeAttribute('style');route.removeAttribute('style');skills.removeAttribute('style');intro.inert=false;intro.removeAttribute('style');work.inert=false;work.removeAttribute('style');heading.removeAttribute('style');windows.removeAttribute('style');hint.removeAttribute('style');slots.forEach(s=>s.removeAttribute('style'));
 }
 function failed(error){reset();console.warn('The static portfolio remains available.',error);}
 function queue(){
  if(!motion)return;target=clamp((scrollY-start)/unit,0,END);
  // Leaving a reading interval immediately disables a displaced preview.
  if(target<PHASE.hold||target>=PHASE.pan)previews.close({immediate:true});
  else if(target>PHASE.pan-.08)previews.close();
  if(!raf)raf=requestAnimationFrame(()=>{raf=0;try{paint();}catch(e){failed(e);}});
 }
 function jump(u,focus=false){previews.close({immediate:true});target=u;scrollTo({top:start+u*unit,behavior:'instant'});paint();if(focus){const t=$('#work-title');t.tabIndex=-1;t.focus({preventScroll:true});}}
 function measure(preserve=false){
  const oldW=w,oldH=h,old=target;w=document.documentElement.clientWidth;h=innerHeight;unit=scrollUnit(w,h);start=journey.getBoundingClientRect().top+scrollY;
  journey.style.setProperty('--stage-height',`${h}px`);journey.style.setProperty('--journey-height',`${h+END*unit}px`);
  const layout=sceneAt(0,w,h).intro;world.style.height=`${layout.worldHeight}px`;route.setAttribute('viewBox',`0 0 ${w} ${layout.worldHeight}`);route.style.height=`${layout.worldHeight}px`;route.innerHTML=routeMapSVG(w,h);skills.style.top=`${layout.labelsY}px`;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  if(preserve&&old>0&&old<END&&(Math.abs(w-oldW)>40||Math.abs(h-oldH)>150))scrollTo({top:start+old*unit,behavior:'instant'});
  target=clamp((scrollY-start)/unit,0,END);paint();previews.refresh();
 }
 function restore(){
  const back=read('portfolio:return')||performance.getEntriesByType('navigation')[0]?.type==='back_forward',saved=read('portfolio:work');write('portfolio:return',false);
  if(back&&saved?.u>=PHASE.hold&&saved.u<PHASE.pan){jump(saved.u);return;}
  if(location.hash==='#work'){jump(WORK);return;}
  if(location.hash&&location.hash!=='#top'){document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior:'instant'});queue();}
 }
 function setup(){if(reduced.matches){reset();return;}try{motion=true;journey.classList.add('motion-ready');document.documentElement.classList.add('motion-enabled');measure();requestAnimationFrame(restore);}catch(e){failed(e);}}
 addEventListener('scroll',queue,{passive:true});
 addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(motion)try{measure(true);}catch(e){failed(e);}else previews.refresh();},120);},{passive:true});
 addEventListener('pageshow',ev=>{previews.close({immediate:true});if(motion){if(ev.persisted)measure();queue();}});
 $$('[data-work]').forEach(a=>a.addEventListener('click',ev=>{if(!motion)return;ev.preventDefault();history.pushState(null,'','#work');jump(WORK,true);}));
 addEventListener('hashchange',()=>{if(motion&&location.hash==='#work')jump(WORK);});
 reduced.addEventListener('change',()=>{const atWork=state?.caseReady;setup();if(!motion&&atWork)work.scrollIntoView({behavior:'instant'});});
 setup();
}
