function passingProjection(z,lane){
 const join=playerDepth(),p=project(join);
 if(z>=join){const a=project(z);return {...a,x:a.center+a.half*(typeof physicalLane==='function'?physicalLane(z,lane):lane)};}
 const u=clamp((z+155)/(join+155),0,1);
 const q=p.q+(1-u)*.18;
 const y=PLAYER_GROUND_Y+(1-u)*210;
 const target=p.center+p.half*(typeof physicalLane==='function'?physicalLane(join,lane):lane);
 const entry=clamp(target,72,W-72);
 return {q,y,x:entry+(target-entry)*u};
}
// Use projected vehicle bounds and longitudinal overlap, not lane membership alone.
// Award a traffic near miss once, only after clearing the longitudinal contact zone.
function avoidRoadHorse(car,dt,horses,traffic,pp,twoWay){
 const actual=car.lane+(car.offset||0);if(car.baseOffset==null)car.baseOffset=car.offset||0;
 if(car.cruiseLane==null)car.cruiseLane=car.lane;
 const direction=car.opposite?-1:1,lead=car.opposite?500:420;
 const route=typeof routeGeometryActive==='function'&&routeGeometryActive(),world=distance+Math.max(0,car.z),ahead=world+direction*900,third=route&&routeRoadGeometry(world).extra>=.49&&routeRoadGeometry(ahead).extra>=.49;const allowed=twoWay?(car.opposite?(third?[-1.25,-.75,-.25]:[-.75,-.25]):(third?[.25,.75,1.25]:[.25,.75])):LANE_CENTERS;
 const playerSafe=lane=>Math.abs(pp.z-car.z)>260||Math.abs(pp.lane-lane)>pp.halfWidth+.23;
 const safe=lane=>allowed.includes(lane)&&playerSafe(lane)&&!horses.some(o=>Math.abs(o.z-car.z)<lead&&Math.abs(o.lane-lane)<.33)&&!traffic.some(v=>v!==car&&Math.abs(v.z-car.z)<180&&(Math.abs(v.lane+(v.offset||0)-lane)<.34||Math.abs((v.avoidLane??v.cruiseLane??v.lane)-lane)<.34));
 const horse=horses.filter(o=>{const d=(o.z-car.z)*direction;return d>=-65&&d<=lead&&Math.abs(o.lane-car.cruiseLane-car.baseOffset)<.33;}).sort((a,b)=>Math.abs(a.z-car.z)-Math.abs(b.z-car.z))[0];
 if(horse&&car.avoidLane==null){const choices=[car.cruiseLane-.5,car.cruiseLane+.5].filter(safe);if(choices.length)car.avoidLane=choices[0];}
 if(!horse&&car.avoidLane!=null&&safe(car.cruiseLane))car.avoidLane=null;
 car.laneCheck=(car.laneCheck??3)-dt;
 if(car.laneCheck<=0){
  car.laneCheck=3;
  if(!horse&&car.avoidLane==null&&Math.abs(actual-car.cruiseLane-car.baseOffset)<.02&&Math.random()<.05){
   const choices=[car.cruiseLane-.5,car.cruiseLane+.5].filter(safe);
   if(choices.length)car.cruiseLane=choices[Math.floor(Math.random()*choices.length)];
  }
 }
 if(route&&!third){const merge=Math.sign(car.cruiseLane)*.75;if(Math.abs(car.cruiseLane)>1){if(!safe(merge)&&routeRoadGeometry(world).extra>.30)return .10;car.cruiseLane=merge;car.avoidLane=null;}if(Math.abs(car.avoidLane??0)>1)car.avoidLane=null;}const target=(car.avoidLane??car.cruiseLane)+car.baseOffset,delta=target-actual;
 const next=actual+Math.sign(delta)*Math.min(Math.abs(delta),dt*.85);
 // Revalidate the swept lateral corridor on every frame, not just the decision frame.
 const low=Math.min(actual,next)-.18,high=Math.max(actual,next)+.18;
 const threatens=Math.abs(pp.z-car.z)<260&&pp.lane+pp.halfWidth+.06>low&&pp.lane-pp.halfWidth-.06<high&&Math.abs(next-pp.lane)<=Math.abs(actual-pp.lane);
 if(!threatens&&(Math.abs(delta)<.001||playerSafe(target)))car.offset=next-car.lane;else if(route&&!third&&Math.abs(actual)>1)return .10;
 // Both lethal obstacles use physical collision if a safe bypass is unavailable.
 return 1;
}
const roadHorseBounds=(o,px,q)=>{const name='obstacle:'+o.type,a=I[name];if(!a?.naturalWidth)return {left:px-o.width*q/2,right:px+o.width*q/2};const w=Math.max(1,Math.round(o.width*q)),h=Math.max(1,Math.round(w*a.naturalHeight/a.naturalWidth));return collisionBounds({name,flip:o.type==='horse'&&((Math.sin((o.id*19+12)*127.1+78.233)*43758.5453)%1+1)%1>.5},px,h);};
function observeTrafficNear(car,prev,pp,oldPP){
 if(car.scored||!car.model)return 0;
 if(car.hit){car.near=false;car.scored=true;return 0;}
 const zone=car.opposite?18:45;
 if(Math.min(prev,car.z)<=pp.z+zone&&Math.max(prev,car.z)>=pp.z-zone){
  const z=Math.max(pp.z-zone,Math.min(pp.z+zone,car.z));
  const bounds=trafficCollisionBounds(car,z),old=trafficCollisionBounds(car,Math.max(pp.z-zone,Math.min(pp.z+zone,prev)));
  const gap=Math.max(pp.left-bounds.right,bounds.left-pp.right);
  const oldGap=Math.max(oldPP.left-old.right,old.left-oldPP.right);
  if(gap<=0||oldGap<=0)car.near=false;
  else if(Math.min(gap,oldGap)<=Math.max(5,pp.w*.18))car.near=true;
 }
 const cleared=car.opposite?car.z<pp.z-zone&&prev>=pp.z-zone:car.z>pp.z+zone&&prev<=pp.z+zone;
 if(cleared){car.scored=true;return car.near?50:0;}
 return 0;
}
function passingContact(car,prev,pp,oldPP){
 const frame=DriveTraffic.sameDirectionFrame(car.model,car.lane+(car.offset||0),trafficAvailable),a=frame&&I[frame.name];
 if(!a?.naturalWidth)return false;
 const lane=car.lane+car.offset;
 const p=passingProjection(car.z,lane),h=TRAFFIC_CAR_SCALE*p.q*SpriteLibrary.driveReferenceHeight(I),w=a.width/a.height*h;
 const dx=p.x-pp.px,oldX=passingProjection(prev,lane).x-oldPP.px;
 const current=trafficCollisionBounds(car,car.z),previous=trafficCollisionBounds(car,prev);
 const touching=horizontalOverlap(pp,current)||horizontalOverlap(oldPP,previous)||(Math.min(pp.left- current.right,oldPP.left-previous.right)<0&&Math.min(current.left-pp.right,previous.left-oldPP.right)<0);
 const sideMoved=window.CrimeRushDrivingLab?.mission?.()?Math.abs(pp.lane-oldPP.lane)>.00001:Math.abs(pp.px-oldPP.px)>.001;
 const approach=sideMoved&&Math.abs(dx)<Math.abs(oldX)+.01;
 return approach&&touching&&Math.abs(p.y-PLAYER_GROUND_Y)<32&&Math.abs(car.z-pp.z)<45;
}
function finishDamageRun(){if(gameOver||!CrimeRushDamage.reason())return;window.PreviewAudio?.play('over');gameOver=true;paused=true;pause.textContent='Продолжить';driveVelocity=0;syncSpeed();}
function applyDriveImpact(event,direction){
 if(gameOver)return;const result=CrimeRushDamage.apply(event);if(result.driver||result.vehicle){window.PreviewAudio?.play('crash');impactTime=.36;impactDirection=direction;DriveHUD.render();finishDamageRun();}else{impactTime=Math.max(impactTime,.16);impactDirection=direction;}
}
