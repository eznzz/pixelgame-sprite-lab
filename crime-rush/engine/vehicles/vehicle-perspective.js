// Vehicle perspective in deprojected road coordinates. One calibrated road half-width
// in depth units; this is a pseudo-3D camera calibration, not a measured vehicle model.
(function(root){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rad=180/Math.PI,roadUnit=155/1.6;
 function angles(project,physical,z,lane,cameraX){
  const near=Math.max(0,z-16),far=Math.max(near+1,z+32),p=project(Math.max(0,z)),a=project(near),b=project(far);
  const worldX=(q,d)=>(q.center-cameraX)/q.half+physical(d,lane);
  const u=worldX(p,Math.max(0,z)),bearing=-Math.atan2(u*roadUnit,155+Math.max(0,z))*rad,heading=Math.atan2((worldX(b,far)-worldX(a,near))*roadUnit,far-near)*rad;
  return {bearing,heading,angle:bearing+heading};
 }
 const rear=[['rear',0],['rear-05',5],['rear-06',6],['rear-10',10],['rear-15',15],['rear-20',20],['rear-30',30],['rear-40',40]],front=[['front',0],['front-06',6],['front-15',15],['front-quarter',35]];
 function select(angle,available,{prefix='',opposite=false,max=40,warp=.65,angleFor=null}={}){
  const list=(opposite?front:rear).filter(([role,a])=>a<=max&&available(prefix+role)).map(([role,a])=>[role,angleFor?.(prefix+role,a)??a]).sort((a,b)=>a[1]-b[1]);if(!list.length)return null;
  const target=clamp(Math.abs(angle),0,list.at(-1)[1]),sign=angle<0?-1:1;
  let lower=list[0],upper=list.at(-1);for(const f of list){if(f[1]<=target)lower=f;if(f[1]>=target){upper=f;break;}}
  const mix=upper[1]===lower[1]?0:(target-lower[1])/(upper[1]-lower[1]),key=mix<=.5?lower:upper,delta=sign*(target-key[1]);
  return {name:prefix+key[0],flip:key[1]>0&&sign<0,visualAngle:Math.abs(angle),signedAngle:angle,keyAngle:key[1],shear:clamp(-Math.tan(delta/rad)*warp,-.06,.06),lower:prefix+lower[0],upper:prefix+upper[0],mix,reference:prefix+list[0][0],calibrated:true};
 }
 // Alpha silhouette, measured once per image at load time. The lower envelope is
 // a ground-contact estimate, not a manually annotated rear axle.
 function measure(data,w,h){
  let left=w,right=-1,top=h,bottom=-1;const floor=new Int32Array(w).fill(-1);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=160){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);floor[x]=y;}
  if(right<left)return {left:0,right:1,top:0,bottom:1,anchor:.5,width:1,height:1};
  const bh=bottom-top+1;let lo=w,hi=-1;for(let x=left;x<=right;x++)if(floor[x]>=bottom-bh*.24){lo=Math.min(lo,x);hi=Math.max(hi,x);}
  return {left:left/w,right:(right+1)/w,top:top/h,bottom:(bottom+1)/h,anchor:hi>=lo?(lo+hi+1)/(2*w):(left+right+1)/(2*w),width:(right-left+1)/w,height:bh/h};
 }
 function layout(frame,asset,reference,lower,upper,px,py,baseHeight){
  const a=asset.measure,r=reference.measure;const axle=asset.calibration?.axle,anchorX=axle?(axle[0]+axle[2])/2:a.anchor,anchorY=axle?(axle[1]+axle[3])/2:a.bottom;
  const visibleHeight=baseHeight*r.height,aspect=v=>v.measure.width*v.width/(v.measure.height*v.height),visibleWidth=visibleHeight*(aspect(lower)+(aspect(upper)-aspect(lower))*frame.mix);
  const w=visibleWidth/Math.max(.001,a.width),h=visibleHeight/Math.max(.001,a.height);
  return {x:px-anchorX*w,y:py-anchorY*h,w,h,visibleWidth,visibleHeight,anchorX,anchorY,footprint:visibleHeight*aspect(reference),axle,calibration:asset.calibration??null};
 }
 function point(frame,rect,px,py,u,v){const x=rect.x+u*rect.w,y=rect.y+v*rect.h;return {x:(frame.flip?2*px-x:x)+(frame.shear||0)*(y-py),y};}
 const api={angles,select,measure,layout,point,roadUnit};if(typeof module!=='undefined')module.exports=api;else root.CrimeRushVehiclePerspective=api;
})(typeof window!=='undefined'?window:globalThis);
