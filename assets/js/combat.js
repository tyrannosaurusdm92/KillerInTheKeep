import {rollDice,mod,randomId} from './rules.js';

export class CombatEngine {
  constructor(store,resources,onLog){this.store=store;this.resources=resources;this.onLog=onLog}
  state(){return this.store.state.session.combat}
  start(character){
    this.store.update(s=>{const c=s.session.combat;c.active=true;c.round=1;c.turnIndex=0;c.log=[];const playerRoll=rollDice(`1d20+${mod(character.scores.Dexterity)}`).total;c.initiative=[{id:s.session.playerId,name:character.name,type:'player',initiative:playerRoll,hp:character.hp,maxHp:character.hp},...c.monsters.map(m=>({...m,initiative:rollDice(`1d20+${m.initiativeBonus||0}`).total}))].sort((a,b)=>b.initiative-a.initiative)},'combat-start');
    this.log('Encounter started. Initiative rolled.');
  }
  addMonster(monster){
    const hp=monster.hitPoints||monster.hp||Math.max(6,Math.floor(Math.random()*18)+8);const entity={id:randomId('monster'),monsterId:monster.id,name:monster.name,type:'monster',hp,maxHp:hp,ac:monster.ac||12,initiativeBonus:monster.initiativeBonus||1};
    this.store.update(s=>s.session.combat.monsters.push(entity),'monster-add');this.log(`${monster.name} enters the encounter.`);return entity;
  }
  next(){this.store.update(s=>{const c=s.session.combat;if(!c.active||!c.initiative.length)return;c.turnIndex++;if(c.turnIndex>=c.initiative.length){c.turnIndex=0;c.round++}s.session.movedFeet=0},'combat-turn')}
  attack(attackerName,target,attackBonus=4,damage='1d8+2'){
    const attack=rollDice(`1d20+${attackBonus}`),hit=attack.critical||attack.total>=Number(target.ac||10);let dealt=0;if(hit){const d=rollDice(damage);dealt=d.total*(attack.critical?2:1);this.store.update(s=>{const monster=s.session.combat.monsters.find(m=>m.id===target.id);if(monster)monster.hp=Math.max(0,monster.hp-dealt)},'combat-damage')};this.log(`${attackerName} ${hit?'hits':'misses'} ${target.name} (${attack.total})${hit?` for ${dealt} damage`:''}.`);return{attack,hit,dealt}}
  end(){this.store.update(s=>{s.session.combat.active=false;s.session.combat.round=0;s.session.combat.turnIndex=0;s.session.combat.initiative=[]},'combat-end');this.log('Encounter ended.')}
  log(text){this.store.update(s=>s.session.combat.log.push({time:new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}),text}),'combat-log');this.onLog?.(text)}
}
