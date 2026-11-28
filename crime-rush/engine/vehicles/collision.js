const playerDepth=()=>155*((H-hy)/(PLAYER_GROUND_Y-hy)-1);
// Cache the visible horizontal silhouette, excluding transparent sprite padding.
const collisionBoundsCache=new WeakMap();
function prepareCollisionBounds(a){if(!a?.naturalWidth)return null;
 let bounds=collisionBoundsCache.get(a);
 if(!bounds){
  let left=0,right=a.naturalWidth;
  try{
   const cv=document.createElement('canvas');cv.width=a.naturalWidth;cv.height=a.naturalHeight;
   const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(a,0,0);
   const d=ctx.getImageData(0,0,cv.width,cv.height).data;
   let l=cv.width,r=-1;
   for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(d[(y*cv.width+x)*4+3]>=128){if(x<l)l=x;if(x>r)r=x;}
   if(r>=l){left=l;right=r+1;}
  }catch(e){/* Use full image bounds if pixel access is unavailable. */}
  bounds={left:left/a.naturalWidth,right:right/a.naturalWidth};collisionBoundsCache.set(a,bounds);
 }
 return bounds;
}
function collisionBounds(frame,px,h){const a=frame&&I[frame.name];if(!a?.naturalWidth)return {left:px,right:px};const bounds=prepareCollisionBounds(a);
 const w=a.width/a.height*h,dx=Math.round(px-w/2),dw=Math.round(w);
 const l=dx+bounds.left*dw,r=dx+bounds.right*dw;
 return frame.flip?{left:2*px-r,right:2*px-l}:{left:l,right:r};
}
function horizontalOverlap(a,b){return a.left<b.right&&b.left<a.right;}
function trafficCollisionBounds(car,z){
 const lane=car.lane+(car.offset||0),p=car.opposite?project(z):passingProjection(z,lane);
 const frame=car.opposite?DriveTraffic.frameFor(car.model,DriveTraffic.perspective(project,z,lane),trafficAvailable,true):DriveTraffic.sameDirectionFrame(car.model,car.lane+(car.offset||0),trafficAvailable);
 const px=car.opposite?p.center+p.half*(typeof physicalLane==='function'?physicalLane(z,lane):lane):p.x,h=TRAFFIC_CAR_SCALE*p.q*SpriteLibrary.driveReferenceHeight(I);
 return collisionBounds(frame,px,h);
}
function playerTrafficPosition(){
 const z=playerDepth(),p=project(z);let px=typeof motorwayPreviewPlayerX==='function'?motorwayPreviewPlayerX(W/2+x*450,z,.13):W/2+x*450;
 const frame=displayedPlayerFrame(px,PLAYER_GROUND_Y),asset=I[frame.name];
 const base=PLAYER_CAR_SCALE*p.q*SpriteLibrary.driveReferenceHeight(I);
 const experimental=!!window.CrimeRushDrivingLab?.active(),h=experimental?CrimeRushVehiclePose.playerBase(base):SpriteLibrary.drivePlayerHeight(I,frame.name,base,frame.visualAngle);
 const calibrated=experimental?CrimeRushVehiclePose.layout(frame,px,PLAYER_GROUND_Y,h):null;
 if(calibrated)px=motorwayPreviewPlayerX(W/2+x*450,z,calibrated.footprint/(2*p.half));
 const bounds=calibrated?{left:px-calibrated.footprint/2,right:px+calibrated.footprint/2}:collisionBounds(frame,px,h);
 const halfWidth=asset?.naturalWidth?Math.max(px-bounds.left,bounds.right-px)/p.half:.13;
 return {z,lane:typeof logicalLane==='function'?logicalLane(z,(px-p.center)/p.half):(px-p.center)/p.half,halfWidth,px,w:bounds.right-bounds.left,h,...bounds};
}
let impactTime=0,impactDirection=1,gameOver=false;
trafficMode.addEventListener('change',()=>{oncoming.reset();passing.reset();});
document.getElementById('repairCar').addEventListener('click',()=>{window.PreviewAudio?.play('good');CrimeRushDamage.reset();CrimeRushSystems.resetTemperature();if(gameOver)CrimeRushSystems.resetRun();gameOver=false;impactTime=0;DriveMedkits.reset();DriveRepairKits.reset();oncoming.reset();passing.reset();if(paused){paused=false;pause.textContent='Пауза';}});
