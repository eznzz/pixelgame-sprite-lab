const DRIVE_WORLD_SPEED=CrimeRushSpeed.worldSpeed; // Linear world pace calibrated at 115 displayed km/h.
const PLAYER_CAR_SCALE=CrimeRushWorld.playerScale,TRAFFIC_CAR_SCALE=CrimeRushWorld.trafficScale,PLAYER_GROUND_Y=hy+(H-hy)*(211/249);
const LANE_COUNT=CrimeRushWorld.lanes,LANE_CENTERS=Array.from({length:LANE_COUNT},(_,i)=>-1+(2*i+1)/LANE_COUNT),LANE_SEPARATORS=[-.5,.5],FOG_DEPTH=CrimeRushWorld.fogDepth;
function motorwayLabActive(){return !!window.CrimeRushRoadLab&&window.CrimeRushEnvironment?.get()==='motorway';}
let frameRoute=null,frameSegments=null,frameMotorway=false,frameGeometry=new Map(),frameProjection=new Map(),frameDistance=NaN,frameWidth=NaN;function prepareRoadFrame(){frameRoute=window.CrimeRushMissionBridge?.worldRoute?.()||null;frameSegments=frameRoute?.segments()||null;frameMotorway=motorwayLabActive();frameGeometry.clear();frameProjection.clear();frameDistance=distance;frameWidth=W;}function routeRoadGeometry(world){if(frameDistance!==distance||frameWidth!==W)prepareRoadFrame();if(frameGeometry.has(world))return frameGeometry.get(world);const g=computeRoadGeometry(world);if(frameGeometry.size<16000)frameGeometry.set(world,g);return g;}function computeRoadGeometry(world){const L=window.CrimeRushRoadLayout,route=frameRoute;if(!route)return L.at(world,frameMotorway);const segments=frameSegments;let i=segments.length-1;while(i>0&&world<segments[i].world)i--;const s=segments[i];if(s.environment!=='motorway')return {...L.at(world,false),shoulder:1,rail:1};const end=segments[i+1]?.world??Infinity;const g=L.at(world),smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);},factor=Math.min(smooth((world-s.world)/2400),smooth((end-world)/2400)),level=g.level*factor,median=.23*Math.min(1,level),extra=.5*Math.max(0,level-1),outer=median+1+extra,innerRail=median-.085*Math.min(1,level);return {...g,level,median,inner:median,outer,extra,innerRail,anchor:-(median+outer)/2*Math.min(1,level),shoulder:outer+.22*Math.min(1,level),rail:outer+.28*Math.min(1,level)};}function routeGeometryActive(){return !!window.CrimeRushMissionBridge?.worldRoute?.();}function physicalLane(z,lane){return routeGeometryActive()?lane+Math.sign(lane)*routeRoadGeometry(distance+Math.max(0,z)).inner:lane;}function logicalLane(z,lane){return routeGeometryActive()?Math.sign(lane)*Math.max(0,Math.abs(lane)-routeRoadGeometry(distance+Math.max(0,z)).inner):lane;}function project(z){if(frameDistance!==distance||frameWidth!==W)prepareRoadFrame();if(frameProjection.has(z))return frameProjection.get(z);let q=1/(1+z/155),half=600*q;const anchor=(frameMotorway||frameRoute)?routeRoadGeometry(distance+z).anchor:0;const p={q,y:hy+(H-hy)*q,half,center:W/2+28*Math.sin(distance/800+z/700)*q*(1-q)+half*anchor};if(frameProjection.size<16000)frameProjection.set(z,p);return p;}
function motorwayPreviewPlayerX(base,z,halfWidth){if(routeGeometryActive()){const p=project(z),g=routeRoadGeometry(distance+z);if(g.level<=0)return base;return clamp(base,p.center+p.half*(g.inner+halfWidth),p.center+p.half*(g.outer-halfWidth));}if(!motorwayLabActive())return base;const p=project(z),g=window.CrimeRushRoadLayout.at(distance+z);if(g.level===0)return base;const bounds=window.CrimeRushMotorwayTraffic.bounds(distance+z,halfWidth);return clamp(base,p.center+p.half*bounds.min,p.center+p.half*bounds.max);}
function roadPoint(z,lane){const p=project(z);return [p.center+p.half*lane,p.y]}
function strip(z1,z2,a,b,color){const p=project(z1),q=project(z2);poly(color,[p.center+p.half*a,p.y],[p.center+p.half*b,p.y],[q.center+q.half*b,q.y],[q.center+q.half*a,q.y])}
const hash=i=>{const v=Math.sin(i*127.1+78.233)*43758.5453;return v-Math.floor(v)};
// World-space paint wear. Preserve line geometry and avoid frame-to-frame random flicker.
function wornRoadLine(z1,z2,a,b,color,seed,dashed=false){
 strip(z1,z2,a,b,color);
 // Existing chip visibility threshold q>=.07: skip the invisible distant texture loops.
 z2=Math.min(z2,155*(1/.07-1));if(z2<=z1)return;
 // Narrow dashed paint needs broader chips to remain visibly worn in perspective.
 if(dashed){
  const step=8,first=Math.floor((distance+z1-8)/step),last=Math.ceil((distance+z2)/step);
  for(let i=first;i<=last;i++){
   const n=i*211+seed*61,r=hash(n);if(r<.22)continue;
   const start=i*step+hash(n+1)*2-distance,u=Math.max(z1,start),v=Math.min(z2,start+2+hash(n+2)*5);
   if(v<=u||project(u).q<.07)continue;
   const t=hash(n+3)*.35,f=Math.min(1-t,.40+hash(n+4)*.48);
   strip(u,v,a+(b-a)*t,a+(b-a)*(t+f),r>.72?'rgba(76,82,88,.90)':'rgba(90,96,101,.65)');
   if(r>.53){const edge=hash(n+5)>.5;strip(u,Math.min(v,u+3),a+(b-a)*(edge?.68:0),a+(b-a)*(edge?1:.32),'rgba(90,96,101,.84)');}
  }
 }
 const cell=9,first=Math.floor((distance+z1-12)/cell),last=Math.ceil((distance+z2)/cell);
 for(let i=first;i<=last;i++){
  const n=i*149+seed*37,r=hash(n);
  if(r<.24)continue;
  const start=i*cell+hash(n+1)*4-distance;
  const u=Math.max(z1,start),v=Math.min(z2,start+2.5+hash(n+2)*8.5);
  if(v<=u||project(u).q<.07)continue;
  const t=hash(n+3)*.76,f=Math.min(1-t,.18+hash(n+4)*.50);
  strip(u,v,a+(b-a)*t,a+(b-a)*(t+f),r>.84?'rgba(76,82,88,.88)':'rgba(90,96,101,.58)');
  if(r>.58){
   const edge=hash(n+5)>.5?0:1;
   strip(u,Math.min(v,u+4+hash(n+6)*3),a+(b-a)*(edge?.82:0),a+(b-a)*(edge?1:.18),'rgba(90,96,101,.78)');
  }
  if(r>.72){
   const t2=hash(n+7)*.82,f2=Math.min(1-t2,.10+hash(n+8)*.26);
   const u2=u+hash(n+9)*2,v2=v-hash(n+10)*1.5;
   if(v2>u2)strip(u2,v2,a+(b-a)*t2,a+(b-a)*(t2+f2),'rgba(106,113,118,.34)');
  }
 }
}
const skyStops=[[0,[193,197,200]],[.32,[205,209,211]],[.65,[224,227,228]],[.88,[242,243,243]],[1,[250,251,251]]];
function skyColor(t){let j=1;while(j<skyStops.length-1&&t>skyStops[j][0])j++;const [a,A]=skyStops[j-1],[b,B]=skyStops[j],k=clamp((t-a)/(b-a),0,1);return 'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*k)).join(',')+')'}
const sceneryControls={soil:document.getElementById('showSoil'),grass:document.getElementById('showGrass'),fields:document.getElementById('showFields'),farm:document.getElementById('showFarm'),power:document.getElementById('showPower'),horses:document.getElementById('showHorses'),fence:document.getElementById('showFence')};
const trafficSpeedControl=document.getElementById('trafficSpeed'),trafficSpeedValue=document.getElementById('trafficSpeedValue');
trafficSpeedControl.addEventListener('input',()=>{trafficSpeedValue.textContent=trafficSpeedControl.value+'%'});
const trafficAvailable=key=>!!I[key]?.naturalWidth;
const trafficMode=document.getElementById('trafficMode');
const oncoming=DriveTraffic.create(Math.random,trafficAvailable);
