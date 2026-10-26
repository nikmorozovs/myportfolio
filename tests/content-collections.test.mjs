import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,rm,writeFile,readFile,cp,readdir} from 'node:fs/promises';
import path from 'node:path';
import {loadCases,loadPosts,discoverJSON} from '../scripts/content-loader.mjs';
import {buildSite} from '../scripts/build.mjs';
import {data} from './site-fixture.mjs';
import {icon} from '../src/content.mjs';
const root=new URL('../',import.meta.url).pathname;
export const fixturePost=(n=0)=>({status:'published',title:`Fixture article ${n}`,date:`2026-01-${String(n%28+1).padStart(2,'0')}`,tags:[n%2?'Process':'Analysis','Shared'],linkedinUrl:`https://www.linkedin.com/posts/fixture-${n}`,body:[{type:'paragraph',text:`Original paragraph ${n}.`},{type:'heading',text:'A heading'},{type:'list',items:['One','Two']},{type:'paragraph',text:[{text:'Source',href:'https://example.com'}]}]});
async function use(name,fn){const dir=path.join(root,'qa-output',name);await rm(dir,{recursive:true,force:true});await mkdir(dir,{recursive:true});try{await fn(dir);}finally{await rm(dir,{recursive:true,force:true});}}
const put=(dir,name,value)=>writeFile(path.join(dir,name+'.json'),JSON.stringify(value));
const caseSource=()=>{const {id,slug,number,...value}=data.cases[0];return structuredClone(value);};
test('migration preserves exact existing content, IDs, icons and numbered ordering',async()=>{
 const baseline=JSON.parse(await readFile(new URL('./fixtures/original-cases.json',import.meta.url),'utf8'));
 assert.deepEqual(data.cases.map(c=>c.id),baseline.map(c=>c.id));
 for(let i=0;i<baseline.length;i++){const {status,order,...current}=data.cases[i];assert.deepEqual(current,baseline[i]);}
 assert.ok(!('cases' in JSON.parse(await readFile(path.join(root,'src/content.json'),'utf8'))));
});
test('case discovery excludes templates/drafts and deterministically derives URLs, fallback icons and optional fields',()=>use('collection-cases',async dir=>{
 const a=caseSource();a.order=20;delete a.icon;delete a.window;delete a.compact;delete a.flow;
 await put(dir,'z-last',{...a,order:null});await put(dir,'b-second',a);await put(dir,'a-first',{...a,order:10});await put(dir,'a-unordered',{...a,order:null});await put(dir,'draft',{...a,order:30,status:'draft'});await writeFile(path.join(dir,'_template.json'),'invalid template ignored');
 const cases=await loadCases(dir);assert.deepEqual(cases.map(c=>c.id),['a-first','b-second','a-unordered','z-last']);assert.deepEqual(cases.map(c=>c.number),['01','02','03','04']);assert.equal(cases[0].slug,'a-first');assert.equal(cases[0].icon,'default');assert.equal(cases[0].window,a.short);assert.ok(cases[0].compact);assert.deepEqual(cases[0].flow,[]);assert.match(icon(cases[0].icon),/<path/);
 await put(dir,'duplicate',{...a,order:10});await assert.rejects(loadCases(dir),/duplicate order/);await rm(path.join(dir,'duplicate.json'));
 await put(dir,'bad-icon',{...a,order:50,icon:'unknown'});await assert.rejects(loadCases(dir),/Unknown project icon/);await rm(path.join(dir,'bad-icon.json'));
 await put(dir,'Bad Name',a);await assert.rejects(discoverJSON(dir),/filename ID/);
}));
test('post validation rejects malformed JSON, impossible/future dates, unsafe bodies and source URLs',()=>use('collection-posts-invalid',async dir=>{
 const p=fixturePost();await put(dir,'valid',p);let posts=await loadPosts(dir);assert.equal(posts[0].id,'valid');assert.equal(posts[0].excerpt,p.body[0].text);
 for(const change of [{date:'2026-02-30'},{date:'9999-01-01'},{status:'scheduled'},{linkedinUrl:'javascript:alert(1)'},{linkedinUrl:'https://www.linkedin.com.evil.test/posts/no'},{body:[{type:'html',text:'<script>x</script>'}]},{body:[{type:'paragraph',text:'<img onerror="x">'}]},{body:[{type:'paragraph',text:[{text:'x',href:'javascript:alert(1)'}]}]}]){await put(dir,'invalid',{...p,...change});await assert.rejects(loadPosts(dir));}
 await writeFile(path.join(dir,'invalid.json'),'{');await assert.rejects(loadPosts(dir),/Invalid JSON/);await rm(path.join(dir,'invalid.json'));
 await put(dir,'draft',{...p,status:'draft',date:'9999-01-01'});posts=await loadPosts(dir);assert.equal(posts.length,1);
}));
test('JSON-only growth to 5, 6 and 8 cases builds all pages and keeps original canonical routes',()=>use('growth-build',async dir=>{
 const contentDirectory=path.join(dir,'content');await cp(path.join(root,'content'),contentDirectory,{recursive:true});
 for(const count of [5,6,8]){const files=await readdir(path.join(contentDirectory,'cases'));for(let n=files.filter(f=>f!=='_template.json').length;n<count;n++){const c=caseSource();delete c.order;delete c.flow;delete c.icon;c.sections=c.sections.slice(0,1);await put(path.join(contentDirectory,'cases'),`new-case-${n}`,c);}
 const outputDirectory=path.join(dir,'dist');await buildSite({contentDirectory,outputDirectory});const built=JSON.parse(await readFile(path.join(outputDirectory,'assets/content.json'),'utf8'));assert.equal(built.cases.length,count);for(const c of built.cases){const page=await readFile(path.join(outputDirectory,'cases',c.id,'index.html'),'utf8');assert.ok(page.includes(c.short));assert.equal((page.match(/<a href="\.\.\/[^/]+\/">/g)||[]).length,3);if(c.id.startsWith('new'))assert.ok(!page.includes('class="decision-diagram"'));}assert.deepEqual(built.cases.slice(0,4).map(c=>c.id),data.cases.map(c=>c.id));}
}));
test('seven independent article fixtures generate article pages, homepage newest four and no pagination',()=>use('seven-post-build',async dir=>{
 const contentDirectory=path.join(dir,'content');await cp(path.join(root,'content'),contentDirectory,{recursive:true});for(const f of await readdir(path.join(contentDirectory,'posts')))if(!f.startsWith('_'))await rm(path.join(contentDirectory,'posts',f));for(let n=0;n<7;n++)await put(path.join(contentDirectory,'posts'),`article-${n}`,fixturePost(n));await put(path.join(contentDirectory,'posts'),'draft',{...fixturePost(),status:'draft'});
 const outputDirectory=path.join(dir,'dist');await buildSite({contentDirectory,outputDirectory});const archive=await readFile(path.join(outputDirectory,'blog/index.html'),'utf8'),home=await readFile(path.join(outputDirectory,'index.html'),'utf8');assert.equal((archive.match(/class="post-card"/g)||[]).length,7);assert.ok(!archive.includes('class="pagination"'));assert.equal((home.match(/class="small-post"/g)||[]).length,3);assert.ok(home.indexOf('Fixture article 6')<home.indexOf('Fixture article 5'));assert.ok(!archive.includes('"id":"draft"'));for(let n=0;n<7;n++){const page=await readFile(path.join(outputDirectory,'blog',`article-${n}`,'index.html'),'utf8');assert.ok(page.includes(`Original paragraph ${n}.`));assert.ok(page.includes(fixturePost(n).linkedinUrl));assert.ok(page.includes('href="/myportfolio/#blog"'));assert.ok(page.includes(n===0?'No older post':`href="/myportfolio/blog/article-${n-1}/"`));assert.ok(page.includes(n===6?'No newer post':`href="/myportfolio/blog/article-${n+1}/"`));}
}));
