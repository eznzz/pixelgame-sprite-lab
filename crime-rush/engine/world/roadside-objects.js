// Replaceable roadside sprites and connected perspective geometry. Visual only.
window.RoadsideObjects=(()=>{
 const hash=n=>{const v=Math.sin(n*127.1+78.233)*43758.5453;return v-Math.floor(v)};
 const canvas=(w,h)=>{const a=document.createElement('canvas');a.width=w;a.height=h;return a};
 const rect=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};
 const poly=(c,color,pts)=>{c.fillStyle=color;c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);c.closePath();c.fill()};
 // High-resolution pixel-painted assets. The raster master is independent of projection.
 const pixel=(c,col,x,y,w=1,h=1)=>{c.fillStyle=col;c.fillRect(x|0,y|0,w,h)};
 function line(c,x,y,xx,yy,col,w=1){const n=Math.max(Math.abs(xx-x),Math.abs(yy-y),1);for(let i=0;i<=n;i++)pixel(c,col,Math.round(x+(xx-x)*i/n),Math.round(y+(yy-y)*i/n),w,w)}
 const leaf=['#293b30','#354a38','#465a41','#596b49','#71805a','#89936b','#a2a780'];
 const stonePal=['#343c40','#454e51','#596265','#697376','#7d8584','#969a92','#b4b3a6'];
 const wood=['#3b3b38','#4c4841','#60584c','#776958','#8b7964','#a18b71','#b6a18a'];
 function rasterPoly(c,pts,paint){
  const minY=Math.floor(Math.min(...pts.map(p=>p[1]))),maxY=Math.ceil(Math.max(...pts.map(p=>p[1])));
  for(let y=minY;y<maxY;y++){const xs=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if((a[1]<=y+.5&&b[1]>y+.5)||(b[1]<=y+.5&&a[1]>y+.5))xs.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]))}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)for(let x=Math.ceil(xs[i]-.5);x<xs[i+1]-.5;x++)pixel(c,paint(x,y),x,y);}
 }
 function timber(c,x,y,w,h,seed){for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const n=hash(seed+Math.floor(xx/2)*13+Math.floor(yy/11)*37),side=xx/w;pixel(c,wood[Math.min(6,Math.max(0,(side<.15?5:side>.77?1:3)+(n>.82?1:n<.15?-1:0)))],x+xx,y+yy)}}
 const post=canvas(24,64),fc=post.getContext('2d');timber(fc,5,5,14,59,31);pixel(fc,wood[5],6,3,12,3);
 for(const y of [17,43]){pixel(fc,'#3d4442',12,y,3,3);pixel(fc,'#aeb3a8',12,y,1,1)}
 const board=canvas(96,12),bc=board.getContext('2d');for(let y=0;y<12;y++)for(let x=0;x<96;x++){const n=hash(Math.floor(x/7)*71+y*13);pixel(bc,wood[Math.max(0,Math.min(5,(y<2?5:y>9?1:3)+(n>.8?1:n<.2?-1:0)))],x,y)}
 // Approved external WebP assets; omit unavailable sprites rather than rendering obsolete artwork.
 const assetBase=new URL('../../../crime-rush-library/assets/webp/drive/',document.currentScript.src);
 function loadHD(name){const image=new Image();image.src=new URL(name+'?v=27.84',assetBase).href;return image;}
 const hdPole=loadHD('utility-pole-hd.webp');
 const horseArt=loadHD('horse-grazing-01.webp');
 const ready=a=>a.complete&&a.naturalWidth>0;
 const POLE_HEIGHT=510,FENCE_SCALE=2;
 const fade=q=>Math.max(0,Math.min(1,(q-.035)/.17));
 const anchor=(project,z,side,lane)=>{const p=project(Math.max(0,z));return {x:p.center+side*p.half*lane,y:p.y,q:p.q,z}};
 const sprite=(c,a,x,y,w,h,alpha)=>{if(alpha<=0)return;c.globalAlpha=alpha;c.drawImage(a,Math.round(x-w/2),Math.round(y-h),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};
 // Distance-based mist affects the entire silhouette, even above the horizon veil.
 const clamp01=v=>Math.max(0,Math.min(1,v));
 // Match the ground veil at the object's world depth, never its screen height.
 const mist=z=>{const p=window.CrimeRushAtmosphere?.get();if(p)return CrimeRushFog.sceneOpacity(z,p.fog);const f=clamp01((z-460)/950);return .58*f*f*(3-2*f)*(window.CrimeRushAtmosphere?.fogFactor()??1);};
 const visibility=(q,z,depth)=>fade(q)*clamp01((depth-z)/240);
 // Cache tinted source sprites, not resized destination canvases. A bounded
 // palette of fog levels avoids GPU surface reallocation during every frame.
 const fogCache=new WeakMap(),FOG_LEVELS=16;
 // Dynamic sprites reuse one scratch surface per source/style, avoiding thousands of palette canvases.
 const dynamicFog=new WeakMap();function dynamicSurface(a,style,level,atmosphere){let slots=dynamicFog.get(a);if(!slots){slots=new Map();dynamicFog.set(a,slots);}let entry=slots.get(style+':'+level);if(!entry){const w=a.naturalWidth||a.width,h=a.naturalHeight||a.height,scale=Math.min(1,256/Math.max(w,h));entry={out:canvas(Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale))),key:''};slots.set(style+':'+level,entry);}const color=atmosphere.fogColor,ambient=Math.round(atmosphere.ambient*32)/32,key=color+':'+ambient+':'+atmosphere.time;if(entry.key===key)return entry.out;const out=entry.out,ctx=out.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter=style==='traffic'?'brightness(.88) saturate(.72)':'none';ctx.clearRect(0,0,out.width,out.height);ctx.imageSmoothingEnabled=false;ctx.drawImage(a,0,0,out.width,out.height);ctx.filter='none';ctx.globalCompositeOperation='source-atop';if(style!=='traffic'&&ambient<1){ctx.globalAlpha=(1-ambient)*.72;ctx.fillStyle=atmosphere.time==='night'?'#18243a':'#8c8580';ctx.fillRect(0,0,out.width,out.height);}ctx.globalAlpha=level/FOG_LEVELS;ctx.fillStyle=color;ctx.fillRect(0,0,out.width,out.height);entry.key=key;return out;}
 const paletteMemo=new WeakMap();function dynamicPalette(p){if(paletteMemo.has(p))return paletteMemo.get(p);const rgb=[1,3,5].map(i=>Math.min(255,Math.round(parseInt(p.fogColor.slice(i,i+2),16)/8)*8));const out={...p,fogColor:'#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('')};paletteMemo.set(p,out);return out;}
 function fogArt(a,amount,style){
  const atmosphere=window.CrimeRushAtmosphere?.get();const level=(atmosphere?Math.floor:Math.round)(clamp01(amount)*FOG_LEVELS+1e-9);if(!level&&!atmosphere)return a;if(atmosphere?.dynamic)return dynamicSurface(a,style,level,dynamicPalette(atmosphere));
  let cache=fogCache.get(a);if(!cache){cache=new Map();fogCache.set(a,cache);}
  const key=style+':'+level+':'+(atmosphere?.time||'legacy')+':'+(atmosphere?.weather||'')+':'+(window.CrimeRushAtmosphere?.fogColor()||'#fafbfb')+':'+Math.round((atmosphere?.ambient??1)*32);if(cache.has(key))return cache.get(key);
  const w=a.naturalWidth||a.width,h=a.naturalHeight||a.height;
  // Large HD sources are reduced only for fogged, distant objects.
  const scale=Math.min(1,256/Math.max(w,h)),out=canvas(Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale))),ctx=out.getContext('2d');
  ctx.imageSmoothingEnabled=false;ctx.drawImage(a,0,0,out.width,out.height);
  ctx.globalCompositeOperation='source-atop';if(atmosphere&&atmosphere.ambient<1){ctx.globalAlpha=(1-atmosphere.ambient)*.72;ctx.fillStyle=atmosphere.time==='night'?'#18243a':'#8c8580';ctx.fillRect(0,0,out.width,out.height);}const f=level/FOG_LEVELS;
  if(style==='pole'&&!window.CrimeRushAtmosphere?.get()){ctx.globalAlpha=f*.16;ctx.fillStyle='#8f9088';ctx.fillRect(0,0,out.width,out.height);ctx.globalAlpha=f*.42;ctx.fillStyle='#f3f4ef';}
  else{ctx.globalAlpha=f;ctx.fillStyle=window.CrimeRushAtmosphere?.fogColor()||'#fafbfb';}
  ctx.fillRect(0,0,out.width,out.height);cache.set(key,out);if(cache.size>96)cache.delete(cache.keys().next().value);return out;
 }
 function mistSprite(c,a,x,y,w,h,alpha,z,entryAlpha=1){
  if(alpha<=0)return;const amount=mist(z);
  sprite(c,fogArt(a,amount,'pole'),x,y,w,h,window.CrimeRushAtmosphere?.get()?entryAlpha:alpha*(1-amount*.22));
 }
 function groundMist(z,project){const p=window.CrimeRushAtmosphere?.get();return p?CrimeRushFog.sceneOpacity(z,p.fog):legacyGroundMist(z,project);}
 function legacyGroundMist(z,project){
  if(z<=460)return 0;
  const horizon=project(1e12).y,top=horizon-18,bottom=project(460).y;
  const t=clamp01((project(z).y-top)/(bottom-top)),start=18/(bottom-top);
  if(t<=.38)return .86+(.64-.86)*clamp01((t-start)/(.38-start));
  if(t<=.64)return .64+(.32-.64)*(t-.38)/.26;
  if(t<=.84)return .32+(.09-.32)*(t-.64)/.20;
  return .09*(1-t)/.16;
 }
 function groundMistSprite(c,a,x,y,w,h,alpha,z,project){
  if(alpha<=0)return;
  sprite(c,fogArt(a,groundMist(z,project),'ground'),x,y,w,h,alpha);
 }
 function prepareFoggedVehicle(a,amount){
  const level=Math.round(clamp01(amount)*FOG_LEVELS);const atmosphere=window.CrimeRushAtmosphere?.get();if(atmosphere?.dynamic)return dynamicSurface(a,'traffic',level,dynamicPalette(atmosphere));let cache=fogCache.get(a);if(!cache){cache=new Map();fogCache.set(a,cache);}
  const key='traffic:'+level+':'+(window.CrimeRushAtmosphere?.fogColor()||'#fafbfb');let out=cache.get(key);
  if(!out){const scale=Math.min(1,256/Math.max(a.naturalWidth,a.naturalHeight));out=canvas(Math.max(1,Math.round(a.naturalWidth*scale)),Math.max(1,Math.round(a.naturalHeight*scale)));const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.filter='brightness(.88) saturate(.72)';ctx.drawImage(a,0,0,out.width,out.height);ctx.filter='none';ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=level/FOG_LEVELS;ctx.fillStyle=window.CrimeRushAtmosphere?.fogColor()||'#fafbfb';ctx.fillRect(0,0,out.width,out.height);cache.set(key,out);if(cache.size>96)cache.delete(cache.keys().next().value);}
  return out;
 }
 function drawFoggedVehicle(c,a,x,y,w,h,amount){c.drawImage(prepareFoggedVehicle(a,amount),x,y,w,h);}
 function wireSpans(distance,depth,step){
  const spans=[];
  for(let i=Math.floor((distance+depth)/step);i>=Math.floor(distance/step);i--){
   const start=i*step-distance,end=start+step,from=Math.max(0,start),to=Math.min(depth,end);
   if(to>from&&!DriveCrossroads.blocked(distance+start,60)&&!DriveCrossroads.blocked(distance+end,60))spans.push({start,end,from,to});
  }
  return spans;
 }
 function power(c,project,distance,depth,W,queue){
  const step=1040,side=1,lane=1.33,first=Math.floor(distance/step),last=Math.ceil((distance+depth)/step);
  // Same world-space anchor for poles and the three sagging cables.
  if(!ready(hdPole))return;
  const poleArt=hdPole,poleWidth=POLE_HEIGHT*hdPole.naturalWidth/hdPole.naturalHeight;
  const insulators=[[34/232-.5,35/475],[73/232-.5,39/475],[205/232-.5,32/475]];
  const points=[];
  for(let i=first;i<=last;i++){const z=i*step-distance;if(z<0||z>depth||window.CrimeRushEnvironment?.layerAt?.('power',i*step,true)===false||DriveCrossroads.blocked(i*step,60))continue;const p=anchor(project,z,side,lane);points.push(p)}
  // Keep the section of every span intersecting the visible depth, even if its pole is outside it.
  for(const span of wireSpans(distance,depth,step)){
   for(const [u,v] of insulators){
    const cablePoint=z=>{const p=anchor(project,z,side,lane),t=(z-span.start)/step;return {x:p.x+u*poleWidth*p.q,y:p.y-(1-v)*POLE_HEIGHT*p.q+Math.sin(Math.PI*t)*78*p.q,q:p.q};};
    const count=Math.max(1,Math.ceil((span.to-span.from)/40));
    for(let j=0;j<count;j++){
     const z0=span.from+(span.to-span.from)*j/count,z1=span.from+(span.to-span.from)*(j+1)/count,mid=(z0+z1)/2,a=cablePoint(z0),b=cablePoint(z1),p=anchor(project,mid,side,lane);
     if(window.CrimeRushEnvironment?.layerAt?.('power',distance+mid,true)===false||Math.max(a.x,b.x)<-2||Math.min(a.x,b.x)>W+2||Math.max(a.y,b.y)<0)continue;
     const f=mist(mid),atmosphere=window.CrimeRushAtmosphere?.get(),farFade=atmosphere?CrimeRushSkyModel.wireFade(mid,depth):1,rgb=[83,92,88].map((v,i)=>Math.round(v+([243,244,239][i]-v)*f*.42));
     queue(mid,()=>{c.globalAlpha=atmosphere?farFade*.62*(1-f*.65):visibility(p.q,mid,depth)*.82*(1-f*.22);c.strokeStyle=atmosphere?CrimeRushAtmosphere.mix('#535c58',atmosphere.fogColor,f):'rgb('+rgb.join(',')+')';c.lineWidth=atmosphere?Math.max(.5,Math.min(1,p.q*4)):1;
     c.beginPath();c.moveTo(Math.round(a.x),Math.round(a.y));c.lineTo(Math.round(b.x),Math.round(b.y));c.stroke();});
    }
   }
  }
  for(let i=points.length-1;i>=0;i--){const p=points[i];if(p.x+poleWidth*.5*p.q<0||p.x-poleWidth*.5*p.q>W)continue;queue(p.z,()=>mistSprite(c,poleArt,p.x,p.y,poleWidth*p.q,POLE_HEIGHT*p.q,visibility(p.q,p.z,depth),p.z,window.CrimeRushAtmosphere?.get()?CrimeRushSkyModel.poleFade(p.z,depth):1),1)}

 }
 // Sample the rail in screen space, not at a fixed world-unit interval.
 // Preserve the original texture coordinates and the painter ordering.
 function queueGuardrail(c,a,project,world,distance,limit,side,lane,length,W,queue,height=64,near=0){
  const start=world-distance-length/2,end=start+length,from=Math.max(near,start),to=Math.min(limit,end);
  if(to<=from||DriveCrossroads.intersects(world-length/2,world+length/2,90))return;
  const quality=window.CrimeRushPerformance?.detail?.()??1;
  const point=z=>{const p=project(z);return {z,x:p.center+side*p.half*lane,y:p.y,top:p.y-height*p.q,h:height*p.q};};
  const emit=(p,q)=>{const mid=(p.z+q.z)/2,alpha=Math.max(0,Math.min(1,(limit-mid)/300));if(alpha<=0||Math.abs(q.x-p.x)<.35||Math.max(p.x,q.x)<-2||Math.min(p.x,q.x)>W+2)return;
   const u0=(p.z-start)/length,u1=(q.z-start)/length,lo=side<0?u0:1-u1,hi=side<0?u1:1-u0;
   window.CrimeRushPerformance?.countRail?.();
   queue(mid,()=>{const tex=fogArt(a,groundMist(Math.max(0,mid),project),'ground'),tw=tex.width,th=tex.height;
    c.save();c.globalAlpha=alpha;c.imageSmoothingEnabled=false;
    const clipped=Math.abs(p.h-q.h)>2;if(clipped){c.beginPath();c.moveTo(p.x,p.top);c.lineTo(q.x,q.top);c.lineTo(q.x,q.y);c.lineTo(p.x,p.y);c.closePath();c.clip();}
    const left=p.x<q.x,A=left?p:q,B=left?q:p;c.transform(B.x-A.x,B.top-A.top,0,clipped?Math.max(p.h,q.h):(p.h+q.h)/2,A.x,A.top);
    c.drawImage(tex,lo*tw,0,Math.max(.01,(hi-lo)*tw),th,0,0,1,1);c.restore();
   },2);
  };
  function split(p,q,level){const m=point((p.z+q.z)/2),min=Math.min(p.x,m.x,q.x),max=Math.max(p.x,m.x,q.x);if(max<-2||min>W+2)return;
   // Perspective curvature, not distance alone, determines tessellation.
   const dx=q.x-p.x,dy=q.top-p.top,den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,((m.x-p.x)*dx+(m.top-p.top)*dy)/den)):0;
   const error=Math.hypot(m.x-p.x-t*dx,m.top-p.top-t*dy);
   if(level<7&&(max-min>24/quality||Math.abs(p.h-q.h)>4/quality||error>.65/quality)){split(p,m,level+1);split(m,q,level+1);}else emit(p,q);
  }
  split(point(from),point(to),0);
 }
 function fence(c,project,distance,depth,W,fieldPlot,queue){
  const step=55,first=Math.floor(distance/step),last=Math.ceil((distance+depth)/step);
  for(let i=last;i>=first;i--)for(const side of [-1,1]){
   const world=i*step,z=world-distance;if(z<0||z>depth)continue;
   const aPlot=fieldPlot(world,side),bPlot=fieldPlot(world+step,side);
   if(window.CrimeRushEnvironment?.layerAt?.('fence',world,true)===false||window.CrimeRushEnvironment?.layerAt?.('fields',world,true)===false||!aPlot.active||hash(aPlot.n+81)<.28)continue;
   const lane=1.45,p=anchor(project,z,side,lane);
   if(window.CrimeRushEnvironment?.layerAt?.('fence',world+step,true)!==false&&bPlot.active&&aPlot.n===bPlot.n&&z+step<=depth&&!DriveCrossroads.intersects(world,world+step,90)){
    const q=anchor(project,z+step,side,lane);
    for(const h of [11,25])for(let j=0;j<6;j++){
      const aa=anchor(project,z+step*j/6,side,lane),bb=anchor(project,z+step*(j+1)/6,side,lane);
      const ax=aa.x,ay=aa.y-(h+5)*FENCE_SCALE*aa.q,bx=bb.x,by=bb.y-(h+5)*FENCE_SCALE*bb.q;
      if(Math.max(ax,bx)<-2||Math.min(ax,bx)>W+2)continue;
      queue(z+step*(j+.5)/6,()=>{const atmosphere=window.CrimeRushAtmosphere?.get();c.globalAlpha=atmosphere?1:Math.min(fade(aa.q),fade(bb.q));c.save();c.transform((bx-ax)/16,(by-ay)/16,0,Math.max(1,5*FENCE_SCALE*(aa.q+bb.q)/2)/12,ax,ay);
      c.drawImage(atmosphere?fogArt(board,mist(z+step*(j+.5)/6),'ground'):board,j*16,0,16,12,0,0,16.3,12);c.restore();},1);
    }
   }
   if(p.x+12*FENCE_SCALE*p.q>=0&&p.x-12*FENCE_SCALE*p.q<=W)queue(z,()=>{const atmosphere=window.CrimeRushAtmosphere?.get();sprite(c,atmosphere?fogArt(post,mist(z),'ground'):post,p.x,p.y,15*FENCE_SCALE*p.q,40*FENCE_SCALE*p.q,atmosphere?1:fade(p.q));},2);
  }
 }
 const horseRandom=(slot,side,channel)=>{let x=(Math.imul(slot|0,0x9e3779b1)^Math.imul(side,0x85ebca6b)^Math.imul(channel+1,0xc2b2ae35)^0x48a9b21d)>>>0;x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return ((x^(x>>>16))>>>0)/4294967296};
 const HORSE_CHANCE=.05,HORSE_WIDTH=205,HORSE_STEP=2400;
 function horsePlacement(slot,side){
  return slot>=0&&horseRandom(slot,side,0)<HORSE_CHANCE?slot*HORSE_STEP+horseRandom(slot,side,1)*HORSE_STEP:null;
 }
 function horseNearby(world,radius){
  for(let i=Math.max(0,Math.floor((world-radius)/HORSE_STEP));i<=Math.floor((world+radius)/HORSE_STEP);i++)for(const side of [-1,1]){
   const horse=horsePlacement(i,side);
   if(horse!==null&&Math.abs(horse-world)<radius)return true;
  }
  return false;
 }
 function horses(c,project,distance,depth,W,queue){
  if(!ready(horseArt))return;
  const step=HORSE_STEP,first=Math.floor(distance/step),last=Math.ceil((distance+depth)/step);
  for(let i=last;i>=first;i--)for(const side of [-1,1]){
   const world=horsePlacement(i,side);if(world===null||window.CrimeRushFuelPickups?.accessAt(world,side,120)||window.CrimeRushEnvironment?.layerAt?.('horses',world,true)===false||DriveCrossroads.blocked(world,70))continue;
   const z=world-distance;if(z<0||z>depth)continue;
   const p=anchor(project,z,side,1.27+horseRandom(i,side,2)*.13);
   const w=HORSE_WIDTH*(.94+.12*horseRandom(i,side,3))*p.q,h=w*horseArt.height/horseArt.width;
   const road=project(z),edge=road.center+side*road.half;
   p.x=edge+side*Math.max(Math.abs(p.x-edge),w/2+3);
   if(p.x+w/2<0||p.x-w/2>W)continue;
   const alpha=clamp01((depth-z)/240);
   queue(z,()=>{c.save();c.globalAlpha=.18*alpha*(1-groundMist(z,project));c.fillStyle='#22251e';
   c.beginPath();c.ellipse(p.x,p.y,w*.40,Math.max(1,h*.065),0,0,Math.PI*2);c.fill();c.restore();
   c.save();
   // Face away from the roadway, with hooves anchored to the same ground plane.
   if(side===1){c.translate(2*p.x,0);c.scale(-1,1);}
   groundMistSprite(c,horseArt,p.x,p.y,w,h,alpha,z,project);c.restore();},2);
  }
 }
 function drawGround(c,project,distance,depth,W,controls,fieldPlot,queue){
  c.save();c.imageSmoothingEnabled=false;
  if(window.CrimeRushMissionBridge?.worldRoute?.()||controls.fence.checked&&controls.fields.checked)fence(c,project,distance,depth,W,fieldPlot,queue);
  c.restore();
 }
 function drawHorses(c,project,distance,depth,W,controls,queue){
  if(!window.CrimeRushMissionBridge?.worldRoute?.()&&!controls.horses.checked)return;
  c.save();c.imageSmoothingEnabled=false;horses(c,project,distance,depth,W,queue);c.restore();
 }
 function drawPower(c,project,distance,depth,W,controls,queue){
  if(!window.CrimeRushMissionBridge?.worldRoute?.()&&!controls.power.checked)return;
  c.save();c.imageSmoothingEnabled=false;power(c,project,distance,depth,W,queue);c.restore();
 }
 return {drawGround,drawHorses,drawPower,queueGuardrail,groundMist,groundMistSprite,drawFoggedVehicle,prepareFoggedVehicle,horseNearby};
})();
