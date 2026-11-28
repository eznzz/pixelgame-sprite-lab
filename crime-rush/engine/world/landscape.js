const driveBackdrop=document.createElement('canvas');
function rebuildDriveBackdrop(){driveBackdrop.width=cv.width;driveBackdrop.height=cv.height;
const bg=driveBackdrop.getContext('2d');bg.setTransform(cv.width/W,0,0,cv.height/H,0,0);
const atmosphere=CrimeRushAtmosphere.get();if(atmosphere){CrimeRushAtmosphereDraw.backdrop(bg,W,H,hy,atmosphere);return;}
for(let y=0;y<hy;y+=3){bg.fillStyle=skyColor(y/hy);bg.fillRect(0,y,W,Math.min(3,hy-y));}
bg.fillStyle='#4f5b2e';bg.fillRect(0,hy,W,H-hy);
for(let y=hy;y<H;y+=4){const k=(y-hy)/(H-hy);bg.fillStyle='rgb('+[Math.round(89-10*k),Math.round(100-9*k),Math.round(64-4*k)].join(',')+')';bg.fillRect(0,y,W,Math.min(4,H-y));}
}
// Expand the world viewport horizontally, not the camera zoom or road geometry.
// Keep the original 864×432 composition on normal desktop and mobile displays.
function resizeDriveViewport(){
 const width=cv.clientWidth,height=cv.clientHeight;
 const mobile=matchMedia('(any-pointer:coarse), (hover:none), (max-width:820px)').matches;
 // Keep the complete reference road width on mobile. CSS clips only the sky above it.
 const next=width>0&&height>0?Math.max(mobile?BASE_W:320,Math.round(width/height*H/2)*2):BASE_W;
 // Preserve logical world width and collision geometry; constrain only backing raster on dense displays.
 const cfg=window.CrimeRushDriveConfig?.rendering;
 const scale=cfg&&devicePixelRatio>=cfg.retinaDprThreshold?Math.max(cfg.minRasterScale,Math.min(1,Math.sqrt(cfg.retinaPixelBudget/(next*H)))):1;
 const rw=Math.max(1,Math.round(next*scale)),rh=Math.max(1,Math.round(H*scale));
 if(W!==next||cv.width!==rw||cv.height!==rh||driveBackdrop.width!==rw||driveBackdrop.height!==rh){
  W=next;cv.width=rw;cv.height=rh;c.setTransform(rw/W,0,0,rh/H,0,0);c.imageSmoothingEnabled=false;rebuildDriveBackdrop();
 }

}
resizeDriveViewport();
window.addEventListener('resize',resizeDriveViewport);
window.addEventListener('previewfullscreenchange',resizeDriveViewport);
if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(resizeDriveViewport);observer.observe(cv);if(cv.parentElement?.classList.contains('drive-viewport'))observer.observe(cv.parentElement);}
const driveRoadDepths=[0];for(let z=30;z<depth;z+=30)driveRoadDepths.push(z);for(let z=depth;z<FOG_DEPTH;z+=120)driveRoadDepths.push(z);driveRoadDepths.push(FOG_DEPTH);
const driveAsphaltColors=['#4d5358','#53595e','#666d72','#747b7e','#5d6469'];
function landscape(queue){
 window.CrimeRushFuelPickups?.prepareAccess(distance-2000,distance+FOG_DEPTH+2000);
 c.setTransform(cv.width/W,0,0,cv.height/H,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';const currentSky=CrimeRushAtmosphere.get();if(currentSky?.dynamic)CrimeRushSky.draw(c,W,H,hy,currentSky);else c.drawImage(driveBackdrop,0,0,W,H);
 const skyAtmosphere=CrimeRushAtmosphere.get();if(skyAtmosphere)CrimeRushSky.animate(c,W,H,hy,skyAtmosphere,t);
 CrimeRushEnvironment.ground(c,W,H,hy,project,driveRoadDepths,skyAtmosphere,distance);
 if(routeGeometryActive()||sceneryControls.fields.checked)DriveScenery.ground(c,project,distance,depth,W,queue);
 if(routeGeometryActive()||sceneryControls.soil.checked)RoadsideSoil.draw(c,project,distance,depth,W);
 CrimeRushEnvironment.garageDirt(c,project,distance,depth,W,skyAtmosphere);
 CrimeRushEnvironment.townLots(c,project,distance,depth,W,skyAtmosphere);
 CrimeRushEnvironment.townSidewalk(c,project,distance,depth,W,skyAtmosphere);
 // Side streets beneath the main carriageway, including its grain and wet surface.
 DriveCrossroads.draw(c,project,distance,depth,W);
 const zs=driveRoadDepths,points=zs.map(project),variable=routeGeometryActive()||!!window.CrimeRushRoadLab&&CrimeRushEnvironment.get()==='motorway';if(!variable)CrimeRushEnvironment.motorwayShoulder?.(c,project,zs,skyAtmosphere);const roadColor=CrimeRushAtmosphere.get()?.road||'#5a6065';
 // Close the finite projection at its vanishing point for new environments only.
 const far=points[points.length-1];if(!variable&&CrimeRushEnvironment.active())poly(roadColor,[far.center-far.half,far.y],[roadHorizonX(),hy],[far.center+far.half,far.y]);
 if(variable)CrimeRushMotorwayPreview.surface(c,project,zs,distance,roadColor);else{poly(roadColor,...points.map(p=>[p.center-p.half,p.y]),...points.slice().reverse().map(p=>[p.center+p.half,p.y]));CrimeRushMotorwayPreview.serviceSurface(c,project,zs,distance,roadColor);}
 // Stable world-space grain: the road and grass move toward the camera.
 const first=Math.floor(distance/14),last=Math.ceil((distance+depth)/14);
 if(routeGeometryActive()||sceneryControls.grass.checked)for(let i=last;i>=first;i--){const z=i*14-distance;if(z<0||z>depth||CrimeRushEnvironment.layerAt('grass',distance+z,true)===false||DriveCrossroads.blocked(distance+z,25))continue;const p=project(z),q=p.q;if(q<.035)continue;
  for(const side of [-1,1])for(let j=0;j<5;j++){if(window.CrimeRushFuelPickups?.accessAt(distance+z,side))continue;const n=i*71+j*13+side*37,offset=(1.25+hash(n)*5.4)*p.half,xx=p.center+side*offset;if(xx<0||xx>W)continue;rect(hash(n+3)>.5?'#768246':'#3f4725',xx,p.y,Math.max(1,Math.round((3+hash(n+2)*6)*q)),Math.max(1,Math.round(2*q)))}
 }
 // Pixel aggregate: fixed world-space samples, perspective-scaled and faded at distance.
 const atmosphere=CrimeRushAtmosphere.get(),asphaltColors=atmosphere?driveAsphaltColors.map(v=>CrimeRushAtmosphere.mix(v,atmosphere.road,.65)):driveAsphaltColors;
 const mobileMotorway=variable&&CrimeRushEnvironment.get()==='motorway'&&matchMedia('(any-pointer:coarse), (hover:none)').matches;const detail=window.CrimeRushPerformance?.detail?.()??1;const grainStep=10,grainFirst=Math.floor(distance/grainStep),grainLast=Math.ceil((distance+Math.min(depth,155*(1/.075-1)))/grainStep);
 c.save();
 for(let i=grainLast;i>=grainFirst;i--){
  for(let j=0;j<Math.max(3,Math.round((mobileMotorway?6:12)*detail));j++){
   const n=i*131+j*19,z=i*grainStep+hash(n+2)*grainStep-distance;
   if(z<0||z>depth)continue;
   const p=project(z),q=p.q;if(q<.075)continue;
   const g=variable?routeRoadGeometry(distance+z):null,lane=g?(hash(n)<.5?-1:1)*(g.inner+hash(n+7)*(g.outer-g.inner)):hash(n)*1.92-.96,rx=p.center+p.half*lane;
   if(rx<-8||rx>W+8)continue;
   c.globalAlpha=.82*clamp((q-.075)/.18,0,1);
   const w=Math.max(1,Math.round((2+hash(n+3)*4)*q)),h=Math.max(1,Math.round((1+hash(n+4)*2)*q));
   rect(asphaltColors[Math.floor(hash(n+1)*asphaltColors.length)],rx,p.y,w,h);
  }
 }
 c.restore();
 if(routeGeometryActive()||sceneryControls.grass.checked)DriveScenery.verge(c,project,distance,depth,W,queue,CrimeRushEnvironment.get()==='forest');
 if(variable)CrimeRushMotorwayPreview.wear(c,project,distance,depth,W);if(!variable||routeGeometryActive()&&CrimeRushEnvironment.get()!=='motorway')RoadWear.draw(c,project,distance,depth,W);
 if(atmosphere)CrimeRushAtmosphereDraw.wetRoad(c,project,atmosphere,depth,distance);
 // Junction markings remain above both road surfaces.
 const junctions=DriveCrossroads.visible(distance,FOG_DEPTH);
 function ordinaryLine(a,b,l,r,color,seed,dashed=false){
  let start=a;for(const j of junctions){const u=j.a-DriveCrossroads.markingMargin,v=j.b+DriveCrossroads.markingMargin;if(v<=start||u>=b)continue;if(u>start)wornRoadLine(start,Math.min(u,b),l,r,color,seed,dashed);start=Math.max(start,v);if(start>=b)return;}
  if(start<b)wornRoadLine(start,b,l,r,color,seed,dashed);
 }
 // Road markings are visible only in two-way traffic mode.
 if(variable)CrimeRushMotorwayPreview.markings(c,project,zs,distance);else if(trafficMode.value==='two'||CrimeRushEnvironment.get()==='motorway'){
  // White edge lines, dashed lane separators and a double solid centre line.
  for(const side of [-1,1])for(let i=1;i<zs.length;i++)ordinaryLine(zs[i-1],zs[i],side*.951,side*.999,'#deded6',side<0?11:17);
  if(trafficMode.value==='two')for(const lane of [-.018,.018])for(let i=1;i<zs.length;i++)ordinaryLine(zs[i-1],zs[i],lane-.011,lane+.011,'#cfc9ae',lane<0?23:29);
  const period=380,dash=72;for(let i=Math.floor(distance/period);i<=Math.ceil((distance+FOG_DEPTH)/period);i++){const a=Math.max(0,i*period-distance),b=Math.min(FOG_DEPTH,i*period+dash-distance);if(b>a)for(const lane of LANE_SEPARATORS)ordinaryLine(a,b,lane-.014,lane+.014,'#deded6',lane<0?37:43,true)}
 }
 DriveCrossroads.markings(distance,depth,wornRoadLine);
 CrimeRushEnvironment.busStopMarkings(distance,depth,wornRoadLine);
 RoadsideObjects.drawGround(c,project,distance,depth,W,sceneryControls,DriveScenery.fieldPlot,queue);
 // Atmospheric veil conceals the distant end of the road and blends it into the horizon.
 // Dense white morning mist merges sky and distant ground, with clear foreground.
 if(!atmosphere){const fogTop=hy-18,fogBottom=project(460).y;
 const fog=c.createLinearGradient(0,fogTop,0,fogBottom);
 fog.addColorStop(0,'rgba(250,251,251,0)');
 fog.addColorStop(18/(fogBottom-fogTop),'rgba(250,251,251,.86)');
 fog.addColorStop(.38,'rgba(250,251,251,.64)');
 fog.addColorStop(.64,'rgba(250,251,251,.32)');
 fog.addColorStop(.84,'rgba(250,251,251,.09)');
 fog.addColorStop(1,'rgba(250,251,251,0)');
 c.fillStyle=fog;c.fillRect(0,fogTop,W,fogBottom-fogTop);}else{if(atmosphere.ambient<1){c.save();c.globalCompositeOperation='multiply';c.globalAlpha=1-atmosphere.ambient;c.fillStyle=atmosphere.time==='night'?'#52668f':'#b6b2af';c.fillRect(0,hy,W,H-hy);c.restore();}CrimeRushFog.ground(c,W,H,hy,project,atmosphere);}
 // Roadside silhouettes receive one ground-matched depth tint after the veil.
 RoadsideObjects.drawHorses(c,project,distance,depth,W,sceneryControls,queue);
 if(routeGeometryActive()||sceneryControls.farm.checked)DriveScenery.farm(c,project,distance,depth,W,queue);
 RoadsideObjects.drawPower(c,project,distance,CrimeRushEnvironment.visualDepth('power',depth),W,sceneryControls,queue);
 CrimeRushEnvironment.queueObjects(c,project,distance,depth,W,queue,atmosphere);
}
