// Experimental 2.5D road centerline in the existing depth units.
// Cross-sections remain horizontal: no hidden change of road width, depth scale
// or player ground plane. X(s) is analytical, deterministic and C-infinity.
(function(root){
 const roadUnit=155/1.6,period=7200,k=2*Math.PI/period,rad=180/Math.PI;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),finite=(x,d)=>Number.isFinite(x)?x:d;
 const defaults=Object.freeze({profile:'s',strength:.14,lookAhead:160,follow:.25,followRate:4});
 function config(v={}){return {profile:['straight','left','right','s'].includes(v.profile)?v.profile:defaults.profile,strength:clamp(finite(v.strength,defaults.strength),0,.24),lookAhead:clamp(finite(v.lookAhead,defaults.lookAhead),0,320),follow:clamp(finite(v.follow,defaults.follow),0,.5),followRate:clamp(finite(v.followRate,defaults.followRate),1,10)};}
 function sample(s,c=defaults){const a=c.strength,u=k*s;if(c.profile==='straight'||a===0)return {x:0,slope:0,second:0};if(c.profile==='left'||c.profile==='right'){const sign=c.profile==='right'?1:-1;return {x:sign*a/k*(1-Math.cos(u)),slope:sign*a*Math.sin(u),second:sign*a*k*Math.cos(u)};}
 // Two smooth harmonics: maximum absolute slope <= strength.
 return {x:a/k*(.72*(1-Math.cos(u))+.14*(1-Math.cos(2*u))),slope:a*(.72*Math.sin(u)+.28*Math.sin(2*u)),second:a*k*(.72*Math.cos(u)+.56*Math.cos(2*u))};}
 function follow(previous,lane,dt,c=defaults){const goal=clamp((lane-.25)*c.follow,-.22,.22);return goal+(finite(previous,0)-goal)*Math.exp(-c.followRate*clamp(finite(dt,0),0,.05));}
 function camera(world,c=defaults,lateral=0){const a=sample(world,c),b=sample(world+c.lookAhead,c),heading=c.lookAhead>0?(b.x-a.x)/c.lookAhead:a.slope;return {world,config:c,origin:a.x,heading,lateral,curvature:a.second/Math.pow(1+a.slope*a.slope,1.5),roadHeading:Math.atan(a.slope)*rad,cameraHeading:Math.atan(heading)*rad};}
 function offset(frame,z){return (sample(frame.world+z,frame.config).x-frame.origin-frame.heading*z)/roadUnit-frame.lateral;}
 function project(frame,z,width,horizon,height,anchor=0){const q=1/(1+z/155),half=600*q;return {q,half,y:horizon+(height-horizon)*q,center:width/2+half*(offset(frame,z)+anchor)};}
 function vanishing(frame,width){return width/2-600*155/roadUnit*frame.heading;}
 const api={defaults,config,sample,follow,camera,offset,project,vanishing,roadUnit,period};if(typeof module!=='undefined')module.exports=api;else root.CrimeRushRoadCurvature=api;
})(typeof window!=='undefined'?window:globalThis);
