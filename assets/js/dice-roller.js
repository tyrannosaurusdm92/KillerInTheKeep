
import {parseDice, rollDice, signed} from './rules.js';

const THEMES={
 daltu:{base:'#4b2414',base2:'#ca6309',ink:'#fff4d6',edge:'#ffbd63',glow:'#ff7a00'},
 eilvyre:{base:'#09294a',base2:'#2396ff',ink:'#f4fbff',edge:'#9dd8ff',glow:'#61b9ff'},
 xun:{base:'#2f1610',base2:'#a83b2b',ink:'#fff3dd',edge:'#f1c76b',glow:'#ff6a43'},
 gunnus:{base:'#1d2616',base2:'#738b35',ink:'#fffbdc',edge:'#c0dc72',glow:'#a3d743'},
 joknos:{base:'#082e2e',base2:'#00a6a6',ink:'#f0ffff',edge:'#00ffff',glow:'#00ffff'},
 korbin:{base:'#20293a',base2:'#d6aa42',ink:'#fffdf0',edge:'#ffe695',glow:'#ffd86a'},
 monk:{base:'#252525',base2:'#7e8d92',ink:'#ffffff',edge:'#d4f7ff',glow:'#8eeaff'},
 noldrack:{base:'#102c1e',base2:'#328550',ink:'#f3ffe8',edge:'#9ce08d',glow:'#61d36e'}
};
const SOUNDS=['freesound_community-dice-throw-38476.mp3','freesound_community-rpg-dice-rolling-95182.mp3','u_ngsgp0r6zb-dice-roll-201898.mp3','u_qpfzpydtro-dice-142528.mp3'].map((name,i)=>({name:`Keep roll ${i+1}`,url:`assets/audio/dice/${name}`}));

export class ImmersiveDiceRoller{
 constructor({stage,result,onResult}){this.stage=stage;this.result=result;this.onResult=onResult;this.box=null;this.character=null;this.ready=false;this.pending=null;this.resizeObserver=null}
 init(){if(this.ready)return true;if(!window.DICE||!window.THREE||!window.CANNON){this.result.textContent='3D dice libraries did not load. Accessible numeric fallback is active.';return false}try{window.DICE.set_sound_pool(SOUNDS);this.box=new window.DICE.dice_box(this.stage);this.box.bind_swipe(this.stage,null,n=>this.finish(n));this.resizeObserver=new ResizeObserver(()=>{if(this.box&&this.stage.clientWidth&&this.stage.clientHeight)this.box.reinit(this.stage)});this.resizeObserver.observe(this.stage);this.ready=true;this.setCharacter(this.character);return true}catch(error){console.error(error);this.result.textContent='WebGL dice could not start. Accessible numeric fallback is active.';return false}}
 setCharacter(character){this.character=character||this.character;if(!this.character)return;const t=THEMES[this.character.id]||THEMES.joknos;if(window.DICE){window.DICE.set_theme_pool([{slug:`kitk-${this.character.id}`,name:`${this.character.shortName||this.character.name} dice`,description:'Character-bound Killer In The Keep physical dice',...t}])}}
 activate(){this.init();requestAnimationFrame(()=>{if(this.box&&this.stage.clientWidth&&this.stage.clientHeight)this.box.reinit(this.stage)})}
 roll(expression='1d20',mode='normal',label='Dice Roll'){
  let spec;try{spec=parseDice(expression)}catch(error){this.result.textContent=error.message;return Promise.reject(error)}
  this.activate();this.pending={spec,mode,label,resolve:null,reject:null};
  const animationExpression=(mode!=='normal'&&spec.count===1&&spec.sides===20)?`2d20`:`${spec.count}d${spec.sides}`;
  this.result.innerHTML=`Rolling <strong>${animationExpression}${spec.bonus?signed(spec.bonus):''}</strong> for ${label}…`;
  if(!this.ready||!this.box){const fallback=rollDice(expression,mode);this.present({...fallback,label,visualRolls:fallback.rolls});return Promise.resolve(fallback)}
  this.box.setDice(animationExpression);return new Promise((resolve,reject)=>{this.pending.resolve=resolve;this.pending.reject=reject;this.box.start_throw(null,n=>this.finish(n))})
 }
 finish(notation){if(!this.pending)return;const {spec,mode,label,resolve}=this.pending;const visualRolls=(notation.result||[]).map(Number);let chosen=visualRolls;let total;
  if(mode!=='normal'&&spec.count===1&&spec.sides===20){const natural=mode==='advantage'?Math.max(...visualRolls):Math.min(...visualRolls);chosen=[natural];total=natural+spec.bonus}else total=visualRolls.reduce((a,b)=>a+b,0)+spec.bonus;
  const output={...spec,rolls:chosen,visualRolls,mode,total,label,critical:spec.sides===20&&spec.count===1&&chosen[0]===20,fumble:spec.sides===20&&spec.count===1&&chosen[0]===1};this.present(output);this.pending=null;resolve?.(output)
 }
 present(r){const compare=r.visualRolls?.length>1&&r.mode!=='normal'?` · physical dice ${r.visualRolls.join(' and ')} · ${r.mode} kept ${r.rolls[0]}`:'';this.result.innerHTML=`<strong>${r.total}</strong> · ${r.expression}${compare}${r.critical?' · Critical!':''}${r.fumble?' · Natural 1':''}`;this.onResult?.(r)}
}
