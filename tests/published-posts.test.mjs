import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {data} from './site-fixture.mjs';
import {articleContent,blogPreview,archiveResults} from '../src/blog-render.mjs';
import {defaultState,selectPosts,tagCounts} from '../src/blog-state.mjs';
const manifest=JSON.parse(await readFile(new URL('./fixtures/linkedin-import-manifest.json',import.meta.url),'utf8'));
test('all seven supplied posts preserve original wording, metadata and source links',()=>{
 assert.equal(data.posts.length,7);
 for(const expected of manifest){const actual=data.posts.find(p=>p.id===expected.id);assert.ok(actual);for(const field of ['title','date','tags','linkedinUrl'])assert.deepEqual(actual[field],expected[field]);assert.equal(actual.status,'published');assert.equal(actual.language,'en');const canonical=actual.body.map(b=>b.type==='list'?b.items.join('\n'):b.text).join('\n\n');assert.equal(createHash('sha256').update(canonical).digest('hex'),expected.bodySHA256);assert.ok(!canonical.includes('## Original text'));}
});
test('real posts populate newest homepage cards, archive tags and chronological links',()=>{
 assert.deepEqual(data.posts.map(p=>p.date),['2026-10-26','2026-10-21','2026-10-16','2026-10-12','2026-10-05','2026-09-28','2026-09-21']);
 const preview=blogPreview(data.posts);for(const p of data.posts.slice(0,4))assert.ok(preview.includes(`/blog/${p.id}/`));for(const p of data.posts.slice(4))assert.ok(!preview.includes(`/blog/${p.id}/`));
 const selected=selectPosts(data.posts,defaultState());assert.equal(selected.posts.length,7);assert.equal(selected.showPagination,false);assert.equal((archiveResults(selected).match(/class="post-card"/g)||[]).length,7);assert.equal(tagCounts(data.posts)[0][0],'Business Analysis');assert.equal(selectPosts(data.posts,{...defaultState(),tags:['AI']}).posts.length,2);
 for(let i=0;i<data.posts.length;i++){const page=articleContent(data.posts[i],data.posts,'Nikolajs Morozovs');assert.ok(page.includes(data.posts[i].linkedinUrl));assert.ok(page.includes(i===0?'No newer post':`/blog/${data.posts[i-1].id}/`));assert.ok(page.includes(i===data.posts.length-1?'No older post':`/blog/${data.posts[i+1].id}/`));}
});
