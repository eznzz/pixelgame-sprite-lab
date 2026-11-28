// Prepare expensive per-source caches before first simulation frame.
window.CrimeRushCacheWarmup=(()=>{
 const prepared=new WeakSet(),fogPrepared=new WeakSet();let last={assets:0,fogAssets:0,ms:0};
 const yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,0));
 async function prepare(images,keys=Object.keys(images),onProgress=()=>{}){
  const list=new Map();for(const key of keys){if(!/^(traffic:|drive:|rear(?:-|$))/.test(key))continue;const image=images[key];if(!image?.naturalWidth)continue;const npc=key.startsWith('traffic:')||key.startsWith('drive:');list.set(image,(list.get(image)||false)||npc);}
  const start=performance.now();let done=0,assets=0,fogAssets=0;
  for(const [image,npc] of list){if(!prepared.has(image)){try{await image.decode?.();}catch(e){}try{DriveMotion.prepare(image);prepareVehicleShadow(image);prepareCollisionBounds(image);SpriteLibrary.prepareSilhouette(image);if(window.CrimeRushDrivingLab)window.CrimeRushVehiclePose?.prepare(image);prepared.add(image);assets++;}catch(e){console.warn('Cache warmup:',e);}}
   // Fog cache is small (max 256px longest edge). Warm discrete levels on dense desktop only.
   if(npc&&devicePixelRatio>=1.5&&matchMedia('(hover:hover) and (pointer:fine)').matches&&!fogPrepared.has(image)){try{for(let level=0;level<=14;level++){RoadsideObjects.prepareFoggedVehicle(image,level/16);if(level%4===3)await yieldFrame();}fogPrepared.add(image);fogAssets++;}catch(e){console.warn('Fog warmup:',e);}}
   onProgress(++done,list.size);await yieldFrame();
  }
  last={assets,fogAssets,ms:Math.round(performance.now()-start)};return last;
 }
 return {prepare,report:()=>({...last})};
})();
