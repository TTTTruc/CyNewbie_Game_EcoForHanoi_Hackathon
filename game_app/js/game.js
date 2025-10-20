import { WEATHER, EVENTS, HOME_ACTIONS, VENUE_MENUS, TRANSPORT, QUIZZES, INVESTMENTS, TIPS } from './config.js';
import { rng, fmt, storage, trapFocus, play, findPath } from './utils.js';

const hud = {
  day: document.getElementById('dayTag'),
  co2: document.getElementById('co2Tag'),
  coins: document.getElementById('coinsTag'),
  trees: document.getElementById('treesTag'),
  profile: document.getElementById('profileTag'),
  endDayBtn: document.getElementById('endDayBtn'),
  muteBtn: document.getElementById('muteToggleHud'),
};

const els = {
  map: document.getElementById('map'),
  banner: document.getElementById('statusBanner'),
  toast: document.getElementById('toast'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modalTitle'),
  modalBody: document.getElementById('modalBody'),
  modalClose: document.getElementById('modalClose'),
  dpad: document.getElementById('dpad'),
  ambient: document.getElementById('ambientAudio'),
  click: document.getElementById('clickSfx'),
  success: document.getElementById('successSfx'),
};

const GRID_W = 20, GRID_H = 12;

const initialState = () => ({
  day: 1, daysTotal: 5,
  co2Today: 0, co2Total: 0,
  coins: 0, trees: 0,
  weather: null, todaysMods: {},
  quizDoneToday: false, actionsDoneToday: 0,
  homeClimate: 'fan',
  pos: { x: 2, y: 7 }, gridW: GRID_W, gridH: GRID_H,
  vehicles: { parked: { bike: 'home', moto: 'home' } },
  visitedFlags: { school:false, company:false },
  profile: { name: 'Linh', avatar: '🎒', title: 'Student • Hanoi' },
  dayCategoryCo2: { home:0, transport:0, food:0, coffee:0, fine:0, venue:0 },
  coinsStartOfDay: 0,
  coinsSpent: 0, reductions: 0,
  finalized: false, mode: 'play'
});

let state = initialState();
let untrapFocus = null; let muted = false;

const tileTypes = { R:'t-road', P:'t-park', W:'t-water', B:'t-block', O:'t-poi' };

// Map layout (15x10). Ensure roads connect POIs.
const poiMap = [
  'BBBBBBBBBBBBBBBBBBBB',
  'BPPPRPPPRPPPRPPPRPPB',
  'BPPPRPPPRPPPRPPPRPPB',
  'BRRRRRRRRRRRRRRRRRRB',
  'BPPPRPPPRPPPRPPPRPPB',
  'BPPPRPRRRRRRRRPPRPPB',
  'BPPPRPPPRPPPRPPPRPPB',
  'BRRRRRRRRRRRRRRRRRRB',
  'BPPPRPPPRPPPRPPPRPPB',
  'BPPPRPPPRPPPRPPPRPPB',
  'BPPPRPPPRPPPRPPPRPPB',
  'BBBBBBBBBBBBBBBBBBBB',
];

// POIs and bus stops with kinds and labels
const poiList = [
  { x:2, y:8, kind:'home', icon:'🏠', label:'Home', tint:'poi-home' },
  { x:8, y:8, kind:'bus1', icon:'🚏', label:'Bus Stop #1', tint:'poi-bus' },
  { x:12, y:2, kind:'school', icon:'🏫', label:'School', tint:'poi-school' },
  { x:16, y:2, kind:'bus2', icon:'🚏', label:'Bus Stop #2', tint:'poi-bus' },
  { x:12, y:7, kind:'company', icon:'🏭', label:'Company', tint:'poi-company' },
  { x:16, y:7, kind:'bus3', icon:'🚏', label:'Bus Stop #3', tint:'poi-bus' },
  { x:7, y:5, kind:'stallA', icon:'🍜', label:'Food A', tint:'poi-food' },
  { x:9, y:5, kind:'stallB', icon:'🍱', label:'Food B', tint:'poi-food' },
  { x:11, y:5, kind:'stallC', icon:'🍮', label:'Dessert', tint:'poi-food' },
  { x:6, y:2, kind:'cafe', icon:'☕', label:'Cafe', tint:'poi-coffee' },
  { x:4, y:6, kind:'fine', icon:'🍽️', label:'Fine Dining', tint:'poi-fine' },
];

const artClassByKind = {
  home: 'poi-art-home',
  bus1: 'poi-art-entrance-bus',
  bus2: 'poi-art-bus-stop',
  bus3: 'poi-art-bus-stop',
  school: 'poi-art-school',
  company: 'poi-art-company',
  stallA: 'poi-art-stall-pho',
  stallB: 'poi-art-stall-lunch',
  stallC: 'poi-art-stall-dessert',
  cafe: 'poi-art-cafe',
  fine: 'poi-art-fine-dining',
};

// Only roads and POIs are walkable for clear path/blocked visuals
const walkable = new Set(['t-road','t-poi']);
const obstaclesPositions = new Set(['2,2','2,4','10,4','5,2','2,6']);

function showToast(text) { const t=els.toast; if(!t) return; t.textContent=text; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 1800); }

