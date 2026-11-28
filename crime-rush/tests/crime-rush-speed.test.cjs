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

{const C=require('../../crime-rush-library/presets/vehicle-calibration.js'),P=require('../engine/vehicles/vehicle-perspective.js');
 assert.equal(Object.keys(C.profiles).length,5);let n=0;
 for(const [id,views] of Object.entries(C.profiles)){assert.equal(views.rear.angle,0);let prev=-1;
 for(const [role,p] of Object.entries(views)){n++;assert.deepEqual(C.validate(p),p);assert.ok(p.angle>prev);prev=p.angle;const [lx,ly,rx,ry]=p.axle;const a={width:990,height:720,measure:{left:.02,right:.98,top:.01,bottom:.99,anchor:.5,width:.96,height:.98},calibration:p};
 for(const flip of [false,true]){const frame={flip,shear:.03,mix:.5},rect=P.layout(frame,a,a,a,a,432,405,100),l=P.point(frame,rect,432,405,lx,ly),r=P.point(frame,rect,432,405,rx,ry);assert.ok(Math.abs((l.x+r.x)/2-432)<1e-9&&Math.abs((l.y+r.y)/2-405)<1e-9);assert.ok(Math.abs(rect.anchorX-(lx+rx)/2)<1e-12);}
 assert.ok(role==='rear'||role.startsWith('rear-'),id);}}
 assert.equal(n,23);assert.throws(()=>C.validate({...C.get('sputnik','rear'),axle:[.7,.95,.2,.95]}));assert.throws(()=>C.validate({...C.get('sputnik','rear'),angle:NaN}));
 const f=P.select(1,k=>['rear','rear-05','rear-10'].includes(k),{max:20,angleFor:(role,a)=>role==='rear-05'?2:a});assert.equal(f.upper,'rear-05');assert.equal(f.mix,.5);
 console.log('Individual vehicle calibration: 23 inspected rear frames; mirrored axle midpoint, validation and adjusted key angles OK');}

{const C=require('../engine/world/road-curvature.js'),L=require('../../crime-rush-library/presets/road-layout.js');let checks=0,maxWidthError=0,maxDerivativeError=0;
 for(const profile of ['straight','left','right','s'])for(const strength of [0,.14,.24]){
 const c=C.config({profile,strength});for(let world=0;world<=30000;world+=30){const a=C.sample(world,c),n=C.sample(world+.1,c),m=C.sample(world-.1,c),f=C.camera(world,c,.1);
 assert.ok(Math.abs(a.slope)<=strength+1e-10);maxDerivativeError=Math.max(maxDerivativeError,Math.abs((n.x-m.x)/.2-a.slope));assert.ok(Math.abs(C.sample(world+C.period,c).x-a.x)<1e-9);
 for(const z of [0,28,100,500,1000,1800,9600]){const g=L.at(world+z),p=C.project(f,z,864,267.84,432,g.anchor),q=1/(1+z/155);assert.equal(p.q,q);assert.equal(p.y,267.84+(432-267.84)*q);assert.equal(p.half,600*q);
 maxWidthError=Math.max(maxWidthError,Math.abs((p.center+p.half*(g.inner+.75))-(p.center+p.half*(g.inner+.25))-300*q));
 assert.ok(p.center-p.half*g.outer<=p.center-p.half*g.inner&&p.center-p.half*g.inner<=p.center+p.half*g.inner&&p.center+p.half*g.inner<=p.center+p.half*g.outer);checks++;}}}
 assert.equal(checks,84084);assert.ok(maxWidthError<1e-9&&maxDerivativeError<1e-6);
 const straight=C.camera(3000,C.config({profile:'straight',follow:0}),0);assert.equal(C.project(straight,500,864,267.84,432).center,432);assert.equal(C.vanishing(straight,864),432);
 const mirror=z=>['left','right'].map(profile=>C.project(C.camera(1600,C.config({profile}),0),z,864,267.84,432).center);for(const z of [0,28,500,1800,9600])assert.ok(Math.abs(mirror(z).reduce((a,b)=>a+b,0)-864)<1e-9);
 function follow(hz){let x=0;for(let i=0;i<hz;i++)x=C.follow(x,1,1/hz);return x;}assert.ok(Math.abs(follow(30)-follow(60))<1e-12);assert.ok(follow(60)<.22);
 const f=C.camera(3000,C.defaults,0);assert.ok(Math.abs(C.project(f,1e10,864,267.84,432).center-C.vanishing(f,864))<1e-4);
 console.log('Road geometry: '+checks+' cross sections; max width error '+maxWidthError+' px; max derivative error '+maxDerivativeError);}

