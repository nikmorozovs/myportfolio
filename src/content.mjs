/** Safe formatting and SVG registry shared by static pages and browser controllers. */
export const escapeHTML=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export const plainText=value=>typeof value==='string'?value:value.lines.join(' ');
export function textHTML(value){
 if(typeof value==='string')return escapeHTML(value);
 const br=value.break==='desktop'?'<br class="desktop-break">':'<br>';
 // A real separator remains when a responsive line break is hidden or copied.
 return value.lines.map(escapeHTML).join(` ${br}`);
}
/** Preserve editorial line breaks; render the existing final dot exactly once. */
export function headingHTML(value,accent='.'){
 const lines=typeof value==='string'?[value]:[...value.lines],last=lines.length-1;
 const dot=lines[last].endsWith('.')?'.':accent;
 if(dot)lines[last]=lines[last].replace(/\.+$/,'');
 return textHTML(typeof value==='string'?lines[0]:{...value,lines})+(dot?`<span class="heading-dot">${escapeHTML(dot)}</span>`:'');
}
export function completedYears(start,date=new Date()){
 return Math.max(0,date.getFullYear()-start.year-(date.getMonth()+1<start.month?1:0));
}
export const metricValue=(metric,date=new Date())=>metric.start?String(completedYears(metric.start,date)):metric.value;
export const formatText=(value,tokens)=>value.replace(/\{([a-z]+)\}/g,(all,key)=>tokens[key]??all);
export function safeURL(value){if(!/^(https:\/\/|mailto:|#)/.test(value)&&!/^assets\/[a-zA-Z0-9_/-]+\.[a-z0-9]+$/.test(value))throw new Error('Unsupported content URL');return escapeHTML(value);}
export function validateContent(data){
 if(data.schemaVersion!==1)throw new Error('Unsupported content schema');
 for(const [key,count]of [['competencies',4]]){
  if(!Array.isArray(data[key])||data[key].length!==count)throw new Error(`Expected ${count} ${key}`);
  const ids=new Set();for(const item of data[key]){if(!/^[a-z][a-z0-9-]*$/.test(item.id)||ids.has(item.id))throw new Error(`Invalid/duplicate ${key} ID`);ids.add(item.id);}
 }
 if(data.cases){const ids=new Set();for(const c of data.cases){if(c.slug!==c.id||ids.has(c.id))throw new Error('Invalid/duplicate project ID');ids.add(c.id);if(!ICON_NAMES.includes(c.icon))throw new Error('Unknown project icon');}}
 const visit=value=>{if(!value||typeof value!=='object')return;if('lines'in value&&(!Array.isArray(value.lines)||!value.lines.length||value.lines.some(x=>typeof x!=='string')||value.break&&!['always','desktop'].includes(value.break)))throw new Error('Invalid text lines');for(const v of Object.values(value))visit(v);};visit(data);
 const start=data.hero.facts.find(f=>f.id==='experience')?.start;
 if(!start||!Number.isInteger(start.year)||start.year<1||!Number.isInteger(start.month)||start.month<1||start.month>12)throw new Error('Invalid experience start year/month');
 for(const link of data.contact.links)safeURL(link.href);safeURL(data.footer.sourceURL);
 if(data.contact.cv.href)safeURL(data.contact.cv.href);
 if(data.contact.whatsapp.href)safeURL(data.contact.whatsapp.href);
 if(!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(data.contact.email))throw new Error('Invalid contact address');
 return data;
}
export const ICON_NAMES=Object.freeze(['chat','quality','data','tool','default']);
export function directionIcon(direction='diagonal'){const paths={calendar:'M4 5h16v16H4ZM8 3v4M16 3v4M4 10h16',diagonal:'M6 18 18 6M6 6h12v12',left:'m14 6-6 6 6 6M8 12h13',right:'m10 6 6 6-6 6M3 12h13',down:'M12 4v16m-6-6 6 6 6-6',up:'M12 20V4m-6 6 6-6 6 6',menu:'M4 6h16M4 12h16M4 18h16',close:'m6 6 12 12M18 6 6 18',ellipsis:'M4 12h.1M12 12h.1M20 12h.1'};return `<svg class="direction-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[direction]}"/></svg>`;}
export function icon(name='default') {
  const paths={
    default:'<path d="M12 5h17l9 9v32H12Z"/><path d="M29 5v10h9M19 25h12M19 33h12"/>',
    chat:'<path d="M8 8h32a5 5 0 0 1 5 5v20a5 5 0 0 1-5 5H23L12 46v-8H8a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5Z"/><path d="M13 19h22M13 27h15"/>',
    quality:'<rect x="7" y="6" width="34" height="40" rx="5"/><path d="m15 18 3 3 6-7M28 18h7m-20 14 3 3 6-7M28 32h7"/>',
    data:'<rect x="2" y="7" width="15" height="13" rx="3"/><rect x="31" y="29" width="15" height="13" rx="3"/><path d="M17 13h15a7 7 0 0 1 7 7v4m-4-4 4 4 4-4M31 36H16a7 7 0 0 1-7-7v-4m-4 4 4-4 4 4"/>',
    tool:'<circle cx="20" cy="20" r="12"/><path d="m29 29 12 12M14 20h12m-6-6v12"/>'
  };
  return `<svg viewBox="0 0 48 52" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name||'default']}</svg>`;
}
