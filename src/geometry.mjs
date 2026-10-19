import {AIRCRAFT,CASE_WINDOWS,aircraftSVG} from './aircraft.mjs';
export const STROKE=1.5;
export const PHASE=Object.freeze({takeoff:2.35,turn:3.75,zoom:5.85,handoff:7.15,hold:8,pan:9.25,orbit:10.85,approach:12.85,fade:14.15,end:15});
export const END=PHASE.end,WORK=8.6;
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
export function introLayout(width,height){
 const mobile=width<640;
 const labelsY=height<480?.84*height:mobile?(height<735?.81:.76)*height:.705*height;
 return{labelsY,lineStart:labelsY+(height<480?26:mobile?38:49),worldHeight:scrollUnit(width,height)*4.4+height};
}
function slerp(a,b,t){const d=dot(a.slice(0,3),b.slice(0,3))+a[3]*b[3],angle=Math.acos(clamp(d,-1,1));if(angle<1e-8)return a;return a.map((v,i)=>(Math.sin((1-t)*angle)*v+Math.sin(t*angle)*b[i])/Math.sin(angle));}
function basis([x,y,z,w]){return[[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]];}
export function sceneAt(progress,width,height){
 const u=clamp(progress,0,END),mobile=width<640,unit=scrollUnit(width,height),travel=u*unit;
 const topQ=[.5,.5,.5,.5],turn=smoother(interval(u,PHASE.turn,PHASE.zoom));
 let axes=basis(slerp(topQ,[0,0,0,1],turn));
 const sideScale=Math.min(width*.82/AIRCRAFT.length,height*.45/300);
 const topScale=Math.min(sideScale*.75,height*.36/AIRCRAFT.length);
 const enter=smoother(interval(u,PHASE.takeoff,PHASE.turn));
 let scale=logMix(topScale*.035,topScale,enter);
 let center=[width*.5,mix(-height*.45,height*.57,enter)],target=[0,0,0];

 if(u>=PHASE.turn){scale=logMix(topScale,sideScale,turn);center[1]=mix(height*.57,height*.63,turn);}
 const caseSpan=3*AIRCRAFT.windowPitch+AIRCRAFT.windowWidth;
 const windowWidth=Math.min(142,(width-(mobile?48:90))*AIRCRAFT.windowWidth/caseSpan);
 const finalScale=windowWidth/AIRCRAFT.windowWidth;
 const zoom=smoother(interval(u,PHASE.zoom,PHASE.hold));
 if(u>=PHASE.zoom){scale=logMix(sideScale,finalScale,zoom);target=lerp3([0,0,0],[AIRCRAFT.caseX,11,CASE_WINDOWS[0].world[2]],zoom);center[1]=mix(height*.63,height*.55,zoom);}
 const engine=[AIRCRAFT.engineX,AIRCRAFT.engineY,AIRCRAFT.engineZ],intake=[AIRCRAFT.intakeX,AIRCRAFT.engineY,AIRCRAFT.engineZ];
 const engineScale=Math.min(width*.68/(2*AIRCRAFT.engineRadius),height*.58/(2*AIRCRAFT.engineRadius));
 const pan=smoother(interval(u,PHASE.pan,PHASE.orbit));
 if(u>=PHASE.pan){
  target=lerp3([AIRCRAFT.caseX,11,CASE_WINDOWS[0].world[2]],engine,pan);scale=logMix(finalScale,engineScale,pan);center[1]=mix(height*.55,height*.53,pan);
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
 if(u>=PHASE.pan)clip={x:0,y:mix(center[1]-bandHeight/2,0,pan),width,height:mix(bandHeight,height,pan)};
 let state=0;if(u>.18)state=1;if(u>=PHASE.takeoff)state=2;if(u>=PHASE.turn)state=3;if(u>=PHASE.zoom)state=4;if(u>=PHASE.pan)state=5;if(u>=PHASE.orbit)state=6;if(u>=PHASE.fade)state=7;
 const model=u<PHASE.handoff?'overview':'detail';
 return{u,width,height,mobile,unit,travel,worldTranslate:[0,-travel],intro:introLayout(width,height),state,model,axes,scale,target,center,project,windows,windowWidth,finalScale,engine,engineScale,intake,orbit,yaw,fade,planeAlpha:1,clip,caseReady:u>=PHASE.hold&&u<PHASE.pan};
}
/** Fixed final typography column. Only the external shell interpolates. */
export function previewRect(_origin,width,height){
 const top=height<480?64:90,bottom=height<480?18:24;
 const w=Math.min(420,width-40,(height-top-bottom)*.76),h=w/.76;
 return{x:(width-w)/2,y:clamp((height-h)/2,top,height-h-bottom),width:w,height:h,radius:w*.38,paddingX:Math.max(26,w*.16),paddingY:h*.16,compact:h<390};
}
export function routeMapSVG(width,height){
 const {lineStart}=introLayout(width,height),unit=scrollUnit(width,height),w=width,Y=k=>k*unit,X=k=>k*w,paths=[];
 const shape=[
  [[.17,lineStart],[.17,Y(.98)],[.80,Y(.91)],[.77,Y(1.28)],[.74,Y(1.56)],[.12,Y(1.32)],[.22,Y(1.72)],[.28,Y(1.98)],[.50,Y(2.03)],[.50,Y(2.20)]],
  [[.39,lineStart],[.39,Y(1.10)],[.12,Y(1.14)],[.30,Y(1.38)],[.54,Y(1.60)],[.82,Y(1.28)],[.71,Y(1.72)],[.65,Y(1.98)],[.50,Y(2.04)],[.50,Y(2.20)]],
  [[.61,lineStart],[.61,Y(1.03)],[.86,Y(1.07)],[.66,Y(1.34)],[.46,Y(1.63)],[.13,Y(1.30)],[.29,Y(1.77)],[.36,Y(2.01)],[.50,Y(2.07)],[.50,Y(2.20)]],
  [[.83,lineStart],[.83,Y(1.14)],[.23,Y(.97)],[.17,Y(1.39)],[.12,Y(1.67)],[.86,Y(1.53)],[.67,Y(1.84)],[.61,Y(2.04)],[.50,Y(2.09)],[.50,Y(2.20)]]
 ];
 shape.forEach((ps,i)=>{for(const offset of [0,5]){
  const p=ps.map(([x,y],j)=>[X(x)+(j===ps.length-1?0:offset*(i%2?1:-1)),y]);
  paths.push(`<path opacity="${offset?.5:1}" d="M${p[0].map(num)}C${p[1].map(num)} ${p[2].map(num)} ${p[3].map(num)}C${p[4].map(num)} ${p[5].map(num)} ${p[6].map(num)}C${p[7].map(num)} ${p[8].map(num)} ${p[9].map(num)}"/>`);
 }});
 const runway=`<path d="M${X(.5)-8},${Y(2.2)}V${Y(3.55)}M${X(.5)+8},${Y(2.2)}V${Y(3.55)}"/><path stroke-dasharray="12 20" d="M${X(.5)},${Y(2.2)}V${Y(3.62)}"/>`;
 return `<g class="scene-line">${paths.join('')}${runway}</g>`;
}
export function routeSVG(s){return `<g transform="translate(0 ${num(-s.travel)})">${routeMapSVG(s.width,s.height)}</g>`;}
export function pointsPath(ps,close=true){return`M${ps.map(p=>p.map(num).join(',')).join('L')}${close?'Z':''}`;}
export function sceneSVG(s,options={}){
 if(s.fade===0)return'';
 const bounds=[[-460,-105,-368],[460,205,368]].flatMap(p=>[p,[p[0],p[1],-p[2]],[p[0],-p[1],p[2]],[-p[0],p[1],p[2]]]).map(s.project);
 if(Math.max(...bounds.map(p=>p[1]))<0||Math.min(...bounds.map(p=>p[1]))>s.height)return'';
 return aircraftSVG(s,{hideCaseWindows:options.hideCaseWindows});
}
export function airframeSVG(s,options={}){return aircraftSVG(s,options);}
export function engineSVG(s){return aircraftSVG({...s,model:'detail'});}
export function standaloneSVG(s,options={}){
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${s.width}" height="${s.height}" viewBox="0 0 ${s.width} ${s.height}"><style>:root{--bg:#F6F5F0}.scene-line{fill:none;stroke:#AB7753;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.scene-line *{vector-effect:non-scaling-stroke}</style><rect width="100%" height="100%" fill="#F6F5F0"/>${s.u<PHASE.turn?routeSVG(s):''}${sceneSVG(s,options)}</svg>`;
}
