import test from 'node:test';
import assert from 'node:assert/strict';
import {makeZones,stepZones,buildNetwork,intersects} from '../src/cloud-layout.mjs';
const sample=Array.from({length:9},(_,i)=>({id:'s'+i,skill:'Skill '+i,maxW:110,maxH:62}));
test('seeded assignments stay stable and reserve extra empty zones across viewport sizes',()=>{
 for(const width of [320,375,390,768,1200]){
  const a=makeZones(sample,width,123),b=makeZones(sample,width,123);
  assert.ok(a.allZones.length>sample.length);
  assert.deepEqual([...a.zones],[...b.zones]);
  const zones=[...a.zones.values()];
  for(const [i,z] of zones.entries()){
   assert.ok(z.x>=0&&z.x+z.w<=width+1);
   for(const other of zones.slice(i+1))assert.ok(z.x+z.w<=other.x||other.x+other.w<=z.x||z.y+z.h<=other.y||other.y+other.h<=z.y);
  }
 }
});
test('movement remains inside zones, reflects and preserves speed; selected stays fixed',()=>{
 const layout=makeZones(sample,390,7);
 const nodes=sample.map((n,i)=>({...n,zone:layout.zones.get(n.id),x:0,y:0,vx:6,vy:0,selected:i===0}));
 for(const n of nodes){n.x=n.zone.x+n.zone.w/2;n.y=n.zone.y+n.zone.h/2;}
 const frozen={x:nodes[0].x,y:nodes[0].y};
 for(let i=0;i<8000;i++)stepZones(nodes,1/60);
 assert.deepEqual({x:nodes[0].x,y:nodes[0].y},frozen);
 for(const n of nodes){const z=n.zone;assert.ok(n.x-n.maxW/2>=z.x-1e-6);assert.ok(n.x+n.maxW/2<=z.x+z.w+1e-6);assert.ok(n.y-n.maxH/2>=z.y-1e-6);assert.ok(n.y+n.maxH/2<=z.y+z.h+1e-6);assert.ok(Math.abs(Math.hypot(n.vx,n.vy)-6)<1e-6);}
});
test('generated network is deterministic and its segments avoid reserved text',()=>{
 const layout=makeZones(sample,1200,31);const nodes=sample.map(n=>({...n,zone:layout.zones.get(n.id),x:layout.zones.get(n.id).x+layout.zones.get(n.id).w/2,y:layout.zones.get(n.id).y+layout.zones.get(n.id).h/2}));
 const a=buildNetwork(nodes,1200,layout.height,12),b=buildNetwork(nodes,1200,layout.height,12);
 assert.deepEqual(a,b);assert.ok(a.edges.length>0);
 for(const edge of a.edges){const p=a.anchors[edge.i],q=a.anchors[edge.j];for(const n of nodes){assert.equal(intersects({x:n.x-n.maxW/2,y:n.y-n.maxH/2,w:n.maxW,h:n.maxH},p,q,5),false);}}
});
