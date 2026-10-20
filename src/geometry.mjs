import {AIRCRAFT,CASE_WINDOWS,aircraftSVG} from './aircraft.mjs';
export const STROKE=1.5;
export const S4_TIMING=Object.freeze({start:5.85,previousEnd:10,ratio:.9});
const s4End=S4_TIMING.start+(S4_TIMING.previousEnd-S4_TIMING.start)*S4_TIMING.ratio,shift=s4End-S4_TIMING.previousEnd;
export const READING=Object.freeze({extraWork:.75+shift,extraAbout:.75});
// Compress the whole S4 range; keep its entry and all later transition lengths.
export const PHASE=Object.freeze({competenciesEnd:1.05,takeoff:1.9,liftoff:2.5,turn:3.75,zoom:5.85,handoff:7.6,hold:8,pan:s4End,orbit:12.5+shift,approach:14.5+shift,fade:15.8+shift,end:16.65+shift});
export const END=PHASE.end,WORK=PHASE.hold+(PHASE.pan-PHASE.hold)*.3;
export const RUNWAY=Object.freeze({width:16*.5,length:1.35*.5,convergence:2.2,thinLength:.06,blendLength:.12});
export const TAKEOFF=Object.freeze({parkFraction:.12,liftoffFraction:.84,miniMin:24,miniMax:40});
export const TIMES=Object.freeze([0,...Object.values(PHASE)]);
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const interval=(u,a,b)=>clamp((u-a)/(b-a));
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export const smoother=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10);};
const logMix=(a,b,t)=>Math.exp(mix(Math.log(a),Math.log(b),t));
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const lerp3=(a,b,t)=>a.map((x,i)=>mix(x,b[i],t));
const num=x=>Number(x.toFixed(3));
export const scrollUnit=(w,h)=>h*(w<640?1.08:1);
export function introLayout(width,height,unit=scrollUnit(width,height)){
 const mobile=width<640;
 const labelsY=height<480?.84*height:mobile?(height<735?.81:.76)*height:.705*height;
 return{labelsY,lineStart:labelsY+(height<480?26:mobile?38:49),readyY:1.83*unit,readyWidth:width*.42,readyBottom:2.015*unit,worldHeight:unit*4.4+height};
}
/** The miniature is fixed to the runway before a quadratic accelerating roll.
 * A Hermite liftoff preserves position and velocity in screen coordinates. */
