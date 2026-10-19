/** Pure scroll → geometry mapping. Units are viewport heights, never elapsed time. */
export const STROKE = 1.5;
export const END = 11.65;
export const WORK = 5.65;
export const TIMES = Object.freeze([0, .95, 1.75, 3.35, 5.15, 6.15, 7.65, 9.55, 10.9, END]);
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const interval = (u, a, b) => clamp((u - a) / (b - a));
const logMix = (a, b, t) => Math.exp(mix(Math.log(a), Math.log(b), t));
const dot = (a, b) => a.reduce((v, x, i) => v + x * b[i], 0);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const lerp3 = (a, b, t) => a.map((x, i) => mix(x, b[i], t));
const n = v => Number(v.toFixed(3));

function slerp(a, b, t) {
  let d = dot(a, b);
  if (d < 0) { b = b.map(x => -x); d = -d; }
  if (d > .9995) {
    const q = a.map((x, i) => mix(x, b[i], t));
    const l = Math.hypot(...q); return q.map(x => x / l);
  }
  const angle = Math.acos(clamp(d, -1, 1));
  return a.map((x, i) => (Math.sin((1 - t) * angle) * x + Math.sin(t * angle) * b[i]) / Math.sin(angle));
}
function basis(q) {
  const [x,y,z,w] = q;
  return [
    [1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
    [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)],
    [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]
  ];
}

export function sceneAt(u, width, height) {
  u = clamp(u, 0, END);
  const mobile = width < 640;
  const windowWidth = mobile ? clamp((width - 72) / 4, 55, 78) : Math.min(clamp(width * .105, 90, 142),(width-80)*22/166);
  const finalScale = windowWidth / 22;
  // A deliberately conditional airframe: window framing governs the geometry.
  const bodyY = Math.max(92, height * .64 / finalScale + 12);
  const engineGap = Math.max(105, height * .65 / finalScale);
  const engine = [-14, -bodyY - engineGap, 76];
  const sideScale = Math.min(width * .80 / 730, height * .48 / (bodyY * 2));
  const topScale = Math.min(sideScale * .64, height * .35 / 730);
  const side = basis([0,0,0,1]);
  const top = [.5,.5,.5,.5];
  const rotate = smooth(interval(u, 1.75, 3.35));
  let axes = basis(slerp(top, [0,0,0,1], rotate));
  let scale = logMix(topScale * .26, topScale, smooth(interval(u, .95, 1.75)));
  if (u >= 1.75) scale = logMix(topScale, sideScale, rotate);
  const zoom = smooth(interval(u, 3.35, 5.15));
  if (u >= 3.35) scale = logMix(sideScale, finalScale, zoom);
  let target = lerp3([0,0,0], [0,10,44], zoom);
  let center = [width * .5, mix(height * .59, height * .54, zoom)];
  if (u >= 6.15) {
    const pan = smooth(interval(u, 6.15, 7.65));
    target = lerp3([0,10,44], engine, pan);
    center[1] = mix(height * .54, height * .52, pan);
    const elevation = .13 * pan;
    axes = [[1,0,0],[0,Math.cos(elevation),-Math.sin(elevation)],[0,Math.sin(elevation),Math.cos(elevation)]];
  }
  const orbit = smooth(interval(u, 7.65, 9.55));
  const yaw = orbit * Math.PI / 2;
  if (u >= 7.65) {
    const e = .13 * (1 - orbit), c = Math.cos(yaw), s = Math.sin(yaw);
    axes = [[c,0,s],[Math.sin(e)*s,Math.cos(e),-Math.sin(e)*c],[-s*Math.cos(e),Math.sin(e),c*Math.cos(e)]];
    // Track the inlet, so the end of the orbit is centred on the circular opening.
    target = lerp3(engine, [engine[0]-78,engine[1],engine[2]], orbit);
  }
  if (u >= 9.55) {
    const approach = smooth(interval(u, 9.55, 10.9));
    scale = finalScale * logMix(1, mobile ? 4.1 : 3.2, approach);
  }
  if (u >= 10.9) scale = finalScale * logMix(mobile ? 4.1 : 3.2, mobile ? 6.4 : 5.2, smooth(interval(u, 10.9, END)));
  const fade = 1 - smooth(interval(u, 10.9, END));
  const planeAlpha = smooth(interval(u, .95, 1.24));
  const gap = mobile ? (width-48-windowWidth)/(3*finalScale) : 48;
  const project = point => {
    const v = sub(point, target);
    return [center[0] + dot(axes[0], v) * scale, center[1] - dot(axes[1], v) * scale];
  };
  const windows = [-1.5,-.5,.5,1.5].map((k, i) => {
    const world = [k*gap,10,44];
    const p = project(world);
    return {i, world, x:p[0], y:p[1], width:22*scale, height:22*scale/.76, radius:22*scale*.38};
  });
  let state = 0;
  if (u > .05) state = 1;
  if (u >= .95) state = 2;
  if (u >= 1.75) state = 3;
  if (u >= 3.35) state = 4;
  if (u >= 6.15) state = 5;
  if (u >= 7.65) state = 6;
  if (u >= 10.9) state = 7;
  return {u,width,height,mobile,windowWidth,finalScale,bodyY,engineGap,engine,axes,scale,target,center,project,windows,state,fade,planeAlpha,orbit,yaw,side};
}

