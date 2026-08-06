(function(){
  'use strict';
  class KitkApi {
    constructor(endpoint){
      this.endpoint=endpoint;
      this.token='';
      this.timeout=30000;
    }
    setToken(token){this.token=token||'';}
    async call(action,data={},options={}){
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),options.timeout||this.timeout);
      try{
        const response=await fetch(this.endpoint,{
          method:'POST',redirect:'follow',signal:controller.signal,
          headers:{'Content-Type':'text/plain;charset=utf-8'},
          body:JSON.stringify({action,data,token:this.token||undefined})
        });
        const text=await response.text();
        let envelope;
        try{envelope=JSON.parse(text);}catch(_){throw new Error('The Apps Script deployment returned non-JSON content. Check deployment access and URL.');}
        if(!envelope.ok){
          const err=new Error(envelope.error?.message||envelope.message||'Backend request failed.');
          err.code=envelope.error?.code||envelope.code||'BACKEND_ERROR';
          err.status=envelope.error?.status||response.status;
          throw err;
        }
        return envelope.data;
      }catch(err){
        if(err.name==='AbortError') throw new Error('The backend request timed out.');
        throw err;
      }finally{clearTimeout(timer);}
    }
    health(){return this.call('backend.v2.capabilities',{}, {timeout:12000});}
    register(data){return this.call('auth.register',data);}
    login(data){return this.call('auth.login',data);}
    google(credential){return this.call('auth.google',{credential});}
    refresh(){return this.call('auth.refresh',{});}
    logout(){return this.call('auth.logout',{});}
    resendVerification(email){return this.call('auth.resendVerification',{email});}
    verifyEmail(email,code){return this.call('auth.verifyEmail',{email,code});}
    requestCode(email,purpose){return this.call('auth.requestCode',{email,purpose});}
    loginCode(email,code){return this.call('auth.loginWithCode',{email,code});}
    requestPasswordReset(email){return this.call('auth.requestPasswordReset',{email});}
    resetPassword(email,code,newPassword){return this.call('auth.resetPassword',{email,code,newPassword});}
    createGame(data){return this.call('games.create',data);}
    listGames(data={}){return this.call('games.listPublic',data);}
    joinGame(data){return this.call('games.joinByCode',data);}
    getGame(gameId){return this.call('games.get',{gameId});}
    startGame(gameId){return this.call('games.start',{gameId});}
    selectCharacter(gameId,heroId){return this.call('games.selectHero',{gameId,heroId});}
    ready(gameId,ready=true){return this.call('games.setReady',{gameId,ready});}
    runtimeBootstrap(gameId){return this.call('game.v2.bootstrap',{gameId});}
    runtimeState(gameId){return this.call('game.v2.state',{gameId});}
    async reachable(gameId,movement){
      const r=await this.call('game.v2.reachable',{gameId,movementPoints:movement});
      return {...r,cells:r.cells||r.reachable||[]};
    }
    async diceRequest(gameId,context,payload={}){
      const r=await this.call('game.v2.diceRequest',{gameId,context,...payload});
      const die=(r.dice||[])[0]||{};
      const modifier=Number(r.modifier||0);
      const expression=die.expression?`${die.expression}${modifier?`${modifier>0?'+':''}${modifier}`:''}`:'1d20';
      return {...r,expression,label:die.purpose||String(context).replaceAll('_',' ')};
    }
    async action(gameId,type,payload={}){
      const result=await this.call('game.v2.action',{gameId,type,payload});
      const snapshot=await this.runtimeState(gameId);
      const firstRoll=(result.results||[])[0]?.roll;
      return {...result,roll:result.roll||firstRoll||null,state:snapshot.state||snapshot};
    }
    botStep(gameId){return this.call('game.v2.botStep',{gameId});}
    sendMessage(data){return this.call('messages.send',data);}
    getMessages(data){return this.call('messages.get',data);}
    friendsList(){return this.call('friends.list',{});}
    friendsSearch(query){return this.call('friends.search',{query});}
    friendRequest(userId){return this.call('friends.request',{userId});}
    friendRespond(requestId,accept){return this.call('friends.respond',{requestId,accept});}
    friendRemove(userId){return this.call('friends.remove',{userId});}
    block(userId){return this.call('friends.block',{userId});}
    unblock(userId){return this.call('friends.unblock',{userId});}
    invite(gameId,userId){return this.call('games.invite',{gameId,userId});}
    heartbeat(gameId){return this.call('games.heartbeat',{gameId});}
    poll(gameId,revision=0){return this.call('games.poll',{gameId,revision});}
  }
  window.KitkApi=KitkApi;
}());
