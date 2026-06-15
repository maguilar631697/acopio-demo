/* ===== Acopio demo — shared data + state (localStorage) ===== */

const CENTERS = [
  { id: 'sm',  name: 'San Miguel',     city: 'Quelepa, San Miguel',        emoji: '🏭' },
  { id: 'ss',  name: 'San Salvador',   city: 'Soyapango, San Salvador',    emoji: '🏙️' },
  { id: 'sa',  name: 'Santa Ana',      city: 'Santa Ana Centro',           emoji: '🏬' },
  { id: 'la',  name: 'La Libertad',    city: 'Santa Tecla, La Libertad',   emoji: '🏗️' },
  { id: 'us',  name: 'Usulután',       city: 'Usulután Sur',               emoji: '📦' },
  { id: 'so',  name: 'Sonsonate',      city: 'Sonsonate Industrial',       emoji: '🚚' },
  { id: 'ah',  name: 'Ahuachapán',     city: 'Ahuachapán Norte',           emoji: '🏭' },
  { id: 'mo',  name: 'Morazán',        city: 'San Francisco Gotera',       emoji: '📦' },
  { id: 'lu',  name: 'La Unión',       city: 'La Unión Puerto',            emoji: '⚓' },
  { id: 'ch',  name: 'Chalatenango',   city: 'Chalatenango Centro',        emoji: '🏔️' },
];

const CATALOG = [
  { sku:'CBL-100', name:'THHN Copper Wire #12',  cat:'Cable & Wire', unit:'per 100m roll', price:142.00, emoji:'🔌' },
  { sku:'CBL-220', name:'Aluminum Cable 8000 #2', cat:'Cable & Wire', unit:'per 100m roll', price:268.00, emoji:'🔋' },
  { sku:'CND-050', name:'PVC Conduit 1/2"',       cat:'Conduit',      unit:'per 10 units',  price:34.50,  emoji:'⚙️' },
  { sku:'CND-075', name:'EMT Conduit 3/4"',       cat:'Conduit',      unit:'per 10 units',  price:58.00,  emoji:'🔧' },
  { sku:'BRK-020', name:'Circuit Breaker 20A',    cat:'Components',   unit:'each',          price:11.75,  emoji:'🔘' },
  { sku:'PNL-012', name:'Load Center Panel 12-ckt',cat:'Components',  unit:'each',          price:89.00,  emoji:'🗄️' },
  { sku:'CON-001', name:'Connector Kit (assorted)',cat:'Hardware',   unit:'per box',       price:46.00,  emoji:'🧰' },
  { sku:'TPE-330', name:'Insulation Tape',        cat:'Hardware',     unit:'per 10 rolls',  price:18.25,  emoji:'🎞️' },
  { sku:'GLV-008', name:'Work Gloves',            cat:'Safety',       unit:'per dozen',     price:27.00,  emoji:'🧤' },
  { sku:'HLM-004', name:'Safety Helmet',          cat:'Safety',       unit:'each',          price:14.50,  emoji:'⛑️' },
  { sku:'STR-150', name:'Cable Ties 150mm',       cat:'Hardware',     unit:'per 1000',      price:22.00,  emoji:'🔗' },
  { sku:'MTR-001', name:'Digital Multimeter',     cat:'Tools',        unit:'each',          price:63.00,  emoji:'📟' },
];

const DEPOSIT_RATE = 0.30; // 30% down
const CURRENCY = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---- state ---- */
const KEY = 'acopio_current';
const ORDERS = 'acopio_orders';

function loadState(){
  try { return JSON.parse(localStorage.getItem(KEY)) || blank(); }
  catch(e){ return blank(); }
}
function blank(){ return { center:null, items:{}, customer:{} }; }
function saveState(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
function clearState(){ localStorage.removeItem(KEY); }

function cartArray(s){
  return Object.keys(s.items||{}).map(sku => {
    const p = CATALOG.find(c=>c.sku===sku);
    return { ...p, qty: s.items[sku] };
  }).filter(x=>x.qty>0);
}
function subtotal(s){ return cartArray(s).reduce((t,i)=>t + i.price*i.qty, 0); }
function depositOf(n){ return Math.round(n*DEPOSIT_RATE*100)/100; }

function genOrderId(){
  const t = String(Math.floor(performance.now())).slice(-4);
  let r=''; const a='ACDEFHJKLMNPRTUVWXY3479';
  for(let i=0;i<3;i++) r+=a[(performance.now()*(i+7))|0 % a.length % a.length];
  return 'ACO-' + (1000 + (performance.now()|0)%9000);
}

function saveOrder(order){
  let list=[]; try{ list=JSON.parse(localStorage.getItem(ORDERS))||[] }catch(e){}
  const i = list.findIndex(o=>o.orderId===order.orderId);
  if(i>=0) list[i]=order; else list.push(order);
  localStorage.setItem(ORDERS, JSON.stringify(list));
}
function findOrder(id){
  let list=[]; try{ list=JSON.parse(localStorage.getItem(ORDERS))||[] }catch(e){}
  return list.find(o=> (o.orderId||'').toUpperCase()===(id||'').toUpperCase());
}
