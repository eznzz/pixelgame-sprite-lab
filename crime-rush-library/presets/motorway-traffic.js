// Shared continuous lane mapping and deterministic preview traffic.
// Lane IDs refer to distance from median, not screen coordinates.
(function(root){
const L=typeof module!=='undefined'?require('./road-layout.js'):root.CrimeRushRoadLayout;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
function lane(world,index,direction=1){const g=L.at(world);if(index<0||index>2||!Number.isInteger(index))throw Error('Invalid lane');if(index<2)return direction*(g.inner+.25+.5*index);
// Outer lane is populated only on full width. Merge starts 900 units before taper.
const w=((world%L.cycle)+L.cycle)%L.cycle;
const merge=direction>0?1-smooth((w-17700)/900):smooth((w-11400)/900);
const open=direction>0?smooth((w-11400)/900):1-smooth((w-17700)/900);
const amount=g.extra>=.499999?Math.min(open,merge):0;
return direction*(g.inner+.75+.5*amount);}
function bounds(world,halfWidth=.13){const g=L.at(world),margin=clamp(halfWidth,.01,.24);return {min:g.inner+margin,max:g.outer-margin};}
function preview(distance,seconds,depth=1800){const result=[];for(const direction of [-1,1])for(let index=0;index<3;index++){
const spacing=850+index*110,speed=direction*(160+index*28),offset=(index*337+(direction<0?423:0));
const origin=seconds*speed+offset,first=Math.floor((distance-origin)/spacing)-1,last=Math.ceil((distance+depth-origin)/spacing)+1;
for(let k=first;k<=last;k++){const world=origin+k*spacing,z=world-distance;if(z<0||z>depth)continue;
const g=L.at(world),l=lane(world,index,direction);
// The third stream merges into lane two at tapers. Suppress spawn outside full-width
// section using a gradual alpha ramp; no collision/gameplay is driven by preview cars.
const alpha=index===2?smooth(g.extra/.5)*smooth(Math.abs(l)-g.inner-.75>.001?Math.abs(l)-g.inner-.75:0)*4:1;
if(alpha<=.005)continue;result.push({id:direction+':'+index+':'+k,world,z,worldSpeed:speed,lane:l,opposite:direction<0,opacity:Math.min(1,alpha),model:(Math.abs(k+index)%2)?'traffic-01':'traffic-02'});}
}return result;}
const api=Object.freeze({lane,bounds,preview});if(typeof module!=='undefined')module.exports=api;else root.CrimeRushMotorwayTraffic=api;
})(typeof window!=='undefined'?window:globalThis);
