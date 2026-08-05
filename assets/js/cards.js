import {$,escapeHtml} from './ui.js';

export class CardLibrary {
  constructor(decks,onArchive){this.decks=decks;this.onArchive=onArchive;this.activeDeck=Object.keys(decks)[0];this.search='';this.hand=[];this.archive=[]}
  all(){return Object.values(this.decks).flat()}
  byId(id){return this.all().find(c=>c.id===id)}
  setState({hand=[],archive=[]}){this.hand=hand;this.archive=archive;this.renderSidebars()}
  init(){
    const select=$('#deckSelect'); select.innerHTML=Object.entries(this.decks).map(([id,cards])=>`<option value="${id}">${title(id)} (${cards.length})</option>`).join('');
    select.addEventListener('change',()=>{this.activeDeck=select.value;this.render()});
    $('#cardSearch').addEventListener('input',e=>{this.search=e.target.value.trim().toLowerCase();this.render()});
    this.render();this.renderSidebars();
  }
  render(){
    const cards=(this.decks[this.activeDeck]||[]).filter(c=>JSON.stringify(c).toLowerCase().includes(this.search));
    $('#cardGrid').innerHTML=cards.map(c=>this.cardHtml(c)).join('')||'<p class="muted">No matching cards.</p>';
    $('#cardGrid').querySelectorAll('[data-card-id]').forEach(b=>b.addEventListener('click',()=>this.open(b.dataset.cardId)));
  }
  cardHtml(c){
    return `<article class="game-card"><button data-card-id="${escapeHtml(c.id)}"><span class="card-badge">${escapeHtml(c.type||this.activeDeck)}</span>${c.art?`<img class="card-art" src="${escapeHtml(c.art)}" alt="">`:'<div class="card-art"></div>'}<span class="card-type">${escapeHtml(c.type||this.activeDeck)}</span><h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.description||c.summary||c.effect||'')}</p><div class="card-meta">${escapeHtml(c.damage||c.properties||c.challenge||c.location||'Digital game card')}</div></button></article>`
  }
  open(id){
    const c=this.byId(id);if(!c)return; const dlg=$('#cardDialog');
    const details=Object.entries(c).filter(([k,v])=>!['id','name','type','art','description','summary'].includes(k)&&typeof v!=='object').map(([k,v])=>`<p><strong>${escapeHtml(title(k))}:</strong> ${escapeHtml(v)}</p>`).join('');
    $('#cardDialogBody').innerHTML=`<div class="card-detail">${c.art?`<img src="${escapeHtml(c.art)}" alt="${escapeHtml(c.name)}">`:''}<div><p class="eyebrow">${escapeHtml(c.type)}</p><h2>${escapeHtml(c.name)}</h2><p>${escapeHtml(c.description||c.summary||'')}</p>${details}<div class="card-actions"><button type="button" class="primary" id="archiveCardButton">Archive as evidence</button></div></div></div>`;
    $('#archiveCardButton').addEventListener('click',()=>{this.onArchive?.(c);dlg.close()});dlg.showModal();
  }
  renderSidebars(){
    $('#handCount').textContent=this.hand.length;$('#archiveCount').textContent=this.archive.length;
    $('#handList').innerHTML=this.hand.map(id=>this.mini(this.byId(id))).join('')||'<p class="muted">Cards dealt at match start.</p>';
    $('#archiveList').innerHTML=this.archive.map(id=>this.mini(this.byId(id))).join('')||'<p class="muted">Investigated cards appear here.</p>';
    document.querySelectorAll('.mini-card[data-card-id]').forEach(el=>el.addEventListener('click',()=>this.open(el.dataset.cardId)));
  }
  mini(c){if(!c)return'';return `<button class="mini-card" data-card-id="${escapeHtml(c.id)}">${c.art?`<img src="${escapeHtml(c.art)}" alt="">`:'<span></span>'}<span><strong>${escapeHtml(c.name)}</strong><small>${escapeHtml(c.type)}</small></span><span>›</span></button>`}
}
function title(s){return String(s).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