function openModal(title, bodyNode) {
  els.modalTitle.textContent = title;
  els.modalBody.innerHTML = '';
  els.modalBody.appendChild(bodyNode);
  els.modal.setAttribute('aria-hidden', 'false');
  untrapFocus = trapFocus(els.modal);
  requestAnimationFrame(()=>{ const firstBtn = els.modalBody.querySelector('button, [tabindex]'); (firstBtn || els.modalClose).focus(); });
  document.addEventListener('keydown', escClose);
}
function closeModal(){ els.modal.setAttribute('aria-hidden','true'); els.modalBody.innerHTML=''; if(untrapFocus) untrapFocus(); document.removeEventListener('keydown', escClose); }
function escClose(e){ if(e.key==='Escape') closeModal(); }
els.modalClose?.addEventListener('click', ()=>closeModal());

function updateHUD(){
  hud.day.textContent = `Day ${state.day} / ${state.daysTotal}`;
  hud.co2.textContent = `CO₂ Today: ${fmt.co2(state.co2Today)}`;
  hud.coins.textContent = `Coins: ${state.coins}`;
  hud.trees.textContent = `Trees: ${state.trees}`;
  hud.endDayBtn.disabled = !(state.actionsDoneToday >= 3 && state.mode==='play');
  hud.profile.textContent = `${state.profile.avatar} ${state.profile.name}`;
}

function setBanner(weather){ const banner=els.banner; if(!banner) return; if(!weather){ banner.classList.remove('show'); banner.textContent=''; return; } banner.classList.add('show'); banner.textContent=weather.label; banner.style.background=weather.banner.bg; banner.style.color=weather.banner.fg; }

function startDay(){
  state.quizDoneToday=false; state.actionsDoneToday=0; state.coinsStartOfDay=state.coins; state.dayCategoryCo2={ home:0, transport:0, food:0, coffee:0, fine:0, venue:0 };
  const w=rng.pick(WEATHER); state.weather=w.key; state.todaysMods={...w.mods}; setBanner(w); if(w.mods?.baselineCo2){ state.co2Today+=w.mods.baselineCo2; }
  updateHUD();
}

function addDelta(category, co2=0, coins=0){ state.co2Today += co2; state.coins += coins; state.actionsDoneToday += 1; state.dayCategoryCo2[category] = (state.dayCategoryCo2[category]||0)+co2; updateHUD(); play(els.click, muted); maybeRandomEvent(); maybeShowQuizOnce(); save(); }

function maybeRandomEvent(){ if(!rng.chance(0.25)) return; const ev=rng.pick(EVENTS); let text=ev.label; if(ev.hasOwnProperty('co2')){ state.co2Today += ev.co2; text += ev.co2>=0?` • +${fmt.co2(ev.co2)}`:` • ${fmt.co2(ev.co2)}`; } if(ev.hasOwnProperty('coins')){ state.coins += ev.coins; text += ev.coins>=0?` • +${ev.coins}c`:` • ${ev.coins}c`; } updateHUD(); showToast(text); }

function maybeShowQuizOnce(){ if(state.quizDoneToday) return; if(state.actionsDoneToday>=1 && rng.chance(0.5)) showQuiz(); }

function showQuiz(){ state.quizDoneToday=true; const q=rng.pick(QUIZZES); const wrap=document.createElement('div'); const p=document.createElement('p'); p.textContent=q.q; p.style.fontWeight='600'; p.style.marginBottom='.6rem'; wrap.appendChild(p); const list=document.createElement('div'); list.className='choices'; q.a.forEach((ans,i)=>{ const btn=document.createElement('button'); btn.className='btn'; btn.textContent=ans; btn.addEventListener('click',()=>{ const correct=i===q.correct; if(correct){ state.coins+=3; play(els.success, muted); } updateHUD(); wrap.innerHTML=''; const msg=document.createElement('div'); msg.innerHTML=`<p><strong>${correct?'Correct! +3 coins':'Not quite'}</strong></p><p>${q.fact}</p>`; const ok=document.createElement('button'); ok.className='btn primary'; ok.textContent='Close'; ok.addEventListener('click', closeModal); wrap.appendChild(msg); wrap.appendChild(document.createElement('div')).appendChild(ok); },{once:true}); list.appendChild(btn); }); wrap.appendChild(list); openModal('Daily Quiz', wrap); }

