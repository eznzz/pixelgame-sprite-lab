Promise.resolve().then(()=>{SpriteLibrary.driveSetup(ASSETS,I,window.CrimeRushMissionBridge?.car());return SpriteLibrary.loadAssets(ASSETS,I);}).then(async()=>{
 SpriteLibrary.driveInitialize();
 // Include rare cars in startup rather than decoding them during active driving.
 try{window.FailrunLoading?.progress('ЗАГРУЗКА ТРАФИКА');await SpriteLibrary.loadRareTraffic(I,'auto');}catch(e){console.warn(e.message);}
 await CrimeRushCacheWarmup.prepare(I,Object.keys(I),(done,total)=>window.FailrunLoading?.progress('ПОДГОТОВКА '+done+'/'+total));
 try{window.FailrunLoading?.progress('ПОДГОТОВКА МУЗЫКИ');await window.PreviewAudio?.prepareRadioTracks();}catch(e){console.warn('Radio warmup:',e);}
 if(!window.CrimeRushRoadLab)await CrimeRushAtmosphereSession.configure(window.CrimeRushMissionBridge?.atmosphere());
 window.CrimeRushMissionBridge?.prepare();await CrimeRushEnvironment.prepareAssets((done,total)=>window.FailrunLoading?.progress('ОКРУЖЕНИЕ '+done+'/'+total));oncoming.reset();passing.reset();sceneStatus.hidden=true;updateFriendStatus();if(!window.CrimeRushRoadLab){window.PreviewAudio?.setRaceMusic('normal');window.CrimeRushRadio?.ready();}window.CrimeRushMissionBridge?.ready();requestAnimationFrame(frame);
 document.getElementById('driveCarChoice').addEventListener('change',()=>{const poll=()=>{if(document.getElementById('driveCarChoice').disabled){requestAnimationFrame(poll);return;}updateFriendStatus();};poll();});
}).catch(e=>sceneError('Ошибка загрузки сцены: '+e.message));
