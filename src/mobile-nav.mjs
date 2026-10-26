import {trapDialogFocus} from './dialog-focus.mjs';
const menu=document.querySelector('#mobile-menu'),toggle=document.querySelector('.menu-toggle');
if(menu&&toggle){
 trapDialogFocus(menu);
 let overflow='',closing=false,timer;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function close(){if(!menu.open||closing)return;closing=true;menu.classList.add('is-closing');timer=setTimeout(()=>menu.close(),reduced()?0:200);}
 toggle.addEventListener('click',()=>{clearTimeout(timer);closing=false;overflow=document.body.style.overflow;document.body.style.overflow='hidden';menu.classList.remove('is-closing');menu.showModal();toggle.setAttribute('aria-expanded','true');});
 menu.querySelector('.menu-close').addEventListener('click',close);
 menu.addEventListener('cancel',event=>{event.preventDefault();close();});
 menu.addEventListener('click',event=>{if(event.target.closest('a'))close();else if(event.target===menu){const r=menu.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right)close();}});
 menu.addEventListener('close',()=>{clearTimeout(timer);closing=false;document.body.style.overflow=overflow;toggle.setAttribute('aria-expanded','false');toggle.focus({preventScroll:true});});
 matchMedia('(min-width: 901px)').addEventListener('change',event=>{if(event.matches&&menu.open)menu.close();});
}