// ===== Home & Venues =====
function openHome(){
  const wrap=document.createElement('div');
  const sections=[
    {key:'bedroom', title:'Bedroom', items:HOME_ACTIONS.bedroom},
    {key:'kitchen', title:'Kitchen', items:HOME_ACTIONS.kitchen},
    {key:'living', title:'Living Room', items:HOME_ACTIONS.living},
    {key:'climate', title:`Home Climate (now: ${state.homeClimate.toUpperCase()})`, items:HOME_ACTIONS.climate}
  ];
  // Yard vehicles
  const yardHeader=document.createElement('h3'); yardHeader.textContent='Yard (Vehicles)'; yardHeader.style.margin='.6rem 0 .3rem'; wrap.appendChild(yardHeader);
  const yardRow=document.createElement('div'); yardRow.className='choices';
  const bikeBtn=document.createElement('button'); bikeBtn.className='btn'; bikeBtn.textContent='🚲 Bike — Destination'; bikeBtn.addEventListener('click',()=>transportPicker('bike'));
  const motoBtn=document.createElement('button'); motoBtn.className='btn'; motoBtn.textContent='🏍️ Motorbike — Destination'; motoBtn.addEventListener('click',()=>transportPicker('moto'));
  yardRow.appendChild(bikeBtn); yardRow.appendChild(motoBtn); wrap.appendChild(yardRow);
  sections.forEach(sec=>{
    const h=document.createElement('h3'); h.textContent=sec.title; h.style.margin='.6rem 0 .3rem'; wrap.appendChild(h);
    sec.items.forEach(it=>{
      const row=document.createElement('div'); row.className='choice';
      const title=document.createElement('div'); title.textContent=it.label;
      const meta=document.createElement('div'); meta.className='meta'; meta.textContent=`${it.co2>=0?'+':''}${fmt.co2(it.co2)} • ${it.coins? (it.coins>0?'+':'')+it.coins+'c':'0c'}`;
      const btn=document.createElement('button'); btn.className='btn primary'; btn.textContent= it.sleep ? 'Sleep' : 'Choose';
      btn.addEventListener('click',()=>{
        addDelta('home', it.co2, it.coins||0);
        if(it.sets){ state.homeClimate = it.sets; showToast(`Climate set: ${it.sets.toUpperCase()}`); }
        if(it.sleep){ closeModal(); return sleepEndDay(); }
        closeModal();
      });
      row.appendChild(title); row.appendChild(meta); row.appendChild(btn); wrap.appendChild(row);
    });
  });
  openModal('Home', wrap);
}

function openVenue(kind){
  const def = VENUE_MENUS[kind]; if(!def){ showToast('Nothing to do here'); return; }
  // Apply auto load once per visit when entering venue kinds that define it
  if(def.auto && !state.visitedFlags[kind]){ state.visitedFlags[kind]=true; state.co2Today += def.auto.co2; state.dayCategoryCo2[def.category] = (state.dayCategoryCo2[def.category]||0) + def.auto.co2; updateHUD(); showToast(`${def.auto.label} • +${fmt.co2(def.auto.co2)}`); }

  const wrap=document.createElement('div');
  if(def.category==='coffee'){ const note=document.createElement('div'); note.className='menu-note'; note.textContent='Staying inside adds +0.20 kg for AC (auto on dine-in items).'; wrap.appendChild(note); }
  const list=document.createElement('div'); list.className='choices';
  let reuseToggle=null, reuseDef=def.reusable;
  if(reuseDef){ const row=document.createElement('label'); row.className='inline'; const cb=document.createElement('input'); cb.type='checkbox'; cb.id='reuseToggle'; const span=document.createElement('span'); span.textContent=`${reuseDef.label} (${reuseDef.co2>=0?'+':''}${fmt.co2(reuseDef.co2)} • ${reuseDef.coins>0?'+':''}${reuseDef.coins}c)`; row.appendChild(cb); row.appendChild(span); wrap.appendChild(row); reuseToggle=cb; }
  def.items.forEach(it=>{
    const row=document.createElement('div'); row.className='choice';
    const title=document.createElement('div'); title.textContent=it.label;
    const meta=document.createElement('div'); meta.className='meta'; meta.textContent=`${it.co2>=0?'+':''}${fmt.co2(it.co2)} • ${it.coins? (it.coins>0?'+':'')+it.coins+'c':'0c'}`;
    const btn=document.createElement('button'); btn.className='btn primary'; btn.textContent='Choose';
    btn.addEventListener('click',()=>{
      let co2=it.co2, coins=(it.coins||0);
      if(def.category==='coffee' && it.autoAC){ co2 += 0.20; }
      if(reuseToggle?.checked && reuseDef){ co2 += reuseDef.co2; coins += (reuseDef.coins||0); }
      addDelta(def.category, co2, coins);
      closeModal();
    });
    row.appendChild(title); row.appendChild(meta); row.appendChild(btn); list.appendChild(row);
  });
  wrap.appendChild(list);
  openModal(def.label, wrap);
}

