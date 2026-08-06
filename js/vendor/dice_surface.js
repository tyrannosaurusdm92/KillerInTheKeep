"use strict";
window.KITKDiceSurface=(function(){
  var api={},box=null,container=null,rolling=false,queue=[],fallback=false,lastConfig={stylePool:[],soundPool:[]};
  function emit(name,detail){window.dispatchEvent(new CustomEvent("kitk-dice:"+name,{detail:detail||{}}));}
  function configure(p){
    p=p||{};lastConfig=p;
    if(window.DICE&&DICE.set_theme_pool&&Array.isArray(p.stylePool))DICE.set_theme_pool(p.stylePool);
    if(window.DICE&&DICE.set_sound_pool&&Array.isArray(p.soundPool))DICE.set_sound_pool(p.soundPool);
  }
  function next(){if(!rolling&&queue.length)api.roll(queue.shift());}
  function secureDie(sides){
    if(window.crypto&&window.crypto.getRandomValues){var a=new Uint32Array(1),limit=Math.floor(0x100000000/sides)*sides,x;do{window.crypto.getRandomValues(a);x=a[0];}while(x>=limit);return x%sides+1;}
    return Math.floor(Math.random()*sides)+1;
  }
  function parseSimple(expression){
    var m=String(expression||"").match(/^(\d+)d(4|6|8|10|12|20)([+-]\d+)?$/i);
    if(!m)return null;
    var count=Number(m[1]),sides=Number(m[2]),modifier=Number(m[3]||0);
    if(count<1||count>20)return null;
    return {count:count,sides:sides,modifier:modifier};
  }
  function playFallbackSound(){
    var pool=Array.isArray(lastConfig.soundPool)?lastConfig.soundPool:[],picked=pool.length?pool[Math.floor(Math.random()*pool.length)]:null,src=picked&&(picked.url||picked);
    if(!src)return;
    try{var audio=new Audio(src);audio.volume=.35;audio.play().catch(function(){});}catch(_){}
  }
  function fallbackRoll(expression){
    var parsed=parseSimple(expression);
    if(!parsed){emit("error",{expression:expression,message:"That formula is not available in the Killer In The Keep rules."});next();return;}
    rolling=true;emit("started",{expression:expression,fallback:true});playFallbackSound();
    container.innerHTML="";container.classList.add("uses-fallback");
    var tray=document.createElement("div");tray.className="fallback-dice-tray";container.appendChild(tray);
    var results=[];
    for(var i=0;i<parsed.count;i++){
      var value=secureDie(parsed.sides);results.push(value);
      var die=document.createElement("div");die.className="fallback-die";die.style.setProperty("--delay",(i*55)+"ms");die.innerHTML='<span>d'+parsed.sides+'</span><b>'+value+'</b>';tray.appendChild(die);
    }
    var total=results.reduce(function(a,b){return a+b;},0)+parsed.modifier;
    var resultString="["+results.join(", ")+"]"+(parsed.modifier?(parsed.modifier>0?" + ":" - ")+Math.abs(parsed.modifier):"")+" = "+total;
    setTimeout(function(){rolling=false;emit("result",{expression:expression,resultString:resultString,resultTotal:total,results:results,fallback:true});setTimeout(function(){tray.classList.add("is-fading");},900);setTimeout(next,80);},950);
  }
  api.init=function(target){
    container=target;
    if(!container){emit("error",{message:"The dice surface is missing."});return false;}
    if(!window.DICE||!window.THREE||!window.CANNON||!window.$t){fallback=true;emit("ready",{fallback:true});next();return true;}
    try{var probe=document.createElement("canvas"),gl=probe.getContext("webgl")||probe.getContext("experimental-webgl");if(!gl){fallback=true;emit("ready",{fallback:true,message:"WebGL is unavailable."});next();return true;}}catch(_){fallback=true;emit("ready",{fallback:true,message:"WebGL is unavailable."});next();return true;}
    try{box=new DICE.dice_box(container);box.setDice("1d20");fallback=false;emit("ready",{fallback:false});next();return true;}
    catch(e){fallback=true;box=null;container.innerHTML="";container.classList.add("uses-fallback");emit("ready",{fallback:true,message:e&&e.message?e.message:"WebGL is unavailable."});next();return true;}
  };
  api.configure=configure;
  api.roll=function(p){
    p=p||{};if(rolling){queue.push(p);return;}var expression=String(p.expression||"1d20").replace(/\s+/g,"");configure(p);
    if(fallback||!box){fallbackRoll(expression);return;}
    var parsed=DICE.parse_notation(expression);
    if(!parsed||!parsed.set||!parsed.set.length||parsed.error){emit("error",{expression:expression,message:"That formula is not available in the Killer In The Keep rules."});next();return;}
    if(parsed.set.length>20){emit("error",{expression:expression,message:"The table supports at most 20 physical dice in one roll."});next();return;}
    box.setDice(expression);rolling=true;emit("started",{expression:expression,fallback:false});
    box.start_throw(function(){return Array.isArray(p.results)?p.results:null;},function(notation){rolling=false;emit("result",{expression:expression,resultString:notation&&notation.resultString?notation.resultString:"",resultTotal:notation&&Number.isFinite(notation.resultTotal)?notation.resultTotal:null,results:notation&&Array.isArray(notation.result)?notation.result.slice():[],fallback:false});setTimeout(next,80);});
  };
  api.resize=function(){if(fallback||!box||!container)return;try{box.reinit(container);}catch(_){};};
  api.isReady=function(){return !!box||fallback;};api.isFallback=function(){return fallback;};return api;
}());
