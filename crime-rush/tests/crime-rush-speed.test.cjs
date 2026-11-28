const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../engine/config/speed.config.js'),'utf8'),ctx);const s=ctx.window.CrimeRushSpeed;assert.equal(s.worldSpeed,1.55);assert.equal(s.referenceSpeedKmh,115);assert.equal(s.toDisplaySpeed(180),140);assert.equal(s.toPhysicsSpeed(140),180);assert.equal(s.toDisplaySpeed(-1),0);assert.equal(s.toPhysicsSpeed(999),180);assert.ok(Math.abs(s.toDisplaySpeed(s.toPhysicsSpeed(115))-115)<1e-9);console.log('CRIME RUSH speed scale OK');

{const M=require('../engine/vehicles/driving-model.js'),c=M.defaults;
 function run(kmh,hz,input=1){let state={lane:0,lateral:0};for(let i=0;i<hz;i++)state=M.step(state,input,kmh,1/hz,c);return state;}
 const a=run(85,60),b=run(85,30),slow=run(20,60),fast=run(140,60),left=run(85,60,-1);
 assert.ok(Math.abs(a.lane-b.lane)<1e-10);assert.ok(Math.abs(a.lateral-b.lateral)<1e-10);assert.ok(slow.lane<fast.lane&&fast.lane<a.lane);assert.ok(Math.abs(a.lane+left.lane)<1e-10);
 assert.deepEqual(M.step({lane:.25,lateral:.5},1,0,.02),{lane:.25,lateral:0});
 const stop=M.step({lane:.5,lateral:.5},1,100,.03,c,[0,.5]);assert.equal(stop.lane,.5);assert.equal(stop.lateral,0);
 let state=a;for(let i=0;i<60;i++)state=M.step(state,0,85,1/60,c);assert.ok(Math.abs(state.lateral)<.001);
 const projection=z=>({center:432,half:600/(1+z/155),y:268+164/(1+z/155)}),physical=(z,lane)=>lane;
 assert.equal(M.roadAngle(projection,physical,28,0),0);assert.ok(M.roadAngle(projection,physical,28,.75)<0);assert.ok(M.roadAngle(projection,physical,28,-.75)>0);
 let pose={angle:0};for(let i=0;i<60;i++)pose=M.yaw(pose.angle,a.lateral,0,1/60,c);assert.ok(pose.angle>10&&pose.angle<20);
 for(let angle=-20;angle<=20;angle+=.25){const f=M.frame(angle,()=>true);assert.ok(Math.abs(f.shear)<=.06);assert.ok(Math.abs(f.keyAngle-Math.abs(angle))<=2.5);assert.equal(f.flip,f.keyAngle>0&&angle<0);}
 assert.equal(M.frame(15,k=>k==='rear').name,'rear');assert.ok(M.config({maxLateral:99,response:-5}).maxLateral===1);
 console.log('Driving Lab: time-step invariance, speed sensitivity, road perspective and bounded sprite transform OK', {slow:slow.lane,normal:a.lane,fast:fast.lane});}

{const P=require('../engine/vehicles/vehicle-perspective.js'),L=require('../../crime-rush-library/presets/road-layout.js');
 const project=z=>({center:432,half:600/(1+z/155),y:268+164/(1+z/155)}),physical=(_,l)=>l;
 for(const z of [28,250,1200]){const a=P.angles(project,physical,z,.75,432),b=P.angles(project,physical,z,-.75,432);assert.ok(Math.abs(a.heading)<1e-9);assert.ok(Math.abs(a.bearing+b.bearing)<1e-9);assert.ok(a.bearing<0);}
 assert.ok(Math.abs(P.angles(project,physical,1200,.75,432).bearing)<Math.abs(P.angles(project,physical,28,.75,432).bearing));
 for(const world of [3000,6000,9800,14000,26000]){const p=z=>{const q=project(z);return {...q,center:q.center+q.half*L.at(world+z).anchor};},a=P.angles(p,(z,l)=>l+L.at(world+z).inner,28,.5,432);assert.ok(Number.isFinite(a.heading));if(world===6000)assert.ok(Math.abs(a.bearing)<1e-9&&Math.abs(a.heading)<1e-9);}
 function synthetic(w,h,x,y,r,b){const d=new Uint8ClampedArray(w*h*4);for(let j=y;j<b;j++)for(let i=x;i<r;i++)d[(j*w+i)*4+3]=255;return {width:w,height:h,measure:P.measure(d,w,h)};}
 const assets={rear:synthetic(100,100,20,10,80,90),'rear-05':synthetic(140,100,15,20,120,92),'rear-10':synthetic(200,120,40,25,185,105),'rear-20':synthetic(180,100,5,12,170,99)};
 const layout=a=>{const f=P.select(a,k=>!!assets[k],{max:20});return {f,r:P.layout(f,assets[f.name],assets[f.reference],assets[f.lower],assets[f.upper],432,406,100)};};
 assert.equal(assets.rear.measure.anchor,.5);let maxJump=0,prev=null;for(let angle=-20;angle<=20;angle+=.01){const {f,r}=layout(angle);const anchor=P.point(f,r,432,406,r.anchorX,r.anchorY);assert.ok(Math.abs(anchor.x-432)<1e-9&&Math.abs(anchor.y-406)<1e-9);assert.ok(Math.abs(r.visibleHeight-80)<1e-9&&Math.abs(r.footprint-60)<1e-9);assert.ok(Math.abs(f.shear)<=.06);if(prev!==null)maxJump=Math.max(maxJump,Math.abs(r.visibleWidth-prev));prev=r.visibleWidth;}
 assert.ok(maxJump<.5,'bounded interpolated width change: '+maxJump);for(const angle of [2.5,7.5,15,-2.5,-7.5,-15])assert.ok(Math.abs(layout(angle-.00001).r.visibleWidth-layout(angle+.00001).r.visibleWidth)<.001);
 const npc=P.select(-12,k=>['traffic:car:front','traffic:car:front-15'].includes(k),{prefix:'traffic:car:',opposite:true});assert.equal(npc.name,'traffic:car:front-15');assert.equal(npc.flip,true);
 console.log('Vehicle perspective: deprojected geometry, depth-dependent bearing, mirrored anchors, continuous dimensions and stable footprint OK', {maxJump});}
