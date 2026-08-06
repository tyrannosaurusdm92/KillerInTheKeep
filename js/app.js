(function(){
'use strict';
const DATA=window.KITK_DATA,Core=window.KITKRuntime;
if(!DATA||!Core)throw new Error('Killer in the Keep runtime data failed to load.');
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const storage={get:(k,d='')=>{try{return localStorage.getItem(k)??d}catch(_){return d}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}},del:k=>{try{localStorage.removeItem(k)}catch(_){}}};
const state={
  mapData:null,monsterData:null,effectsData:null,config:null,api:new KitkApi(DATA.backendUrl),local:true,user:null,token:'',gameId:'',game:null,onlineState:null,onlineRoster:[],
  floor:'first_floor',zoom:.72,pan:{x:0,y:0},mapDoc:null,overlay:null,effectOverlay:null,highlights:new Map(),selectedActorId:'',pendingDice:null,seenEffects:new Set(),
  currentChannel:'game',currentDeck:'evidence',tutorialIndex:0,installPrompt:null,controller:{x:24,y:28,lastButtons:{},lastMove:0},audio:{},busy:false
};
const els={
  authGate:$('#authGate'),backendStatus:$('#backendStatus'),authFeedback:$('#authFeedback'),gameShell:$('#gameShell'),connectionLabel:$('#connectionLabel'),
  lobbyDialog:$('#lobbyDialog'),lobbyFeedback:$('#lobbyFeedback'),gameTitle:$('#gameTitle'),gameCode:$('#gameCode'),turnBanner:$('#turnBanner'),
  floorTabs:$('#floorTabs'),mapObject:$('#mapObject'),mapTransform:$('#mapTransform'),boardViewport:$('#boardViewport'),boardNotice:$('#boardNotice'),
  floorReadout:$('#floorReadout'),cellReadout:$('#cellReadout'),roomReadout:$('#roomReadout'),diceSurface:$('#diceSurface'),zoomOutput:$('#zoomOutput'),
  partyList:$('#partyList'),monsterList:$('#monsterList'),roleCard:$('#roleCard'),selectedActorCard:$('#selectedActorCard'),contextActions:$('#contextActions'),
  actionTitle:$('#actionTitle'),actionDescription:$('#actionDescription'),diceAssignmentBadge:$('#diceAssignmentBadge'),rollLabel:$('#rollLabel'),rollTotal:$('#rollTotal'),
  objectActions:$('#objectActions'),combatTargets:$('#combatTargets'),inventoryList:$('#inventoryList'),messageList:$('#messageList'),messageInput:$('#messageInput'),
  messageRecipient:$('#messageRecipient'),recipientLabel:$('#recipientLabel'),deckTabs:$('#deckTabs'),deckSearch:$('#deckSearch'),cardGrid:$('#cardGrid'),
  tutorialSteps:$('#tutorialSteps'),licenseButtons:$('#licenseButtons'),licenseViewer:$('#licenseViewer'),rotateOverlay:$('#rotateOverlay'),controllerCursor:$('#controllerCursor')
};
function toast(message,kind=''){const d=document.createElement('div');d.className=`toast ${kind}`;d.textContent=message;$('#toastRegion').appendChild(d);setTimeout(()=>d.remove(),5000);}
function feedback(el,message,kind=''){el.textContent=message||'';el.className=`feedback ${kind}`;}
function formObject(form){return Object.fromEntries(new FormData(form).entries());}
function setBusy(flag){state.busy=flag;document.body.classList.toggle('is-busy',flag);}
function hero(id){return DATA.heroes.find(h=>h.id===id)||DATA.heroes[0];}
function currentLocalState(){return state.game?.publicState()||null;}
function onlineActorFromToken(t){
  const h=hero(t.heroId),meId=state.onlineState?.me?.token?.participantId,roster=state.onlineRoster.find(p=>p.id===t.participantId)||{};
  return {id:t.participantId,participantId:t.participantId,seat:t.seat,userId:roster.userId||'',heroId:t.heroId,name:roster.displayName||h.display_name||h.name,type:'character',human:t.participantId===meId,bot:roster.kind==='bot',color:h.accent,token:`assets/svg/tokens/characters/${t.heroId}.svg`,floor:t.floor,x:t.x,y:t.y,hp:t.hp,maxHp:t.maxHp,ac:t.ac,status:t.alive?'alive':'defeated',ghost:!!t.ghost,conditions:t.conditions||[],movementRemaining:t.movementRemaining||0,privateRole:t.participantId===meId?state.onlineState?.me?.private?.role:'hidden'};
}
function normalizedOnlineState(){
  const r=state.onlineState;if(!r)return null;const actors=(r.tokens||[]).map(onlineActorFromToken),monsters=(r.monsters||[]).map(m=>({id:m.id,monsterId:m.cardId,name:m.title||m.cardId||'Monster',type:'monster',bot:true,color:'#79502e',token:`assets/svg/tokens/monsters/${String(m.cardId||'spider').replace(/^monsters-deck-/,'').replace(/-monster-card$/,'').replace(/^monster[_-]/,'').replaceAll('_','-')}.svg`,floor:m.floor,x:m.x,y:m.y,hp:m.hp,maxHp:m.maxHp,ac:m.ac,status:m.alive?'alive':'defeated',conditions:m.conditions||[],surface:m.surface||'floor',active:m.active,hidden:m.hidden}));
  const current=actors.find(a=>a.seat===r.turn?.seat)||actors.find(a=>a.participantId===r.me?.token?.participantId);
  return {id:r.gameId,status:r.status,mode:r.mode,round:r.turn?.round||1,turnActorId:current?.id||r.me?.token?.participantId,revision:r.revision,actors,monsters,effects:r.effects||[],initiativeRolls:r.turn?.initiative||[],objects:[...(r.doors||[]).map(o=>({...o,type:'door',cell:{floor:o.floor,x:o.x,y:o.y},detected:!o.hidden})),...(r.traps||[]).map(o=>({...o,type:'trap',cell:{floor:o.floor,x:o.x,y:o.y},detected:!o.hidden,disarmed:!o.armed})),...(r.containers||[]).map(o=>({...o,type:'container',cell:{floor:o.floor,x:o.x,y:o.y},detected:!o.hidden,looted:!!o.opened}))],visible:r.knowledge?.visible||[],explored:r.knowledge?.explored||[],log:r.eventTail||[],messages:[]};
}
function currentState(){return state.local?currentLocalState():normalizedOnlineState();}
function humanActor(){return state.local?state.game?.humanActor():currentState()?.actors?.find(a=>a.human);}
function entity(id){return state.local?state.game?.entity(id):[...(currentState()?.actors||[]),...(currentState()?.monsters||[])].find(x=>x.id===id);}
function floorInfo(id){return Object.values(state.mapData?.floors||{}).find(f=>f.id===id);}
function cellAt(f,x,y){return state.local?state.game.graph.getCell(f,x,y):state.mapData?.floors?.[f]?.cells.find(c=>c.x===x&&c.y===y);}
function roomName(roomId){for(const f of Object.values(state.mapData?.floors||{})){const r=f.rooms.find(x=>x.id===roomId);if(r)return r.name;}return roomId?roomId.replaceAll('_',' '):'Hallway';}
function openLobby(){if(!els.lobbyDialog.open)els.lobbyDialog.showModal();}
function closeLobby(){if(els.lobbyDialog.open)els.lobbyDialog.close();}

async function loadRuntimeData(){
  const [mapData,monsterData,effectsData,config]=await Promise.all([
    fetch('json/runtime/map-interactions.json').then(r=>r.json()),fetch('json/runtime/monsters.json').then(r=>r.json()),fetch('json/runtime/effects.json').then(r=>r.json()),fetch('json/runtime/build-config.json').then(r=>r.json())
  ]);state.mapData=mapData;state.monsterData=monsterData;state.effectsData=effectsData;state.config=config;window.KITKEffects?.configure(effectsData,config.audio);buildFloorTabs();buildHeroSelect();buildCaseSelects();buildDecks();buildTutorial();buildLicenses();
}
async function checkBackend(){
  try{const c=await state.api.health();els.backendStatus.textContent=`Designated backend reachable · V${c.version||c.backendVersion||'2'} authoritative runtime`;els.backendStatus.classList.add('success');}
  catch(e){els.backendStatus.textContent='Designated backend could not be verified from this browser. Offline test remains available.';}
}
function rememberOnlineSession(result){
  const token=result?.session?.token||result?.token;if(!token)throw new Error('The backend did not return a session token.');
  state.local=false;state.token=token;state.user=result.user||result.account||{};state.api.setToken(token);storage.set('kitk.token',token);storage.set('kitk.user',JSON.stringify(state.user));
  els.authGate.hidden=true;els.gameShell.hidden=false;els.connectionLabel.textContent=`Signed in as ${state.user.displayName||state.user.username||'player'}`;$$('.online-only').forEach(x=>x.hidden=false);openLobby();
}
function startOfflineProfile(){
  state.local=true;state.user={id:'local-user',displayName:'Offline Tester',username:'offline'};els.authGate.hidden=true;els.gameShell.hidden=false;els.connectionLabel.textContent='Offline authoritative test profile';$$('.online-only').forEach(x=>x.hidden=true);openLobby();
}
async function restoreSession(){
  const token=storage.get('kitk.token');if(!token)return false;state.api.setToken(token);
  try{const r=await state.api.refresh();rememberOnlineSession({session:{token:r.session?.token||token},user:r.user});return true;}catch(_){storage.del('kitk.token');storage.del('kitk.user');return false;}
}

function loadGoogleIdentityServices(){
  if(window.google?.accounts?.id)return Promise.resolve(window.google);
  return new Promise((resolve,reject)=>{const existing=document.querySelector('script[data-kitk-google]');if(existing){existing.addEventListener('load',()=>resolve(window.google),{once:true});existing.addEventListener('error',()=>reject(new Error('Google Identity Services could not load.')),{once:true});return;}const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.dataset.kitkGoogle='true';script.onload=()=>resolve(window.google);script.onerror=()=>reject(new Error('Google Identity Services could not load.'));document.head.appendChild(script);});
}
async function beginGoogleSignIn(){
  if(!state.config?.googleClientId){feedback(els.authFeedback,'Google sign-in is backend-supported, but a Google OAuth client ID must be entered in json/runtime/build-config.json for this deployment.','error');return;}
  try{const google=await loadGoogleIdentityServices();google.accounts.id.initialize({client_id:state.config.googleClientId,callback:async response=>{try{rememberOnlineSession(await state.api.google(response.credential));feedback(els.authFeedback,'','');}catch(err){feedback(els.authFeedback,err.message,'error');}}});google.accounts.id.prompt(notification=>{if(notification.isNotDisplayed?.()||notification.isSkippedMoment?.())feedback(els.authFeedback,'Google sign-in was not displayed. Check the authorized origin and OAuth client configuration.','error');});}catch(err){feedback(els.authFeedback,err.message,'error');}
}

function bindAuthentication(){
  $$('[data-auth-page]').forEach(b=>b.addEventListener('click',()=>{$$('[data-auth-page]').forEach(x=>x.classList.toggle('is-active',x===b));$$('[data-auth-panel]').forEach(p=>p.classList.toggle('is-active',p.dataset.authPanel===b.dataset.authPage));}));
  $$('.show-password').forEach(b=>b.addEventListener('click',()=>{const input=b.parentElement.querySelector('input');input.type=input.type==='password'?'text':'password';b.textContent=input.type==='password'?'Show':'Hide';}));
  $('#signinForm').addEventListener('submit',async e=>{e.preventDefault();feedback(els.authFeedback,'Signing in…');try{rememberOnlineSession(await state.api.login(formObject(e.currentTarget)));feedback(els.authFeedback,'');}catch(err){feedback(els.authFeedback,err.message,'error');}});
  $('#registerForm').addEventListener('submit',async e=>{e.preventDefault();feedback(els.authFeedback,'Creating account…');try{const r=await state.api.register(formObject(e.currentTarget));rememberOnlineSession(r);toast(r.verificationDelivery?.sent?'Account created. Check your email for the verification code.':'Account created. Verification delivery needs attention.','success');}catch(err){feedback(els.authFeedback,err.message,'error');}});
  $('#verifyForm').addEventListener('submit',async e=>{e.preventDefault();const v=formObject(e.currentTarget);try{await state.api.verifyEmail(v.email,v.code);feedback(els.authFeedback,'Email verified.','success');}catch(err){feedback(els.authFeedback,err.message,'error');}});
  $('#resendVerificationForm').addEventListener('submit',async e=>{e.preventDefault();const v=formObject(e.currentTarget);try{await state.api.resendVerification(v.email);feedback(els.authFeedback,'A replacement code was requested. Resend cooldowns still apply.','success');}catch(err){feedback(els.authFeedback,err.message,'error');}});
  $('#requestResetForm').addEventListener('submit',async e=>{e.preventDefault();const v=formObject(e.currentTarget);try{await state.api.requestPasswordReset(v.email);feedback(els.authFeedback,'If the account is eligible, a reset code was sent.','success');}catch(err){feedback(els.authFeedback,err.message,'error');}});
  $('#resetPasswordForm').addEventListener('submit',async e=>{e.preventDefault();const v=formObject(e.currentTarget);try{await state.api.resetPassword(v.email,v.code,v.newPassword);feedback(els.authFeedback,'Password reset. Sign in with the new password.','success');}catch(err){feedback(els.authFeedback,err.message,'error');}});
  $('#googleSignInButton').addEventListener('click',beginGoogleSignIn);
  $('#offlineProfileButton').addEventListener('click',startOfflineProfile);
}

function buildHeroSelect(){const s=$('#heroSelect');s.innerHTML=DATA.heroes.map(h=>`<option value="${esc(h.id)}">${esc(h.display_name||h.name)} · ${esc(h.class_name)}</option>`).join('');}
function buildFloorTabs(){
  els.floorTabs.innerHTML=state.config.floorOrder.map(id=>`<button data-floor="${id}">${esc(floorInfo(id)?.name||id)}</button>`).join('');
  $$('[data-floor]',els.floorTabs).forEach(b=>b.addEventListener('click',()=>setFloor(b.dataset.floor)));
}
function setFloor(id){
  if(!state.mapData?.floors?.[id])return;state.floor=id;$$('[data-floor]',els.floorTabs).forEach(b=>b.classList.toggle('is-active',b.dataset.floor===id));
  const f=floorInfo(id);els.floorReadout.textContent=f.name;els.mapObject.data=f.svg;state.mapDoc=null;state.overlay=null;state.effectOverlay=null;els.boardNotice.textContent=`Viewing ${f.name}. Select a highlighted legal destination or a token.`;
}
function buildCaseSelects(){
  const suspects=DATA.heroes.map(h=>`<option value="${h.id}">${esc(h.display_name||h.name)}</option>`).join('');
  const weapons=['dagger','poison','mace','wand','battleaxe','rapier','arrows','magical-staff'].map(x=>`<option value="${x}">${esc(x.replaceAll('-',' '))}</option>`).join('');
  const rooms=DATA.rooms.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('');
  $('#accusationForm [name=suspect]').innerHTML=suspects;$('#accusationForm [name=weapon]').innerHTML=weapons;$('#accusationForm [name=room]').innerHTML=rooms;$('#voteForm [name=target]').innerHTML=suspects;
}

async function localStart(values){
  state.game=new Core.LocalGame({data:DATA,mapData:state.mapData,monsterData:state.monsterData,mode:values.mode,humanHero:values.heroId,gameLevel:Number(values.gameLevel)});
  state.game.addEventListener('event',e=>{const t=e.detail.type.replaceAll('_',' ');els.boardNotice.textContent=t.charAt(0).toUpperCase()+t.slice(1);renderAll();});
  state.game.addEventListener('effect',e=>playGameEffect(e.detail));state.game.addEventListener('sound',e=>playEnvironment(e.detail.name));state.game.addEventListener('state',renderAll);
  state.gameId=state.game.id;state.selectedActorId=values.heroId;state.floor=state.game.humanActor().floor;els.gameTitle.textContent=values.name||'Killer in the Keep';els.gameCode.textContent='LOCAL';closeLobby();setFloor(state.floor);renderAll();startAmbience();
  toast('Rolling initiative for all eight characters before movement begins.');
  await state.game.rollOpeningInitiative(ctx=>physicalRoll(ctx));renderAll();
  const order=state.game.initiativeRolls.slice().sort((a,b)=>b.total-a.total).map(x=>`${x.name} ${x.total}`).join(' · ');toast(`Initiative order established: ${order}`,'success');
  const role=state.game.privateState(),message=role.role==='killer'?`Private role: Killer. Opening victim: ${entity(role.solution.openingVictimId)?.name||'hidden'}.`:role.role==='opening_victim'?'You are the off-screen opening victim and begin in Ghost Mode with no evidence hand.':'Private role assigned: investigator.';toast(message,'success');
  if(!state.game.currentActor()?.human)await state.game.runAICycle(ctx=>physicalRoll(ctx));renderAll();
}
function updateShareLink(){const input=$('#shareGameLink');if(!input)return;input.value=state.gameId?`${location.origin}${location.pathname}?game=${encodeURIComponent(state.gameId)}`:'';}
async function onlineCreate(values){
  const mode=values.mode==='full_pvp'?'full_pvp':'work_together';
  const result=await state.api.createGame({name:values.name,visibility:values.visibility,playstyle:mode,botDifficulty:'Standard',settings:{runtimeVersion:2,activeHiddenKiller:true,allowDirectPvP:mode==='full_pvp',gridWidth:48,gridHeight:32}});
  state.gameId=result.game?.id||result.id;els.gameCode.textContent=result.game?.code||'ONLINE';els.gameTitle.textContent=result.game?.name||values.name;
  const heroId=$('#heroSelect').value;try{await state.api.selectCharacter(state.gameId,heroId);await state.api.ready(state.gameId,true);}catch(_){/* V1 deployments may select through start. */}
  await state.api.startGame(state.gameId);const [boot,view]=await Promise.all([state.api.runtimeBootstrap(state.gameId),state.api.getGame(state.gameId)]);state.onlineState=boot.state||boot;state.onlineRoster=view.participants||[];state.selectedActorId=state.onlineState.me?.token?.participantId||'';closeLobby();els.connectionLabel.textContent='Online · backend-authoritative V2';updateShareLink();renderAll();
}
async function onlineJoin(values){const result=await state.api.joinGame({code:values.code,gameId:values.code});state.gameId=result.game?.id||result.gameId||values.code;els.gameCode.textContent=result.game?.code||values.code;const [snapshot,view]=await Promise.all([state.api.runtimeState(state.gameId),state.api.getGame(state.gameId)]);state.onlineState=snapshot.state||snapshot;state.onlineRoster=view.participants||[];updateShareLink();closeLobby();renderAll();}
function bindLobby(){
  $('#localGameForm').addEventListener('submit',async e=>{e.preventDefault();const v=formObject(e.currentTarget);try{if(state.local)await localStart(v);else await onlineCreate({...v,visibility:'private'});}catch(err){feedback(els.lobbyFeedback,err.message,'error');}});
  $('#createOnlineGameForm').addEventListener('submit',async e=>{e.preventDefault();try{await onlineCreate(formObject(e.currentTarget));}catch(err){feedback(els.lobbyFeedback,err.message,'error');}});
  $('#joinOnlineGameForm').addEventListener('submit',async e=>{e.preventDefault();try{await onlineJoin(formObject(e.currentTarget));}catch(err){feedback(els.lobbyFeedback,err.message,'error');}});
  $('#findGamesButton').addEventListener('click',async()=>{try{const r=await state.api.listGames({visibility:'public'}),games=r.games||r||[];$('#publicGames').innerHTML=games.map(g=>`<button type="button" data-join="${esc(g.id||g.code)}">${esc(g.name)} · ${esc(g.code||'')}</button>`).join('')||'<p class="microcopy">No public games were returned.</p>';$$('[data-join]',$('#publicGames')).forEach(b=>b.onclick=()=>onlineJoin({code:b.dataset.join}));}catch(err){feedback(els.lobbyFeedback,err.message,'error');}});
  $('#lobbyButton').addEventListener('click',openLobby);$('#closeLobbyButton').addEventListener('click',closeLobby);
  $('#friendSearchButton').addEventListener('click',async()=>{try{const q=$('#friendSearchInput').value.trim();if(!q)return;const r=await state.api.friendsSearch(q),users=r.users||r.results||r||[];$('#friendSearchResults').innerHTML=users.map(u=>`<div class="social-row"><span><strong>${esc(u.displayName||u.username||'Player')}</strong><br><small>${esc(u.username||u.id)}</small></span><span class="button-row"><button data-friend-request="${esc(u.id)}">Add</button><button class="secondary" data-block-user="${esc(u.id)}">Block</button></span></div>`).join('')||'<p class="microcopy">No matching players.</p>';$$('[data-friend-request]').forEach(b=>b.onclick=async()=>{await state.api.friendRequest(b.dataset.friendRequest);toast('Friend request sent.','success');});$$('[data-block-user]').forEach(b=>b.onclick=async()=>{await state.api.block(b.dataset.blockUser);toast('Player blocked.','success');});}catch(err){feedback(els.lobbyFeedback,err.message,'error');}});
  $('#refreshFriendsButton').addEventListener('click',refreshFriends);
  $('#copyGameLinkButton').addEventListener('click',async()=>{const v=$('#shareGameLink').value;if(!v)return toast('Create or join an online game first.','error');try{await navigator.clipboard.writeText(v);toast('Game link copied.','success');}catch(_){$('#shareGameLink').select();document.execCommand('copy');toast('Game link copied.','success');}});
  $('#reconnectGameButton').addEventListener('click',async()=>{if(!state.gameId)return toast('No online game to reconnect.','error');try{const snap=await state.api.runtimeState(state.gameId);state.onlineState=snap.state||snap;await state.api.heartbeat(state.gameId).catch(()=>{});renderAll();toast('Reconnected to the authoritative game state.','success');}catch(err){feedback(els.lobbyFeedback,err.message,'error');}});
}
async function refreshFriends(){try{const r=await state.api.friendsList(),friends=r.friends||r.accepted||r||[];$('#friendList').innerHTML=friends.map(f=>{const u=f.user||f;return `<div class="social-row"><span><strong>${esc(u.displayName||u.username||'Friend')}</strong></span><span class="button-row"><button data-invite-friend="${esc(u.id)}" ${state.gameId?'':'disabled'}>Invite</button><button class="secondary" data-remove-friend="${esc(u.id)}">Remove</button></span></div>`;}).join('')||'<p class="microcopy">No friends returned.</p>';$$('[data-invite-friend]').forEach(b=>b.onclick=async()=>{await state.api.invite(state.gameId,b.dataset.inviteFriend);toast('Game invitation sent.','success');});$$('[data-remove-friend]').forEach(b=>b.onclick=async()=>{await state.api.friendRemove(b.dataset.removeFriend);toast('Friend removed.','success');refreshFriends();});}catch(err){feedback(els.lobbyFeedback,err.message,'error');}}


function setupMapInteractions(){
  const doc=els.mapObject.contentDocument;if(!doc)return;state.mapDoc=doc;const svg=doc.documentElement,ns='http://www.w3.org/2000/svg';
  doc.querySelectorAll('.map-cell').forEach(cell=>{
    cell.style.cursor='pointer';cell.addEventListener('click',()=>handleCellClick({floor:state.floor,x:Number(cell.dataset.x),y:Number(cell.dataset.y),roomId:cell.dataset.roomId,coordinate:cell.dataset.coordinate,walkable:cell.dataset.walkable==='true'}));
    cell.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();cell.click();}});
  });
  let overlay=doc.getElementById('kitk-runtime-overlay');if(overlay)overlay.remove();overlay=doc.createElementNS(ns,'g');overlay.id='kitk-runtime-overlay';svg.appendChild(overlay);state.overlay=overlay;
  let effects=doc.getElementById('kitk-effects-overlay');if(effects)effects.remove();effects=doc.createElementNS(ns,'g');effects.id='kitk-effects-overlay';svg.appendChild(effects);state.effectOverlay=effects;window.KITKEffects?.setMap(doc,effects,state.floor);renderMapOverlay();
}
function svgEl(tag,attrs={}){const e=state.mapDoc.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));return e;}
function relativeTokenPath(path){return String(path).replace(/^assets\/svg\//,'../');}
function renderMapOverlay(){
  if(!state.overlay||!state.mapDoc)return;state.overlay.innerHTML='';const pub=currentState();if(!pub)return;
  const f=state.mapData.floors[state.floor],human=humanActor(),visible=new Set(pub.visible||[]),explored=pub.explored?.[human?.id]||{};
  const fogGroup=svgEl('g',{'pointer-events':'none'});
  f.cells.forEach(c=>{const k=Core.key(state.floor,c.x,c.y);if(visible.size&&visible.has(k))return;const r=svgEl('rect',{x:c.x*32,y:c.y*32,width:32,height:32,fill:'#020304',opacity:explored[k]?'.52':'.88'});fogGroup.appendChild(r);});state.overlay.appendChild(fogGroup);
  const lightGroup=svgEl('g',{'pointer-events':'none'});(f.lights||[]).filter(l=>l.active).forEach(l=>{const c=svgEl('circle',{cx:l.cell.x*32+16,cy:l.cell.y*32+16,r:l.radius*32,fill:'#f7c978',opacity:.14});lightGroup.appendChild(c);});state.overlay.appendChild(lightGroup);
  const hGroup=svgEl('g',{'pointer-events':'none'});for(const [k,c] of state.highlights){if(c.floor!==state.floor)continue;const r=svgEl('rect',{x:c.x*32+2,y:c.y*32+2,width:28,height:28,rx:6,fill:human?.color||'#00ffff',opacity:.42,stroke:human?.color||'#00ffff','stroke-width':2});hGroup.appendChild(r);}state.overlay.appendChild(hGroup);
  const entities=[...(pub.actors||[]),...(pub.monsters||[])].filter(a=>a.floor===state.floor&&a.status!=='defeated'&&a.status!=='dead'&&!a.hidden);
  entities.forEach(a=>{
    const g=svgEl('g',{transform:`translate(${a.x*32-8} ${a.y*32-16})`,class:'runtime-token','data-entity-id':a.id,tabindex:0,role:'button'});g.style.cursor='pointer';
    const img=svgEl('image',{href:relativeTokenPath(a.token||`assets/svg/tokens/${a.type==='monster'?'monsters/'+a.monsterId:'characters/'+a.heroId}.svg`),x:0,y:0,width:48,height:48,preserveAspectRatio:'xMidYMid meet'});g.appendChild(img);
    const bg=svgEl('rect',{x:2,y:45,width:44,height:5,rx:2,fill:'#28090d'}),hp=svgEl('rect',{x:2,y:45,width:44*Math.max(0,a.hp/a.maxHp),height:5,rx:2,fill:a.type==='monster'?'#b77b42':'#35d77d'});g.append(bg,hp);
    if(a.id===state.selectedActorId)g.appendChild(svgEl('circle',{cx:24,cy:24,r:25,fill:'none',stroke:'#fff','stroke-width':3}));
    g.addEventListener('click',e=>{e.stopPropagation();state.selectedActorId=a.id;renderAll();});g.addEventListener('keydown',e=>{if(e.key==='Enter')g.dispatchEvent(new Event('click'));});state.overlay.appendChild(g);
  });
}
function playGameEffect(detail={}){
  const source=detail.source?.id?entity(detail.source.id):detail.source,target=detail.target?.id?entity(detail.target.id):detail.target;
  const floor=detail.floor||target?.floor||source?.floor||state.floor,roomId=target?cellAt(target.floor,target.x,target.y)?.roomId:source?cellAt(source.floor,source.x,source.y)?.roomId:'';
  const roomCells=detail.roomCells||((state.mapData?.floors?.[floor]?.cells||[]).filter(c=>c.roomId===roomId).map(c=>({...c,floor})));
  window.KITKEffects?.play({...detail,source:source||detail.source,target:target||detail.target,floor,roomCells});
}
function renderOnlineEffects(){if(state.local)return;for(const fx of state.onlineState?.effects||[]){const id=fx.id||`${fx.type}:${fx.createdAt||fx.expiresAt||''}`;if(state.seenEffects.has(id))continue;state.seenEffects.add(id);playGameEffect({effectId:fx.effectId||fx.type||'generic',effectVariant:fx.effectVariant||'',source:entity(fx.sourceParticipantId||fx.sourceMonsterId||fx.sourceId),target:entity(fx.targetParticipantId||fx.targetMonsterId||fx.targetId),floor:fx.floor,x:fx.x,y:fx.y,roomId:fx.roomId||'',roomCells:fx.roomCells||[],visual:fx.visual,sound:fx.sound});}if(state.seenEffects.size>250)state.seenEffects=new Set(Array.from(state.seenEffects).slice(-100));}
async function handleCellClick(c){
  els.cellReadout.textContent=c.coordinate||`${c.x}, ${c.y}`;els.roomReadout.textContent=roomName(c.roomId);
  const k=Core.key(c.floor,c.x,c.y);if(state.highlights.has(k)){
    try{if(state.local){const result=state.game.move(state.game.humanActor().id,c);state.highlights.clear();if(result.path.some(x=>x.floor!==state.floor))setFloor(c.floor);renderAll();}
      else{const r=await state.api.action(state.gameId,'move',c);state.onlineState=r.state||r;state.highlights.clear();renderAll();}}
    catch(err){toast(err.message,'error');}
  }
}

function diceTheme(kind,actorId){if(kind==='monster')return DATA.monsterDice;const a=entity(actorId)||humanActor();return DATA.diceAssignments[a?.heroId||a?.id]||DATA.diceAssignments.daltu;}
function physicalRoll(context,predetermined=null){
  if(state.pendingDice)return Promise.reject(new Error('A dice roll is already in progress.'));
  const roll=predetermined||Core.rollFormula(context.expression),theme=diceTheme(context.kind,context.actorId),sound=context.kind==='monster'?DATA.diceSounds.monster:DATA.diceSounds.character;
  els.rollLabel.textContent=`Rolling ${context.label}…`;els.rollTotal.textContent='…';els.diceAssignmentBadge.textContent=theme.name;
  return new Promise((resolve,reject)=>{state.pendingDice={roll,context,resolve,reject};window.KITKDiceSurface.roll({expression:roll.expression,results:roll.results,stylePool:[theme],soundPool:[{name:context.kind==='monster'?'Monster dice':'Character dice',url:sound}]});});
}
function handleDiceResult(detail){
  const p=state.pendingDice;if(!p)return;state.pendingDice=null;const roll={...p.roll,total:Number.isFinite(p.roll.total)?p.roll.total:detail.resultTotal,results:p.roll.results?.length?p.roll.results:detail.results};els.rollLabel.textContent=`${p.context.label} landed on the shared board`;els.rollTotal.textContent=roll.total;p.resolve(roll);
}
function handleDiceError(detail){const p=state.pendingDice;state.pendingDice=null;if(p)p.reject(new Error(detail?.message||'Dice renderer error.'));toast(detail?.message||'Dice renderer error.','error');}

async function rollMovement(){
  const a=humanActor();if(!a)return;
  try{
    if(state.local){if(state.game.currentActor()?.id!==a.id)throw new Error('It is not your turn.');const r=await physicalRoll(state.game.movementContext(a));const reachable=state.game.setMovement(a.id,r.total);state.highlights=new Map(reachable.cells.map(c=>[Core.key(c.floor,c.x,c.y),c]));els.boardNotice.textContent=`Movement ${a.movementRemaining}: ${reachable.cells.length} legal destinations highlighted across the keep.`;renderAll();}
    else{const result=await state.api.action(state.gameId,'roll_movement',{}),roll=result.roll||result.result||result;await physicalRoll({label:'Movement',expression:roll.expression||'1d10',kind:'character',actorId:a.id},{expression:roll.expression||'1d10',results:roll.rolls||roll.results||[],total:roll.total});const reach=await state.api.reachable(state.gameId,roll.total);state.highlights=new Map((reach.cells||[]).map(c=>[Core.key(c.floor,c.x,c.y),c]));state.onlineState=result.state||state.onlineState;renderAll();}
  }catch(err){toast(err.message,'error');}
}
async function resolvePerception(){try{const r=await physicalRoll(state.game.perceptionContext());const found=state.game.resolvePerception(r.total);toast(found.length?`Perception revealed ${found.length} hidden feature(s).`:'Nothing hidden was discovered.',found.length?'success':'');renderAll();}catch(err){toast(err.message,'error');}}
async function searchRoom(){
  if(!state.game&&state.local)return;try{
    if(state.local){const ctx=state.game.skillContext('search'),r=await physicalRoll(ctx),found=state.game.search(r.total);toast(found.length?`Search found ${found.length} feature(s).`:'The search found nothing new.',found.length?'success':'');renderAll();}
    else{const req=await state.api.diceRequest(state.gameId,'search'),ctx={label:req.label||'Search',expression:req.expression||'1d20',kind:'character',actorId:humanActor()?.id},roll=await physicalRoll(ctx);const r=await state.api.action(state.gameId,'search',{roll});state.onlineState=r.state||r;renderAll();}
  }catch(err){toast(err.message,'error');}
}
async function detectMagicAction(){try{if(state.local){const r=state.game.detectMagic(),count=r.found.length;toast(count?`Detect Magic outlined ${count} magical or hidden feature(s).`:'No magical aura was detected in this room.',count?'success':'');}else{const r=await state.api.action(state.gameId,'detect_magic',{});state.onlineState=r.state||state.onlineState;const f=r.found||{},count=Object.values(f).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0);toast(count?`Detect Magic outlined ${count} magical feature(s).`:'No magical aura was detected in this room.',count?'success':'');}renderAll();}catch(err){toast(err.message,'error');}}
async function interactObject(objectId,action){
  try{
    if(!state.local){const o=currentState()?.objects?.find(x=>x.id===objectId);if(!o)throw new Error('Interactive object not found.');let type='interact',payload={kind:o.type==='container'?'container':o.type,targetId:objectId};if(action==='lockpick')type='lockpick';else if(action==='disarm')type='disarm';else if(action==='force')type='lockpick';else if(action==='open'||action==='close')payload.open=action==='open';const out=await state.api.action(state.gameId,type,payload);state.onlineState=out.state||out;renderAll();return;}
    let total=0;if(['lockpick','disarm','force'].includes(action)){const ctx=state.game.skillContext(action),r=await physicalRoll(ctx);total=r.total;}
    const r=state.game.interact(objectId,action,total);if(r.items)toast(`Collected ${r.items.length} item(s).`,'success');if(r.mimic)toast('The chest was a Mimic!','error');renderAll();
  }catch(err){toast(err.message,'error');}
}
async function attackTarget(targetId,weaponId=''){
  try{
    if(state.local){const a=state.game.humanActor(),ctx=state.game.attackContext(targetId,a,weaponId),ar=await physicalRoll(ctx.attack);let dr={expression:ctx.damage.expression,results:[],total:0};if(ar.results.includes(20)||ar.total>=ctx.target.ac)dr=await physicalRoll(ctx.damage);const out=state.game.applyAttack(a.id,targetId,ar,dr,ctx);toast(out.hit?`${ctx.target.name} takes ${out.damage} damage from ${ctx.weapon?.name||'the attack'}.`:`${a.name} misses.`,out.hit?'success':'');renderAll();}
    else{const req=await state.api.diceRequest(state.gameId,'attack',{targetId,weaponId}),ar=await physicalRoll({label:req.attackLabel||'Attack',expression:req.attackExpression||'1d20',kind:'character',actorId:humanActor()?.id});const target=entity(targetId),payload=target?.type==='monster'?{targetMonsterId:targetId,weaponId}:{targetParticipantId:targetId,weaponId};const r=await state.api.action(state.gameId,'attack',payload);state.onlineState=r.state||r;renderAll();}
  }catch(err){toast(err.message,'error');}
}
async function castPower(powerId,targetId='',effectVariant=''){
  try{if(!state.local){const r=await state.api.action(state.gameId,'cast',{actionId:powerId,targetParticipantId:targetId,effectVariant});state.onlineState=r.state||r;renderAll();return;}
    const actor=state.game.humanActor(),ctx=state.game.powerContext(powerId,targetId||actor.id,actor),rolls={effectVariant};
    if(ctx.attack)rolls.attack=await physicalRoll(ctx.attack);const attackHit=!ctx.attack||rolls.attack.results.includes(20)||rolls.attack.total>=ctx.target.ac;
    if(attackHit&&ctx.save)rolls.save=await physicalRoll(ctx.save);if(attackHit&&ctx.damage)rolls.damage=await physicalRoll(ctx.damage);if(ctx.healing)rolls.healing=await physicalRoll(ctx.healing);
    const out=state.game.applyPower(actor.id,ctx.target.id,powerId,rolls),parts=[];if(out.damage)parts.push(`${out.damage} damage`);if(out.healing)parts.push(`${out.healing} HP restored`);if(out.temporaryHp)parts.push(`${out.temporaryHp} temporary HP`);if(out.revealed?.length)parts.push(`${out.revealed.length} magical/hidden features revealed`);toast(`${ctx.power.name}${effectVariant?` (${effectVariant})`:''}: ${parts.join(' · ')||'effect applied'}.`,'success');renderAll();
  }catch(err){toast(err.message,'error');}
}
async function endTurn(){
  if(!state.game&&state.local)return;try{
    if(state.local){state.highlights.clear();state.game.endTurn();renderAll();await state.game.runAICycle(ctx=>physicalRoll(ctx));renderAll();}
    else{const r=await state.api.action(state.gameId,'end_turn',{});state.onlineState=r.state||r;try{const b=await state.api.botStep(state.gameId);state.onlineState=b.state||state.onlineState;}catch(_){}renderAll();}
  }catch(err){toast(err.message,'error');}
}

function renderAll(){renderParty();renderRole();renderSelected();renderContext();renderObjects();renderCombat();renderInventory();renderMessages();renderMapOverlay();renderFloorBadges();renderOnlineEffects();}
function renderParty(){
  const pub=currentState();if(!pub){els.partyList.innerHTML='';els.monsterList.innerHTML='';return;}
  const current=state.local?state.game.currentActor():entity(pub.turnActorId);els.turnBanner.textContent=current?`Round ${pub.round||1} · ${current.name}'s turn`:'Waiting for game state';
  els.partyList.innerHTML=(pub.actors||[]).map(a=>`<button class="party-item" data-select-actor="${a.id}" style="border-color:${a.color}"><img src="${a.token}" alt=""><span><strong>${esc(a.name)}</strong><span class="entity-meta"><span>${a.human?'Player':'Autonomous bot'}${a.privateRole==='killer'&&a.human?' · private Killer':''}${a.openingVictim?' · opening-victim ghost':a.ghost?' · ghost':''}</span><span>${a.hp}/${a.maxHp} HP</span></span><span class="hp-track"><i style="width:${Math.max(0,a.hp/a.maxHp*100)}%"></i></span></span></button>`).join('');
  els.monsterList.innerHTML=(pub.monsters||[]).map(m=>`<button class="monster-item" data-select-actor="${m.id}"><img src="${m.token}" alt=""><span><strong>${esc(m.name)}</strong><span class="entity-meta"><span>${esc(m.surface||'floor')}</span><span>${m.hp}/${m.maxHp} HP</span></span><span class="hp-track"><i style="width:${Math.max(0,m.hp/m.maxHp*100)}%"></i></span></span></button>`).join('');
  $$('[data-select-actor]').forEach(b=>b.onclick=()=>{state.selectedActorId=b.dataset.selectActor;const a=entity(state.selectedActorId);if(a?.floor&&a.floor!==state.floor)setFloor(a.floor);renderAll();});
}
function renderRole(){
  if(!state.local){const role=state.onlineState?.me?.private?.role||'authorized participant';els.roleCard.innerHTML=`<span class="eyebrow">Private role</span><strong>${esc(role.replaceAll('_',' '))}</strong><p>Role data came from the authenticated private-state response and is not exposed through public world state.</p>`;return;}if(!state.game){els.roleCard.innerHTML='<p>No active game.</p>';return;}
  const p=state.game.privateState(),isK=p.role==='killer',isVictim=p.role==='opening_victim';els.roleCard.innerHTML=`<span class="eyebrow">Private role</span><strong>${isK?'Killer':isVictim?'Opening-victim ghost':'Investigator'}</strong><p>${isK?`Opening victim: ${esc(entity(p.solution.openingVictimId)?.name||'unknown')}. Murder solution: ${esc(p.solution.weapon)} in ${esc(roomName(p.solution.room))}.`:isVictim?'You begin dead in Ghost Mode, receive no evidence hand, and do not learn who killed you.':'Identify the secretly assigned killer without exposing your private cards.'}</p>`;
}
function renderSelected(){
  const a=entity(state.selectedActorId)||humanActor();if(!a){els.selectedActorCard.innerHTML='<p>No actor selected.</p>';return;}const c=cellAt(a.floor,a.x,a.y);els.selectedActorCard.innerHTML=`<div style="display:flex;gap:.65rem;align-items:center"><img src="${a.token}" alt="" width="64" height="64"><div><span class="eyebrow">${esc(a.type)}</span><strong>${esc(a.name)}</strong><p>${a.hp}/${a.maxHp} HP · AC ${a.ac}<br>${esc(floorInfo(a.floor)?.name)} · ${esc(roomName(c?.roomId))}</p></div></div>`;els.cellReadout.textContent=`${a.name} · ${a.x+1}, ${a.y+1}`;els.roomReadout.textContent=roomName(c?.roomId);
}
function renderContext(){
  const a=humanActor();els.contextActions.innerHTML='';if(!a||!currentState()){els.actionTitle.textContent='No active game';els.actionDescription.textContent='Start a match from the lobby.';return;}
  const myTurn=state.local?state.game.currentActor()?.id===a.id:true;
  if(state.local&&state.game.pending?.type==='perception'){els.actionTitle.textContent='Room-entry Perception';els.actionDescription.textContent='Only the required Perception die is available. The character does not move during this check.';addContextButton(state.game.perceptionContext(),resolvePerception);return;}
  els.actionTitle.textContent=myTurn?'Choose a legal action':'Waiting for autonomous turn';els.actionDescription.textContent=myTurn?'Initiative is established. Roll the movement d10, use a valid power, interact, attack, or end the turn.':'Dice controls remain hidden until your legal turn.';
  if(myTurn)addContextButton(state.local?state.game.movementContext(a):{label:'Movement',expression:'1d10',kind:'character',actorId:a.id},rollMovement,'Roll once, then highlight every legal destination');
  if(myTurn&&state.local){const selected=entity(state.selectedActorId),powers=state.game.availablePowers(a).filter(p=>!state.game.powerIsOffensive(p)||/self/i.test(p.range||''));for(const p of powers)addPowerButton(p,selected&&selected.type==='character'?selected.id:a.id);if(state.game.canDetectMagic(a))addUtilityButton('Detect Magic','No movement and no die: reveal magical auras, glyphs, wards, curses, illusions, and spell traps in the current room.',detectMagicAction);}
  if(state.highlights.size){const byFloor={};state.highlights.forEach(c=>byFloor[c.floor]=(byFloor[c.floor]||0)+1);els.actionDescription.textContent='Legal destinations: '+Object.entries(byFloor).map(([f,n])=>`${floorInfo(f)?.name}: ${n}`).join(' · ');}
  const theme=diceTheme('character',a.id);els.diceAssignmentBadge.textContent=theme.name;
}
function addContextButton(ctx,handler,description=''){if(!ctx)return;const b=document.createElement('button');b.innerHTML=`<code>${esc(ctx.expression)}</code><span>${esc(ctx.label)}</span>${description?`<small>${esc(description)}</small>`:''}`;b.onclick=handler;els.contextActions.appendChild(b);}
function addUtilityButton(label,description,handler,container=els.contextActions){const b=document.createElement('button');b.className='power-action';b.innerHTML=`<span>${esc(label)}</span><small>${esc(description)}</small>`;b.onclick=handler;container.appendChild(b);}
function addPowerButton(power,targetId,container=els.contextActions){const remaining=state.game.powerRemaining(state.game.humanActor(),power),variants=power.id==='kitk-power-dragons-breath'?['acid','cold','fire','lightning','poison']:[''];for(const variant of variants){const b=document.createElement('button');b.className='power-action';b.innerHTML=`<span>${esc(power.name)}${variant?` · ${esc(variant[0].toUpperCase()+variant.slice(1))}`:''}</span><small>${esc(power.activation)} · ${remaining===Infinity?'unlimited':remaining+' use(s) left'}<br>${esc(power.effect)}</small>`;b.disabled=remaining<=0;b.onclick=()=>castPower(power.id,targetId,variant);container.appendChild(b);}}
function renderObjects(){
  const a=humanActor();if(!a){els.objectActions.innerHTML='<p class="microcopy">No active character.</p>';return;}
  const objects=state.local&&state.game?state.game.nearbyObjects():(currentState()?.objects||[]).filter(o=>o.cell&&o.cell.floor===a.floor&&Math.abs(o.cell.x-a.x)+Math.abs(o.cell.y-a.y)<=1);els.objectActions.innerHTML=objects.map(o=>{let buttons='';if(o.type==='door'){buttons=o.open?`<button data-object="${o.id}" data-action="close">Close door</button>`:o.locked?`<button data-object="${o.id}" data-action="lockpick">Lockpick</button><button data-object="${o.id}" data-action="force">Force entry</button>`:`<button data-object="${o.id}" data-action="open">Open door</button>`;}else if(o.type==='container'||o.type==='treasure'){if(o.trapped&&!o.disarmed)buttons+=`<button data-object="${o.id}" data-action="disarm">Disarm trap</button>`;else if(o.locked)buttons+=`<button data-object="${o.id}" data-action="lockpick">Lockpick</button>`;else if(!o.opened)buttons+=`<button data-object="${o.id}" data-action="open">Open</button>`;else if(!o.looted)buttons+=`<button data-object="${o.id}" data-action="loot">Loot</button>`;}else if(o.type==='trap'&&!o.disarmed)buttons=`<button data-object="${o.id}" data-action="disarm">Disarm</button>`;return `<div class="object-card"><strong>${esc(o.kind||o.type)}${o.detected?' · detected':''}</strong><p>${o.locked?'Locked. ':''}${o.trapped&&!o.disarmed?'Trapped. ':''}${o.opened?'Opened. ':''}${o.looted?'Looted. ':''}</p>${buttons}</div>`;}).join('');
  $$('[data-object]',els.objectActions).forEach(b=>b.onclick=()=>interactObject(b.dataset.object,b.dataset.action));
}
function renderCombat(){
  const a=humanActor(),pub=currentState(),targets=state.local&&state.game?state.game.legalTargets():[...(pub?.monsters||[]),...(pub?.mode==='full_pvp'?(pub?.actors||[]).filter(x=>x.id!==a?.id):[])].filter(t=>a&&t.status==='alive'&&t.floor===a.floor&&Math.abs(t.x-a.x)+Math.abs(t.y-a.y)<=1);els.combatTargets.innerHTML='';
  for(const t of targets){const card=document.createElement('div');card.className='target-item';card.innerHTML=`<strong>${esc(t.name)}</strong><span class="entity-meta"><span>AC ${t.ac}</span><span>${t.hp}/${t.maxHp} HP${t.temporaryHp?` + ${t.temporaryHp} temp`:''}</span></span>`;const actions=document.createElement('div');actions.className='button-row';if(state.local){for(const w of state.game.weaponList(a)){const b=document.createElement('button');b.textContent=w.name;b.title=w.damage;b.onclick=()=>attackTarget(t.id,w.id);actions.appendChild(b);}for(const p of state.game.availablePowers(a).filter(p=>state.game.powerIsOffensive(p)&&state.game.legalPowerTargets(p,a).some(x=>x.id===t.id)))addPowerButton(p,t.id,actions);}else{const b=document.createElement('button');b.textContent='Attack';b.onclick=()=>attackTarget(t.id);actions.appendChild(b);}card.appendChild(actions);els.combatTargets.appendChild(card);}
}
function renderInventory(){const inv=state.local&&state.game?state.game.privateState().inventory:(state.onlineState?.me?.private?.inventory||[]);els.inventoryList.innerHTML=inv.map(i=>`<div class="inventory-item"><strong>${esc(String(i.id).replaceAll('-',' '))}</strong><span>Quantity ${i.quantity||1}</span><button class="secondary" data-equip="${esc(i.id)}">${i.equipped?'Unequip':'Equip'}</button></div>`).join('')||'<p class="microcopy">No items collected.</p>';$$('[data-equip]',els.inventoryList).forEach(b=>b.onclick=async()=>{try{if(state.local)state.game.toggleEquip(b.dataset.equip);else{const r=await state.api.action(state.gameId,'use_item',{itemId:b.dataset.equip,mode:'toggle_equip'});state.onlineState=r.state||r;}renderAll();}catch(err){toast(err.message,'error');}});}
function renderMessages(){const msgs=state.local&&state.game?state.game.messages:[];els.messageList.innerHTML=msgs.filter(m=>state.currentChannel==='game'?m.channel==='game':m.channel===state.currentChannel).map(m=>`<div class="message ${m.channel}"><small>${esc(m.senderName)} · ${new Date(m.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}${m.recipientId?` · private to ${esc(entity(m.recipientId)?.name||m.recipientId)}`:''}</small>${esc(m.text)}</div>`).join('');els.messageList.scrollTop=els.messageList.scrollHeight;
  const actorOptions=(currentState()?.actors||[]).filter(a=>a.id!==humanActor()?.id&&a.userId).map(a=>`<option value="${a.userId}">${esc(a.name)}</option>`).join('');els.messageRecipient.innerHTML=actorOptions;
}
function renderFloorBadges(){const counts={};state.highlights.forEach(c=>counts[c.floor]=(counts[c.floor]||0)+1);$$('[data-floor]',els.floorTabs).forEach(b=>{const f=floorInfo(b.dataset.floor);b.textContent=f.name+(counts[b.dataset.floor]?` · ${counts[b.dataset.floor]}`:'');});}

function buildDecks(){
  els.deckTabs.innerHTML=Object.keys(DATA.decks).map((d,i)=>`<button data-deck="${d}" class="${i?'':'is-active'}">${d}</button>`).join('');$$('[data-deck]',els.deckTabs).forEach(b=>b.onclick=()=>{state.currentDeck=b.dataset.deck;$$('[data-deck]',els.deckTabs).forEach(x=>x.classList.toggle('is-active',x===b));renderDeck();});els.deckSearch.oninput=renderDeck;renderDeck();
}
function cardId(c){return c.card_id||c.id||c.public_card_asset||'';}
function cardPath(c){for(const v of [c.path,c.svg,c.image,c.src])if(typeof v==='string'&&v)return v;return `assets/svg/cards/${state.currentDeck}/${cardId(c)}.svg`;}
function cardName(c){return c.name||c.compliance?.replacementTitle||String(c.id||'card').replaceAll('-',' ');}
function renderDeck(){const q=els.deckSearch.value.toLowerCase(),cards=(DATA.decks[state.currentDeck]||[]).filter(c=>cardName(c).toLowerCase().includes(q));els.cardGrid.innerHTML=cards.map(c=>`<button title="${esc(cardName(c))}"><img loading="lazy" src="${esc(cardPath(c))}" alt="${esc(cardName(c))}"></button>`).join('');}
const tutorial=[
 ['Account and lobby','Authenticate before lobby access; create or join a game, select a unique character, and fill unclaimed characters with bots.'],
 ['Character colors and tokens','Token borders, starting spaces, movement paths, fixed dice, and ability accents share the character’s official color.'],
 ['Initiative and contextual 3D dice','Before movement begins, every character rolls initiative. After order is established, the active character rolls one d10 for movement. Only the die required for the current legal action appears.'],
 ['Movement','Roll the d10, then choose from highlighted legal destinations. Characters move orthogonally unless a specific ability enables an L-shaped move.'],
 ['Stairs and floors','Legal stair edges connect exact matching squares. Switch floors to select a highlighted destination on another level.'],
 ['Doors, locks, traps, and treasure','Move adjacent to an interactive overlay. Open, lockpick, force, detect, disarm, and loot through validated actions.'],
 ['Fog and lighting','Current line of sight, explored fog, room-entry lights, walls, and closed doors control visibility. Cooperative and PvP visibility differ.'],
 ['Combat, powers, and effects','Choose an authored weapon or unlocked power. Attack rolls, saves, damage, healing, conditions, character-matched visuals, monster movement/attack sounds, blood, poison, and death effects resolve in sequence.'],
 ['Messages and alliances','Game chat is public; direct and alliance channels are private in backend mode. Alliances never override hidden-role victory rules.'],
 ['Accusations and voting','Formal accusations and votes are accepted only while the character occupies the Foyer lobby area.'],
 ['Cooperative mode','Work together to identify the secretly selected killer while exploring, fighting, collecting evidence, and protecting private state.'],
 ['Free-for-All PvP','Direct PvP is enabled, informal alliances may form, and one participant remains the primary hidden killer.'],
 ['Killer controls','The killer receives normal cards, dice, and public controls. Private role data is backend-authorized and never merely hidden with CSS.']
];
function buildTutorial(){els.tutorialSteps.innerHTML=tutorial.map((t,i)=>`<section class="tutorial-step ${i?'':'is-active'}"><span class="eyebrow">Step ${i+1} of ${tutorial.length}</span><h3>${esc(t[0])}</h3><p>${esc(t[1])}</p></section>`).join('');$('#tutorialPrevious').onclick=()=>{state.tutorialIndex=Math.max(0,state.tutorialIndex-1);renderTutorial();};$('#tutorialNext').onclick=()=>{state.tutorialIndex=Math.min(tutorial.length-1,state.tutorialIndex+1);renderTutorial();};}
function renderTutorial(){$$('.tutorial-step',els.tutorialSteps).forEach((x,i)=>x.classList.toggle('is-active',i===state.tutorialIndex));}
const licenseDocs=[
 ['SRD 5.2.1','docs/licenses/NOTICE_SRD_5.2.1.md'],['CC BY 4.0','docs/licenses/CC-BY-4.0.txt'],['Project license','docs/licenses/PROJECT_LICENSE.md'],['Third-party software','docs/licenses/THIRD_PARTY_SOFTWARE.md'],['Asset licenses','docs/licenses/ASSET_LICENSES.md'],['Audio licenses','docs/licenses/AUDIO_LICENSES.md'],['Font licenses','docs/licenses/FONT_LICENSES.md'],['Source research','docs/EXTERNAL_RESEARCH_AND_LICENSE_AUDIT.md'],['Build audit','docs/FULL_GAME_VALIDATION.md'],['Manifest','docs/MANIFEST.json'],['README','docs/README.md']
];
function buildLicenses(){els.licenseButtons.innerHTML=licenseDocs.map(([n,p])=>`<button data-license="${p}">${n}</button>`).join('');$$('[data-license]',els.licenseButtons).forEach(b=>b.onclick=async()=>{try{els.licenseViewer.textContent='Loading local documentation…';const r=await fetch(b.dataset.license);if(!r.ok)throw new Error(`Missing local file: ${b.dataset.license}`);els.licenseViewer.textContent=await r.text();}catch(e){els.licenseViewer.textContent=e.message;}});}

function bindPanels(){
  $$('[data-left]').forEach(b=>b.onclick=()=>{$$('[data-left]').forEach(x=>x.classList.toggle('is-active',x===b));$$('[data-left-page]').forEach(p=>p.classList.toggle('is-active',p.dataset.leftPage===b.dataset.left));});
  $$('[data-right]').forEach(b=>b.onclick=()=>{$$('[data-right]').forEach(x=>x.classList.toggle('is-active',x===b));$$('[data-right-page]').forEach(p=>p.classList.toggle('is-active',p.dataset.rightPage===b.dataset.right));});
  $$('[data-channel]').forEach(b=>b.onclick=()=>{state.currentChannel=b.dataset.channel;$$('[data-channel]').forEach(x=>x.classList.toggle('is-active',x===b));els.recipientLabel.hidden=state.currentChannel==='game';renderMessages();});
  $('#messageForm').addEventListener('submit',async e=>{e.preventDefault();const text=els.messageInput.value.trim();if(!text)return;try{if(state.local){state.game.sendMessage(text,state.currentChannel,state.currentChannel==='game'?'':els.messageRecipient.value);}else await state.api.sendMessage({gameId:state.gameId,text,channelType:state.currentChannel==='game'?'game':'whisper',userId:els.messageRecipient.value});els.messageInput.value='';renderMessages();}catch(err){toast(err.message,'error');}});
  $('#searchButton').onclick=searchRoom;$('#endTurnButton').onclick=endTurn;
  $('#accusationForm').addEventListener('submit',async e=>{e.preventDefault();try{const v=formObject(e.currentTarget);if(state.local){const r=state.game.formalAccusation(v);toast(r.correct?'The accusation is correct. The case is solved!':'The accusation is incorrect.','success');}else{const r=await state.api.action(state.gameId,'final_accusation',{characterCardId:v.suspect,weaponCardId:v.weapon,roomCardId:v.room});state.onlineState=r.state||state.onlineState;toast(r.correct?'The accusation is correct.':'The accusation was resolved.','success');}renderAll();}catch(err){toast(err.message,'error');}});
  $('#voteForm').addEventListener('submit',async e=>{e.preventDefault();try{const target=formObject(e.currentTarget).target;if(state.local)state.game.castVote(target);else{const r=await state.api.action(state.gameId,'vote',{targetHeroId:target});state.onlineState=r.state||state.onlineState;}toast('Vote recorded.','success');}catch(err){toast(err.message,'error');}});
  $('#saveNotebookButton').onclick=()=>{storage.set('kitk.notebook',$('#notebook').value);toast('Notebook saved locally.','success');};$('#notebook').value=storage.get('kitk.notebook');
}

function playEnvironment(name){const src=state.config?.audio?.[name];if(!src)return;try{const a=new Audio(src);a.volume=name==='fireplace'?0.08:0.18;a.play().catch(()=>{});}catch(_){} }
function startAmbience(){if(state.audio.ambience)return;const src=state.config?.audio?.ambience;if(!src)return;const a=new Audio(src);a.loop=true;a.volume=.07;a.play().catch(()=>{});state.audio.ambience=a;}
function stopAudio(){Object.values(state.audio).forEach(a=>{try{a.pause();a.currentTime=0;}catch(_){}});state.audio={};window.KITKEffects?.stopAll();}

function updateTransform(){const rect=els.boardViewport.getBoundingClientRect(),x=rect.width/2+state.pan.x-1536*state.zoom/2,y=rect.height/2+state.pan.y-1024*state.zoom/2;els.mapTransform.style.transform=`translate(${x}px,${y}px) scale(${state.zoom})`;els.zoomOutput.textContent=`${Math.round(state.zoom*100)}%`;window.KITKDiceSurface?.resize();}
function bindBoardControls(){
  $('#zoomInButton').onclick=()=>{state.zoom=Math.min(2.2,state.zoom+.1);updateTransform();};$('#zoomOutButton').onclick=()=>{state.zoom=Math.max(.28,state.zoom-.1);updateTransform();};$('#resetViewButton').onclick=()=>{state.zoom=.72;state.pan={x:0,y:0};updateTransform();};
  els.boardViewport.addEventListener('wheel',e=>{e.preventDefault();state.zoom=Math.max(.28,Math.min(2.2,state.zoom+(e.deltaY<0?.08:-.08)));updateTransform();},{passive:false});
  let drag=null,pinch=null;els.boardViewport.addEventListener('pointerdown',e=>{els.boardViewport.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,pan:{...state.pan}};});els.boardViewport.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId){state.pan={x:drag.pan.x+e.clientX-drag.x,y:drag.pan.y+e.clientY-drag.y};updateTransform();}});els.boardViewport.addEventListener('pointerup',e=>{if(drag?.id===e.pointerId)drag=null;});
  els.mapObject.addEventListener('load',setupMapInteractions);window.addEventListener('resize',()=>{updateOrientation();updateTransform();});
}
function updateOrientation(){const mobile=Math.min(innerWidth,innerHeight)<800;els.rotateOverlay.hidden=!(mobile&&innerHeight>innerWidth);}

