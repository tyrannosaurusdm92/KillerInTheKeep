(function(){
'use strict';
const key=(f,x,y)=>`${f}:${x}:${y}`;
const deepClone=v=>JSON.parse(JSON.stringify(v));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const randomId=(p='id')=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
const choice=a=>a[Math.floor(Math.random()*a.length)];
function secureDie(sides){
  if(crypto?.getRandomValues){const a=new Uint32Array(1),limit=Math.floor(0x100000000/sides)*sides;do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%sides+1;}
  return Math.floor(Math.random()*sides)+1;
}
function parseFormula(expression){
  const m=String(expression||'').replace(/\s+/g,'').match(/^(\d+)d(4|6|8|10|12|20)([+-]\d+)?$/i);
  if(!m) throw new Error(`Unsupported dice formula: ${expression}`);
  const count=Number(m[1]),sides=Number(m[2]),modifier=Number(m[3]||0);
  if(count<1||count>20) throw new Error('A physical roll may contain 1–20 dice.');
  return {count,sides,modifier};
}
function rollFormula(expression){
  const p=parseFormula(expression),results=Array.from({length:p.count},()=>secureDie(p.sides));
  return {expression:String(expression).replace(/\s+/g,''),results,total:results.reduce((a,b)=>a+b,0)+p.modifier,modifier:p.modifier};
}
function normalizeMonsterId(ref=''){
  const s=String(ref).toLowerCase();
  if(s.includes('wolf-spider')) return 'giant-wolf-spider';
  if(s.includes('giant-spider')) return 'giant-spider';
  if(s.includes('skeleton')) return 'skeleton';
  if(s.includes('zombie')) return 'zombie';
  if(s.includes('swarm')) return 'swarm-of-insects';
  if(s.includes('gelatinous')) return 'gelatinous-cube';
  if(s.includes('mimic')) return 'mimic';
  return 'spider';
}
class MinQueue{
  constructor(){this.a=[];}
  push(item,priority){this.a.push({item,priority});this.a.sort((x,y)=>x.priority-y.priority);}
  pop(){return this.a.shift();}
  get length(){return this.a.length;}
}
class MapGraph{
  constructor(data){
    this.data=data;this.floors=data.floors;this.cells=new Map();this.objects=new Map();this.edges=new Map();
    Object.values(this.floors).forEach(f=>{
      f.cells.forEach(c=>this.cells.set(key(f.id,c.x,c.y),{...c,floor:f.id}));
      f.objects.forEach(o=>this.objects.set(o.id,o));
    });
    this.rebuildEdges();
  }
  rebuildEdges(){
    this.edges.clear();
    Object.values(this.floors).forEach(f=>{
      f.stairs.forEach(s=>{this.addEdge(s.from,s.to,s.cost||2,'stair',s.id);if(s.twoWay)this.addEdge(s.to,s.from,s.cost||2,'stair',s.id);});
      f.secretPassages.forEach(s=>{if(!s.discovered)return;this.addEdge(s.entry,s.exit,s.cost||1,'secret',s.id);if(s.twoWay)this.addEdge(s.exit,s.entry,s.cost||1,'secret',s.id);});
    });
  }
  addEdge(a,b,cost,type,id){const k=key(a.floor,a.x,a.y);if(!this.edges.has(k))this.edges.set(k,[]);this.edges.get(k).push({cell:b,cost,type,id});}
  getCell(f,x,y){return this.cells.get(key(f,x,y));}
  objectAt(f,x,y){return Array.from(this.objects.values()).filter(o=>o.cell&&o.cell.floor===f&&o.cell.x===x&&o.cell.y===y);}
  isDoorBlocked(f,x,y){return this.objectAt(f,x,y).some(o=>o.type==='door'&&!o.open);}
  canOccupy(cell,actor,occupied=new Set()){
    if(!cell) return false;
    if(occupied.has(key(cell.floor,cell.x,cell.y)) && !actor?.canShareSpace) return false;
    const movement=actor?.movement||{};
    if(cell.walkable) return !this.isDoorBlocked(cell.floor,cell.x,cell.y);
    return Array.isArray(movement.surfaces)&&movement.surfaces.some(s=>s==='wall'||s==='ceiling')&&cell.terrain==='wall';
  }
  directionSteps(actor){
    const rule=actor?.movement?.directions||'orthogonal';
    if(rule==='eight') return [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    if(rule==='forward_and_forward_diagonal'){
      const f=actor.facing||{x:0,y:1};
      if(f.x===0) return [[0,f.y],[1,f.y],[-1,f.y]];
      return [[f.x,0],[f.x,1],[f.x,-1]];
    }
    return [[1,0],[-1,0],[0,1],[0,-1]];
  }
  neighbors(cell,actor,occupied=new Set(),allowCrossFloor=true){
    const out=[];
    this.directionSteps(actor).forEach(([dx,dy])=>{
      const n=this.getCell(cell.floor,cell.x+dx,cell.y+dy);
      if(this.canOccupy(n,actor,occupied))out.push({cell:n,cost:1,type:'step'});
    });
    if(actor?.canLMove){
      [[1,2],[-1,2],[1,-2],[-1,-2],[2,1],[2,-1],[-2,1],[-2,-1]].forEach(([dx,dy])=>{
        const n=this.getCell(cell.floor,cell.x+dx,cell.y+dy);if(this.canOccupy(n,actor,occupied))out.push({cell:n,cost:3,type:'l_move'});
      });
    }
    if(allowCrossFloor&&actor?.movement?.canUseStairs!==false){
      (this.edges.get(key(cell.floor,cell.x,cell.y))||[]).forEach(e=>{
        const n=this.getCell(e.cell.floor,e.cell.x,e.cell.y);if(this.canOccupy(n,actor,occupied))out.push({...e,cell:n});
      });
    }
    return out;
  }
  reachable(origin,allowance,actor,occupied=new Set()){
    const start=this.getCell(origin.floor,origin.x,origin.y);if(!start)return {cells:[],costs:{},parents:{}};
    const q=new MinQueue(),costs=new Map([[key(start.floor,start.x,start.y),0]]),parents=new Map();q.push(start,0);
    while(q.length){
      const cur=q.pop(),ck=key(cur.item.floor,cur.item.x,cur.item.y);if(cur.priority!==costs.get(ck))continue;
      this.neighbors(cur.item,actor,occupied,true).forEach(n=>{
        const nk=key(n.cell.floor,n.cell.x,n.cell.y),nc=cur.priority+n.cost;
        if(nc<=allowance&&(!costs.has(nk)||nc<costs.get(nk))){costs.set(nk,nc);parents.set(nk,ck);q.push(n.cell,nc);}
      });
    }
    const cells=[];costs.forEach((cost,k)=>{if(k!==key(start.floor,start.x,start.y))cells.push({...this.cells.get(k),cost});});
    return {cells,costs:Object.fromEntries(costs),parents:Object.fromEntries(parents)};
  }
  path(origin,destination,allowance,actor,occupied=new Set()){
    const r=this.reachable(origin,allowance,actor,occupied),dk=key(destination.floor,destination.x,destination.y);
    if(!(dk in r.costs))return [];
    const rev=[this.cells.get(dk)];let k=dk,guard=0;
    while(r.parents[k]&&guard++<5000){k=r.parents[k];rev.push(this.cells.get(k));}
    return rev.reverse();
  }
  vision(origin,radius,actor){
    const start=this.getCell(origin.floor,origin.x,origin.y);if(!start)return new Set();
    const seen=new Set([key(start.floor,start.x,start.y)]),q=[{c:start,d:0}];
    while(q.length){const {c,d}=q.shift();if(d>=radius)continue;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
        const n=this.getCell(c.floor,c.x+dx,c.y+dy);if(!n)return;const nk=key(n.floor,n.x,n.y);if(seen.has(nk))return;
        seen.add(nk);if(n.walkable&&!this.isDoorBlocked(n.floor,n.x,n.y))q.push({c:n,d:d+1});
      });
    }
    return seen;
  }
  discoverSecret(id){
    Object.values(this.floors).forEach(f=>f.secretPassages.forEach(s=>{if(s.id===id)s.discovered=true;}));this.rebuildEdges();
  }
}
class LocalGame extends EventTarget{
  constructor({data,mapData,monsterData,mode='cooperative',humanHero='daltu',gameLevel=1}){
    super();
    this.data=data;this.graph=new MapGraph(deepClone(mapData));this.monsterDefs=new Map(monsterData.records.map(m=>[m.id,m]));this.mode=mode;this.gameLevel=clamp(Number(gameLevel)||1,1,5);this.humanHero=humanHero;
    this.id=randomId('localgame');this.status='lobby';this.round=1;this.turnIndex=0;this.revision=1;this.pending=null;this.log=[];this.messages=[];this.votes={};this.accusation=null;
    this.actors=[];this.monsters=[];this.objects=this.graph.objects;this.explored={};this.visible=new Set();this.killerId='';this.openingVictimId='';this.solution={suspect:'',weapon:'',room:'',characterCardId:'',weaponCardId:'',roomCardId:''};
    this.turnOrder=[];this.initiativeRolls=[];this.evidenceRemainder=[];this.effectHistory=[];
    this.initActors();this.initMonsters();this.initObjects();this.prepareOpeningCase();
  }
  emit(type,detail={}){this.dispatchEvent(new CustomEvent(type,{detail}));}
  heroRecord(actorOrId){const id=typeof actorOrId==='string'?actorOrId:(actorOrId?.heroId||actorOrId?.id);return this.data.heroes.find(h=>h.id===id);}
  heroStats(h){const d=h?.derived_by_game_level?.[this.gameLevel-1]||{};return {maxHp:Number(d.maximum_hp||d.hit_points||d.hp||30),ac:Number(d.armor_class||d.ac||13),proficiency:Number(d.proficiency_bonus||2),powerAttack:Number(d.power_attack_bonus||d.proficiency_bonus||2),powerSaveDc:Number(d.power_save_dc||13),limitedUses:Number(d.limited_power_uses||this.gameLevel)};}
  abilityModifier(actor,ability){if(actor?.type!=='character')return 0;const h=this.heroRecord(actor);return Number(h?.ability_modifiers?.[String(ability||'').toLowerCase()]||0);}
  initActors(){
    const fallback=[[21,28],[23,28],[25,28],[27,28],[21,30],[23,30],[25,30],[27,30]];
    this.data.heroes.forEach((h,i)=>{
      const modeKey=this.mode==='full_pvp'?'full_pvp':'work_together',starts=this.data.startPoints?.start_points?.[modeKey]||this.data.startPoints?.[modeKey]||[],stats=this.heroStats(h),sp=starts.find(x=>String(x.character_id||x.characterId||'')===h.id);
      const x=sp?.x??sp?.cell?.x??fallback[i][0],y=sp?.y??sp?.cell?.y??fallback[i][1],floor=sp?.floor||sp?.cell?.floor||'first_floor';
      this.actors.push({id:h.id,heroId:h.id,name:h.display_name||h.name,type:'character',human:h.id===this.humanHero,bot:h.id!==this.humanHero,color:h.accent,token:`assets/svg/tokens/characters/${h.id}.svg`,floor,x,y,facing:{x:0,y:-1},hp:stats.maxHp,maxHp:stats.maxHp,temporaryHp:0,ac:stats.ac,initiative:0,initiativeRoll:0,status:'alive',ghost:false,openingVictim:false,conditions:[],inventory:[],cards:[],powerUses:{},movement:{dice:'1d10',directions:'orthogonal',surfaces:['floor'],canUseStairs:true},canLMove:false,movementRemaining:0,actionUsed:false,bonusUsed:false,knownSecrets:[],privateRole:'innocent'});
    });
  }
  initMonsters(){
    Object.values(this.graph.floors).forEach(f=>f.monsterSpawns.forEach(s=>{
      const mid=normalizeMonsterId(s.cardRef||s.monsterId),def=this.monsterDefs.get(mid)||this.monsterDefs.get('spider');
      this.monsters.push({id:s.id||randomId('monster'),monsterId:def.id,name:def.name,type:'monster',human:false,bot:true,color:'#79502e',token:`assets/svg/tokens/monsters/${def.id}.svg`,floor:s.cell.floor,x:s.cell.x,y:s.cell.y,facing:{x:0,y:1},hp:def.hp,maxHp:def.hp,temporaryHp:0,ac:def.ac,initiative:0,initiativeRoll:0,status:'alive',conditions:[],movement:deepClone(def.movement),attack:deepClone(def.attack),active:!!s.active,hidden:!!s.hidden,roomId:s.roomId,surface:'floor',movementRemaining:0,actionUsed:false});
    }));
    const cube=this.monsterDefs.get('gelatinous-cube');if(cube)this.monsters.push({id:'monster_gelatinous_cube_reserve',monsterId:cube.id,name:cube.name,type:'monster',human:false,bot:true,color:'#79502e',token:`assets/svg/tokens/monsters/${cube.id}.svg`,floor:'cellar',x:22,y:17,facing:{x:0,y:1},hp:cube.hp,maxHp:cube.hp,temporaryHp:0,ac:cube.ac,initiative:0,initiativeRoll:0,status:'alive',conditions:[],movement:deepClone(cube.movement),attack:deepClone(cube.attack),active:false,hidden:true,roomId:'cellar',surface:'floor',movementRemaining:0,actionUsed:false});
  }
  initObjects(){this.objects.forEach(o=>{if(o.type==='container'&&Math.random()<Number(o.mimicChance||0))o.mimic=true;});}
  shuffled(items){const a=deepClone(items);for(let i=a.length-1;i>0;i--){const j=secureDie(i+1)-1;[a[i],a[j]]=[a[j],a[i]];}return a;}
  prepareOpeningCase(){
    const killer=choice(this.actors);killer.privateRole='killer';this.killerId=killer.id;
    const evidence=this.data.decks?.evidence||[],characterCard=evidence.find(c=>c.category==='character'&&c.character_id===killer.id),weaponCard=choice(evidence.filter(c=>c.category==='murder_weapon')),roomCard=choice(evidence.filter(c=>c.category==='room'));
    const weaponSlug=String(weaponCard?.card_id||'evidence-weapon-dagger').replace(/^evidence-weapon-/,'');
    this.solution={suspect:killer.id,weapon:weaponSlug,room:roomCard?.room_id||choice(this.data.rooms.map(r=>r.id).filter(Boolean)),characterCardId:characterCard?.card_id||'',weaponCardId:weaponCard?.card_id||'',roomCardId:roomCard?.card_id||''};
    const victim=choice(this.actors.filter(a=>a.id!==killer.id));this.openingVictimId=victim.id;victim.openingVictim=true;victim.status='ghost';victim.ghost=true;victim.hp=0;victim.conditions=[];victim.privateRole='opening_victim';
    const murderCells=(this.graph.floors[roomCard?.floor]?.cells||[]).filter(c=>c.roomId===this.solution.room&&c.walkable);
    let cell=murderCells[0];if(!cell){for(const f of Object.values(this.graph.floors)){cell=f.cells.find(c=>c.roomId===this.solution.room&&c.walkable);if(cell)break;}}
    if(cell){victim.floor=cell.floor||Object.values(this.graph.floors).find(f=>f.cells.includes(cell))?.id||victim.floor;victim.x=cell.x;victim.y=cell.y;}
    const sealed=new Set([this.solution.characterCardId,this.solution.weaponCardId,this.solution.roomCardId]);const deck=this.shuffled(evidence.filter(c=>!sealed.has(c.card_id))),living=this.actors.filter(a=>a.id!==victim.id);
    living.forEach(a=>{a.cards=deck.splice(0,5);});victim.cards=[];this.evidenceRemainder=deck;
  }
  initiativeContext(actor){const dex=this.abilityModifier(actor,'dexterity');return {context:'initiative',label:`${actor.name} initiative`,expression:`1d20${dex>=0?'+':''}${dex}`,actorId:actor.id,kind:actor.type==='monster'?'monster':'character'};}
  async rollOpeningInitiative(roller){
    this.status='initiative';this.initiativeRolls=[];
    for(const actor of this.actors){const result=await roller(this.initiativeContext(actor));actor.initiativeRoll=Number(result.results?.[0]||0);actor.initiative=Number(result.total||0);this.initiativeRolls.push({actorId:actor.id,name:actor.name,roll:actor.initiativeRoll,total:actor.initiative,dexterity:this.abilityModifier(actor,'dexterity')});this.logEvent('initiative_rolled',{actorId:actor.id,roll:deepClone(result),total:actor.initiative});}
    this.turnOrder=this.actors.slice().sort((a,b)=>b.initiative-a.initiative||this.abilityModifier(b,'dexterity')-this.abilityModifier(a,'dexterity')||a.name.localeCompare(b.name)).map(a=>a.id);this.turnIndex=0;this.status='active';this.updateVision();this.logEvent('initiative_order_established',{order:this.turnOrder.slice(),rolls:deepClone(this.initiativeRolls)});this.logEvent('game_started',{mode:this.mode,openingVictimId:this.openingVictimId,killerPrivate:this.humanActor().privateRole});this.emit('state',{state:this.publicState()});return deepClone(this.initiativeRolls);
  }
  start(){
    if(!this.turnOrder.length){this.actors.forEach(a=>{a.initiativeRoll=secureDie(20);a.initiative=a.initiativeRoll+this.abilityModifier(a,'dexterity');});this.turnOrder=this.actors.slice().sort((a,b)=>b.initiative-a.initiative||this.abilityModifier(b,'dexterity')-this.abilityModifier(a,'dexterity')).map(a=>a.id);}
    this.turnIndex=0;this.status='active';this.updateVision();this.logEvent('game_started',{mode:this.mode,openingVictimId:this.openingVictimId,killerPrivate:this.humanActor().privateRole});this.emit('state',{state:this.publicState()});
  }
  addToInitiative(entity){if(!entity||this.turnOrder.includes(entity.id))return;if(!entity.initiative){entity.initiativeRoll=secureDie(20);entity.initiative=entity.initiativeRoll;}const currentId=this.currentActor()?.id;this.turnOrder.push(entity.id);this.turnOrder.sort((a,b)=>this.entity(b).initiative-this.entity(a).initiative);this.turnIndex=Math.max(0,this.turnOrder.indexOf(currentId));this.logEvent('initiative_joined',{entityId:entity.id,total:entity.initiative});}
  entity(id){return this.actors.find(a=>a.id===id)||this.monsters.find(m=>m.id===id);}
  humanActor(){return this.actors.find(a=>a.human)||this.actors[0];}
  currentActor(){return this.entity(this.turnOrder?.[this.turnIndex])||this.humanActor();}
  allLiving(){return [...this.actors,...this.monsters].filter(a=>(a.status==='alive'||a.ghost)&&(!a.hidden||a.active));}
  occupied(ignoreId=''){return new Set(this.allLiving().filter(a=>a.id!==ignoreId&&!a.ghost).map(a=>key(a.floor,a.x,a.y)));}
  logEvent(type,data={}){const e={id:randomId('evt'),at:new Date().toISOString(),type,data};this.log.push(e);this.revision++;this.emit('event',e);return e;}
  effect(effectId,source,target,extra={}){const detail={id:randomId('fx'),effectId,source:source?{id:source.id,floor:source.floor,x:source.x,y:source.y,type:source.type}:null,target:target?{id:target.id,floor:target.floor,x:target.x,y:target.y,type:target.type}:null,floor:target?.floor||source?.floor,entityType:target?.type,...extra};this.effectHistory.push(detail);if(this.effectHistory.length>100)this.effectHistory.shift();this.emit('effect',detail);return detail;}
  publicState(){return {id:this.id,status:this.status,mode:this.mode,round:this.round,turnActorId:this.currentActor()?.id,turnOrder:this.turnOrder.slice(),initiativeRolls:deepClone(this.initiativeRolls),openingVictimId:this.openingVictimId,revision:this.revision,actors:deepClone(this.actors),monsters:deepClone(this.monsters.filter(m=>m.active&&!m.hidden)),objects:Array.from(this.objects.values()).map(o=>({...deepClone(o),contents:o.looted?[]:undefined,mimic:undefined})),visible:Array.from(this.visible),explored:deepClone(this.explored),log:this.log.slice(-100),messages:this.messages.slice(-100),effects:this.effectHistory.slice(-20)};}
  privateState(){const a=this.humanActor();return {role:a.privateRole,solution:a.privateRole==='killer'?deepClone({...this.solution,openingVictimId:this.openingVictimId}):null,inventory:deepClone(a.inventory),cards:deepClone(a.cards),knownSecrets:deepClone(a.knownSecrets)};}
  updateVision(){const sources=this.mode==='cooperative'?this.actors.filter(a=>a.status==='alive'||a.ghost):this.actors.filter(a=>a.human&&(a.status==='alive'||a.ghost));const vis=new Set();sources.forEach(a=>this.graph.vision(a,7,a).forEach(k=>vis.add(k)));this.visible=vis;sources.forEach(a=>{this.explored[a.id]=this.explored[a.id]||{};vis.forEach(k=>this.explored[a.id][k]=true);});}
  movementContext(actor=this.currentActor()){if(!actor||(actor.status!=='alive'&&!actor.ghost))return null;return {context:'movement',label:`${actor.name} movement`,expression:actor.ghost?'1d10':(actor.movement?.dice||'1d10'),actorId:actor.id,kind:actor.type==='monster'?'monster':'character'};}
  perceptionContext(actor=this.humanActor()){const h=this.heroRecord(actor),wis=Number(h?.ability_modifiers?.wisdom||0),prof=(h?.proficiencies?.skills||[]).some(x=>String(x).toLowerCase().includes('perception'))?this.heroStats(h).proficiency:0;return {context:'perception',label:`${actor.name} Perception`,expression:`1d20${wis+prof>=0?'+':''}${wis+prof}`,actorId:actor.id,kind:'character'};}
  skillContext(skill,actor=this.humanActor()){const h=this.heroRecord(actor),ability={lockpick:'dexterity',disarm:'dexterity',force:'strength',search:'wisdom',investigate:'intelligence'}[skill]||'wisdom',proficient=(h?.proficiencies?.skills||[]).some(x=>String(x).toLowerCase().includes(skill==='search'?'perception':skill)),mod=Number(h?.ability_modifiers?.[ability]||0)+(proficient?this.heroStats(h).proficiency:0);return {context:skill,label:`${actor.name} ${skill}`,expression:`1d20${mod>=0?'+':''}${mod}`,actorId:actor.id,kind:'character'};}
  setMovement(actorId,total){const a=this.entity(actorId);if(!a)throw new Error('Actor not found.');a.movementRemaining=clamp(Number(total)||0,0,a.movement?.speedCap||99);this.pending={type:'movement',actorId:a.id};this.logEvent('movement_rolled',{actorId:a.id,total:a.movementRemaining});return this.reachable(a.id);}
  reachable(actorId=this.currentActor()?.id){const a=this.entity(actorId);if(!a)return {cells:[]};return this.graph.reachable(a,a.movementRemaining,a,this.occupied(a.id));}
  move(actorId,destination){const a=this.entity(actorId);if(!a||(a.status!=='alive'&&!a.ghost))throw new Error('That actor cannot move.');const path=this.graph.path(a,destination,a.movementRemaining,a,this.occupied(a.id));if(!path.length)throw new Error('That destination is not legally reachable.');const reach=this.graph.reachable(a,a.movementRemaining,a,this.occupied(a.id)),cost=Number(reach.costs[key(destination.floor,destination.x,destination.y)]||0),oldRoom=this.graph.getCell(a.floor,a.x,a.y)?.roomId;a.floor=destination.floor;a.x=destination.x;a.y=destination.y;a.movementRemaining=Math.max(0,a.movementRemaining-cost);const newRoom=this.graph.getCell(a.floor,a.x,a.y)?.roomId;this.logEvent('actor_moved',{actorId:a.id,path:path.map(c=>({floor:c.floor,x:c.x,y:c.y})),destination:{floor:a.floor,x:a.x,y:a.y},cost});if(newRoom&&newRoom!==oldRoom)this.enterRoom(a,newRoom);if(!a.ghost)this.checkTile(a);this.updateVision();this.pending=null;this.emit('state',{state:this.publicState()});return {path,state:this.publicState()};}
  enterRoom(actor,roomId){this.graph.floors[actor.floor]?.lights?.filter(l=>l.roomId===roomId).forEach(l=>l.active=true);this.monsters.filter(m=>m.roomId===roomId&&m.hidden).forEach(m=>{if(Math.random()<.75){m.hidden=false;m.active=true;this.addToInitiative(m);this.logEvent('monster_revealed',{monsterId:m.id,roomId});}});if(actor.human&&!actor.ghost){this.pending={type:'perception',actorId:actor.id,roomId};this.logEvent('room_entry',{actorId:actor.id,roomId,requires:'perception'});}this.playEnvironment('fireplace');}
  checkTile(actor){this.graph.objectAt(actor.floor,actor.x,actor.y).forEach(o=>{if(o.type==='trap'&&!o.disarmed&&!o.triggered&&!o.detected){o.triggered=true;const dmg=rollFormula('2d6');this.applyDamage(actor,dmg.total);this.effect('system:trap',actor,actor,{visual:'spotlight',sound:'trap',hit:true});if(actor.hp===0)this.defeat(actor,{reason:'trap'});this.logEvent('trap_triggered',{actorId:actor.id,objectId:o.id,damage:dmg.total,roll:dmg});this.playEnvironment('trap');}});}
  resolvePerception(total){const a=this.humanActor(),room=this.pending?.roomId;if(this.pending?.type!=='perception')return [];const found=[];this.objects.forEach(o=>{if(o.roomId===room&&o.hidden&&!o.detected&&total>=Number(o.noticeDc||13)){o.detected=true;found.push(o.id);this.effect('perception-spotlight',a,{id:o.id,type:'object',floor:o.cell.floor,x:o.cell.x,y:o.cell.y},{visual:'spotlight',sound:'perception_spotlight'});}});Object.values(this.graph.floors).forEach(f=>f.secretPassages.forEach(s=>{const c=[s.entry,s.exit].find(c=>c.floor===a.floor&&this.graph.getCell(c.floor,c.x,c.y)?.roomId===room);if(c&&total>=Number(s.discoveryDc||15)&&!s.discovered){s.discovered=true;this.graph.discoverSecret(s.id);a.knownSecrets.push(s.id);found.push(s.id);this.effect('perception-spotlight',a,{id:s.id,type:'secret',floor:c.floor,x:c.x,y:c.y},{visual:'spotlight',sound:'perception_spotlight'});}}));this.pending=null;this.logEvent('perception_resolved',{actorId:a.id,total,found});return found;}
  nearbyObjects(actor=this.humanActor()){return Array.from(this.objects.values()).filter(o=>o.cell&&o.cell.floor===actor.floor&&Math.abs(o.cell.x-actor.x)+Math.abs(o.cell.y-actor.y)<=1&&(o.detected||!o.hidden||o.type==='door'||o.type==='container'));}
  search(total){const a=this.humanActor(),room=this.graph.getCell(a.floor,a.x,a.y)?.roomId,found=[];this.objects.forEach(o=>{if(o.roomId===room&&(!o.detected||o.hidden)&&total>=Number(o.noticeDc||12)){o.detected=true;o.hidden=false;found.push(o.id);this.effect('perception-spotlight',a,{id:o.id,type:'object',floor:o.cell.floor,x:o.cell.x,y:o.cell.y},{visual:'spotlight',sound:'perception_spotlight'});}});this.monsters.filter(m=>m.roomId===room&&m.hidden).forEach(m=>{m.hidden=false;m.active=true;this.addToInitiative(m);found.push(m.id);this.effect(`monster-move:${m.monsterId}`,m,m,{visual:'monster-move'});this.logEvent('monster_revealed',{monsterId:m.id,roomId:room});});this.logEvent('room_searched',{actorId:a.id,roomId:room,total,found});this.updateVision();return found;}
  interact(objectId,action,total=0){const a=this.humanActor(),o=this.objects.get(objectId);if(!o)throw new Error('Interactive object not found.');if(Math.abs(o.cell.x-a.x)+Math.abs(o.cell.y-a.y)>1||o.cell.floor!==a.floor)throw new Error('Move next to the object first.');if(action==='open'){if(o.locked)throw new Error('The object is locked.');if(o.trapped&&!o.disarmed)throw new Error('The object is trapped.');if(o.mimic&&!o.mimicRevealed){o.mimicRevealed=true;o.opened=true;const def=this.monsterDefs.get('mimic'),m={id:'mimic_'+o.id,monsterId:'mimic',name:'Mimic',type:'monster',human:false,bot:true,color:'#79502e',token:'assets/svg/tokens/monsters/mimic.svg',floor:o.cell.floor,x:o.cell.x,y:o.cell.y,facing:{x:0,y:1},hp:def.hp,maxHp:def.hp,temporaryHp:0,ac:def.ac,initiative:0,initiativeRoll:0,status:'alive',conditions:[],movement:deepClone(def.movement),attack:deepClone(def.attack),active:true,hidden:false,roomId:o.roomId,surface:'floor',movementRemaining:0,actionUsed:false};this.monsters.push(m);this.addToInitiative(m);this.effect('monster-move:mimic',m,m,{visual:'monster-move',sound:'mimic_snap'});this.logEvent('mimic_revealed',{objectId:o.id,monsterId:m.id});return {mimic:m};}o.open=true;o.opened=true;this.playEnvironment('door');}else if(action==='close'){o.open=false;}else if(action==='lockpick'){if(total>=Number(o.lockDc||12)){o.locked=false;this.playEnvironment('lock');}else throw new Error('The lock resisted the attempt.');}else if(action==='force'){if(total>=Number(o.lockDc||12)+2)o.locked=false;else throw new Error('Forced entry failed.');}else if(action==='disarm'){if(total>=Number(o.disableDc||o.lockDc||12)){o.disarmed=true;o.trapped=false;}else throw new Error('The trap remains armed.');}else if(action==='loot'){if(!o.opened&&!o.open)throw new Error('Open the container first.');if(o.looted)throw new Error('Nothing remains.');const items=o.contents||o.available||[];a.inventory.push(...items.map(id=>({id,quantity:1,equipped:false})));o.looted=true;this.logEvent('loot_collected',{actorId:a.id,objectId:o.id,items});return {items};}this.logEvent('object_interacted',{actorId:a.id,objectId:o.id,action,total});this.graph.rebuildEdges();this.updateVision();return {object:o};}
  legalTargets(actor=this.humanActor()){const all=this.monsters.filter(m=>m.active&&!m.hidden&&m.status==='alive');if(this.mode==='full_pvp')all.push(...this.actors.filter(x=>x.id!==actor.id&&x.status==='alive'));return all.filter(t=>t.floor===actor.floor&&Math.abs(t.x-actor.x)+Math.abs(t.y-actor.y)<=6);}
  weaponList(actor=this.humanActor()){return deepClone(this.heroRecord(actor)?.weapons||[]);}
  formulaFromText(text,fallback='1d6',abilityMod=0){const m=String(text||'').match(/(\d+)d(4|6|8|10|12|20)(?:\s*([+-])\s*(\d+))?/i);if(!m)return fallback;let mod=Number(m[4]||0)*(m[3]==='-'?-1:1);if(/modifier/i.test(String(text)))mod+=abilityMod;return `${m[1]}d${m[2]}${mod?`${mod>0?'+':''}${mod}`:''}`;}
  attackContext(targetId,actor=this.humanActor(),weaponId=''){const t=this.entity(targetId);if(!t)throw new Error('Target not found.');if(actor.type==='monster'){const attack=actor.attack||{},save=attack.save;return {weaponId:attack.name,effectId:`monster:${actor.monsterId}:${String(attack.name||'attack').toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,damageType:attack.damageType||'',attack:{expression:`1d20${Number(attack.bonus||0)>=0?'+':''}${Number(attack.bonus||0)}`,label:`${actor.name} ${attack.name}`,kind:'monster',actorId:actor.id},damage:{expression:attack.damage||'1d4',label:`${attack.name} damage`,kind:'monster',actorId:actor.id},save:save?{expression:`1d20${this.abilityModifier(t,save.ability)>=0?'+':''}${this.abilityModifier(t,save.ability)}`,label:`${t.name} ${save.ability} save`,kind:t.type==='monster'?'monster':'character',actorId:t.id,dc:Number(save.dc||10),ability:save.ability}:null,secondaryDamage:save?.failureDamage?{expression:save.failureDamage,label:`${save.type||'secondary'} damage`,kind:'monster',actorId:actor.id,type:save.type}:null,target:t};}
    const h=this.heroRecord(actor),weapons=h?.weapons||[],weapon=weapons.find(w=>w.id===weaponId)||weapons[0]||{id:'unarmed',name:'Unarmed Strike',damage:'1d4 bludgeoning',ability:'strength'},ability=String(weapon.ability||'strength').toLowerCase(),mod=Number(h?.ability_modifiers?.[ability]||0),prof=this.heroStats(h).proficiency,damage=this.formulaFromText(weapon.damage,'1d4',0),damageType=String(weapon.damage||'').match(/(slashing|piercing|bludgeoning|poison|necrotic|lightning|fire|cold|acid|radiant|force|psychic)/i)?.[1]?.toLowerCase()||'physical';return {weaponId:weapon.id,weapon,effectId:`weapon:${actor.heroId}:${weapon.id}`,damageType,attack:{expression:`1d20${mod+prof>=0?'+':''}${mod+prof}`,label:`${actor.name} · ${weapon.name}`,kind:'character',actorId:actor.id},damage:{expression:`${damage}${mod?`${mod>0?'+':''}${mod}`:''}`,label:`${weapon.name} damage`,kind:'character',actorId:actor.id},target:t};}
  applyDamage(target,amount){let n=Math.max(0,Number(amount)||0),absorbed=0;if(target.temporaryHp>0){absorbed=Math.min(target.temporaryHp,n);target.temporaryHp-=absorbed;n-=absorbed;}target.hp=Math.max(0,target.hp-n);return {applied:n,absorbed};}
  applyHealing(target,amount){const before=target.hp;target.hp=Math.min(target.maxHp,target.hp+Math.max(0,Number(amount)||0));return target.hp-before;}
  applyAttack(actorId,targetId,attackRoll,damageRoll,options={}){const a=this.entity(actorId),t=this.entity(targetId);if(!a||!t)throw new Error('Combatant unavailable.');const critical=attackRoll.results?.includes(20),hit=critical||attackRoll.total>=t.ac;let damage=0,secondaryDamage=0,saveSucceeded=null;if(hit){damage=Number(damageRoll.total||0);if(critical)damage+=Number((damageRoll.results||[]).reduce((x,y)=>x+y,0));damage=this.applyDamage(t,damage).applied;if(options.saveContext&&options.saveRoll){saveSucceeded=Number(options.saveRoll.total)>=Number(options.saveContext.dc);if(!saveSucceeded&&options.secondaryRoll){secondaryDamage=this.applyDamage(t,Number(options.secondaryRoll.total||0)).applied;if(String(options.secondaryType||'').toLowerCase()==='poison'&&!t.conditions.includes('poisoned'))t.conditions.push('poisoned');}}if(t.hp===0)this.defeat(t,{reason:'attack',killerId:a.id});}a.actionUsed=true;this.effect(options.effectId||`weapon:${a.heroId||a.monsterId}:default`,a,t,{hit,critical,damageType:options.damageType});if(t.conditions.includes('poisoned'))this.effect('condition:poisoned',a,t,{visual:'poison-aura',sound:'poison'});this.logEvent('attack_resolved',{actorId:a.id,targetId:t.id,weaponId:options.weaponId||'',attack:attackRoll,damage:damageRoll,hit,critical,appliedDamage:damage,save:options.saveRoll||null,saveSucceeded,secondaryDamage});return {hit,critical,damage,secondaryDamage,saveSucceeded,target:t};}
  availablePowers(actor=this.humanActor()){return (this.data.powers||[]).filter(p=>(p.users||[]).some(u=>u.hero_id===actor.heroId&&Number(u.unlock_game_level||1)<=this.gameLevel));}
  powerUser(power,actor){return (power?.users||[]).find(u=>u.hero_id===actor.heroId);}
  powerRemaining(actor,power){const user=this.powerUser(power,actor);if(!user||String(user.usage||'').toLowerCase()==='unlimited'||String(power.kind||'').toLowerCase().includes('cantrip'))return Infinity;return Math.max(0,this.heroStats(this.heroRecord(actor)).limitedUses-Number(actor.powerUses?.[power.id]||0));}
  powerIsOffensive(power){return !!(power?.damage_by_game_level?.length)||/(attack|damage|save)/i.test(String(power?.resolution||''))&&!(power?.healing_by_game_level?.length);}
  powerRangeSquares(power){const r=String(power?.range||'');if(/self/i.test(r)&&!/\d+\s*feet/i.test(r))return 0;if(/touch|melee/i.test(r))return 1;const n=Number(r.match(/(\d+)\s*feet/i)?.[1]||30);return Math.max(1,Math.ceil(n/5));}
  legalPowerTargets(power,actor=this.humanActor()){const range=this.powerRangeSquares(power),off=this.powerIsOffensive(power),candidates=off?this.legalTargets(actor):this.actors.filter(a=>(a.status==='alive'||a.ghost)&&a.floor===actor.floor);return candidates.filter(t=>t.id===actor.id||Math.abs(t.x-actor.x)+Math.abs(t.y-actor.y)<=range);}
  powerContext(powerId,targetId='',actor=this.humanActor()){const power=this.availablePowers(actor).find(p=>p.id===powerId);if(!power)throw new Error('That power is not unlocked for this character at the current Game Level.');if(this.powerRemaining(actor,power)<=0)throw new Error(`${power.name} has no uses remaining.`);let target=this.entity(targetId)||actor;const range=this.powerRangeSquares(power);if(target.id!==actor.id&&(target.floor!==actor.floor||Math.abs(target.x-actor.x)+Math.abs(target.y-actor.y)>range))throw new Error('The selected target is outside this power’s authored range.');const stats=this.heroStats(this.heroRecord(actor)),resolution=String(power.resolution||''),damageText=power.damage_by_game_level?.[this.gameLevel-1]||'',healingText=power.healing_by_game_level?.[this.gameLevel-1]||'',abilityName=String(damageText+' '+healingText).match(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) modifier/i)?.[1]?.toLowerCase(),abilityMod=abilityName?this.abilityModifier(actor,abilityName):0,saveAbility=resolution.match(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) save/i)?.[1],attackNeeded=/power attack/i.test(resolution),saveNeeded=!!saveAbility;return {power,target,effectId:power.id,attack:attackNeeded?{expression:`1d20${stats.powerAttack>=0?'+':''}${stats.powerAttack}`,label:`${actor.name} · ${power.name} attack`,kind:'character',actorId:actor.id}:null,save:saveNeeded?{expression:`1d20${this.abilityModifier(target,saveAbility)>=0?'+':''}${this.abilityModifier(target,saveAbility)}`,label:`${target.name} ${saveAbility} save`,kind:target.type==='monster'?'monster':'character',actorId:target.id,ability:saveAbility,dc:stats.powerSaveDc}:null,damage:damageText?{expression:this.formulaFromText(damageText,'1d6',abilityMod),label:`${power.name} damage`,kind:'character',actorId:actor.id}:null,healing:healingText?{expression:this.formulaFromText(healingText,'1d6',abilityMod),label:`${power.name} healing`,kind:'character',actorId:actor.id}:null};}
  revealMagic(actor){const room=this.graph.getCell(actor.floor,actor.x,actor.y)?.roomId,found=[];this.objects.forEach(o=>{if(o.roomId===room&&(o.magical||o.type==='trap'||o.type==='secret'||o.hidden)){o.detected=true;found.push(o.id);}});Object.values(this.graph.floors).forEach(f=>f.secretPassages.forEach(s=>{if([s.entry,s.exit].some(c=>c.floor===actor.floor&&this.graph.getCell(c.floor,c.x,c.y)?.roomId===room)){s.discovered=true;this.graph.discoverSecret(s.id);found.push(s.id);}}));return {room,found};}
  canDetectMagic(actor=this.humanActor()){const h=this.heroRecord(actor),cls=String(h?.class_name||'').toLowerCase(),spellClass=['druid','sorcerer','paladin','bard','cleric','necromancer'].includes(cls),itemAccess=(actor.inventory||[]).some(i=>/detect magic/i.test(String(i.effect||i.name||i.id||'')));return spellClass||itemAccess;}
  detectMagic(actorId=this.humanActor().id){const actor=this.entity(actorId);if(!actor||!this.canDetectMagic(actor))throw new Error('This character does not currently have Detect Magic available.');const r=this.revealMagic(actor),roomCells=(this.graph.floors[actor.floor]?.cells||[]).filter(c=>c.roomId===r.room).map(c=>({...c,floor:actor.floor}));this.effect('detect-magic',actor,actor,{roomCells,visual:'magic-blanket',sound:'detect_magic'});actor.actionUsed=true;this.logEvent('detect_magic',{actorId:actor.id,roomId:r.room,found:r.found.slice()});return r;}
  applyPower(actorId,targetId,powerId,rolls={}){const actor=this.entity(actorId),ctx=this.powerContext(powerId,targetId,actor),power=ctx.power,target=ctx.target,resolution=String(power.resolution||'').toLowerCase(),attackHit=ctx.attack?((rolls.attack?.results||[]).includes(20)||Number(rolls.attack?.total||0)>=target.ac):true,saveSucceeded=ctx.save?Number(rolls.save?.total||0)>=ctx.save.dc:false,success=attackHit&&(!ctx.save||!saveSucceeded),half=ctx.save&&saveSucceeded&&/half damage/.test(resolution);let damage=0,healing=0,temporaryHp=0,revealed=[];if(ctx.damage&&attackHit&&(!ctx.save||!saveSucceeded||half)){damage=Number(rolls.damage?.total||0);if(half)damage=Math.floor(damage/2);damage=this.applyDamage(target,damage).applied;}if(ctx.healing){const amount=Number(rolls.healing?.total||0);if((power.tags||[]).some(t=>String(t).toLowerCase().includes('temporary hp'))||/temporary hp/i.test(power.effect||'')){temporaryHp=Math.max(target.temporaryHp||0,amount);target.temporaryHp=temporaryHp;}else healing=this.applyHealing(target,amount);}
    const lowerTags=(power.tags||[]).map(t=>String(t).toLowerCase());if(success){['poisoned','restrained','blinded','deafened','frightened','charmed','prone','paralyzed','stunned','invisible'].forEach(c=>{if(lowerTags.includes(c)&&!target.conditions.includes(c))target.conditions.push(c);});if(/end poisoned|remove poison/i.test(power.effect||''))target.conditions=target.conditions.filter(c=>c!=='poisoned');if(/end frightened|remove frightened/i.test(power.effect||''))target.conditions=target.conditions.filter(c=>c!=='frightened');}
    const effectVariant=String(rolls.effectVariant||'').toLowerCase(),variantMap={acid:{visual:'acid-splash',sound:'acid'},cold:{visual:'frost-shards',sound:'frost'},fire:{visual:'fire-burst',sound:'fire'},lightning:{visual:'lightning',sound:'lightning'},poison:{visual:'poison-cloud',sound:'poison'}},variant=variantMap[effectVariant]||null;if(/detect magic/i.test(power.name+' '+power.effect)){const r=this.revealMagic(actor);revealed=r.found;const roomCells=(this.graph.floors[actor.floor]?.cells||[]).filter(c=>c.roomId===r.room).map(c=>({...c,floor:actor.floor}));this.effect(power.id,actor,actor,{roomCells,visual:'magic-blanket',effectVariant});}else this.effect(power.id,actor,target,{hit:success||half,damage,healing,temporaryHp,effectVariant,visual:variant?.visual,sound:variant?.sound,damageType:effectVariant||undefined});if(target.conditions.includes('poisoned'))this.effect('condition:poisoned',actor,target,{visual:'poison-aura',sound:'poison'});if((healing||temporaryHp)>0)this.effect('system:healing',actor,target,{visual:'healing-aura',sound:'healing'});if(target.hp===0)this.defeat(target,{reason:'power',killerId:actor.id});const user=this.powerUser(power,actor);if(user&&String(user.usage||'').toLowerCase()!=='unlimited'&&!String(power.kind||'').toLowerCase().includes('cantrip'))actor.powerUses[power.id]=Number(actor.powerUses[power.id]||0)+1;if(/bonus action/i.test(power.activation||''))actor.bonusUsed=true;else actor.actionUsed=true;this.logEvent('power_resolved',{actorId:actor.id,targetId:target.id,powerId:power.id,effectVariant,attack:rolls.attack||null,save:rolls.save||null,saveSucceeded,damage,healing,temporaryHp,revealed});return {power,target,attackHit,saveSucceeded,damage,healing,temporaryHp,revealed,effectVariant};}
  redistributeEvidenceCards(defeated){const cards=defeated.cards.splice(0);if(!cards.length)return [];const living=this.actors.filter(a=>a.id!==defeated.id&&a.status==='alive'),original=new Map(living.map(a=>[a.id,a.cards.length])),out=[];while(cards.length&&living.length){const below=living.filter(a=>a.cards.length<5),pool=below.length?below:living,pick=pool.slice().sort((a,b)=>(original.get(a.id)-original.get(b.id))||(a.cards.length-b.cards.length)||a.name.localeCompare(b.name))[0],card=cards.shift();pick.cards.push(card);out.push({participantId:pick.id,cardId:card.card_id,newHandSize:pick.cards.length});}this.logEvent('evidence_redistributed',{defeatedId:defeated.id,distribution:deepClone(out),targetHandSize:5});return out;}
  defeat(entity,details={}){if(entity.status==='ghost'||entity.status==='defeated')return;let distribution=[];if(entity.type==='character'&&this.mode==='cooperative'&&!entity.openingVictim)distribution=this.redistributeEvidenceCards(entity);entity.status=entity.type==='character'?'ghost':'defeated';entity.hp=0;if(entity.type==='character'){entity.ghost=true;entity.conditions=[];entity.cards=[];}this.effect(entity.type==='monster'?'death:monster':'death:character',entity,entity,{visual:'death-burst',sound:entity.type==='monster'?'death_monster':'death_character',entityType:entity.type});this.logEvent('entity_defeated',{entityId:entity.id,state:entity.status,distribution,...details});}
  playEnvironment(name){this.emit('sound',{name});}
  endTurn(){if(!this.turnOrder?.length)return this.humanActor();const current=this.currentActor();if(current){current.movementRemaining=0;current.actionUsed=false;current.bonusUsed=false;}let guard=0;do{this.turnIndex=(this.turnIndex+1)%this.turnOrder.length;if(this.turnIndex===0)this.round++;guard++;}while(guard<this.turnOrder.length&&this.currentActor()?.status==='defeated');this.pending=null;this.logEvent('turn_ended',{actorId:current?.id,nextActorId:this.currentActor()?.id,round:this.round});this.updateVision();return this.currentActor();}
  async runAICycle(roller){let guard=0;while(this.currentActor()&&!this.currentActor().human&&guard++<30){const a=this.currentActor();if(a.type==='character')await this.botTurn(a,roller);else await this.monsterTurn(a,roller);this.endTurn();}this.emit('state',{state:this.publicState()});}
  async botTurn(bot,roller){if(bot.ghost){const move=await roller(this.movementContext(bot));this.setMovement(bot.id,move.total);const cells=this.reachable(bot.id).cells;if(cells.length)this.move(bot.id,choice(cells));return;}const targets=this.monsters.filter(m=>m.active&&!m.hidden&&m.status==='alive'&&m.floor===bot.floor).sort((a,b)=>(Math.abs(a.x-bot.x)+Math.abs(a.y-bot.y))-(Math.abs(b.x-bot.x)+Math.abs(b.y-bot.y))),move=await roller(this.movementContext(bot));this.setMovement(bot.id,move.total);if(targets.length){const t=targets[0],r=this.reachable(bot.id),dest=r.cells.sort((a,b)=>(Math.abs(a.x-t.x)+Math.abs(a.y-t.y))-(Math.abs(b.x-t.x)+Math.abs(b.y-t.y)))[0];if(dest)this.move(bot.id,dest);if(Math.abs(t.x-bot.x)+Math.abs(t.y-bot.y)<=6){const ctx=this.attackContext(t.id,bot),ar=await roller(ctx.attack),dr=(ar.results?.includes(20)||ar.total>=t.ac)?await roller(ctx.damage):{expression:ctx.damage.expression,results:[],total:0};this.applyAttack(bot.id,t.id,ar,dr,ctx);}}else{const cells=this.reachable(bot.id).cells;if(cells.length)this.move(bot.id,choice(cells));}}
  async monsterTurn(monster,roller){if(!monster.active||monster.status!=='alive')return;this.effect(`monster-move:${monster.monsterId}`,monster,monster,{visual:'monster-move'});const candidates=this.actors.filter(a=>a.status==='alive'&&a.floor===monster.floor).sort((a,b)=>(Math.abs(a.x-monster.x)+Math.abs(a.y-monster.y))-(Math.abs(b.x-monster.x)+Math.abs(b.y-monster.y))),mv=await roller(this.movementContext(monster));this.setMovement(monster.id,mv.total);const target=candidates[0];if(target){const cells=this.reachable(monster.id).cells.sort((a,b)=>(Math.abs(a.x-target.x)+Math.abs(a.y-target.y))-(Math.abs(b.x-target.x)+Math.abs(b.y-target.y)));if(cells[0])this.move(monster.id,cells[0]);if(Math.abs(target.x-monster.x)+Math.abs(target.y-monster.y)<=1){const ctx=this.attackContext(target.id,monster),ar=await roller(ctx.attack),hit=ar.results?.includes(20)||ar.total>=target.ac,dr=hit?await roller(ctx.damage):{expression:ctx.damage.expression,results:[],total:0};let sr=null,xr=null;if(hit&&ctx.save){sr=await roller(ctx.save);if(sr.total<ctx.save.dc&&ctx.secondaryDamage)xr=await roller(ctx.secondaryDamage);}this.applyAttack(monster.id,target.id,ar,dr,{...ctx,saveContext:ctx.save,saveRoll:sr,secondaryRoll:xr,secondaryType:ctx.secondaryDamage?.type});}}}
  toggleEquip(itemId){const a=this.humanActor(),item=a.inventory.find(i=>String(i.id)===String(itemId));if(!item)throw new Error('Item not found.');item.equipped=!item.equipped;this.logEvent(item.equipped?'item_equipped':'item_unequipped',{actorId:a.id,itemId:item.id});return item;}
  sendMessage(text,channel='game',recipientId=''){const m={id:randomId('msg'),senderId:this.humanHero,senderName:this.humanActor().name,text:String(text).slice(0,1800),channel,recipientId,at:new Date().toISOString()};this.messages.push(m);this.logEvent('message_sent',{messageId:m.id,channel,recipientId});return m;}
  formalAccusation({suspect,weapon,room}){const a=this.humanActor(),cell=this.graph.getCell(a.floor,a.x,a.y);if(cell?.roomId!=='foyer')throw new Error('Formal accusations are only legal in the Foyer lobby area.');const correct=suspect===this.solution.suspect&&weapon===this.solution.weapon&&room===this.solution.room;this.accusation={by:a.id,suspect,weapon,room,correct,at:new Date().toISOString()};this.status=correct?'ended':this.status;this.logEvent('formal_accusation',this.accusation);return this.accusation;}
  castVote(targetId){const a=this.humanActor(),cell=this.graph.getCell(a.floor,a.x,a.y);if(cell?.roomId!=='foyer')throw new Error('Formal voting is only legal in the Foyer lobby area.');if(this.votes[a.id])throw new Error('This participant already voted.');this.votes[a.id]=targetId;this.logEvent('vote_cast',{voterId:a.id,targetId});return deepClone(this.votes);}
}
window.KITKRuntime={key,rollFormula,parseFormula,MapGraph,LocalGame,normalizeMonsterId};
}());
