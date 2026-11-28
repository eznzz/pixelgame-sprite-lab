// Small translucent exhaust puffs, separate from vehicle artwork.
window.DriveExhaust=(()=>{
 const anchors={rear:[681/950,686/730],'rear-10':[525/950,604/638],'rear-15':[435/950,545/576],'rear-20':[311/950,449/470]};
 const sprites=[
 ['.......','..gg...','.gllg..','gllllg.','.gllgg.','..gg...','.......'],
 ['........','...gg...','.ggllg..','glllllg.','gllllgg.','.ggllg..','..gg....','........'],
 ['.........','..gg.....','.gllgg...','glllllg..','.gllllgg.','..ggllg..','...ggg...','.........']
 ];
 const art=sprites.map(rows=>{const a=document.createElement('canvas');a.width=rows[0].length;a.height=rows.length;const c=a.getContext('2d');rows.forEach((row,y)=>[...row].forEach((p,x)=>{if(p==='.')return;c.fillStyle=p==='l'?'#e5e8e6':'#b9c1c0';c.globalAlpha=p==='l'?.8:.44;c.fillRect(x,y,1,1)}));return a});
 const particles=[];let timer=0;
 function update(dt,speed,gas,frame,px,dx,dy,dw,dh,groundY,calibration){
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;if(p.age>=p.life){particles.splice(i,1);continue}p.x+=p.vx*dt;p.y+=p.vy*dt;}
  if(speed<=0){timer=0;return;}
  const anchor=calibration?calibration.exhaust:anchors[frame.name];if(!anchor)return;
  timer-=dt;if(timer>0)return;timer=(gas?.12:.23)+Math.random()*.12;
  const source=dx+anchor[0]*dw,y=dy+anchor[1]*dh,x=(frame.flip?2*px-source:source)+(frame.shear||0)*(y-(groundY??dy+dh));
  const dir=frame.name==='rear'?0:frame.flip?1:-1;
  particles.push({x,y:y+1,vx:dir*9+(Math.random()-.5)*7,vy:13+speed*.11,age:0,life:.38+Math.random()*.28,size:Math.max(2,dh*.035),sprite:Math.floor(Math.random()*art.length),alpha:gas?.46:.29});
 }
 function draw(c){c.save();c.imageSmoothingEnabled=false;for(const p of particles){const f=p.age/p.life,d=p.size*(1+f*2.1);c.globalAlpha=p.alpha*(1-f);c.drawImage(art[p.sprite],Math.round(p.x-d/2),Math.round(p.y-d/2),Math.max(1,Math.round(d)),Math.max(1,Math.round(d)));}c.restore();}
 return {update,draw};
})();
