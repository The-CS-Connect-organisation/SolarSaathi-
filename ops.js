/* SolarSaathi — Panel 2: Operations Dashboard (internal foundation)
   Sunalyzer-style dark sidebar + cards. Rendered at #/admin for role 'admin'.
   Fleet • Vendors • Billing & Revenue • Lock/Unlock engine • Dispatch • Agents • Analytics • Alerts */
(() => {
  const SS = window.SS;
  if(!SS) return;
  const { fmt, esc, timeAgo, toast, openModal, closeModal } = SS;
  const badge = SS.statusColor;

  // ===================== OPS DATA =====================

  const OKEY = 'solarSaathi.ops.v1';
  function loadOps(){
    try{ return JSON.parse(localStorage.getItem(OKEY)) || null; }catch(e){ return null; }
  }
  function saveOps(o){ localStorage.setItem(OKEY, JSON.stringify(o)); }

  // Seed a realistic fleet: units mapped to seeded bookings + extra walk-in vendors
  function seedOps(){
    if(loadOps()) return loadOps();
    const rnd = SS.mulberry32(20260910);
    const bookings = SS.store.bookings.filter(b=>b.status==='Live');
    const units = [];
    const mkUnit = (bk, i) => {
      const states = ['active','active','active','active','paused','faulted','awaiting'];
      const state = bk ? 'active' : states[Math.floor(rnd()*states.length)];
      const installed = new Date(Date.now() - Math.floor(60 + rnd()*400) * 86400000).toISOString();
      return {
        unitId: bk ? ('SEV-' + (1000 + i)) : ('SEV-' + Math.floor(2000 + rnd()*7999)),
        vendorName: bk ? bk.name : ['Shyam Chai','Gopal Juice','Rekha Flowers','Imran Biryani','Munna Pan','Sita Fruits','Arjun Mobile Point','Chotu Snacks'][Math.floor(rnd()*8)],
        city: bk ? bk.district : ['Hyderabad','Warangal','Pune','Jaipur','Lucknow','Indore'][Math.floor(rnd()*6)],
        zone: 'Zone ' + (1 + Math.floor(rnd()*4)),
        state,
        // map pin (schematic India-ish layout 0-100)
        pin: { x: 8 + rnd()*84, y: 12 + rnd()*76 },
        installed,
        dailyFee: bk ? Math.max(10, Math.round(bk.monthlyAmount/30)) : Math.round(25 + rnd()*40),
        missedDays: state==='paused' ? 3 + Math.floor(rnd()*9) : (rnd()<0.3 ? 1 : 0),
        balance: Math.round(20 + rnd()*480),
        batteryHealth: state==='faulted' ? Math.round(38 + rnd()*20) : Math.round(72 + rnd()*26),
        batteryInstall: installed,
        // payback: unit capex ~₹28k, margin ~35% of bill
        capex: Math.round(24000 + rnd()*9000),
        recovered: Math.round((3000 + rnd()*22000)),
        lockEvents: [],
        issues: [],
      };
    };
    bookings.forEach((bk,i)=>units.push(mkUnit(bk,i)));
    for(let i=0;i<14;i++) units.push(mkUnit(null, 100+i));

    // lock/unlock audit log — the trust engine, every event recorded with reason + actor
    const REASONS = ['Auto: 3 consecutive missed payments','Auto: wallet below daily fee','Manual: payment glitch verified','Manual: vendor request — going out of town','Auto: payment resumed'];
    units.forEach((u,i)=>{
      if(u.state==='paused' || rnd()>0.55){
        const n = 1 + Math.floor(rnd()*3);
        for(let k=0;k<n;k++){
          const at = Date.now() - Math.floor(2 + rnd()*80) * 86400e3;
          u.lockEvents.push({ id:'LK-'+Math.floor(1000+rnd()*8999), at, action: rnd()>0.45?'locked':'unlocked', reason: REASONS[Math.floor(rnd()*REASONS.length)], actor: rnd()>0.75 ? 'ops@navan (manual)' : 'system (auto)' });
        }
        u.lockEvents.sort((a,b)=>b.at-a.at);
      }
    });

    // maintenance agents
    const agents = [
      { id:'AGT-1', name:'Lakshman K', phone:'9848012345', zone:'Zone 1', city:'Hyderabad', jobs: 34, avgHrs: 5.2, rating: 4.8 },
      { id:'AGT-2', name:'Ganesh V', phone:'9848023456', zone:'Zone 2', city:'Hyderabad', jobs: 29, avgHrs: 6.8, rating: 4.6 },
      { id:'AGT-3', name:'Srinu M', phone:'9848034567', zone:'Zone 3', city:'Warangal', jobs: 41, avgHrs: 4.9, rating: 4.9 },
      { id:'AGT-4', name:'Bala R', phone:'9848045678', zone:'Zone 4', city:'Pune', jobs: 22, avgHrs: 7.5, rating: 4.4 },
    ];

    // open issues / dispatch queue
    const issueTypes = ['Fan not working','Battery draining fast','Light flickering','Charging port loose','Panel cracked','Wiring smell','Inverter beeping'];
    const queues = ['Submitted','Agent assigned','En route'];
    const issues = [];
    units.filter(u=>u.state!=='awaiting').slice(0,10).forEach((u,i)=>{
      issues.push({
        id:'ISS-' + (2000+i),
        unitId: u.unitId, vendorName: u.vendorName, city: u.city, zone: u.zone,
        desc: issueTypes[i % issueTypes.length],
        urgency: i<3 ? 'High' : (i<7 ? 'Normal' : 'Low'),
        status: queues[i % queues.length],
        agentId: agents[i % agents.length].id,
        createdAt: Date.now() - Math.floor(2 + rnd()*70) * 3600e3,
        photo: rnd()>0.5,
      });
    });

    // battery replacement window: installs aged 3-5 yrs flagged
    units.forEach(u=>{
      const ageYrs = (Date.now() - new Date(u.batteryInstall).getTime()) / (365*86400e3);
      u.batteryAge = Math.round(ageYrs*10)/10;
      u.batteryDue = ageYrs >= 3;
    });

    const ops = { units, agents, issues, seededAt: Date.now() };
    saveOps(ops);
    return ops;
  }
  let OPS = seedOps();
  function refresh(){ OPS = loadOps() || seedOps(); }

  function saveUnit(unitId, mut){
    refresh();
    const u = OPS.units.find(x=>x.unitId===unitId);
    if(u){ mut(u); saveOps(OPS); }
  }

  // fleet stats
  function fleetStats(){
    const u = OPS.units;
    return {
      total: u.length,
      active: u.filter(x=>x.state==='active').length,
      paused: u.filter(x=>x.state==='paused').length,
      faulted: u.filter(x=>x.state==='faulted').length,
      awaiting: u.filter(x=>x.state==='awaiting').length,
    };
  }
  function revenue(){
    const daily = OPS.units.filter(u=>u.state==='active').reduce((a,u)=>a+u.dailyFee,0);
    const mrr = daily * 30;
    const collected = SS.store.payments.filter(p=>p.status==='Paid').reduce((a,p)=>a+p.amount,0);
    const atRisk = OPS.units.filter(u=>u.state==='paused').reduce((a,u)=>a+u.dailyFee*30,0);
    const badDebt = OPS.units.filter(u=>u.missedDays>0).reduce((a,u)=>a+u.missedDays*u.dailyFee,0);
    return { daily, mrr, collected, atRisk, badDebt };
  }

  // ===================== SHELL =====================

  const NAV = [
    { id:'fleet',     icon:'🗺', label:'Fleet Overview' },
    { id:'vendors',   icon:'🏪', label:'Vendors' },
    { id:'revenue',   icon:'₹',  label:'Billing & Revenue' },
    { id:'lock',      icon:'🔒', label:'Lock / Unlock Engine' },
    { id:'dispatch',  icon:'🛠', label:'Maintenance & Dispatch' },
    { id:'agents',    icon:'👷', label:'Agents' },
    { id:'analytics', icon:'📈', label:'Analytics & Impact' },
    { id:'alerts',    icon:'🚨', label:'Alerts' },
  ];

  function shell(active, inner){
    const fs = fleetStats();
    SS.view().innerHTML = `
    <div class="ops-shell">
      <style>
        .ops-shell{position:fixed;inset:0;z-index:9998;background:#f2f6f2;display:flex;padding-top:64px;}
        .ops-sidebar{width:240px;flex-shrink:0;background:#0a0f0a;color:#dbe7db;display:flex;flex-direction:column;}
        .ops-brand{display:flex;align-items:center;gap:10px;padding:18px 16px 14px;border-bottom:1px solid rgba(255,255,255,.08);}
        .ops-brand .logo{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#0ea5e9,#16a34a);display:grid;place-items:center;font-size:17px;}
        .ops-brand b{font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:.5px;color:#fff;}
        .ops-brand small{display:block;font-size:9px;color:#8fa88f;letter-spacing:2px;text-transform:uppercase;}
        .ops-nav{flex:1;padding:10px 8px;overflow-y:auto;}
        .ops-nav a{display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:11px;color:#b8c9b8;text-decoration:none;font-size:13px;font-weight:600;margin-bottom:2px;transition:all .15s;}
        .ops-nav a:hover{background:rgba(255,255,255,.06);color:#fff;}
        .ops-nav a.active{background:linear-gradient(135deg,#0ea5e9,#0369a1);color:#fff;box-shadow:0 4px 14px rgba(14,165,233,.3);}
        .ops-nav .ico{width:22px;text-align:center;font-size:14px;}
        .ops-nav .cnt{margin-left:auto;background:#ef4444;color:#fff;font-size:10px;font-weight:800;border-radius:99px;padding:1px 7px;}
        .ops-foot{padding:12px 16px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;color:#8fa88f;}
        .ops-main{flex:1;overflow-y:auto;padding:20px 24px 60px;}
        .ops-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;}
        .ops-head h1{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:23px;color:#0c130c;margin:0;}
        .ops-card{background:#fff;border:1px solid #e0eae0;border-radius:16px;padding:18px;box-shadow:0 1px 3px rgba(5,30,5,.05);}
        .ops-grid{display:grid;gap:12px;}
        .ops-btn{border:none;border-radius:11px;padding:9px 15px;font-weight:700;font-size:13px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .15s;text-decoration:none;display:inline-block;}
        .ops-btn-p{background:linear-gradient(135deg,#0284c7,#0369a1);color:#fff;}
        .ops-btn-p:hover{transform:translateY(-1px);}
        .ops-btn-g{background:#fff;border:2px solid #e0eae0;color:#263826;}
        .ops-btn-g:hover{border-color:#0284c7;color:#0369a1;}
        .ops-btn-r{background:#fee2e2;color:#b91c1c;border:2px solid #fecaca;}
        .ops-btn-green{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;}
        .ops-map{position:relative;border-radius:16px;overflow:hidden;background:linear-gradient(160deg,#0f2417,#14532d);min-height:420px;}
        .ops-dot{position:absolute;width:14px;height:14px;border-radius:50%;border:2.5px solid #fff;cursor:pointer;transform:translate(-50%,-50%);transition:transform .12s;box-shadow:0 2px 8px rgba(0,0,0,.4);}
        .ops-dot:hover{transform:translate(-50%,-50%) scale(1.5);z-index:5;}
        .ops-dot.d-active{background:#22c55e;}
        .ops-dot.d-paused{background:#ef4444;}
        .ops-dot.d-faulted{background:#f59e0b;}
        .ops-dot.d-awaiting{background:#94a3b8;}
        .ops-legend{display:flex;gap:14px;font-size:11px;color:#cbd5cb;flex-wrap:wrap;}
        .ops-legend span::before{content:'';display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;border:2px solid #fff;}
        .ops-legend .l-active::before{background:#22c55e;} .ops-legend .l-paused::before{background:#ef4444;}
        .ops-legend .l-faulted::before{background:#f59e0b;} .ops-legend .l-awaiting::before{background:#94a3b8;}
        table.ops-t{width:100%;font-size:13px;border-collapse:collapse;}
        table.ops-t th{text-align:left;padding:10px 12px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#7a8a7a;border-bottom:2px solid #e8f0e8;white-space:nowrap;}
        table.ops-t td{padding:10px 12px;border-bottom:1px solid #eef4ee;vertical-align:middle;}
        table.ops-t tr:hover td{background:#f6faf6;}
        .ops-filter{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
        .ops-chip{padding:6px 14px;border-radius:99px;font-size:12px;font-weight:700;border:2px solid #e0eae0;background:#fff;cursor:pointer;}
        .ops-chip.on{background:#0c4a6e;color:#fff;border-color:#0c4a6e;}
        .ops-kpi{font-size:24px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;}
        .ops-sub{font-size:11px;color:#8a9a8a;}
        .ops-scroll{max-height:520px;overflow-y:auto;border-radius:12px;}
        @media(max-width:820px){ .ops-sidebar{display:none;} .ops-shell{padding-top:56px;} .ops-main{padding:14px 12px 40px;} }
      </style>

      <aside class="ops-sidebar">
        <div class="ops-brand">
          <span class="logo">☀️</span>
          <div><b>SolarSaathi</b><small>Operations Foundation</small></div>
        </div>
        <nav class="ops-nav">
          ${NAV.map(n=>`
            <a href="#/admin/${n.id}" class="${active===n.id?'active':''}">
              <span class="ico">${n.icon}</span>${n.label}
              ${n.id==='dispatch' && OPS.issues.filter(i=>i.status!=='Resolved').length ? `<span class="cnt">${OPS.issues.filter(i=>i.status!=='Resolved').length}</span>`:''}
              ${n.id==='alerts' && alertCount() ? `<span class="cnt">${alertCount()}</span>`:''}
            </a>`).join('')}
        </nav>
        <div class="ops-foot">
          <div><b style="color:#fff;">${fs.total}</b> units • <b style="color:#4ade80;">${fs.active}</b> active</div>
          <div style="margin-top:6px;"><a href="#/" style="color:#7dd3fc;text-decoration:none;font-weight:700;">← Back to site</a></div>
        </div>
      </aside>

      <main class="ops-main">
        <div class="ops-head">
          <div><h1>${NAV.find(n=>n.id===active)?.label || 'Operations'}</h1></div>
          <div style="display:flex;gap:8px;">
            <button class="ops-btn ops-btn-g" onclick="OPSExport()">⬇ Export</button>
            <button class="ops-btn ops-btn-g" onclick="OPSReseed()">↻ Re-seed</button>
          </div>
        </div>
        ${inner}
      </main>
    </div>`;
  }

  function alertCount(){
    const fs = fleetStats();
    const faultSpike = fs.faulted >= 3;
    const payAnomaly = OPS.units.filter(u=>u.missedDays>=2).length >= 4;
    return (faultSpike?1:0) + (payAnomaly?1:0) + OPS.units.filter(u=>u.batteryDue).length;
  }

  // ===================== TABS =====================

  function tabFleet(){
    const fs = fleetStats();
    const zones = [...new Set(OPS.units.map(u=>u.zone))].sort();
    return `
    <div class="ops-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:14px;">
      <div class="ops-card"><div class="ops-sub">TOTAL UNITS</div><div class="ops-kpi">${fs.total}</div></div>
      <div class="ops-card"><div class="ops-sub">ACTIVE</div><div class="ops-kpi" style="color:#16a34a;">${fs.active}</div></div>
      <div class="ops-card"><div class="ops-sub">PAUSED (NON-PAY)</div><div class="ops-kpi" style="color:#dc2626;">${fs.paused}</div></div>
      <div class="ops-card"><div class="ops-sub">FAULTED</div><div class="ops-kpi" style="color:#d97706;">${fs.faulted}</div></div>
      <div class="ops-card"><div class="ops-sub">AWAITING INSTALL</div><div class="ops-kpi" style="color:#64748b;">${fs.awaiting}</div></div>
    </div>
    <div class="ops-card" style="padding:0;overflow:hidden;">
      <div style="padding:14px 18px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;align-items:center;">
        <b>Fleet map — every deployed unit, live status</b>
        <div class="ops-filter" id="fleetFilters">
          <span style="font-size:11px;color:#8a9a8a;">Zone:</span>
          <button class="ops-chip on" data-z="">All</button>
          ${zones.map(z=>`<button class="ops-chip" data-z="${z}">${z}</button>`).join('')}
        </div>
      </div>
      <div class="ops-map" id="fleetMap" style="margin:0 14px 14px;">
        <div class="ops-legend" style="position:absolute;top:12px;left:14px;background:rgba(0,0,0,.35);padding:8px 12px;border-radius:99px;backdrop-filter:blur(4px);">
          <span class="l-active">Active</span><span class="l-paused">Paused</span><span class="l-faulted">Faulted</span><span class="l-awaiting">Awaiting</span>
        </div>
        ${OPS.units.map(u=>`
          <div class="ops-dot d-${u.state}" style="left:${u.pin.x}%;top:${u.pin.y}%;" title="${esc(u.vendorName)} — ${esc(u.unitId)}"
               data-unit="${u.unitId}"></div>`).join('')}
      </div>
    </div>
    <div class="ops-card" style="margin-top:14px;padding:0;">
      <div style="padding:14px 18px;border-bottom:1px solid #eef4ee;"><b>Unit list</b> <span class="ops-sub">click a pin or a row for full history</span></div>
      <div class="ops-scroll">
        <table class="ops-t">
          <thead><tr><th>Unit</th><th>Vendor</th><th>City</th><th>Zone</th><th>Status</th><th>Battery</th><th>Daily fee</th><th>Missed</th><th></th></tr></thead>
          <tbody id="fleetRows">
            ${OPS.units.map(u=>`
              <tr data-row="${u.unitId}" data-zone="${u.zone}">
                <td><b>${esc(u.unitId)}</b></td>
                <td>${esc(u.vendorName)}</td>
                <td>${esc(u.city)}</td>
                <td>${esc(u.zone)}</td>
                <td><span class="badge ${badge(u.state)}">${esc(u.state)}</span></td>
                <td>${u.batteryHealth}%${u.batteryDue?' <span class="badge badge-warning">replace</span>':''}</td>
                <td>${fmt(u.dailyFee)}</td>
                <td>${u.missedDays>0?`<span style="color:#dc2626;font-weight:700;">${u.missedDays}d</span>`:'—'}</td>
                <td><button class="ops-btn ops-btn-g" style="padding:4px 10px;font-size:11px;" onclick="OPSUnit('${u.unitId}')">Open</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  function bindFleet(){
    document.querySelectorAll('#fleetFilters .ops-chip').forEach(ch=>ch.addEventListener('click',()=>{
      document.querySelectorAll('#fleetFilters .ops-chip').forEach(c=>c.classList.remove('on'));
      ch.classList.add('on');
      const z = ch.getAttribute('data-z');
      OPS.units.forEach(u=>{
        const row = document.querySelector(`[data-row="${u.unitId}"]`);
        const dot = document.querySelector(`[data-unit="${u.unitId}"]`);
        const show = !z || u.zone===z;
        if(row) row.style.display = show?'':'none';
        if(dot) dot.style.display = show?'':'none';
      });
    }));
    document.querySelectorAll('.ops-dot').forEach(d=>d.addEventListener('click',()=>OPSUnit(d.getAttribute('data-unit'))));
  }

  // unit drill-down modal — full history
  window.OPSUnit = (unitId) => {
    const u = OPS.units.find(x=>x.unitId===unitId); if(!u) return;
    const ageDays = Math.floor((Date.now()-new Date(u.installed).getTime())/86400e3);
    const paybackPct = Math.min(100, Math.round(u.recovered/u.capex*100));
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
        <div>
          <h3 style="font-weight:800;font-size:18px;margin:0;">${esc(u.vendorName)} <span style="color:#8a9a8a;font-weight:600;">• ${esc(u.unitId)}</span></h3>
          <p style="font-size:12px;color:#8a9a8a;margin:2px 0 0;">${esc(u.city)} • ${esc(u.zone)} • installed ${new Date(u.installed).toLocaleDateString('en-IN')} (${ageDays}d ago)</p>
        </div>
        <span class="badge ${badge(u.state)}">${esc(u.state)}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:14px 0;">
        <div style="background:#f6faf6;border-radius:12px;padding:10px;text-align:center;"><div class="ops-sub">BALANCE</div><b>${fmt(u.balance)}</b></div>
        <div style="background:#f6faf6;border-radius:12px;padding:10px;text-align:center;"><div class="ops-sub">BATTERY</div><b>${u.batteryHealth}%</b></div>
        <div style="background:#f6faf6;border-radius:12px;padding:10px;text-align:center;"><div class="ops-sub">DAILY FEE</div><b>${fmt(u.dailyFee)}</b></div>
        <div style="background:#f6faf6;border-radius:12px;padding:10px;text-align:center;"><div class="ops-sub">MISSED</div><b style="${u.missedDays?'color:#dc2626;':''}">${u.missedDays}d</b></div>
      </div>
      <div style="margin-bottom:6px;"><b style="font-size:12px;">Payback: ${fmt(u.recovered)} / ${fmt(u.capex)}</b> ${paybackPct>=100?'<span class="badge badge-success">BREAKEVEN ✔</span>':`<span class="badge badge-default">${paybackPct}%</span>`}</div>
      <div style="height:10px;border-radius:99px;background:#e8f0e8;overflow:hidden;margin-bottom:14px;"><div style="width:${paybackPct}%;height:100%;background:linear-gradient(90deg,#22c55e,#16a34a);"></div></div>
      ${u.lockEvents.length?`
        <b style="font-size:12px;">🔒 Lock / unlock history (${u.lockEvents.length})</b>
        <div style="max-height:130px;overflow-y:auto;margin:8px 0;">
          ${u.lockEvents.map(e=>`
            <div style="font-size:11px;padding:8px 10px;border-radius:10px;background:${e.action==='locked'?'#fef2f2':'#f0fdf4'};margin-bottom:6px;">
              <b>${e.action==='locked'?'🔒 LOCKED':'🔓 UNLOCKED'}</b> — ${esc(e.reason)}<br/>
              <span style="color:#8a9a8a;">by ${esc(e.actor)} • ${timeAgo(new Date(e.at).toISOString())}</span>
            </div>`).join('')}
        </div>`:'<p style="font-size:12px;color:#8a9a8a;">No lock events — clean payer. 🎉</p>'}
      <div style="display:flex;gap:8px;margin-top:12px;">
        ${u.state==='paused'
          ? `<button class="ops-btn ops-btn-green" style="flex:1;" onclick="OPSResume('${u.unitId}')">▶ Resume power</button>`
          : `<button class="ops-btn ops-btn-r" style="flex:1;" onclick="OPSPause('${u.unitId}')">⏸ Remote pause</button>`}
      </div>`);
  };

  window.OPSPause = (unitId) => {
    openModal(`
      <h3 style="font-weight:800;font-size:16px;">⏸ Remote pause — ${unitId}</h3>
      <p style="font-size:12px;color:#6b7f6b;">This immediately locks the unit. The event goes to the audit log with your name — vendors can see exactly why they were paused.</p>
      <input class="onb-inp" id="pauseReason" placeholder="Reason (e.g. verified non-payment)" style="margin:10px 0;" />
      <button class="ops-btn ops-btn-r" style="width:100%;" id="pauseGo">Confirm pause</button>
      <button class="ops-btn ops-btn-g" style="width:100%;margin-top:8px;" onclick="closeModal()">Cancel</button>`);
    document.getElementById('pauseGo').addEventListener('click',()=>{
      const reason = document.getElementById('pauseReason').value.trim() || 'Manual pause by ops';
      saveUnit(unitId, u=>{
        u.state='paused';
        u.lockEvents.unshift({ id:'LK-'+Math.floor(1000+Math.random()*8999), at:Date.now(), action:'locked', reason, actor:'ops console (manual)' });
      });
      SS.addNotification('status','Unit paused', unitId+' paused — '+reason, unitId);
      closeModal(); toast('Unit '+unitId+' paused','success'); render();
    });
  };
  window.OPSResume = (unitId) => {
    saveUnit(unitId, u=>{
      u.state='active'; u.missedDays=0;
      u.lockEvents.unshift({ id:'LK-'+Math.floor(1000+Math.random()*8999), at:Date.now(), action:'unlocked', reason:'Payment cleared / manual resume', actor:'ops console (manual)' });
    });
    SS.addNotification('status','Unit resumed', unitId+' unlocked — power restored', unitId);
    closeModal(); toast('Power restored for '+unitId,'success'); render();
  };

  function tabVendors(){
    const rows = OPS.units.map(u=>{
      const streak = Math.max(0, 30 - u.missedDays);
      return { u, streak };
    });
    return `
    <div class="ops-card" style="padding:0;">
      <div style="padding:14px 18px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;align-items:center;">
        <b>All vendors (${rows.length})</b>
        <input class="input-field" id="vendorSearch" placeholder="Search name / unit / city" style="max-width:220px;padding:8px 12px;" />
      </div>
      <div class="ops-scroll">
        <table class="ops-t" id="vendorTable">
          <thead><tr><th>Unit</th><th>Vendor</th><th>City</th><th>Joined</th><th>Payment streak</th><th>Status</th><th>Consent</th><th></th></tr></thead>
          <tbody>
            ${rows.map(({u,streak})=>`
              <tr data-s="${esc((u.vendorName+' '+u.unitId+' '+u.city).toLowerCase())}">
                <td><b>${esc(u.unitId)}</b></td>
                <td>${esc(u.vendorName)}</td>
                <td>${esc(u.city)}</td>
                <td>${new Date(u.installed).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</td>
                <td>${streak>=25?'🔥':''} ${streak} days on-time</td>
                <td><span class="badge ${badge(u.state)}">${esc(u.state)}</span></td>
                <td style="font-size:11px;">✔ signed<br/><span style="color:#8a9a8a;">interest form</span></td>
                <td>
                  ${u.state==='paused'?`<button class="ops-btn ops-btn-green" style="padding:4px 10px;font-size:11px;" onclick="OPSResume('${u.unitId}')">Resume</button>`:''}
                  ${u.state!=='paused'?`<button class="ops-btn ops-btn-r" style="padding:4px 10px;font-size:11px;" onclick="OPSPause('${u.unitId}')">Pause</button>`:''}
                  <button class="ops-btn ops-btn-g" style="padding:4px 10px;font-size:11px;" onclick="OPSUnit('${u.unitId}')">History</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <p class="ops-sub" style="margin-top:10px;">Override remote pause/resume for edge cases — e.g. a UPI outage that looks like non-payment. Every override hits the audit log.</p>`;
  }

  function bindVendors(){
    document.getElementById('vendorSearch')?.addEventListener('input', e=>{
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#vendorTable tbody tr').forEach(tr=>{
        tr.style.display = (tr.getAttribute('data-s')||'').includes(q) ? '' : 'none';
      });
    });
  }

  function tabRevenue(){
    const r = revenue();
    const perUnit = OPS.units.map(u=>({ ...u, paybackPct: Math.min(100, Math.round(u.recovered/u.capex*100)) })).sort((a,b)=>b.paybackPct-a.paybackPct);
    const breakeven = perUnit.filter(u=>u.paybackPct>=100).length;
    const defaultRate = OPS.units.length ? (OPS.units.filter(u=>u.missedDays>0).length / OPS.units.length * 100).toFixed(1) : 0;
    return `
    <div class="ops-grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr));margin-bottom:14px;">
      <div class="ops-card"><div class="ops-sub">DAILY COLLECTION (LIVE)</div><div class="ops-kpi">${fmt(r.daily)}</div><div class="ops-sub">actual, from payments</div></div>
      <div class="ops-card"><div class="ops-sub">MONTHLY RUN-RATE</div><div class="ops-kpi">${fmt(r.mrr)}</div><div class="ops-sub">${fmt(r.mrr*12)} annualized</div></div>
      <div class="ops-card"><div class="ops-sub">DEFAULT / LATE</div><div class="ops-kpi" style="color:#d97706;">${defaultRate}%</div><div class="ops-sub">${fmt(r.badDebt)} uncollected — vs 6% model</div></div>
      <div class="ops-card"><div class="ops-sub">AT RISK (PAUSED)</div><div class="ops-kpi" style="color:#dc2626;">${fmt(r.atRisk)}</div><div class="ops-sub">monthly revenue paused</div></div>
    </div>
    <div class="ops-card" style="padding:0;">
      <div style="padding:14px 18px;border-bottom:1px solid #eef4ee;"><b>Per-unit payback tracker</b> <span class="ops-sub">capex recovered — ${breakeven}/${perUnit.length} crossed break-even</span></div>
      <div class="ops-scroll">
        <table class="ops-t">
          <thead><tr><th>Unit</th><th>Vendor</th><th>Capex</th><th>Recovered</th><th>Progress</th><th>Status</th></tr></thead>
          <tbody>
            ${perUnit.map(u=>`
              <tr>
                <td><b>${esc(u.unitId)}</b></td>
                <td>${esc(u.vendorName)}</td>
                <td>${fmt(u.capex)}</td>
                <td>${fmt(u.recovered)}</td>
                <td style="min-width:140px;">
                  <div style="height:8px;border-radius:99px;background:#e8f0e8;overflow:hidden;"><div style="width:${u.paybackPct}%;height:100%;background:${u.paybackPct>=100?'linear-gradient(90deg,#22c55e,#16a34a)':'linear-gradient(90deg,#38bdf8,#0284c7)'};"></div></div>
                  <span class="ops-sub">${u.paybackPct}%</span>
                </td>
                <td>${u.paybackPct>=100?'<span class="badge badge-success">break-even ✔</span>':'<span class="badge badge-default">recovering</span>'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  function tabLock(){
    const events = [];
    OPS.units.forEach(u=>u.lockEvents.forEach(e=>events.push({ ...e, unitId:u.unitId, vendorName:u.vendorName, city:u.city })));
    events.sort((a,b)=>b.at-a.at);
    const locks = events.filter(e=>e.action==='locked').length;
    const manual = events.filter(e=>(e.actor||'').includes('manual')).length;
    return `
    <div class="ops-card" style="border-left:5px solid #0284c7;margin-bottom:14px;">
      <b>🔐 The trust engine — collateral, replaced.</b>
      <p style="font-size:12px;color:#6b7f6b;margin:6px 0 0;">Same logic as M-KOPA: pay daily, power stays on. Miss payments, the unit pauses remotely — but <b>every event is logged with the reason and who triggered it</b> (system or human), so it's never a black box when a vendor disputes a lock.</p>
    </div>
    <div class="ops-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:14px;">
      <div class="ops-card"><div class="ops-sub">TOTAL EVENTS</div><div class="ops-kpi">${events.length}</div></div>
      <div class="ops-card"><div class="ops-sub">LOCKS</div><div class="ops-kpi" style="color:#dc2626;">${locks}</div></div>
      <div class="ops-card"><div class="ops-sub">UNLOCKS</div><div class="ops-kpi" style="color:#16a34a;">${events.length-locks}</div></div>
      <div class="ops-card"><div class="ops-sub">MANUAL (HUMAN)</div><div class="ops-kpi">${manual}</div><div class="ops-sub">rest by system auto-rules</div></div>
    </div>
    <div class="ops-card" style="padding:0;">
      <div style="padding:14px 18px;border-bottom:1px solid #eef4ee;"><b>Audit log — every lock/unlock, newest first</b></div>
      <div class="ops-scroll">
        <table class="ops-t">
          <thead><tr><th>When</th><th>Unit</th><th>Vendor</th><th>Action</th><th>Reason</th><th>Triggered by</th></tr></thead>
          <tbody>
            ${events.slice(0,60).map(e=>`
              <tr>
                <td style="white-space:nowrap;">${timeAgo(new Date(e.at).toISOString())}</td>
                <td><b>${esc(e.unitId)}</b></td>
                <td>${esc(e.vendorName)}</td>
                <td>${e.action==='locked'?'<span class="badge badge-error">🔒 locked</span>':'<span class="badge badge-success">🔓 unlocked</span>'}</td>
                <td style="font-size:12px;">${esc(e.reason)}</td>
                <td style="font-size:12px;${(e.actor||'').includes('manual')?'color:#0369a1;font-weight:700;':''}">${esc(e.actor)}</td>
              </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:30px;color:#8a9a8a;">No lock events yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  function tabDispatch(){
    const open = OPS.issues.filter(i=>i.status!=='Resolved');
    const urgencyRank = { High:0, Normal:1, Low:2 };
    open.sort((a,b)=>(urgencyRank[a.urgency]-urgencyRank[b.urgency]) || b.createdAt-a.createdAt);
    return `
    <div class="ops-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:14px;">
      <div class="ops-card"><div class="ops-sub">OPEN ISSUES</div><div class="ops-kpi">${open.length}</div></div>
      <div class="ops-card"><div class="ops-sub">HIGH URGENCY</div><div class="ops-kpi" style="color:#dc2626;">${open.filter(i=>i.urgency==='High').length}</div></div>
      <div class="ops-card"><div class="ops-sub">UNASSIGNED</div><div class="ops-kpi" style="color:#d97706;">${open.filter(i=>!i.agentId).length}</div></div>
      <div class="ops-card"><div class="ops-sub">BATTERIES DUE (3-5Y)</div><div class="ops-kpi" style="color:#d97706;">${OPS.units.filter(u=>u.batteryDue).length}</div><div class="ops-sub">auto-flagged before failure</div></div>
    </div>
    <div class="ops-card" style="padding:0;">
      <div style="padding:14px 18px;border-bottom:1px solid #eef4ee;"><b>Dispatch queue — sorted by urgency & zone</b></div>
      <div class="ops-scroll">
        <table class="ops-t">
          <thead><tr><th>Issue</th><th>Unit / Vendor</th><th>Zone</th><th>Urgency</th><th>Status</th><th>Agent</th><th></th></tr></thead>
          <tbody>
            ${open.map(i=>`
              <tr>
                <td><b>${esc(i.desc)}</b><div class="ops-sub">${esc(i.id)} • ${timeAgo(new Date(i.createdAt).toISOString())}${i.photo?' • 📷':''}</div></td>
                <td>${esc(i.vendorName)}<div class="ops-sub">${esc(i.unitId)} • ${esc(i.city)}</div></td>
                <td>${esc(i.zone)}</td>
                <td><span class="badge ${i.urgency==='High'?'badge-error':i.urgency==='Normal'?'badge-warning':'badge-default'}">${i.urgency}</span></td>
                <td><span class="badge ${badge(i.status)}">${esc(i.status)}</span></td>
                <td>
                  <select class="input-field" style="padding:5px 8px;font-size:12px;min-width:110px;" onchange="OPSAssign('${i.id}', this.value)">
                    <option value="">— assign —</option>
                    ${OPS.agents.filter(a=>a.zone===i.zone || true).map(a=>`<option value="${a.id}" ${i.agentId===a.id?'selected':''}>${esc(a.name)} (${esc(a.zone)})</option>`).join('')}
                  </select>
                </td>
                <td>
                  ${i.status!=='En route'?`<button class="ops-btn ops-btn-p" style="padding:4px 10px;font-size:11px;" onclick="OPSAdvance('${i.id}')">→ Advance</button>`:''}
                  <button class="ops-btn ops-btn-green" style="padding:4px 10px;font-size:11px;" onclick="OPSResolve('${i.id}')">✔ Resolve</button>
                </td>
              </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;padding:30px;color:#8a9a8a;">Queue empty — fleet is healthy. 🎉</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
    <div class="ops-card" style="margin-top:14px;">
      <b style="font-size:14px;">🔋 Battery replacement schedule</b>
      <p class="ops-sub" style="margin:4px 0 12px;">Units approaching the 3-5 year battery lifespan (from the viability report), auto-flagged before they fail.</p>
      ${OPS.units.filter(u=>u.batteryDue).map(u=>`
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 14px;border:1px solid #fde68a;background:#fffbeb;border-radius:12px;margin-bottom:8px;flex-wrap:wrap;">
          <div><b style="font-size:13px;">${esc(u.vendorName)}</b> <span class="ops-sub">${esc(u.unitId)} • ${esc(u.city)}</span></div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="badge badge-warning">battery age ${u.batteryAge}y • health ${u.batteryHealth}%</span>
            <button class="ops-btn ops-btn-p" style="padding:5px 12px;font-size:11px;" onclick="OPSScheduleBattery('${u.unitId}')">Schedule replacement</button>
          </div>
        </div>`).join('') || '<p class="ops-sub">No batteries due — youngest fleet in the cohort.</p>'}
    </div>`;
  }

  window.OPSAssign = (issueId, agentId) => {
    if(!agentId) return;
    const agent = OPS.agents.find(a=>a.id===agentId);
    const issue = OPS.issues.find(i=>i.id===issueId);
    if(issue && agent){
      issue.agentId = agentId; issue.status = 'Agent assigned';
      saveOps(OPS);
      toast(issue.id+' → '+agent.name,'success');
      render();
    }
  };
  window.OPSAdvance = (issueId) => {
    const issue = OPS.issues.find(i=>i.id===issueId); if(!issue) return;
    const flow = ['Submitted','Agent assigned','En route','Resolved'];
    issue.status = flow[Math.min(flow.indexOf(issue.status)+1, 2)];
    saveOps(OPS); render();
  };
  window.OPSResolve = (issueId) => {
    const issue = OPS.issues.find(i=>i.id===issueId); if(!issue) return;
    issue.status = 'Resolved';
    saveOps(OPS);
    toast(issue.id+' resolved ✔','success');
    render();
  };
  window.OPSScheduleBattery = (unitId) => {
    const agent = OPS.agents[0];
    OPS.issues.push({
      id:'ISS-'+Math.floor(3000+Math.random()*999), unitId, vendorName: OPS.units.find(u=>u.unitId===unitId)?.vendorName||'—',
      city: OPS.units.find(u=>u.unitId===unitId)?.city||'—', zone: OPS.units.find(u=>u.unitId===unitId)?.zone||'Zone 1',
      desc:'Battery replacement (end of lifespan)', urgency:'Normal', status:'Agent assigned', agentId: agent.id, createdAt: Date.now(), photo:false,
    });
    saveOps(OPS);
    toast('Battery replacement scheduled for '+unitId,'success');
    render();
  };

  function tabAgents(){
    return `
    <div class="ops-grid" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr));">
      ${OPS.agents.map(a=>{
        const caseload = OPS.issues.filter(i=>i.agentId===a.id && i.status!=='Resolved').length;
        return `
        <div class="ops-card">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,#0ea5e9,#0369a1);color:#fff;display:grid;place-items:center;font-weight:800;font-size:18px;">${esc(a.name.slice(0,1))}</span>
            <div>
              <b>${esc(a.name)}</b>
              <div class="ops-sub">${esc(a.zone)} • ${esc(a.city)}</div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px;">
            <div style="background:#f6faf6;border-radius:10px;padding:8px;text-align:center;"><div class="ops-sub">CASELOAD</div><b style="font-size:16px;${caseload>2?'color:#d97706;':''}">${caseload}</b></div>
            <div style="background:#f6faf6;border-radius:10px;padding:8px;text-align:center;"><div class="ops-sub">JOBS DONE</div><b style="font-size:16px;">${a.jobs}</b></div>
            <div style="background:#f6faf6;border-radius:10px;padding:8px;text-align:center;"><div class="ops-sub">AVG RESOLVE</div><b style="font-size:16px;">${a.avgHrs}h</b></div>
            <div style="background:#f6faf6;border-radius:10px;padding:8px;text-align:center;"><div class="ops-sub">RATING</div><b style="font-size:16px;">★ ${a.rating}</b></div>
          </div>
          <div style="display:flex;gap:6px;margin-top:12px;">
            <a href="tel:${a.phone}" class="ops-btn ops-btn-g" style="flex:1;text-align:center;">📞 Call</a>
            <a href="https://wa.me/91${a.phone}" target="_blank" class="ops-btn ops-btn-green" style="flex:1;text-align:center;">💬 WhatsApp</a>
          </div>
        </div>`;
      }).join('')}
    </div>
    <p class="ops-sub" style="margin-top:10px;">Agents are the last-mile layer — vendors get their direct number, never a call center.</p>`;
  }

  function tabAnalytics(){
    const r = revenue();
    // CO2: ~0.82 kg/kWh diesel displaced; each unit ~1.2 kWh/day
    const kwhDay = OPS.units.filter(u=>u.state==='active').length * 1.2;
    const co2Year = Math.round(kwhDay * 365 * 0.82);
    const dieselLtr = Math.round(kwhDay * 365 * 0.28);
    const cohorts = {};
    OPS.units.forEach(u=>{
      const q = new Date(u.installed).toLocaleDateString('en-IN',{month:'short',year:'numeric'});
      cohorts[q] = (cohorts[q]||0)+1;
    });
    const cohortRows = Object.entries(cohorts).slice(-6);
    const maxCohort = Math.max(...cohortRows.map(c=>c[1]),1);
    const y1Target = 500;
    const pctTarget = Math.min(100, Math.round(OPS.units.length/y1Target*100));
    return `
    <div class="ops-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin-bottom:14px;">
      <div class="ops-card"><div class="ops-sub">CO2 AVOIDED / YEAR</div><div class="ops-kpi" style="color:#16a34a;">${(co2Year/1000).toFixed(1)}t</div><div class="ops-sub">${co2Year.toLocaleString('en-IN')} kg — feeding impact slides</div></div>
      <div class="ops-card"><div class="ops-sub">DIESEL DISPLACED</div><div class="ops-kpi">${dieselLtr.toLocaleString('en-IN')}L</div><div class="ops-sub">per year, fleet-wide</div></div>
      <div class="ops-card"><div class="ops-sub">COLLECTED (ALL TIME)</div><div class="ops-kpi">${fmt(r.collected)}</div><div class="ops-sub">from payment ledger</div></div>
      <div class="ops-card"><div class="ops-sub">YEAR-1 DEPLOYMENT</div><div class="ops-kpi">${Math.round(OPS.units.length/y1Target*100)}%</div><div class="ops-sub">${OPS.units.length} of ${y1Target} units</div></div>
    </div>
    <div class="ops-grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));">
      <div class="ops-card">
        <b style="font-size:14px;">Install cohorts — growth by month</b>
        <div style="margin-top:14px;display:flex;flex-direction:column;gap:10px;">
          ${cohortRows.map(([q,n])=>`
            <div>
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span>${q}</span><b>${n} units</b></div>
              <div style="height:10px;border-radius:99px;background:#e8f0e8;overflow:hidden;"><div style="width:${Math.round(n/maxCohort*100)}%;height:100%;background:linear-gradient(90deg,#38bdf8,#0284c7);border-radius:99px;"></div></div>
            </div>`).join('')}
        </div>
      </div>
      <div class="ops-card">
        <b style="font-size:14px;">Retention & churn proxy</b>
        <p class="ops-sub" style="margin:4px 0 10px;">Vendors still active vs installed — actual data replacing model assumptions over time.</p>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;"><span>Units installed</span><b>${OPS.units.length}</b></div>
          <div style="display:flex;justify-content:space-between;"><span>Active (paying & powered)</span><b style="color:#16a34a;">${fleetStats().active}</b></div>
          <div style="display:flex;justify-content:space-between;"><span>Paused for non-payment</span><b style="color:#dc2626;">${fleetStats().paused}</b></div>
          <div style="display:flex;justify-content:space-between;"><span>Effective retention</span><b>${Math.round((fleetStats().active/(OPS.units.length||1))*100)}%</b></div>
          <div style="display:flex;justify-content:space-between;"><span>Bad-debt observed</span><b>${revenue() && (OPS.units.filter(u=>u.missedDays>0).length/OPS.units.length*100).toFixed(1)}% <span class="ops-sub">(model: 6%)</span></b></div>
        </div>
      </div>
      <div class="ops-card md:col-span-2" style="grid-column:1/-1;">
        <b style="font-size:14px;">Growth vs 5-year plan</b>
        <div style="display:flex;align-items:center;gap:14px;margin-top:10px;">
          <div style="flex:1;height:16px;border-radius:99px;background:#e8f0e8;overflow:hidden;">
            <div style="width:${pctTarget}%;height:100%;background:linear-gradient(90deg,#22c55e,#16a34a);border-radius:99px;"></div>
          </div>
          <b style="white-space:nowrap;">${OPS.units.length} / ${y1Target} Year-1 units</b>
        </div>
        <p class="ops-sub" style="margin-top:8px;">Year 1: 500 units → Year 5: 12,000 units across 5 cities (viability report targets).</p>
      </div>
    </div>`;
  }

  function tabAlerts(){
    const fs = fleetStats();
    const faultSpike = fs.faulted >= 3;
    const payAnomaly = OPS.units.filter(u=>u.missedDays>=2).length >= 4;
    const batteries = OPS.units.filter(u=>u.batteryDue);
    return `
    <div class="ops-grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));">
      ${faultSpike?`
        <div class="ops-card" style="border-left:5px solid #f59e0b;">
          <b>⚠️ Fleet-wide fault spike</b>
          <p style="font-size:12px;color:#6b7f6b;margin:6px 0 10px;">${fs.faulted} units faulted — could indicate a bad hardware batch. Compare faulted units' install dates & equipment lots.</p>
          <button class="ops-btn ops-btn-p" onclick="OPSFilterFaults()">View faulted units</button>
        </div>`:''}
      ${payAnomaly?`
        <div class="ops-card" style="border-left:5px solid #dc2626;">
          <b>💸 Payment anomaly detected</b>
          <p style="font-size:12px;color:#6b7f6b;margin:6px 0 10px;">${OPS.units.filter(u=>u.missedDays>=2).length} units missed 2+ days — a sudden wave usually means a <b>UPI outage</b>, not vendor behavior. Check NPCI status before dispatching reminders.</p>
          <button class="ops-btn ops-btn-p" onclick="OPSFilterPaused()">View affected units</button>
        </div>`:''}
      <div class="ops-card" style="border-left:5px solid #0284c7;">
        <b>🔋 Battery end-of-life watchlist</b>
        <p style="font-size:12px;color:#6b7f6b;margin:6px 0 10px;">${batteries.length} unit(s) approaching the 3-5 year battery lifespan. Replace before failure, not after.</p>
        ${batteries.slice(0,5).map(u=>`<div style="font-size:12px;padding:6px 0;border-bottom:1px dashed #e8f0e8;display:flex;justify-content:space-between;"><span><b>${esc(u.unitId)}</b> ${esc(u.vendorName)}</span><span class="badge badge-warning">${u.batteryAge}y</span></div>`).join('') || '<p class="ops-sub">All batteries healthy.</p>'}
      </div>
      ${!faultSpike && !payAnomaly?`<div class="ops-card" style="grid-column:1/-1;text-align:center;padding:40px;"><div style="font-size:34px;">✅</div><b>No critical alerts</b><p class="ops-sub">Fleet fault rate and payment patterns are within normal bands.</p></div>`:''}
    </div>`;
  }

  window.OPSFilterFaults = () => { location.hash = '#/admin/fleet'; setTimeout(()=>{ OPS.units.filter(u=>u.state==='faulted').forEach(u=>OPSUnit(u.unitId)); }, 400); };
  window.OPSFilterPaused = () => { location.hash = '#/admin/fleet'; };

  window.OPSExport = () => {
    const blob = new Blob([JSON.stringify(OPS, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'solarsaathi-ops-export.json';
    a.click();
    toast('Ops data exported','success');
  };
  window.OPSReseed = () => {
    if(confirm('Wipe and regenerate all ops demo data (fleet, agents, issues, lock log)?')){
      localStorage.removeItem(OKEY);
      refresh();
      toast('Ops data re-seeded','success');
      render();
    }
  };

  // ===================== ROUTER =====================

  function render(){
    if(!SS.requireAdmin()) return;
    refresh();
    const sub = (location.hash.split('/')[2] || 'fleet');
    let inner;
    if(sub==='vendors') inner = tabVendors();
    else if(sub==='revenue') inner = tabRevenue();
    else if(sub==='lock') inner = tabLock();
    else if(sub==='dispatch') inner = tabDispatch();
    else if(sub==='agents') inner = tabAgents();
    else if(sub==='analytics') inner = tabAnalytics();
    else if(sub==='alerts') inner = tabAlerts();
    else inner = tabFleet();
    shell(sub, inner);
    if(sub==='fleet') bindFleet();
    if(sub==='vendors') bindVendors();
  }

  window.SSRenderOps = render;
})();
