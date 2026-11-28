// Shared 12% pickup roll: medkit [0,.06), repair kit [.06,.12).
window.DriveMedkits=(()=>{
 const CHANCE=CrimeRushGameplayConfig.medkits.chance,HEAL=CrimeRushGameplayConfig.health.medkitHeal,items=[];let notice=0;
 function reset(){items.length=0;notice=0;}
 function observe(car,prev,distance,playerZ,random=Math.random){
  if(car.opposite||car.medkitRolled||!car.model?.startsWith('traffic-'))return;
  // The shared atmospheric veil begins at depth 460.
  const threshold=520;
  if(!((prev<threshold&&car.z>=threshold)||(prev>=threshold&&car.z<threshold)))return;
  car.medkitRolled=true;const roll=car.pickupRoll??(car.pickupRoll=random());if(roll>=CHANCE)return;
  items.push({world:distance+Math.max(playerZ+100,car.z),lane:car.lane+(car.offset||0),age:0});
  if(items.length>24)items.shift();
 }
 function tick(dt,previous,distance,pp,oldPP,project){
  notice=Math.max(0,notice-dt);const travel=Math.max(0,distance-previous);
  for(let i=items.length-1;i>=0;i--){const k=items[i],z=k.world-distance;k.age+=dt;
   if(z<0||k.age>30){items.splice(i,1);continue;}
   if(z>pp.z+15||z+travel<pp.z-15)continue;
   const p=project(pp.z),x=p.center+p.half*(typeof physicalLane==='function'?physicalLane(z,k.lane):k.lane),w=64*p.q;
   if(Math.max(pp.right,oldPP.right)<x-w/2||Math.min(pp.left,oldPP.left)>x+w/2)continue;
   items.splice(i,1);CrimeRushHealth.heal(HEAL);DriveHUD.drawHealth();notice=CrimeRushIndicatorsConfig.notifications.medkitSeconds;window.PreviewAudio?.play('good');
  }
 }
 function draw(c,project,distance,queue){
  for(const k of items){const z=k.world-distance;if(z<0||z>1800)continue;const p=project(z),x=p.center+p.half*(typeof physicalLane==='function'?physicalLane(z,k.lane):k.lane),w=Math.max(2,Math.round(64*p.q)),h=Math.max(2,Math.round(46*p.q)),lift=Math.max(0,1-k.age/.4)*18*p.q;
   queue(z,()=>{c.save();c.globalAlpha=Math.min(1,(1800-z)/240);c.fillStyle='#25262b88';c.beginPath();c.ellipse(x,p.y,w*.5,Math.max(1,h*.12),0,0,Math.PI*2);c.fill();
    c.translate(Math.round(x-w/2),Math.round(p.y-h-lift));c.scale(w/32,h/23);
    c.fillStyle='#792b30';c.fillRect(0,5,32,18);c.fillStyle='#bc3739';c.fillRect(2,6,28,15);c.fillStyle='#e25b51';c.fillRect(2,6,28,3);c.fillStyle='#872a30';c.fillRect(10,0,12,6);c.fillStyle='#d8564b';c.fillRect(12,2,8,3);c.fillStyle='#fff3e7';c.fillRect(13,9,6,12);c.fillRect(10,12,12,6);const mist=RoadsideObjects.groundMist(z,project);if(mist>0){c.globalAlpha*=mist;c.fillStyle='#fafbfb';c.fillRect(0,5,32,18);c.fillRect(10,0,12,5);}c.restore();},3);
  }
 }
 function drawNotice(){const el=document.getElementById('hudMedkitNotice');if(el)el.hidden=notice<=0;}
 return {reset,observe,tick,draw,drawNotice};
})();