export function previewRect(win, width, height) {
  const w = Math.min(242, width - 40, (height - 174) * .76);
  const h = w / .76;
  return {x:clamp(win.x - w/2, 20, width-w-20),y:clamp(win.y-h/2, 88, height-h-30),width:w,height:h,radius:w*.38};
}

export function pointsPath(points, close = true) {
  if (!points.length) return '';
  return `M${points.map(p => `${n(p[0])},${n(p[1])}`).join('L')}${close?'Z':''}`;
}
function hull(points) {
  const p = points.toSorted((a,b) => a[0]-b[0] || a[1]-b[1]);
  const cross = (a,b,c) => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const half = list => {const out=[];for(const q of list){while(out.length>1 && cross(out.at(-2),out.at(-1),q)<=0)out.pop();out.push(q);}return out;};
  const a=half(p),b=half(p.toReversed());a.pop();b.pop();return a.concat(b);
}
const ring = (x,cy,cz,ry,rz=ry,count=64) => Array.from({length:count},(_,i) => {
  const t=i/count*Math.PI*2;return [x,cy+Math.cos(t)*ry,cz+Math.sin(t)*rz];
});
function path(d, extra='') {return `<path d="${d}" ${extra}/>`;}

export function routeSVG(s) {
  const {u,width:w,height:h} = s;
  const join=smooth(interval(u,0,.95));
  const opacity=1-smooth(interval(u,1.0,1.65));
  const endY=mix(.955*h,.48*h,join),startY=mix((s.mobile?.845:.765)*h,.23*h,join);
  const starts=[.17,.39,.61,.83];
  const routes=starts.map((x,i)=>{
    const startX=mix(x*w,w*.5+(i-1.5)*w*.075,join);
    const midY=mix(startY,endY,.55);
    return path(`M${n(startX)} ${n(startY)}V${n(midY-18)}Q${n(startX)} ${n(midY+14)} ${n(mix(startX,w*.5,.5))} ${n(midY+26)}T${n(w*.5)} ${n(endY)}`);
  }).join('');
  return `<g class="scene-line" opacity="${n(opacity)}">${routes}<circle cx="${n(w*.5)}" cy="${n(endY)}" r="5" fill="var(--bg)"/>${path(`M${w*.5} ${endY+5}V${mix(endY+5,h*.68,join)}`)}</g>`;
}

