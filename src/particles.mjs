import {PHASE,clamp} from './geometry.mjs';
export function emissionAllowed(s){return s.u>.35&&[1,2,3,5,6].includes(s.state);}
export function flowDirection(s,x,y){
 const nose=[-s.axes[0][0],s.axes[1][0]];
 let dx=-nose[0],dy=-nose[1];
 if(s.u>=PHASE.orbit){const t=s.orbit,rx=x-s.center[0],ry=y-s.center[1],r=Math.hypot(rx,ry)||1;dx=(1-t)*1+t*rx/r;dy=(1-t)*-.18*Math.sin(t*Math.PI)+t*ry/r;}
 const l=Math.hypot(dx,dy)||1;return[dx/l,dy/l];
}
/** Time-only lifecycle: progress changes emission, never deletes or retargets survivors. */
export class ParticleSystem{
 constructor(random=Math.random){this.random=random;this.items=[];this.rate=0;this.credit=0;this.totalSpawned=0;}
 step(dt,s){
  dt=clamp(dt,0,.05);const allowed=emissionAllowed(s),max=s.mobile?12:20;
  if(!allowed){this.rate=0;this.credit=0;}else this.rate+=((s.mobile?2.2:3.0)-this.rate)*(1-Math.exp(-dt/.8));
  this.rate=Math.min(this.rate,s.mobile?2.2:3);
  if(allowed)this.credit+=this.rate*dt;
  while(this.credit>=1&&this.items.length<max){this.credit-=1;this.spawn(s);}
  if(this.items.length>=max)this.credit=Math.min(this.credit,.99);
  for(const p of this.items){p.x+=p.vx*dt;p.y+=p.vy*dt;p.age+=dt;}
  this.items=this.items.filter(p=>p.x> -50&&p.x<s.width+50&&p.y> -50&&p.y<s.height+50);
 }
 spawn(s){
  const rand=this.random;let x,y;
  if(s.u>=PHASE.orbit&&s.orbit>.4){const a=rand()*Math.PI*2,r=20+rand()*55;x=s.center[0]+Math.cos(a)*r;y=s.center[1]+Math.sin(a)*r;}
  else{const d=flowDirection(s,s.width*.25,s.height*.7);if(Math.abs(d[1])>Math.abs(d[0])){x=rand()*s.width;y=d[1]<0?s.height+25:-25;}else{x=d[0]>0?-25:s.width+25;y=100+rand()*Math.max(1,s.height-140);}}
  const [dx,dy]=flowDirection(s,x,y),speed=(s.mobile?145:200)*(1+rand()*.35);
  this.items.push({x,y,vx:dx*speed,vy:dy*speed,length:5+rand()*8,age:0});this.totalSpawned++;
 }
 resize(from,to){if(!from.width||!from.height)return;for(const p of this.items){p.x*=to.width/from.width;p.y*=to.height/from.height;}}
}
export function mountParticles(canvas){
 const context=canvas.getContext('2d');if(!context)return{setState(){},stop(){}};
 const system=new ParticleSystem();let pose=null,raf=0,last=0,enabled=true,size={width:0,height:0};
 function tick(now){
  raf=0;if(!enabled||!pose||document.hidden){last=0;return;}
  const dt=last?Math.min(.05,(now-last)/1000):0;last=now;system.step(dt,pose);
  context.clearRect(0,0,size.width,size.height);context.lineWidth=1.5;context.strokeStyle='rgba(171,119,83,0.28)';context.lineCap='round';context.beginPath();
  for(const p of system.items){const length=Math.hypot(p.vx,p.vy);context.moveTo(p.x,p.y);context.lineTo(p.x-p.vx/length*p.length,p.y-p.vy/length*p.length);}context.stroke();
  if(emissionAllowed(pose)||system.items.length)raf=requestAnimationFrame(tick);else last=0;
 }
 function wake(){if(!raf&&enabled)raf=requestAnimationFrame(tick);}
 document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden)wake();});
 return{
  setState(s){enabled=true;if(size.width!==s.width||size.height!==s.height){system.resize(size,s);size={width:s.width,height:s.height};const dpr=Math.min(devicePixelRatio||1,2);canvas.width=s.width*dpr;canvas.height=s.height*dpr;context.setTransform(dpr,0,0,dpr,0,0);}pose=s;wake();},
  stop(){enabled=false;cancelAnimationFrame(raf);raf=0;last=0;system.items=[];context.clearRect(0,0,size.width,size.height);}
 };
}