export function takeoffPose(progress,width,height,unit=scrollUnit(width,height)){
 const r=runwayLayout(width,height,unit),groundT=interval(progress,PHASE.takeoff,PHASE.liftoff),distance=r.length*(TAKEOFF.liftoffFraction-TAKEOFF.parkFraction);
 const parked=r.start+r.length*TAKEOFF.parkFraction,worldY=parked+distance*groundT*groundT;
 const miniScale=Math.max(TAKEOFF.miniMin,Math.min(TAKEOFF.miniMax,width*.075,height*.05))/AIRCRAFT.length;
 const sideScale=Math.min(width*.82/AIRCRAFT.length,height*.45/300),topScale=Math.min(sideScale*.75,height*.36/AIRCRAFT.length);
 if(progress<=PHASE.liftoff)return{center:[r.cx,worldY-progress*unit],scale:miniScale,worldY,groundT};
 const t=interval(progress,PHASE.liftoff,PHASE.turn),duration=PHASE.turn-PHASE.liftoff,y0=parked+distance-PHASE.liftoff*unit,y1=height*.57;
 const tangent=(2*distance/(PHASE.liftoff-PHASE.takeoff)-unit)*duration;
 const y=(2*t**3-3*t*t+1)*y0+(t**3-2*t*t+t)*tangent+(-2*t**3+3*t*t)*y1;
 return{center:[r.cx,y],scale:logMix(miniScale,topScale,smoother(t)),worldY:y+progress*unit,groundT};
}
function slerp(a,b,t){const d=dot(a.slice(0,3),b.slice(0,3))+a[3]*b[3],angle=Math.acos(clamp(d,-1,1));if(angle<1e-8)return a;return a.map((v,i)=>(Math.sin((1-t)*angle)*v+Math.sin(t*angle)*b[i])/Math.sin(angle));}
function basis([x,y,z,w]){return[[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]];}
export function sceneAt(progress,width,height,options={}){
 const u=clamp(progress,0,END),mobile=width<640,unit=options.unit||scrollUnit(width,height),travel=u*unit;
 const topQ=[.5,.5,.5,.5],turn=smoother(interval(u,PHASE.turn,PHASE.zoom));
 let axes=basis(slerp(topQ,[0,0,0,1],turn));
 const sideScale=Math.min(width*.82/AIRCRAFT.length,height*.45/300);
 const topScale=Math.min(sideScale*.75,height*.36/AIRCRAFT.length);
 const departure=takeoffPose(u,width,height,unit);
 let scale=departure.scale,center=[...departure.center],target=[0,0,0];

 if(u>=PHASE.turn){scale=logMix(topScale,sideScale,turn);center[1]=mix(height*.57,height*.63,turn);}
 // Four full windows and a visible part of each neighbour, even on phones.
 const windowWidth=width/4.8*AIRCRAFT.windowWidth/AIRCRAFT.windowPitch;
 const finalScale=windowWidth/AIRCRAFT.windowWidth;
 const zoom=smoother(interval(u,PHASE.zoom,PHASE.hold));
 if(u>=PHASE.zoom){scale=logMix(sideScale,finalScale,zoom);target=lerp3([0,0,0],[AIRCRAFT.caseX,11,CASE_WINDOWS[0].world[2]],zoom);center[1]=mix(height*.63,height*.55,zoom);}
 const engine=[AIRCRAFT.engineX,AIRCRAFT.engineY,AIRCRAFT.engineZ],intake=[AIRCRAFT.intakeX,AIRCRAFT.engineY,AIRCRAFT.engineZ];
 const engineScale=Math.min(width*.68/(2*AIRCRAFT.engineRadius),height*.58/(2*AIRCRAFT.engineRadius));
 const pan=smoother(interval(u,PHASE.pan,PHASE.orbit));
 if(u>=PHASE.pan){
  target=lerp3([AIRCRAFT.caseX,11,CASE_WINDOWS[0].world[2]],engine,pan);
  // Briefly frame the physical connection before closing onto the nacelle.
  // This remains a cropped fragment, and avoids panning through empty space.
  const midpoint=mix(PHASE.pan,PHASE.orbit,.45),bridgeScale=Math.min(engineScale,width/180,height/150);
  scale=u<midpoint?logMix(finalScale,bridgeScale,smoother(interval(u,PHASE.pan,midpoint))):logMix(bridgeScale,engineScale,smoother(interval(u,midpoint,PHASE.orbit)));
  center[1]=mix(height*.55,height*.53,pan);
  const e=.13*pan;axes=[[1,0,0],[0,Math.cos(e),-Math.sin(e)],[0,Math.sin(e),Math.cos(e)]];
 }
 const orbit=smoother(interval(u,PHASE.orbit,PHASE.approach)),yaw=orbit*Math.PI/2;
 if(u>=PHASE.orbit){
  const e=.13*(1-orbit),c=Math.cos(yaw),s=Math.sin(yaw);
  axes=[[c,0,s],[Math.sin(e)*s,Math.cos(e),-Math.sin(e)*c],[-s*Math.cos(e),Math.sin(e),c*Math.cos(e)]];
  target=lerp3(engine,intake,orbit);
 }
 if(u>=PHASE.approach)scale=engineScale*logMix(1,3.8,smoother(interval(u,PHASE.approach,PHASE.fade)));
 if(u>=PHASE.fade)scale=engineScale*logMix(3.8,6.3,smoother(interval(u,PHASE.fade,END)));
 const fade=1-smooth(interval(u,PHASE.fade,END));
 const project=point=>{const v=point.map((x,i)=>x-target[i]);return[center[0]+dot(axes[0],v)*scale,center[1]-dot(axes[1],v)*scale];};
 const windows=CASE_WINDOWS.map(c=>{const p=project(c.world);return{i:c.i,world:[...c.world],x:p[0],y:p[1],width:AIRCRAFT.windowWidth*scale,height:AIRCRAFT.windowHeight*scale,radius:AIRCRAFT.windowWidth*scale*.38};});
 const bandHeight=Math.max(164,windowWidth/.76+76),crop=smoother(interval(u,PHASE.zoom,PHASE.handoff));
 let clip={x:0,y:mix(0,center[1]-bandHeight/2,crop),width,height:mix(height,bandHeight,crop)};
 if(u>=PHASE.pan){const reveal=smoother(interval(u,PHASE.pan,mix(PHASE.pan,PHASE.orbit,.45)));clip={x:0,y:mix(center[1]-bandHeight/2,0,reveal),width,height:mix(bandHeight,height,reveal)};}
 // Specification states are semantic, not decorative 01–08 chapter labels.
 let state=0;if(u>=PHASE.competenciesEnd)state=1;if(u>=PHASE.takeoff)state=2;if(u>=PHASE.turn)state=3;if(u>=PHASE.zoom)state=4;if(u>=PHASE.pan)state=5;if(u>=PHASE.approach)state=6;if(u>=END)state=7;
 const model=u<PHASE.handoff?'overview':'detail';
 const vanishingPoint=project([AIRCRAFT.engineX+30,AIRCRAFT.engineY,AIRCRAFT.engineZ]);
 const fanAngle=3*Math.PI*interval(u,PHASE.approach,END);
 return{u,width,height,mobile,unit,travel,worldTranslate:[0,-travel],intro:introLayout(width,height,unit),departure,state,model,axes,scale,target,center,project,windows,windowWidth,finalScale,engine,engineScale,intake,orbit,yaw,fade,planeAlpha:1,clip,vanishingPoint,fanAngle,caseReady:u>=PHASE.hold&&u<PHASE.pan};
}
/** Fixed final typography column. Only the external shell interpolates. */
export function previewRect(_origin,width,height,{headerHeight=0,safeBottom=0}={}){
 const top=Math.max(height<480?64:90,headerHeight+12),bottom=Math.max(height<480?18:24,safeBottom+12);
 const w=Math.min(420,width-40,(height-top-bottom)*.76),h=w/.76;
 return{x:(width-w)/2,y:clamp((height-h)/2,top,height-h-bottom),width:w,height:h,radius:w*.38,paddingX:Math.max(26,w*.16),paddingY:h*.16,compact:h<390};
}
export function runwayLayout(width,height,unit=scrollUnit(width,height)){
 const thinStart=RUNWAY.convergence*unit,blendStart=thinStart+RUNWAY.thinLength*unit,start=blendStart+RUNWAY.blendLength*unit;
 return{cx:width*.5,width:RUNWAY.width,thinStart,blendStart,start,end:start+RUNWAY.length*unit,length:RUNWAY.length*unit};
}
export function routeMapSVG(width,height,unit=scrollUnit(width,height)){
 const {lineStart}=introLayout(width,height,unit),w=width,Y=k=>k*unit,X=k=>k*w,paths=[];
 const shape=[
  [[.17,lineStart],[.17,Y(.98)],[.80,Y(.91)],[.77,Y(1.28)],[.74,Y(1.56)],[.12,Y(1.32)],[.22,Y(1.72)],[.28,Y(1.98)],[.50,Y(2.03)],[.50,Y(2.20)]],
  [[.39,lineStart],[.39,Y(1.10)],[.12,Y(1.14)],[.30,Y(1.38)],[.54,Y(1.60)],[.82,Y(1.28)],[.71,Y(1.72)],[.65,Y(1.98)],[.50,Y(2.04)],[.50,Y(2.20)]],
  [[.61,lineStart],[.61,Y(1.03)],[.86,Y(1.07)],[.66,Y(1.34)],[.46,Y(1.63)],[.13,Y(1.30)],[.29,Y(1.77)],[.36,Y(2.01)],[.50,Y(2.07)],[.50,Y(2.20)]],
  [[.83,lineStart],[.83,Y(1.14)],[.23,Y(.97)],[.17,Y(1.39)],[.12,Y(1.67)],[.86,Y(1.53)],[.67,Y(1.84)],[.61,Y(2.04)],[.50,Y(2.09)],[.50,Y(2.20)]]
 ];
 shape.forEach((ps,i)=>{for(const offset of [0,5]){
  const p=ps.map(([x,y],j)=>[X(x)+(j===ps.length-1?0:offset*(i%2?1:-1)),y]);
  const left=i%2===0,edge=X(left?.255:.745)+(left?-offset:offset),outer=X(left?.18:.82),turnY=Y(1.72+i*.025);
  // Keep a deliberate empty pocket around the real heading, not a text mask.
  p[6]=[outer,turnY];
  // Collinear forward-facing handles remove corners without moving the knots.
  p[4]=p[3].map((v,j)=>2*v-p[2][j]);
  const exit=p[6].map((v,j)=>v+(v-p[5][j])*.35);
  paths.push(`<path opacity="${offset?.5:1}" d="M${p[0].map(num)}C${p[1].map(num)} ${p[2].map(num)} ${p[3].map(num)}C${p[4].map(num)} ${p[5].map(num)} ${p[6].map(num)}C${exit.map(num)} ${num(edge)},${num(Y(1.98))} ${num(edge)},${num(Y(2.04))}C${num(edge)},${num(Y(2.14))} ${num(X(.5))},${num(Y(2.10))} ${num(X(.5))},${num(Y(2.20))}"/>`);
 }});
 const r=runwayLayout(width,height,unit),half=r.width/2,blend=r.start-r.blendStart,n=num;
 const ribbon=`M${n(r.cx-.75)},${n(r.blendStart)}C${n(r.cx-.75)},${n(r.blendStart+blend*.35)} ${n(r.cx-half)},${n(r.start-blend*.35)} ${n(r.cx-half)},${n(r.start)}V${n(r.end)}H${n(r.cx+half)}V${n(r.start)}C${n(r.cx+half)},${n(r.start-blend*.35)} ${n(r.cx+.75)},${n(r.blendStart+blend*.35)} ${n(r.cx+.75)},${n(r.blendStart)}Z`;
 return `<g class="scene-line">${paths.join('')}<path d="M${n(r.cx)},${n(r.thinStart)}V${n(r.blendStart)}"/></g><path class="runway-fill" d="${ribbon}" fill="#AB7753" stroke="none"/><defs><clipPath id="runway-body-clip"><rect x="${n(r.cx-half)}" y="${n(r.start)}" width="${r.width}" height="${n(r.length)}"/></clipPath></defs><path class="runway-markings" d="M${n(r.cx)},${n(r.start)}V${n(r.end)}" fill="none" stroke="#F6F5F0" stroke-width="1.5" stroke-dasharray="12 20" clip-path="url(#runway-body-clip)"/>`;
}
export function routeSVG(s){return `<g transform="translate(0 ${num(-s.travel)})">${routeMapSVG(s.width,s.height,s.unit)}</g>`;}
export function pointsPath(ps,close=true){return`M${ps.map(p=>p.map(num).join(',')).join('L')}${close?'Z':''}`;}
export function sceneSVG(s,options={}){
 if(s.fade===0)return'';
 const bounds=[[-460,-105,-368],[460,205,368]].flatMap(p=>[p,[p[0],p[1],-p[2]],[p[0],-p[1],p[2]],[-p[0],p[1],p[2]]]).map(s.project);
 if(Math.max(...bounds.map(p=>p[1]))<0||Math.min(...bounds.map(p=>p[1]))>s.height)return'';
 return aircraftSVG(s,{hideCaseWindows:options.hideCaseWindows,hideCabinWindows:options.hideCabinWindows,windowPhase:options.windowPhase});
}
export function airframeSVG(s,options={}){return aircraftSVG(s,options);}
export function engineSVG(s){return aircraftSVG({...s,model:'detail'});}
export function standaloneSVG(s,options={}){
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${s.width}" height="${s.height}" viewBox="0 0 ${s.width} ${s.height}"><style>:root{--bg:#F6F5F0}.scene-line{fill:none;stroke:#AB7753;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.scene-line,.scene-line *{vector-effect:non-scaling-stroke}</style><rect width="100%" height="100%" fill="#F6F5F0"/>${s.u<PHASE.turn?routeSVG(s):''}${sceneSVG(s,options)}</svg>`;
}