export function airframeSVG(s, {windowOutlines=true,windowOpacity=1}={}) {
  const P=s.project, by=s.bodyY;
  const profiles=[[-380,0],[-359,.30],[-325,.67],[-260,.94],[-170,1],[140,.96],[245,.61],[310,.19],[350,0]];
  const cloud=profiles.flatMap(([x,r])=>ring(x,0,0,by*r,44*r,48)).map(P);
  const wings=[];
  for(const sign of [-1,1]){
    wings.push([[-30,-by*.35,sign*32],[110,-by*.7,sign*255],[170,-by*.7,sign*263],[80,-by*.45,sign*38]]);
    wings.push([[225,10,sign*21],[290,18,sign*116],[323,18,sign*119],[292,5,sign*13]]);
  }
  const wingPaths=wings.map(p=>path(pointsPath(p.map(P)),'fill="var(--bg)"')).join('');
  const body=path(pointsPath(hull(cloud)),'fill="var(--bg)"');
  const fin=path(pointsPath([[200,by*.55,0],[270,by+102,0],[300,by+102,0],[318,by*.15,0]].map(P)),'fill="var(--bg)"');
  const cockpit=path(pointsPath([[-333,by*.33,33],[-316,by*.53,38],[-282,by*.53,41],[-274,by*.33,43]].map(P)));
  const windowAlpha=smooth(interval(s.u,2.5,3.35));
  const windows=windowOutlines?s.windows.map(w=>`<rect x="${n(w.x-w.width/2)}" y="${n(w.y-w.height/2)}" width="${n(w.width)}" height="${n(w.height)}" rx="${n(w.radius)}" fill="var(--bg)"/>`).join(''):'';
  return `<g class="scene-line">${wingPaths}${body}${fin}${cockpit}<g opacity="${n(windowAlpha*windowOpacity)}">${windows}</g></g>`;
}

export function engineSVG(s) {
  const P=s.project,[cx,cy,cz]=s.engine;
  const profiles=[[-78,36],[-67,43],[52,41],[89,31]];
  const outer=profiles.flatMap(([x,r])=>ring(cx+x,cy,cz,r)).map(P);
  const nacelle=path(pointsPath(hull(outer)),'fill="var(--bg)"');
  const front=ring(cx-78,cy,cz,36).map(P);
  const inner=ring(cx-78.2,cy,cz,29.5).map(P);
  const back=ring(cx+89,cy,cz,31).map(P);
  const blades=Array.from({length:12},(_,i)=>{
    const a=i*Math.PI/6;
    const polar=(r,t)=>P([cx-78.5,cy+Math.cos(t)*r,cz+Math.sin(t)*r]);
    const p1=polar(5,a),p2=polar(21,a+.14),p3=polar(29,a+.52),p4=polar(29,a+.76),p5=polar(13,a+.62),p6=polar(5,a+.48);
    return path(`M${p1.map(n)}Q${p2.map(n)} ${p3.map(n)}L${p4.map(n)}Q${p5.map(n)} ${p6.map(n)}Z`);
  }).join('');
  const visible=clamp(-s.axes[2][0]*2.8);
  const hub=path(pointsPath(ring(cx-78.8,cy,cz,5.5,5.5,40).map(P)),'fill="var(--bg)"');
  const mount=path(pointsPath([[cx+3,cy+43,cz],[cx+9,-bySafe(s),cz],[cx+51,-bySafe(s),cz],[cx+48,cy+43,cz]].map(P)));
  return `<g class="scene-line">${mount}${nacelle}${path(pointsPath(back),'opacity=".45"')}${path(pointsPath(front),'fill="var(--bg)"')}${path(pointsPath(inner))}<g opacity="${n(visible)}">${blades}${hub}</g></g>`;
}
function bySafe(s){return s.bodyY*.65;}

export function sceneSVG(s, options={}) {
  const route=s.u<1.65?routeSVG(s):'';
  const plane=s.u<7.65?airframeSVG(s,options):'';
  const engine=s.u>.95?engineSVG(s):'';
  return `${route}<g opacity="${n(s.planeAlpha*s.fade)}">${plane}${engine}</g>`;
}

export function standaloneSVG(s, options={}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s.width}" height="${s.height}" viewBox="0 0 ${s.width} ${s.height}"><style>:root{--bg:#F6F5F0}.scene-line{fill:none;stroke:#AB7753;stroke-width:${STROKE};stroke-linecap:round;stroke-linejoin:round}.scene-line *{vector-effect:non-scaling-stroke}</style><rect width="100%" height="100%" fill="#F6F5F0"/>${sceneSVG(s,options)}</svg>`;
}
