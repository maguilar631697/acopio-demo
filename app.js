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

/* ===== Payment methods ===== */
const PAY_ACCOUNTS = {
  venmo: { handle: '@Acopio-SV',        label: 'Venmo' },
  zelle: { email: 'pagos@acopio.sv', phone: '+503 2222-1000', name: 'Acopio Distribución S.A. de C.V.', label: 'Zelle' }
};
const PAY_LABEL = { card:'Card', venmo:'Venmo', zelle:'Zelle' };

/* Canonical order status used by the admin console + filters.
 * - awaiting : a Zelle payment was submitted but staff hasn't confirmed it
 * - reserved : deposit settled, waiting for pickup
 * - picked_up: collected and balance paid */
function orderStatus(o){
  if(o && o.payment && o.payment.method==='zelle' && o.payment.status==='pending') return 'awaiting';
  if(o && o.pickedUp) return 'picked_up';
  return 'reserved';
}
const STATUS_META = {
  awaiting:  { label:'Awaiting confirmation', cls:'await' },
  reserved:  { label:'Reserved',              cls:'due'   },
  picked_up: { label:'Picked up',             cls:'picked'}
};

/* ===== Mock orders API (server-side filtering, like ProductAPI) =====
 *   GET /orders?q=&status=&center=&method=&page=  ->  { items, total, page, pages }
 * Swap _all()/save for real fetch() calls and the admin UI is unchanged. */
const OrdersAPI = (function(){
  function latency(){ return 120 + Math.floor(Math.random()*200); }
  function _all(){ let l=[]; try{ l=JSON.parse(localStorage.getItem(ORDERS))||[] }catch(e){} return l; }
  return {
    list({ q='', status='all', center='all', method='all', page=1, pageSize=8 } = {}){
      return new Promise(resolve => setTimeout(() => {
        const needle = String(q).trim().toLowerCase();
        const rows = _all().filter(o => {
          if(status!=='all' && orderStatus(o)!==status) return false;
          if(center!=='all' && o.center.id!==center) return false;
          if(method!=='all' && ((o.payment&&o.payment.method)||'card')!==method) return false;
          if(!needle) return true;
          return (o.orderId+' '+o.customer.name+' '+(o.customer.phone||'')).toLowerCase().includes(needle);
        }).sort((a,b) => (b.placed||'').localeCompare(a.placed||'') || b.orderId.localeCompare(a.orderId));
        const total = rows.length;
        const pages = Math.max(1, Math.ceil(total/pageSize));
        const safe  = Math.min(Math.max(1,page), pages);
        const start = (safe-1)*pageSize;
        resolve({ items: rows.slice(start, start+pageSize), total, page:safe, pages, pageSize });
      }, latency()));
    },
    stats(){
      const l=_all();
      return {
        orders: l.length,
        // revenue recognized = deposits actually settled (card/venmo paid + confirmed zelle)
        revenue: l.reduce((t,o)=> t + (o.depositPaid ? (o.deposit||0) : 0), 0),
        awaiting: l.filter(o=> orderStatus(o)==='awaiting').length,
        pickedUp: l.filter(o=> o.pickedUp).length
      };
    },
    confirmZelle(id){
      const o=findOrder(id);
      if(o && o.payment && o.payment.method==='zelle'){
        o.payment.status='confirmed';
        o.payment.confirmedAt=new Date().toISOString();
        o.depositPaid=true;
        saveOrder(o);
      }
      return o;
    },
    markPicked(id){ const o=findOrder(id); if(o){ o.pickedUp=true; saveOrder(o); } return o; }
  };
})();

