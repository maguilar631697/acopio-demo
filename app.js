/* ===== Acopio demo — shared data + state (localStorage) ===== */

const CENTERS = [
  { id: 'sm',  name: 'San Miguel',     city: 'Quelepa, San Miguel',        icon: 'SM' },
  { id: 'ss',  name: 'San Salvador',   city: 'Soyapango, San Salvador',    icon: 'SS' },
  { id: 'sa',  name: 'Santa Ana',      city: 'Santa Ana Centro',           icon: 'SA' },
  { id: 'la',  name: 'La Libertad',    city: 'Santa Tecla, La Libertad',   icon: 'LL' },
  { id: 'us',  name: 'Usulután',       city: 'Usulután Sur',               icon: 'US' },
  { id: 'so',  name: 'Sonsonate',      city: 'Sonsonate Industrial',       icon: 'SO' },
  { id: 'ah',  name: 'Ahuachapán',     city: 'Ahuachapán Norte',           icon: 'SM' },
  { id: 'mo',  name: 'Morazán',        city: 'San Francisco Gotera',       icon: 'MO' },
  { id: 'lu',  name: 'La Unión',       city: 'La Unión Puerto',            icon: 'LU' },
  { id: 'ch',  name: 'Chalatenango',   city: 'Chalatenango Centro',        icon: 'CH' },
];

const CATALOG = [
  { sku:'CBL-100', name:'THHN Copper Wire #12',  cat:'Cable & Wire', unit:'per 100m roll', price:142.00, icon:'CBL' },
  { sku:'CBL-220', name:'Aluminum Cable 8000 #2', cat:'Cable & Wire', unit:'per 100m roll', price:268.00, icon:'AL' },
  { sku:'CND-050', name:'PVC Conduit 1/2"',       cat:'Conduit',      unit:'per 10 units',  price:34.50,  icon:'PVC' },
  { sku:'CND-075', name:'EMT Conduit 3/4"',       cat:'Conduit',      unit:'per 10 units',  price:58.00,  icon:'EMT' },
  { sku:'BRK-020', name:'Circuit Breaker 20A',    cat:'Components',   unit:'each',          price:11.75,  icon:'20A' },
  { sku:'PNL-012', name:'Load Center Panel 12-ckt',cat:'Components',  unit:'each',          price:89.00,  icon:'PNL' },
  { sku:'CON-001', name:'Connector Kit (assorted)',cat:'Hardware',   unit:'per box',       price:46.00,  icon:'KIT' },
  { sku:'TPE-330', name:'Insulation Tape',        cat:'Hardware',     unit:'per 10 rolls',  price:18.25,  icon:'TPE' },
  { sku:'GLV-008', name:'Work Gloves',            cat:'Safety',       unit:'per dozen',     price:27.00,  icon:'PPE' },
  { sku:'HLM-004', name:'Safety Helmet',          cat:'Safety',       unit:'each',          price:14.50,  icon:'HLM' },
  { sku:'STR-150', name:'Cable Ties 150mm',       cat:'Hardware',     unit:'per 1000',      price:22.00,  icon:'TIE' },
  { sku:'MTR-001', name:'Digital Multimeter',     cat:'Tools',        unit:'each',          price:63.00,  icon:'MTR' },
];

// Stress-test seed: index.html?demo=big appends ~300 generated SKUs (or ?demo=N
// for N) so the picker's search/filter/pagination can be felt at scale.
// Real demo stays at the curated 12 with no query param.
(function(){
  try{
    var n = new URLSearchParams(location.search).get('demo');
    if(n!=='big' && !(parseInt(n,10)>0)) return;
    var count = (n==='big') ? 300 : Math.min(2000, parseInt(n,10));
    var groups = [
      { cat:'Cable & Wire', pre:'CBL', names:['THHN Copper Wire','Aluminum Cable 8000','XHHW Wire','Bare Copper Ground','Coax RG6','Cat6 UTP','Flexible Cord SJOOW','Welding Cable'], lo:80, hi:420 },
      { cat:'Conduit',      pre:'CND', names:['PVC Conduit','EMT Conduit','Rigid Steel Conduit','Liquidtight Flex','PVC Elbow','EMT Coupling'], lo:8, hi:120 },
      { cat:'Components',   pre:'CMP', names:['Circuit Breaker','Load Center Panel','Contactor','GFCI Outlet','Disconnect Switch','Surge Protector','Relay Module'], lo:9, hi:240 },
      { cat:'Hardware',     pre:'HDW', names:['Connector Kit','Insulation Tape','Cable Ties','Wire Nuts','Strut Channel','Mounting Bracket','Cable Gland','Junction Box'], lo:4, hi:90 },
      { cat:'Safety',       pre:'SAF', names:['Work Gloves','Safety Helmet','Safety Glasses','Hi-Vis Vest','Ear Plugs','Voltage Tester','Lockout Tagout Kit'], lo:6, hi:140 },
      { cat:'Tools',        pre:'TLS', names:['Digital Multimeter','Wire Stripper','Cable Cutter','Crimping Tool','Torque Wrench','Conduit Bender','Fish Tape','Label Printer'], lo:18, hi:380 }
    ];
    var units=['each','per box','per 10 units','per 100m roll','per pack','per set','per 1000'];
    var sizes=['#12','#10','#8','#6','#2','1/2"','3/4"','1"','20A','30A','40A','60A','150mm','300mm','Small','Medium','Large','Pro','Heavy-Duty'];
    var seed=12345; var rng=function(){ seed=(seed*9301+49297)%233280; return seed/233280; };
    for(var i=0;i<count;i++){
      var g=groups[i%groups.length];
      var nm=g.names[Math.floor(rng()*g.names.length)];
      var sz=sizes[Math.floor(rng()*sizes.length)];
      var price=Math.round((g.lo+rng()*(g.hi-g.lo))*100)/100;
      var unit=units[Math.floor(rng()*units.length)];
      CATALOG.push({
        sku: g.pre+'-'+String(1000+i),
        name: nm+' '+sz,
        cat: g.cat,
        unit: unit,
        price: price,
        icon: g.pre
      });
    }
  }catch(e){ /* no-op: stress seed is optional */ }
})();

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

/* ===== Mock product API =====
 * Stands in for a real backend endpoint:
 *   GET /products?q=&cat=&page=&pageSize=  ->  { items, total, page, pages }
 * The filtering + pagination happen HERE (server-side), so the client only
 * ever receives one page of rows — the pattern you'd use past ~1–2k items.
 * Swap ProductAPI.search() for a fetch() call and the picker is unchanged. */
const ProductAPI = (function(){
  // simulate variable network latency so the loading state is real
  function latency(){ return 140 + Math.floor(Math.random()*220); }
  return {
    search({ q = '', cat = 'All', page = 1, pageSize = 8 } = {}){
      return new Promise(resolve => {
        setTimeout(() => {
          const needle = String(q).trim().toLowerCase();
          const rows = CATALOG.filter(p => {
            if(cat !== 'All' && p.cat !== cat) return false;
            if(!needle) return true;
            return (p.name + ' ' + p.sku + ' ' + p.cat).toLowerCase().includes(needle);
          });
          const total = rows.length;
          const pages = Math.max(1, Math.ceil(total / pageSize));
          const safe  = Math.min(Math.max(1, page), pages);
          const start = (safe - 1) * pageSize;
          resolve({ items: rows.slice(start, start + pageSize), total, page: safe, pages, pageSize });
        }, latency());
      });
    }
  };
})();

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
