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