function bindController(){
  window.addEventListener('gamepadconnected',()=>{toast('Bluetooth/controller input connected.','success');requestAnimationFrame(controllerLoop);});
  function pressed(g,i){return !!g.buttons[i]?.pressed;}function edge(g,i){const p=pressed(g,i),old=state.controller.lastButtons[i];state.controller.lastButtons[i]=p;return p&&!old;}
  function controllerLoop(){const g=navigator.getGamepads?.()[0];if(!g){requestAnimationFrame(controllerLoop);return;}const now=performance.now(),ax=g.axes[0]||0,ay=g.axes[1]||0;if(now-state.controller.lastMove>180){let moved=false;if(pressed(g,14)||ax<-.55){state.controller.x--;moved=true;}if(pressed(g,15)||ax>.55){state.controller.x++;moved=true;}if(pressed(g,12)||ay<-.55){state.controller.y--;moved=true;}if(pressed(g,13)||ay>.55){state.controller.y++;moved=true;}if(moved){state.controller.x=Math.max(0,Math.min(47,state.controller.x));state.controller.y=Math.max(0,Math.min(31,state.controller.y));state.controller.lastMove=now;renderControllerCursor();}}
    if(edge(g,0))handleCellClick({floor:state.floor,x:state.controller.x,y:state.controller.y,roomId:cellAt(state.floor,state.controller.x,state.controller.y)?.roomId,coordinate:`${state.controller.x+1},${state.controller.y+1}`});
    if(edge(g,1)){state.highlights.clear();renderAll();}if(edge(g,2))rollMovement();if(edge(g,3))searchRoom();if(edge(g,4))cycleFloor(-1);if(edge(g,5))cycleFloor(1);if(edge(g,9))openLobby();
    if(Math.abs(g.axes[2]||0)>.2||Math.abs(g.axes[3]||0)>.2){state.pan.x-=(g.axes[2]||0)*8;state.pan.y-=(g.axes[3]||0)*8;updateTransform();}
    if((g.buttons[6]?.value||0)>.2){state.zoom=Math.max(.28,state.zoom-.015);updateTransform();}if((g.buttons[7]?.value||0)>.2){state.zoom=Math.min(2.2,state.zoom+.015);updateTransform();}
    requestAnimationFrame(controllerLoop);
  }
  function cycleFloor(dir){const a=state.config.floorOrder,i=a.indexOf(state.floor);setFloor(a[(i+dir+a.length)%a.length]);}
  function renderControllerCursor(){const rect=els.boardViewport.getBoundingClientRect(),x=rect.width/2+state.pan.x-1536*state.zoom/2+(state.controller.x*32+16)*state.zoom,y=rect.height/2+state.pan.y-1024*state.zoom/2+(state.controller.y*32+16)*state.zoom;els.controllerCursor.hidden=false;els.controllerCursor.style.left=`${x-13}px`;els.controllerCursor.style.top=`${y-13}px`;}
}

