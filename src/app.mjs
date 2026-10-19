import {END,WORK,clamp,smooth,interval,sceneAt,sceneSVG,previewRect} from './geometry.mjs';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const slots=$$('.case-slot');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const coarse=matchMedia('(hover: none)');
let active=null, motion=false, state=null, suppressFocus=false;
let closeForScroll=()=>{};
const readSession=key=>{try{return JSON.parse(sessionStorage.getItem(key));}catch{return null;}};
const writeSession=(key,value)=>{try{sessionStorage.setItem(key,JSON.stringify(value));}catch{/* Storage is optional. */}};

function closePreview({focus=false}={}){
  if(!active)return;
  const previous=active;active=null;
  previous.classList.remove('is-open');
  $('.case-window',previous).setAttribute('aria-expanded','false');
  $('.case-preview',previous).inert=true;
  if(focus){suppressFocus=true;$('.case-window',previous).focus({preventScroll:true});queueMicrotask(()=>{suppressFocus=false;});}
}
function openPreview(slot){
  if(suppressFocus || (motion && (!state || state.u<5.13 || state.u>=6.15)))return;
  if(active!==slot)closePreview();
  const box=slot.getBoundingClientRect();
  const p=previewRect({x:box.x+box.width/2,y:box.y+box.height/2},innerWidth,innerHeight);
  slot.style.setProperty('--pw',`${p.width}px`);slot.style.setProperty('--ph',`${p.height}px`);
  slot.style.setProperty('--px',`${p.x-box.x}px`);slot.style.setProperty('--py',`${p.y-box.y}px`);
  active=slot;$('.case-preview',slot).inert=false;$('.case-window',slot).setAttribute('aria-expanded','true');slot.classList.add('is-open');
}
for(const slot of slots){
  slot.addEventListener('pointerenter',ev=>{if(ev.pointerType==='mouse'&&!coarse.matches)openPreview(slot);});
  slot.addEventListener('pointerleave',ev=>{if(ev.pointerType==='mouse'&&!slot.contains(document.activeElement))closePreview();});
  slot.addEventListener('focusin',()=>openPreview(slot));
  slot.addEventListener('focusout',ev=>{if(!slot.contains(ev.relatedTarget))closePreview();});
  $('.case-window',slot).addEventListener('click',ev=>{
    if(coarse.matches || ev.pointerType==='touch'){ev.preventDefault();openPreview(slot);}
  });
}
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&active){ev.preventDefault();closePreview({focus:true});}});
document.addEventListener('pointerdown',ev=>{if(active&&!active.contains(ev.target))closePreview();});
addEventListener('resize',()=>closePreview(),{passive:true});
$$('[data-return]').forEach(a=>a.addEventListener('click',()=>writeSession('portfolio:return',true)));

