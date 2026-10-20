import {previewRect} from './geometry.mjs';
import {formatText} from './content.mjs';
const $=(s,r=document)=>r.querySelector(s);
/** Project selection is independent of whether its S4 presentation is visible.
 * Only explicit activation opens a preview; pointer/focus departure does nothing. */
export function mountPreviews({root,layer,projects,ui,canOpen,onNavigate,getViewport,getOrigin,onSelectionChange=()=>{},isActivationSuppressed=()=>false}){
 const card=$('.preview-card',layer),content=$('.preview-content',card),closeButton=$('.preview-close',card),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const records=new Map(projects.map(p=>[p.id,p])),templates=new Map([...root.querySelectorAll('template[data-project-id]')].map(t=>[t.dataset.projectId,t]));
 let selected=null,closing=null,sectionVisible=false,generation=0,timers=[],rendered=null,focusOnReveal=false;
 const clear=()=>{generation++;for(const timer of timers)clearTimeout(timer);timers=[];};
 const later=(fn,ms)=>{const g=generation;timers.push(setTimeout(()=>{if(g===generation)fn();},ms));};
 const source=id=>getOrigin(id);
 const notify=()=>onSelectionChange(!!(selected||closing));
 const expanded=()=>{for(const button of root.querySelectorAll('.case-window'))button.setAttribute('aria-expanded',String(sectionVisible&&button.dataset.projectId===selected));};
 function rectStyle(r){card.style.left=`${r.left??r.x}px`;card.style.top=`${r.top??r.y}px`;card.style.width=`${r.width}px`;card.style.height=`${r.height}px`;}
 function hide(){clear();layer.hidden=true;card.inert=true;content.inert=true;layer.classList.remove('is-open','is-opening','is-closing','is-dimmed');closeButton.tabIndex=-1;}
 function finishClose(){hide();closing=null;notify();}
 function close({focus=false,immediate=false}={}){
  if(!selected&&!closing)return;const id=selected||closing;clear();selected=null;closing=id;focusOnReveal=false;expanded();notify();
  if(focus&&sectionVisible)source(id)?.focus({preventScroll:true});
  layer.classList.remove('is-open','is-opening','is-dimmed');layer.classList.add('is-closing');card.inert=true;content.inert=true;
  const collapse=()=>{const origin=source(id);if(origin)rectStyle(origin.getBoundingClientRect());};
  if(immediate||reduced.matches||!sectionVisible){collapse();finishClose();return;}
  later(collapse,85);later(finishClose,480);
 }
 function present({immediate=false,keyboard=false}={}){
  if(!selected||!sectionVisible||!canOpen())return;clear();const id=selected,project=records.get(id),origin=source(id);if(!origin)return;
  const wasVisible=!layer.hidden,from=wasVisible?card.getBoundingClientRect():origin.getBoundingClientRect(),viewport=getViewport();
  const final=previewRect(null,viewport.width,viewport.height,viewport);
  if(rendered!==id){content.replaceChildren(templates.get(id).content.cloneNode(true));rendered=id;}
  const copy=$('[data-full]',content);if(copy)copy.textContent=final.compact?copy.dataset.compact:copy.dataset.full;
  card.style.setProperty('--final-w',`${final.width}px`);card.style.setProperty('--final-h',`${final.height}px`);card.style.setProperty('--pad-x',`${final.paddingX}px`);card.style.setProperty('--pad-y',`${final.paddingY}px`);card.classList.toggle('compact',final.compact);
  card.setAttribute('aria-label',formatText(ui.previewLabel,{project:project.short}));layer.hidden=false;card.inert=false;content.inert=true;closeButton.tabIndex=-1;
  layer.classList.remove('is-open','is-closing');layer.classList.add('is-opening');focusOnReveal=keyboard;expanded();
  const reveal=()=>{if(selected!==id||!sectionVisible)return;layer.classList.remove('is-opening');layer.classList.add('is-open');content.inert=false;closeButton.tabIndex=0;if(focusOnReveal){$('.project-title',content)?.focus({preventScroll:true});focusOnReveal=false;}};
  if(immediate||reduced.matches){card.style.transition='none';rectStyle(final);card.getBoundingClientRect();card.style.transition='';layer.classList.add('is-dimmed');reveal();return;}
  if(!wasVisible){card.style.transition='none';rectStyle(from);card.getBoundingClientRect();card.style.transition='';}
  const g=generation;requestAnimationFrame(()=>{if(g===generation&&selected===id&&sectionVisible){layer.classList.add('is-dimmed');rectStyle(final);}});later(reveal,390);
 }
 function open(id,{keyboard=false}={}){if(!records.has(id)||!sectionVisible||!canOpen())return;const same=selected===id&&!layer.hidden;selected=id;closing=null;notify();if(!same)present({keyboard});else if(keyboard)$('.project-title',content)?.focus({preventScroll:true});}
 root.addEventListener('click',event=>{
  const button=event.target.closest?.('.case-window');if(!button||!root.contains(button))return;event.preventDefault();
  if(isActivationSuppressed(event)||!canOpen())return;open(button.dataset.projectId,{keyboard:event.detail===0});
 });
 root.addEventListener('keydown',event=>{const button=event.target.closest?.('.case-window');if(event.key==='Tab'&&!event.shiftKey&&button?.dataset.projectId===selected&&sectionVisible){event.preventDefault();if(layer.classList.contains('is-open'))$('.project-title',content)?.focus({preventScroll:true});else focusOnReveal=true;}});
 document.addEventListener('click',event=>{
  if(!sectionVisible||!selected||card.contains(event.target))return;
  // The opening activation and disabled carousel arrows are never outside-close.
  if(event.target.closest?.('.case-window,[data-carousel-control]'))return;
  close();
 });
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&selected&&sectionVisible){event.preventDefault();close({focus:true});}});
 card.addEventListener('keydown',event=>{if(event.key==='Tab'&&event.shiftKey&&event.target===closeButton&&selected){event.preventDefault();source(selected)?.focus({preventScroll:true});}});
 card.addEventListener('click',event=>{if(event.target.closest?.('.project-title'))onNavigate(selected);});
 closeButton.addEventListener('click',()=>close({focus:true}));
 return{
  open,close,
  setSectionVisible(visible){if(sectionVisible===visible){expanded();return;}sectionVisible=visible;if(!visible){hide();if(closing){closing=null;notify();}}else if(selected)present({immediate:true});expanded();},
  refresh(){if(selected&&sectionVisible)present({immediate:true});expanded();},
  restoreSelected(id){if(id&&!records.has(id))return;selected=id||null;closing=null;notify();if(sectionVisible&&selected)present({immediate:true});else if(!selected)hide();expanded();},
  get selectedId(){return selected;},get visible(){return sectionVisible&&!layer.hidden;},get isOpen(){return !!(selected||closing);}
 };
}
