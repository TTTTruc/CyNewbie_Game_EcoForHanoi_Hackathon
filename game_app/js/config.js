// Updated spec data: Weather, Events, Home actions, Venue menus, Transport, Quizzes, Investments

export const WEATHER = [
  { key:'sunny',  label:'☀️ Sunny • Walk/Bike +1 coin', mods:{ walkBikeCoinBonus: 1 }, banner:{ bg:'#ecfeff', fg:'#075985' } },
  { key:'rainy',  label:'🌧️ Rainy • Motorbike +0.5 kg CO₂', mods:{ motorbikeCo2Penalty: 0.5 }, banner:{ bg:'#e0f2fe', fg:'#0c4a6e' } },
  { key:'cloudy', label:'☁️ Cloudy • Neutral', mods:{}, banner:{ bg:'#f1f5f9', fg:'#0f172a' } },
  { key:'smoggy', label:'🌫️ Pollution alert • +0.5 kg baseline', mods:{ baselineCo2: 0.5 }, banner:{ bg:'#fff7ed', fg:'#9a3412' } },
];

export const EVENTS = [
  { key:'traffic',  label:'Traffic jam', co2:+0.5 },
  { key:'power',    label:'Power cut',   co2:-0.2 },
  { key:'discount', label:'Discount day', coins:+1 },
  { key:'campaign', label:'Environmental campaign', coins:+2 },
  { key:'sick',     label:'Sick day',     co2:-0.3 },
];

// Home sub-areas and actions
export const HOME_ACTIONS = {
  bedroom: [
    {label:'Nap (1h)', co2:+0.10, coins:0, category:'home'},
    {label:'Sleep (End Day)', co2:+0.10, coins:0, category:'home', sleep:true},
  ],
  kitchen: [
    {label:'Cook breakfast',       co2:+0.30, coins:+1, category:'home'},
    {label:'Cook afternoon meal',  co2:+0.50, coins:+1, category:'home'},
    {label:'Cook dinner',          co2:+0.80, coins:+2, category:'home'},
  ],
  living: [
    {label:'Watch TV/stream (2h)', co2:+0.15, coins:0, category:'home'},
  ],
  climate: [
    {key:'fan',  label:'Fan (2h)', co2:+0.20, coins:+1, category:'home', sets:'fan'},
    {key:'ac',   label:'AC (2h)',  co2:+0.40, coins:0,  category:'home', sets:'ac'},
  ]
};

// Venue menus with optional reusable toggles and auto loads
export const VENUE_MENUS = {
  stallA: { label:'Food Stall A — Phở/Hủ tiếu', category:'food', reusable:{label:'Reusable container', co2:-0.20, coins:+1}, items:[
    {label:'Phở bò', co2:+1.20, coins:0},
    {label:'Phở gà', co2:+0.90, coins:0},
    {label:'Hủ tiếu', co2:+1.00, coins:0},
  ]},
  stallB: { label:'Food Stall B — Office Lunch', category:'food', items:[
    {label:'Cơm sườn trứng', co2:+1.10, coins:0},
    {label:'Cơm gà chiên',   co2:+0.90, coins:0},
    {label:'Cơm cá kho',     co2:+0.80, coins:+1},
    {label:'Cơm chay',       co2:+0.40, coins:+2},
  ]},
  stallC: { label:'Food Stall C — Desserts', category:'food', reusable:{label:'Reusable spoon', co2:-0.05, coins:+1}, items:[
    {label:'Cotton candy', co2:+0.10, coins:0},
    {label:'Flan',         co2:+0.20, coins:0},
    {label:'Chè khúc bạch',co2:+0.25, coins:0},
  ]},
  cafe: { label:'Coffee Shop', category:'coffee', auto:{label:'Stay 1h AC', co2:+0.20}, items:[
    {label:'Iced milk coffee (plastic)', co2:+0.30, coins:0},
    {label:'Dine‑in mug',                co2:+0.20, coins:+1, autoAC:true},
    {label:'Cold brew return bottle',    co2:+0.15, coins:+1},
  ]},
  fine: { label:'Fine Dining', category:'fine', auto:{label:'Ambience', co2:+0.30}, items:[
    {label:'Steak set',    co2:+2.50, coins:0},
    {label:'Seafood set',  co2:+1.80, coins:0},
    {label:'Vegetarian set', co2:+1.00, coins:+1},
  ]},
  school: { label:'School Campus', category:'venue', auto:{label:'Campus AC load', co2:+0.40} },
  company:{ label:'Company Block', category:'venue', auto:{label:'Office AC load', co2:+0.50} },
};

export const TRANSPORT = {
  walk:   { co2:0.00, coins:+2, mod:'walkBikeCoinBonus', label:'Walk' },
  bike:   { co2:0.00, coins:+2, mod:'walkBikeCoinBonus', label:'Bike' },
  moto:   { co2:+2.50, coins:0, mod:'motorbikeCo2Penalty', label:'Motorbike' },
  bus:    { co2:+0.90, coins:+1, label:'Bus' },
};

export const QUIZZES = [
  { q:'Which mode emits the most CO₂ per km in Hanoi?', a:['Walking','Bus','Motorbike','Bicycle'], correct:2, fact:'Motorbikes emit more per passenger‑km than buses.' },
  { q:'Best lunch for lower footprint?', a:['Street food with plastic','Delivery','Vegetarian meal','Meat combo'], correct:2, fact:'Plant‑based meals generally emit less CO₂.' },
  { q:'Which helps reduce single-use waste?', a:['Disposable cups','Reusable bottle','Plastic bags','None'], correct:1, fact:'Reusable bottles reduce plastic waste and emissions.' },
  { q:'On sunny days, choosing to walk/bike grants…', a:['+0 coins','+1 coin bonus','-1 coin','Nothing'], correct:1, fact:'Sunny bonus rewards active transport with +1 coin.' },
  { q:'Smoggy day effect on CO₂?', a:['-0.5 kg','No effect','+0.5 kg baseline','+1.0 kg'], correct:2, fact:'Smog adds +0.5 kg baseline at day start.' },
];

export const INVESTMENTS = [
  { key:'tree', label:'🌳 Plant Tree', cost:10, co2:-2.0, trees:+1 },
  { key:'solar', label:'☀️ Install Solar', cost:20, co2:-4.0 },
  { key:'bike', label:'🚲 Bike‑sharing', cost:15, co2:-3.0 },
  { key:'bottle', label:'💧 Reusable Bottle', cost:5, co2:-1.0 },
];

export const TIPS = [
  'Try vegetarian lunches to cut emissions.',
  'Walking or biking earns extra coins on sunny days.',
  'Buses carry more people with lower per‑person emissions.',
  'Small energy savings add up over a week.',
  'Planting trees can offset part of your footprint.',
];