const journey=$('.journey');
if(journey){
  const svg=$('.scene'),intro=$('.intro'),skills=$('.skills'),work=$('.work-zone');
  const caption=$('.scene-caption'),captionTitle=$('h2',caption),captionEye=$('.eyebrow',caption),captionBody=$('p',caption);
  const stageLabel=$('.stage-label'),scrollCue=$('.scroll-cue');
  let w=innerWidth,h=innerHeight,unit=h,start=0,target=0,current=0,raf=0,lastTime=0,lastScroll=0,resizeTimer=0;
  const phaseLabels=['THE STARTING POINT','A SHARED DIRECTION','READY FOR TAKEOFF','A CHANGE OF PERSPECTIVE','SELECTED WORK','UNDER THE WING','A DIFFERENT PERSPECTIVE','BEYOND THE WORK'];
  const captions={
    1:['CONNECTED COMPETENCIES','One product path.','Complementary skills, brought together.'],
    2:['A SHARED DIRECTION','Ready for takeoff.',''],
    3:['A CHANGE OF PERSPECTIVE','From the big picture<br>to the details.',''],
    5:['UNDER THE WING','There’s more to the story.',''],
    6:['A DIFFERENT PERSPECTIVE','The person behind the process.','']
  };
  function reset(){
    motion=false;cancelAnimationFrame(raf);raf=0;state=null;closePreview();
    journey.classList.remove('motion-ready','scene-retired');document.documentElement.classList.remove('motion-enabled');
    journey.removeAttribute('style');intro.removeAttribute('style');intro.inert=false;skills.removeAttribute('style');work.removeAttribute('style');work.inert=false;
    slots.forEach(x=>{x.removeAttribute('style');x.inert=false;});
  }
  function measure(preserve=false){
    const oldW=w,oldH=h,oldU=target;
    w=document.documentElement.clientWidth;h=innerHeight;
    unit=h*(w<640?1.08:1);
    start=journey.getBoundingClientRect().top+scrollY;
    journey.style.setProperty('--stage-height',`${h}px`);
    journey.style.setProperty('--journey-height',`${h+unit*END}px`);
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    if(preserve && current>0 && current<END && (Math.abs(w-oldW)>40 || Math.abs(h-oldH)>150)){
      scrollTo({top:start+oldU*unit,behavior:'instant'});
    }
    target=clamp((scrollY-start)/unit,0,END);current=target;paint();
  }
  function paint(){
    state=sceneAt(current,w,h);
    const u=state.u;
    const windowAlpha=smooth(interval(u,4.78,5.15))*(1-smooth(interval(u,6.15,6.55)));
    svg.innerHTML=sceneSVG(state,{windowOutlines:true,windowOpacity:1-windowAlpha});
    intro.style.opacity=1-smooth(interval(u,0,.55));
    intro.style.pointerEvents=u<.25?'auto':'none';intro.inert=u>=.4;
    skills.style.opacity=1-smooth(interval(u,.02,.65));
    work.style.opacity=windowAlpha;
    const workActive=u>=5.13 && u<6.15;
    work.style.pointerEvents=workActive?'auto':'none';work.inert=!workActive;
    state.windows.forEach((win,i)=>{
      const slot=slots[i];
      slot.style.left=`${win.x-win.width/2}px`;slot.style.top=`${win.y-win.height/2}px`;
      slot.style.width=`${win.width}px`;slot.style.height=`${win.height}px`;
    });
    if(!workActive)closePreview();
    const cap=captions[state.state];
    let alpha=0;
    if(cap){
      if(state.state===1)alpha=smooth(interval(u,.45,.8));
      if(state.state===2)alpha=1;
      if(state.state===3)alpha=1-smooth(interval(u,2.9,3.35));
      if(state.state===5)alpha=smooth(interval(u,6.45,6.95));
      if(state.state===6)alpha=1-smooth(interval(u,9.0,9.55));
      captionEye.textContent=cap[0];captionTitle.innerHTML=cap[1];captionBody.textContent=cap[2];
    }
    caption.style.opacity=alpha;
    stageLabel.textContent=`0${state.state+1} — ${phaseLabels[state.state]}`;
    scrollCue.style.opacity=state.state===4?0:1;
    journey.style.setProperty('--progress',u/END);
    journey.classList.toggle('scene-retired',u>=END-.001);
  }
  function failed(error){reset();console.warn('Showing the static portfolio because the enhanced journey is unavailable.',error);}
  function frame(now){
    raf=0;
    try{
      const dt=Math.min(64,now-(lastTime||now-16));lastTime=now;
      if(Math.abs(target-current)>1.2 || now-lastScroll>140)current=target;
      else current+=(target-current)*(1-Math.exp(-dt/45));
      if(Math.abs(target-current)<.00015)current=target;
      paint();
      if(current!==target)raf=requestAnimationFrame(frame);
    }catch(error){failed(error);}
  }
  function queue(instant=false){
    if(!motion)return;
    target=clamp((scrollY-start)/unit,0,END);lastScroll=performance.now();
    if(instant)current=target;
    if(!raf)raf=requestAnimationFrame(frame);
  }
  function jump(u,focus=false){
    closePreview();
    scrollTo({top:start+u*unit,behavior:'instant'});target=current=u;queue(true);
    if(focus){const title=$('#work-title');title.tabIndex=-1;title.focus({preventScroll:true});}
  }
  function restore(){
    const nav=performance.getEntriesByType('navigation')[0];
    const returning=readSession('portfolio:return') || nav?.type==='back_forward';
    const saved=readSession('portfolio:work');writeSession('portfolio:return',false);
    if(returning&&saved&&saved.u>=5.13&&saved.u<6.15){jump(saved.u);return;}
    if(location.hash==='#work'){jump(WORK);return;}
    if(location.hash && location.hash!=='#top'){
      const el=document.getElementById(location.hash.slice(1));if(el)el.scrollIntoView({behavior:'instant'});queue(true);
    }
  }
  function setup(){
    if(reduced.matches){reset();return;}
    try{
      motion=true;journey.classList.add('motion-ready');document.documentElement.classList.add('motion-enabled');
      measure();requestAnimationFrame(restore);
    }catch(error){failed(error);}
  }
  addEventListener('scroll',()=>{if(motion)queue();closeForScroll();},{passive:true});
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(motion)try{measure(true);}catch(error){failed(error);}},120);},{passive:true});
  addEventListener('pageshow',ev=>{closePreview();if(motion){if(ev.persisted){measure();queue(true);}else queue();}});
  $$('[data-work]').forEach(a=>a.addEventListener('click',ev=>{
    if(!motion)return;ev.preventDefault();history.pushState(null,'','#work');jump(WORK,true);
  }));
  addEventListener('hashchange',()=>{if(motion && location.hash==='#work')jump(WORK);});
  for(const link of $$('a[href^="cases/"]'))link.addEventListener('click',()=>{
    if(motion)writeSession('portfolio:work',{u:clamp(target,5.15,6.14)});closePreview();
  });
  reduced.addEventListener('change',()=>{const atWork=state?.state===4;setup();if(!motion&&atWork)work.scrollIntoView({behavior:'instant'});});
  setup();
}
