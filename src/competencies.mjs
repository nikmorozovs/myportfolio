/** Local S0 explanations deliberately do not share project preview rules. */
export const COMPETENCIES=Object.freeze({leaveDelay:210,gutter:16,maxWidth:288});
export function competencyBounds({center,width,viewportWidth}){const actual=Math.min(width,viewportWidth-COMPETENCIES.gutter*2),left=Math.max(COMPETENCIES.gutter,Math.min(center-actual/2,viewportWidth-COMPETENCIES.gutter-actual));return{left,width:actual};}
export function mountCompetencies({root,getViewport}){
 const items=[...root.querySelectorAll('[data-competency-id]')];let active=null,visible=true,leave=0,keyboard=false;
 const button=item=>item.querySelector('.competency-toggle'),panel=item=>item.querySelector('.competency-panel');
 function close(){clearTimeout(leave);if(!active)return;button(active).setAttribute('aria-expanded','false');panel(active).hidden=true;active=null;}
 function position(){if(!active)return;const b=button(active).getBoundingClientRect(),p=panel(active),v=getViewport(),bounds=competencyBounds({center:b.left+b.width/2,width:COMPETENCIES.maxWidth,viewportWidth:v.width}),parent=active.getBoundingClientRect(),available=Math.max(24,v.height-(b.bottom+8)-16);p.style.left=`${bounds.left-parent.left}px`;p.style.width=`${bounds.width}px`;p.style.maxHeight=`${available}px`;p.classList.toggle('compact',available<100);}
 function open(item){if(!visible)return;clearTimeout(leave);if(active!==item){close();active=item;button(item).setAttribute('aria-expanded','true');panel(item).hidden=false;}position();}
 for(const item of items){
  item.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){keyboard=false;clearTimeout(leave);open(item);}});
  item.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'){clearTimeout(leave);leave=setTimeout(()=>{if(!keyboard||!item.contains(document.activeElement))close();},COMPETENCIES.leaveDelay);}});
  button(item).addEventListener('click',event=>{keyboard=event.detail===0;if(active===item)close();else open(item);});
  item.addEventListener('focusout',()=>{clearTimeout(leave);leave=setTimeout(()=>{if(active===item&&!item.contains(document.activeElement))close();},COMPETENCIES.leaveDelay);});
 }
 document.addEventListener('pointerdown',event=>{if(active&&!active.contains(event.target))close();},{capture:true});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active){const b=button(active);close();b.focus({preventScroll:true});}});
 return{close,refresh:position,setVisible(value){visible=value;if(!visible)close();else position();},get activeId(){return active?.dataset.competencyId||null;}};
}
