/** Fixed-dimension passenger aircraft, two sampling levels, hidden-line SVG projection.
 * Positive x points aft; y is up; z is starboard. No dimensions depend on scroll.
 */
export const AIRCRAFT=Object.freeze({length:900,radius:38,span:736,windowWidth:3.8,windowHeight:5,windowPitch:8.4,caseX:-109.2,windowY:11,engineX:-80,engineY:-46,engineZ:122,engineRadius:23,intakeX:-121});
const TAU=Math.PI*2;
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,k)=>a.map(v=>v*k);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const mix=(a,b,t)=>a+(b-a)*t;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const profiles=[[-450,-1,.15,.15],[-443,0,5,5],[-427,1,14,14],[-405,3,24,24],[-380,4,32,32],[-350,3,37,37],[-310,1,38,38],[-240,0,38,38],[180,0,38,38],[255,1,34,33],[320,4,25,24],[375,8,15,14],[420,13,6,5.5],[450,17,.15,.15]];
function profile(x){
 let i=0;while(i<profiles.length-2&&x>profiles[i+1][0])i++;
 const p=profiles[i],q=profiles[i+1],t=clamp((x-p[0])/(q[0]-p[0]));
 return [1,2,3].map(j=>{
  const before=profiles[Math.max(0,i-1)],after=profiles[Math.min(profiles.length-1,i+2)];
  const m0=(q[j]-before[j])/(q[0]-before[0])*(q[0]-p[0]);
  const m1=(after[j]-p[j])/(after[0]-p[0])*(q[0]-p[0]);
  return (2*t*t*t-3*t*t+1)*p[j]+(t*t*t-2*t*t+t)*m0+(-2*t*t*t+3*t*t)*q[j]+(t*t*t-t*t)*m1;
 });
}
export function bodyPoint(x,y,sign=1,offset=.13){const [cy,ry,rz]=profile(x);return [x,y,sign*(rz*Math.sqrt(Math.max(0,1-((y-cy)/ry)**2))+offset)];}
function shellPoint(x,theta,offset=.16){const [cy,ry,rz]=profile(x);return [x,cy+(ry+offset)*Math.cos(theta),(rz+offset)*Math.sin(theta)];}
function roundedRect(cx,cy,w,h,r,count=6){
 const out=[];for(let k=0;k<4;k++){
  const centres=[[cx+w/2-r,cy+h/2-r],[cx-w/2+r,cy+h/2-r],[cx-w/2+r,cy-h/2+r],[cx+w/2-r,cy-h/2+r]];
  for(let j=0;j<=count;j++){const a=(k*.5+j/count*.5)*Math.PI;out.push([centres[k][0]+Math.cos(a)*r,centres[k][1]+Math.sin(a)*r]);}
 }out.push(out[0]);return out;
}
export const CASE_WINDOWS=Object.freeze([-1.5,-.5,.5,1.5].map((n,i)=>Object.freeze({i,x:AIRCRAFT.caseX+n*AIRCRAFT.windowPitch,y:AIRCRAFT.windowY,world:Object.freeze(bodyPoint(AIRCRAFT.caseX+n*AIRCRAFT.windowPitch,AIRCRAFT.windowY))})));
const doorXs=[-326,-184,151,283];
export const PASSENGER_WINDOWS=Object.freeze(Array.from({length:67},(_,i)=>(i-36.5)*AIRCRAFT.windowPitch).filter(x=>!doorXs.some(d=>Math.abs(x-d)<9)).map(x=>Object.freeze({x,y:11,caseIndex:CASE_WINDOWS.findIndex(c=>Math.abs(c.x-x)<.001)})));

