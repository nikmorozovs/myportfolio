import test from 'node:test';
import assert from 'node:assert/strict';
import {makeZones} from '../src/cloud-layout.mjs';
import {makeElasticTopology,elasticGeometry} from '../src/cloud-elastic.mjs';
const sample=count=>Array.from({length:count},(_,i)=>({id:'skill-'+i,maxW:86,maxH:56,skill:'Skill '+i,w:86,h:56}));
test('elastic topology determinism and mobile/desktop orientation',()=>{
 for(const [width,count,vertical] of [[320,5,true],[375,7,true],[390,7,true],[768,6,false],[1024,8,false],[1440,9,false]]){
  const nodes=sample(count),layout=makeZones(nodes,width,22);
  for(const n of nodes){n.zone=layout.zones.get(n.id);n.x=n.zone.x+n.zone.w/2;n.y=n.zone.y+n.zone.h/2;}
  const a=makeElasticTopology(nodes,width,layout.height,11);
  assert.equal(a.vertical,vertical);
  assert.deepEqual(a,makeElasticTopology(nodes,width,layout.height,11));
  const before=elasticGeometry(a,nodes,0),after=elasticGeometry(a,nodes,4);
  assert.equal(before.links.length,count);
  assert.notEqual(before.root,after.root);
  for(let i=0;i<count;i++){
   const link=before.links[i],n=nodes[i];
   assert.ok(Math.abs(link.anchor.y-n.y)<.001);
   assert.ok(Math.abs(Math.abs(link.anchor.x-n.x)-n.w/2)<.001);
  }
 }
});
test('network geometry follows skills without modifying motion',()=>{
 const nodes=sample(5),width=390,layout=makeZones(nodes,width,23);
 for(const n of nodes){n.zone=layout.zones.get(n.id);n.x=n.zone.x+n.zone.w/2;n.y=n.zone.y+n.zone.h/2;n.vx=6;n.vy=0;}
 const t=makeElasticTopology(nodes,width,layout.height,12),g=elasticGeometry(t,nodes,1);
 nodes[0].x+=2;nodes[0].w+=10;
 const changed=elasticGeometry(t,nodes,1);
 assert.notEqual(g.links[0].d,changed.links[0].d);
 assert.equal(nodes[0].vx,6);
});
