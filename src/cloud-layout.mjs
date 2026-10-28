// Deterministic, geometry-driven skill placement and sparse decorative network.
export function random(seed){let s=seed>>>0;return()=>((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296);}
export function intersects(rect,a,b,pad=8){
 const x=rect.x-pad,y=rect.y-pad,w=rect.w+pad*2,h=rect.h+pad*2;
 let lo=0,hi=1,dx=b.x-a.x,dy=b.y-a.y;
 for(const [p,q] of [[-dx,a.x-x],[dx,x+w-a.x],[-dy,a.y-y],[dy,y+h-a.y]]){
  if(p===0){if(q<0)return false;continue;}
  const r=q/p;if(p<0)lo=Math.max(lo,r);else hi=Math.min(hi,r);
  if(lo>hi)return false;
 }
 return true;
}
export function makeZones(items,width,seed=9){
 const rng=random(seed),mobile=width<540;
 // Two mobile columns cut the long vertical strip into a compact cluster.
 const columns=mobile?2:width<850?2:3;
 const gap=mobile?14:22,pad=mobile?8:20;
 const cell=(width-2*pad-gap*(columns-1))/columns;
 const maxH=Math.max(0,...items.map(n=>n.maxH));
 const rowH=Math.max(mobile?88:110,maxH+(mobile?18:30));
 const rows=Math.ceil(items.length/columns);
 const zones=[];
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const x=pad+col*(cell+gap),y=pad+row*(rowH+gap);
  zones.push({x,y,w:cell,h:rowH,centerX:x+cell/2,centerY:y+rowH/2+(rng()-.5)*4});
 }
 const available=[...zones];
 for(let i=available.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[available[i],available[j]]=[available[j],available[i]];}
 const ordered=[...items].sort((a,b)=>b.maxW-a.maxW);
 const result=new Map();
 for(const n of ordered){
  const index=available.findIndex(z=>z.w>=n.maxW+4&&z.h>=n.maxH+4);
  if(index<0)throw new Error('Insufficient room for skill '+n.skill);
  result.set(n.id,available.splice(index,1)[0]);
 }
 return {zones:result,height:pad*2+rows*rowH+(rows-1)*gap,allZones:zones};
}
export function stepZones(items,dt){
 dt=Math.min(.05,Math.max(0,dt));
 for(const n of items){if(n.selected||!n.zone)continue;
  const z=n.zone,rx=Math.max(0,(z.w-n.maxW)/2),ry=Math.max(0,(z.h-n.maxH)/2);
  n.x+=n.vx*dt;n.y+=n.vy*dt;
  const left=z.x+z.w/2-rx,right=z.x+z.w/2+rx,top=z.y+z.h/2-ry,bottom=z.y+z.h/2+ry;
  if(n.x<left||n.x>right)n.vx*=-1;
  if(n.y<top||n.y>bottom)n.vy*=-1;
  n.x=Math.max(left,Math.min(right,n.x));n.y=Math.max(top,Math.min(bottom,n.y));
 }
}
export function skillRects(items){return items.map(n=>({x:n.x-n.maxW/2,y:n.y-n.maxH/2,w:n.maxW,h:n.maxH}));}
// The protected region covers the full motion envelope, not just the resting text.
// Routed paths remain clear even as labels move inside their individual zones.
export function buildNetwork(items,width,height,seed=19){
 const rng=random(seed),protectedZones=items.filter(n=>n.zone).map(n=>({
  x:n.zone.x+5,y:n.zone.y+5,w:n.zone.w-10,h:n.zone.h-10
 }));
 const anchors=[],skillAnchors=[];
 const add=(p,skill=null)=>{const i=anchors.length;anchors.push({...p,skill});return i;};
 for(const n of items){
  if(!n.zone)continue;
  const z=n.zone,corner=Math.floor(rng()*4);
  const x=corner%2?z.x+z.w-2:z.x+2;
  const y=corner>1?z.y+z.h-2:z.y+2;
  skillAnchors.push(add({x,y},n.id));
 }
 // Visibility-graph waypoints sit in gutters and around every protected corner.
 // A seeded nearest-neighbour backbone is connected before decoration is added.
 const vertices=[...skillAnchors];
 for(const r of protectedZones){
  for(const [x,y] of [[r.x-2,r.y-2],[r.x+r.w+2,r.y-2],
   [r.x-2,r.y+r.h+2],[r.x+r.w+2,r.y+r.h+2]]){
   if(x>=1&&x<=width-1&&y>=1&&y<=height-1)vertices.push(add({x,y}));
  }
 }
 for(const p of [{x:2,y:2},{x:width-2,y:2},{x:2,y:height-2},{x:width-2,y:height-2}])vertices.push(add(p));
 const clear=(a,b)=>!protectedZones.some(r=>intersects(r,a,b,1));
 const adj=Array.from({length:anchors.length},()=>[]);
 for(let i=0;i<anchors.length;i++)for(let j=i+1;j<anchors.length;j++){
  if(clear(anchors[i],anchors[j])){
   const cost=Math.hypot(anchors[i].x-anchors[j].x,anchors[i].y-anchors[j].y);
   if(cost>0){adj[i].push([j,cost]);adj[j].push([i,cost]);}
  }
 }
 function route(start,end){
  const dist=Array(anchors.length).fill(Infinity),prev=Array(anchors.length).fill(-1),used=new Set();
  dist[start]=0;
  while(used.size<anchors.length){
   let u=-1;for(let i=0;i<dist.length;i++)if(!used.has(i)&&(u<0||dist[i]<dist[u]))u=i;
   if(u<0||!Number.isFinite(dist[u]))break;
   if(u===end)break;used.add(u);
   for(const [v,cost] of adj[u])if(dist[u]+cost<dist[v]){
    dist[v]=dist[u]+cost;prev[v]=u;
   }
  }
  if(!Number.isFinite(dist[end]))return null;
  const path=[end];while(path[0]!==start){path.unshift(prev[path[0]]);}
  return {path,d:dist[end]};
 }
 const candidates=[];
 for(let i=0;i<skillAnchors.length;i++)for(let j=i+1;j<skillAnchors.length;j++){
  const routed=route(skillAnchors[i],skillAnchors[j]);
  if(routed)candidates.push({i,j,...routed});
 }
 candidates.sort((a,b)=>a.d-b.d);
 const parent=skillAnchors.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
 const edges=[],edgeSet=new Set(),degree=Array(skillAnchors.length).fill(0);
 const addRoute=c=>{
  for(let k=1;k<c.path.length;k++){
   const i=c.path[k-1],j=c.path[k],key=[Math.min(i,j),Math.max(i,j)].join(':');
   if(!edgeSet.has(key)){edgeSet.add(key);edges.push({i,j});}
  }
  degree[c.i]++;degree[c.j]++;
 };
 let joined=0;
 for(const c of candidates){
  const a=find(c.i),b=find(c.j);if(a===b)continue;
  parent[a]=b;addRoute(c);joined++;
  if(joined===skillAnchors.length-1)break;
 }
 // Secondary clustered edges are optional; they cannot destroy backbone connectivity.
 let extras=0;const budget=Math.min(Math.ceil(skillAnchors.length*.4),4);
 for(const c of candidates){
  if(extras>=budget)break;
  if(degree[c.i]>=3||degree[c.j]>=3||c.path.length>4||rng()<.35)continue;
  if(c.path.every((v,k)=>k===0||edgeSet.has([Math.min(v,c.path[k-1]),Math.max(v,c.path[k-1])].join(':'))))continue;
  addRoute(c);extras++;
 }
 return {anchors,edges,skillAnchors,connected:joined===skillAnchors.length-1};
}
