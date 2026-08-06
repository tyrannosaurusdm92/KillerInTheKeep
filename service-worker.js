'use strict';
const CACHE='killer-in-the-keep-v6-1-0';
const CORE=['./','./index.html','./css/app.css','./js/game_data.js','./js/api.js','./js/runtime_core.js','./js/effects.js','./js/app.js','./manifest.webmanifest','./json/runtime/build-config.json','./json/runtime/map-interactions.json','./json/runtime/monsters.json','./json/runtime/effects.json','./assets/images/kitk_icon.png','./assets/audio/dice_character_quiet.wav','./assets/audio/dice_monster_quiet.wav'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return response;}).catch(()=>caches.match('./index.html'))));});
