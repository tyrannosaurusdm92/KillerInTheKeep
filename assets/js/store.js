const STORAGE_KEY = 'killerInTheKeep.v1';

export class GameStore extends EventTarget {
  constructor(resources) {
    super();
    this.resources = resources;
    this.state = this.load();
  }

  defaults() {
    const cfg = this.resources.config;
    return {
      version: cfg.version,
      selectedCharacterId: cfg.defaultCharacterId,
      level: 3,
      xp: 900,
      backendUrl: cfg.backendUrl || '',
      activePage: 'home',
      sheetTab: 'overview',
      settings: { reducedMotion:false, highContrast:false, largeText:false, gridLabels:true, scale:100, controllerDeadzone:36 },
      account: { token:'', player:null, expiresAt:'' },
      online: { lobby:null, matchId:'', match:null, chat:[], clientSequence:0, lastSyncAt:'' },
      session: {
        mode:'offline', phase:'lobby', started:false, mapId:cfg.defaultMapId, floor:'F1', zoom:1,
        playerId:'local-player', role:null, seed:null, party:[], hand:[], archive:[], evidence:[], objectives:[], feed:[],
        positions:{}, entities:[], doors:{}, movedFeet:0, facing:0, crouched:false, sneaking:false, sprinting:false,
        combat:{ active:false, round:0, turnIndex:0, initiative:[], monsters:[], log:[] }
      },
      privateNotes: {},
      characterProgress: {}
    };
  }

  load() {
    const base = this.defaults();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      return deepMerge(base, JSON.parse(raw));
    } catch (error) {
      console.warn('Local save could not be loaded', error);
      return base;
    }
  }

  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); }
    catch (error) { console.warn('Local save could not be written', error); }
  }

  update(mutator, reason='state') {
    mutator(this.state);
    this.save();
    this.dispatchEvent(new CustomEvent('change', { detail:{ reason, state:this.state } }));
  }

  reset() {
    this.state = this.defaults();
    this.save();
    this.dispatchEvent(new CustomEvent('change', { detail:{ reason:'reset', state:this.state } }));
  }
}

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  for (const [key,value] of Object.entries(source)) {
    if (Array.isArray(value)) target[key] = value;
    else if (value && typeof value === 'object') target[key] = deepMerge(target[key] && typeof target[key] === 'object' ? target[key] : {}, value);
    else target[key] = value;
  }
  return target;
}