// ===== Transport =====
const DESTS = [
  {key:'home', label:'Home', pos:()=>getPoiPos('home')},
  {key:'school', label:'School', pos:()=>getPoiPos('school')},
  {key:'company', label:'Company', pos:()=>getPoiPos('company')},
  {key:'stallA', label:'Food A', pos:()=>getPoiPos('stallA')},
  {key:'stallB', label:'Food B', pos:()=>getPoiPos('stallB')},
  {key:'stallC', label:'Dessert', pos:()=>getPoiPos('stallC')},
  {key:'cafe', label:'Cafe', pos:()=>getPoiPos('cafe')},
  {key:'fine', label:'Fine Dining', pos:()=>getPoiPos('fine')},
];

function getPoiPos(kind){ const p=poiList.find(p=>p.kind===kind); return p?{x:p.x,y:p.y}:null; }

function isBusKind(kind){ return kind==='bus1'||kind==='bus2'||kind==='bus3'; }

function vehiclesAt(kind){ const res=[]; if(state.vehicles?.parked){ for(const k of ['bike','moto']){ if(state.vehicles.parked[k]===kind) res.push(k); } } return res; }

function makeTransportSprite(mode){
  const el=document.createElement('div');
  el.className='vehicle-sprite';
  el.setAttribute('data-mode', mode);
  // background image is set via CSS by data-mode
  els.map.appendChild(el);
  return el;
}

function positionSprite(el, x, y){
  const gs=getComputedStyle(document.documentElement).getPropertyValue('--grid-size');
  const size=parseInt(gs);
  el.style.transform=`translate(${x*size}px, ${y*size}px)`;
}

function transportPicker(mode){
  const wrap=document.createElement('div'); const list=document.createElement('div'); list.className='choices';
  const targets = mode==='bus' ? [
    {key:'bus1', label:'Bus Stop #1', pos:()=>getPoiPos('bus1')},
    {key:'bus2', label:'Bus Stop #2', pos:()=>getPoiPos('bus2')},
    {key:'bus3', label:'Bus Stop #3', pos:()=>getPoiPos('bus3')},
  ] : DESTS;
  // Filter out current tile for bus (no-op move)
  const curTile=getTile(state.pos.x,state.pos.y); const curKind=curTile?.getAttribute('data-poi');
  const shownTargets = targets.filter(d=>d.key!==curKind);
  shownTargets.forEach(d=>{
    const row=document.createElement('div'); row.className='choice';
    const title=document.createElement('div'); title.textContent=d.label;
    const btn=document.createElement('button'); btn.className='btn primary'; btn.textContent='Go';
    btn.addEventListener('click',()=>{ closeModal(); rideTo(mode, d.key); });
    row.appendChild(title); row.appendChild(document.createElement('div')); row.appendChild(btn); list.appendChild(row);
  });
  wrap.appendChild(list); openModal(`${TRANSPORT[mode].label} — Destination`, wrap);
}

function rideTo(mode, destKey){
  const def=TRANSPORT[mode];
  // Resolve destination for buses or general POIs
  let dest=null;
  if(mode==='bus'){
    if(!isBusKind(destKey)) return; dest = { key: destKey, label: destKey.toUpperCase(), pos:()=>getPoiPos(destKey) };
  } else {
    dest = DESTS.find(d=>d.key===destKey);
  }
  if(!def||!dest) return;
  // parked constraint for bike/moto: must be at same tile as parked location to ride
  if(mode==='bike' || mode==='moto'){
    const parkedAt = state.vehicles.parked[mode]; const parkedPos = getPoiPos(parkedAt);
    if(!parkedPos || !(state.pos.x===parkedPos.x && state.pos.y===parkedPos.y)){
      showToast(`${def.label} is parked at ${parkedAt}.`); return;
    }
  }
  // apply weather modifiers to transport
  let co2 = def.co2 || 0; let coins = def.coins || 0;
  if(def.mod==='motorbikeCo2Penalty' && state.todaysMods.motorbikeCo2Penalty){ co2 += state.todaysMods.motorbikeCo2Penalty; }
  if(def.mod==='walkBikeCoinBonus' && state.todaysMods.walkBikeCoinBonus){ coins += state.todaysMods.walkBikeCoinBonus; }

  const goal = dest.pos(); if(!goal) return;
  const path = findPath(state.pos, goal, isWalkable, GRID_W, GRID_H);
  if(!path) { showToast('No road path.'); return; }
  animateTransportAlong(mode, path, ()=>{
    if(mode==='bike' || mode==='moto'){ state.vehicles.parked[mode] = destKey; }
    addDelta('transport', co2, coins);
    updateParkedMarkers();
  });
}

