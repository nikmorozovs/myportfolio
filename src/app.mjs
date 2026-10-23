import {END,PHASE,clamp,smooth,interval,sceneAt,sceneSVG,routeMapSVG,scrollUnit} from './geometry.mjs';
import {workProgress,aboutTrack,sectionTarget} from './layout.mjs';
import {ScrollNavigator,bindNavigationInterrupts} from './navigation.mjs';
import {mountParticles} from './particles.mjs';
import {mountRouteMotion} from './route-motion.mjs';
import {mountPreviews} from './preview.mjs';
import {getAircraft,cabinPatternVisible} from './aircraft.mjs';
import {mountCarousel} from './carousel.mjs';
import {mountCompetencies} from './competencies.mjs';
import {headingHTML,metricValue} from './content.mjs';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const siteData=$('#site-data'),content=siteData?JSON.parse(siteData.textContent):null;
// Refresh only the experience value once per page load; preserve its suffix/label.
const experience=$('[data-metric="experience"] dt');
if(content?.experience&&experience)experience.firstChild.nodeValue=metricValue(content.experience);
const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)'),journey=$('.journey'),header=$('.site-header');
const read=key=>{try{return JSON.parse(sessionStorage.getItem(key));}catch{return null;}};
const write=(key,value)=>{try{sessionStorage.setItem(key,JSON.stringify(value));}catch{}};
$$('[data-return]').forEach(a=>a.addEventListener('click',()=>write('portfolio:return',true)));
let motion=false,state=null,w=0,h=0,headerHeight=0,safeBottom=0,unit=1,start=0,target=0,basisHeight=0,raf=0,resizeTimer=0,reading=null,modelsQueued=false;
const svg=$('.scene'),world=$('.intro-world'),route=$('.route-map'),intro=$('.intro'),skills=$('.skills'),work=$('.work-zone'),track=$('.about-track'),about=$('#about');
let aircraftGroup=null,particles=null,previews=null,carousel=null,competencies=null,routeMotion=null;
const maxScroll=()=>Math.max(0,root.scrollHeight-innerHeight);
const documentTop=el=>el.getBoundingClientRect().top+scrollY;
function resolveTarget(id){
 if(id==='top')return 0;
 if(id==='work'&&motion)return clamp(start+workProgress({height:h,headerHeight})*unit,0,maxScroll());
 const el=id==='about'&&track?track:document.getElementById(id);
 return el?sectionTarget(documentTop(el),headerHeight,maxScroll()):NaN;
}
function focusTarget(id){
 const el=document.getElementById(id);if(!el)return;const node=id==='work'?$('#work-title'):el.matches('h1,h2,h3')?el:$('h1,h2',el)||el;
 node.tabIndex=-1;node.focus({preventScroll:true});
}
const scrollNav=new ScrollNavigator({getPosition:()=>scrollY,setPosition:y=>scrollTo({top:y,behavior:'auto'}),resolveTarget,getHeight:()=>h,reduced:()=>reduced.matches,onPosition:()=>queue(),onFinish:(id,focus)=>{if(focus)requestAnimationFrame(()=>focusTarget(id));}});
bindNavigationInterrupts(scrollNav,document);
if(journey){
 routeMotion=mountRouteMotion({route,world});
 particles=mountParticles($('.flight-particles'),{onOffset:offset=>{if(aircraftGroup)aircraftGroup.setAttribute('transform',`translate(${offset[0].toFixed(3)} ${offset[1].toFixed(3)})`);}});
 const remember=id=>{if(motion)write('portfolio:work',{u:clamp(target,PHASE.hold+.1,PHASE.pan-.1),carousel:carousel.position,projectId:id});};
 carousel=mountCarousel({root:$('.case-carousel'),projects:content.cases,ui:content.ui,canMove:()=>!previews?.isOpen,reduced:()=>reduced.matches});
 previews=mountPreviews({root:work,layer:$('.preview-layer'),projects:content.cases,ui:content.ui,canOpen:()=>!motion||!!state?.caseReady,onNavigate:remember,getViewport:()=>({width:w,height:h,headerHeight,safeBottom}),getOrigin:id=>carousel.getOrigin(id),onSelectionChange:open=>carousel.setLocked(open),isActivationSuppressed:event=>carousel.isActivationSuppressed(event)});
 competencies=mountCompetencies({root:skills,getViewport:()=>({width:w,height:h})});
}
function paint(){
 if(!motion)return;
 state=sceneAt(target,w,h,{unit});
 world.style.transform=`translate3d(0,${-state.travel}px,0)`;
 carousel.setState(state);if(carousel.phase&&!state.caseReady)carousel.normalizeWhenHidden(!cabinPatternVisible(state));
 svg.innerHTML=sceneSVG(state,{hideCabinWindows:state.caseReady,windowPhase:carousel.phase});aircraftGroup=$('.aircraft-motion',svg);
 intro.inert=state.travel>h;intro.style.pointerEvents=state.travel>h?'none':'auto';
 work.style.opacity=1;work.inert=!state.caseReady;work.style.pointerEvents=state.caseReady?'auto':'none';
 $('.work-heading').style.opacity=smooth(interval(target,PHASE.hold-.35,PHASE.hold))*(1-smooth(interval(target,PHASE.pan,PHASE.pan+.2)));
 $('.case-carousel').style.visibility=state.caseReady?'visible':'hidden';$('.work-hint').style.opacity=state.caseReady?1:0;
 previews.setSectionVisible(state.caseReady);competencies.setVisible(state.state===0);
 const perspective=content.scenes.perspective,caption=$('.scene-caption'),inPerspective=state.state===3;
 $('.eyebrow',caption).textContent=inPerspective?perspective.eyebrow:'';$('h2',caption).innerHTML=inPerspective?headingHTML(perspective.title):'';caption.style.opacity=inPerspective?1-smooth(interval(target,PHASE.zoom-.6,PHASE.zoom)):0;
 const chapter=target>=PHASE.fade?7:target>=PHASE.orbit?6:state.state;
 $('.stage-label').textContent=`0${chapter+1} — ${content.scenes.chapters[chapter]}`;$('.scroll-cue').style.opacity=state.caseReady?0:1;
 journey.dataset.state=`S${state.state}`;journey.style.setProperty('--progress',target/END);journey.classList.toggle('scene-retired',target>=END);
 particles.setState(state);
}
function updateReadingState(){
 if(!track||!reading)return;const top=documentTop(track),begin=top-reading.stickyTop,end=begin+reading.reserve;
 track.dataset.reading=motion&&scrollY>=begin&&scrollY<=end?'hold':'flow';
}
function updateStaticSections(){
 if(!journey||motion)return;
 const row=$('.carousel-viewport').getBoundingClientRect(),visible=row.bottom>headerHeight&&row.top<h;
 carousel.setSectionVisible(visible);previews.setSectionVisible(visible);
 const headings=$$('.competency-toggle').map(el=>el.getBoundingClientRect());competencies.setVisible(headings.some(r=>r.bottom>headerHeight&&r.top<h));
}
function queue(){
 if(motion){target=clamp((scrollY-start)/unit,0,END);}
 if(!raf)raf=requestAnimationFrame(()=>{raf=0;try{paint();updateStaticSections();updateReadingState();}catch(error){failed(error);}});
}
function reset(){
 routeMotion?.stop();scrollNav.cancel();motion=false;cancelAnimationFrame(raf);raf=0;previews?.setSectionVisible(false);competencies?.close();particles?.stop();aircraftGroup=null;
 root.classList.remove('motion-enabled');
 if(!journey)return;
 journey.classList.remove('motion-ready','scene-retired');journey.removeAttribute('style');
 for(const el of [world,route,skills,intro,work,$('.work-heading'),$('.case-windows'),$('.work-hint'),$('.case-carousel')])el.removeAttribute('style');
 intro.inert=false;work.inert=false;
}
function failed(error){reset();root.classList.add('scene-error');console.warn('The static portfolio remains available.',error);}
function measure(preserve=false){
 const oldW=w,oldH=h,old=target,wasNavigating=!!scrollNav.active;
 w=root.clientWidth;h=Math.round(globalThis.visualViewport?.scale===1?visualViewport.height:innerHeight);
 const orientation=Math.abs(w-oldW)>40||Math.abs(h-oldH)>200;
 if(!basisHeight||orientation)basisHeight=h;
 unit=scrollUnit(w,basisHeight);
 root.style.setProperty('--viewport-height',`${h}px`);root.style.setProperty('--scrollport-height',`${Math.max(h,innerHeight,root.clientHeight)}px`);
 headerHeight=header?.getBoundingClientRect().height||0;safeBottom=parseFloat(getComputedStyle(root).getPropertyValue('--safe-bottom'))||0;
 if(motion){
  start=documentTop(journey);journey.style.setProperty('--stage-height',`${h}px`);journey.style.setProperty('--journey-height',`${h+END*unit}px`);
  const layout=sceneAt(0,w,h,{unit}).intro;world.style.height=`${layout.worldHeight}px`;route.setAttribute('viewBox',`0 0 ${w} ${layout.worldHeight}`);route.style.height=`${layout.worldHeight}px`;route.innerHTML=routeMapSVG(w,h,unit);skills.style.top=`${layout.labelsY}px`;const ready=$('.ready-heading');ready.style.top=`${layout.readyY}px`;ready.style.width=`${layout.readyWidth}px`;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);routeMotion?.refresh();
 }
 if(track&&about){reading=aboutTrack({viewportHeight:h,headerHeight,contentHeight:about.getBoundingClientRect().height});track.style.setProperty('--about-track-height',`${reading.trackHeight}px`);track.style.setProperty('--about-pin-top',`${reading.stickyTop}px`);}
 if(preserve&&orientation&&motion&&old>0&&old<END&&!wasNavigating)scrollTo({top:start+old*unit,behavior:'auto'});
 if(journey&&!motion){carousel.setState(null);updateStaticSections();}
 target=clamp((scrollY-start)/unit,0,END);paint();updateReadingState();previews?.refresh();competencies?.refresh();particles?.rebase();
 if(wasNavigating&&orientation)scrollNav.retarget();
}
function setup(){
 if(!journey){measure();return;}
 if(reduced.matches){reset();measure();return;}
 try{
  motion=true;journey.classList.add('motion-ready');root.classList.add('motion-enabled');measure();
  if(!modelsQueued){modelsQueued=true;const idle=globalThis.requestIdleCallback?fn=>requestIdleCallback(fn,{timeout:1200}):fn=>setTimeout(fn,60);idle(()=>{getAircraft('overview');idle(()=>getAircraft('detail'));});}
 }catch(error){failed(error);}
}
function restore(){
 const back=read('portfolio:return')||performance.getEntriesByType('navigation')[0]?.type==='back_forward',saved=read('portfolio:work');write('portfolio:return',false);
 if(motion&&back&&location.hash==='#work'&&saved?.u>=PHASE.hold&&saved.u<PHASE.pan){carousel.restore(saved.carousel||0);previews.restoreSelected(saved.projectId||null);scrollTo({top:start+clamp(saved.u,PHASE.hold+.25,PHASE.pan-.5)*unit,behavior:'auto'});queue();return;}
 if(location.hash)scrollNav.go(decodeURIComponent(location.hash.slice(1)),{instant:true,focus:false});
}
$$('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
 if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const hash=link.getAttribute('href'),id=decodeURIComponent(hash.slice(1));if(!id||!Number.isFinite(resolveTarget(id)))return;
 event.preventDefault();if(location.hash!==hash)history.pushState(null,'',hash);scrollNav.go(id);
}));
addEventListener('scroll',queue,{passive:true});
const resized=()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{try{measure(true);}catch(error){failed(error);}},100);};
addEventListener('resize',resized,{passive:true});globalThis.visualViewport?.addEventListener('resize',resized,{passive:true});
addEventListener('pageshow',event=>{if(event.persisted)measure();queue();});
addEventListener('hashchange',()=>{if(location.hash)scrollNav.go(decodeURIComponent(location.hash.slice(1)),{instant:true,focus:false});});
reduced.addEventListener('change',()=>{const atWork=state?.caseReady;scrollNav.cancel();setup();if(atWork)scrollNav.go('work',{instant:true,focus:false});});
setup();requestAnimationFrame(restore);
document.fonts?.ready.then(()=>{try{measure(true);}catch(error){failed(error);}});
