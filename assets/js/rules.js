export const ABILITIES = ['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'];
export const SKILL_ABILITY = {
  Acrobatics:'Dexterity','Animal Handling':'Wisdom',Arcana:'Intelligence',Athletics:'Strength',Deception:'Charisma',
  History:'Intelligence',Insight:'Wisdom',Intimidation:'Charisma',Investigation:'Intelligence',Medicine:'Wisdom',Nature:'Intelligence',
  Perception:'Wisdom',Performance:'Charisma',Persuasion:'Charisma',Religion:'Intelligence','Sleight of Hand':'Dexterity',Stealth:'Dexterity',Survival:'Wisdom'
};
export const XP_THRESHOLDS = [0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000];

export const mod = score => Math.floor((Number(score)-10)/2);
export const signed = n => Number(n)>=0 ? `+${Number(n)}` : `${Number(n)}`;
export const proficiency = level => 2 + Math.floor((Math.max(1,level)-1)/4);

export function abilityScores(character, level) {
  const base = Array.isArray(character.baseAbilities)
    ? Object.fromEntries(character.baseAbilities.map((name,index)=>[name, [15,14,13,12,10,8][index] ?? 10]))
    : { ...character.baseAbilities };
  for (const entry of character.asi || []) {
    if (entry.level <= level) for (const [ability,amount] of Object.entries(entry.changes || {})) base[ability] = Math.min(20,(base[ability]||10)+amount);
  }
  return base;
}

export function maxHp(character, level, scores=abilityScores(character,level)) {
  const con = mod(scores.Constitution || 10);
  const hitDie = Number(character.hitDie || 8);
  return Math.max(1, hitDie + con + Number(character.hpBonusPerLevel||0) + (level-1)*(Math.floor(hitDie/2)+1+con+Number(character.hpBonusPerLevel||0)));
}

export function derivedCharacter(character, level=3, xp=900) {
  const scores = abilityScores(character,level), prof = proficiency(level), hp = maxHp(character,level,scores);
  const saves = Object.fromEntries(ABILITIES.map(a=>[a, mod(scores[a])+((character.saveProficiencies||[]).includes(a)?prof:0)]));
  const skills = Object.fromEntries(Object.entries(SKILL_ABILITY).map(([skill,a])=>[skill,mod(scores[a])+((character.skillProficiencies||[]).includes(skill)?prof:0)]));
  const features=(character.features||[]).filter(x=>Number(x.level||1)<=level);
  const spells=(character.spells||[]).filter(x=>Number(x.minimumLevel||x.levelRequired||1)<=level);
  const next=XP_THRESHOLDS[Math.min(19,level)] ?? XP_THRESHOLDS[19];
  const previous=XP_THRESHOLDS[Math.max(0,level-1)] ?? 0;
  return { ...character, level, xp, scores, prof, hp, saves, skills, features, spells, xpPrevious:previous, xpNext:next, xpPercent: next===previous?100:Math.max(0,Math.min(100,(xp-previous)/(next-previous)*100)) };
}

export function parseDice(expression) {
  const clean=String(expression).replace(/\s+/g,'').toLowerCase();
  const match=clean.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) throw new Error('Use dice notation such as 1d20+5.');
  const count=Math.max(1,Math.min(100,Number(match[1]||1))), sides=Math.max(2,Math.min(1000,Number(match[2]))), bonus=Number(match[3]||0);
  return { count,sides,bonus,expression:`${count}d${sides}${bonus?signed(bonus):''}` };
}

export function rollDice(expression, mode='normal') {
  const spec=parseDice(expression);
  const one=()=>Array.from({length:spec.count},()=>Math.floor(Math.random()*spec.sides)+1);
  let rolls=one(), alternate=null;
  if (mode!=='normal' && spec.count===1 && spec.sides===20) {
    alternate=one();
    const a=rolls[0],b=alternate[0];
    rolls=[mode==='advantage'?Math.max(a,b):Math.min(a,b)];
  }
  const total=rolls.reduce((a,b)=>a+b,0)+spec.bonus;
  return { ...spec, rolls, alternate, mode, total, critical:spec.sides===20&&spec.count===1&&rolls[0]===20, fumble:spec.sides===20&&spec.count===1&&rolls[0]===1 };
}

export function randomId(prefix='id') { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
export function shuffle(items) { const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
export function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
export function cardinal(deg){ return ['North','East','South','West'][((Math.round(deg/90)%4)+4)%4]; }
