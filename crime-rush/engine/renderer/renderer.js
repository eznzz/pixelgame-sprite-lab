let lastDriveError='';function reportDriveError(e){if(!CRIME_RUSH_GAME)window.FailrunLoading?.fail('Ошибка отрисовки сцены: '+String(e));const msg=String(e);if(msg!==lastDriveError){lastDriveError=msg;console.error('Drive scene:',e);}}
function racing(dt=0){
 const layers=[];const queue=(z,draw,priority=0)=>{if(Number.isFinite(z))layers.push({z,draw,priority});};
 const lab=!!window.CrimeRushRoadLab,session=!!window.CrimeRushAtmosphereSession?.enabled();if(lab||session){const p=CrimeRushAtmosphere.tick(lab||!paused?dt:0);if(p)CrimeRushRainAmbience.update(window.PreviewAudio,p.dynamic?p.precipitation:({clear:0,rain:.4,storm:1}[p.rain]||0));else CrimeRushRainAmbience.stop();}
 const landStart=performance.now();c.save();try{landscape(queue);}catch(e){reportDriveError(e);}finally{c.restore();window.CrimeRushPerformance?.landscape(performance.now()-landStart);}
 try{if(!window.CrimeRushRoadLab||window.CrimeRushRoadLab.eventsPreview()){RoadObstacles.draw(c,project,distance,I,queue,trafficMode.value==='two');DriveMedkits.draw(c,project,distance,queue);DriveRepairKits.draw(c,project,distance,queue);window.CrimeRushFuelPickups?.draw(c,project,distance,queue);}}catch(e){reportDriveError(e);}
 const ref=SpriteLibrary.driveReferenceHeight(I);
 const twoWay=trafficMode.value==='two';
 const pp=playerTrafficPosition();
 const motorwayLab=lab&&CrimeRushEnvironment.get()==='motorway';const traffic=lab&&!window.CrimeRushRoadLab.trafficEnabled()?[]:motorwayLab?CrimeRushMotorwayTraffic.preview(distance,t,depth).filter(v=>twoWay||!v.opposite):passing.visible(twoWay,pp.z,pp.lane,pp.halfWidth).concat(twoWay?oncoming.cars:[]);
 function drawTraffic(v){
 const {lane,z,opposite,model}=v;const renderLane=lane+(v.offset||0);
  const p=opposite||motorwayLab?project(z):passingProjection(z,renderLane),xx=opposite||motorwayLab?p.center+p.half*(motorwayLab?renderLane:(typeof physicalLane==='function'?physicalLane(z,renderLane):renderLane)):p.x,nh=TRAFFIC_CAR_SCALE*p.q*ref;
  const opacity=(v.opacity??1)*(opposite||motorwayLab?clamp((1800-z)/500,0,1):clamp((1460-z)/310,0,1));if(opacity<=0||nh<1)return;
  c.save();c.globalAlpha=opacity;
  const experimental=window.CrimeRushDrivingLab?.active(),pose=experimental?CrimeRushVehiclePose.trafficFrame(v,z,renderLane,motorwayLab,window.CrimeRushDrivingLab.settings()):null;
  const frame=pose||(opposite?DriveTraffic.frameFor(model,DriveTraffic.perspective(project,z,renderLane),trafficAvailable,true):DriveTraffic.sameDirectionFrame(model,motorwayLab?CrimeRushRoadLayout.relativeLane(distance+z,renderLane):renderLane,trafficAvailable));
  if(frame){const npcSpeed=(experimental?(v.cruiseSpeed??85):85)*Math.max(80,Math.min(150,Number(trafficSpeedControl.value)))/100;drawDriveCar(frame,xx,p.y,nh,3+lane*2,false,z,0,npcSpeed,t*npcSpeed*3+lane*31);}c.restore();
 }
 for(const v of traffic)queue(v.z,()=>drawTraffic(v),3);
 const groundY=PLAYER_GROUND_Y,pos=lab?motorwayPreviewPlayerX(W/2+x*450,pp.z,pp.halfWidth):pp.px,playerProjection=project(pp.z),renderPlayerLane=(pos-playerProjection.center)/playerProjection.half;const atmosphere=CrimeRushAtmosphere.get();
 const player=displayedPlayerFrame(pos,groundY),baseHeight=PLAYER_CAR_SCALE*((groundY-hy)/(H-hy))*ref,height=player.calibrated?CrimeRushVehiclePose.playerBase(baseHeight):SpriteLibrary.drivePlayerHeight(I,player.name,baseHeight,player.visualAngle),asset=I[player.name],poseLayout=player.calibrated?CrimeRushVehiclePose.layout(player,pos,groundY,height):null;
 if(!paused&&asset?.naturalWidth)DriveSparks.update(dt,driveVelocity,pos,groundY,height,(poseLayout?.visibleWidth??asset.width/asset.height*height),player.flip,Number(player.name.split('-')[1])||0);
 if(!paused)DriveWind.update(dt,CrimeRushSpeed.toDisplaySpeed(driveVelocity),pos,groundY,asset?.naturalWidth?(poseLayout?.visibleWidth??asset.width/asset.height*height):0,height,document.getElementById("windFx").checked,DriveRain.isStorm()?3:DriveRain.current()==='clear'?.5:1);
 DriveWetFX.update(lab&&atmosphere?.dynamic?dt:paused?0:dt,DriveRain.current(),CrimeRushSpeed.toDisplaySpeed(driveVelocity),W,H,{asset,x:pos,y:groundY,h:height,flip:player.flip,offset:SpriteLibrary.driveGroundOffset(I,player.name,height)});
 if(atmosphere?.headlights)queue(pp.z,()=>CrimeRushAtmosphereDraw.beam(c,project,renderPlayerLane,pp.z,(player.signedAngle??player.visualAngle*(player.flip?-1:1)),atmosphere),-1);
 queue(pp.z,()=>{c.save();DriveWind.draw(c);DriveSparks.draw(c);DriveWetFX.drawSpray(c);
 c.save();if(impactTime>0)c.translate(Math.round(Math.sin(impactTime*95)*impactDirection*8*impactTime/.36),0);
 drawDriveCar(player,pos,groundY,height,0,braking&&!paused,0,SpriteLibrary.driveGroundOffset(I,player.name,height));c.restore();
 if(!paused&&asset?.naturalWidth){
  const w=asset.width*height/asset.height,bob=DriveMotion.bounce(distance,driveVelocity,height,0);
  DriveExhaust.update(dt,driveVelocity,drivePressed('ArrowUp')&&!braking&&!document.getElementById('settingsDialog').open,player,pos,Math.round(poseLayout?.x??(pos-w/2)),Math.round(poseLayout?poseLayout.y+bob:groundY-height+bob+SpriteLibrary.driveGroundOffset(I,player.name,height)),Math.round(poseLayout?.w??w),Math.round(poseLayout?.h??height),groundY);
 }
 DriveExhaust.draw(c);c.restore();},4);
 // Painter's algorithm: every upright object shares one world-depth queue.
 const paintStart=performance.now();layers.sort((a,b)=>b.z-a.z||a.priority-b.priority);
 c.save();c.imageSmoothingEnabled=false;
 for(const layer of layers){c.save();try{c.globalAlpha=1;layer.draw();}catch(e){reportDriveError(e);}finally{c.restore();}}
 c.restore();c.globalAlpha=1;window.CrimeRushPerformance?.painter(performance.now()-paintStart,layers.length);
 
 DriveRain.draw(c,lab&&atmosphere?.dynamic?dt:paused?0:dt,W,H,CrimeRushSpeed.toDisplaySpeed(driveVelocity));
 DriveWetFX.drawGlass(c,W,H);
 DriveMedkits.drawNotice(c,pos,groundY-height-9);
 if(impactTime>0){const f=impactTime/.36;c.save();c.globalAlpha=.24*f;c.fillStyle='#ff402c';c.fillRect(0,0,W,H);c.globalAlpha=.9*f;for(let i=0;i<12;i++){const a=i*Math.PI/6,rad=18+(1-f)*95;rect(i%2?'#ffdd8b':'#fff3ca',pos+Math.cos(a)*rad,groundY-height*.65+Math.sin(a)*rad,3+Math.round(4*f),3);}c.restore();}
 if(gameOver){c.save();c.fillStyle='#171620bb';c.fillRect(0,H*.38,W,H*.24);c.textAlign='center';c.font='22px BeetlePixel, monospace';c.fillStyle='#f0bc79';c.fillText(({both:'АВАРИЯ',driver:'ВОДИТЕЛЬ НЕ МОЖЕТ ПРОДОЛЖАТЬ',vehicle:'КРИТИЧЕСКАЯ НЕИСПРАВНОСТЬ'}[CrimeRushDamage.reason()]||'ПОЕЗДКА ЗАВЕРШЕНА'),W/2,H*.47);c.font='12px BeetlePixel, monospace';c.fillText((CRIME_RUSH_GAME?'Поездка завершена':'Восстановите состояние в настройках'),W/2,H*.54);c.restore();}
}
