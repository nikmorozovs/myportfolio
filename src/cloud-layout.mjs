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
 const rng=random(seed),mobile=width<540,columns=mobile?1:width<850?2:3;
 const gap=mobile?12:22,pad=mobile?10:20;
 const cell=(width-2*pad-gap*(columns-1))/columns;
 const maxH=Math.max(0,...items.map(n=>n.maxH));
 const rowH=Math.max(mobile?116:130,maxH+40);
 const rows=Math.ceil((items.length+Math.max(columns,2))/columns);
 const zones=[];
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const stagger=(row%2?1:-1)*Math.min(12,cell*.04);
  const x=pad+col*(cell+gap),y=pad+row*(rowH+gap);
  zones.push({x,y,w:cell,h:rowH,centerX:x+cell/2+stagger,centerY:y+rowH/2+(rng()-.5)*14});
 }
 const shuffled=[...zones].sort(()=>rng()-.5);
 // Sort shuffle is intentionally replaced by seeded Fisher-Yates for cross-engine stability.
 const available=[...zones];for(let i=available.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[available[i],available[j]]=[available[j],available[i]];}
 const ordered=[...items].sort((a,b)=>b.maxW-a.maxW);
 const result=new Map();
 for(const n of ordered){
  const index=available.findIndex(z=>z.w>=n.maxW+8&&z.h>=n.maxH+8);
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
export function buildNetwork(items,width,height,seed=19){
 const rng=random(seed),anchors=[],rects=skillRects(items);
 for(const n of items){const z=n.zone;if(!z)continue;
  // Position anchors outside the reserved text envelope, towards zone corners.
  const sides=[[-1,-1],[1,-1],[-1,1],[1,1]];
  const s=sides[Math.floor(rng()*sides.length)];
  anchors.push({x:z.x+z.w/2+s[0]*(z.w/2-5),y:z.y+z.h/2+s[1]*(z.h/2-5),skill:n.id});
 }
 for(let i=0;i<Math.max(3,Math.ceil(items.length*.7));i++){
  for(let attempt=0;attempt<24;attempt++){const a={x:10+rng()*(width-20),y:10+rng()*(height-20),skill:null};
   if(!rects.some(r=>a.x>=r.x-12&&a.x<=r.x+r.w+12&&a.y>=r.y-12&&a.y<=r.y+r.h+12)){anchors.push(a);break;}
  }
 }
 const maxDistance=Math.max(125,Math.min(290,width*.38)),edges=[],degree=Array(anchors.length).fill(0);
 const candidates=[];for(let i=0;i<anchors.length;i++)for(let j=i+1;j<anchors.length;j++){
  const a=anchors[i],b=anchors[j],d=Math.hypot(a.x-b.x,a.y-b.y);
  if(d>maxDistance||d<24||rects.some(r=>intersects(r,a,b,5)))continue;
  candidates.push({i,j,d,rank:d*(.8+rng()*.6)});
 }
 candidates.sort((a,b)=>a.rank-b.rank);
 for(const c of candidates){if(degree[c.i]>=2||degree[c.j]>=2||edges.length>=Math.ceil(anchors.length*.67))continue;
  if(rng()<.26)continue;edges.push(c);degree[c.i]++;degree[c.j]++;
 }
 return {anchors,edges};
}
