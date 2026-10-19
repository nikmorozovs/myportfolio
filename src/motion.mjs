import {clamp,smooth,interval,PHASE,END} from './geometry.mjs';
export const MOTION=Object.freeze({maxScrollSpeed:4800,responseSpeed:3600,attack:.18,release:.42,amplitudeX:.38,amplitudeY:.22,frequency:2.2,maxFrequency:5.4});
export const speedFraction=speed=>clamp(Math.abs(speed)/MOTION.responseSpeed);
/** One signal sampled from actual page positions, in px/second, never wheel deltas. */
export class ScrollMotion{
 constructor(){this.lastY=null;this.lastTime=null;this.speed=0;}
 rebase(y,now,preserveSpeed=false){this.lastY=y;this.lastTime=now;if(!preserveSpeed)this.speed=0;}
 sample(y,now){
  if(this.lastTime===null){this.rebase(y,now);return 0;}
  const dt=(now-this.lastTime)/1000;if(dt<=0)return this.speed;
  const raw=Math.min(MOTION.maxScrollSpeed,Math.abs(y-this.lastY)/dt),tau=raw>this.speed?MOTION.attack:MOTION.release;
  this.speed+=(raw-this.speed)*(1-Math.exp(-dt/tau));this.lastY=y;this.lastTime=now;return this.speed;
 }
}
export function vibrationEnvelope(s){
 const departure=smooth(interval(s.u,PHASE.takeoff,PHASE.takeoff+.3));
 const beforeWindows=1-smooth(interval(s.u,PHASE.zoom-.15,PHASE.zoom+.35));
 const afterWindows=smooth(interval(s.u,PHASE.pan,PHASE.pan+.35));
 return Math.max(departure*beforeWindows,afterWindows)*s.fade*(s.u<END?1:0);
}
export class AircraftVibration{
 constructor(){this.phase=0;this.frequency=MOTION.frequency;}
 offset(s){const a=vibrationEnvelope(s);if(a===0)return[0,0];return [Math.sin(this.phase)*MOTION.amplitudeX*a,Math.sin(this.phase+.7)*MOTION.amplitudeY*a];}
 step(dt,s,scrollSpeed){this.frequency=MOTION.frequency+(MOTION.maxFrequency-MOTION.frequency)*speedFraction(scrollSpeed);this.phase+=Math.PI*2*this.frequency*Math.max(0,dt);return this.offset(s);}
}
