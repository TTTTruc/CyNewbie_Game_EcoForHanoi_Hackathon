// Utilities: RNG, formatting, storage, focus trap, audio, pathfinding

export const rng = {
  _s: (Date.now() & 0xffffffff) >>> 0,
  seed(n) { this._s = n >>> 0; },
  next() { let t=this._s+=0x6D2B79F5; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; },
  pick(arr) { return arr[Math.floor(this.next()*arr.length)]; },
  chance(p=0.5) { return this.next() < p; }
};

export const fmt = { co2(n) { return (Math.round(n*100)/100).toFixed(2) + ' kg'; } };

const STORAGE_KEY = 'eco_hanoi_run_v2';
const AUDIO_KEY = 'eco_hanoi_mute';

export const storage = {
  save(state) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} },
  load() { try { const s=localStorage.getItem(STORAGE_KEY); return s?JSON.parse(s):null; } catch { return null; } },
  clear() { try { localStorage.removeItem(STORAGE_KEY); } catch {} },
  getMute() { try { return localStorage.getItem(AUDIO_KEY) === '1'; } catch { return false; } },
  setMute(v) { try { localStorage.setItem(AUDIO_KEY, v ? '1' : '0'); } catch {} },
};

export function trapFocus(modal) {
  const selectors='button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
  const focusable=()=>Array.from(modal.querySelectorAll(selectors)).filter(el=>!el.hasAttribute('disabled'));
  function onKey(e){ if(e.key!=='Tab')return; const list=focusable(); if(!list.length)return; const first=list[0], last=list[list.length-1]; if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); } }
  modal.addEventListener('keydown', onKey); return ()=>modal.removeEventListener('keydown', onKey);
}

export function play(el, muted){ if(!el) return; try{ if(!muted){ el.currentTime=0; el.play(); } }catch{} }

// BFS pathfinding on grid of walkable tiles
export function findPath(start, goal, isWalkable, w, h){
  const q=[start]; const came=new Map(); const key=(x,y)=>x+','+y; const seen=new Set([key(start.x,start.y)]);
  while(q.length){ const cur=q.shift(); if(cur.x===goal.x && cur.y===goal.y) break; const dirs=[[1,0],[-1,0],[0,1],[0,-1]]; for(const [dx,dy] of dirs){ const nx=cur.x+dx, ny=cur.y+dy; if(nx<0||ny<0||nx>=w||ny>=h) continue; const k=key(nx,ny); if(seen.has(k)) continue; if(!isWalkable(nx,ny)) continue; seen.add(k); came.set(k, cur); q.push({x:nx,y:ny}); } }
  const path=[]; let cur=goal; const gk=key(goal.x,goal.y); if(!came.has(gk) && !(start.x===goal.x && start.y===goal.y)) return null; while(!(cur.x===start.x && cur.y===start.y)){ path.push({x:cur.x,y:cur.y}); const ck=key(cur.x,cur.y); const p=came.get(ck); if(!p) break; cur=p; } path.reverse(); return path;
}