function bindPWA(){
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;$('#installButton').hidden=false;});$('#installButton').onclick=async()=>{if(!state.installPrompt)return;state.installPrompt.prompt();await state.installPrompt.userChoice;state.installPrompt=null;$('#installButton').hidden=true;};
}
async function signOut(){try{if(!state.local&&state.token)await state.api.logout();}catch(_){}stopAudio();storage.del('kitk.token');storage.del('kitk.user');state.local=true;state.user=null;state.game=null;state.onlineState=null;state.onlineRoster=[];state.token='';state.api.setToken('');els.gameShell.hidden=true;els.authGate.hidden=false;closeLobby();}
function bindGlobal(){
  $('#logoutButton').onclick=signOut;window.addEventListener('kitk-dice:result',e=>handleDiceResult(e.detail||{}));window.addEventListener('kitk-dice:error',e=>handleDiceError(e.detail||{}));window.addEventListener('kitk-dice:ready',e=>{els.rollLabel.textContent=e.detail?.fallback?'Accessible 2D fallback dice ready':'3D dice ready on shared board';});
}

async function init(){
  bindAuthentication();bindLobby();bindPanels();const shared=new URLSearchParams(location.search).get('game');if(shared)$('#joinOnlineGameForm [name=code]').value=shared;bindBoardControls();bindController();bindPWA();bindGlobal();await loadRuntimeData();setFloor('first_floor');updateTransform();updateOrientation();window.KITKDiceSurface.configure({stylePool:[DATA.diceAssignments.daltu],soundPool:[{name:'Character dice',url:DATA.diceSounds.character}]});window.KITKDiceSurface.init(els.diceSurface);await Promise.allSettled([checkBackend(),restoreSession()]);
}
init().catch(e=>{console.error(e);feedback(els.authFeedback,e.message,'error');});
}());
