import {PHASE,END,clamp} from './geometry.mjs';
import {ScrollMotion,AircraftVibration,speedFraction} from './motion.mjs';
export const PARTICLES=Object.freeze({densityMultiplier:2,referenceRate:3,referenceMobileRate:2.2,referenceSpeed:200,referenceMobileSpeed:145,baseSpeed:100,baseMobileSpeed:75,maxSpeed:540,maxMobileSpeed:420,referenceCap:20,referenceMobileCap:12,opacity:.38,ramp:.8,steering:.18});
export function emissionAllowed(s){return s.u>.35&&s.u<END&&s.state!==4;}
export function flowDirection(s,x,y){
 let dx=s.axes[0][0],dy=-s.axes[1][0];
 if(s.u>=PHASE.orbit){const t=s.orbit,v=s.vanishingPoint||s.center,rx=v[0]-x,ry=v[1]-y,r=Math.hypot(rx,ry)||1;dx=(1-t)+t*rx/r;dy=(1-t)*-.18*Math.sin(t*Math.PI)+t*ry/r;}
 const length=Math.hypot(dx,dy)||1;return[dx/length,dy/length];
}
export const particleSpeed=(s,scrollSpeed=0,config=PARTICLES)=>{
 const base=s.mobile?config.baseMobileSpeed:config.baseSpeed,max=s.mobile?config.maxMobileSpeed:config.maxSpeed;
 return base+(max-base)*speedFraction(scrollSpeed);
};
export class ParticleSystem{
 constructor(random=Math.random,config=PARTICLES){this.random=random;this.config=config;this.items=[];this.rate=0;this.credit=0;this.totalSpawned=0;}
 step(dt,s,scrollSpeed=0){
  // Small integration slices make steering and crossings independent of display FPS.
  let remaining=clamp(dt,0,.25);while(remaining>1e-9){const slice=Math.min(remaining,1/120);this.advance(slice,s,scrollSpeed);remaining-=slice;}
 }
 advance(dt,s,scrollSpeed){
  const c=this.config,allowed=emissionAllowed(s),speed=particleSpeed(s,scrollSpeed,c),max=(s.mobile?c.referenceMobileCap:c.referenceCap)*c.densityMultiplier;
  const referenceSpeed=s.mobile?c.referenceMobileSpeed:c.referenceSpeed,referenceRate=s.mobile?c.referenceMobileRate:c.referenceRate;
  // Density = rate × lifetime. Compensating for speed preserves the fixed 2×
  // population instead of losing it as faster particles cross the viewport.
  const targetRate=referenceRate*c.densityMultiplier*speed/referenceSpeed;
  if(!allowed){this.rate=0;this.credit=0;}else{
   const before=this.rate,decay=Math.exp(-dt/c.ramp);this.rate=targetRate+(before-targetRate)*decay;
   this.credit+=targetRate*dt+(before-targetRate)*c.ramp*(1-decay);
  }
  while(allowed&&this.credit>=1&&this.items.length<max){this.credit--;this.spawn(s);}
  if(this.items.length>=max)this.credit=Math.min(this.credit,.99);
  const survivors=[];
  for(const p of this.items){
   if(allowed){
    const desired=flowDirection(s,p.x,p.y),blend=1-Math.exp(-dt/c.steering);let dx=p.dx+(desired[0]-p.dx)*blend,dy=p.dy+(desired[1]-p.dy)*blend;const length=Math.hypot(dx,dy)||1;p.dx=dx/length;p.dy=dy/length;
    p.seeking=s.u>=PHASE.orbit&&s.orbit>.35;p.goal=[...(s.vanishingPoint||s.center)];
   }else if(s.state===4)p.seeking=false; // Preserve each survivor's current path.
   const velocity=speed*p.speedFactor;p.vx=p.dx*velocity;p.vy=p.dy*velocity;
   if(p.seeking&&Math.hypot(p.goal[0]-p.x,p.goal[1]-p.y)<velocity*dt+5)continue;
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.age+=dt;
   if(p.x> -50&&p.x<s.width+50&&p.y> -50&&p.y<s.height+50)survivors.push(p);
  }
  this.items=survivors;
 }
 spawn(s){
  const rand=this.random,converging=s.u>=PHASE.orbit&&s.orbit>.35;let x,y;
  if(converging){const edge=rand()*2*(s.width+s.height);if(edge<s.width){x=edge;y=-25;}else if(edge<s.width+s.height){x=s.width+25;y=edge-s.width;}else if(edge<2*s.width+s.height){x=2*s.width+s.height-edge;y=s.height+25;}else{x=-25;y=2*(s.width+s.height)-edge;}}
  else{const d=flowDirection(s,s.width*.25,s.height*.7);if(Math.abs(d[1])>Math.abs(d[0])){x=rand()*s.width;y=d[1]<0?s.height+25:-25;}else{x=d[0]>0?-25:s.width+25;y=100+rand()*Math.max(1,s.height-140);}}
  const [dx,dy]=flowDirection(s,x,y);this.items.push({x,y,dx,dy,vx:0,vy:0,speedFactor:1+rand()*.35,length:5+rand()*8,age:0,seeking:converging,goal:[...(s.vanishingPoint||s.center)]});this.totalSpawned++;
 }
 resize(from,to){if(!from.width||!from.height)return;for(const p of this.items){p.x*=to.width/from.width;p.y*=to.height/from.height;p.goal[0]*=to.width/from.width;p.goal[1]*=to.height/from.height;}}
}
/** One time clock for the shared speed signal, particle lifecycle and subpixel
 * aircraft transform. Camera geometry is supplied separately from real scroll. */
