// Independent, deterministic empty crossroads in world coordinates.
window.DriveCrossroads=(()=>{
 const HALF=95,ZEBRA=26*2.3*2,GAP=18;const settings=()=>window.CrimeRushEnvironment?.get()==='town'?{slot:2400,chance:.48}:{slot:4800,chance:.10};
 const control=document.getElementById('showCrossroads');
 const hash=n=>{const v=Math.sin(n*127.1+78.233)*43758.5453;return v-Math.floor(v);};
 function localSpans(from,to,margin=0){
  if(!control.checked||window.CrimeRushEnvironment?.get()==='motorway')return [];
  const {slot:SLOT,chance:CHANCE}=settings(),result=[];
  for(let i=Math.max(0,Math.floor((from-margin-HALF)/SLOT)-1);i<=Math.ceil((to+margin+HALF)/SLOT);i++){
   if(hash(i*37+892)>=CHANCE)continue;
   const center=i*SLOT+SLOT*(.25+.5*hash(i*37+893)),a=center-HALF,b=center+HALF;
   if(a-margin<=to&&b+margin>=from)result.push({id:i,a,b,center});
  }return result;
 }
 const centerCache=new Map();function slotCenter(i){const {slot:SLOT,chance:CHANCE}=settings(),key=SLOT+':'+i;if(centerCache.has(key))return centerCache.get(key);const value=hash(i*37+892)>=CHANCE?null:i*SLOT+SLOT*(.25+.5*hash(i*37+893));if(centerCache.size>=64)centerCache.clear();centerCache.set(key,value);return value;}
 function computeSpans(from,to,margin=0){const route=window.CrimeRushMissionBridge?.worldRoute?.();if(!route)return localSpans(from,to,margin);const result=new Map();for(const r of route.ranges(from-margin-HALF,to+margin+HALF)){if(['forest','motorway'].includes(r.environment))continue;const SLOT=r.environment==='town'?2400:4800,CHANCE=r.environment==='town'?.48:.10;for(let i=Math.max(0,Math.floor((r.from-HALF)/SLOT)-1);i<=Math.ceil((r.to+HALF)/SLOT);i++){if(hash(i*37+892)>=CHANCE)continue;const center=i*SLOT+SLOT*(.25+.5*hash(i*37+893)),a=center-HALF,b=center+HALF;if(center>=r.from&&center<r.to&&a-margin<=to&&b+margin>=from)result.set(center,{id:i,a,b,center,environment:r.environment});}}for(const s of route.segments()){if(s.junction==null)continue;const center=s.junction,a=center-HALF,b=center+HALF;if(a-margin<=to&&b+margin>=from)result.set(center,{id:Math.round(center),a,b,center,environment:route.at(center-1)});}return [...result.values()].sort((a,b)=>a.center-b.center);}let frameWindow=null;function prepareFrame(from,to){frameWindow={from,to,route:window.CrimeRushMissionBridge?.worldRoute?.(),spans:computeSpans(from,to)};}function spans(from,to,margin=0){if(frameWindow&&frameWindow.route===window.CrimeRushMissionBridge?.worldRoute?.()&&from-margin>=frameWindow.from&&to+margin<=frameWindow.to)return frameWindow.spans.filter(s=>s.a-margin<=to&&s.b+margin>=from);return computeSpans(from,to,margin);}const blocked=(world,margin=0)=>{if(window.CrimeRushMissionBridge?.worldRoute?.())return spans(world,world,margin).length>0;if(!control.checked||window.CrimeRushEnvironment?.get()==='motorway')return false;const {slot:SLOT}=settings();for(let i=Math.max(0,Math.floor((world-margin-HALF)/SLOT)-1);i<=Math.ceil((world+margin+HALF)/SLOT);i++){const center=slotCenter(i);if(center===null)continue;if(Math.abs(world-center)<=HALF+margin)return true;}return false;};
 const intersects=(a,b,margin=0)=>spans(Math.min(a,b),Math.max(a,b),margin).length>0;
 function visible(distance,depth){return spans(distance,distance+depth,ZEBRA+GAP).map(s=>({...s,a:s.a-distance,b:s.b-distance}));}
 function draw(c,project,distance,depth,W){
  c.save();const road=window.CrimeRushAtmosphere?.get()?.road||'#5a6065';c.fillStyle=road;
  for(const s of visible(distance,depth)){
   const a=Math.max(0,s.a),b=Math.min(depth,s.b);if(b<=a)continue;
   // Horizontal side roads extend beyond the viewport, with the same ground plane as the highway.
   const y1=project(b).y,y2=project(a).y;
   c.fillRect(0,Math.floor(y1),W,Math.max(1,Math.ceil(y2)-Math.floor(y1)));
   // World-locked asphalt speckles across the full junction, no roadside vegetation.
   for(let z=Math.ceil((distance+a)/8)*8;z<distance+b;z+=8){
    const p=project(z-distance);if(p.q<.075)continue;
    const reach=Math.ceil(W/(Math.max(1,p.half)*2))+1;
    for(let j=-reach*16;j<=reach*16;j++){
     const n=Math.floor(z/8)*173+j*19;
     if(hash(n)<.35)continue;
     const x=p.center+p.half*(j/8+(hash(n+1)-.5)*.10);if(x<0||x>W)continue;
     c.fillStyle=['#4d5358','#53595e','#666d72','#747b7e'][Math.floor(hash(n+2)*4)];
     c.globalAlpha=.55*Math.min(1,(p.q-.075)/.18);
     c.fillRect(Math.round(x),Math.round(p.y),Math.max(1,Math.round(4*p.q)),1);
    }
   }c.globalAlpha=1;c.fillStyle=road;
  }c.restore();
 }
 function signalMode(id){return hash(id*53+917)<.30?'yellow':'green';}
 function signalLit(id,seconds){return signalMode(id)==='green'?'green':Math.floor((seconds+hash(id*53+918))/.5)%2===0?'yellow':null;}
 const signalWorld=j=>j.a-GAP-ZEBRA-30;
 function stopLines(j){return [{a:j.a-GAP-ZEBRA-36,b:j.a-GAP-ZEBRA-24,l:.018,r:.95},{a:j.b+GAP+ZEBRA+24,b:j.b+GAP+ZEBRA+36,l:-.95,r:-.018}];}
 function signalFog(z,p,project){return Math.max(0,Math.min(1,p&&window.CrimeRushFog?window.CrimeRushFog.sceneOpacity(z,p.fog??0):window.RoadsideObjects?.groundMist?.(z,project)??0));}
 function queueSignals(c,project,distance,depth,W,queue,p,seconds){if(window.CrimeRushEnvironment?.get()!=='town')return;for(const j of spans(distance-220,distance+depth+300)){if(j.environment&&j.environment!=='town')continue;for(const side of [-1,1]){const world=signalWorld(j),z=world-distance;if(z<0||z>depth)continue;const q=project(z),x=q.center+side*q.half*1.20;if(x<-25||x>W+25)continue;const fog=signalFog(z,p,project),fade=Math.min(1,(depth-z)/300),transmission=1-fog;if(fade<=0)continue;queue(z,()=>{const h=185*q.q,w=30*q.q,top=q.y-h,lit=signalLit(j.id,seconds);c.save();c.globalAlpha=fade;c.imageSmoothingEnabled=false;const tint=color=>{const mix=window.CrimeRushAtmosphere?.mix;if(!mix)return color;const shaded=p&&p.ambient<1?mix(color,p.time==='night'?'#18243a':'#8c8580',(1-p.ambient)*.72):color;return mix(shaded,p?.fogColor||'#fafbfb',fog);};const rect=(color,a,b,u,v,emissive=false)=>{c.fillStyle=emissive&&window.CrimeRushAtmosphere?.mix?window.CrimeRushAtmosphere.mix(color,p?.fogColor||'#fafbfb',fog):tint(color);c.fillRect(Math.round(a),Math.round(b),Math.max(1,Math.round(u)),Math.max(1,Math.round(v)));};rect('#343936',x-3*q.q,q.y-h*.76,6*q.q,h*.76);rect('#a1a59a',x-2*q.q,q.y-h*.76,2*q.q,h*.76);rect('#2a302e',x-w*.50,top,w,h*.43);rect('#6c7168',x-w*.46,top+q.q,2*q.q,h*.40);for(const [i,color,off,on] of [[0,'red','#542e28','#e75a43'],[1,'yellow','#5a502b','#ffd54f'],[2,'green','#294a38','#73ef86']]){const yy=top+h*(.085+i*.125),r=Math.max(.65,8*q.q);rect('#171c1a',x-r*1.3,yy-r,r*2.6,r*1.9);rect(lit===color?on:off,x-r*.72,yy-r*.72,r*1.44,r*1.44,lit===color);if(lit===color&&q.q>.035&&transmission>.015){const g=c.createRadialGradient(x,yy,0,x,yy,r*2.2);g.addColorStop(0,color==='green'?'rgba(116,255,142,.5)':'rgba(255,211,64,.55)');g.addColorStop(1,'rgba(255,255,255,0)');c.globalAlpha=fade*transmission;c.fillStyle=g;c.fillRect(x-r*2.2,yy-r*2.2,r*4.4,r*4.4);c.globalAlpha=fade;}}c.restore();},2);}}}
 function markings(distance,depth,worn){
  for(const s of visible(distance,depth)){
   if((s.environment??window.CrimeRushEnvironment?.get())==='town')for(const line of stopLines(s)){const a=Math.max(0,line.a),b=Math.min(depth,line.b);if(b>a)worn(a,b,line.l,line.r,'#e3e0d3',163,false);}
   for(const [start,end] of [[s.a-GAP-ZEBRA,s.a-GAP],[s.b+GAP,s.b+GAP+ZEBRA]]){
    const a=Math.max(0,start),b=Math.min(depth,end);if(b<=a)continue;
    for(let j=0;j<12;j++){const l=-.94+j*(1.88/12);worn(a,b,l,l+.095,'#deded6',97+j*7,true);}
   }
  }
 }
 return {prepareFrame,blocked,intersects,visible,spans,draw,markings,queueSignals,signalMode,signalLit,signalWorld,stopLines,signalFog,get markingMargin(){return ZEBRA+GAP+(window.CrimeRushEnvironment?.get()==='town'?38:2);}};
})();
