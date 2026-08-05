export class ApiClient {
  constructor(url=''){this.timeoutMs=20000;this.setUrl(url)}
  setUrl(url=''){this.url=String(url||'').trim().replace(/\/$/,'')}
  get configured(){return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(this.url)}
  async request(path,payload={},method='POST'){
    if(!this.configured)throw new Error('The configured Apps Script Web App /exec URL is invalid.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),this.timeoutMs);
    const body={path,...payload};let target=this.url;const options={method,redirect:'follow',cache:'no-store',signal:controller.signal};
    if(method==='GET'){
      const params=new URLSearchParams();
      Object.entries(body).forEach(([key,value])=>{if(value!==undefined&&value!==null&&value!=='')params.set(key,typeof value==='object'?JSON.stringify(value):String(value))});
      target+=`?${params.toString()}`;
    }else{
      // text/plain avoids an Apps Script CORS preflight while preserving JSON input.
      options.headers={'Content-Type':'text/plain;charset=utf-8'};options.body=JSON.stringify(body);
    }
    try{
      const response=await fetch(target,options),text=await response.text();let envelope;
      try{envelope=JSON.parse(text)}catch{throw new Error(`Backend returned non-JSON (${response.status}). Confirm the deployment executes as the owner and is available to players.`)}
      if(!response.ok||envelope.ok===false){const err=envelope.error||{};const message=err.message||err.code||envelope.message||`Backend request failed (${response.status}).`;const error=new Error(message);error.code=err.code||'';error.status=response.status;throw error}
      return envelope.data??envelope;
    }catch(error){if(error.name==='AbortError')throw new Error('The backend connection timed out.');throw error}
    finally{clearTimeout(timer)}
  }
  health(){return this.request('/health',{},'GET')} config(){return this.request('/config',{},'GET')} controls(){return this.request('/controls',{},'GET')} catalog(){return this.request('/catalog',{},'GET')} manifest(){return this.request('/api/manifest',{},'GET')}
  register(email,username,password,displayName=username){return this.request('/auth/register',{email,username,password,displayName})} login(login,password){return this.request('/auth/login',{login,password})} logout(token){return this.request('/auth/logout',{token})} me(token){return this.request('/auth/me',{token})} refresh(token){return this.request('/auth/refresh',{token})}

  profile(token,playerId=''){return this.request('/player/profile',{token,playerId})} updateProfile(token,profile){return this.request('/player/profile/update',{token,...profile})} updatePlayerSettings(token,settings){return this.request('/player/settings/update',{token,settings})}
  inventory(token){return this.request('/inventory/list',{token})} inventoryEquip(token,itemId,type){return this.request('/inventory/equip',{token,itemId,type})}
  shopList(offset=0,limit=50){return this.request('/shop/list',{offset,limit},'GET')} shopBuy(token,itemId,currency='crowns'){return this.request('/shop/buy',{token,itemId,currency})} shopSell(token,itemId,quantity=1){return this.request('/shop/sell',{token,itemId,quantity})}
  listLobbies(region='',visibility='public'){return this.request('/lobby/list',{region,visibility},'GET')} createLobby(token,settings){return this.request('/lobby/create',{token,...settings})} joinLobby(token,roomCode,classId){return this.request('/lobby/join',{token,roomCode,classId})} joinLobbyById(token,lobbyId,classId){return this.request('/lobby/join',{token,lobbyId,classId})} getLobby(token,lobbyId){return this.request('/lobby/get',{token,lobbyId})} readyLobby(token,lobbyId,ready,classId){return this.request('/lobby/ready',{token,lobbyId,ready,classId})} updateLobby(token,lobbyId,settings){return this.request('/lobby/settings',{token,lobbyId,...settings})} kickLobby(token,lobbyId,targetPlayerId){return this.request('/lobby/kick',{token,lobbyId,targetPlayerId})} banLobby(token,lobbyId,targetPlayerId){return this.request('/lobby/ban',{token,lobbyId,targetPlayerId})} leaveLobby(token,lobbyId){return this.request('/lobby/leave',{token,lobbyId})} heartbeat(token,lobbyId){return this.request('/lobby/heartbeat',{token,lobbyId})} quickMatch(token,settings={}){return this.request('/lobby/quick-match',{token,...settings})}
  startMatch(token,lobbyId){return this.request('/match/start',{token,lobbyId})} state(token,matchId){return this.request('/match/state',{token,matchId})} leaveMatch(token,matchId){return this.request('/match/leave',{token,matchId})} history(token){return this.request('/match/history',{token})}
  input(token,matchId,action,data={}){return this.request('/match/input',{token,matchId,action,...data})}
  move(token,matchId,move,clientSequence=0){return this.input(token,matchId,move.action||'moveForward',{clientSequence,position:{x:Number(move.x)||0,y:0,z:Number(move.y)||0},rotation:Number(move.facing)||0,location:move.location||''})}
  startTask(token,matchId,taskId){return this.request('/match/task/start',{token,matchId,taskId})} completeTask(token,matchId,taskId){return this.request('/match/task/complete',{token,matchId,taskId})}
  discoverEvidence(token,matchId,evidenceId=''){return this.request('/match/evidence/discover',{token,matchId,evidenceId})} collectEvidence(token,matchId,evidenceId){return this.request('/match/evidence/collect',{token,matchId,evidenceId})} compareEvidence(token,matchId,evidenceIds){return this.request('/match/evidence/compare',{token,matchId,evidenceIds})}
  reportBody(token,matchId,bodyId){return this.request('/match/body/report',{token,matchId,bodyId})} emergency(token,matchId){return this.request('/match/emergency',{token,matchId})} vote(token,matchId,targetPlayerId=''){return this.request('/match/vote',{token,matchId,targetPlayerId})}
  kill(token,matchId,targetPlayerId){return this.request('/match/kill',{token,matchId,targetPlayerId})} monsterAttack(token,matchId,monsterId){return this.request('/match/monster/attack',{token,matchId,monsterId})} sabotage(token,matchId,type,location=''){return this.request('/match/sabotage',{token,matchId,type,location})} ability(token,matchId,ability,targetId='',extra={}){return this.request('/match/ability',{token,matchId,ability,targetId,...extra})}
  sendChat(token,matchId,message,channel='match'){return this.request('/match/chat/send',{token,matchId,message,channel})} listChat(token,matchId,since=''){return this.request('/match/chat/list',{token,matchId,since})}
  friendRequest(token,targetPlayerId){return this.request('/friends/request',{token,targetPlayerId})} friendRespond(token,requesterPlayerId,accept){return this.request('/friends/respond',{token,requesterPlayerId,accept})} friendList(token){return this.request('/friends/list',{token})} friendRemove(token,targetPlayerId){return this.request('/friends/remove',{token,targetPlayerId})} friendBlock(token,targetPlayerId,block=true){return this.request('/friends/block',{token,targetPlayerId,block})}
  guildCreate(token,name,description='',visibility='public'){return this.request('/guild/create',{token,name,description,visibility})} guildGet(token,guildId){return this.request('/guild/get',{token,guildId})} guildList(){return this.request('/guild/list',{},'GET')} guildJoin(token,guildId,inviteCode=''){return this.request('/guild/join',{token,guildId,inviteCode})} guildLeave(token,guildId){return this.request('/guild/leave',{token,guildId})}
  moderationReport(token,report){return this.request('/moderation/report',{token,...report})} leaderboard(sortBy='wins'){return this.request('/leaderboard',{sortBy},'GET')}
  adminStats(token){return this.request('/admin/stats',{token})} adminReports(token,status=''){return this.request('/admin/reports',{token,status})} adminBan(token,targetPlayerId,reason,until=''){return this.request('/admin/player/ban',{token,targetPlayerId,reason,until})} adminUnban(token,targetPlayerId){return this.request('/admin/player/unban',{token,targetPlayerId})} adminCleanup(token){return this.request('/admin/cleanup',{token})}
}
