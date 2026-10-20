// Minimal event/tree/clock contract for controllers. No CSS, hit testing or
// browser default actions are simulated; native keyboard/button semantics are
// checked in built markup separately.
export function domContract({width=390,height=844,reduced=false}={}){
 const saved=new Map(),install=(name,value)=>{saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{value,writable:true,configurable:true});};
 let time=0,next=1;const jobs=new Map(),later=(fn,delay=0)=>{const id=next++;jobs.set(id,{at:time+delay,fn});return id;};
 let document;
 class Element{
  constructor(tag='div',classes='',rect={}){this.tagName=tag.toUpperCase();this.parentNode=null;this.children=[];this.dataset={};this.attributes={};this.listeners=new Map();this.hidden=false;this.inert=false;this.disabled=false;this.rect={left:0,top:0,width:64,height:84,...rect};this.style={setProperty(k,v){this[k]=v;}};const values=new Set(classes.split(/\s+/).filter(Boolean));this.classList={add(...v){v.forEach(x=>values.add(x));},remove(...v){v.forEach(x=>values.delete(x));},contains(v){return values.has(v);},toggle(v,on){const yes=on??!values.has(v);if(yes)values.add(v);else values.delete(v);return yes;}};Object.defineProperty(this,'className',{get:()=>[...values].join(' '),set:value=>{values.clear();String(value).split(/\s+/).filter(Boolean).forEach(x=>values.add(x));}});this.captured=new Set();this.textContent='';this.innerHTML='';}
  get parent(){return this.parentNode;}set parent(value){this.parentNode=value;}
  append(...nodes){for(const n of nodes){n.parentNode=this;this.children.push(n);}}
  replaceChildren(...nodes){this.children=[];this.append(...nodes.flatMap(n=>n.tagName==='#FRAGMENT'?n.children:n));}
  matches(selector){if(selector.includes(','))return selector.split(',').some(s=>this.matches(s.trim()));const attr=selector.match(/\[([^\]=]+)(?:="([^"]*)")?\]/);const clean=selector.replace(/\[[^\]]+\]/g,'');if(clean.startsWith('.')&&!this.classList.contains(clean.slice(1)))return false;if(clean&&!clean.startsWith('.')&&this.tagName.toLowerCase()!==clean)return false;if(attr){const key=attr[1],value=key.startsWith('data-')?this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]:this.attributes[key];if(value===undefined||attr[2]!==undefined&&value!==attr[2])return false;}return !!(clean||attr);}
  closest(selector){let n=this;while(n){if(n.matches(selector))return n;n=n.parentNode;}return null;}
  querySelectorAll(selector){return this.children.flatMap(n=>[...(n.matches(selector)?[n]:[]),...n.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  contains(node){while(node){if(node===this)return true;node=node.parentNode;}return false;}
  setAttribute(key,value){this.attributes[key]=String(value);if(key==='class')this.className=value;}
  getAttribute(key){return this.attributes[key]??null;}
  getBoundingClientRect(){const parent=this.parentNode&&this.parentNode!==document?this.parentNode.getBoundingClientRect():{left:0,top:0};const left=parent.left+parseFloat(this.style.left??this.rect.left),top=parent.top+parseFloat(this.style.top??this.rect.top),w=parseFloat(this.style.width??this.rect.width),h=parseFloat(this.style.height??this.rect.height);return{left,top,width:w,height:h,right:left+w,bottom:top+h};}
  get clientWidth(){return parseFloat(this.style.width??this.rect.width);}get clientHeight(){return parseFloat(this.style.height??this.rect.height);}
  setPointerCapture(id){this.captured.add(id);}hasPointerCapture(id){return this.captured.has(id);}releasePointerCapture(id){this.captured.delete(id);this.emit('lostpointercapture',{pointerId:id});}
  addEventListener(type,fn,options={}){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push({fn,capture:options===true||!!options.capture});}
  emit(type,extra={}){const event={type,target:this,pointerType:'mouse',pointerId:1,button:0,isPrimary:true,detail:1,cancelable:true,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},...extra};const path=[];let n=this;while(n){path.push(n);n=n.parentNode;}if(!path.includes(document))path.push(document);const run=(node,capture)=>{for(const l of node.listeners.get(type)||[])if(l.capture===capture)l.fn(event);};for(const node of path.toReversed()){run(node,true);if(event.stopped)return event;}for(const node of path){run(node,false);if(event.stopped)break;}return event;}
  focus(){const old=document.activeElement;document.activeElement=this;if(old&&old!==this)old.emit('focusout',{relatedTarget:this});this.emit('focus');this.emit('focusin');}
  cloneNode(deep=true){const n=new Element(this.tagName.toLowerCase(),this.className,this.rect);n.dataset={...this.dataset};n.attributes={...this.attributes};n.textContent=this.textContent;n.innerHTML=this.innerHTML;if(deep)n.append(...this.children.map(c=>c.cloneNode(true)));return n;}
 }
 document=new Element('document','',{width,height});document.documentElement={clientWidth:width,clientHeight:height};document.activeElement=null;document.createElement=tag=>new Element(tag);document.body=new Element('body','',{width,height});document.append(document.body);
 install('document',document);install('innerHeight',height);install('matchMedia',()=>({matches:reduced}));install('setTimeout',later);install('clearTimeout',id=>jobs.delete(id));install('requestAnimationFrame',fn=>later(()=>fn(time),16));install('cancelAnimationFrame',id=>jobs.delete(id));
 const advance=ms=>{const end=time+ms;while(true){let id,job;for(const [key,value]of jobs)if(value.at<=end&&(!job||value.at<job.at)){id=key;job=value;}if(!job)break;jobs.delete(id);time=job.at;job.fn();}time=end;};
 const element=(tag,classes='',parent=document.body,rect={})=>{const n=new Element(tag,classes,rect);parent?.append(n);return n;};
 return{document,element,Element,advance,now:()=>time,get pending(){return jobs.size;},cleanup(){for(const [name,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}};
}