export function mountParticles(canvas,{getScroll=()=>scrollY,onOffset=()=>{}}={}){
 const context=canvas.getContext('2d'),system=new ParticleSystem(),signal=new ScrollMotion(),vibration=new AircraftVibration();let pose=null,raf=0,last=0,enabled=true,drawn=false,size={width:0,height:0};
 function tick(now){
  raf=0;if(!enabled||!pose||document.hidden){last=0;return;}
  const dt=last?Math.min(.25,(now-last)/1000):0;last=now;const speed=signal.sample(getScroll(),now);
  onOffset(vibration.step(dt,pose,speed));system.step(dt,pose,speed);
  if(context&&(system.items.length||drawn)){
   context.clearRect(0,0,size.width,size.height);context.lineWidth=1.5;context.strokeStyle=`rgba(171,119,83,${PARTICLES.opacity})`;context.lineCap='round';context.beginPath();
   for(const p of system.items){context.moveTo(p.x,p.y);context.lineTo(p.x-p.dx*p.length,p.y-p.dy*p.length);}context.stroke();drawn=system.items.length>0;
  }
  if(pose.u<END||system.items.length||speed>1)raf=requestAnimationFrame(tick);else last=0;
 }
 function wake(){if(!raf&&enabled)raf=requestAnimationFrame(tick);}
 document.addEventListener('visibilitychange',()=>{last=0;signal.rebase(getScroll(),performance.now());if(!document.hidden)wake();});
 return{
  setState(s){enabled=true;if(size.width!==s.width||size.height!==s.height){system.resize(size,s);size={width:s.width,height:s.height};if(context){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=s.width*dpr;canvas.height=s.height*dpr;context.setTransform(dpr,0,0,dpr,0,0);}}pose=s;onOffset(vibration.offset(s));wake();},
  rebase(){signal.rebase(getScroll(),performance.now(),true);last=0;},
  stop(){enabled=false;cancelAnimationFrame(raf);raf=0;last=0;system.items=[];system.rate=system.credit=0;signal.rebase(getScroll(),performance.now());onOffset([0,0]);if(context)context.clearRect(0,0,size.width,size.height);drawn=false;}
 };
}
