import {clamp,cardinal} from './rules.js';
import {$,escapeHtml} from './ui.js';

export class SharedMap {
  constructor({canvas,viewport,maps,characters,onMove,onInteract}){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.viewport=viewport;this.maps=maps;this.characters=characters;this.onMove=onMove;this.onInteract=onInteract;
    this.map=null;this.image=new Image();this.players=[];this.entities=[];this.localId='local-player';this.position={x:24,y:16};this.facing=0;this.zoom=1;this.showGrid=true;this.labels=true;this.fog=false;this.animFrame=0;
    this.tokenImages=new Map();this.image.onload=()=>{$('#mapLoading').hidden=true;this.draw()};
  }
  selectMap(id){this.map=this.maps.find(m=>m.id===id)||this.maps[0];this.canvas.width=this.map.grid?.sourcePixelWidth||1536;this.canvas.height=this.map.grid?.sourcePixelHeight||1024;this.image.src=this.map.image||this.map.art||`assets/images/maps/${this.map.id}.png`;$('#mapLoading').hidden=false;return this.map}
  setFloor(floor){this.floor=floor;this.draw()}
  setState({players=[],positions={},entities=[],localId='local-player',facing=0}){this.players=players;this.entities=entities;this.localId=localId;this.facing=facing;this.position=positions[localId]||this.position;this.positions=positions;this.draw();this.renderLists()}
  setZoom(zoom){this.zoom=clamp(zoom,.5,2);this.canvas.style.transform=`scale(${this.zoom})`;this.canvas.style.marginRight=`${this.canvas.width*(this.zoom-1)}px`;this.canvas.style.marginBottom=`${this.canvas.height*(this.zoom-1)}px`;$('#zoomLabel').textContent=`${Math.round(this.zoom*100)}%`}
  grid(){return this.map?.grid||{columns:48,rows:32,pixelsPerCell:32,cellSizeFeet:5}}
  move(kind,{sprint=false}={}){
    const g=this.grid(),dir=((Math.round(this.facing/90)%4)+4)%4;let dx=0,dy=0;
    const forward=[[0,-1],[1,0],[0,1],[-1,0]][dir],right=[[1,0],[0,1],[-1,0],[0,-1]][dir];
    if(kind==='forward'){[dx,dy]=forward}else if(kind==='back'){dx=-forward[0];dy=-forward[1]}else if(kind==='left'){dx=-right[0];dy=-right[1]}else if(kind==='right'){[dx,dy]=right}
    const steps=sprint?2:1,nx=clamp(this.position.x+dx*steps,0,g.columns-1),ny=clamp(this.position.y+dy*steps,0,g.rows-1);
    if(nx===this.position.x&&ny===this.position.y)return;
    this.position={x:nx,y:ny};this.onMove?.({x:nx,y:ny,facing:this.facing,distanceFeet:(Math.abs(dx)+Math.abs(dy))*steps*g.cellSizeFeet,kind,action:kind==='forward'?'moveForward':kind==='back'?'moveBackward':kind==='left'?'strafeLeft':'strafeRight',location:this.currentLocation()});
  }
  turn(delta){this.facing=(this.facing+delta+360)%360;this.onMove?.({x:this.position.x,y:this.position.y,facing:this.facing,distanceFeet:0,kind:delta<0?'turnLeft':'turnRight',action:delta<0?'turnLeft':'turnRight',location:this.currentLocation()});this.draw()}
  nearestZone(position=this.position){const zones=(this.map?.zones||[]).filter(z=>!z.floor||z.floor===this.floor);if(!zones.length)return null;return zones.map(z=>({z,d:Math.hypot(Number(z.position?.[0]||0)-Number(position.x||0),Number(z.position?.[1]||0)-Number(position.y||0))})).sort((a,b)=>a.d-b.d)[0]?.z||null}
  currentLocation(){return this.nearestZone()?.name||this.map?.zones?.[0]?.name||''}
  center(){const g=this.grid(),px=(this.position.x+.5)*g.pixelsPerCell*this.zoom,py=(this.position.y+.5)*g.pixelsPerCell*this.zoom;this.viewport.scrollTo({left:px-this.viewport.clientWidth/2,top:py-this.viewport.clientHeight/2,behavior:'smooth'})}
  draw(){
    cancelAnimationFrame(this.animFrame);this.animFrame=requestAnimationFrame(()=>{
      const c=this.ctx,g=this.grid();c.clearRect(0,0,this.canvas.width,this.canvas.height);
      if(this.image.complete&&this.image.naturalWidth)c.drawImage(this.image,0,0,this.canvas.width,this.canvas.height);else{c.fillStyle='#13272b';c.fillRect(0,0,this.canvas.width,this.canvas.height)}
      if(this.showGrid){c.save();c.strokeStyle='rgba(180,255,255,.28)';c.lineWidth=1;for(let x=0;x<=g.columns;x++){c.beginPath();c.moveTo(x*g.pixelsPerCell,0);c.lineTo(x*g.pixelsPerCell,this.canvas.height);c.stroke()}for(let y=0;y<=g.rows;y++){c.beginPath();c.moveTo(0,y*g.pixelsPerCell);c.lineTo(this.canvas.width,y*g.pixelsPerCell);c.stroke()}if(this.labels){c.font='10px sans-serif';c.fillStyle='rgba(255,255,255,.72)';for(let x=0;x<g.columns;x+=4)c.fillText(String.fromCharCode(65+(x%26))+Math.floor(x/26||''),x*g.pixelsPerCell+3,11);for(let y=0;y<g.rows;y+=4)c.fillText(String(y+1),3,y*g.pixelsPerCell+12)}c.restore()}
      this.drawZones(g);for(const entity of this.entities.filter(e=>!e.floor||e.floor===this.floor))this.drawEntity(entity,g);
      for(const p of this.players){const pos=(this.positions||{})[p.playerId];if(pos&&(!pos.floor||pos.floor===this.floor))this.drawToken(p,pos,g,p.playerId===this.localId)}
      if(this.fog){c.fillStyle='rgba(0,0,0,.22)';c.fillRect(0,0,this.canvas.width,this.canvas.height);const px=(this.position.x+.5)*g.pixelsPerCell,py=(this.position.y+.5)*g.pixelsPerCell;const grad=c.createRadialGradient(px,py,g.pixelsPerCell*2,px,py,g.pixelsPerCell*8);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,'rgba(0,0,0,.96)');c.fillStyle=grad;c.fillRect(0,0,this.canvas.width,this.canvas.height)}
    })
  }
  drawZones(g){const c=this.ctx,zones=(this.map?.zones||[]).filter(z=>!z.floor||z.floor===this.floor);c.save();for(const z of zones){const x=(Number(z.position?.[0]||0)+.5)*g.pixelsPerCell,y=(Number(z.position?.[1]||0)+.5)*g.pixelsPerCell;c.beginPath();c.arc(x,y,Math.max(7,g.pixelsPerCell*.18),0,Math.PI*2);c.fillStyle='rgba(0,255,255,.75)';c.fill();c.font=`bold ${Math.max(11,g.pixelsPerCell*.34)}px sans-serif`;c.textAlign='center';c.textBaseline='bottom';c.lineWidth=4;c.strokeStyle='rgba(0,0,0,.85)';c.strokeText(z.name,x,y-10);c.fillStyle='#f4ffff';c.fillText(z.name,x,y-10)}c.restore()}
  drawToken(player,pos,g,local){const c=this.ctx,x=(pos.x+.5)*g.pixelsPerCell,y=(pos.y+.5)*g.pixelsPerCell,r=Math.max(12,g.pixelsPerCell*.40),character=this.characters.find(ch=>ch.id===player.characterId),src=character?.token||character?.portrait;let img=this.tokenImages.get(src);if(src&&!img){img=new Image();img.onload=()=>this.draw();img.src=src;this.tokenImages.set(src,img)}c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();if(img?.complete&&img.naturalWidth)c.drawImage(img,x-r,y-r,r*2,r*2);else{c.fillStyle=local?'#00ffff':'#f1c76b';c.fillRect(x-r,y-r,r*2,r*2);c.fillStyle='#001013';c.font=`bold ${Math.max(10,r*.72)}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText((player.name||'?').slice(0,1).toUpperCase(),x,y)}c.restore();c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.lineWidth=local?4:3;c.strokeStyle=local?'#00ffff':'#f1c76b';c.stroke();if(local){c.translate(x,y);c.rotate((this.facing*Math.PI)/180);c.beginPath();c.moveTo(0,-r-9);c.lineTo(-6,-r+1);c.lineTo(6,-r+1);c.closePath();c.fillStyle='#fff';c.fill()}c.restore()}
  drawEntity(e,g){const c=this.ctx,x=(e.x+.5)*g.pixelsPerCell,y=(e.y+.5)*g.pixelsPerCell;c.save();c.font=`${Math.max(16,g.pixelsPerCell*.55)}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText({evidence:'✦',trap:'⚠',monster:'☠',treasure:'◆',door:'▥',body:'☠'}[e.type]||'•',x,y);c.restore()}
  renderLists(){
    $('#positionReadout').textContent=`${this.position.x+1}, ${this.position.y+1} · ${this.currentLocation()||'Unknown room'}`;$('#facingReadout').textContent=cardinal(this.facing);$('#visiblePlayerCount').textContent=this.players.length;
    $('#mapPartyList').innerHTML=this.players.map(p=>{const char=this.characters.find(c=>c.id===p.characterId);const pos=(this.positions||{})[p.playerId]||{};return `<div class="party-member"><img src="${escapeHtml(char?.portrait||'')}" alt=""><span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(char?.name||'Adventurer')} · ${Number(pos.x)+1||'?'}, ${Number(pos.y)+1||'?'}</small></span><i class="status-dot"></i></div>`}).join('');
    const near=this.entities.filter(e=>Math.abs(e.x-this.position.x)+Math.abs(e.y-this.position.y)<=3);$('#nearbyList').innerHTML=near.map(e=>`<button class="list-item" data-near-id="${escapeHtml(e.id)}"><strong>${escapeHtml(e.name||e.type)}</strong><small>${Math.abs(e.x-this.position.x)+Math.abs(e.y-this.position.y)} squares away</small></button>`).join('')||'<p class="muted">Nothing obvious nearby.</p>';
    $('#nearbyList').querySelectorAll('[data-near-id]').forEach(b=>b.addEventListener('click',()=>this.onInteract?.(b.dataset.nearId)));
  }
}
