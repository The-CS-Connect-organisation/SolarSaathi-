/* SolarSaathi — Panel 1: Vendor App (S.E.V.A. unit for street vendors)
   Sunalyzer-style sidebar dashboard, natively built. Rendered at #/vendorapp for role 'user'. */
(() => {
  const SS = window.SS;
  if(!SS) return;
  const { fmt, esc, timeAgo, toast, openModal, closeModal } = SS;

  // ——— i18n (first-launch language selection) ———
  const LANGS = [
    { id:'te', name:'తెలుగు (Telugu)' },
    { id:'hi', name:'हिन्दी (Hindi)' },
    { id:'en', name:'English' },
    { id:'mr', name:'मराठी (Marathi)' },
    { id:'kn', name:'ಕನ್ನಡ (Kannada)' },
  ];
  const T = {
    en: { home:'Home', billing:'Billing', usage:'Usage', support:'Support', alerts:'Alerts', profile:'Profile',
          panic:"Something's wrong", paynow:'Pay now', todayFee:"Today's fee", balance:'Wallet balance',
          battery:'Battery', powered:'Power status', autopay:'Auto-debit' },
    hi: { home:'होम', billing:'बिल', usage:'उपयोग', support:'सहायता', alerts:'सूचनाएँ', profile:'प्रोफ़ाइल',
          panic:'कुछ गड़बड़ है', paynow:'अभी भुगतान करें', todayFee:'आज का शुल्क', balance:'वॉलेट बैलेंस',
          battery:'बैटरी', powered:'बिजली स्थिति', autopay:'ऑटो-डेबिट' },
    te: { home:'హోమ్', billing:'బిల్లింగ్', usage:'వాడకం', support:'సహాయం', alerts:'నోటిఫికేషన్లు', profile:'ప్రొఫైల్',
          panic:'ఏదో తప్పుగా ఉంది', paynow:'ఇప్పుడే చెల్లించండి', todayFee:'ఈరోజు ఫీజు', balance:'వాలెట్ బ్యాలెన్స్',
          battery:'బ్యాటరీ', powered:'పవర్ స్థితి', autopay:'ఆటో-డెబిట్' },
    mr: { home:'होम', billing:'बिल', usage:'वापर', support:'मदत', alerts:'सूचना', profile:'प्रोफाइल',
          panic:'काहीतरी चुकीचे आहे', paynow:'आता भरा', todayFee:'आजचे शुल्क', balance:'वॉलेट शिल्लक',
          battery:'बॅटरी', powered:'वीज स्थिती', autopay:'ऑटो-डेबिट' },
    kn: { home:'ಹೋಮ್', billing:'ಬಿಲ್ಲಿಂಗ್', usage:'ಬಳಕೆ', support:'ಸಹಾಯ', alerts:'ಅಧಿಸೂಚನೆಗಳು', profile:'ಪ್ರೊಫೈಲ್',
          panic:'ಏನೋ ತಪ್ಪಾಗಿದೆ', paynow:'ಈಗ ಪಾವತಿಸಿ', todayFee:'ಇಂದಿನ ಶುಲ್ಕ', balance:'ವ್ಯಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸ್',
          battery:'ಬ್ಯಾಟರಿ', powered:'ಪವರ್ ಸ್ಥಿತಿ', autopay:'ಆಟೋ-ಡೆಬಿಟ್' },
  };

  // ——— Vendor data store (per user, persisted) ———
  const VKEY = 'solarSaathi.vendor.v1';
  function loadVendors(){
    try{ return JSON.parse(localStorage.getItem(VKEY)) || {}; }catch(e){ return {}; }
  }
  function saveVendors(v){ localStorage.setItem(VKEY, JSON.stringify(v)); }

  function getVendor(userId){
    const all = loadVendors();
    if(all[userId]) return all[userId];
    const v = makeVendor(userId);
    all[userId] = v; saveVendors(all);
    return v;
  }
  function updateVendor(userId, mut){
    const all = loadVendors();
    const v = all[userId] || makeVendor(userId);
    mut(v);
    all[userId] = v; saveVendors(all);
    return v;
  }

  // ——— Server mode helpers (SSServerMode() is live, see api-client.js) ———
  const API = window.SSAPI;
  async function safeCall(fn, fallback='Something went wrong'){
    try{ return await fn(); }
    catch(err){
      if(err && err.offline){
        if(!window.__SS_ENTERED_LOCAL__){
          window.__SS_ENTERED_LOCAL__ = true;
          toast('Backend unavailable — continuing with local demo data','error');
        }
        try{ window.SSRoute && window.SSRoute(); }catch(_){ /* ignore */ }
        return null;
      }
      toast(err.message || fallback, 'error'); return null;
    }
  }
  function applyVendor(v){
    if(!v) return;
    const u = SS.currentUser();
    if(!u) return;
    updateVendor(u.id, x=>Object.assign(x, v));
  }
  async function pullVendor(){
    if(!SSServerMode()) return null;
    const res = await safeCall(()=>API.get('/vendor/me'));
    if(!res) return null;
    applyVendor(res.vendor);
    if(res.booking){
      const i = SS.store.bookings.findIndex(b=>b.id===res.booking.id);
      if(i >= 0) SS.store.bookings[i] = res.booking; else SS.store.bookings.unshift(res.booking);
      SS.saveStore();
    }
    return res;
  }

  function makeVendor(userId){
    const user = SS.getUsers().find(u=>u.id===userId) || {};
    const rnd = SS.mulberry32(String(userId).split('').reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0, 11) + 7);
    const unitId = 'SEV-' + Math.floor(1000 + rnd()*8999);
    const cities = ['Hyderabad','Warangal','Pune','Jaipur','Lucknow'];
    const city = user.district && SS.DISTRICTS.find(d=>d.name===user.district) ? user.district : cities[Math.floor(rnd()*cities.length)];
    return {
      unitId,
      stallName: user.name ? user.name + "'s Stall" : 'My Stall',
      stallType: ['Pani Puri Cart','Tea Stall','Fruit Cart','Tiffin Center','Vegetable Stall'][Math.floor(rnd()*5)],
      city,
      // stall pin on the schematic market map (0-100 coords)
      pin: { x: 20 + rnd()*60, y: 20 + rnd()*60 },
      language: 'en',
      upiId: (user.name||'vendor').toLowerCase().replace(/[^a-z]+/g,'') + '@upi',
      phone: user.phone || '9876543210',
      pmSvanidhi: rnd() > 0.35 ? 'SVAN' + Math.floor(10000000 + rnd()*89999999) : '',
      onboarded: false,
      autopay: true,
      balance: Math.round(50 + rnd()*450),
      installedDate: null,          // set when onboarding completes
      installWindow: null,
      agent: { name:['Lakshman','Ganesh','Srinu','Bala'][Math.floor(rnd()*4)], phone:'9' + Math.floor(100000000 + rnd()*899999999), zone:'Zone ' + (1+Math.floor(rnd()*4)) },
      referrals: Math.floor(rnd()*4),
      referralCode: 'SEVA' + String(userId).replace(/[^A-Z0-9]/gi,'').slice(-4).toUpperCase(),
    };
  }

  // ——— Deterministic daily ledger: fee paid/missed per day ———
  function dailyLedger(vendor, booking, days){
    const seed = String(vendor.unitId).split('').reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0, 3);
    const rnd = SS.mulberry32(seed + days);
    const dailyFee = booking ? Math.max(10, Math.round(booking.monthlyAmount / 30)) : 30;
    const today = new Date(); today.setHours(0,0,0,0);
    const paidDays = new Set(vendor.paidDays || []);
    const arr = [];
    for(let i=days-1; i>=0; i--){
      const dt = new Date(today.getTime() - i*86400000);
      const key = dt.toISOString().slice(0,10);
      const missed = rnd() < 0.09 && !paidDays.has(key); // ~9% missed days unless paid
      arr.push({ key, date: dt, fee: dailyFee, paid: !missed, missed });
    }
    return arr;
  }
  // ——— Deterministic usage: hours powered + breakdown ———
  function usageSeries(vendor, days){
    const seed = String(vendor.unitId).split('').reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0, 5);
    const rnd = SS.mulberry32(seed + days);
    const today = new Date(); today.setHours(0,0,0,0);
    const arr = [];
    for(let i=days-1; i>=0; i--){
      const dt = new Date(today.getTime() - i*86400000);
      const hrs = Math.round((6 + rnd()*8) * 10) / 10; // 6-14 hours powered
      arr.push({
        date: dt,
        hours: hrs,
        lighting: Math.round((35 + rnd()*20)), // % split
        fan: Math.round((25 + rnd()*15)),
        charging: 0,
      });
      arr[arr.length-1].charging = 100 - arr[arr.length-1].lighting - arr[arr.length-1].fan;
    }
    return arr;
  }

  function vendorBooking(userId){
    return SS.store.bookings.find(b=>b.userId===userId && ['Live','Installed','Installation scheduled','Resources allotted'].includes(b.status))
        || SS.store.bookings.find(b=>b.userId===userId) || null;
  }

  function unitStatus(vendor, booking, ledger){
    const missed = ledger.filter(d=>d.missed).length;
    const recentMissed = ledger.slice(-7).filter(d=>d.missed).length;
    if(!booking || booking.status!=='Live') return { state:'awaiting', label:'Awaiting install', cls:'badge-default' };
    if(recentMissed >= 2) return { state:'paused', label:'Paused — non-payment', cls:'badge-error' };
    if(vendor.balance < ledger[ledger.length-1].fee) return { state:'low', label:'Low balance', cls:'badge-warning' };
    return { state:'active', label:'Charged & ready', cls:'badge-success' };
  }

  // ——— Shell layout (Sunalyzer DNA: dark sidebar + content cards) ———
  const NAV = [
    { id:'home',     icon:'⌂', key:'home' },
    { id:'billing',  icon:'₹', key:'billing' },
    { id:'usage',    icon:'⚡', key:'usage' },
    { id:'support',  icon:'🛠', key:'support' },
    { id:'alerts',   icon:'🔔', key:'alerts' },
    { id:'profile',  icon:'👤', key:'profile' },
  ];

  function shell(active, inner, vendor, booking){
    const t = T[vendor.language] || T.en;
    const st = unitStatus(vendor, booking, dailyLedger(vendor, booking, 30));
    SS.view().innerHTML = `
    <div class="vendorapp-shell">
      <style>
        .vendorapp-shell{position:fixed;inset:0;z-index:9998;background:#f6faf6;display:flex;padding-top:64px;}
        .va-sidebar{width:230px;flex-shrink:0;background:#0b1a10;color:#e7f0e7;display:flex;flex-direction:column;}
        .va-brand{display:flex;align-items:center;gap:10px;padding:18px 16px 14px;border-bottom:1px solid rgba(255,255,255,.08);}
        .va-brand .logo{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#22c55e,#15803d);display:grid;place-items:center;font-size:17px;}
        .va-brand b{font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:.5px;}
        .va-brand small{display:block;font-size:9px;color:#9fb8a3;letter-spacing:2px;text-transform:uppercase;}
        .va-unit{padding:12px 16px;font-size:11px;color:#9fb8a3;border-bottom:1px solid rgba(255,255,255,.08);}
        .va-unit b{color:#fff;font-size:13px;letter-spacing:1px;}
        .va-nav{flex:1;padding:10px 8px;overflow-y:auto;}
        .va-nav a{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:12px;color:#cfe0cf;text-decoration:none;font-size:14px;font-weight:600;margin-bottom:2px;transition:background .15s,color .15s;}
        .va-nav a:hover{background:rgba(255,255,255,.06);color:#fff;}
        .va-nav a.active{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;box-shadow:0 4px 14px rgba(22,163,74,.35);}
        .va-nav .ico{width:22px;text-align:center;font-size:15px;}
        .va-nav .cnt{margin-left:auto;background:#ef4444;color:#fff;font-size:10px;font-weight:800;border-radius:99px;padding:1px 7px;}
        .va-sidefoot{padding:14px 16px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;color:#9fb8a3;}
        .va-main{flex:1;overflow-y:auto;padding:22px 26px 90px;}
        .va-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;}
        .va-head h1{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:24px;color:#122012;margin:0;}
        .va-card{background:#fff;border:1px solid #e2ece2;border-radius:18px;padding:20px;box-shadow:0 1px 3px rgba(10,40,10,.05);}
        .va-grid{display:grid;gap:14px;}
        .va-btn{border:none;border-radius:12px;padding:12px 18px;font-weight:700;font-size:14px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .15s;}
        .va-btn-green{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;box-shadow:0 4px 14px rgba(22,163,74,.3);}
        .va-btn-green:hover{transform:translateY(-1px);}
        .va-btn-red{background:#fee2e2;color:#b91c1c;border:2px solid #fecaca;}
        .va-btn-red:hover{background:#fecaca;}
        .va-btn-ghost{background:#fff;border:2px solid #e2ece2;color:#334a33;}
        .va-btn-ghost:hover{border-color:#16a34a;color:#15803d;}
        .va-btn:disabled{opacity:.5;cursor:not-allowed;transform:none!important;}
        .va-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:800;letter-spacing:.4px;}
        .va-meter{height:14px;border-radius:99px;background:#e7efe7;overflow:hidden;}
        .va-meter>i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#22c55e,#15803d);transition:width .6s cubic-bezier(.16,1,.3,1);}
        .va-batt{width:120px;height:56px;border:3px solid #334a33;border-radius:10px;position:relative;padding:4px;}
        .va-batt::after{content:'';position:absolute;right:-10px;top:16px;width:7px;height:20px;background:#334a33;border-radius:0 4px 4px 0;}
        .va-batt>i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#4ade80,#16a34a);transition:width .6s;}
        .va-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}
        .va-cal .day{aspect-ratio:1;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:700;}
        .va-cal .d-paid{background:#dcfce7;color:#15803d;}
        .va-cal .d-missed{background:#fee2e2;color:#b91c1c;}
        .va-cal .d-future{background:#f4f8f4;color:#b6c8b6;}
        .va-cal .d-today{outline:3px solid #16a34a;outline-offset:-3px;}
        .va-cal .dow{font-size:9px;color:#8aa08a;text-transform:uppercase;letter-spacing:1px;}
        .va-bars{display:flex;align-items:flex-end;gap:6px;height:150px;padding-top:8px;}
        .va-bars .bar{flex:1;border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,#4ade80,#16a34a);min-height:4px;position:relative;transition:height .6s cubic-bezier(.16,1,.3,1);}
        .va-bars .bar:hover::after{content:attr(data-v);position:absolute;top:-22px;left:50%;transform:translateX(-50%);background:#0b1a10;color:#fff;font-size:10px;padding:2px 7px;border-radius:6px;white-space:nowrap;}
        .va-bars .lbl{font-size:9px;color:#8aa08a;text-align:center;margin-top:5px;}
        .va-timeline .step{display:flex;gap:12px;padding-bottom:16px;position:relative;}
        .va-timeline .step::before{content:'';position:absolute;left:13px;top:28px;bottom:0;width:2px;background:#e2ece2;}
        .va-timeline .step:last-child::before{display:none;}
        .va-timeline .dot{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:800;flex-shrink:0;z-index:1;}
        .va-list .item{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:14px;border:1px solid #e2ece2;margin-bottom:10px;background:#fff;}
        .va-pin-map{position:relative;border-radius:16px;overflow:hidden;border:1px solid #d8e8d8;cursor:crosshair;background:linear-gradient(135deg,#eef6ee,#e2efe2);}
        .va-pin-map .rd{position:absolute;background:rgba(51,74,51,.18);}
        .va-pin-map .rd.h{height:10px;left:0;right:0;}
        .va-pin-map .rd.v{width:10px;top:0;bottom:0;}
        .va-pin{position:absolute;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#16a34a;border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.3);margin:-26px 0 0 -13px;pointer-events:none;}
        @media(max-width:820px){
          .va-sidebar{display:none;}
          .vendorapp-shell{padding-top:0;}
          .va-mobilebar{display:flex!important;}
          .va-main{padding:16px 14px 110px;}
        }
        .va-mobilebar{display:none;position:absolute;left:0;right:0;bottom:0;background:#0b1a10;z-index:50;padding:8px 6px calc(8px + env(safe-area-inset-bottom));justify-content:space-around;}
        .va-mobilebar a{display:flex;flex-direction:column;align-items:center;gap:2px;color:#9fb8a3;text-decoration:none;font-size:9px;font-weight:700;padding:4px 10px;border-radius:10px;}
        .va-mobilebar a.active{color:#fff;background:rgba(34,197,94,.25);}
        .va-mobilebar .ico{font-size:17px;}
      </style>

      <!-- Sidebar (desktop) -->
      <aside class="va-sidebar">
        <div class="va-brand">
          <span class="logo">☀️</span>
          <div><b>SolarSaathi</b><small>S.E.V.A. Vendor App</small></div>
        </div>
        <div class="va-unit">MY UNIT<b>${esc(vendor.unitId)}</b></div>
        <nav class="va-nav">
          ${NAV.map(n=>`
            <a href="#/vendorapp/${n.id}" class="${active===n.id?'active':''}">
              <span class="ico">${n.icon}</span>${t[n.key]}
              ${n.id==='alerts' && unreadAlerts() ? `<span class="cnt">${unreadAlerts()}</span>` : ''}
            </a>`).join('')}
        </nav>
        <div class="va-sidefoot">
          <div>Agent: <b style="color:#fff">${esc(vendor.agent.name)}</b> • ${esc(vendor.agent.zone)}</div>
          <div style="margin-top:6px;"><a href="#/" style="color:#4ade80;text-decoration:none;font-weight:700;">← Back to site</a></div>
        </div>
      </aside>

      <!-- Mobile bottom bar -->
      <div class="va-mobilebar">
        ${NAV.map(n=>`
          <a href="#/vendorapp/${n.id}" class="${active===n.id?'active':''}">
            <span class="ico">${n.icon}</span>${t[n.key]}
          </a>`).join('')}
      </div>

      <main class="va-main">${inner}</main>
    </div>`;
  }

  // ——— Vendor-specific alerts (persisted) ———
  function vendorAlerts(userId){
    const all = loadVendors();
    if(!all[userId]?.alerts) all[userId] = Object.assign(makeVendor(userId), all[userId]||{});
    if(!all[userId].alerts){ all[userId].alerts = seedAlerts(all[userId]); saveVendors(all); }
    return all[userId].alerts;
  }
  function saveAlerts(userId, alerts){
    updateVendor(userId, v=>{ v.alerts = alerts; });
  }
  function unreadAlerts(){
    const u = SS.currentUser(); if(!u) return 0;
    return vendorAlerts(u.id).filter(a=>!a.read).length;
  }
  function seedAlerts(vendor){
    const now = Date.now();
    return [
      { id:'VA1', type:'payment', title:'Payment received', msg:'Today\'s fee auto-debited from wallet. Thank you!', read:false, at: now - 3*3600e3 },
      { id:'VA2', type:'maintenance', title:'Maintenance scheduled', msg:'Battery health check on ' + new Date(now + 3*86400e3).toLocaleDateString('en-IN') + ' — agent ' + vendor.agent.name + ' will visit.', read:false, at: now - 26*3600e3 },
      { id:'VA3', type:'fault', title:'System check complete', msg:'A loose wiring connection was detected and fixed remotely. No action needed.', read:true, at: now - 3*86400e3 },
    ];
  }

  // ===================== VIEWS =====================

  function viewHome(vendor, booking){
    const t = T[vendor.language] || T.en;
    const ledger = dailyLedger(vendor, booking, 30);
    const st = unitStatus(vendor, booking, ledger);
    const today = ledger[ledger.length-1];
    const usage = usageSeries(vendor, 7);
    const battPct = st.state==='paused' ? 12 : Math.round(55 + usage[usage.length-1].hours * 3);
    const gridEquiv = booking ? Math.round(booking.units * (SS.DISTRICTS.find(d=>d.name===booking.district)?.gridRate||8)) : 0;
    const ourBill = booking ? booking.monthlyAmount : 0;
    const yearlySave = (gridEquiv - ourBill) * 12;

    const battColor = battPct > 40 ? '' : 'background:linear-gradient(90deg,#f87171,#dc2626);';
    return `
    <div class="va-head">
      <div>
        <h1>${esc(t.home)} — ${esc(vendor.stallName)}</h1>
        <p style="margin:4px 0 0;font-size:13px;color:#6b7f6b;">${esc(vendor.stallType)} • ${esc(vendor.city)} • Unit ${esc(vendor.unitId)}</p>
      </div>
      <span class="va-pill ${st.cls}" style="padding:8px 16px;font-size:12px;">${st.label}</span>
    </div>

    ${st.state==='awaiting' ? `
      <div class="va-card" style="border-left:5px solid #f59e0b;margin-bottom:14px;">
        <b>🛠 Your S.E.V.A. unit is on its way!</b>
        <p style="margin:6px 0 0;font-size:13px;color:#6b7f6b;">Install window: <b>${esc(vendor.installWindow || 'being scheduled')}</b> • Technician ${esc(vendor.agent.name)} (${esc(vendor.agent.phone)}) will set everything up at your stall. You'll get an alert when it's done.</p>
      </div>` : ''}

    <div class="va-grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));">
      <!-- Battery -->
      <div class="va-card" style="text-align:center;">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6b7f6b;">${esc(t.battery)}</div>
        <div style="display:flex;justify-content:center;margin:16px 0;">
          <div class="va-batt"><i style="width:${battPct}%;${battColor}"></i></div>
        </div>
        <div style="font-size:26px;font-weight:800;">${st.state==='paused' ? '⚠️ Paused' : battPct > 60 ? '😊 Comfortable' : '🙂 Enough for today'}</div>
        <div style="font-size:12px;color:#6b7f6b;margin-top:4px;">${st.state==='paused' ? 'Unit locked for non-payment' : 'Powers your lights, fan & charging all evening'}</div>
      </div>

      <!-- Power status -->
      <div class="va-card">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6b7f6b;">${esc(t.powered)}</div>
        <div style="margin-top:12px;display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:13px;">Lighting</span><b style="color:#16a34a;">● ON</b></div>
          <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:13px;">Stall fan</span><b style="color:#16a34a;">● ON</b></div>
          <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:13px;">Phone charging</span><b style="color:#94a3b8;">○ Idle</b></div>
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px dashed #e2ece2;font-size:12px;color:#6b7f6b;">
          Yesterday: <b>${usage[usage.length-1].hours}h</b> powered • avg ${Math.round(usage.reduce((a,x)=>a+x.hours,0)/usage.length*10)/10}h this week
        </div>
      </div>

      <!-- Today's fee -->
      <div class="va-card">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6b7f6b;">${esc(t.todayFee)}</div>
        <div style="font-size:30px;font-weight:800;margin-top:8px;">${fmt(today.fee)}</div>
        <div style="margin-top:6px;">
          ${today.paid
            ? '<span class="va-pill badge-success">✔ Auto-debited</span>'
            : '<span class="va-pill badge-warning">⏳ Debits at 9 PM</span>'}
        </div>
        <div style="margin-top:14px;padding-top:12px;border-top:1px dashed #e2ece2;">
          <div style="font-size:12px;color:#6b7f6b;">${esc(t.balance)}</div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:2px;">
            <b style="font-size:20px;${vendor.balance < today.fee*3 ? 'color:#b45309;' : ''}">${fmt(vendor.balance)}</b>
            <button class="va-btn va-btn-ghost" style="padding:6px 12px;font-size:12px;" onclick="VATopUp()">+ Top up</button>
          </div>
          ${vendor.balance < today.fee*3 ? `<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:#fef3c7;color:#92400e;font-size:11px;font-weight:600;">⚠️ Low balance — top up to avoid a pause</div>` : ''}
        </div>
      </div>
    </div>

    <!-- Savings counter -->
    <div class="va-card" style="margin-top:14px;background:linear-gradient(135deg,#052e16,#14532d);border:none;color:#fff;">
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:14px;align-items:center;">
        <div>
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#86efac;">Your savings vs grid</div>
          <div style="font-size:30px;font-weight:800;margin-top:4px;">${fmt(yearlySave)} <span style="font-size:14px;font-weight:600;opacity:.7;">saved this year</span></div>
          <div style="font-size:12px;color:#bbf7d0;margin-top:4px;">That's ${fmt(Math.round(yearlySave/365))} every day — free money the grid used to take from you. 🎉</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;color:#86efac;">Running total since install</div>
          <div style="font-size:22px;font-weight:800;">${fmt(Math.round(yearlySave/12*6))}</div>
          <div style="font-size:11px;color:#bbf7d0;">6 months on S.E.V.A.</div>
        </div>
      </div>
    </div>

    <!-- Panic button -->
    <div style="margin-top:14px;">
      <button class="va-btn va-btn-red" style="width:100%;padding:16px;font-size:16px;" onclick="VAPanic()">🚨 ${esc(t.panic)}</button>
      <p style="text-align:center;font-size:11px;color:#8aa08a;margin-top:6px;">One press — auto-sends your unit ID & stall location to ${esc(vendor.agent.name)} (your local agent)</p>
    </div>`;
  }

  function viewBilling(vendor, booking){
    const t = T[vendor.language] || T.en;
    const ledger = dailyLedger(vendor, booking, 28);
    const today = ledger[ledger.length-1];
    const paidCount = ledger.filter(d=>d.paid).length;
    const monthSpend = ledger.reduce((a,d)=>a+(d.paid?d.fee:0),0);
    const dow = ['S','M','T','W','T','F','S'];
    const gridEquiv = booking ? Math.round(booking.units * (SS.DISTRICTS.find(d=>d.name===booking.district)?.gridRate||8)) : 0;
    const ourBill = booking ? booking.monthlyAmount : 0;

    return `
    <div class="va-head">
      <div><h1>${esc(t.billing)}</h1><p style="margin:4px 0 0;font-size:13px;color:#6b7f6b;">Daily fee • wallet • auto-debit</p></div>
      <button class="va-btn ${vendor.autopay?'va-btn-green':'va-btn-ghost'}" onclick="VAToggleAutopay()">
        ${esc(t.autopay)}: ${vendor.autopay ? 'ON ✓' : 'OFF'}
      </button>
    </div>

    <div class="va-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));">
      <div class="va-card"><div style="font-size:12px;color:#6b7f6b;">This month paid days</div><div style="font-size:26px;font-weight:800;margin-top:4px;">${paidCount}<span style="font-size:14px;color:#8aa08a;">/28</span></div><div class="va-meter" style="margin-top:10px;"><i style="width:${Math.round(paidCount/28*100)}%"></i></div></div>
      <div class="va-card"><div style="font-size:12px;color:#6b7f6b;">Spent this month</div><div style="font-size:26px;font-weight:800;margin-top:4px;">${fmt(monthSpend)}</div><div style="font-size:11px;color:#8aa08a;margin-top:4px;">${fmt(ourBill)}/mo fixed fee</div></div>
      <div class="va-card"><div style="font-size:12px;color:#6b7f6b;">Saved vs grid (month)</div><div style="font-size:26px;font-weight:800;margin-top:4px;color:#16a34a;">${fmt(gridEquiv-ourBill)}</div><div style="font-size:11px;color:#8aa08a;margin-top:4px;">Grid would be ${fmt(gridEquiv)}</div></div>
    </div>

    <!-- Calendar -->
    <div class="va-card" style="margin-top:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h3 style="margin:0;font-size:15px;">🗓 Payment calendar — last 4 weeks</h3>
        <div style="display:flex;gap:12px;font-size:11px;color:#6b7f6b;">
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#dcfce7;"></span> paid</span>
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#fee2e2;"></span> missed</span>
        </div>
      </div>
      <div class="va-cal">
        ${dow.map(d=>`<div class="dow" style="text-align:center;">${d}</div>`).join('')}
        ${ledger.map(d=>{
          const dt = d.date;
          const pad = (dt.getDay() - ((28 - ledger.length) >= 0 ? 0 : 0));
          return '';
        }).join('')}
        ${ledger.map((d,i)=>{
          const isToday = i===ledger.length-1;
          return `<div class="day ${d.paid?'d-paid':'d-missed'} ${isToday?'d-today':''}" title="${d.key}: ${d.paid?'paid':'missed'} ${fmt(d.fee)}">
            <span>${d.date.getDate()}</span><span style="font-size:8px;">${d.paid?'✔':'✗'}</span>
          </div>`;
        }).join('')}
        ${Array.from({length:(7 - ledger.length % 7) % 7}).map(()=>'<div class="day d-future"></div>').join('')}
      </div>
      <p style="font-size:11px;color:#8aa08a;margin:10px 0 0;">Green = fee auto-debited • Red = missed (wallet empty?) • Boxed = today</p>
    </div>

    <!-- Actions -->
    <div class="va-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-top:14px;">
      <div class="va-card">
        <h3 style="margin:0 0 6px;font-size:15px;">Manual pay now</h3>
        <p style="font-size:12px;color:#6b7f6b;margin:0 0 12px;">If auto-debit failed for a day, pay it here instantly from UPI.</p>
        ${today.paid
          ? '<span class="va-pill badge-success">Today is already paid ✔</span>'
          : `<button class="va-btn va-btn-green" style="width:100%;" onclick="VAPayNow()">${esc(t.paynow)} — ${fmt(today.fee)}</button>`}
      </div>
      <div class="va-card">
        <h3 style="margin:0 0 6px;font-size:15px;">Wallet</h3>
        <p style="font-size:12px;color:#6b7f6b;margin:0 0 12px;">Balance ${fmt(vendor.balance)} • UPI ${esc(vendor.upiId)}</p>
        <button class="va-btn va-btn-ghost" style="width:100%;" onclick="VATopUp()">+ Add money to wallet</button>
      </div>
    </div>`;
  }

  function viewUsage(vendor, booking){
    const t = T[vendor.language] || T.en;
    const week = usageSeries(vendor, 7);
    const max = Math.max(...week.map(w=>w.hours), 1);
    const avgLighting = Math.round(week.reduce((a,x)=>a+x.lighting,0)/week.length);
    const avgFan = Math.round(week.reduce((a,x)=>a+x.fan,0)/week.length);
    const avgChg = Math.round(week.reduce((a,x)=>a+x.charging,0)/week.length);
    const month = usageSeries(vendor, 30);
    const avgMonth = Math.round(month.reduce((a,x)=>a+x.hours,0)/month.length*10)/10;

    return `
    <div class="va-head">
      <div><h1>${esc(t.usage)}</h1><p style="margin:4px 0 0;font-size:13px;color:#6b7f6b;">Hours powered & what your unit ran</p></div>
      <span class="va-pill badge-default">${avgMonth}h/day average</span>
    </div>

    <div class="va-card">
      <h3 style="margin:0 0 4px;font-size:15px;">⚡ Hours powered — last 7 days</h3>
      <div class="va-bars">
        ${week.map(w=>`<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;">
          <div class="bar" data-v="${w.hours}h on ${w.date.toLocaleDateString('en-IN',{weekday:'short'})}" style="height:${Math.round(w.hours/max*100)}%"></div>
        </div>`).join('')}
      </div>
      <div style="display:flex;gap:6px;">${week.map(w=>`<div class="lbl" style="flex:1;">${w.date.toLocaleDateString('en-IN',{weekday:'short'})}</div>`).join('')}</div>
    </div>

    <div class="va-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-top:14px;">
      <div class="va-card">
        <h3 style="margin:0 0 12px;font-size:15px;">What the power ran</h3>
        <div style="display:flex;height:18px;border-radius:99px;overflow:hidden;font-size:10px;color:#fff;font-weight:800;">
          <div style="width:${avgLighting}%;background:#f59e0b;display:grid;place-items:center;">${avgLighting}%</div>
          <div style="width:${avgFan}%;background:#0ea5e9;display:grid;place-items:center;">${avgFan}%</div>
          <div style="width:${avgChg}%;background:#8b5cf6;display:grid;place-items:center;">${avgChg}%</div>
        </div>
        <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;"><span>💡 Stall lighting</span><b>${avgLighting}%</b></div>
          <div style="display:flex;justify-content:space-between;"><span>🌀 Fan</span><b>${avgFan}%</b></div>
          <div style="display:flex;justify-content:space-between;"><span>📱 Phone charging</span><b>${avgChg}%</b></div>
        </div>
      </div>
      <div class="va-card">
        <h3 style="margin:0 0 10px;font-size:15px;">Weekly summary</h3>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;"><span>Total powered</span><b>${Math.round(week.reduce((a,x)=>a+x.hours,0))} hours</b></div>
          <div style="display:flex;justify-content:space-between;"><span>Best day</span><b>${Math.max(...week.map(w=>w.hours))}h</b></div>
          <div style="display:flex;justify-content:space-between;"><span>Evenings with full light</span><b>${week.filter(w=>w.hours>=8).length}/7</b></div>
          <div style="display:flex;justify-content:space-between;"><span>CO2 avoided this week</span><b>${(week.reduce((a,x)=>a+x.hours,0)*0.35).toFixed(1)} kg</b></div>
        </div>
        <p style="font-size:11px;color:#8aa08a;margin-top:12px;">Your unit reports this automatically — no meter readings needed.</p>
      </div>
    </div>`;
  }

  function viewSupport(vendor, booking){
    const t = T[vendor.language] || T.en;
    const issues = (vendor.issues || seedIssues(vendor)).slice().sort((a,b)=>b.at-a.at);
    const STEPS = ['Submitted','Agent assigned','En route','Resolved'];

    return `
    <div class="va-head">
      <div><h1>${esc(t.support)}</h1><p style="margin:4px 0 0;font-size:13px;color:#6b7f6b;">Report an issue & track repairs</p></div>
      <div style="display:flex;gap:8px;">
        <a href="tel:${vendor.agent.phone}" class="va-btn va-btn-ghost" style="text-decoration:none;">📞 Call ${esc(vendor.agent.name)}</a>
        <a href="https://wa.me/91${vendor.agent.phone}?text=${encodeURIComponent('Hi ' + vendor.agent.name + ', issue with my S.E.V.A. unit ' + vendor.unitId)}" target="_blank" class="va-btn va-btn-green" style="text-decoration:none;">💬 WhatsApp</a>
      </div>
    </div>
    <p style="font-size:12px;color:#6b7f6b;margin:-8px 0 14px;">Your local agent: <b>${esc(vendor.agent.name)}</b> • ${esc(vendor.agent.zone)} • calls answered 8 AM – 9 PM. (Not a call center — the same person who installed your unit.)</p>

    <div class="va-card">
      <h3 style="margin:0 0 10px;font-size:15px;">🛠 Report a new issue</h3>
      <form id="vaIssueForm" style="display:flex;flex-direction:column;gap:10px;">
        <input class="input-field" id="vaIssueDesc" placeholder="What's wrong? e.g. fan not spinning, light flickering…" required />
        <label style="font-size:12px;color:#6b7f6b;">📷 Photo (optional — helps the agent bring the right spare part)</label>
        <input type="file" id="vaIssuePhoto" accept="image/*" style="font-size:12px;" />
        <button class="va-btn va-btn-green" type="submit">Submit — auto-tagged with ${esc(vendor.unitId)} & stall location</button>
      </form>
    </div>

    <div class="va-card" style="margin-top:14px;">
      <h3 style="margin:0 0 16px;font-size:15px;">Your repair requests (${issues.length})</h3>
      ${issues.length===0 ? '<p style="font-size:13px;color:#8aa08a;">No issues yet — your unit is running clean. 🎉</p>' : issues.map(is=>`
        <div style="border:1px solid #e2ece2;border-radius:14px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
            <b style="font-size:14px;">${esc(is.desc)}</b>
            <span class="va-pill ${is.status==='Resolved'?'badge-success':is.status==='En route'?'badge-warning':'badge-default'}">${esc(is.status)}</span>
          </div>
          <div style="font-size:11px;color:#8aa08a;margin-top:2px;">${esc(is.id)} • ${esc(vendor.unitId)} • ${timeAgo(new Date(is.at).toISOString())}${is.photo?' • 📷 photo attached':''}</div>
          <div class="va-timeline" style="margin-top:14px;">
            ${STEPS.map((s,i)=>{
              const cur = STEPS.indexOf(is.status);
              const done = i<=cur;
              return `<div class="step">
                <div class="dot" style="${done?'background:#dcfce7;color:#15803d;':'background:#f4f8f4;color:#b6c8b6;'}">${done?'✓':i+1}</div>
                <div style="padding-top:4px;"><b style="font-size:12px;${done?'':'color:#b6c8b6;'}">${s}</b>
                ${s==='Agent assigned'&&cur>=1?`<div style="font-size:11px;color:#6b7f6b;">${esc(vendor.agent.name)} • ${esc(vendor.agent.phone)}</div>`:''}</div>
              </div>`;
            }).join('')}
          </div>
        </div>`).join('')}
    </div>`;
  }

  function seedIssues(vendor){
    const now = Date.now();
    const issues = [
      { id:'ISS-' + Math.floor(1000+Math.random()*8999), desc:'Fan making noise in the evening', status:'En route', at: now - 30*3600e3, photo:true },
      { id:'ISS-' + Math.floor(1000+Math.random()*8999), desc:'Phone charging point loose', status:'Resolved', at: now - 12*86400e3, photo:false },
    ];
    updateVendor(SS.currentUser().id, v=>{ v.issues = issues; });
    return issues;
  }

  function viewAlerts(vendor, booking){
    const t = T[vendor.language] || T.en;
    const alerts = vendorAlerts(SS.currentUser().id);
    const icons = { payment:'₹', maintenance:'🔧', fault:'⚠️' };
    return `
    <div class="va-head">
      <div><h1>${esc(t.alerts)}</h1><p style="margin:4px 0 0;font-size:13px;color:#6b7f6b;">Payments • maintenance • faults — before you even notice</p></div>
      <button class="va-btn va-btn-ghost" onclick="VAMarkAlerts()">Mark all read</button>
    </div>
    <div class="va-list">
      ${alerts.map(a=>`
        <div class="item" style="${a.read?'':'border-color:#86efac;background:#f0fdf4;'}">
          <span style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:17px;background:${a.type==='fault'?'#fee2e2':a.type==='payment'?'#dcfce7':'#e0f2fe'};flex-shrink:0;">${icons[a.type]||'🔔'}</span>
          <div style="flex:1;">
            <b style="font-size:14px;">${esc(a.title)}</b>
            <p style="margin:2px 0 0;font-size:12px;color:#6b7f6b;">${esc(a.msg)}</p>
            <div style="font-size:10px;color:#a3b8a3;margin-top:4px;">${timeAgo(new Date(a.at).toISOString())}</div>
          </div>
          ${a.read?'':'<span style="width:9px;height:9px;border-radius:50%;background:#16a34a;flex-shrink:0;margin-top:6px;"></span>'}
        </div>`).join('')}
    </div>`;
  }

  function viewProfile(vendor, booking){
    const t = T[vendor.language] || T.en;
    const shareLink = location.origin + '/#/register?ref=' + vendor.referralCode;
    return `
    <div class="va-head">
      <div><h1>${esc(t.profile)}</h1><p style="margin:4px 0 0;font-size:13px;color:#6b7f6b;">Stall details & referrals</p></div>
      <button class="va-btn va-btn-ghost" onclick="VALangModal()">🌐 Language: <b>${(LANGS.find(l=>l.id===vendor.language)||LANGS[2]).name}</b></button>
    </div>

    <div class="va-grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">
      <div class="va-card">
        <h3 style="margin:0 0 14px;font-size:15px;">🏪 Stall details</h3>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;"><span style="color:#6b7f6b;">Stall name</span><b>${esc(vendor.stallName)}</b></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:#6b7f6b;">Type</span><b>${esc(vendor.stallType)}</b></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:#6b7f6b;">City</span><b>${esc(vendor.city)}</b></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:#6b7f6b;">Unit ID</span><b>${esc(vendor.unitId)}</b></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:#6b7f6b;">PM SVANidhi ID</span><b>${vendor.pmSvanidhi?esc(vendor.pmSvanidhi):'— not linked'}</b></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:#6b7f6b;">UPI</span><b>${esc(vendor.upiId)}</b></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:#6b7f6b;">Phone</span><b>${esc(vendor.phone)}</b></div>
        </div>
      </div>
      <div class="va-card">
        <h3 style="margin:0 0 14px;font-size:15px;">🤝 Refer another vendor</h3>
        <p style="font-size:12px;color:#6b7f6b;margin:0 0 12px;">Word of mouth is everything in a market. Refer a fellow vendor — you both get <b>3 days free</b> when they install.</p>
        <div style="background:#f0fdf4;border:2px dashed #86efac;border-radius:12px;padding:14px;text-align:center;">
          <div style="font-size:11px;color:#6b7f6b;letter-spacing:2px;">YOUR CODE</div>
          <div style="font-size:24px;font-weight:800;letter-spacing:3px;color:#15803d;">${esc(vendor.referralCode)}</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <a href="https://wa.me/?text=${encodeURIComponent('Use my code ' + vendor.referralCode + ' on SolarSaathi S.E.V.A. — solar for your stall at 65% of grid rate! ' + shareLink)}" target="_blank" class="va-btn va-btn-green" style="flex:1;text-decoration:none;text-align:center;">💬 Share on WhatsApp</a>
        </div>
        <p style="font-size:12px;color:#6b7f6b;margin:12px 0 0;">Vendors referred so far: <b>${vendor.referrals}</b> 🎉</p>
      </div>
    </div>`;
  }

  // ===================== ONBOARDING WIZARD =====================

  function viewOnboarding(user){
    SS.view().innerHTML = `
    <div class="va-onb">
      <style>
        .va-onb{min-height:100vh;background:linear-gradient(160deg,#052e16,#14532d 60%,#166534);display:flex;align-items:center;justify-content:center;padding:20px;}
        .onb-card{width:100%;max-width:520px;background:#fff;border-radius:24px;padding:28px;box-shadow:0 30px 80px rgba(0,0,0,.4);}
        .onb-steps{display:flex;gap:6px;margin-bottom:20px;}
        .onb-steps i{flex:1;height:5px;border-radius:99px;background:#e2ece2;}
        .onb-steps i.on{background:linear-gradient(90deg,#22c55e,#15803d);}
        .onb-h{font-size:22px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;margin:0 0 4px;}
        .onb-p{font-size:13px;color:#6b7f6b;margin:0 0 18px;}
        .onb-opt{display:flex;align-items:center;gap:12px;border:2px solid #e2ece2;border-radius:14px;padding:13px 15px;cursor:pointer;font-size:14px;font-weight:600;margin-bottom:9px;transition:all .15s;}
        .onb-opt:hover{border-color:#86efac;}
        .onb-opt.sel{border-color:#16a34a;background:#f0fdf4;}
        .onb-opt .em{font-size:20px;}
        .onb-inp{width:100%;padding:13px 15px;border:2px solid #e2ece2;border-radius:12px;font-size:15px;outline:none;box-sizing:border-box;font-family:inherit;}
        .onb-inp:focus{border-color:#16a34a;box-shadow:0 0 0 4px rgba(22,163,74,.1);}
      </style>
      <div class="onb-card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
          <span style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#22c55e,#15803d);display:grid;place-items:center;font-size:19px;">☀️</span>
          <div><b style="font-family:'Plus Jakarta Sans',sans-serif;">S.E.V.A.</b><div style="font-size:10px;color:#8aa08a;letter-spacing:2px;text-transform:uppercase;">Vendor setup</div></div>
        </div>
        <div class="onb-steps">${[0,1,2,3].map(i=>`<i class="${i<=onbStep?'on':''}"></i>`).join('')}</div>
        <div id="onbBody"></div>
      </div>
    </div>`;
    drawOnbStep(user);
  }

  let onbStep = 0;
  let onbData = {};

  function drawOnbStep(user){
    const body = document.getElementById('onbBody');
    const vendor = getVendor(user.id);
    if(onbStep===0){
      // Language + stall basics
      body.innerHTML = `
        <h2 class="onb-h">Welcome, ${esc(user.name)}! 🙏</h2>
        <p class="onb-p">Choose your language — you can change it anytime.</p>
        ${LANGS.map(l=>`<div class="onb-opt ${onbData.language===l.id?'sel':''}" data-lang="${l.id}"><span class="em">🌐</span> ${l.name}</div>`).join('')}
        <button class="va-btn va-btn-green" style="width:100%;margin-top:14px;" id="onbNext" ${onbData.language?'':'disabled'}>Continue →</button>`;
      body.querySelectorAll('[data-lang]').forEach(el=>el.addEventListener('click',()=>{
        onbData.language = el.getAttribute('data-lang');
        drawOnbStep(user);
      }));
      body.querySelector('#onbNext').addEventListener('click',()=>{ onbStep=1; drawOnbStep(user); });
    }
    else if(onbStep===1){
      // Phone + UPI verification
      body.innerHTML = `
        <h2 class="onb-h">Verify phone & UPI</h2>
        <p class="onb-p">No password needed — your phone number IS your account, like every other app you use.</p>
        <label style="font-size:12px;font-weight:700;color:#334a33;">Phone number</label>
        <input class="onb-inp" id="onbPhone" type="tel" value="${esc(vendor.phone)}" placeholder="9876543210" style="margin:6px 0 14px;" />
        <label style="font-size:12px;font-weight:700;color:#334a33;">UPI ID (for wallet & auto-debit)</label>
        <input class="onb-inp" id="onbUpi" value="${esc(vendor.upiId)}" placeholder="name@upi" style="margin:6px 0 8px;" />
        <div style="font-size:11px;color:#8aa08a;">We'll send a ₹1 verification to your UPI — you'll get it back in the wallet.</div>
        <button class="va-btn va-btn-green" style="width:100%;margin-top:16px;" id="onbNext">Send verification →</button>`;
      body.querySelector('#onbNext').addEventListener('click',()=>{
        const ph = body.querySelector('#onbPhone').value.trim();
        const upi = body.querySelector('#onbUpi').value.trim();
        if(!/^\d{10}$/.test(ph)){ toast('Enter a valid 10-digit phone number','error'); return; }
        if(!/^[\w.\-]{2,}@[a-z]{2,}$/i.test(upi)){ toast('Enter a valid UPI ID like name@upi','error'); return; }
        onbData.phone = ph; onbData.upiId = upi;
        toast('✅ ₹1 sent & refunded — UPI verified!','success');
        onbStep=2; drawOnbStep(user);
      });
    }
    else if(onbStep===2){
      // PM SVANidhi lookup + stall pin
      body.innerHTML = `
        <h2 class="onb-h">Your stall</h2>
        <p class="onb-p">Registered with PM SVANidhi? We can pull your details automatically.</p>
        <button class="va-btn va-btn-ghost" style="width:100%;" id="onbSvanidhi">🔍 Look up my PM SVANidhi ID</button>
        <div id="onbSvan" style="margin:10px 0 0;"></div>
        <label style="font-size:12px;font-weight:700;color:#334a33;display:block;margin:16px 0 6px;">Pin your stall on the market map</label>
        <div class="va-pin-map" id="onbMap" style="height:190px;">
          <div class="rd h" style="top:30%;"></div><div class="rd h" style="top:65%;"></div>
          <div class="rd v" style="left:25%;"></div><div class="rd v" style="left:58%;"></div><div class="rd v" style="left:82%;"></div>
          <div id="onbPin"></div>
        </div>
        <p style="font-size:11px;color:#8aa08a;margin:6px 0 0;">Tap exactly where your stall stands — most stalls don't have an address, and that's okay.</p>
        <button class="va-btn va-btn-green" style="width:100%;margin-top:16px;" id="onbNext" ${onbData.pin?'':'disabled'}>Continue →</button>`;
      if(onbData.pin) placePin(onbData.pin);
      body.querySelector('#onbSvanidhi').addEventListener('click',()=>{
        onbData.svanidhi = vendor.pmSvanidhi || 'SVAN' + Math.floor(10000000 + Math.random()*89999999);
        document.getElementById('onbSvan').innerHTML = `<div style="padding:12px;border-radius:12px;background:#f0fdf4;border:1px solid #bbf7d0;font-size:12px;color:#15803d;">
          ✅ Found: <b>${esc(user.name)}</b> • Vendor category: <b>Food stall</b> • Ward: <b>Market yard</b><br/>PM SVANidhi ID <b>${esc(onbData.svanidhi)}</b> linked — no need to fill these again!</div>`;
        toast('PM SVANidhi details imported!','success');
      });
      const map = body.querySelector('#onbMap');
      map.addEventListener('click', e=>{
        const r = map.getBoundingClientRect();
        onbData.pin = { x: (e.clientX-r.left)/r.width*100, y: (e.clientY-r.top)/r.height*100 };
        placePin(onbData.pin);
        body.querySelector('#onbNext').disabled = false;
      });
      function placePin(p){
        document.getElementById('onbPin').outerHTML = `<div class="va-pin" id="onbPin" style="left:${p.x}%;top:${p.y}%;"></div>`;
      }
      body.querySelector('#onbNext').addEventListener('click',()=>{ onbStep=3; drawOnbStep(user); });
    }
    else {
      // Install scheduling
      const tomorrow = new Date(Date.now()+86400e3);
      const opts = [0,1,2,3,4].map(i=>{
        const d = new Date(Date.now()+(1+i)*86400e3);
        return { label: d.toLocaleDateString('en-IN',{weekday:'short', day:'numeric', month:'short'}), val: d.toISOString().slice(0,10) };
      });
      const windows = ['Morning (8–11 AM)','Afternoon (12–3 PM)','Evening (4–7 PM)'];
      body.innerHTML = `
        <h2 class="onb-h">Pick install day</h2>
        <p class="onb-p">A technician from your zone installs the unit — panel, battery, lights, fan point & charging port. Takes about an hour.</p>
        ${opts.map(o=>`<div class="onb-opt ${onbData.date===o.val?'sel':''}" data-date="${o.val}"><span class="em">📅</span> ${o.label}</div>`).join('')}
        <div style="height:10px;"></div>
        ${windows.map(w=>`<div class="onb-opt ${onbData.window===w?'sel':''}" data-win="${w}"><span class="em">⏰</span> ${w}</div>`).join('')}
        <button class="va-btn va-btn-green" style="width:100%;margin-top:16px;" id="onbDone" ${onbData.date&&onbData.window?'':'disabled'}>Confirm install 🎉</button>`;
      body.querySelectorAll('[data-date]').forEach(el=>el.addEventListener('click',()=>{ onbData.date=el.getAttribute('data-date'); drawOnbStep(user); }));
      body.querySelectorAll('[data-win]').forEach(el=>el.addEventListener('click',()=>{ onbData.window=el.getAttribute('data-win'); drawOnbStep(user); }));
      body.querySelector('#onbDone').addEventListener('click', async ()=>{
        const fields = {
          language: onbData.language || vendor.language,
          phone: onbData.phone || vendor.phone,
          upiId: onbData.upiId || vendor.upiId,
          pmSvanidhi: onbData.svanidhi || vendor.pmSvanidhi,
          pin: onbData.pin || vendor.pin,
          installDate: onbData.date,
          installWindow: (onbData.window||'Morning (8–11 AM)') + ' • ' + opts.find(o=>o.val===onbData.date)?.label,
          onboarded: true
        };
        if(SSServerMode()){
          const res = await safeCall(()=>API.patch('/vendor/me', fields));
          if(!res) return;
          applyVendor(res.vendor);
        } else {
          const all = loadVendors();
          const v = all[user.id] || makeVendor(user.id);
          Object.assign(v, fields);
          all[user.id] = v; saveVendors(all);
        }
        toast('Install booked! Your agent will call before coming. ☀️','success');
        onbStep = 0; onbData = {};
        location.hash = '#/vendorapp/home';
        render();
      });
    }
  }

  // ===================== GLOBAL ACTIONS =====================

  window.VAPayNow = async () => {
    const u = SS.currentUser(); const v = getVendor(u.id);
    const booking = vendorBooking(u.id);
    const ledger = dailyLedger(v, booking, 30);
    const today = ledger[ledger.length-1];
    if(v.balance < today.fee){ toast('Wallet balance too low — top up first','error'); return; }
    if(SSServerMode()){
      const res = await safeCall(()=>API.post('/vendor/pay', { method:'upi' }));
      if(!res) return;
      applyVendor(res.vendor);
      SS.store.payments.unshift(res.payment);
      SS.saveStore();
      toast('Paid ' + fmt(today.fee) + ' — today is covered ✔','success');
      render();
      return;
    }
    updateVendor(u.id, x=>{ x.balance -= today.fee; });
    SS.store.payments.unshift({ id:'PAY-'+Math.random().toString(36).slice(2,7).toUpperCase(), bookingId: booking?.id||'—', userId:u.id, amount:today.fee, method:'upi', status:'Paid', created:new Date().toISOString() });
    SS.saveStore();
    toast('Paid ' + fmt(today.fee) + ' — today is covered ✔','success');
    render();
  };
  window.VATopUp = () => {
    const u = SS.currentUser();
    openModal(`
      <h3 style="font-weight:800;font-size:18px;">Add money to wallet</h3>
      <p style="font-size:12px;color:#6b7f6b;margin:4px 0 14px;">Goes in from your UPI ID instantly. Auto-debit pulls the daily fee from here.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${[100,200,500].map(a=>`<button class="va-btn va-btn-ghost topup-amt" data-amt="${a}">₹${a}</button>`).join('')}
      </div>
      <input class="onb-inp" id="topupCustom" type="number" placeholder="Or type any amount" style="margin:12px 0;" />
      <button class="va-btn va-btn-green" style="width:100%;" id="topupGo">Add money</button>
      <button class="va-btn va-btn-ghost" style="width:100%;margin-top:8px;" onclick="closeModal()">Cancel</button>`);
    document.querySelectorAll('.topup-amt').forEach(b=>b.addEventListener('click',()=>{
      document.getElementById('topupCustom').value = b.getAttribute('data-amt');
    }));
    document.getElementById('topupGo').addEventListener('click', async ()=>{
      const amt = parseInt(document.getElementById('topupCustom').value);
      if(!amt || amt<=0){ toast('Enter an amount','error'); return; }
      if(SSServerMode()){
        const res = await safeCall(()=>API.post('/vendor/wallet/topup', { amount: amt }));
        if(!res) return;
        applyVendor(res.vendor);
      } else {
        updateVendor(u.id, v=>{ v.balance += amt; });
      }
      closeModal(); toast('Added ' + fmt(amt) + ' to wallet ✔','success'); render();
    });
  };
  window.VAToggleAutopay = async () => {
    const u = SS.currentUser();
    const v = getVendor(u.id);
    if(SSServerMode()){
      const res = await safeCall(()=>API.patch('/vendor/me', { autopay: !v.autopay }));
      if(!res) return;
      applyVendor(res.vendor);
    } else {
      updateVendor(u.id, x=>{ x.autopay = !x.autopay; });
    }
    toast('Auto-debit ' + (getVendor(u.id).autopay ? 'ON — daily fee pulls automatically' : 'OFF — pay manually each day'));
    render();
  };
  window.VAPanic = () => {
    const u = SS.currentUser(); const v = getVendor(u.id);
    openModal(`
      <div style="text-align:center;">
        <div style="font-size:44px;">🚨</div>
        <h3 style="font-weight:800;font-size:18px;margin:6px 0;">Something's wrong?</h3>
        <p style="font-size:13px;color:#6b7f6b;">Your unit ID <b>${esc(v.unitId)}</b> and stall location are attached automatically. Agent <b>${esc(v.agent.name)}</b> gets alerted instantly.</p>
        <div style="display:grid;gap:8px;margin-top:14px;">
          ${['Unit not powering on','Sparks / burning smell','Battery swollen or leaking','Someone tampered with the unit'].map(r=>`<button class="va-btn va-btn-red panic-reason" data-r="${r}">${r}</button>`).join('')}
        </div>
        <button class="va-btn va-btn-ghost" style="width:100%;margin-top:10px;" onclick="closeModal()">Cancel</button>
      </div>`);
    document.querySelectorAll('.panic-reason').forEach(b=>b.addEventListener('click', async ()=>{
      const reason = b.getAttribute('data-r');
      if(SSServerMode()){
        const res = await safeCall(()=>API.post('/vendor/issues', { desc: reason, panic: true }));
        if(!res) return;
        await pullVendor();
      } else {
        const u2 = SS.currentUser();
        updateVendor(u2.id, v=>{
          v.issues = v.issues || [];
          v.issues.unshift({ id:'ISS-'+Math.floor(1000+Math.random()*8999), desc:'🚨 PANIC: ' + reason, status:'Agent assigned', at:Date.now(), photo:false, panic:true });
        });
        SS.addNotification('fault', '🚨 Panic from ' + v.stallName, reason + ' — unit ' + v.unitId + ', ' + v.city, v.unitId);
      }
      closeModal();
      openModal(`
        <div style="text-align:center;">
          <div style="font-size:40px;">✅</div>
          <h3 style="font-weight:800;font-size:18px;margin:6px 0;">Agent alerted</h3>
          <p style="font-size:13px;color:#6b7f6b;"><b>${esc(v.agent.name)}</b> (${esc(v.agent.zone)}) has been paged with your unit ID & location. Expected response: <b>under 2 hours</b>.<br/><br/>For emergencies call directly:</p>
          <a href="tel:${v.agent.phone}" class="va-btn va-btn-green" style="text-decoration:none;display:block;">📞 Call ${esc(v.agent.name)} now</a>
        </div>`);
      render();
    }));
  };
  window.VAMarkAlerts = async () => {
    const u = SS.currentUser();
    if(SSServerMode()){
      const res = await safeCall(()=>API.patch('/vendor/alerts/read-all', {}));
      if(!res) return;
      applyVendor({ alerts: res.alerts });
    } else {
      const alerts = vendorAlerts(u.id);
      alerts.forEach(a=>a.read=true);
      saveAlerts(u.id, alerts);
    }
    render();
  };
  window.VALangModal = () => {
    const u = SS.currentUser(); const v = getVendor(u.id);
    openModal(`
      <h3 style="font-weight:800;font-size:18px;">🌐 Choose language</h3>
      <div style="display:grid;gap:8px;margin-top:14px;">
        ${LANGS.map(l=>`<button class="va-btn ${v.language===l.id?'va-btn-green':'va-btn-ghost'} lang-pick" data-l="${l.id}">${l.name}</button>`).join('')}
      </div>`);
    document.querySelectorAll('.lang-pick').forEach(b=>b.addEventListener('click', async ()=>{
      const language = b.getAttribute('data-l');
      if(SSServerMode()){
        const res = await safeCall(()=>API.patch('/vendor/me', { language }));
        if(!res) return;
        applyVendor(res.vendor);
      } else {
        updateVendor(u.id, x=>{ x.language = language; });
      }
      closeModal(); render();
    }));
  };

  // ===================== ROUTER =====================

  let booted = false;
  function render(){
    if(!SS.requireVendor()) return;
    const user = SS.currentUser();
    const vendor = getVendor(user.id);
    const booking = vendorBooking(user.id);

    // first login → onboarding wizard
    if(!vendor.onboarded && !location.hash.includes('/onboard')){ location.hash = '#/vendorapp/onboard'; }
    const sub = (location.hash.split('/')[2] || 'home').split('?')[0];
    if(sub === 'onboard'){ viewOnboarding(user); return; }

    let inner = '';
    if(sub==='billing') inner = viewBilling(vendor, booking);
    else if(sub==='usage') inner = viewUsage(vendor, booking);
    else if(sub==='support') inner = viewSupport(vendor, booking);
    else if(sub==='alerts') inner = viewAlerts(vendor, booking);
    else if(sub==='profile') inner = viewProfile(vendor, booking);
    else inner = viewHome(vendor, booking);
    shell(sub==='billing'||sub==='usage'||sub==='support'||sub==='alerts'||sub==='profile' ? sub : 'home', inner, vendor, booking);

    // support form
    const form = document.getElementById('vaIssueForm');
    if(form){
      form.addEventListener('submit', async e=>{
        e.preventDefault();
        const desc = document.getElementById('vaIssueDesc').value.trim();
        const photo = !!document.getElementById('vaIssuePhoto').value;
        if(!desc) return;
        if(SSServerMode()){
          const res = await safeCall(()=>API.post('/vendor/issues', { desc, photo }));
          if(!res) return;
          await pullVendor();
        } else {
          updateVendor(user.id, v=>{
            v.issues = v.issues || seedIssues(v);
            v.issues.unshift({ id:'ISS-'+Math.floor(1000+Math.random()*8999), desc, status:'Submitted', at:Date.now(), photo });
          });
          SS.addNotification('support', 'New issue from ' + vendor.stallName, desc + ' — unit ' + vendor.unitId, vendor.unitId);
        }
        toast('Issue submitted — ' + vendor.agent.name + ' has been notified','success');
        render();
      });
    }
    booted = true;
  }

  window.SSRenderVendorApp = render;
})();
