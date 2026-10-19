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
    let link=m[1];if(/^(https?:|mailto:|data:)/.test(link))continue;
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
const css=await readFile(path.join(root,'assets/style.css'),'utf8');
for(const [,url] of css.matchAll(/url\(['"]?([^)'" ]+)/g)){
  try{await stat(path.resolve(root,'assets',url));checked++;}catch{failures.push(`Missing CSS asset ${url}`);}
}
for(const file of files.filter(x=>x.endsWith('.mjs'))){
 const source=await readFile(file,'utf8');
 for(const [,url] of source.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g)){
  try{await stat(path.resolve(path.dirname(file),url));checked++;}catch{failures.push(`Missing module ${url}`);}
 }
}
if(files.some(x=>/\.(docx|pdf|ttf)$/i.test(x)))failures.push('Unexpected input or source font in deployment');
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
const bytes=(await Promise.all(files.map(async x=>(await stat(x)).size))).reduce((a,b)=>a+b,0);
console.log(`PASS: ${html.length} HTML pages, ${checked} local links/assets and ${Math.round(bytes/1024)} KiB static output.`);