function loft(name,rings,{caps=true}={}){
 const vertices=rings.flat(),n=rings[0].length,faces=[];
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<n;j++){
  const a=i*n+j,b=(i+1)*n+j,d=i*n+(j+1)%n,c=(i+1)*n+(j+1)%n;faces.push([a,d,b],[b,d,c]);
 }
 if(caps)for(const [ringIndex,reverse]of [[0,true],[rings.length-1,false]]){
  const centre=rings[ringIndex].reduce((a,p)=>add(a,mul(p,1/n)),[0,0,0]),ci=vertices.push(centre)-1;
  for(let j=0;j<n;j++){const a=ringIndex*n+j,b=ringIndex*n+(j+1)%n;faces.push(reverse?[ci,b,a]:[ci,a,b]);}
 }
 return prepareMesh(name,vertices,faces);
}
function prepareMesh(name,vertices,faces){
 const normals=faces.map(f=>cross(sub(vertices[f[1]],vertices[f[0]]),sub(vertices[f[2]],vertices[f[0]])));
 const edges=new Map();faces.forEach((f,i)=>{for(let j=0;j<3;j++){const a=f[j],b=f[(j+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`;let e=edges.get(key);if(!e){e={a,b,faces:[]};edges.set(key,e);}e.faces.push(i);}});
 return {name,vertices,faces,normals,edges:[...edges.values()],centre:vertices.reduce((a,p)=>add(a,mul(p,1/vertices.length)),[0,0,0])};
}
function prism(name,xy,z,thickness){
 let p=xy;const area=p.reduce((a,v,i)=>a+v[0]*p[(i+1)%p.length][1]-p[(i+1)%p.length][0]*v[1],0);if(area<0)p=p.toReversed();
 const n=p.length,vertices=[...p.map(v=>[...v,z-thickness/2]),...p.map(v=>[...v,z+thickness/2])],faces=[];
 for(let i=1;i<n-1;i++)faces.push([0,i+1,i],[n,n+i,n+i+1]);
 for(let i=0;i<n;i++){const j=(i+1)%n;faces.push([i,j,n+i],[j,n+j,n+i]);}
 return prepareMesh(name,vertices,faces);
}
function sampleProfile(points,count){
 const out=[];for(let i=0;i<points.length-1;i++)for(let j=0;j<count;j++){
  const t=j/count,p=points[i],q=points[i+1],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+2)];
  out.push(p.map((v,k)=>k===0?mix(v,q[k],t):.5*((2*v)+(-a[k]+q[k])*t+(2*a[k]-5*v+4*q[k]-b[k])*t*t+(-a[k]+3*v-3*q[k]+b[k])*t*t*t)));
 }out.push(points.at(-1));return out;
}
function ring(x,y,z,r,n){return Array.from({length:n},(_,i)=>[x,y+r*Math.cos(TAU*i/n),z+r*Math.sin(TAU*i/n)]);}
function airfoil(lead,chord,baseY,z,thickness,n){return Array.from({length:n},(_,j)=>{
 const theta=TAU*j/n,u=(1-Math.cos(theta))/2;
 const t=5*thickness*(.2969*Math.sqrt(u)-.126*u-.3516*u*u+.2843*u**3-.1036*u**4);
 return [lead+chord*u,baseY+Math.sin(theta)*Math.abs(t)+Math.sin(Math.PI*u)*chord*.012,z];
 });}
function wing(sign,detail=false){
 const stations=detail?28:20,rings=[];for(let i=0;i<=stations;i++){
  const t=i/stations,lead=-145+225*t**1.05,trail=135-16*t;
  rings.push(airfoil(lead,trail-lead,-20+34*t,sign*(5+345*t),mix(30,4,t),detail?32:24));
 }
 for(let i=1;i<=7;i++){
  const t=i/7,a=t*Math.PI/2;rings.push(airfoil(80+25*t,39-25*t,14+50*(1-Math.cos(a)),sign*(350+18*Math.sin(a)),4-2.5*t,detail?32:24));
 }
 return loft(`wing-${sign}`,rings);
}
function stabiliser(sign,detail=false){const rings=[],n=detail?20:16;for(let i=0;i<=14;i++){const t=i/14,lead=278+112*t,trail=426-5*t;rings.push(airfoil(lead,trail-lead,18+23*t,sign*(8+155*t),mix(13,2,t),n));}return loft(`stabiliser-${sign}`,rings);}
function fin(detail=false){const rings=[],n=detail?24:20;for(let i=0;i<=20;i++){
 const t=i/20,lead=235+134*t**.82,trail=426-18*t;
 const section=airfoil(lead,trail-lead,0,0,mix(16,2,t),n);
 rings.push(section.map(p=>[p[0],24+178*t,p[1]]));
 }return loft('fin',rings);}
function engine(sign,detail,meshes,curves){
 const cx=AIRCRAFT.engineX,cy=AIRCRAFT.engineY,cz=sign*AIRCRAFT.engineZ,n=detail?80:48;
 const shell=[[42,15],[28,20],[7,22.5],[-20,23],[-34,22],[-40,20],[-41,18.7],[-39.5,17.4],[-33,17],[-25,17]];
 meshes.push(loft(`nacelle-${sign}`,sampleProfile(shell,detail?5:3).map(([x,r])=>ring(cx+x,cy,cz,r,n)),{caps:false}));
 meshes.push(loft(`exhaust-${sign}`,sampleProfile([[40,14.9],[47,11],[52,8.7]],3).map(([x,r])=>ring(cx+x,cy,cz,r,n))));
 meshes.push(prism(`pylon-${sign}`,[[cx-22,cy+17],[cx+22,-10],[cx+55,-11],[cx+36,cy+13]],cz,9));
 meshes.push(loft(`fan-back-${sign}`,[-24.5,-24].map(x=>ring(cx+x,cy,cz,17,n))));
 for(const [x,r]of [[-41,18.7],[-39.5,17.4],[42,15]])curves.push({name:'engine-ring',engineSign:sign,points:[...ring(cx+x,cy,cz,r,96),ring(cx+x,cy,cz,r,96)[0]]});
 for(let i=0;i<24;i++){
  const angle=i*TAU/24,radial=detail?9:5,vertices=[],faces=[],outlineA=[],outlineB=[];
  for(let j=0;j<=radial;j++){
   const t=j/radial,r=mix(3.8,16.8,t),sweep=.35*t+.28*t*t;
   const p=(offset)=>[cx-26+1.1*Math.sin(t*Math.PI),cy+Math.cos(angle+sweep+offset)*r,cz+Math.sin(angle+sweep+offset)*r];
   const a=p(0),b=p(mix(.18,.22,t));vertices.push(a,b);outlineA.push(a);outlineB.push(b);
   if(j){const k=j*2;faces.push([k-2,k-1,k],[k-1,k+1,k]);}
  }
  meshes.push(prepareMesh(`blade-${sign}-${i}`,vertices,faces));curves.push({name:'fan-blade',engineSign:sign,normal:[-1,0,0],points:[...outlineA,...outlineB.toReversed(),outlineA[0]]});
 }
 meshes.push(loft(`spinner-${sign}`,sampleProfile([[-33,.12],[-32,1.4],[-29,3.2],[-25,4.2]],detail?5:3).map(([x,r])=>ring(cx+x,cy,cz,r,detail?48:32))));
}

const cache=new Map();
export function getAircraft(level='overview'){
 if(cache.has(level))return cache.get(level);
 const detail=level==='detail',meshes=[],curves=[],radial=detail?80:56;
 const xs=detail?Array.from({length:87},(_,i)=>-400+i*480/86):sampleProfile(profiles,5).map(p=>p[0]);
 meshes.push(loft('fuselage',xs.map(x=>{const [cy,ry,rz]=profile(x);return Array.from({length:radial},(_,j)=>[x,cy+ry*Math.cos(TAU*j/radial),rz*Math.sin(TAU*j/radial)]);}),{caps:!detail}));
 if(!detail){meshes.push(wing(-1),stabiliser(-1),fin(),stabiliser(1));engine(-1,false,meshes,curves);}
 meshes.push(wing(1,detail));engine(1,detail,meshes,curves);
 for(const sign of detail?[1]:[-1,1]){
  for(const w of PASSENGER_WINDOWS){
   if(detail&&(w.x< -395||w.x>75))continue;
   curves.push({name:'passenger-window',caseIndex:sign===1?w.caseIndex:-1,normal:[0,.28,sign*.96],points:roundedRect(w.x,w.y,3.8,5,3.8*.38,5).map(([x,y])=>bodyPoint(x,y,sign))});
  }
  for(const x of doorXs){if(detail&&(x< -390||x>70))continue;curves.push({name:'door',normal:[0,0,sign],points:roundedRect(x,1,12.5,29,3,7).map(([x,y])=>bodyPoint(x,y,sign,.19))});}
  if(!detail)for(const pane of [ [[-409,.64],[-386,.53],[-386,.98],[-402,1.04]], [[-382,.55],[-356,.73],[-356,1.15],[-382,1.02]] ]){
   const points=[];for(let i=0;i<pane.length;i++)for(let j=0;j<10;j++){const p=pane[i],q=pane[(i+1)%pane.length],t=j/10;points.push(shellPoint(mix(p[0],q[0],t),sign*mix(p[1],q[1],t)));}points.push(points[0]);curves.push({name:'cockpit',normal:[-.25,.60,sign*.65],points});
  }
 }
 for(const c of curves)if(['passenger-window','cockpit','door'].includes(c.name))c.bodyNormals=c.points.map(bodyNormal);
 const model={level,meshes,curves,anchors:{windows:CASE_WINDOWS.map(c=>[...c.world]),engine:[AIRCRAFT.engineX,AIRCRAFT.engineY,AIRCRAFT.engineZ],intake:[AIRCRAFT.intakeX,AIRCRAFT.engineY,AIRCRAFT.engineZ]},bvh:null,last:null};
 // The runtime needs surface boundaries only. Build the heavier ray reference
 // lazily, so a model handoff does not allocate thousands of unused ray records.
 let triangles=null;Object.defineProperty(model,'triangles',{get(){return triangles??=meshes.flatMap(m=>m.faces.map(f=>{const a=m.vertices[f[0]],b=m.vertices[f[1]],c=m.vertices[f[2]];return{a,e1:sub(b,a),e2:sub(c,a),min:[0,1,2].map(k=>Math.min(a[k],b[k],c[k])),max:[0,1,2].map(k=>Math.max(a[k],b[k],c[k])),centre:[0,1,2].map(k=>(a[k]+b[k]+c[k])/3)};}));}});
 cache.set(level,model);return model;
}
function buildBVH(ts){
 const min=[0,1,2].map(k=>Math.min(...ts.map(t=>t.min[k]))),max=[0,1,2].map(k=>Math.max(...ts.map(t=>t.max[k])));
 if(ts.length<=10)return{min,max,ts};const lengths=max.map((v,i)=>v-min[i]),axis=lengths.indexOf(Math.max(...lengths));ts.sort((a,b)=>a.centre[axis]-b.centre[axis]);const half=ts.length>>1;
 return{min,max,left:buildBVH(ts.slice(0,half)),right:buildBVH(ts.slice(half))};
}
function hitsBox(o,d,node){let lo=0,hi=5000;for(let i=0;i<3;i++){
 if(Math.abs(d[i])<1e-10){if(o[i]<node.min[i]||o[i]>node.max[i])return false;continue;}
 let a=(node.min[i]-o[i])/d[i],b=(node.max[i]-o[i])/d[i];if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(hi<lo)return false;
 }return hi>.02;}
function hitsTriangle(o,d,t){
 const a=t.a,e=t.e1,f=t.e2;
 const px=d[1]*f[2]-d[2]*f[1],py=d[2]*f[0]-d[0]*f[2],pz=d[0]*f[1]-d[1]*f[0];
 const det=e[0]*px+e[1]*py+e[2]*pz;if(det>-1e-9&&det<1e-9)return false;
 const inv=1/det,vx=o[0]-a[0],vy=o[1]-a[1],vz=o[2]-a[2];
 const u=(vx*px+vy*py+vz*pz)*inv;if(u< -1e-8||u>1.00000001)return false;
 const qx=vy*e[2]-vz*e[1],qy=vz*e[0]-vx*e[2],qz=vx*e[1]-vy*e[0];
 const v=(d[0]*qx+d[1]*qy+d[2]*qz)*inv;if(v< -1e-8||u+v>1.00000001)return false;
 return (f[0]*qx+f[1]*qy+f[2]*qz)*inv>.025;
}
function occluded(node,o,d){if(!hitsBox(o,d,node))return false;if(node.ts)return node.ts.some(t=>hitsTriangle(o,d,t));return occluded(node.left,o,d)||occluded(node.right,o,d);}
export function pointVisible(model,p,d){if(!model.bvh)model.bvh=buildBVH(model.triangles);return !occluded(model.bvh,add(p,mul(d,.055)),d);}
function visibleSegments(model,a,b,d,va,vb,output,depth=0){
 if(va&&vb){output.push([a,b]);return;}
 const mid=mul(add(a,b),.5),vm=pointVisible(model,mid,d);
 if(!va&&!vb&&!vm)return;
 if(depth>=6){if(va)output.push([a,mid]);if(vb)output.push([mid,b]);return;}
 visibleSegments(model,a,mid,d,va,vm,output,depth+1);visibleSegments(model,mid,b,d,vm,vb,output,depth+1);
}
export function visibleGeometry(model,axes){
 const key=axes.flat().map(x=>x.toFixed(7)).join(',');if(model.last?.key===key)return model.last.value;
 const d=axes[2],segments=[];
 for(const mesh of model.meshes){
  if(mesh.name.startsWith('blade-')||mesh.name.startsWith('fan-back'))continue;
  const faceFront=mesh.normals.map(n=>dot(n,d)>=0),visibility=new Map();
  const visible=i=>{if(!visibility.has(i))visibility.set(i,pointVisible(model,mesh.vertices[i],d));return visibility.get(i);};
  for(const edge of mesh.edges){
   if(edge.faces.length>1&&faceFront[edge.faces[0]]===faceFront[edge.faces[1]])continue;
   const a=mesh.vertices[edge.a],b=mesh.vertices[edge.b];visibleSegments(model,a,b,d,visible(edge.a),visible(edge.b),segments);
  }
 }
 const curves=[];
 for(const curve of model.curves){
  if(curve.normal&&dot(curve.normal,d)<(curve.name==='fan-blade'?.02:-.02))continue;
  if(curve.name==='passenger-window'){
   const probes=[0,6,12,18].map(i=>pointVisible(model,curve.points[i],d));
   if(probes.every(Boolean)){curves.push({...curve,segments:curve.points.slice(1).map((p,i)=>[curve.points[i],p])});continue;}
   if(probes.every(x=>!x))continue;
  }
  const ss=[];let va=pointVisible(model,curve.points[0],d);for(let i=1;i<curve.points.length;i++){
   const a=curve.points[i-1],b=curve.points[i],vb=pointVisible(model,b,d);visibleSegments(model,a,b,d,va,vb,ss);va=vb;
  }curves.push({...curve,segments:ss});
 }
 const masks=model.meshes.filter(m=>!m.name.startsWith('blade')&&!m.name.startsWith('fan-back')).map(m=>hull(m.vertices.map(p=>[dot(axes[0],p),dot(axes[1],p)])));
 const value={segments,curves,masks};model.last={key,value};return value;
}
function hull(points){
 const a=points.toSorted((p,q)=>p[0]-q[0]||p[1]-q[1]),cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
 const half=ps=>{const out=[];for(const p of ps){while(out.length>1&&cross(out.at(-2),out.at(-1),p)<=0)out.pop();out.push(p);}return out;};
 const lo=half(a),hi=half(a.toReversed());lo.pop();hi.pop();return lo.concat(hi);
}
const num=x=>Number(x.toFixed(2));
function segmentPath(segments,P,rect){let out='';for(const [a,b]of segments){const p=P(a),q=P(b);if(Math.max(p[0],q[0])<rect.x||Math.min(p[0],q[0])>rect.x+rect.width||Math.max(p[1],q[1])<rect.y||Math.min(p[1],q[1])>rect.y+rect.height)continue;out+=`M${num(p[0])},${num(p[1])}L${num(q[0])},${num(q[1])}`;}return out;}
export function referenceAircraftSVG(s,{hideCaseWindows=false}={}){
 const model=getAircraft(s.model),P=s.project,rect=s.clip,visible=visibleGeometry(model,s.axes);
 const tx=dot(s.axes[0],s.target),ty=dot(s.axes[1],s.target);
 const masks=visible.masks.map(ps=>`<path d="M${ps.map(p=>[num(s.center[0]+(p[0]-tx)*s.scale),num(s.center[1]-(p[1]-ty)*s.scale)].join(',')).join('L')}Z" fill="#F6F5F0" stroke="none"/>`).join('');
 const outline=segmentPath(visible.segments,P,rect);
 const features=visible.curves.filter(c=>!(hideCaseWindows&&c.caseIndex>=0)).map(c=>`<path d="${segmentPath(c.segments,P,rect)}"/>`).join('');
 return `<defs><clipPath id="aircraft-crop"><rect x="${num(rect.x)}" y="${num(rect.y)}" width="${num(rect.width)}" height="${num(rect.height)}"/></clipPath></defs><g clip-path="url(#aircraft-crop)" opacity="${num(s.fade)}">${masks}<g class="scene-line"><path d="${outline}"/>${features}</g></g>`;
}

function bodyInside(p){if(p[0]<-450||p[0]>450)return false;const [cy,ry,rz]=profile(p[0]);return ((p[1]-cy)/ry)**2+(p[2]/rz)**2<.998;}
function bodyNormal(p){
 const [cy,ry,rz]=profile(p[0]),before=profile(p[0]-.05),after=profile(p[0]+.05),dy=p[1]-cy;
 const yc=(after[0]-before[0])*10,yr=(after[1]-before[1])*10,zr=(after[2]-before[2])*10;
 const normal=[-dy*yc/(ry*ry)-dy*dy*yr/(ry**3)-p[2]*p[2]*zr/(rz**3),dy/(ry*ry),p[2]/(rz*rz)];
 return normal;
}
function clipSegment(a,b,test){
 const va=test(a),vb=test(b);if(va&&vb)return[[a,b]];if(!va&&!vb){const m=mul(add(a,b),.5);if(!test(m))return[];return [...clipSegment(a,m,test),...clipSegment(m,b,test)];}
 let lo=0,hi=1;for(let i=0;i<10;i++){const t=(lo+hi)/2;if(test(a.map((v,j)=>mix(v,b[j],t)))===va)lo=t;else hi=t;}
 const cut=a.map((v,j)=>mix(v,b[j],(lo+hi)/2));return va?[[a,cut]]:[[cut,b]];
}
function quickSilhouette(mesh,d,bodyClip=false){
 const ff=mesh.normals.map(n=>dot(n,d)>=0),out=[];
 for(const e of mesh.edges){if(e.faces.length>1&&ff[e.faces[0]]===ff[e.faces[1]])continue;
  const a=mesh.vertices[e.a],b=mesh.vertices[e.b];out.push(...(bodyClip?clipSegment(a,b,p=>!bodyInside(p)):[[a,b]]));
 }return out;
}
/** Closed projected surface boundary. A convex hull would fill the empty space
 * above the swept wing, incorrectly erasing the cabin behind a winglet. */
function silhouetteLoops(mesh,d,axes){
 const front=mesh.normals.map(n=>dot(n,d)>=0),edges=mesh.edges.filter(e=>e.faces.length===1||front[e.faces[0]]!==front[e.faces[1]]),adjacent=new Map(),used=new Set(),loops=[];
 edges.forEach((e,i)=>{for(const v of [e.a,e.b]){if(!adjacent.has(v))adjacent.set(v,[]);adjacent.get(v).push(i);}});
 for(let i=0;i<edges.length;i++){
  if(used.has(i))continue;const first=edges[i].a,vertices=[first];let v=first,index=i;
  while(index!==undefined&&!used.has(index)){
   used.add(index);const e=edges[index];v=e.a===v?e.b:e.a;vertices.push(v);if(v===first)break;
   index=adjacent.get(v)?.find(j=>!used.has(j));
  }
  if(v===first&&vertices.length>3)loops.push(vertices.map(j=>[dot(axes[0],mesh.vertices[j]),dot(axes[1],mesh.vertices[j])]));
 }
 return loops.length?loops:[closedHull([mesh],axes)];
}
function closedHull(meshes,axes){return hull(meshes.flatMap(m=>m.vertices).map(p=>[dot(axes[0],p),dot(axes[1],p)]));}
function quickGeometry(model,axes){
 const key=axes.flat().map(x=>x.toFixed(7)).join(',');if(model.fast?.key===key)return model.fast.value;
 const d=axes[2],components=[];
 const body=model.meshes.find(m=>m.name==='fuselage');
 const bodyCurves=model.curves.filter(c=>['passenger-window','cockpit','door'].includes(c.name)).map(c=>{
  const segments=[];for(let i=1;i<c.points.length;i++){
   const a=c.points[i-1],b=c.points[i],na=dot(c.bodyNormals[i-1],d),nb=dot(c.bodyNormals[i],d);
   if(na>=0&&nb>=0)segments.push([a,b]);else if((na>=0)!==(nb>=0)){const t=na/(na-nb),cut=a.map((v,j)=>mix(v,b[j],t));segments.push(na>=0?[a,cut]:[cut,b]);}
  }
  return {...c,segments};
 });
 const centre=m=>m.centre;
 components.push({name:'fuselage',depth:dot(centre(body),d),mask:closedHull([body],axes),bodyCurves});
 for(const m of model.meshes.filter(m=>m.name.startsWith('wing-')||m.name.startsWith('stabiliser')||m.name==='fin')){
  components.push({name:m.name,depth:dot(centre(m),d),maskLoops:silhouetteLoops(m,d,axes),segments:quickSilhouette(m,d,true)});
 }
 for(const sign of model.level==='detail'?[1]:[-1,1]){
  const nacelle=model.meshes.find(m=>m.name===`nacelle-${sign}`),exhaust=model.meshes.find(m=>m.name===`exhaust-${sign}`),pylon=model.meshes.find(m=>m.name===`pylon-${sign}`),spinner=model.meshes.find(m=>m.name===`spinner-${sign}`);
  const cy=AIRCRAFT.engineY,cz=sign*AIRCRAFT.engineZ;
  components.push({name:`engine-${sign}`,depth:dot([AIRCRAFT.engineX,cy,cz],d),engine:true,pylonMask:closedHull([pylon],axes),pylonLines:quickSilhouette(pylon,d,true),mask:closedHull([nacelle,exhaust],axes),spinnerMask:closedHull([spinner],axes),spinnerLines:quickSilhouette(spinner,d),curves:model.curves.filter(c=>c.engineSign===sign),inlet:[...ring(AIRCRAFT.intakeX,cy,cz,18.7,96),ring(AIRCRAFT.intakeX,cy,cz,18.7,96)[0]],hole:[...ring(AIRCRAFT.intakeX+.03,cy,cz,17.35,96),ring(AIRCRAFT.intakeX+.03,cy,cz,17.35,96)[0]]});
 }
 components.sort((a,b)=>a.depth-b.depth);
 model.fast={key,value:components};return components;
}
export function rotateFanPoint(point,angle,sign=1){const y=point[1]-AIRCRAFT.engineY,z=point[2]-sign*AIRCRAFT.engineZ,c=Math.cos(angle),v=Math.sin(angle);return[point[0],AIRCRAFT.engineY+y*c-z*v,sign*AIRCRAFT.engineZ+y*v+z*c];}
/** Screen-space opaque silhouettes also describe the particle occlusion layer. */
export function aircraftOcclusion(s){
 const tx=dot(s.axes[0],s.target),ty=dot(s.axes[1],s.target),screen=ps=>ps.map(p=>[s.center[0]+(p[0]-tx)*s.scale,s.center[1]-(p[1]-ty)*s.scale]);
 return quickGeometry(getAircraft(s.model),s.axes).flatMap(c=>(c.engine?[c.mask,c.pylonMask]:c.maskLoops||[c.mask]).map(p=>({part:c.name,points:screen(p)})));
}
export function cabinPatternVisible(s){
 const r=s.clip;
 return getAircraft(s.model).curves.filter(c=>c.name==='passenger-window').some(c=>{
  if(c.normal&&dot(c.normal,s.axes[2])<=0)return false;
  const ps=c.points.map(s.project),xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]);
  return Math.max(...xs)>=r.x-12&&Math.min(...xs)<=r.x+r.width+12&&Math.max(...ys)>=r.y-12&&Math.min(...ys)<=r.y+r.height+12;
 });
}
export function aircraftSVG(s,{hideCaseWindows=false,hideCabinWindows=false,windowPhase=0}={}){
 const model=getAircraft(s.model),P=s.project,axes=s.axes,tx=dot(axes[0],s.target),ty=dot(axes[1],s.target),rect=s.clip;
 const screenHull=ps=>ps.map(p=>[s.center[0]+(p[0]-tx)*s.scale,s.center[1]-(p[1]-ty)*s.scale]);
 const path2=ps=>`M${ps.map(p=>p.map(num).join(',')).join('L')}Z`;
 const mask=ps=>`<path d="${path2(screenHull(ps))}" fill="#F6F5F0" stroke="none"/>`;
 const loopMask=loops=>`<path d="${loops.map(ps=>path2(screenHull(ps))).join('')}" fill="#F6F5F0" fill-rule="evenodd" stroke="none"/>`;
 const line=ss=>`<path d="${segmentPath(ss,P,rect)}"/>`;
 const components=quickGeometry(model,axes),draw=[],blockers=[];
 for(const c of components){if(c.engine)blockers.push(mask(c.pylonMask),mask(c.mask));else if(c.maskLoops)blockers.push(loopMask(c.maskLoops));else blockers.push(mask(c.mask));}
 const farWing=components.find(c=>c.name==='wing--1'),fuselage=components.find(c=>c.name==='fuselage');
 // Centre sorting alone fails when the far wing spans depths on both sides of
 // its engine. Mask the actual overlap throughout the top-to-side camera path.
 const farMask=farWing?`<mask id="far-engine-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${s.width}" height="${s.height}" style="mask-type:luminance"><rect width="${s.width}" height="${s.height}" fill="white"/><path d="${farWing.maskLoops.map(ps=>path2(screenHull(ps))).join('')}" fill="black" fill-rule="evenodd"/><path d="${path2(screenHull(fuselage.mask))}" fill="black"/></mask>`:'';
 for(const c of components){
  if(c.engine){
   draw.push(`<g data-aircraft-part="${c.name}"${c.name==='engine--1'&&farWing?' mask="url(#far-engine-mask)"':''}>`);
   draw.push(mask(c.pylonMask),`<g class="scene-line">${line(c.pylonLines)}</g>`,mask(c.mask),`<path class="scene-line" d="${path2(screenHull(c.mask))}"/>`);
   if(-axes[2][0]>.012){
    const id=`inlet-${c.name}`;
    draw.push(`<defs><clipPath id="${id}"><path d="${path2(c.hole.map(P))}"/></clipPath></defs><path d="${path2(c.inlet.map(P))}" fill="#F6F5F0" class="scene-line"/><g clip-path="url(#${id})" class="scene-line">`);
    draw.push(`<g class="fan-rotor" data-angle="${s.fanAngle||0}">`);
    for(const f of c.curves.filter(f=>f.name==='fan-blade'))draw.push(`<path d="${path2(f.points.map(p=>P(rotateFanPoint(p,s.fanAngle||0,f.engineSign))))}"/>`);
    draw.push('</g>');
    draw.push(mask(c.spinnerMask),line(c.spinnerLines),`</g><path class="scene-line" d="${path2(c.hole.map(P))}"/>`);
   }
   draw.push('</g>');
  }else if(c.bodyCurves){
   draw.push(mask(c.mask),`<path class="scene-line" d="${path2(screenHull(c.mask))}"/><g class="scene-line">`);
   for(const curve of c.bodyCurves){
    if(hideCaseWindows&&curve.caseIndex>=0||hideCabinWindows&&curve.name==='passenger-window')continue;
    // A fractional interrupted carousel phase survives the handoff only in
    // the cabin pattern. Camera, airframe, wings and engines never move.
    const segments=windowPhase&&curve.name==='passenger-window'?curve.segments.map(ss=>ss.map(p=>bodyPoint(p[0]-windowPhase*AIRCRAFT.windowPitch,p[1],Math.sign(p[2])||1))):curve.segments;
    draw.push(line(segments));
   }draw.push('</g>');
  }else draw.push(loopMask(c.maskLoops),`<g class="scene-line">${line(c.segments)}</g>`);
 }
 return `<g class="aircraft-motion"><defs><clipPath id="aircraft-crop"><rect x="${num(rect.x)}" y="${num(rect.y)}" width="${num(rect.width)}" height="${num(rect.height)}"/></clipPath>${farMask}</defs><g clip-path="url(#aircraft-crop)"><g class="particle-occlusion">${blockers.join('')}</g><g class="aircraft-drawing" opacity="${num(s.fade)}">${draw.join('')}</g></g></g>`;
}