{const S=require('../engine/vehicles/speed-experience.js'),P=require('../engine/vehicles/vehicle-perspective.js'),T=require('../../crime-rush-library/presets/motorway-traffic.js');
 assert.ok(Math.abs(S.WORLD_PER_KMH*115-115*180/140*3*1.55)<1e-9);
 function run(hz){let s=S.reset(),hit100=null,hit140=null,at12,at15,stop=null;for(let i=0;i<20*hz;i++){s=S.step(s,{gas:i<12*hz,brake:i>=15*hz},1/hz);assert.ok(s.kmh>=0&&s.kmh<=140&&Math.abs(s.pitch)<=.018&&s.advance>=0&&s.wheelTravel>=0&&s.wheelTravel<20);if(s.kmh>=100&&hit100===null)hit100=(i+1)/hz;if(s.kmh>=140&&hit140===null)hit140=(i+1)/hz;if(i===12*hz-1)at12=s.kmh;if(i===15*hz-1)at15=s.kmh;if(i>=15*hz&&s.kmh===0&&stop===null)stop=(i+1)/hz;}return {s,hit100,hit140,at12,at15,stop};}
 const a=run(60),b=run(30);assert.ok(Math.abs(a.s.travel-b.s.travel)<1e-8);assert.equal(a.s.kmh,0);assert.ok(a.hit100>4&&a.hit100<7&&a.hit140>7&&a.hit140<10&&a.at15<a.at12&&a.stop<19);
 let s=S.reset(115);for(let i=0;i<60;i++)s=S.step(s,{gas:false,brake:false},1/60,{...S.defaults,drag:0});assert.ok(Math.abs(s.travel-S.WORLD_PER_KMH*115)<1e-8);
 assert.equal(S.lookAhead(160,115),160);assert.ok(S.lookAhead(160,0)<160&&S.lookAhead(160,140)>160);assert.equal(S.wheelHz(0),0);assert.ok(S.wheelHz(155)<=7.5);
 let limited=S.reset(140);for(let i=0;i<180;i++)limited=S.step(limited,{gas:true,brake:false},1/60,S.defaults,100,.8);assert.equal(limited.kmh,100);
 const asset={width:100,height:100,measure:{width:.9,height:.9,anchor:.5,bottom:.95},calibration:{axle:[.1,.95,.9,.95]}};const f={playerLoad:true,pitch:.018,mix:0},neutral=P.layout({...f,pitch:0},asset,asset,asset,asset,432,406,100),loaded=P.layout(f,asset,asset,asset,asset,432,406,100);assert.equal(loaded.footprint,neutral.footprint);assert.equal(loaded.visibleWidth,neutral.visibleWidth);assert.ok(Math.abs(loaded.visibleHeight/neutral.visibleHeight-1.018)<1e-12);const anchor=P.point(f,loaded,432,406,.5,.95);assert.ok(Math.abs(anchor.x-432)<1e-12&&Math.abs(anchor.y-406)<1e-12);
 for(const car of T.preview(14000,3,1800,true)){const index=Number(car.id.split(':')[1]);assert.ok(Math.abs(Math.abs(car.worldSpeed)/S.WORLD_PER_KMH-(85+index*22))<1e-10);}
 console.log('Speed Experience: reference pace, acceleration, coast/brake, limits, integration, anchored load and motorway speed OK',{distance:a.s.travel,zeroTo100:a.hit100,zeroTo140:a.hit140,stop:a.stop});}

{const S=require('../engine/vehicles/speed-experience.js');let v=S.reset(115);for(let i=0;i<60;i++)v=S.step(v,{gas:true,brake:false},1/60,S.defaults,155,1);assert.ok(v.kmh>115);const first=v.kmh;let previous=first;for(let i=0;i<600;i++){v=S.step(v,{gas:true,brake:false,empty:true},1/60,S.defaults,155,1);assert.ok(v.kmh<=previous+1e-10);previous=v.kmh;}assert.equal(v.kmh,0);assert.equal(v.throttle,0);assert.ok(Math.abs(S.step(S.reset(100),{gas:true,empty:true},.05).kmh-(100-65*140/180*.35*.05))<1e-9);
 let boost=S.reset(140);for(let i=0;i<180;i++)boost=S.step(boost,{gas:true},1/60,S.defaults,155,1);assert.equal(boost.kmh,155);for(let i=0;i<180;i++)boost=S.step(boost,{gas:true},1/60,S.defaults,140,1);assert.equal(boost.kmh,140);
 console.log('Beta fuel exhaustion overrides gas, turbo and damage limits OK');}
