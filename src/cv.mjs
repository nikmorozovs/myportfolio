import {experienceSince,LEVELS} from './cv-state.mjs';
import {random,makeZones,stepZones} from './cloud-layout.mjs';
import {makeElasticTopology,elasticGeometry} from './cloud-elastic.mjs';
const source=document.querySelector('#cv-data');
if(source){
 const skills=JSON.parse(source.textContent),now=new Date(),reduced=matchMedia('(prefers-reduced-motion: reduce)'),cloud=document.querySelector('.skill-cloud'),selector=document.querySelector('#skill-category'),enhancement=document.querySelector('.cloud-enhancement');enhancement.hidden=false;
 let nodes=[],selected=null,width=0,height=0,raf=0,last=0,visible=false,destroyed=false,network=null,svg=null,layoutWidth=0,elapsed=0,rootPath=null,branchPaths=[];
 const paint=()=>nodes.forEach(n=>{n.el.style.transform=`translate(${n.x-n.w/2}px,${n.y-n.h/2}px)`;});
 function renderNetwork(){
  if(!svg||!network)return;
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  svg.replaceChildren();
  const makePath=(klass,opacity)=>{
   const el=document.createElementNS('http://www.w3.org/2000/svg','path');
   el.setAttribute('class',klass);el.setAttribute('opacity',opacity);el.setAttribute('fill','none');svg.append(el);return el;
  };
  rootPath=makePath('network-root','.62');
  branchPaths=nodes.map((n,i)=>makePath('network-branch',String(.43+(i%3)*.09)));
  paintNetwork();
 }
 function paintNetwork(){
  if(!network||!rootPath)return;
  const geometry=elasticGeometry(network,nodes,elapsed);
  rootPath.setAttribute('d',geometry.root);
  geometry.links.forEach((link,i)=>branchPaths[i]?.setAttribute('d',link.d));
 }
 function measureNode(n){
  n.el.classList.remove('selected','secondary');n.el.querySelector('small').hidden=true;
  const base=n.el.getBoundingClientRect();n.w=base.width;n.h=base.height;
  n.el.classList.add('selected');n.el.querySelector('small').hidden=false;
  const active=n.el.getBoundingClientRect();
  n.maxW=Math.max(base.width,active.width)+16;n.maxH=Math.max(base.height,active.height)+16;
  n.el.classList.remove('selected');n.el.querySelector('small').hidden=true;
 }
 function applySelection(){
  for(const n of nodes){n.selected=n===selected;n.el.classList.toggle('selected',n.selected);n.el.classList.toggle('secondary',!!selected&&!n.selected);n.el.setAttribute('aria-pressed',String(n.selected));n.el.querySelector('small').hidden=!n.selected;}
  // Retain the centre of each zone even when an active label expands.
  for(const n of nodes){const r=n.el.getBoundingClientRect();n.w=r.width;n.h=r.height;}
  paint();paintNetwork();
 }
 function place(){
  width=cloud.clientWidth;if(!width)return;
  const columns=width<540?2:width<850?2:3, gap=width<540?14:22, pad=width<540?8:20;
  const cell=(width-2*pad-gap*(columns-1))/columns;
  nodes.forEach(n=>{n.el.style.maxWidth=Math.max(70,cell-28)+'px';measureNode(n);});
  const seed=[...selector.value].reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),101);
  const layout=makeZones(nodes,width,seed);height=layout.height;cloud.style.height=height+'px';
  const rng=random(seed+29);
  for(const n of nodes){n.zone=layout.zones.get(n.id);n.x=n.zone.x+n.zone.w/2;n.y=n.zone.y+n.zone.h/2;const angle=rng()*Math.PI*2;n.vx=Math.cos(angle)*6;n.vy=Math.sin(angle)*6;n.speed=6;}
  network=makeElasticTopology(nodes,width,height,seed+17);renderNetwork();layoutWidth=width;applySelection();
 }
 function choose(n){selected=n;applySelection();paintNetwork();document.querySelector('#skill-announcement').textContent=n?`${n.skill}, ${experienceSince(n.start_date,now)}`:'';}
 function frame(time){raf=0;if(!visible||document.hidden||destroyed||reduced.matches)return;stepZones(nodes,last?(time-last)/1000:0);last=time;elapsed+=last?Math.min(.05,(time-last)/1000):0;paint();paintNetwork();raf=requestAnimationFrame(frame);}
 function start(){if(!raf&&visible&&!document.hidden&&!reduced.matches&&!destroyed){last=0;raf=requestAnimationFrame(frame);}}
 function load(){cancelAnimationFrame(raf);raf=0;selected=null;cloud.replaceChildren();
  svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('skill-network');svg.setAttribute('aria-hidden','true');cloud.append(svg);
  nodes=skills.filter(s=>s.category===selector.value).map((s,i)=>{const el=document.createElement('button');el.type='button';el.className='floating-skill';el.dataset.priority=s.priority;el.innerHTML='<span></span><small hidden></small>';el.querySelector('span').textContent=s.skill;el.querySelector('small').textContent=experienceSince(s.start_date,now);el.setAttribute('aria-label',`${s.skill}, ${s.priority} priority, ${experienceSince(s.start_date,now)}`);cloud.append(el);
   const n={...s,el,x:0,y:0,vx:0,vy:0,speed:6,w:0,h:0,maxW:0,maxH:0,zone:null};
   el.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&selected!==n)choose(n);});
   el.addEventListener('focus',()=>{if(el.matches(':focus-visible'))choose(n);});
   el.addEventListener('click',e=>{choose(e.detail===0?n:selected===n?null:n);});
   el.addEventListener('keydown',e=>{if(e.key==='Escape'){choose(null);el.blur();}});return n;
  });place();start();
 }
 cloud.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!selected)return;const r=selected.el.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)choose(null);});
 cloud.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')choose(null);});cloud.addEventListener('focusout',e=>{if(!cloud.contains(e.relatedTarget))choose(null);});
 document.addEventListener('pointerdown',e=>{if(selected&&!selected.el.contains(e.target)&&e.pointerType!=='mouse')choose(null);});
 selector.addEventListener('change',load);
 const resize=new ResizeObserver(()=>{if(Math.abs(cloud.clientWidth-layoutWidth)>10)place();});resize.observe(cloud);
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(raf);raf=0;last=0;}},{rootMargin:'50px'});observer.observe(cloud);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else start();});
 reduced.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;start();});
 document.fonts.ready.then(()=>{if(!destroyed)place();});load();
 const languages=document.querySelector('#languages');let played=false;const gauges=[...languages.querySelectorAll('.language-gauge')];
 function finish(){gauges.forEach(g=>g.querySelectorAll('.gauge-segment').forEach((p,i)=>p.classList.toggle('active',i<LEVELS[g.dataset.level])));}
 if(!reduced.matches){gauges.forEach(g=>g.querySelectorAll('.active').forEach(p=>p.classList.remove('active')));const io=new IntersectionObserver(entries=>{if(played||!entries.some(e=>e.isIntersecting))return;played=true;io.disconnect();const begin=performance.now();function tick(t){const progress=Math.min(1,(t-begin)/1500),eased=1-(1-progress)**3;gauges.forEach(g=>g.querySelectorAll('.gauge-segment').forEach((p,i)=>p.classList.toggle('active',i<Math.floor(eased*LEVELS[g.dataset.level]))));if(progress<1&&!reduced.matches)requestAnimationFrame(tick);else finish();}requestAnimationFrame(tick);},{threshold:.3});io.observe(languages);reduced.addEventListener('change',()=>{if(reduced.matches){played=true;io.disconnect();finish();}});}
 document.querySelector('.cv-download').addEventListener('keydown',e=>{if(e.key==='Escape'){e.currentTarget.open=false;e.currentTarget.querySelector('summary').focus();}});
 addEventListener('pagehide',()=>{destroyed=true;cancelAnimationFrame(raf);resize.disconnect();observer.disconnect();});addEventListener('pageshow',e=>{if(e.persisted){destroyed=false;resize.observe(cloud);observer.observe(cloud);start();}});
}
