const MOVE_KEYS={KeyW:'forward',ArrowUp:'forward',Numpad8:'forward',KeyS:'back',ArrowDown:'back',Numpad2:'back',KeyQ:'left',KeyE:'right',KeyA:'turnLeft',ArrowLeft:'turnLeft',Numpad4:'turnLeft',KeyD:'turnRight',ArrowRight:'turnRight',Numpad6:'turnRight'};
const UI_SELECTOR='button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
export class InputController{
  constructor(actions={}){this.actions=actions;this.keys=new Set();this.bound=false;this.lastMove=0;this.lastUi=0;this.lastButtons=[];this.deadzone=.36;this.repeatMs=145;this.gamepad=null}
  bind(){if(this.bound)return;this.bound=true;window.addEventListener('keydown',e=>this.keyDown(e));window.addEventListener('keyup',e=>this.keys.delete(e.code));window.addEventListener('blur',()=>this.keys.clear());window.addEventListener('gamepadconnected',e=>this.setGamepad(e.gamepad));window.addEventListener('gamepaddisconnected',()=>this.setGamepad(null));this.loop()}
  setGamepad(gp){this.gamepad=gp?{index:gp.index,id:gp.id,mapping:gp.mapping||'generic'}:null;this.actions.gamepadStatus?.(this.gamepad)}
  keyDown(e){
    const editing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);if(editing&&e.code!=='Escape')return;
    const shortcuts={KeyM:'map',KeyC:'character',KeyB:'cards',KeyJ:'journal',KeyR:'dice',KeyP:'multiplayer',KeyF:'interact',Space:'jump',KeyZ:'crouch',KeyN:'sneak',Escape:'escape',Enter:'confirm',NumpadEnter:'interact'};
    if(shortcuts[e.code]){e.preventDefault();this.actions[shortcuts[e.code]]?.(e)}
    if(MOVE_KEYS[e.code]){e.preventDefault();this.keys.add(e.code);this.actions.focusMap?.();this.fireMove(MOVE_KEYS[e.code],e.shiftKey);this.lastMove=performance.now()}
  }
  fireMove(action,sprint=false){this.actions[action]?.({sprint})}
  loop(now=performance.now()){
    if(now-this.lastMove>this.repeatMs){const code=Object.keys(MOVE_KEYS).find(k=>this.keys.has(k));if(code){this.fireMove(MOVE_KEYS[code],this.keys.has('ShiftLeft')||this.keys.has('ShiftRight'));this.lastMove=now}}
    this.pollGamepads(now);requestAnimationFrame(t=>this.loop(t))
  }
  pollGamepads(now){const pads=Array.from(navigator.getGamepads?.()||[]).filter(Boolean);const gp=pads.find(p=>p.index===this.gamepad?.index)||pads[0];if(!gp){if(this.gamepad)this.setGamepad(null);return}if(!this.gamepad||this.gamepad.index!==gp.index)this.setGamepad(gp);
    const pressed=gp.buttons.map(b=>!!b.pressed),edge=i=>pressed[i]&&!this.lastButtons[i],axis=(i)=>Number(gp.axes[i]||0),gameplay=this.actions.isGameplayActive?.()!==false;
    if(gameplay&&now-this.lastMove>this.repeatMs){const lx=axis(0),ly=axis(1),rx=axis(2);const sprint=pressed[10];if(Math.abs(ly)>this.deadzone)this.fireMove(ly<0?'forward':'back',sprint);else if(Math.abs(lx)>this.deadzone)this.fireMove(lx<0?'left':'right',sprint);else if(Math.abs(rx)>this.deadzone)this.fireMove(rx<0?'turnLeft':'turnRight');if(Math.abs(ly)>this.deadzone||Math.abs(lx)>this.deadzone||Math.abs(rx)>this.deadzone)this.lastMove=now}
    if(edge(2))this.actions.interact?.();if(edge(0))this.actions.confirm?.();if(edge(1))this.actions.escape?.();if(edge(3))this.actions.inspect?.();if(edge(4))this.actions.secondary?.();if(edge(5))this.actions.primary?.();if(edge(6))this.actions.dice?.();if(edge(7))this.actions.primary?.();if(edge(8))this.actions.character?.();if(edge(9))this.actions.cards?.();if(edge(10))this.actions.sneak?.();if(edge(11))this.actions.search?.();
    if(edge(12))this.navigateUi('up');if(edge(13))this.actions.map?.();if(edge(14))this.navigateUi('left');if(edge(15))this.navigateUi('right');
    // Left-stick UI navigation works anywhere that the shared map is not focused.
    if(!gameplay&&now-this.lastUi>220){const lx=axis(0),ly=axis(1);if(Math.abs(ly)>.72){this.navigateUi(ly<0?'up':'down');this.lastUi=now}else if(Math.abs(lx)>.72){this.navigateUi(lx<0?'left':'right');this.lastUi=now}}
    this.lastButtons=pressed;
  }
  navigateUi(direction){const root=document.querySelector('.page.active')||document;const nodes=[...root.querySelectorAll(UI_SELECTOR)].filter(el=>el.offsetParent!==null);if(!nodes.length)return;const current=document.activeElement,index=Math.max(0,nodes.indexOf(current));let next=index+(direction==='up'||direction==='left'?-1:1);next=(next+nodes.length)%nodes.length;nodes[next].focus({preventScroll:false});nodes[next].scrollIntoView({block:'nearest',inline:'nearest'})}
}
