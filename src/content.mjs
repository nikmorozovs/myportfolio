/** Editorial content lives in content.json. This module only formats safe text. */
export const escapeHTML=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export const plainText=value=>typeof value==='string'?value:value.lines.join(' ');
export function textHTML(value){
 if(typeof value==='string')return escapeHTML(value);
 const br=value.break==='desktop'?'<br class="desktop-break">':'<br>';
 // A real separator remains when a responsive line break is hidden or copied.
 return value.lines.map(escapeHTML).join(` ${br}`);
}
export const formatText=(value,tokens)=>value.replace(/\{([a-z]+)\}/g,(all,key)=>tokens[key]??all);
export function safeURL(value){if(!/^(https:\/\/|mailto:|#)/.test(value))throw new Error('Unsupported content URL');return escapeHTML(value);}
export function validateContent(data){
 if(data.schemaVersion!==1)throw new Error('Unsupported content schema');
 for(const [key,count]of [['cases',4],['competencies',4]]){
  if(!Array.isArray(data[key])||data[key].length!==count)throw new Error(`Expected ${count} ${key}`);
  const ids=new Set();for(const item of data[key]){if(!/^[a-z][a-z0-9-]*$/.test(item.id)||ids.has(item.id))throw new Error(`Invalid/duplicate ${key} ID`);ids.add(item.id);}
 }
 for(const c of data.cases){if(c.slug!==c.id)throw new Error('Project ID must retain its published route slug');if(!['chat','quality','data','tool'].includes(c.icon))throw new Error('Unknown project icon');}
 const visit=value=>{if(!value||typeof value!=='object')return;if('lines'in value&&(!Array.isArray(value.lines)||!value.lines.length||value.lines.some(x=>typeof x!=='string')||value.break&&!['always','desktop'].includes(value.break)))throw new Error('Invalid text lines');for(const v of Object.values(value))visit(v);};visit(data);
 for(const link of data.contact.links)safeURL(link.href);safeURL(data.footer.sourceURL);
 if(!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(data.contact.email))throw new Error('Invalid contact address');
 return data;
}
export function icon(name) {
  const paths={
    chat:'<path d="M8 8h32a5 5 0 0 1 5 5v20a5 5 0 0 1-5 5H23L12 46v-8H8a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5Z"/><path d="M13 19h22M13 27h15"/>',
    quality:'<rect x="7" y="6" width="34" height="40" rx="5"/><path d="m15 18 3 3 6-7M28 18h7m-20 14 3 3 6-7M28 32h7"/>',
    data:'<rect x="2" y="7" width="15" height="13" rx="3"/><rect x="31" y="29" width="15" height="13" rx="3"/><path d="M17 13h15a7 7 0 0 1 7 7v4m-4-4 4 4 4-4M31 36H16a7 7 0 0 1-7-7v-4m-4 4 4-4 4 4"/>',
    tool:'<circle cx="20" cy="20" r="12"/><path d="m29 29 12 12M14 20h12m-6-6v12"/>'
  };
  return `<svg viewBox="0 0 48 52" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
