import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
async function walk(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?walk(path.join(dir,x.name)):path.join(dir,x.name)))).flat();}
const files=await walk(root),html=files.filter(x=>x.endsWith('.html'));let checked=0;
const failures=[];
for(const file of html){
  const source=await readFile(file,'utf8');
  if(!source.includes('<html lang="en">'))failures.push(`${file}: missing English language`);
  if((source.match(/<h1[ >]/g)||[]).length!==1)failures.push(`${file}: requires one h1`);
  for(const m of source.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    let link=m[1];if(/^(https?:|mailto:|tel:|data:)/.test(link))continue;
    const [url,hash]=link.split('#');
    let target=url.startsWith('/myportfolio/')?path.join(root,url.slice('/myportfolio/'.length)):path.resolve(path.dirname(file),url||path.basename(file));
    try{if((await stat(target)).isDirectory())target=path.join(target,'index.html');await stat(target);}
    catch{failures.push(`${path.relative(root,file)}: broken local link ${link}`);continue;}
    if(hash&&target.endsWith('.html')){
      const body=await readFile(target,'utf8');if(!body.includes(`id="${hash}"`))failures.push(`${link}: missing target`);
    }
    checked++;
  }
  if(/lorem ipsum/i.test(source)&&!source.includes('copy in progress'))failures.push('Unlabelled placeholder');
  if(file.includes('/cases/')&&source.includes('class="journey"'))failures.push('Intro scene repeated on case page');
}
for(const file of files.filter(x=>x.endsWith('.css'))){
 const css=await readFile(file,'utf8');
 for(const [,url] of css.matchAll(/url\(['"]?([^)'" ]+)/g)){
  if(/^(data:|https?:)/.test(url))continue;
  try{await stat(path.resolve(path.dirname(file),url));checked++;}catch{failures.push(`Missing CSS asset ${url}`);}
 }
}
for(const file of files.filter(x=>x.endsWith('.mjs'))){
 const source=await readFile(file,'utf8');
 for(const [,url] of source.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g)){
  try{await stat(path.resolve(path.dirname(file),url));checked++;}catch{failures.push(`Missing module ${url}`);}
 }
}
// Check the built DOM hierarchy, not merely the presence of class strings.
const content=JSON.parse(await readFile(path.join(root,'assets/content.json'),'utf8'));
const source=await readFile(path.join(root,'index.html'),'utf8'),stack=[],nodes=[],voidTags=new Set(['meta','link','br','hr','img','input']);
for(const tag of source.matchAll(/<(\/?)([a-z][\w-]*)\b([^>]*)>/gi)){
 const [,end,name,attrs]=tag;
 if(end){if(stack.at(-1)?.name!==name)failures.push(`Unbalanced home tag: ${name}`);else stack.pop();continue;}
 const classes=(attrs.match(/\bclass="([^"]*)"/)?.[1]||'').split(/\s+/),node={name,classes,parent:stack.at(-1)};nodes.push(node);
 if(!voidTags.has(name)&&!attrs.endsWith('/'))stack.push(node);
}
const has=(n,c)=>n?.classes.includes(c),find=c=>nodes.find(n=>has(n,c)),ancestors=n=>{const a=[];while(n){a.push(n);n=n.parent;}return a;};
const world=find('intro-world');
for(const c of ['intro','skills','route-map'])if(!ancestors(find(c)).includes(world))failures.push(`${c} must share the intro world coordinates`);
const portal=find('preview-layer');
if(!portal||ancestors(portal).some(n=>has(n,'stage')||has(n,'journey'))||portal.parent?.name!=='body')failures.push('Preview must be a body portal outside the clipped stage');
for(const c of ['case-slot','case-window'])if(nodes.filter(n=>has(n,c)).length!==content.cases.length)failures.push(`Requires one ${c} entrance per published case`);
if(nodes.filter(n=>has(n,'preview-card')).length!==1)failures.push('Requires one shared preview card');
for(const node of nodes.filter(n=>has(n,'case-window')))if(node.name!=='a')failures.push('Initial project entrances must retain real links when JavaScript is unavailable');
if(!find('case-carousel')||nodes.filter(n=>has(n,'carousel-arrow')).length!==2)failures.push('Requires one manual carousel with two arrows');
if(nodes.filter(n=>has(n,'competency-toggle')).length!==4||nodes.filter(n=>has(n,'competency-panel')).length!==4)failures.push('Requires four independent competency explanations');
if(find('ready-heading')?.parent!==world)failures.push('Takeoff heading must share route world coordinates');
if(nodes.filter(n=>has(n,'project-title')).length!==content.cases.length||find('open-case'))failures.push('Previews must navigate using their project heading');
if(content.cases.length&&!source.includes('class="title-tail"'))failures.push('Project link arrow must stay with its last word');
for(const m of source.matchAll(/\baria-(?:controls|labelledby)="([^"]+)"/g))for(const id of m[1].split(/\s+/))if(!source.includes(`id="${id}"`))failures.push(`Missing accessible target ${id}`);
for(const file of html){const body=await readFile(file,'utf8');if(/\S<br(?:\s[^>]*)?>/.test(body))failures.push(`${file}: line breaks must have real word separators`);}

const embedded=source.match(/<script type="application\/json" id="site-data">([\s\S]*?)<\/script>/)?.[1];
if(!embedded||JSON.stringify(JSON.parse(embedded).cases)!==JSON.stringify(content.cases))failures.push('Runtime cases must come from the same content configuration');
const header=find('site-header');
if(header?.parent?.name!=='body')failures.push('Header must stay outside transformed scene ancestors');
for(const c of ['header-surface','header-inner'])if(find(c)?.parent!==header)failures.push(`Missing separate header ${c}`);
if(!source.includes('viewport-fit=cover'))failures.push('Viewport must expose mobile safe area');
if(find('about')?.parent!==find('about-track'))failures.push('About must use one real content section in its reading track');
if(nodes.filter(n=>has(n,'about')).length!==1)failures.push('About content must not be duplicated for the reading hold');
if(nodes.indexOf(find('contact'))>=nodes.indexOf(find('site-footer')))failures.push('Contact must precede its footer');
if(stack.length)failures.push('Unclosed home markup');
const approvedCV=new Set(['Nikolajs_Morozovs_CV.pdf','Nikolajs_Morozovs_CV.docx'].map(n=>path.join(root,'assets/cv',n)));
if(files.some(x=>/\.ttf$/i.test(x)||/\.(pdf|docx)$/i.test(x)&&!approvedCV.has(x)))failures.push('Unexpected input document or source font in deployment');
for(const file of approvedCV){const original=await readFile(new URL('../public/assets/cv/'+path.basename(file),import.meta.url));if(!original.equals(await readFile(file)))failures.push('CV download bytes changed');}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
const bytes=(await Promise.all(files.map(async x=>(await stat(x)).size))).reduce((a,b)=>a+b,0);
console.log(`PASS: ${html.length} HTML pages, ${checked} local links/assets and ${Math.round(bytes/1024)} KiB static output.`);
