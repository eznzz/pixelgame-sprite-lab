// Opposing vehicles travel towards the player independently of same-direction traffic.
window.DriveTraffic=(()=>{
 const laneOffset=random=>(random()*2-1)*.075;
 const MODELS=['traffic-01','traffic-02'];
 const RARE_CHANCE=.01;
 const profile=()=>window.CrimeRushRoadEvents?.profiles[window.CrimeRushEnvironment?.get()||'rural'];const cruise=random=>{const p=profile();return p?(p.speed[0]+random()*(p.speed[1]-p.speed[0]))*180/140:null;};
 const rareAngle=(id,available)=>['rear-05','rear-10'].find(role=>available('drive:'+id+':'+role));
 // Minimum absolute NPC speed, in physics units (45 displayed km/h before ratio).
 const MIN_PASSING_SPEED=45*180/140;
 function chooseModel(available,opposite=true,random=Math.random){
  const role=opposite?'front':'rear',pool=MODELS.filter(id=>available('traffic:'+id+':'+role));
  return pool.length?pool[Math.min(pool.length-1,Math.floor(random()*pool.length))]:null;
 }
 // Same-direction traffic: rightmost lane mirrors the source 6-degree sprite to expose the vehicle's left side.
 function sameDirectionFrame(model,lane,available){
  if(!MODELS.includes(model)){const base='drive:'+model+':',angle=rareAngle(model,available),role=Math.abs(lane)>.5&&angle?angle:'rear';return available(base+role)?{name:base+role,flip:role!=='rear'&&lane>.5}:null;}
  const base='traffic:'+model+':',roles=lane>.5?['rear-06','rear']:['rear','rear-06'];
  const role=roles.find(r=>available(base+r));
  return role?{name:base+role,flip:role==='rear-06'}:null;
 }
 function frameFor(model,angle,available,opposite=true){
  if(!opposite)return sameDirectionFrame(model,0,available);
  const roles=[[0,'front'],[6,'front-06'],[15,'front-15'],[35,'front-quarter']];
  if(!MODELS.includes(model))return null;
  const options=roles.filter(([_,role])=>available('traffic:'+model+':'+role));
  if(!options.length)return null;
  const target=Math.abs(angle),best=options.reduce((a,b)=>Math.abs(b[0]-target)<Math.abs(a[0]-target)?b:a);
  return {name:'traffic:'+model+':'+best[1],flip:best[0]>0&&angle<0};
 }
 function perspective(project,z,lane){
  const p=project(z),ahead=project(z+20),behind=project(Math.max(0,z-20));
  const centerSlope=Math.atan2(ahead.center-behind.center,Math.max(1,behind.y-ahead.y))*180/Math.PI;
  return Math.max(-35,Math.min(35,-lane*24*p.q+centerSlope*.65));
 }
 function create(random=Math.random,available=()=>true){
  const cars=[{lane:-.75,z:1250,opposite:true,hit:false},{lane:-.25,z:1750,opposite:true,hit:false}];
  let cooldown=0;
  const choose=()=>chooseModel(available,true,random);
  for(const car of cars){car.model=choose();car.offset=laneOffset(random);car.baseOffset=car.offset;car.avoidLane=null;car.cruiseLane=car.lane;car.laneCheck=2+random()*3;car.near=false;car.scored=false;car.medkitRolled=false;car.repairKitRolled=false;car.pickupRoll=undefined;car.cruiseSpeed=null;}
  function reset(){cars[0].z=1250;cars[1].z=1750;for(const car of cars){car.hit=false;car.model=choose();car.offset=laneOffset(random);car.baseOffset=car.offset;car.avoidLane=null;car.cruiseLane=car.lane;car.laneCheck=2+random()*3;car.near=false;car.scored=false;car.medkitRolled=false;car.repairKitRolled=false;car.pickupRoll=undefined;car.cruiseSpeed=null;}cooldown=0;}
  function step(dt,velocity,ratio,playerZ,overlaps,observe=()=>{},avoid=()=>1){
   cooldown=Math.max(0,cooldown-dt);let result=null;
   const factor=Math.max(80,Math.min(150,ratio))/100;
   for(const car of cars){
    car.cruiseSpeed??=cruise(random);const closing=(Math.max(0,velocity)+(car.cruiseSpeed??85)*factor)*3;const prev=car.z,avoidance=avoid(car);if(window.CrimeRushDrivingLab?.mission?.()){car.motionSpeed=(car.cruiseSpeed??85)*factor*avoidance;car.z-=(Math.max(0,velocity)+car.motionSpeed)*3*dt;}else car.z-=closing*dt*avoidance;
    // Swept crossing of the player's collision plane, even at maximum closing speed.
    if(car.model&&!car.hit&&prev>=playerZ-18&&car.z<=playerZ+18&&overlaps(car.lane+car.offset,car)){
     car.hit=true;if(cooldown===0){cooldown=.65;result=car;}
    }
    const destroyed=observe(car,prev);
    if(destroyed){car.z=1800;car.hit=false;car.model=choose();car.offset=laneOffset(random);car.baseOffset=car.offset;car.avoidLane=null;car.cruiseLane=car.lane;car.laneCheck=3;car.near=false;car.scored=false;car.medkitRolled=false;car.repairKitRolled=false;car.pickupRoll=undefined;car.cruiseSpeed=null;continue;}
    if(car.z<0){car.z+=1800;car.hit=false;car.model=choose();car.offset=laneOffset(random);car.baseOffset=car.offset;car.avoidLane=null;car.cruiseLane=car.lane;car.laneCheck=2+random()*3;car.near=false;car.scored=false;car.medkitRolled=false;car.repairKitRolled=false;car.pickupRoll=undefined;car.cruiseSpeed=null;}
   }
   return result;
  }
  return {cars,reset,step};
 }
 // Passing cars enter from behind the camera and yield before the player's occupied lanes.
 function createPassing(lanes,random=Math.random,available=()=>true,rareModel=null,rareChance=()=>RARE_CHANCE){
  const START=-155,END=1460,GUARD=65;
  const cars=lanes.map(lane=>({lane,z:START,delay:0,model:null,active:false,hit:false,offset:0}));
  let friendBag=[],friendRoster='';
  const ordinary=()=>chooseModel(available,false,random);
  const choose=()=>{
   const pool=rareModel?[...new Set(rareModel())]:[];
   const signature=pool.slice().sort().join('|');
   if(signature!==friendRoster){friendRoster=signature;friendBag=[];}
   if(pool.length&&pool.every(id=>available('drive:'+id+':rear')&&rareAngle(id,available))&&random()<Math.max(0,Math.min(1,Number(rareChance())||0))){
    if(!friendBag.length)friendBag=pool.slice();
    return friendBag.splice(Math.min(friendBag.length-1,Math.floor(random()*friendBag.length)),1)[0];
   }
   return ordinary();
  };
  function respawn(car,delay=(1+random()*3)/(profile()?.density||1)){Object.assign(car,{z:START,delay,model:null,active:false,hit:false,offset:laneOffset(random),near:false,scored:false,medkitRolled:false,repairKitRolled:false,pickupRoll:undefined,cruiseSpeed:null,baseOffset:null,avoidLane:null,cruiseLane:car.lane,laneCheck:2+random()*3});}
  function reset(){friendBag=[];friendRoster='';cars.forEach((car,i)=>respawn(car,i*.85+random()*.5));}
  function step(dt,velocity,ratio,playerZ,playerLane,twoWay,halfWidth=.13,contact=()=>false,observe=()=>{},avoid=()=>1){
   const playerSpeed=Math.max(0,velocity),factor=Math.max(80,Math.min(150,ratio))/100;
   // A distinct cruising profile is sampled once per encounter, not every frame.
   const speedFor=car=>car.cruiseSpeed!=null?car.cruiseSpeed*factor:car.slow?playerSpeed*car.speedFactor:Math.max(MIN_PASSING_SPEED,playerSpeed)*factor*car.speedFactor;
   let hit=null;
   for(const car of cars){
    if(twoWay&&car.lane<=0)continue;
    if(car.delay>0){car.delay=Math.max(0,car.delay-dt);continue;}
    const blocked=Math.abs(car.lane+car.offset-playerLane)<=.25+halfWidth;
    if(!car.active){if(blocked)continue;car.cruiseSpeed=cruise(random);car.slow=random()<.25;car.speedFactor=car.slow?.85+random()*.10:.98+random()*.10;const entryAdvance=(speedFor(car)-playerSpeed)*3*dt;if(Math.abs(entryAdvance)<1e-9)continue;car.model=choose();if(!car.model)continue;car.z=entryAdvance<0?END:START;car.active=true;}
    const advance=(speedFor(car)-playerSpeed)*3*dt;
    // A player-car change in the test drive must not leave its old NPC clone visible.
    if(rareModel&&!MODELS.includes(car.model)&&!rareModel().includes(car.model)){car.model=ordinary();if(!car.model){respawn(car);continue;}}
    // Active cars are never deleted when the player changes lanes.
    // Only a new approach is held back in an occupied lane.
    const prev=car.z;
    const avoidance=avoid(car),relative=window.CrimeRushDrivingLab?.mission?.()?(speedFor(car)*avoidance-playerSpeed)*3*dt:advance;const delta=(relative>0&&car.z<playerZ+25?Math.min(relative,95*dt):relative)*(window.CrimeRushDrivingLab?.mission?.()?1:avoidance);
    // Hold a rear car short of the player until the player clears its lane.
    if(delta>0&&blocked&&!car.hit&&car.z<playerZ-45)car.z=Math.min(car.z+delta,playerZ-45);
    else car.z+=delta;
    if(window.CrimeRushDrivingLab?.mission?.())car.motionSpeed=dt>0?Math.max(0,playerSpeed+(car.z-prev)/(3*dt)):speedFor(car);
    if(!car.hit&&contact(car,prev)){
     car.hit=true;
     const direction=car.lane+car.offset>=playerLane?-1:1;
     car.offset=-direction*.10;
     if(!hit)hit={car,direction};
    }
    if(observe(car,prev)){respawn(car,3+random()*2);continue;}
    if(car.z>END||car.z<START)respawn(car);
   }
   return hit;
  }
  function visible(twoWay){return cars.filter(car=>(!twoWay||car.lane>0)&&car.model&&car.active);}
  return {cars,reset,step,visible};
 }
 return {create,createPassing,frameFor,perspective,chooseModel,sameDirectionFrame};
})();
