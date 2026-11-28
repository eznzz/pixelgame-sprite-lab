// Sparse pixel droplets on the camera and small wheel spray. Visual effects only.
window.DriveWetFX=(()=>{
 const glass=[],spray=[],footprints=new WeakMap();let glassBudget=0,sprayBudget=0;
 const random=(a,b)=>a+Math.random()*(b-a);
 function reset(){glass.length=0;spray.length=0;glassBudget=0;sprayBudget=0;}
 function contacts(asset){
  if(footprints.has(asset))return footprints.get(asset);
  let result=[.22,.78];
  try{
   const w=asset.naturalWidth,h=asset.naturalHeight,cv=document.createElement('canvas');cv.width=w;cv.height=h;
   const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(asset,0,0);
   const d=ctx.getImageData(0,0,w,h).data;
   let bottom=-1;for(let y=h-1;y>=0&&bottom<0;y--)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>180){bottom=y;break;}
   const groups=[];let start=-1;
   for(let x=0;x<=w;x++){
    let hit=false;if(x<w)for(let y=bottom;y>=Math.max(0,bottom-Math.ceil(h*.045));y--){const i=(y*w+x)*4;if(d[i+3]>180&&(d[i]+d[i+1]+d[i+2])/3<100){hit=true;break;}}
    if(hit&&start<0)start=x;if(!hit&&start>=0){if(x-start>=w*.02)groups.push({x:(start+x-1)/2/w,size:x-start});start=-1;}
   }
   if(groups.length>=2)result=[groups[0].x,groups[groups.length-1].x];else if(groups.length===1){const g=groups[0].x;result=g<.5?[g,.78]:[.22,g];}
  }catch(e){/* fallback to approximate rear wheel positions */}
  footprints.set(asset,result);return result;
 }
 function update(dt,weather,kmh,W,H,player){
  const p=window.CrimeRushAtmosphere?.get(),strength=p?.dynamic?p.precipitation:null;if(weather==='clear'&&strength===null){reset();return;}
  const storm=weather==='storm',heavy=storm&&!!p;if(dt<=0)return;
  for(let i=glass.length-1;i>=0;i--){const p=glass[i];p.age+=dt;p.y+=dt*p.slide;if(p.age>=p.life||p.y>1.04)glass.splice(i,1);}
  glassBudget+=dt*(strength===null?(heavy?8:storm?4:2.2):8*strength);
  while(glassBudget>=1){glassBudget--;if(glass.length<(strength===null?(heavy?24:storm?12:7):24))glass.push({x:random(.025,.975),y:random(.025,.88),r:Math.random()<.7?2:3,age:0,life:random(2.4,4.5),slide:random(.003,.012)});}
  for(let i=spray.length-1;i>=0;i--){const p=spray[i];p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=42*dt;if(p.age>=p.life)spray.splice(i,1);}
  if(kmh<5||!player?.asset?.naturalWidth){sprayBudget=0;return;}
  const {asset,x,y,h,flip,offset,pose,frame}=player,w=asset.naturalWidth/asset.naturalHeight*h;const axle=pose?.axle;const wheels=()=>axle?[CrimeRushVehiclePerspective.point(frame,pose,x,y,axle[0],axle[1]),CrimeRushVehiclePerspective.point(frame,pose,x,y,axle[2],axle[3])]:contacts(asset).map(u=>({x:x+((flip?1-u:u)-.5)*w,y:y+offset}));
  sprayBudget+=dt*(strength===null?(heavy?30:storm?22:13):30*Math.max(strength,p.wet*.35))*Math.min(1,kmh/65);
  while(sprayBudget>=1){sprayBudget--;if(spray.length>=(strength!==null||heavy?44:32))continue;for(const contact of wheels()){
   const wheel=contact.x,side=wheel<x?-1:1;
   spray.push({x:wheel+random(-2,2),y:contact.y+random(-2,1),vx:side*random(8,25)*(0.55+kmh/140),vy:random(-24,-7),life:random(.22,.42),age:0,size:Math.random()<.65?1:2});
  }}
 }
 function drawSpray(c){c.save();for(const p of spray){const fade=1-p.age/p.life;c.globalAlpha=.34*fade;c.fillStyle='#c6d3d5';c.fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size);c.globalAlpha=.15*fade;c.fillStyle='#edf0e9';c.fillRect(Math.round(p.x),Math.round(p.y-1),1,1);}c.restore();}
 function drawGlass(c,W,H){c.save();for(const p of glass){const f=Math.min(1,p.age/.25,(p.life-p.age)/.65),x=Math.round(p.x*W),y=Math.round(p.y*H),r=p.r;c.globalAlpha=.25*f;c.fillStyle='#172d39';c.fillRect(x-r,y-1,r*2+1,3);c.fillRect(x-r+1,y-2,r*2-1,5);c.globalAlpha=.19*f;c.fillStyle='#c5dce4';c.fillRect(x-r+1,y-2,r,1);c.fillRect(x-r,y-1,1,2);c.globalAlpha=.35*f;c.fillStyle='#e5eef1';c.fillRect(x-1,y-2,1,1);c.globalAlpha=.12*f;c.fillRect(x+1,y+2,1,2);}c.restore();}
 return {update,drawSpray,drawGlass,reset};
})();
