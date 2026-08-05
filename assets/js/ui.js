export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
export function toast(message,type='info',timeout=3200){const region=$('#toastRegion');const el=document.createElement('div');el.className=`toast ${type}`;el.textContent=message;region.append(el);setTimeout(()=>el.remove(),timeout)}
export function feedHtml(items=[]){return items.slice().reverse().map(item=>`<div class="feed-item"><time>${escapeHtml(item.time||'')}</time>${escapeHtml(item.text||item)}</div>`).join('')||'<p class="muted">Nothing recorded yet.</p>'}
export function setPage(page){$$('.page').forEach(el=>el.classList.toggle('active',el.dataset.pageName===page));$$('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.page===page));$('#sidebar')?.classList.remove('open');window.scrollTo(0,0)}
export function showResult(title,body,kind=''){const dlg=$('#resultDialog'),mount=$('#resultDialogBody');mount.innerHTML=`<div class="result-content ${kind}"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p></div>`;dlg.showModal()}
export function formatTime(date=new Date()){return new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(date)}
