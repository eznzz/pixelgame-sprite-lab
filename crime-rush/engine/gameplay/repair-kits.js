// Share the medkit roll, so one passing vehicle cannot drop both items.
window.DriveRepairKits=(()=>{
 const CHANCE=CrimeRushDamageConfig.repairChance,HEAL=CrimeRushDamageConfig.repairHeal,items=[];let notice=0;
 function reset(){items.length=0;notice=0;}
 function observe(car,prev,distance,playerZ,random=Math.random){
  if(car.opposite||car.repairKitRolled||!car.model?.startsWith('traffic-'))return;
  // The shared atmospheric veil begins at depth 460.
  const threshold=520;
  if(!((prev<threshold&&car.z>=threshold)||(prev>=threshold&&car.z<threshold)))return;
  car.repairKitRolled=true;const roll=car.pickupRoll??(car.pickupRoll=random()),start=CrimeRushGameplayConfig.medkits.chance;if(roll<start||roll>=start+CHANCE)return;
  items.push({world:distance+Math.max(playerZ+140,car.z+45),lane:car.lane+(car.offset||0),age:0});
  if(items.length>24)items.shift();
 }
 function tick(dt,previous,distance,pp,oldPP,project){
  notice=Math.max(0,notice-dt);const travel=Math.max(0,distance-previous);
  for(let i=items.length-1;i>=0;i--){const k=items[i],z=k.world-distance;k.age+=dt;
   if(z<0||k.age>30){items.splice(i,1);continue;}
   if(z>pp.z+15||z+travel<pp.z-15)continue;
   const p=project(pp.z),x=p.center+p.half*(typeof physicalLane==='function'?physicalLane(z,k.lane):k.lane),w=64*p.q;
   if(Math.max(pp.right,oldPP.right)<x-w/2||Math.min(pp.left,oldPP.left)>x+w/2)continue;
   items.splice(i,1);CrimeRushVehicleCondition.heal(HEAL);DriveHUD.render();notice=CrimeRushIndicatorsConfig.notifications.medkitSeconds;window.PreviewAudio?.play('good');
  }
 }
 function draw(c,project,distance,queue){
  for(const k of items){const z=k.world-distance;if(z<0||z>1800)continue;const p=project(z),x=p.center+p.half*(typeof physicalLane==='function'?physicalLane(z,k.lane):k.lane),w=Math.max(2,Math.round(64*p.q)),h=Math.max(2,Math.round(46*p.q)),lift=Math.max(0,1-k.age/.4)*18*p.q;
   queue(z,()=>{c.save();c.globalAlpha=Math.min(1,(1800-z)/240);c.fillStyle='#25262b88';c.beginPath();c.ellipse(x,p.y,w*.5,Math.max(1,h*.12),0,0,Math.PI*2);c.fill();
    c.translate(Math.round(x-w/2),Math.round(p.y-h-lift));c.scale(w/32,h/23);
    c.fillStyle='#35402c';c.fillRect(0,5,32,18);c.fillStyle='#66744e';c.fillRect(2,6,28,15);c.fillStyle='#89916e';c.fillRect(2,6,28,3);c.fillStyle='#434c36';c.fillRect(10,0,12,6);c.fillStyle='#8b9870';c.fillRect(12,2,8,3);c.fillStyle='#d1c9ac';c.beginPath();c.moveTo(10,18);c.lineTo(18,10);c.lineTo(18,7);c.lineTo(21,10);c.lineTo(24,7);c.lineTo(24,12);c.lineTo(21,15);c.lineTo(18,15);c.lineTo(13,21);c.closePath();c.fill();const mist=RoadsideObjects.groundMist(z,project);if(mist>0){c.globalAlpha*=mist;c.fillStyle='#fafbfb';c.fillRect(0,5,32,18);c.fillRect(10,0,12,5);}c.restore();},3);
  }
 }
 function drawNotice(){}
 return {reset,observe,tick,draw,drawNotice,notice:()=>notice>0};
})();