function animateAlong(path, done){
  // legacy simple avatar move
  let i=0; const tick=()=>{ if(i>=path.length){ done&&done(); return; } const p=path[i++]; state.pos.x=p.x; state.pos.y=p.y; positionAvatar(); setTimeout(tick, 90); }; tick();
}

function animateTransportAlong(mode, path, done){
  const av=document.getElementById('avatar');
  if(!path || path.length===0){ done&&done(); return; }
  // Hide avatar and create a vehicle sprite
  av.style.visibility='hidden';
  const sprite=makeTransportSprite(mode);
  // Position sprite at current location
  positionSprite(sprite, state.pos.x, state.pos.y);
  let i=0;
  const step=()=>{
    if(i>=path.length){
      // Arrived
      sprite.remove();
      av.style.visibility='visible';
      positionAvatar();
      done&&done();
      return;
    }
    const p=path[i++];
    state.pos.x=p.x; state.pos.y=p.y;
    positionSprite(sprite, p.x, p.y);
    setTimeout(step, 90);
  };
  step();
}

// ===== Day end & reports =====
function endOfDay(){
  const [topCat] = Object.entries(state.dayCategoryCo2).sort((a,b)=>b[1]-a[1])[0] || ['none',0];
  const coinsGained = state.coins - state.coinsStartOfDay; const tip=rng.pick(TIPS);
  const wrap=document.createElement('div');
  const list=document.createElement('div'); list.innerHTML=`<p><strong>Summary</strong></p><p>CO₂ Today: ${fmt.co2(state.co2Today)}</p><p>Coins Gained: ${coinsGained}</p><p>Top emitter: ${topCat}</p><p class="meta">Tip: ${tip}</p>`; wrap.appendChild(list);
  const next=document.createElement('button'); next.className='btn primary'; next.textContent='Next Day'; next.addEventListener('click',()=>{ closeModal(); state.co2Total+=state.co2Today; state.co2Today=0; state.day+=1; if(state.day>state.daysTotal){ enterInvestments(); } else { startDay(); save(); } });
  wrap.appendChild(document.createElement('div')).appendChild(next); openModal('End of Day', wrap);
}

function sleepEndDay(){ addDelta('home', 0.10, 0); // already adds action; we want immediate end
  endOfDay();
}

function enterInvestments(){ state.mode='invest'; updateHUD(); els.map.innerHTML=''; const container=document.createElement('div'); container.style.display='grid'; container.style.gridTemplateColumns='repeat(auto-fit, minmax(220px, 1fr))'; container.style.gap='12px'; INVESTMENTS.forEach(inv=>{ const card=document.createElement('div'); card.style.border='1px solid #e2e8f0'; card.style.borderRadius='.8rem'; card.style.padding='12px'; card.style.background='#fff'; card.innerHTML=`<h3>${inv.label}</h3><p class="meta">Cost: ${inv.cost} • Effect: ${inv.co2} kg</p>`; const buy=document.createElement('button'); buy.className='btn'; buy.textContent='Buy'; buy.addEventListener('click',()=>{ if(state.coins<inv.cost){ showToast('Not enough coins'); return; } state.coins-=inv.cost; state.coinsSpent+=inv.cost; state.reductions+=inv.co2; if(inv.trees) state.trees+=inv.trees; updateHUD(); play(els.success, muted); save(); }); card.appendChild(buy); container.appendChild(card); }); const finalize=document.createElement('div'); finalize.style.marginTop='10px'; const btn=document.createElement('button'); btn.className='btn primary'; btn.textContent='Finalize'; btn.addEventListener('click',()=>finalReport()); finalize.appendChild(btn); els.map.appendChild(container); els.map.appendChild(finalize); }

