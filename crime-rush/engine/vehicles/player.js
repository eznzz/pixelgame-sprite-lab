// Use a slight rear three-quarter view on the outer lanes.
function laneFrame(lane){
 const outer=Math.abs(lane)>=.5;
 return outer&&I['rear-05']?.naturalWidth?{name:'rear-05',flip:lane<0}:{name:'rear',flip:false};
}
// LOCKED player perspective: the original rear-10 WebP points SCREEN RIGHT.
 // Left side of road -> right-facing original; right side -> mirrored left-facing.
 // Locked resting perspective. Active steering uses 10 degrees, then 15 after 0.2 seconds, then 20 after 0.6 continuous seconds.
const PLAYER_PERSPECTIVE=Object.freeze({
 left:Object.freeze({name:'rear-10',flip:false}),
 center:Object.freeze({name:'rear',flip:false}),
 right:Object.freeze({name:'rear-10',flip:true})
});
function playerLaneFrame(lane){
 return lane<-.36?PLAYER_PERSPECTIVE.left:lane>=.38?PLAYER_PERSPECTIVE.right:PLAYER_PERSPECTIVE.center;
}
const STEERING_LONG_SECONDS=CrimeRushWorld.steeringLongSeconds,STEERING_LONG_SPEED_MULTIPLIER=CrimeRushWorld.steeringLongMultiplier;
const STEERING_MAX_SECONDS=CrimeRushWorld.steeringMaxSeconds,STEERING_MAX_SPEED_MULTIPLIER=CrimeRushWorld.steeringMaxMultiplier;
let heldSteeringDirection=0,heldSteeringSeconds=0;
function updateSteeringHold(input,dt){
 const dir=input<-.001?-1:input>.001?1:0;
 if(dir!==heldSteeringDirection){heldSteeringDirection=dir;heldSteeringSeconds=0;}
 if(dir)heldSteeringSeconds+=dt;else heldSteeringSeconds=0;
}
function longSteeringActive(input){
 const dir=input<-.001?-1:input>.001?1:0;
 return !!(dir&&dir===heldSteeringDirection&&heldSteeringSeconds+1e-9>=STEERING_LONG_SECONDS&&I['rear-15']?.naturalWidth);
}
function maxSteeringActive(input){
 const dir=input<-.001?-1:input>.001?1:0;
 return !!(dir&&dir===heldSteeringDirection&&heldSteeringSeconds+1e-9>=STEERING_MAX_SECONDS&&I['rear-20']?.naturalWidth);
}
function steeringSpeedMultiplier(input){return maxSteeringActive(input)?STEERING_MAX_SPEED_MULTIPLIER:longSteeringActive(input)?STEERING_LONG_SPEED_MULTIPLIER:1;}
function playerFrame(pos,groundY,input=0){
 if(Math.abs(input)>.001){
  const dir=input<0?-1:1;
  if(maxSteeringActive(input))return {name:'rear-20',flip:dir<0};
  if(longSteeringActive(input))return {name:'rear-15',flip:dir<0};
  return dir<0?PLAYER_PERSPECTIVE.right:PLAYER_PERSPECTIVE.left;
 }
 const q=(groundY-hy)/(H-hy),p=project(155*(1/q-1));
 const lane=(pos-p.center)/p.half;return playerLaneFrame(typeof motorwayLabActive==='function'&&motorwayLabActive()?window.CrimeRushRoadLayout.relativeLane(distance+155*(1/q-1),lane):lane);
}
const BRAKE_LAMPS={
 rear:[[170/950,458/730,86/950,42/730],[690/950,458/730,83/950,42/730]],
 'rear-10':[[123/950,404/638,76/950,37/638],[524/950,404/638,73/950,37/638]],
 'rear-15':[[100/950,365/576,64/950,33/576],[438/950,365/576,65/950,33/576]],
 'rear-20':[[64/950,291/470,44/950,24/470],[308/950,307/470,41/950,24/470]]
};
// Pobeditel lamp interiors measured on each original rear sprite.
// Coordinates are normalized to the whole image, before horizontal mirroring.
const POBEDITEL_BRAKE_LAMPS={
 rear:[[21/227,138/198,14/227,7/198],[192/227,138/198,14/227,7/198]],
 'rear-05':[[15/267,141/198,15/267,6/198],[190/267,142/198,15/267,7/198]],
 'rear-10':[[14/306,139/199,13/306,6/199],[170/306,145/199,14/306,7/199]],
 'rear-15':[[12/340,136/198,9/340,6/198],[138/340,144/198,13/340,6/198]],
 'rear-20':[[12/340,136/198,9/340,6/198],[152/340,144/198,14/340,7/198]],
 'rear-30':[[13/363,133/198,10/363,6/198],[148/363,143/198,14/363,7/198]],
 'rear-40':[[14/386,129/197,7/386,6/197],[128/386,143/197,14/386,7/197]]
};
// Sputnik: red upper sections only; exclude amber indicators and white reverse lenses.
const SPUTNIK_BRAKE_LAMPS={
 rear:[[38/314,132/232,55/314,13/232],[223/314,132/232,52/314,13/232]],
 'rear-05':[[35/271,108/207,47/271,11/207],[189/271,108/207,47/271,11/207]],
 'rear-10':[[35/345,131/231,55/345,13/231],[214/345,131/231,53/345,13/231]],
 'rear-15':[[29/366,131/231,49/366,13/231],[194/366,131/231,49/366,13/231]],
 'rear-20':[[27/384,129/229,46/384,11/229],[181/384,129/229,48/384,11/229]],
 'rear-30':[[26/413,128/226,41/413,11/226],[161/413,128/226,45/413,11/226]],
 'rear-40':[[25/403,112/209,35/403,10/209],[144/403,112/209,40/403,10/209]]
};
function drawBrakeLights(c,name,dx,dy,dw,dh,calibration){
 const isPobeditel=!!I[name]&&['pobeditel','pobeditel01'].some(id=>I[name]===I['drive:'+id+':'+name]);
 const isSputnik=!!I[name]&&['sputnik','sputnik08'].some(id=>I[name]===I['drive:'+id+':'+name]);
 const lamps=isSputnik?SPUTNIK_BRAKE_LAMPS:isPobeditel?POBEDITEL_BRAKE_LAMPS:BRAKE_LAMPS;
 for(const [u,v,w,h] of calibration?.brakes??lamps[name]??[]){
  const x=Math.round(dx+u*dw),y=Math.round(dy+v*dh),a=Math.max(2,Math.round(w*dw)),b=Math.max(2,Math.round(h*dh));
  c.save();c.globalCompositeOperation='screen';c.globalAlpha=.82;c.fillStyle='#ff3029';c.fillRect(x,y,a,b);
  c.globalAlpha=.68;c.fillStyle='#ff9a85';c.fillRect(x+1,y+1,Math.max(1,a-2),Math.max(1,Math.round(b*.30)));
  c.restore();
 }
}
const ACCEL_RATE=CrimeRushSpeed.acceleration,BRAKE_RATE=CrimeRushSpeed.braking;
let braking=false,driveVelocity=CrimeRushSpeed.toPhysicsSpeed(speed.value);
const speedValue=document.getElementById('speedValue');
function syncSpeed(){const shown=CrimeRushSpeed.toDisplaySpeed(driveVelocity);const slider=String(shown),label=Math.round(shown)+' км/ч';if(speed.value!==slider)speed.value=slider;if(speedValue.textContent!==label)speedValue.textContent=label;DriveHUD.update(driveVelocity);}
speed.addEventListener('input',()=>{driveVelocity=Math.min(CrimeRushSpeed.toPhysicsSpeed(speed.value),CrimeRushSpeed.limitPhysics()*CrimeRushVehicleCondition.performance().speed);syncSpeed()});
function nextVelocity(v,dt,gas,brake){if(window.CrimeRushFuel?.empty())return Math.max(0,v-dt*BRAKE_RATE*.35);const p=CrimeRushVehicleCondition.performance(),limit=CrimeRushSpeed.limitPhysics()*p.speed;if(v>limit)return Math.max(limit,v-dt*BRAKE_RATE);return clamp(v+dt*(brake?-BRAKE_RATE:gas?ACCEL_RATE*p.acceleration:0),0,limit);}
// Animate signed visual yaw independently of lateral control and speed.
let visualYaw=0,visualRear=null;
function signedYaw(frame){return (Number(frame.name.split('-')[1])||0)*(frame.flip?-1:1);}
function syncVisualCar(pos,y){
 if(visualRear!==I.rear){visualRear=I.rear;visualYaw=signedYaw(playerFrame(pos,y,steerInput));}
}
function displayedPlayerFrame(pos,y){
 if(window.CrimeRushDrivingLab?.active())return window.CrimeRushDrivingLab.frame();
 syncVisualCar(pos,y);
 const options=[0,...[5,10,15,20].filter(a=>I['rear-'+String(a).padStart(2,'0')]?.naturalWidth)];
 const angle=options.reduce((best,a)=>Math.abs(a-Math.abs(visualYaw))<Math.abs(best-Math.abs(visualYaw))?a:best,0);
 return {name:angle?'rear-'+String(angle).padStart(2,'0'):'rear',flip:angle>0&&visualYaw<0,visualAngle:Math.abs(visualYaw)};
}
function updateVisualYaw(dt,input){
 const y=PLAYER_GROUND_Y,z=155*((H-hy)/(y-hy)-1),pos=typeof motorwayPreviewPlayerX==='function'?motorwayPreviewPlayerX(W/2+x*450,z,.13):W/2+x*450;syncVisualCar(pos,y);
 const target=signedYaw(playerFrame(pos,y,input)),delta=target-visualYaw;
 const step=dt*(input?80:90);
 visualYaw+=Math.sign(delta)*Math.min(Math.abs(delta),step);
}
function updatePlayerSteering(input,dt,velocity){
 if(window.CrimeRushDrivingLab?.active()){window.CrimeRushDrivingLab.update(input,dt,velocity);return;}
 if(velocity<=0){steerInput=0;steer=0;updateSteeringHold(0,0);updateVisualYaw(dt,0);return;}
 steerInput=input;updateSteeringHold(input,dt);steer+=(input-steer)*Math.min(1,dt*8);
 x=clamp(x+steer*dt*.65*300/450*steeringSpeedMultiplier(input),-.85,.85);
 updateVisualYaw(dt,input);
}
function drawDriveCar(frame,px,py,h,phase=0,brake=false,fogDepth=0,groundOffset=0,wheelSpeed=driveVelocity,wheelTravel=distance+phase*7){
 const {name,flip}=frame,asset=I[name];
 if(!asset?.naturalWidth)return;
 const mist=RoadsideObjects.groundMist(fogDepth,project),alpha=c.globalAlpha;
 const layout=frame.calibrated?CrimeRushVehiclePose.layout(frame,px,py,h):null;
 c.save();c.globalAlpha=alpha*(1-mist);if(layout)softCarShadow(px,py,layout.footprint*.52,layout.visibleHeight*.085,!name.startsWith('traffic:'));else vehicleShadow(name,px,py,h,flip,groundOffset);c.restore();
 const velocity=layout?wheelSpeed:driveVelocity,bob=DriveMotion.bounce(layout?wheelTravel:distance,velocity,h,phase);
 const w=asset.width*h/asset.height,dx=Math.round(layout?.x??(px-w/2)),dy=Math.round(layout?layout.y+bob:py-h+bob+groundOffset),dw=Math.round(layout?.w??w),dh=Math.round(layout?.h??h);
 c.save();if(frame.shear){c.translate(px,py);c.transform(1,0,frame.shear,1,0,0);c.translate(-px,-py);}if(flip){c.translate(2*px,0);c.scale(-1,1)}
 if(mist>0){RoadsideObjects.drawFoggedVehicle(c,asset,dx,dy,dw,dh,mist);}
 else{c.drawImage(DriveMotion.roadTone(asset),dx,dy,dw,dh);}
 // Far/small traffic wheels are below useful visual detail. Preserve player animation.
 if(!name.startsWith('traffic:')||(dh>=28&&fogDepth<650)){c.save();c.globalAlpha*=1-mist;DriveMotion.draw(c,asset,dx,dy,dw,dh,wheelTravel,wheelSpeed);c.restore();}
 c.filter='none';
 if(brake)drawBrakeLights(c,name,dx,dy,dw,dh,layout?.calibration);
 c.restore();
}
// Rear approach uses a bounded screen-space projection; the ordinary road
// perspective expands beyond the viewport at negative depth, hiding outer lanes.
