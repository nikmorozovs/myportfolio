/** Keep Tab navigation inside a modal, including browsers that otherwise let
 * the final Tab escape into browser chrome. Native dialog handles inertness. */
export function trapDialogFocus(dialog){
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||!dialog.open)return;
  const controls=[...dialog.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length);
  const first=controls[0],last=controls.at(-1),active=document.activeElement;
  if(!first){event.preventDefault();dialog.focus();return;}
  if(event.shiftKey&&(active===first||!dialog.contains(active))){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&(active===last||!dialog.contains(active))){event.preventDefault();first.focus();}
 });
}
