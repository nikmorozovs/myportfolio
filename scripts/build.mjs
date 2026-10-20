import {mkdir,rm,cp,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {icon,escapeHTML as e,textHTML as t,plainText,formatText,safeURL,validateContent} from '../src/content.mjs';
import {sceneAt,sceneSVG,standaloneSVG,PHASE} from '../src/geometry.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function buildSite({contentFile=path.join(root,'src/content.json'),outputDirectory=path.join(root,'dist')}={}){
 const data=validateContent(JSON.parse(await readFile(contentFile,'utf8'))),out=outputDirectory,{identity:I,ui:U,cases,casePage:C}=data;
 const name=plainText(I.name),tokens={name,role:I.role},fmt=value=>formatText(value,tokens);
 await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
 await cp(path.join(root,'public'),out,{recursive:true});await cp(path.join(root,'src'),path.join(out,'assets'),{recursive:true});
 await writeFile(path.join(out,'assets/content.json'),JSON.stringify(data,null,2)+'\n');
 const arrow=`<span aria-hidden="true">${e(U.arrow)}</span>`,back=`<span aria-hidden="true">${e(U.backArrow)}</span>`;
 const mark=`${e(I.mark)}<span>${e(I.accent)}</span>`;
 function head(title,description,base='./'){
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#F6F5F0"><meta name="description" content="${e(description)}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="website"><meta name="color-scheme" content="light"><title>${e(title)}</title><link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml"><link rel="preload" href="${base}assets/fonts/onest-latin.woff" as="font" type="font/woff" crossorigin><link rel="preload" href="${base}assets/fonts/unbounded-latin.woff" as="font" type="font/woff" crossorigin><link rel="stylesheet" href="${base}assets/style.css"><link rel="stylesheet" href="${base}assets/scene.css"><script type="module" src="${base}assets/app.mjs"></script></head>`;
 }
 function header(base='./',home=true){return `<a class="skip-link" href="#main">${e(data.navigation.skip)}</a>
  <header class="site-header"><div class="header-surface" aria-hidden="true"></div><div class="header-inner">
   <a class="brand" href="${home?'#top':base}" aria-label="${e(data.navigation.homeLabel)}"><span class="brand-mark">${mark}</span><span class="brand-detail">${e(name)} <br><span>${e(I.role)}</span></span></a>
   <nav aria-label="${e(data.navigation.label)}">${data.navigation.items.map(n=>`<a href="${home?'':base}#${e(n.id)}"${n.id==='cv'?' class="cv-nav"':''}>${e(n.label)}${n.id==='cv'?` ${arrow}`:''}</a>`).join(' ')}</nav>
  </div></header>`;}
 function footer(){return `<footer class="site-footer"><a class="brand-mark" href="#top" aria-label="${e(data.footer.backTop)}">${mark}</a><p>${e(name)} <span>${e(I.role)}</span></p><a href="${safeURL(data.footer.sourceURL)}" target="_blank" rel="noopener noreferrer">${e(data.footer.sourceLabel)} ${arrow}</a></footer>`;}
 function windowCard(c){return `<div class="case-slot" data-project-id="${e(c.id)}"><a href="cases/${e(c.slug)}/" class="case-window" data-project-id="${e(c.id)}" aria-label="${e(formatText(U.windowLabel,{project:c.short}))}" aria-expanded="false" aria-controls="case-preview"><span class="case-icon">${icon(c.icon)}</span><span class="window-name">${e(c.window)}</span><span class="window-arrow" aria-hidden="true">${e(U.arrow)}</span></a></div>`;}
 function projectTitle(c){const words=c.short.trim().split(/\s+/),last=words.pop();return `${words.length?e(words.join(' '))+' ':''}<span class="title-tail">${e(last)} ${arrow}</span>`;}
 function projectTemplate(c){return `<template data-project-id="${e(c.id)}"><span class="eyebrow">${e(U.casePrefix)} ${e(c.number)}</span><h3><a class="project-title" href="cases/${e(c.slug)}/">${projectTitle(c)}</a></h3><p data-full="${e(c.preview)}" data-compact="${e(c.compact)}">${e(c.preview)}</p></template>`;}
 function previewLayer(){return `<div class="preview-layer" hidden><div class="preview-backdrop" aria-hidden="true"></div><article class="preview-card" id="case-preview" role="region" aria-label="${e(formatText(U.previewLabel,{project:data.work.title}))}" inert><button class="preview-close" type="button" aria-label="${e(U.closePreview)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button><div class="preview-content"></div></article></div>`;}
 function competencies(){return `<ul class="skills" aria-label="${e(U.competencyGroup)}">${data.competencies.map(c=>`<li data-competency-id="${e(c.id)}"><button class="competency-toggle" id="competency-${e(c.id)}" type="button" aria-expanded="false" aria-controls="explanation-${e(c.id)}">${t(c.title)} <svg class="competency-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div class="competency-panel" id="explanation-${e(c.id)}" role="region" aria-labelledby="competency-${e(c.id)}" hidden>${c.paragraphs.map(p=>`<p>${t(p)}</p>`).join(' ')}</div></li>`).join(' ')}</ul>`;}
 function contact(){const c=data.contact;return `<section class="contact section-wrap" id="contact" aria-labelledby="contact-title">
  <div class="section-meta"><span class="eyebrow">${e(c.eyebrow)}</span><span class="location"><i aria-hidden="true"></i>${e(I.location)}</span></div>
  <h2 id="contact-title">${t(c.title)}</h2>
  <a class="email-link" href="mailto:${e(c.email)}">${e(c.email)} ${arrow}</a>
  <div class="contact-bottom"><div class="socials">${c.links.map(l=>`<a href="${safeURL(l.href)}" target="_blank" rel="noopener noreferrer">${e(l.label)} ${arrow}</a>`).join(' ')} <span class="pending-link" title="${e(c.whatsapp.hint)}">${e(c.whatsapp.label)} <span>${e(c.whatsapp.pending)}</span></span></div>
   <div class="cv-note" id="cv"><p>${e(c.cv.title)}</p> <span>${e(c.cv.text)}</span> <a href="mailto:${e(c.email)}?subject=${e(encodeURIComponent(c.cv.subject))}">${e(c.cv.label)} ${arrow}</a></div></div>
 </section>`;}
 const initial=sceneSVG(sceneAt(0,1440,900)),a=data.about,r=data.recommendation,k=data.keyViews;
 const runtime=JSON.stringify({ui:U,scenes:data.scenes,competencies:data.competencies,cases}).replaceAll('<','\\u003c');
 const home=`${head(fmt(data.seo.homeTitle),data.seo.homeDescription)}<body id="top" data-page="home">${header()}<main id="main">
  <section class="journey" aria-label="${e(data.scenes.journeyLabel)}"><div class="stage">
   <canvas class="flight-particles" aria-hidden="true"></canvas><svg class="scene" viewBox="0 0 1440 900" aria-hidden="true" focusable="false">${initial}</svg>
   <div class="intro-world"><svg class="route-map" aria-hidden="true"></svg>
    <div class="intro section-wrap"><div class="intro-heading"><p class="eyebrow">${e(data.hero.eyebrow)}</p><h1>${t(I.name)}<span class="name-dot">${e(I.accent)}</span></h1></div>
     <div class="intro-copy"><p class="role">${e(I.role)}</p> <p>${t(data.hero.intro)}</p> <a class="text-link" href="#work">${e(data.hero.workLink)} <span aria-hidden="true">${e(U.downArrow)}</span></a></div>
     <dl class="facts">${data.hero.facts.map(f=>`<div data-metric="${e(f.id)}"><dt>${e(f.value)}<span>${e(f.suffix)}</span></dt> <dd>${t(f.label)}</dd></div>`).join(' ')}</dl></div>
    ${competencies()}<h2 class="ready-heading">${t(data.scenes.ready.title)}</h2>
   </div>
   <div class="scene-caption" aria-hidden="true"><span class="eyebrow"></span><h2></h2></div>
   <section class="work-zone" id="work" aria-labelledby="work-title"><div class="work-heading"><span class="eyebrow">${e(data.work.eyebrow)}</span><h2 id="work-title">${t(data.work.title)}<span>${e(data.work.accent)}</span></h2><p>${e(data.work.intro)}</p></div>
    <div class="case-carousel" role="region" aria-label="${e(U.carouselLabel)}"><div class="carousel-viewport"><div class="case-windows">${cases.map(windowCard).join(' ')}</div></div><div class="carousel-controls"><button type="button" class="carousel-arrow previous" data-carousel-control="previous" aria-label="${e(U.previousProject)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button><button type="button" class="carousel-arrow next" data-carousel-control="next" aria-label="${e(U.nextProject)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button></div><p class="carousel-status screen-reader-only" role="status" aria-live="polite" aria-atomic="true"></p></div>
    <p class="work-hint">${e(data.work.hint)} <span aria-hidden="true">${e(U.arrow)}</span></p>
    <div class="accessible-catalogue"><h3>${e(data.work.catalogueTitle)}</h3>${cases.map(c=>`<a href="cases/${e(c.slug)}/">${e(c.short)} — ${e(c.summary)}</a>`).join(' ')}</div>
    <div class="project-templates" hidden>${cases.map(projectTemplate).join(' ')}</div>
   </section>
   <div class="stage-footer" aria-hidden="true"><span class="stage-label">01 — ${e(data.scenes.chapters[0])}</span><span class="scroll-cue">${e(data.scenes.scrollCue)} <span>${e(U.downArrow)}</span></span><span class="progress-track"><i></i></span></div>
  </div></section>
  <section class="key-views section-wrap" aria-labelledby="key-title"><span class="eyebrow">${e(k.eyebrow)}</span><h2 id="key-title">${t(k.title)}</h2><div>${k.figures.map(f=>`<figure><img src="assets/${e(f.id)}.svg" alt="${e(f.alt)}" width="640" height="480"><figcaption>${e(f.caption)}</figcaption></figure>`).join(' ')}</div></section>
  <div class="about-track"><section class="about section-wrap" id="about" aria-labelledby="about-title"><div class="section-meta"><span class="eyebrow">${e(a.eyebrow)}</span><span class="section-number" aria-hidden="true">${e(a.sectionLabel)}</span></div><div class="about-grid"><h2 id="about-title">${t(a.title)}<span>${e(a.accent)}</span></h2><div class="about-copy"><p class="draft-label">${e(a.draftLabel)}</p>${a.paragraphs.map(p=>`<p>${t(p)}</p>`).join(' ')} <a class="text-link" href="#contact">${e(a.contactLink)} ${arrow}</a></div></div></section></div>
  <section class="recommendation section-wrap" aria-labelledby="recommendation-title"><div class="section-meta"><span class="eyebrow" id="recommendation-title">${e(r.eyebrow)}</span><span class="section-number" aria-hidden="true">${e(r.sectionLabel)}</span></div><article class="review-card"><div class="quote-mark" aria-hidden="true">${e(r.quoteMark)}</div><div class="review-body"><span class="draft-label">${e(r.draftLabel)}</span><p class="review-placeholder">${e(r.text)}</p><div class="review-attribution"><span class="avatar" aria-hidden="true">${e(r.initials)}</span><p><strong>${e(r.name)}</strong> <span>${t(r.role)}</span></p></div></div></article></section>
  ${contact()}</main>${footer()}${previewLayer()}<script type="application/json" id="site-data">${runtime}</script></body></html>`;
 await writeFile(path.join(out,'index.html'),home);
 function diagram(c){return `<figure class="decision-diagram"><figcaption>${e(C.diagramTitle)}</figcaption><ol>${c.flow.map((v,i)=>`<li><span class="diagram-step">0${i+1}</span> <span>${t(v)}</span></li>`).join(' ')}</ol></figure>`;}
 for(const c of cases){
  const dir=path.join(out,'cases',c.slug);await mkdir(dir,{recursive:true});
  const title=formatText(data.seo.caseTitle,{name,project:c.short});
  const page=`${head(title,c.summary,'../../')}<body id="top" data-page="case">${header('../../',false)}<main class="case-page section-wrap" id="main"><a class="back-link" href="../../#work" data-return>${back} ${e(C.back)}</a>
   <section class="case-hero"><div class="case-hero-meta"><span class="eyebrow">${e(C.prefix)} ${e(c.number)}</span> <span>${e(c.category)}</span></div><h1>${t(c.title)}</h1><p class="case-lead">${e(c.summary)}</p><div class="case-summary"><div><span class="eyebrow">${e(C.scope)}</span> <strong>${e(c.scope)}</strong> <span>${e(c.scopeLabel)}</span></div><div><span class="eyebrow">${e(C.contribution)}</span> <p>${e(c.contribution)}</p></div><div class="case-hero-icon">${icon(c.icon)}</div></div></section>
   <div class="case-reading"><aside class="case-toc"><span class="eyebrow">${e(C.contents)}</span><nav aria-label="${e(C.contentsLabel)}">${c.sections.map((s,i)=>`<a href="#section-${i+1}">${e(s.title)}</a>`).join(' ')}</nav></aside><div class="case-prose">${c.sections.map((s,i)=>`<section id="section-${i+1}"><span class="eyebrow">0${i+1}</span><h2>${t(s.title)}</h2>${s.paragraphs.map(p=>`<p>${t(p)}</p>`).join(' ')}${i===2?diagram(c):''}</section>`).join(' ')}</div></div>
   <section class="more-cases"><span class="eyebrow">${e(C.moreEyebrow)}</span><h2>${t(C.moreTitle)}</h2><div>${cases.filter(x=>x.id!==c.id).map(x=>`<a href="../${e(x.slug)}/"><span>${e(x.number)}</span> <h3>${e(x.short)}</h3> ${arrow}</a>`).join(' ')}</div><a class="text-link" href="../../#work" data-return>${e(C.return)} ${back}</a></section></main>${footer()}</body></html>`;
  await writeFile(path.join(dir,'index.html'),page);
 }
 const n=data.notFound;
 await writeFile(path.join(out,'404.html'),`${head(fmt(n.title),n.description,'/myportfolio/')}<body id="top">${header('/myportfolio/',false)}<main class="not-found section-wrap" id="main"><p class="eyebrow">${e(n.eyebrow)}</p><h1>${t(n.heading)}</h1><a class="text-link" href="/myportfolio/#work">${e(n.workLink)} ${arrow}</a></main></body></html>`);
 await writeFile(path.join(out,'.nojekyll'),'');
 for(const [name,u]of [['top-view',PHASE.turn],['side-view',PHASE.zoom],['engine-view',PHASE.approach]])await writeFile(path.join(out,'assets',`${name}.svg`),standaloneSVG(sceneAt(u,640,480)));
 return{pages:cases.length+2,outputDirectory:out};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){await buildSite();console.log('Built home, four case routes, 404 and fallback views from src/content.json.');}