function finalReport(){ state.mode='final'; const net=state.co2Total + state.reductions; const ecoIndex=Math.max(0, Math.round(100 - Math.max(0, net)*12)); let rank='Urban Polluter'; if(ecoIndex>=80) rank='Eco Hero'; else if(ecoIndex>=50) rank='Conscious Citizen'; const wrap=document.createElement('div'); const list=document.createElement('div'); list.innerHTML=`<p><strong>Final Report</strong></p><p>Total CO₂ (5 days): ${fmt.co2(state.co2Total)}</p><p>Coins Spent: ${state.coinsSpent}</p><p>Net CO₂ after reductions: ${fmt.co2(net)}</p><p>Eco Index: ${ecoIndex} • Rank: <strong>${rank}</strong></p>`; wrap.appendChild(list); const actions=document.createElement('div'); actions.style.marginTop='.8rem'; actions.style.display='flex'; actions.style.gap='.5rem'; const replay=document.createElement('button'); replay.className='btn'; replay.textContent='Replay'; replay.addEventListener('click',()=>{ storage.clear(); window.location.href='index.html'; }); const back=document.createElement('a'); back.className='btn'; back.textContent='Back to Menu'; back.href='index.html'; actions.appendChild(replay); actions.appendChild(back); wrap.appendChild(actions); openModal('Final Report', wrap); state.finalized=true; save(); }

function save(){ try{ storage.save(state); }catch{} }
function load(onlyIfExists=false){ const s=storage.load(); if(!s) return false; if(onlyIfExists){ state={ ...initialState(), ...s }; return true; } state={ ...initialState(), ...s }; return true; }

function isWalkable(x,y){ const i=y*GRID_W + x; const tile=els.map.children[i]; if(!tile) return false; const t=tile.getAttribute('data-tt'); return walkable.has(t); }

function getTile(x,y){ const i=y*GRID_W + x; return els.map.children[i]; }

function renderMap(){
  els.map.innerHTML=''; els.map.style.gridTemplateColumns=`repeat(${GRID_W}, var(--grid-size))`; els.map.style.gridTemplateRows=`repeat(${GRID_H}, var(--grid-size))`;
  for(let y=0;y<GRID_H;y++){
    for(let x=0;x<GRID_W;x++){
      const ch=poiMap[y][x]||'B'; const tt=tileTypes[ch]||'t-block';
      const d=document.createElement('div'); d.className=`tile ${tt}`; d.setAttribute('role','gridcell'); d.setAttribute('data-tt',tt);
      const poi=poiList.find(p=>p.x===x && p.y===y);
      if(poi){
        d.classList.add('t-poi'); if(poi.tint) d.classList.add(poi.tint);
        d.setAttribute('data-tt','t-poi');
        d.setAttribute('data-poi', poi.kind);
        const artCls = artClassByKind[poi.kind];
        if(artCls){ const art=document.createElement('div'); art.className=`poi-art ${artCls}`; d.appendChild(art); const label=document.createElement('div'); label.className='poi-label'; label.textContent=`${poi.icon} ${poi.label}`; art.appendChild(label); }
      }
      else if(tt==='t-park' && obstaclesPositions.has(`${x},${y}`)){
        d.classList.add('decor-obstacles');
      }
      els.map.appendChild(d);
    }
  }
  // Expand each POI footprint to 2x2 tiles (accessible and white background)
  expandPoiFootprints();
  // After tiles drawn, (path lines disabled; using orange tile backgrounds instead)
  const av=document.createElement('div'); av.className='avatar'; av.textContent='🧑‍🎓'; av.id='avatar'; els.map.appendChild(av); positionAvatar();
  // Update parked vehicle markers after map render
  updateParkedMarkers();
  els.map.addEventListener('click',(e)=>{ const tile=e.target.closest('.tile'); if(!tile) return; const index=Array.from(els.map.children).indexOf(tile); const y=Math.floor(index/GRID_W), x=index%GRID_W; const dx=x-state.pos.x, dy=y-state.pos.y; if(Math.abs(dx)+Math.abs(dy)===1) attemptMove(dx,dy); });
}

function positionAvatar(){ const av=document.getElementById('avatar'); const gs=getComputedStyle(document.documentElement).getPropertyValue('--grid-size'); const size=parseInt(gs); av.style.transform=`translate(${state.pos.x*size}px, ${state.pos.y*size}px)`; }

