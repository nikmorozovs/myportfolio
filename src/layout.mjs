import {PHASE,READING,clamp} from './geometry.mjs';
export function workProgress({height,headerHeight=0}){
 const start=PHASE.hold,end=PHASE.pan,entry=Math.max((end-start)*.3,(headerHeight+40)/Math.max(height,1));
 return clamp(start+entry,start+.3,end-.75);
}
/** A short section pins below the header; a long one scrolls normally before
 * pinning its last readable viewport. In both cases only the extra range holds. */
export function aboutTrack({viewportHeight,headerHeight,contentHeight}){
 const available=Math.max(1,viewportHeight-headerHeight),height=Math.max(available,contentHeight),reserve=viewportHeight*READING.extraAbout;
 return{contentHeight:height,trackHeight:height+reserve,reserve,stickyTop:Math.min(headerHeight,viewportHeight-height),available};
}
export const sectionTarget=(documentTop,headerHeight,maxScroll)=>clamp(documentTop-headerHeight,0,maxScroll);
