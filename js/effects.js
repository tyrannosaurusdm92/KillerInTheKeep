(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const state={catalog:{effects:{}},audio:{},mapDoc:null,layer:null,floor:'',activeAudio:new Set()};
const svg=(tag,attrs={})=>{const e=state.mapDoc.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));return e;};
const center=e=>e?{x:Number(e.x||0)*32+16,y:Number(e.y||0)*32+16}:{x:768,y:512};
const color=(def,index,fallback)=>((def.palette||[])[index]||fallback);
function ensureStyle(){
  if(!state.mapDoc||state.mapDoc.getElementById('kitk-effects-style'))return;
  const style=svg('style',{id:'kitk-effects-style'});style.textContent=`
  .kitk-fx{pointer-events:none;transform-box:fill-box;transform-origin:center;animation:kitkFxFade 1.7s ease-out forwards}
  .kitk-fx-line{stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 7px currentColor);animation:kitkFxDash .65s linear infinite}
  .kitk-fx-pulse{transform-box:fill-box;transform-origin:center;animation:kitkFxPulse .72s ease-in-out infinite alternate}
  .kitk-fx-spin{transform-box:fill-box;transform-origin:center;animation:kitkFxSpin 1s linear infinite}
  .kitk-fx-particle{animation:kitkFxParticle 1.2s ease-out forwards}
  .kitk-fx-blanket{animation:kitkFxBlanket .8s ease-in-out infinite alternate}
  @keyframes kitkFxFade{0%{opacity:0}12%{opacity:1}75%{opacity:.92}100%{opacity:0}}
  @keyframes kitkFxDash{to{stroke-dashoffset:-28}}
  @keyframes kitkFxPulse{from{transform:scale(.72);opacity:.4}to{transform:scale(1.18);opacity:.95}}
  @keyframes kitkFxSpin{to{transform:rotate(360deg)}}
  @keyframes kitkFxParticle{from{opacity:1;transform:translate(0,0) scale(.5)}to{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.2)}}
  @keyframes kitkFxBlanket{from{opacity:.14}to{opacity:.38}}
  `;state.mapDoc.documentElement.appendChild(style);
}
function configure(catalog,audio){state.catalog=catalog||{effects:{}};state.audio=audio||{};}
function setMap(doc,layer,floor){state.mapDoc=doc;state.layer=layer;state.floor=floor||'';ensureStyle();}
function playSound(cue,volume=.32){const src=state.audio&&state.audio[cue];if(!src)return;try{const a=new Audio(src);a.volume=Math.max(0,Math.min(1,volume));state.activeAudio.add(a);a.addEventListener('ended',()=>state.activeAudio.delete(a),{once:true});a.play().catch(()=>state.activeAudio.delete(a));}catch(_){}}
function line(g,a,b,stroke,width=5,dash='10 8'){g.appendChild(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke,'stroke-width':width,'stroke-dasharray':dash,class:'kitk-fx-line'}));}
function ring(g,p,r,stroke,fill='none',width=4,cls='kitk-fx-pulse'){g.appendChild(svg('circle',{cx:p.x,cy:p.y,r,stroke,fill,'stroke-width':width,class:cls}));}
function particles(g,p,fill,count=12,r=4){for(let i=0;i<count;i++){const ang=(Math.PI*2*i/count)+(Math.random()*.25),dist=22+Math.random()*34,c=svg('circle',{cx:p.x,cy:p.y,r:r*(.55+Math.random()),fill,class:'kitk-fx-particle'});c.style.setProperty('--dx',`${Math.cos(ang)*dist}px`);c.style.setProperty('--dy',`${Math.sin(ang)*dist}px`);g.appendChild(c);}}
function roomBox(cells,source,target){const usable=(cells||[]).filter(c=>c.floor===state.floor);if(!usable.length){const p=center(target||source);return{x:p.x-64,y:p.y-64,width:128,height:128};}const xs=usable.map(c=>Number(c.x)*32),ys=usable.map(c=>Number(c.y)*32);return{x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs)+32,height:Math.max(...ys)-Math.min(...ys)+32};}
function lightningPath(a,b){const pts=[a];const steps=7;for(let i=1;i<steps;i++){const t=i/steps;pts.push({x:a.x+(b.x-a.x)*t+(Math.random()-.5)*24,y:a.y+(b.y-a.y)*t+(Math.random()-.5)*24});}pts.push(b);return pts.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ');}
function render(def,detail){
  if(!state.mapDoc||!state.layer)return;
  const source=detail.source||null,target=detail.target||source;if((detail.floor||target?.floor||source?.floor)&&String(detail.floor||target?.floor||source?.floor)!==String(state.floor))return;
  const a=center(source),b=center(target),g=svg('g',{class:'kitk-fx kitk-fx-'+def.visual,'data-effect-id':def.id});
  const primary=color(def,0,'#7fe7ff'),secondary=color(def,1,'#ffffff'),visual=detail.visual||def.visual||'arcane-burst';
  if(['slashing-strike','whip-strike'].includes(visual)){
    const p1=svg('path',{d:`M ${b.x-25} ${b.y+22} Q ${b.x} ${b.y-18} ${b.x+28} ${b.y-28}`,fill:'none',stroke:'#f5f8ff','stroke-width':7,class:'kitk-fx-line'});g.appendChild(p1);particles(g,b,detail.hit===false?'#b9c0c8':'#9f0f1c',detail.hit===false?5:12,3.4);
  }else if(visual==='piercing-shot'){
    line(g,a,b,'#fff5c6',5,'16 10');ring(g,b,15,'#f2d69a','none',4);if(detail.hit!==false)particles(g,b,'#9f0f1c',10,3);
  }else if(['blunt-impact','impact-stun'].includes(visual)){
    ring(g,b,10,'#f7d4a1','#5b321b55',7);ring(g,b,28,'#f1b968','none',4);if(detail.hit!==false)particles(g,b,'#9f0f1c',8,3);
  }else if(visual==='bite'){
    g.appendChild(svg('path',{d:`M ${b.x-24} ${b.y-12} Q ${b.x} ${b.y+18} ${b.x+24} ${b.y-12} M ${b.x-20} ${b.y+14} Q ${b.x} ${b.y-14} ${b.x+20} ${b.y+14}`,fill:'none',stroke:'#efe5cf','stroke-width':6,class:'kitk-fx-line'}));if(detail.hit!==false)particles(g,b,'#a00e20',14,4);
  }else if(visual==='lightning'){
    g.appendChild(svg('path',{d:lightningPath(a,b),fill:'none',stroke:'#a7e9ff','stroke-width':7,'stroke-dasharray':'9 5',class:'kitk-fx-line'}));ring(g,b,22,'#e7fbff','#42b9ff44',5);
  }else if(visual==='fire-burst'){
    ring(g,b,24,'#ffbd54','#ef4d163d',7);particles(g,b,'#ff6a18',16,5);
  }else if(['acid-splash','poison-cloud','poison-aura'].includes(visual)){
    ring(g,b,24,visual==='acid-splash'?'#b9ff38':'#43e56e',visual==='acid-splash'?'#74b81655':'#1da34745',6);particles(g,b,visual==='acid-splash'?'#b9ff38':'#43e56e',14,5);
  }else if(['healing-aura','revival','aura','support-runes'].includes(visual)){
    ring(g,b,18,'#8affc1','#32d88933',5);ring(g,b,34,'#e9fff2','none',3);for(let i=0;i<4;i++){const t=svg('text',{x:b.x-6+Math.cos(i*Math.PI/2)*30,y:b.y+6+Math.sin(i*Math.PI/2)*30,fill:'#eafff1','font-size':18,'font-weight':900});t.textContent='✦';g.appendChild(t);}
  }else if(['radiant-burst','shield-flare','stone-shell'].includes(visual)){
    ring(g,b,22,'#fff2a1','#f4c54242',6);for(let i=0;i<8;i++){const ang=Math.PI*2*i/8;line(g,{x:b.x+Math.cos(ang)*28,y:b.y+Math.sin(ang)*28},{x:b.x+Math.cos(ang)*49,y:b.y+Math.sin(ang)*49},'#fff0a3',3,'5 5');}
  }else if(['necrotic-tendrils','curse-runes'].includes(visual)){
    ring(g,b,25,'#9f6cff','#160b2c88',5);for(let i=0;i<6;i++){const ang=Math.PI*2*i/6;g.appendChild(svg('path',{d:`M ${b.x} ${b.y} Q ${b.x+Math.cos(ang+.5)*28} ${b.y+Math.sin(ang+.5)*28} ${b.x+Math.cos(ang)*48} ${b.y+Math.sin(ang)*48}`,fill:'none',stroke:'#8f59d6','stroke-width':4,class:'kitk-fx-line'}));}
  }else if(['frost-shards'].includes(visual)){
    for(let i=0;i<10;i++){const ang=Math.PI*2*i/10,tip={x:b.x+Math.cos(ang)*44,y:b.y+Math.sin(ang)*44};line(g,b,tip,'#bcecff',4,'7 5');}ring(g,b,18,'#e9fbff','#52bde94a',4);
  }else if(['sonic-wave'].includes(visual)){
    [18,34,50].forEach((r,i)=>ring(g,b,r,'#c3a8ff','none',4,'kitk-fx-pulse'));
  }else if(['earth-shatter'].includes(visual)){
    for(let i=0;i<8;i++){const ang=Math.PI*2*i/8,mid={x:b.x+Math.cos(ang)*24,y:b.y+Math.sin(ang)*24},end={x:b.x+Math.cos(ang+.18)*52,y:b.y+Math.sin(ang+.18)*52};g.appendChild(svg('path',{d:`M ${b.x} ${b.y} L ${mid.x} ${mid.y} L ${end.x} ${end.y}`,fill:'none',stroke:'#d6ad73','stroke-width':5,class:'kitk-fx-line'}));}
  }else if(['tidal-wave'].includes(visual)){
    g.appendChild(svg('path',{d:`M ${b.x-55} ${b.y+20} Q ${b.x-20} ${b.y-35} ${b.x+5} ${b.y+8} Q ${b.x+28} ${b.y-26} ${b.x+58} ${b.y+18}`,fill:'none',stroke:'#70d8ff','stroke-width':13,class:'kitk-fx-line'}));
  }else if(['wind-vortex'].includes(visual)){
    for(let i=0;i<4;i++)g.appendChild(svg('ellipse',{cx:b.x,cy:b.y-i*8,rx:16+i*9,ry:7+i*3,fill:'none',stroke:'#d9f8ff','stroke-width':4,class:'kitk-fx-spin'}));
  }else if(['portal'].includes(visual)){
    ring(g,a,22,'#7f6cff','#2c1e7b44',6,'kitk-fx-spin');ring(g,b,28,'#d5cfff','#4837b344',6,'kitk-fx-spin');line(g,a,b,'#a89cff',4,'6 10');
  }else if(['arcane-bindings'].includes(visual)){
    ring(g,b,28,'#81d7ff','none',4);[-18,-6,6,18].forEach(x=>g.appendChild(svg('line',{x1:b.x+x,y1:b.y-30,x2:b.x+x,y2:b.y+30,stroke:'#8ddfff','stroke-width':4,class:'kitk-fx-line'})));
  }else if(['psychic-wave'].includes(visual)){
    [18,31,45].forEach((r,i)=>ring(g,b,r,i%2?'#f49bff':'#7856ff','none',4));line(g,a,b,'#bb8cff',4,'4 9');
  }else if(['charm-wave','illusion-shimmer'].includes(visual)){
    [18,30,42].forEach((r,i)=>ring(g,b,r,i%2?'#ff9fd8':'#d8b8ff','none',3));particles(g,b,'#ffc8ec',10,3);
  }else if(['necrotic-illumination'].includes(visual)){
    const box=roomBox(detail.roomCells,source,target);g.appendChild(svg('rect',{x:box.x,y:box.y,width:box.width,height:box.height,rx:18,fill:'#39134b',opacity:'.42',stroke:'#bd63e6','stroke-width':4,class:'kitk-fx-blanket'}));particles(g,b,'#b875e8',14,4);
  }else if(['dispel-wave'].includes(visual)){
    [18,34,52].forEach((r,i)=>ring(g,b,r,i===2?'#ffffff':'#7fe7ff','none',5));particles(g,b,'#dfffff',16,3);
  }else if(['radiant-necrotic'].includes(visual)){
    ring(g,b,25,'#fff0a3','#43215b55',6);particles(g,b,'#fff0a3',9,4);particles(g,b,'#8e55cf',9,4);
  }else if(['darkness-blanket','magic-blanket'].includes(visual)){
    const box=roomBox(detail.roomCells,source,target),fill=visual==='darkness-blanket'?'#05020d':'#786cff',stroke=visual==='darkness-blanket'?'#453168':'#c7c1ff';g.appendChild(svg('rect',{x:box.x,y:box.y,width:box.width,height:box.height,rx:18,fill,opacity:visual==='darkness-blanket'?'.76':'.24',stroke,'stroke-width':4,class:'kitk-fx-blanket'}));
  }else if(visual==='spotlight'){
    line(g,a,b,'#fff5b3',8,'18 8');ring(g,b,20,'#fff7ca','#fff4a055',5);particles(g,b,'#fff7ca',8,3);
  }else if(visual==='monster-move'){
    for(let i=0;i<7;i++){const y=a.y-18+i*6;g.appendChild(svg('line',{x1:a.x-28-Math.random()*14,y1:y,x2:a.x-5,y2:y+Math.random()*4-2,stroke:'#8a6a50','stroke-width':3,class:'kitk-fx-line'}));}
  }else if(visual==='summon-circle'){
    ring(g,b,34,'#8b65d9','#1b0e3344',5,'kitk-fx-spin');ring(g,b,18,'#d6c6ff','none',3,'kitk-fx-spin');
  }else if(visual==='death-burst'){
    ring(g,b,18,'#e6d8cf','#1a0d0d88',7);particles(g,b,detail.entityType==='monster'?'#654532':'#8e1020',22,5);
  }else{
    line(g,a,b,primary,5,'10 8');ring(g,b,24,secondary,primary+'44',5);particles(g,b,primary,10,4);
  }
  state.layer.appendChild(g);setTimeout(()=>g.remove(),Math.max(700,Number(def.durationMs||detail.durationMs||1600)+250));
}
function play(detail={}){const base=(state.catalog.effects||{})[detail.effectId]||{id:detail.effectId||'generic',visual:detail.visual||'arcane-burst',sound:detail.sound||'arcane_cast',durationMs:detail.durationMs||1500};const variant=detail.effectVariant&&base.variants?base.variants[detail.effectVariant]:null,def=variant?{...base,...variant}:base;playSound(detail.sound||def.sound,detail.volume||.32);render(def,{...detail,visual:detail.visual||def.visual});}
function stopAll(){state.activeAudio.forEach(a=>{try{a.pause();a.currentTime=0;}catch(_){}});state.activeAudio.clear();if(state.layer)state.layer.innerHTML='';}
window.KITKEffects={configure,setMap,play,stopAll};
}());