function renderPathOverlay(){
  for(let y=0;y<GRID_H;y++){
    for(let x=0;x<GRID_W;x++){
      const tile=getTile(x,y); if(!tile) continue; const tt=tile.getAttribute('data-tt');
      const isPath = (tt==='t-road'||tt==='t-poi');
      if(!isPath) continue;
      const n = (y>0) && isPathTile(x, y-1);
      const s = (y<GRID_H-1) && isPathTile(x, y+1);
      const w = (x>0) && isPathTile(x-1, y);
      const e = (x<GRID_W-1) && isPathTile(x+1, y);
      const wrap=document.createElement('div'); wrap.className='path-wrap';
      const dot=document.createElement('div'); dot.className='path-seg dot'; wrap.appendChild(dot);
      if(n){ const seg=document.createElement('div'); seg.className='path-seg n'; wrap.appendChild(seg); }
      if(s){ const seg=document.createElement('div'); seg.className='path-seg s'; wrap.appendChild(seg); }
      if(e){ const seg=document.createElement('div'); seg.className='path-seg e'; wrap.appendChild(seg); }
      if(w){ const seg=document.createElement('div'); seg.className='path-seg w'; wrap.appendChild(seg); }
      tile.appendChild(wrap);
    }
  }
}

function isPathTile(x,y){ const t=getTile(x,y); if(!t) return false; const tt=t.getAttribute('data-tt'); return (tt==='t-road'||tt==='t-poi'); }

function expandPoiFootprints(){
  poiList.forEach(p=>{
    for(let dy=0; dy<2; dy++){
      for(let dx=0; dx<2; dx++){
        const tx=p.x+dx, ty=p.y+dy; if(tx>=GRID_W||ty>=GRID_H) continue;
        const tile=getTile(tx,ty); if(!tile) continue;
        tile.classList.add('t-poi'); tile.setAttribute('data-tt','t-poi'); tile.setAttribute('data-poi', p.kind);
      }
    }
  });
}

let lastPoi=null;
function attemptMove(dx,dy){ const nx=state.pos.x+dx, ny=state.pos.y+dy; if(nx<0||ny<0||nx>=GRID_W||ny>=GRID_H) return; if(!isWalkable(nx,ny)) return; const curTile=getTile(state.pos.x,state.pos.y); const curKind=curTile?.getAttribute('data-poi'); // leaving current POI resets visited flag
  if(curKind && state.visitedFlags[curKind]){ state.visitedFlags[curKind]=false; }
  state.pos.x=nx; state.pos.y=ny; positionAvatar(); play(els.click, muted);
  const tile=getTile(nx,ny); const kind=tile?.getAttribute('data-poi'); if(kind && state.mode==='play'){ onEnterPOI(kind); }
  save();
}

function onEnterPOI(kind){
  if(kind==='home'){ openHome(); return; }
  const parkedHere = vehiclesAt(kind);
  if(isBusKind(kind)){
    // Offer both: parked vehicle reuse and bus destinations
    openTransportHub(kind, parkedHere);
    return;
  }
  if(parkedHere.length){ openParkedVehicleModal(kind, parkedHere); return; }
  if(kind==='school' || kind==='company'){ openVenue(kind); return; }
  if(kind==='stallA'||kind==='stallB'||kind==='stallC'||kind==='cafe'||kind==='fine'){ openVenue(kind); return; }
}

function handleKey(e){ if(els.modal.getAttribute('aria-hidden')==='false') return; const k=e.key.toLowerCase(); if(k==='arrowup'||k==='w') attemptMove(0,-1); else if(k==='arrowdown'||k==='s') attemptMove(0,1); else if(k==='arrowleft'||k==='a') attemptMove(-1,0); else if(k==='arrowright'||k==='d') attemptMove(1,0); }

function attachControls(){ document.addEventListener('keydown', handleKey); hud.endDayBtn?.addEventListener('click', ()=>endOfDay()); const up=document.querySelector('.dpad .up'); const down=document.querySelector('.dpad .down'); const left=document.querySelector('.dpad .left'); const right=document.querySelector('.dpad .right'); up?.addEventListener('click',()=>attemptMove(0,-1)); down?.addEventListener('click',()=>attemptMove(0,1)); left?.addEventListener('click',()=>attemptMove(-1,0)); right?.addEventListener('click',()=>attemptMove(1,0)); }

function attachProfileAndAudio(){ const btn=document.getElementById('editProfileBtn'); btn?.addEventListener('click',()=>{ const name=prompt('Enter your name:', state.profile.name) ?? state.profile.name; const avatar=prompt('Enter an emoji avatar:', state.profile.avatar) ?? state.profile.avatar; state.profile.name=name.trim()||state.profile.name; state.profile.avatar=avatar.trim()||state.profile.avatar; updateHUD(); save(); }); hud.muteBtn?.addEventListener('click',()=>{ muted=!muted; storage.setMute(muted); hud.muteBtn.textContent=muted?'🔇':'🔊'; try{ els.ambient.muted=muted; els.click.muted=muted; els.success.muted=muted; }catch{} }); const kick=()=>{ document.removeEventListener('pointerdown',kick,true); document.removeEventListener('keydown',kick,true); try{ if(!muted){ els.ambient.volume=0.2; els.ambient.play(); } }catch{} }; document.addEventListener('pointerdown',kick,true); document.addEventListener('keydown',kick,true); }

