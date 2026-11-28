// Experimental longitudinal dynamics. km/h internally, existing world units externally.
// Pedals and body response are continuous; fixed small integration steps bound error.
(function(root){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),finite=(v,d)=>Number.isFinite(v)?v:d;
 const defaults=Object.freeze({power:1,brake:1,drag:1,pedalRate:9,body:1,cameraSpeed:.5});
 const WORLD_PER_KMH=180/140*3*1.55;
 function config(v={}){return {power:clamp(finite(v.power,1),.5,1.5),brake:clamp(finite(v.brake,1),.5,1.5),drag:clamp(finite(v.drag,1),0,2),pedalRate:clamp(finite(v.pedalRate,9),3,18),body:clamp(finite(v.body,1),0,1),cameraSpeed:clamp(finite(v.cameraSpeed,.5),0,1)};}
 function reset(kmh=0){return {kmh:clamp(finite(kmh,0),0,155),throttle:0,brake:0,acceleration:0,pitch:0,wheelTravel:0,travel:0,elapsed:0};}
 const ease=(x,target,rate,dt)=>target+(x-target)*Math.exp(-rate*dt);
 // Visual tread cycle (four cached textures), capped at 7.5 cycles/s to
 // avoid uncontrolled aliasing at 30 Hz; not a literal rim revolution count.
 function wheelHz(kmh){return Math.min(7.5,Math.max(0,kmh)/12);}
 function step(state,input,dt,settings=defaults,limit=140,condition=1){
  const c=config(settings),d=clamp(finite(dt,0),0,.05),cap=clamp(finite(limit,140),0,155),health=clamp(finite(condition,1),0,1),n=Math.max(1,Math.ceil(d*240-1e-9)),h=d/n;
  let {kmh:v,throttle,brake,acceleration,pitch,wheelTravel,travel,elapsed}=state,advance=0;
  const empty=!!input.empty,brakeGoal=input.brake?1:0,gasGoal=input.gas&&!input.brake&&!empty?1:0;if(empty)throttle=0;
  for(let i=0;i<n;i++){
   const g=ease(throttle,gasGoal,c.pedalRate,h/2),b=ease(brake,brakeGoal,c.pedalRate*1.5,h/2);
   const force=s=> empty?-(65*140/180)*.35:(32*140/180)*c.power*health*g*(1-.55*clamp(s/Math.max(cap,1),0,1))*(1-b)-(65*140/180)*c.brake*b-c.drag*(1.4+.00016*s*s)*(1-g)*(1-b);
   const a=force(v),mid=clamp(v+a*h/2,0,Math.max(v,cap)),next=clamp(v+force(mid)*h,0,Math.max(v,cap));
   const nv=empty?Math.max(0,v+force(v)*h):v>cap?Math.max(cap,Math.min(next,v-(65*140/180)*h)):Math.min(cap,next);
   const actual=h>0?(nv-v)/h:0,ds=(v+nv)/2*h*WORLD_PER_KMH;
   advance+=ds;travel+=ds;elapsed+=h;wheelTravel=(wheelTravel+wheelHz((v+nv)/2)*20*h)%20;
   acceleration=ease(acceleration,actual,8,h);pitch=ease(pitch,clamp(-acceleration/50*.018,-.018,.018)*c.body,7,h);
   throttle=ease(throttle,gasGoal,c.pedalRate,h);brake=ease(brake,brakeGoal,c.pedalRate*1.5,h);v=nv;
  }
  return {kmh:v,throttle,brake,acceleration,pitch,wheelTravel,travel,elapsed,advance};
 }
 function lookAhead(base,kmh,c=defaults){return clamp(base*(1+c.cameraSpeed*.55*(clamp(kmh,0,155)/115-1)),0,320);}
 const api={defaults,config,reset,step,wheelHz,lookAhead,WORLD_PER_KMH};if(typeof module!=='undefined')module.exports=api;else root.CrimeRushSpeedExperience=api;
})(typeof window!=='undefined'?window:globalThis);