/* ===== Example orders so the admin console has data to visualize ===== */
function sampleOrders(){
  const mk = (id, centerId, name, phone, placed, pairs, payment, pickedUp) => {
    const c = CENTERS.find(x=>x.id===centerId) || {};
    const items = pairs.map(([sku,qty]) => { const p=CATALOG.find(x=>x.sku===sku); return { ...p, qty }; });
    const sub = items.reduce((t,i)=> t + i.price*i.qty, 0);
    const dep = depositOf(sub);
    const paid = payment.status==='paid' || payment.status==='confirmed';
    return { orderId:id, center:{ id:c.id, name:c.name, city:c.city }, items,
      customer:{ name, phone }, subtotal:sub, deposit:dep, balance:sub-dep,
      depositPaid:paid, pickedUp:!!pickedUp, placed, payment };
  };
  return [
    mk('ACO-1042','sm','Carlos Menjívar','+503 7012-4488','2026-06-15',[['CBL-100',3],['CND-075',2],['BRK-020',10]],{ method:'card', status:'paid', last4:'4242', paidAt:'2026-06-15T14:20:00' },false),
    mk('ACO-1043','ss','María Elena Portillo','+503 7755-2210','2026-06-15',[['CBL-220',4],['CON-001',3]],{ method:'zelle', status:'pending', reference:'BAC-8842197', note:'Depósito pedido ACO-1043', payerHandle:'maria.portillo@gmail.com', submittedAt:'2026-06-15T15:02:00' },false),
    mk('ACO-1044','sa','Roberto Cáceres','+503 7088-1190','2026-06-14',[['PNL-012',2],['BRK-020',24],['CON-001',2]],{ method:'card', status:'paid', last4:'1881', paidAt:'2026-06-14T10:11:00' },true),
    mk('ACO-1045','la','Ana Sofía Rivas','+503 7234-5567','2026-06-14',[['GLV-008',5],['HLM-004',5],['TPE-330',8]],{ method:'venmo', status:'paid', payerHandle:'@anasofia-rivas', paidAt:'2026-06-14T16:40:00' },false),
    mk('ACO-1046','us','José Antonio Mejía','+503 7900-3321','2026-06-14',[['CBL-100',6],['STR-150',4]],{ method:'zelle', status:'pending', reference:'AGRICOLA-553120', note:'ACO-1046 cable deposit', payerHandle:'+503 7900-3321', submittedAt:'2026-06-14T18:25:00' },false),
    mk('ACO-1047','sm','Wendy Guzmán','+503 7012-8845','2026-06-13',[['MTR-001',2],['CON-001',1]],{ method:'card', status:'paid', last4:'7733', paidAt:'2026-06-13T09:30:00' },false),
    mk('ACO-1048','so','Luis Fernando Alas','+503 7345-9912','2026-06-13',[['CND-050',10],['CND-075',6]],{ method:'zelle', status:'confirmed', reference:'CUSCATLAN-220194', note:'pago ACO-1048', payerHandle:'lf.alas@outlook.com', submittedAt:'2026-06-12T20:00:00', confirmedAt:'2026-06-13T08:05:00' },true),
    mk('ACO-1049','mo','Karla Beatriz Romero','+503 7820-1144','2026-06-13',[['TPE-330',12],['STR-150',6],['GLV-008',2]],{ method:'card', status:'paid', last4:'9090', paidAt:'2026-06-13T13:12:00' },false),
    mk('ACO-1050','lu','Mario Ernesto Cruz','+503 7456-7788','2026-06-12',[['PNL-012',1],['BRK-020',12]],{ method:'venmo', status:'paid', payerHandle:'@mario-cruz-sv', paidAt:'2026-06-12T11:45:00' },true),
    mk('ACO-1051','ch','Gloria Esperanza Díaz','+503 7677-3020','2026-06-12',[['CBL-220',2],['CON-001',1],['TPE-330',4]],{ method:'zelle', status:'pending', reference:'DAVIVIENDA-99320', note:'Gloria Díaz - ACO 1051', payerHandle:'gloria.diaz@hotmail.com', submittedAt:'2026-06-12T19:10:00' },false),
    mk('ACO-1052','ss','Óscar Armando Flores','+503 7011-6654','2026-06-11',[['MTR-001',1],['GLV-008',3],['HLM-004',3]],{ method:'card', status:'paid', last4:'3210', paidAt:'2026-06-11T15:50:00' },false),
    mk('ACO-1053','sa','Patricia Lemus','+503 7233-9087','2026-06-11',[['CBL-100',2],['CND-075',3]],{ method:'zelle', status:'confirmed', reference:'BAC-7012933', note:'deposito acopio 1053', payerHandle:'+503 7233-9087', submittedAt:'2026-06-10T21:30:00', confirmedAt:'2026-06-11T07:40:00' },false),
    mk('ACO-1054','ah','Edwin Salazar','+503 7544-2200','2026-06-10',[['STR-150',10],['TPE-330',6]],{ method:'card', status:'paid', last4:'6677', paidAt:'2026-06-10T12:00:00' },true),
    mk('ACO-1055','la','Sandra Milena Vásquez','+503 7012-9981','2026-06-10',[['CBL-220',3],['BRK-020',8],['CON-001',2]],{ method:'zelle', status:'pending', reference:'BAC-7741888', note:'pago acopio 1055', payerHandle:'+503 7012-9981', submittedAt:'2026-06-10T17:22:00' },false)
  ];
}
// Populate sample orders if none exist (or force a reset). Returns the list.
function seedOrders(force){
  let existing=[]; try{ existing=JSON.parse(localStorage.getItem(ORDERS))||[] }catch(e){}
  if(existing.length && !force) return existing;
  const data = sampleOrders();
  localStorage.setItem(ORDERS, JSON.stringify(data));
  return data;
}
