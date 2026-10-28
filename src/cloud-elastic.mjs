import {random,intersects} from './cloud-layout.mjs';

// The root is placed in a free row/column gutter, never over a skill zone.
export function makeElasticTopology(items,width,height,seed=19){
 const rng=random(seed),vertical=width<600||width/Math.max(height,1)<.9;
 const zs=items.map(n=>n.zone).filter(Boolean);
 const lines=vertical?[...new Set(zs.map(z=>z.x+z.w).filter(x=>x<width-8))]:
  [...new Set(zs.map(z=>z.y+z.h).filter(y=>y<height-8))];
 const locate=()=>{
  const candidates=lines.map(v=>{
   const following=zs.map(z=>vertical?z.x:z.y).filter(start=>start>v+2).sort((a,b)=>a-b)[0];
   return following===undefined?null:(v+following)/2;
  }).filter(v=>v!==null);
  const centre=(vertical?width:height)/2;
  return candidates.sort((a,b)=>Math.abs(a-centre)-Math.abs(b-centre))[0]??centre;
 };
 const corridor=locate(),length=vertical?height:width;
 const count=Math.max(4,Math.ceil(length/145));
 const roots=Array.from({length:count},(_,i)=>({
  along:10+(length-20)*i/(count-1),
  offset:(rng()-.5)*3,phase:rng()*Math.PI*2,frequency:.14+rng()*.11,
  radius:1.3+rng()*1.5
 }));
 const branches=items.map((n,i)=>{
  const z=n.zone,center=vertical?z.x+z.w/2:z.y+z.h/2;
  // On desktop the branch travels through a side gutter to reach the spine;
  // mobile branches connect directly across the central free column.
  const side=vertical?(center<corridor?1:-1):(z.x+z.w/2<width/2?1:-1);
  const lane=vertical?null:Math.max(3,Math.min(width-3,side>0?z.x+z.w+7:z.x-7));
  return {id:n.id,side,lane,phase:rng()*Math.PI*2,weight:.32+rng()*.15};
 });
 return {vertical,corridor,roots,branches,width,height,seed};
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pathPoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
export function elasticGeometry(topology,items,time=0){
 const {vertical,corridor,roots,width,height,branches}=topology;
 const rootPoints=roots.map(p=>{
  const shift=p.offset+Math.sin(time*p.frequency+p.phase)*p.radius;
  return vertical?{x:clamp(corridor+shift,corridor-5,corridor+5),y:p.along}:
   {x:p.along,y:clamp(corridor+shift,corridor-5,corridor+5)};
 });
 const smooth=(points)=>{
  if(!points.length)return '';
  let d=`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],m=pathPoint(a,b);
   d+=` Q ${a.x.toFixed(2)} ${a.y.toFixed(2)} ${m.x.toFixed(2)} ${m.y.toFixed(2)}`;
  }
  const p=points.at(-1);return d+` T ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
 };
 const root=smooth(rootPoints),links=[];
 const rootAt=along=>{
  const k=Math.max(0,Math.min(rootPoints.length-2,Math.floor((along-10)/(lengthStep||1))));
  const a=rootPoints[k],b=rootPoints[k+1],axis=vertical?'y':'x';
  const t=clamp((along-a[axis])/Math.max(.001,b[axis]-a[axis]),0,1);
  return vertical?{x:a.x+(b.x-a.x)*t,y:along}:{x:along,y:a.y+(b.y-a.y)*t};
 };
 const lengthStep=roots.length>1?(roots[1].along-roots[0].along):1;
 for(let i=0;i<items.length;i++){
  const n=items[i],cfg=branches[i],z=n.zone;
  // Current visual dimensions include the experience label on selection.
  const w=n.w||n.maxW,h=n.h||n.maxH;
  let anchor,attachment,via;
  if(vertical){
   const dir=cfg.side;
   anchor={x:n.x+dir*w/2,y:n.y};
   attachment=rootAt(clamp(n.y,12,height-12));
   via={x:anchor.x+(attachment.x-anchor.x)*.55,y:n.y+Math.sin(time*.21+cfg.phase)*1.2};
  }else{
   const dir=cfg.side,lane=cfg.lane;
   anchor={x:n.x+dir*w/2,y:n.y};
   attachment=rootAt(lane);
   // The route first enters the side gutter, then follows it toward the root.
   via={x:lane,y:anchor.y};
  }
  const d=vertical?
   `M ${anchor.x.toFixed(2)} ${anchor.y.toFixed(2)} C ${via.x.toFixed(2)} ${anchor.y.toFixed(2)}, ${via.x.toFixed(2)} ${attachment.y.toFixed(2)}, ${attachment.x.toFixed(2)} ${attachment.y.toFixed(2)}`:
   `M ${anchor.x.toFixed(2)} ${anchor.y.toFixed(2)} C ${via.x.toFixed(2)} ${anchor.y.toFixed(2)}, ${via.x.toFixed(2)} ${attachment.y.toFixed(2)}, ${attachment.x.toFixed(2)} ${attachment.y.toFixed(2)}`;
  links.push({id:n.id,d,anchor,attachment,via});
 }
 return {root,rootPoints,links,vertical};
}