export function initGame({ continueRun=false, muted: initialMute=false }={}){
  muted=!!initialMute; try{ els.ambient.muted=muted; els.click.muted=muted; els.success.muted=muted; }catch{} hud.muteBtn.textContent=muted?'🔇':'🔊';
  let loaded=false; if(continueRun) loaded = load(true);
  renderMap(); attachControls(); attachProfileAndAudio();
  if(loaded){ if(state.mode==='play'){ const w=WEATHER.find(w=>w.key===state.weather); if(w) setBanner(w); } else if(state.mode==='invest'){ enterInvestments(); } else if(state.mode==='final'){ finalReport(); } }
  else { startDay(); }
  updateHUD();
}

// ===== Parked vehicles UI helpers =====
function updateParkedMarkers(){
  // Clear existing markers
  els.map.querySelectorAll('.parked-vehicle').forEach(el=>el.remove());
  if(!state.vehicles?.parked) return;
  for(const [mode, where] of Object.entries(state.vehicles.parked)){
    if(!where) continue; const pos=getPoiPos(where); if(!pos) continue;
    const tile=getTile(pos.x,pos.y); if(!tile) continue;
    const mark=document.createElement('div');
    mark.className='parked-vehicle';
    mark.setAttribute('data-mode', mode);
    mark.title = `${TRANSPORT[mode]?.label||mode} parked here`;
    tile.appendChild(mark);
  }
}

function openParkedVehicleModal(kind, modesHere){
  const wrap=document.createElement('div');
  const msg=document.createElement('p'); msg.textContent='You have a vehicle parked here.'; wrap.appendChild(msg);
  const list=document.createElement('div'); list.className='choices';
  modesHere.forEach(m=>{
    const row=document.createElement('div'); row.className='choice';
    const title=document.createElement('div'); title.textContent=TRANSPORT[m]?.label || m;
    const btn=document.createElement('button'); btn.className='btn primary'; btn.textContent=`Use ${TRANSPORT[m]?.label||m}`;
    btn.addEventListener('click',()=>{ closeModal(); transportPicker(m); });
    row.appendChild(title); row.appendChild(document.createElement('div')); row.appendChild(btn); list.appendChild(row);
  });
  wrap.appendChild(list);
  openModal('Parked Vehicle', wrap);
}

function openTransportHub(kind, modesHere){
  const wrap=document.createElement('div');
  if(modesHere.length){
    const h=document.createElement('h3'); h.textContent='Your Vehicles Here'; h.style.margin='.4rem 0'; wrap.appendChild(h);
    const list1=document.createElement('div'); list1.className='choices';
    modesHere.forEach(m=>{
      const row=document.createElement('div'); row.className='choice';
      const title=document.createElement('div'); title.textContent=TRANSPORT[m]?.label || m;
      const btn=document.createElement('button'); btn.className='btn'; btn.textContent=`Use ${TRANSPORT[m]?.label||m}`;
      btn.addEventListener('click',()=>{ closeModal(); transportPicker(m); });
      row.appendChild(title); row.appendChild(document.createElement('div')); row.appendChild(btn); list1.appendChild(row);
    });
    wrap.appendChild(list1);
  }
  const h2=document.createElement('h3'); h2.textContent='Bus Destinations'; h2.style.margin='.6rem 0 .3rem'; wrap.appendChild(h2);
  const list2=document.createElement('div'); list2.className='choices';
  [{key:'bus1',label:'Bus Stop #1'},{key:'bus2',label:'Bus Stop #2'},{key:'bus3',label:'Bus Stop #3'}]
    .filter(d=>d.key!==kind)
    .forEach(d=>{
      const row=document.createElement('div'); row.className='choice';
      const title=document.createElement('div'); title.textContent=d.label;
      const btn=document.createElement('button'); btn.className='btn primary'; btn.textContent='Go';
      btn.addEventListener('click',()=>{ closeModal(); rideTo('bus', d.key); });
      row.appendChild(title); row.appendChild(document.createElement('div')); row.appendChild(btn); list2.appendChild(row);
    });
  wrap.appendChild(list2);
  openModal('Bus Stop', wrap);
}
