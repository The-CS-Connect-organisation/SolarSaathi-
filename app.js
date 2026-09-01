/* SolarSaathi — complete SPA • OP-CS_CONNECT style • vanilla */
(() => {
  const $view = document.getElementById('view');
  const $modalRoot = document.getElementById('modal-root');
  const $toastRoot = document.getElementById('toast-root');
  const $menuBtn = document.getElementById('menuBtn');
  const $menuClose = document.getElementById('menuClose');
  const $overlay = document.getElementById('mobileOverlay');
  const $drawer = document.getElementById('mobileDrawer');

  // mobile nav
  function openMenu(){ $overlay.classList.add('open'); $drawer.classList.add('open'); document.body.style.overflow='hidden'; }
  function closeMenu(){ $overlay.classList.remove('open'); $drawer.classList.remove('open'); document.body.style.overflow=''; }
  $menuBtn?.addEventListener('click', openMenu);
  $menuClose?.addEventListener('click', closeMenu);
  $overlay?.addEventListener('click', closeMenu);
  document.querySelectorAll('.mobile-link').forEach(a=>a.addEventListener('click', closeMenu));

  // ——— Data ———
  const SEED_PRODUCTS = [
    { id:'saathi-1kw', name:'Saathi Lite 1kW', kw:1, rent:1499, bill:1800, panels:2, area:'80 sq ft', battery:false, cat:'Residential', popular:false, rating:4.7, reviews:312, img:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=640&q=80&auto=format&fit=crop', features:['2 × 550W Tier-1 panels','Micro-inverter','24×7 app monitoring'], badge:'Starter' },
    { id:'saathi-2kw', name:'Saathi Home 2kW', kw:2, rent:2499, bill:3200, panels:4, area:'160 sq ft', battery:false, cat:'Residential', popular:false, rating:4.8, reviews:541, img:'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=640&q=80&auto=format&fit=crop', features:['4 × 550W panels','String inverter + Wi-Fi','Free net-metering filing'], badge:'2BHK bestseller' },
    { id:'saathi-3kw', name:'Saathi Home 3kW', kw:3, rent:3499, bill:5000, panels:6, area:'240 sq ft', battery:false, cat:'Residential', popular:true, rating:4.9, reviews:892, img:'https://images.unsplash.com/photo-1472145246861-b24cf25c4a36?w=640&q=80&auto=format&fit=crop', features:['6 × 550W panels','Savings ₹3,300/mo avg','Maintenance + insurance'], badge:'Most Popular' },
    { id:'saathi-5kw', name:'Saathi Villa 5kW', kw:5, rent:5499, bill:8500, panels:10, area:'400 sq ft', battery:false, cat:'Residential', popular:false, rating:4.8, reviews:634, img:'https://images.unsplash.com/photo-1611365892117-00ac60e05ffa?w=640&q=80&auto=format&fit=crop', features:['10 × 550W panels','Covers 3BHK + AC','25-yr panel warranty'], badge:'Villa' },
    { id:'saathi-8kw', name:'Saathi Max 8kW', kw:8, rent:8499, bill:13500, panels:16, area:'640 sq ft', battery:false, cat:'Residential', popular:false, rating:4.9, reviews:211, img:'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=640&q=80&auto=format&fit=crop', features:['16 × 550W panels','3-phase inverter','Priority service'], badge:'Bungalow' },
    { id:'saathi-10kw', name:'Saathi Commercial 10kW', kw:10, rent:9999, bill:17000, panels:20, area:'800 sq ft', battery:false, cat:'Commercial', popular:false, rating:4.7, reviews:188, img:'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=640&q=80&auto=format&fit=crop', features:['20 panels + LT panel','Net-metering + subsidy help','Dedicated RM'], badge:'Shop / Office' },
    { id:'saathi-hybrid-3', name:'Saathi Hybrid 3kW + Battery', kw:3, rent:5299, bill:5000, panels:6, area:'260 sq ft', battery:true, cat:'Hybrid', popular:false, rating:4.8, reviews:302, img:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=640&q=80&auto=format&fit=crop', features:['6 panels + 5kWh LiFePO₄','6-hr backup','Zero outage'], badge:'Backup' },
    { id:'saathi-hybrid-5', name:'Saathi Hybrid 5kW + Battery', kw:5, rent:7999, bill:8500, panels:10, area:'420 sq ft', battery:true, cat:'Hybrid', popular:false, rating:4.9, reviews:167, img:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=640&q=80&auto=format&fit=crop', features:['10 panels + 10kWh battery','Works even off-grid','App + battery SOC'], badge:'Hybrid' },
  ];

  const STORE_KEY = 'solarSaathi.v2';
  function loadStore(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(raw){ const j=JSON.parse(raw); if(j.products && j.bookings) return j; }
    }catch(e){}
    return { products: SEED_PRODUCTS, bookings: [] };
  }
  let store = loadStore();
  function saveStore(){ localStorage.setItem(STORE_KEY, JSON.stringify(store)); }

  const testimonials = [
    { name:'Priya & Rohan', city:'Pune • 3kW', text:'Bill went from ₹5,200 to ₹480. Team installed in 1 day and handled MSEDCL paperwork. App shows live generation.', avatar:'https://i.pravatar.cc/100?img=5', stars:5 },
    { name:'Arvind S.', city:'Bangalore • 5kW', text:'We pay ₹5,499 rent and save ₹3,800 every month. Zero headache — cleaning and service included.', avatar:'https://i.pravatar.cc/100?img=15', stars:5 },
    { name:'Sunita Traders', city:'Indore • 10kW', text:'For our shop, rent is cheaper than the loan EMI we were quoted. Break-even from month one.', avatar:'https://i.pravatar.cc/100?img=26', stars:5 },
  ];
  const faqs = [
    { q:'Why rent instead of buying?', a:'Buying needs ₹2–6 lakh upfront + you handle service. Renting = ₹0 upfront, we own the system, you just pay a low monthly rent (like DTH) that is ~40% lower than your current bill. We do install, permissions, net-metering, cleaning, repairs and insurance.' },
    { q:'What happens if I shift house?', a:'We relocate the system to your new address for a small fee, or transfer the plan to the new tenant. No lock-in after 12 months — just 30 days notice.' },
    { q:'Is subsidy applicable on rental?', a:'Yes. Subsidy / CFA is claimed by us as the asset owner; we pass the full benefit via a lower rent. You don’t need to chase DISCOM.' },
    { q:'What if panels don’t generate due to shade?', a:'During survey we run a drone shade analysis + generation estimate. You only pay rent if we guarantee ≥ 90% of promised units; else we add extra panels free.' },
    { q:'Who handles maintenance?', a:'We do — quarterly cleaning, inverter, wiring, earthing checks, plus 24×7 monitoring. If generation dips, our team is auto-dispatched. You just monitor on the app.' },
    { q:'What is the lock-in and rent hike?', a:'12-month lock-in at fixed rent. Thereafter rent escalates 3% yearly (vs ~8% tariff hike you avoid). Cancel anytime after 12 months.' },
  ];
  const featuresList = [
    { icon:'◈', title:'Zero upfront', desc:'₹0 down payment. No loan, no EMI.', color:'bg-green-600' },
    { icon:'◎', title:'Free install + net meter', desc:'We file DISCOM, install in 48h.', color:'bg-violet-500' },
    { icon:'⚡', title:'Savings from Day 1', desc:'Rent < old bill. Avg saving 55-70%.', color:'bg-emerald-500' },
    { icon:'◐', title:'Monsoon-proof', desc:'Add-on battery for outages & nights.', color:'bg-amber-500' },
    { icon:'▣', title:'Insurance + warranty', desc:'Fire, theft, panel & inverter covered.', color:'bg-blue-500' },
    { icon:'⬡', title:'Take with you', desc:'Relocate or transfer when you move.', color:'bg-rose-500' },
  ];

  // helpers
  const fmt = n => '₹' + n.toLocaleString('en-IN');
  const esc = s => String(s).replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  function toast(msg, type=''){
    const el=document.createElement('div');
    el.className='toast '+type;
    el.textContent=msg;
    $toastRoot.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(8px)'; setTimeout(()=>el.remove(),250); }, 2800);
  }
  function openModal(html){
    $modalRoot.innerHTML = `<div class="modal-backdrop" id="modalBackdrop"><div class="modal-panel p-6">${html}</div></div>`;
    document.body.style.overflow='hidden';
    document.getElementById('modalBackdrop').addEventListener('click', e=>{ if(e.target.id==='modalBackdrop') closeModal(); });
  }
  function closeModal(){ $modalRoot.innerHTML=''; document.body.style.overflow=''; }

  // —— Calculator math
  function calcMetrics(bill){
    const units = Math.round(bill / 8); // ₹8 per unit avg
    const kw = Math.max(1, Math.min(10, Math.round((units/120)*2)/2)); // 120 units/kW/mo
    const gen = Math.round(kw * 120);
    const rent = Math.round(kw * 1150 + 350); // ~ model
    const savings = Math.max(0, bill - rent - Math.round((units - gen)*2)); // rough
    return { units, kw, gen, rent, savings };
  }

  // ——— Render: Home (full marketing) ———
  function renderHome(){
    const best = store.products.filter(p=>p.popular)[0] || store.products[2];
    const teaser = store.products.slice(0,3);
    $view.innerHTML = `
    <div class="page-enter">
      <!-- trust + media -->
      <section class="wrap py-6">
        <div class="nova-card p-3 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs text-zinc-600">
          <span class="inline-flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-emerald-500 text-white grid place-items-center text-[11px]">✓</span> MNRE Approved Channel Partner</span>
          <span class="hidden md:inline h-4 w-px bg-green-100"></span>
          <span>⚡ 2.4 MW installed</span>
          <span class="hidden md:inline h-4 w-px bg-green-100"></span>
          <span>♻️ 1,800 tCO₂ saved</span>
          <span class="hidden md:inline h-4 w-px bg-green-100"></span>
          <span>★ 4.8/5 (1.1k reviews)</span>
          <span class="badge badge-success">Zero upfront</span>
        </div>
      </section>

      <!-- bento stats — OP bento-grid style -->
      <section class="wrap pb-6">
        <div class="grid md:grid-cols-3 gap-4">
          <div class="nova-card nova-card-stat p-6">
            <p class="text-xs font-bold tracking-widest text-green-600 uppercase">Live impact</p>
            <div class="mt-3 grid grid-cols-3 gap-3 text-center">
              <div><div class="font-black text-2xl">1200+</div><div class="text-xs text-zinc-500">Homes</div></div>
              <div><div class="font-black text-2xl">48h</div><div class="text-xs text-zinc-500">Install</div></div>
              <div><div class="font-black text-2xl">₹0</div><div class="text-xs text-zinc-500">Upfront</div></div>
            </div>
            <div class="mt-4 p-3 rounded-xl bg-gradient-to-br from-green-50 to-amber-50 border border-green-100 flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-green-600 text-white grid place-items-center">☀️</div>
              <div class="text-sm leading-tight"><b>Generation today:</b> 8.4 MWh <span class="text-zinc-500">— live from our fleet</span></div>
            </div>
          </div>
          <div class="nova-card p-0 overflow-hidden md:col-span-2">
            <div class="grid md:grid-cols-2 h-full">
              <div class="p-6">
                <span class="badge badge-pink">Why SolarSaathi?</span>
                <h3 class="mt-3 text-xl font-black leading-tight">Owners enjoy power.<br/>Renters enjoy <span class="gradient-text">profit</span>.</h3>
                <p class="text-sm text-zinc-500 mt-2">Pay a fixed rent that’s lower than your bill. No asset risk, no loan, no maintenance.</p>
                <div class="mt-4 space-y-2 text-sm">
                  <div class="flex gap-2"><span class="text-emerald-500">✔</span> Rent &lt; Bill from month 1</div>
                  <div class="flex gap-2"><span class="text-emerald-500">✔</span> Free cleaning, repairs & insurance</div>
                  <div class="flex gap-2"><span class="text-emerald-500">✔</span> Monitor on app, 24×7 NOC support</div>
                </div>
              </div>
              <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white p-6 flex flex-col justify-between relative overflow-hidden">
                <div class="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10 blur-2xl"></div>
                <div>
                  <p class="text-xs tracking-widest opacity-60 uppercase">Rent vs Buy</p>
                  <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div class="rounded-xl bg-white/10 p-3">
                      <div class="opacity-60 text-xs">Buy 3kW</div>
                      <div class="font-bold text-amber-300">₹2.1L upfront</div>
                      <div class="opacity-60 text-xs">+ ₹800/qtr service</div>
                    </div>
                    <div class="rounded-xl bg-green-600 p-3">
                      <div class="opacity-90 text-xs">Rent 3kW</div>
                      <div class="font-bold">₹3,499 /mo</div>
                      <div class="opacity-90 text-xs">₹0 upfront</div>
                    </div>
                  </div>
                </div>
                <div class="text-xs opacity-70 mt-4">Rent pays back instantly. Buying takes 5–6 years to break even.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- how it works — steps like OP guide -->
      <section id="how" class="wrap section">
        <div class="text-center max-w-2xl mx-auto">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-green-600 shadow-lg shadow-green-600/20 mb-4"><span class="text-white">✦</span></div>
          <h2 class="text-3xl md:text-4xl font-black tracking-tight">Sunlight → Savings in <span class="gradient-text">3 steps</span></h2>
          <p class="text-zinc-500 mt-3">Book survey, we install, you save. Paperwork, net-meter and service — we handle everything.</p>
        </div>
        <div class="steps mt-8">
          ${[
            {n:'01', t:'Book free survey', d:'Engineer visits, drone shade scan, load & shadow report in 24h. Zero fee.'},
            {n:'02', t:'We install in 48h', d:'Panels, inverter, meter + DISCOM filing. You just give roof access.'},
            {n:'03', t:'Pay rent, not bill', d:'Generation adjusts your bill. You pay low rent. Savings auto every month.'},
          ].map(s=>`
            <div class="nova-card p-6 flex gap-4">
              <div class="step-num">${s.n}</div>
              <div><h3 class="font-bold">${s.t}</h3><p class="text-sm text-zinc-500 mt-1">${s.d}</p></div>
            </div>`).join('')}
        </div>
        <div class="nova-card p-4 mt-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-green-50 to-white border-green-100">
          <span class="text-sm">⚙️  What we include: <b>Install + net-meter + insurance + quarterly cleaning + inverter + remote monitoring + repairs</b></span>
          <a href="#contact" class="btn-primary rounded-full px-5 py-2 text-sm">Book free survey</a>
        </div>
      </section>

      <!-- features bento -->
      <section class="wrap section pt-0">
        <h3 class="text-xl font-bold flex items-center gap-2"><span class="w-1.5 h-6 rounded-full bg-green-600"></span> Everything you need — nothing you don’t</h3>
        <div class="bento-grid mt-4">
          ${featuresList.map(f=>`
            <div class="nova-card p-5 hover:-translate-y-1">
              <div class="w-11 h-11 rounded-xl ${f.color} text-white grid place-items-center text-lg">${esc(f.icon)}</div>
              <h4 class="font-bold mt-4">${esc(f.title)}</h4>
              <p class="text-sm text-zinc-500 mt-1">${esc(f.desc)}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- shop teaser -->
      <section class="wrap section pt-0">
        <div class="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 class="text-2xl md:text-3xl font-black">Pick your <span class="gradient-text">rent</span> — not your loan</h2>
            <p class="text-zinc-500 text-sm mt-1">All plans include install, monitoring, cleaning & insurance. GST extra. Cancel after 12 months.</p>
          </div>
          <a href="#/shop" class="btn-secondary rounded-full">View all plans →</a>
        </div>
        <div class="shop-grid mt-6">
          ${teaser.map(p=> productCard(p)).join('')}
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <span class="badge badge-warning">No hidden charges</span>
          <span class="badge badge-success">Relocatable</span>
          <span class="badge badge-default">Subsidy passed via lower rent</span>
        </div>
        <!-- comparison table -->
        <div class="nova-card p-0 overflow-hidden mt-8">
          <div class="p-5 flex items-center justify-between flex-wrap gap-3">
            <h3 class="font-bold">Renting vs Buying — quick compare</h3>
            <a href="#/calculator" class="badge badge-pink">Try calculator</a>
          </div>
          <div class="overflow-x-auto">
            <table class="compare-table">
              <thead><tr><th></th><th class="text-green-700">☀️ Rent (Saathi)</th><th>Buying outright</th></tr></thead>
              <tbody>
                <tr><td class="font-medium">Upfront</td><td class="font-bold text-emerald-600">₹0</td><td>₹1.8–6L + loan</td></tr>
                <tr><td class="font-medium">Install + net meter</td><td>✔ Free & done by us</td><td>You chase vendors/DISCOM</td></tr>
                <tr><td class="font-medium">Cleaning / repairs</td><td>✔ Included, 24×7 monitoring</td><td>Pay per visit</td></tr>
                <tr><td class="font-medium">If you shift</td><td>We relocate / transfer</td><td>You dismantle & lose warranty</td></tr>
                <tr><td class="font-medium">Break-even</td><td class="font-bold">From month 1</td><td>5–6 years</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- calculator teaser -->
      <section class="wrap section pt-0">
        <div class="nova-card p-6 md:p-8 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <span class="badge badge-pink">Savings calculator</span>
            <h3 class="text-2xl font-black mt-2">What’s your bill? <span class="gradient-text">We’ll show the rent.</span></h3>
            <p class="text-sm text-zinc-500 mt-2">Slide your monthly bill — see kW needed, rent and net savings instantly.</p>
            <div class="mt-5">
              <label class="text-sm font-semibold flex justify-between">Monthly bill <span id="billLabel" class="text-green-700">₹5,000</span></label>
              <input id="homeCalc" class="calc-range mt-2" type="range" min="1500" max="15000" step="100" value="5000" />
              <div class="flex justify-between text-xs text-zinc-500"><span>₹1.5k</span><span>₹15k</span></div>
            </div>
          </div>
          <div id="homeCalcOut" class="calc-output rounded-2xl p-5"></div>
        </div>
      </section>

      <!-- testimonials — OP 3d testimonial vibes -->
      <section class="wrap section pt-0">
        <h3 class="text-xl font-bold flex items-center gap-2"><span class="w-8 h-8 rounded-xl bg-green-600 text-white grid place-items-center">❝</span> Loved by homeowners</h3>
        <div class="grid md:grid-cols-3 gap-4 mt-4">
          ${testimonials.map(t=>`
            <div class="nova-card p-5">
              <div class="flex gap-1 text-amber-500 text-sm">${'★'.repeat(t.stars)}</div>
              <p class="text-sm mt-3 leading-relaxed text-zinc-700">“${esc(t.text)}”</p>
              <div class="flex items-center gap-3 mt-4">
                <img src="${t.avatar}" class="w-9 h-9 rounded-full object-cover" alt=""/>
                <div><div class="text-sm font-bold">${esc(t.name)}</div><div class="text-xs text-zinc-500">${esc(t.city)}</div></div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- FAQ — accordion like AppGuide -->
      <section id="faq" class="wrap section pt-0">
        <h3 class="text-xl font-bold flex items-center gap-2"><span class="w-8 h-8 rounded-xl bg-zinc-900 text-white grid place-items-center">?</span> FAQ</h3>
        <div class="nova-card p-2 md:p-4 mt-4">
          ${faqs.map((f,i)=>`
            <div class="border-b last:border-0 border-zinc-100">
              <button data-faq="${i}" class="w-full flex items-center justify-between py-4 text-left gap-4 group">
                <span class="font-medium group-hover:text-green-700 transition-colors text-sm md:text-[15px]">${esc(f.q)}</span>
                <span class="shrink-0 w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 grid place-items-center group-[.open]:bg-green-600 group-[.open]:text-white group-[.open]:rotate-45 transition-all faq-plus">+</span>
              </button>
              <div class="faq-ans overflow-hidden max-h-0 opacity-0 transition-all duration-300"><p class="text-sm text-zinc-500 pb-4 pr-8">${esc(f.a)}</p></div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- contact / survey -->
      <section id="contact" class="wrap section pt-0">
        <div class="nova-card p-6 md:p-8 grid md:grid-cols-2 gap-8">
          <div>
            <span class="badge badge-pink">Free site survey</span>
            <h3 class="text-2xl font-black mt-2">Book a survey in 30 seconds</h3>
            <p class="text-sm text-zinc-500 mt-2">We’ll visit, scan shade, and give a precise rent & savings report. No fee, no pushy sales.</p>
            <ul class="mt-4 space-y-2 text-sm">
              <li class="flex gap-2"><span class="text-emerald-500">✔</span> Drone shade + generation estimate</li>
              <li class="flex gap-2"><span class="text-emerald-500">✔</span> DISCOM & subsidy handled</li>
              <li class="flex gap-2"><span class="text-emerald-500">✔</span> Install within 48h of approval</li>
            </ul>
            <div class="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
              <span class="badge badge-default">Pune • Mumbai • Nagpur</span>
              <span class="badge badge-default">Delhi NCR • Hyderabad • Bangalore</span>
            </div>
          </div>
          <form id="surveyForm" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input class="input-field" name="name" placeholder="Full name" required />
              <input class="input-field" name="phone" placeholder="Phone (WhatsApp)" required pattern="\\d{10}" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input class="input-field" name="pincode" placeholder="Pincode" required pattern="\\d{6}" />
              <input class="input-field" name="bill" type="number" placeholder="Monthly bill (₹)" required min="500" />
            </div>
            <input class="input-field" name="address" placeholder="Society / Area, City" required />
            <select class="input-field" name="roof"><option value="">Roof type</option><option>Flat RCC</option><option>Tin shed</option><option>Car parking</option></select>
            <textarea class="input-field" name="note" rows="2" placeholder="Any shade / timing note?"></textarea>
            <button class="btn-primary w-full rounded-full justify-center" type="submit">Request free survey — ₹0</button>
            <p class="text-xs text-zinc-500 text-center">By booking you agree to site visit & WhatsApp updates. No spam.</p>
          </form>
        </div>
      </section>
    </div>`;

    // calc teaser wiring
    const range = document.getElementById('homeCalc');
    const label = document.getElementById('billLabel');
    const out = document.getElementById('homeCalcOut');
    function updateHomeCalc(){
      const bill = parseInt(range.value,10);
      label.textContent = fmt(bill);
      const m = calcMetrics(bill);
      out.innerHTML = `
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="rounded-xl bg-white p-3"><div class="text-xs text-zinc-500">Need</div><div class="font-black text-lg">${m.kw} kW</div><div class="text-xs text-zinc-500">${m.gen} units</div></div>
          <div class="rounded-xl bg-white p-3 border-2 border-green-200"><div class="text-xs text-zinc-500">Rent</div><div class="font-black text-lg text-green-700">${fmt(m.rent)}/mo</div><div class="text-xs text-zinc-500">vs ${fmt(bill)} bill</div></div>
          <div class="rounded-xl bg-emerald-500 text-white p-3"><div class="text-xs opacity-80">You save</div><div class="font-black text-lg">${fmt(m.savings)}/mo</div><div class="text-xs opacity-80">₹${(m.savings*12).toLocaleString('en-IN')}/yr</div></div>
        </div>
        <div class="mt-4 flex gap-2">
          <a href="#/shop" class="btn-primary rounded-full flex-1 justify-center">See ${m.kw}kW plans</a>
          <a href="#/calculator" class="btn-secondary rounded-full">Full calculator</a>
        </div>
        <p class="text-xs text-zinc-500 mt-3">*Includes install, inverter, net-meter, cleaning, insurance. GST extra.</p>
      `;
    }
    range.addEventListener('input', updateHomeCalc);
    updateHomeCalc();

    // faq accordion
    $view.querySelectorAll('[data-faq]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const wrap = btn.parentElement;
        const ans = wrap.querySelector('.faq-ans');
        const isOpen = wrap.classList.contains('open');
        $view.querySelectorAll('#faq .open').forEach(o=>{ o.classList.remove('open'); o.querySelector('.faq-ans').style.maxHeight='0px'; o.querySelector('.faq-ans').style.opacity='0'; o.querySelector('.faq-ans').style.marginBottom='0'; });
        if(!isOpen){
          wrap.classList.add('open');
          ans.style.maxHeight = ans.scrollHeight + 'px';
          ans.style.opacity='1';
        }
      });
    });
    // survey
    document.getElementById('surveyForm').addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd.entries());
      const id = 'SV-' + Math.random().toString(36).slice(2,7).toUpperCase();
      store.bookings.unshift({ id, type:'survey', plan:'Site survey', name:data.name, phone:data.phone, pincode:data.pincode, address:data.address, bill: data.bill, roof: data.roof, note: data.note, status:'Survey scheduled', date: new Date().toISOString().slice(0,10), rent:'—' });
      saveStore();
      toast('Survey booked! We’ll WhatsApp you shortly — '+id, 'success');
      e.target.reset();
    });
    attachReveal();
    bindRentButtons();
  }

  function productCard(p){
    return `
    <div class="nova-card product-card card-hover">
      <div class="relative">
        <img src="${p.img}" alt="${esc(p.name)}" loading="lazy" />
        <span class="absolute top-3 left-3 badge badge-pink shadow">${esc(p.badge)}</span>
        <span class="absolute top-3 right-3 badge bg-white border border-zinc-200">${p.kw} kW • ${p.panels} panels</span>
        ${p.popular ? `<span class="absolute bottom-3 right-3 badge badge-success">★ Most rented</span>` : ''}
      </div>
      <div class="p-4 flex-1 flex flex-col">
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-bold leading-tight">${esc(p.name)}</h3>
          <span class="text-xs text-zinc-500 whitespace-nowrap">★ ${p.rating} (${p.reviews})</span>
        </div>
        <p class="text-xs text-zinc-500 mt-1">${esc(p.area)} • ${p.battery ? 'Battery backup' : 'On-grid'} • ${esc(p.cat)}</p>
        <div class="product-meta mt-3">
          <span class="price">${fmt(p.rent)}<span class="text-sm font-medium text-zinc-500">/mo</span></span>
          <span class="text-xs line-through text-zinc-400">${fmt(p.bill)} bill</span>
          <span class="badge badge-success">Save ~${fmt(p.bill - p.rent)}/mo</span>
        </div>
        <ul class="mt-3 space-y-1 text-xs text-zinc-600">
          ${p.features.map(f=>`<li class="flex gap-1.5"><span class="text-emerald-500">✔</span> ${esc(f)}</li>`).join('')}
        </ul>
        <div class="mt-4 flex gap-2">
          <button class="btn-primary flex-1 rounded-full" data-rent="${p.id}">Rent this →</button>
          <button class="btn-secondary rounded-full px-3" data-details="${p.id}">Details</button>
        </div>
      </div>
    </div>`;
  }

  function renderShop(){
    $view.innerHTML = `
    <div class="page-enter">
      <section class="wrap pt-6 pb-4">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl font-black">Rental <span class="gradient-text">Plans</span></h1>
            <p class="text-sm text-zinc-500 mt-1">Zero upfront • Rent beats bill from month 1 • Includes service & insurance</p>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="badge badge-pink">Subsidy via lower rent</span>
            <span class="badge badge-success">Relocatable</span>
          </div>
        </div>
        <div class="nova-card p-3 md:p-4 mt-4 flex flex-wrap gap-3 items-center">
          <div class="toolbar flex-1">
            <input id="q" type="search" placeholder="Search 1kW, battery, villa…" />
            <select id="cat"><option value="">All categories</option><option>Residential</option><option>Commercial</option><option>Hybrid</option></select>
            <select id="sort"><option value="popular">Sort: Popular</option><option value="rentAsc">Rent: low → high</option><option value="rentDesc">Rent: high → low</option><option value="kwDesc">kW: high → low</option></select>
          </div>
          <span id="count" class="text-xs text-zinc-500"></span>
        </div>
      </section>
      <section class="wrap pb-10">
        <div id="grid" class="shop-grid"></div>
        <div id="empty" class="hidden nova-card p-8 text-center text-zinc-500 mt-4">No plans match your search.</div>
        <div class="nova-card p-4 mt-6 flex flex-wrap gap-3 items-center justify-between bg-gradient-to-r from-amber-50 to-white border-amber-100">
          <span class="text-sm">Not sure what size you need? Use the calculator.</span>
          <a href="#/calculator" class="btn-primary rounded-full px-5 py-2">Open calculator</a>
        </div>
      </section>
    </div>`;
    const $q=document.getElementById('q'), $cat=document.getElementById('cat'), $sort=document.getElementById('sort'), $grid=document.getElementById('grid'), $empty=document.getElementById('empty'), $count=document.getElementById('count');
    function apply(){
      let list=[...store.products];
      const q=($q.value||'').toLowerCase().trim();
      if(q) list=list.filter(p=> (p.name+p.kw+p.cat+p.features.join(' ')).toLowerCase().includes(q));
      if($cat.value) list=list.filter(p=>p.cat=== $cat.value);
      if($sort.value==='rentAsc') list.sort((a,b)=>a.rent-b.rent);
      else if($sort.value==='rentDesc') list.sort((a,b)=>b.rent-a.rent);
      else if($sort.value==='kwDesc') list.sort((a,b)=>b.kw-a.kw);
      $grid.innerHTML = list.map(p=>productCard(p)).join('');
      $empty.classList.toggle('hidden', list.length!==0);
      $count.textContent = list.length + ' plans';
      bindRentButtons();
      bindDetails();
    }
    $q.addEventListener('input', apply);
    $cat.addEventListener('change', apply);
    $sort.addEventListener('change', apply);
    apply();
  }

  function bindRentButtons(){
    $view.querySelectorAll('[data-rent]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id=btn.getAttribute('data-rent');
        const p=store.products.find(x=>x.id===id);
        if(p) openRentModal(p);
      });
    });
  }
  function bindDetails(){
    $view.querySelectorAll('[data-details]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id=btn.getAttribute('data-details');
        const p=store.products.find(x=>x.id===id);
        if(p) openDetailsModal(p);
      });
    });
  }
  function openDetailsModal(p){
    openModal(`
      <div class="flex gap-4">
        <img src="${p.img}" class="w-24 h-24 rounded-xl object-cover" alt="" />
        <div><h3 class="font-black text-lg">${esc(p.name)}</h3><p class="text-sm text-zinc-500">${p.kw} kW • ${p.panels} panels • ${esc(p.area)} • ${p.battery?'Hybrid battery':'On-grid'}</p><p class="mt-2 font-black text-green-700 text-xl">${fmt(p.rent)}/mo <span class="text-sm text-zinc-500 font-medium">was ${fmt(p.bill)} bill</span></p></div>
      </div>
      <ul class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        ${p.features.map(f=>`<li class="flex gap-2"><span class="text-emerald-500">✔</span>${esc(f)}</li>`).join('')}
        <li class="flex gap-2"><span class="text-emerald-500">✔</span>Free install + net-meter filing</li>
        <li class="flex gap-2"><span class="text-emerald-500">✔</span>Quarterly cleaning + repairs</li>
        <li class="flex gap-2"><span class="text-emerald-500">✔</span>25-yr panel, 10-yr inverter warranty</li>
        <li class="flex gap-2"><span class="text-emerald-500">✔</span>Fire & theft insurance</li>
      </ul>
      <div class="nova-card p-3 mt-4 bg-amber-50 border-amber-100 text-sm">Save ~<b>${fmt(p.bill - p.rent)}/mo</b> • Payback from month 1 • Relocatable • Cancel after 12 mo</div>
      <div class="flex gap-3 mt-4">
        <button class="btn-primary flex-1 rounded-full" id="detailRent">Rent this plan →</button>
        <button class="btn-secondary rounded-full" onclick="document.getElementById('modalBackdrop').click()">Close</button>
      </div>
    `);
    document.getElementById('detailRent').addEventListener('click', ()=>{ closeModal(); openRentModal(p); });
  }

  function openRentModal(p){
    const suggested = calcMetrics(p.bill);
    openModal(`
      <div class="flex items-center gap-3">
        <img src="${p.img}" class="w-14 h-14 rounded-xl object-cover" alt=""/>
        <div><h3 class="font-black leading-tight">${esc(p.name)}</h3><p class="text-xs text-zinc-500">${p.kw}kW • ${fmt(p.rent)}/mo • Save ${fmt(p.bill-p.rent)}/mo</p></div>
        <span class="ml-auto badge badge-pink">${esc(p.badge)}</span>
      </div>
      <form id="rentForm" class="mt-4 space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input class="input-field" name="name" placeholder="Full name" required />
          <input class="input-field" name="phone" placeholder="Phone" required pattern="\\d{10}" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input class="input-field" name="pincode" placeholder="Pincode" required pattern="\\d{6}" />
          <input class="input-field" name="bill" type="number" value="${p.bill}" placeholder="Monthly bill (₹)" required />
        </div>
        <input class="input-field" name="address" placeholder="Full address with landmark" required />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input class="input-field" name="date" type="date" required />
          <select class="input-field" name="slot"><option>Morning 10–1</option><option>Afternoon 2–5</option><option>Evening 5–7</option></select>
        </div>
        <label class="flex gap-2 items-start text-xs text-zinc-600"><input type="checkbox" required class="mt-1"/> I agree to site survey & that rent is ${fmt(p.rent)}/mo with ₹0 upfront. Cancel after 12 mo.</label>
        <div class="nova-card p-3 bg-gradient-to-r from-green-50 to-white border-green-100 text-sm">
          <div class="flex justify-between"><span>Estimated saving</span><b class="text-emerald-600">${fmt(p.bill-p.rent)}/mo</b></div>
          <div class="text-xs text-zinc-500">Based on your bill and ${p.kw}kW generation (~${p.kw*120} units/mo). Final after survey.</div>
        </div>
        <div class="flex gap-3">
          <button class="btn-primary flex-1 rounded-full" type="submit">Confirm rent — ₹0 today</button>
          <button class="btn-secondary rounded-full" type="button" id="cancelModal">Cancel</button>
        </div>
        <p class="text-xs text-center text-zinc-500">No payment today. We verify roof, then schedule install.</p>
      </form>
    `);
    const form=document.getElementById('rentForm');
    document.getElementById('cancelModal').addEventListener('click', closeModal);
    const dateInput=form.querySelector('input[name="date"]');
    const tomorrow=new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    dateInput.min=tomorrow.toISOString().slice(0,10);
    dateInput.value=tomorrow.toISOString().slice(0,10);
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const fd=new FormData(form);
      const d=Object.fromEntries(fd.entries());
      const id='BK-'+Math.random().toString(36).slice(2,7).toUpperCase();
      store.bookings.unshift({ id, type:'rent', plan:p.name, kw:p.kw, rent:p.rent, name:d.name, phone:d.phone, pincode:d.pincode, address:d.address, bill:d.bill, date:d.date, slot:d.slot, status:'Pending survey', created: new Date().toISOString() });
      saveStore();
      closeModal();
      toast('Booked! '+p.name+' — '+id+' — survey on '+d.date,'success');
      location.hash='#/bookings';
    });
  }

  function renderCalculator(){
    $view.innerHTML = `
    <div class="page-enter wrap section">
      <div class="max-w-3xl mx-auto text-center">
        <span class="badge badge-pink">Calculator</span>
        <h1 class="text-3xl md:text-4xl font-black mt-2">How much will you <span class="gradient-text">save?</span></h1>
        <p class="text-zinc-500 mt-2">Slide your bill, pincode tariff and roof size. We estimate kW, rent & yearly savings.</p>
      </div>
      <div class="nova-card p-6 md:p-8 mt-6 grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div class="space-y-5">
          <div>
            <label class="text-sm font-semibold flex justify-between">Monthly bill <span id="cBillL" class="text-green-700">₹5,000</span></label>
            <input id="cBill" type="range" min="1200" max="18000" step="100" value="5000" class="calc-range mt-2" />
            <div class="flex justify-between text-xs text-zinc-500"><span>₹1.2k</span><span>₹18k</span></div>
          </div>
          <div>
            <label class="text-sm font-semibold flex justify-between">Tariff (₹/unit) <span id="cTarL" class="text-green-700">₹8</span></label>
            <input id="cTar" type="range" min="5" max="12" step="0.5" value="8" class="calc-range mt-2" />
          </div>
          <div>
            <label class="text-sm font-semibold">Pincode (for DISCOM & sun hours)</label>
            <input id="cPin" class="input-field mt-1" placeholder="e.g. 411045" maxlength="6" />
          </div>
          <div class="nova-card p-3 bg-zinc-50 text-xs text-zinc-600">
            Assumptions: 4.8 sun hours, 120 units/kW/mo, rent ≈ ₹1,150/kW + fixed. Net-metering 1:1. Sub 3% rent hike vs 7% tariff hike modeled for 10-yr view.
          </div>
        </div>
        <div id="cOut"></div>
      </div>
      <div class="max-w-5xl mx-auto mt-6 nova-card p-0 overflow-hidden">
        <div class="p-4 font-bold">10-year view (rent vs keep paying bill)</div>
        <div class="overflow-x-auto">
          <table class="compare-table">
            <thead><tr><th>Year</th><th>Pay bill alone</th><th>Pay rent + top-up</th><th class="text-emerald-600">You keep</th></tr></thead>
            <tbody id="cTable"></tbody>
          </table>
        </div>
      </div>
    </div>`;
    const cBill=document.getElementById('cBill'), cTar=document.getElementById('cTar'), cBillL=document.getElementById('cBillL'), cTarL=document.getElementById('cTarL'), cOut=document.getElementById('cOut'), cTable=document.getElementById('cTable');
    function upd(){
      const bill=parseInt(cBill.value,10), tar=parseFloat(cTar.value);
      cBillL.textContent=fmt(bill); cTarL.textContent='₹'+tar;
      const units=Math.round(bill/tar);
      const kw=Math.max(1, Math.min(10, Math.round((units/120)*2)/2));
      const gen=Math.round(kw*120);
      const rent=Math.round(kw*1150+350);
      const topup=Math.max(0, units-gen)*tar;
      const payRent= rent + topup;
      const save= bill - payRent;
      cOut.innerHTML=`
        <div class="calc-output rounded-2xl p-5">
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-white rounded-xl p-3"><div class="text-xs text-zinc-500">Units used</div><div class="font-black">${units}</div><div class="text-xs text-zinc-500">${kw} kW → ${gen} gen</div></div>
            <div class="bg-white rounded-xl p-3 border-2 border-green-200"><div class="text-xs text-zinc-500">Rent</div><div class="font-black text-green-700">${fmt(rent)}</div><div class="text-xs text-zinc-500">+ ${fmt(Math.round(topup))} top-up</div></div>
            <div class="bg-emerald-500 text-white rounded-xl p-3"><div class="text-xs opacity-80">Save</div><div class="font-black">${fmt(Math.round(save))}/mo</div><div class="text-xs opacity-80">${Math.round(save*12/1000)}k /yr</div></div>
          </div>
          <div class="mt-4 flex gap-2">
            <a href="#/shop" class="btn-primary rounded-full flex-1 justify-center">See ${kw}kW plans</a>
            <button class="btn-secondary rounded-full" id="bookCalc">Book survey</button>
          </div>
          <p class="text-xs text-zinc-500 mt-3">Top-up = bill for units not covered by solar. If gen ≥ usage, top-up = ₹0.</p>
        </div>
        <div class="mt-3 flex flex-wrap gap-2 text-xs"><span class="badge badge-default">Pay rent instead of bill</span><span class="badge badge-success">Clean + insure included</span></div>
      `;
      // table
      let rows=''; let rentYr=rent*12, billYr=bill*12;
      for(let y=1;y<=10;y++){
        const by=Math.round(billYr*Math.pow(1.07, y-1));
        const ry=Math.round(rentYr*Math.pow(1.03, y-1) + topup*12*Math.pow(1.07, y-1));
        const keep=by-ry;
        rows+=`<tr><td>Year ${y}</td><td>${fmt(by)}</td><td>${fmt(ry)}</td><td class="font-bold text-emerald-600">${fmt(keep)}</td></tr>`;
      }
      cTable.innerHTML=rows;
      document.getElementById('bookCalc')?.addEventListener('click', ()=>{
        const p=store.products.find(x=>x.kw===kw) || store.products[2];
        openRentModal(p);
      });
    }
    cBill.addEventListener('input', upd); cTar.addEventListener('input', upd); upd();
    attachReveal();
  }

  function renderBookings(){
    const bookings=store.bookings;
    $view.innerHTML = `
    <div class="page-enter wrap section">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black">My <span class="gradient-text">Bookings</span></h1>
          <p class="text-sm text-zinc-500">${bookings.length} bookings • Stored locally on this device</p>
        </div>
        <div class="flex gap-2">
          <a href="#/shop" class="btn-secondary rounded-full">+ New booking</a>
          <button id="clearB" class="btn-ghost">Clear all</button>
        </div>
      </div>
      ${bookings.length===0 ? `
        <div class="nova-card p-10 text-center mt-6">
          <div class="w-14 h-14 rounded-2xl bg-green-100 text-green-700 grid place-items-center mx-auto text-xl">☀️</div>
          <h3 class="font-bold mt-3">No bookings yet</h3>
          <p class="text-sm text-zinc-500">Rent a plan or book a free survey to see it here.</p>
          <a href="#/shop" class="btn-primary rounded-full mt-4 inline-flex">Browse plans</a>
        </div>
      ` : `
        <div class="grid md:grid-cols-2 gap-4 mt-6">
          ${bookings.map(b=>`
            <div class="nova-card p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="badge ${b.type==='survey' ? 'badge-warning':'badge-pink'}">${b.type==='survey' ? 'Survey' : b.kw+'kW Rent'}</span>
                    <span class="text-xs text-zinc-500">${esc(b.id)} • ${esc(b.date||'—')}</span>
                  </div>
                  <h3 class="font-bold mt-1">${esc(b.plan)}</h3>
                  <p class="text-sm text-zinc-500">${esc(b.name)} • ${esc(b.phone)} • ${esc(b.pincode||'')}</p>
                  <p class="text-xs text-zinc-500">${esc(b.address||'')}</p>
                </div>
                <span class="badge ${statusColor(b.status)}">${esc(b.status)}</span>
              </div>
              <div class="mt-3 flex items-center gap-2 text-xs text-zinc-600 flex-wrap">
                ${b.rent && b.rent!=='—' ? `<span class="badge badge-default">${fmt(Number(b.rent)||0)}/mo</span>` : ''}
                ${b.bill ? `<span>Bill ${fmt(Number(b.bill))}</span>` : ''}
                ${b.slot ? `<span>• ${esc(b.slot)}</span>` : ''}
              </div>
              <div class="mt-4 flex gap-2">
                <button class="btn-secondary rounded-full text-xs" data-track="${b.id}">Track</button>
                <button class="btn-ghost text-xs" data-cancel="${b.id}">Cancel</button>
                <span class="ml-auto text-xs text-zinc-400">${timeAgo(b.created||b.date)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `}
      <div class="nova-card p-4 mt-6 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white flex flex-wrap items-center justify-between gap-3">
        <span class="text-sm">Need help? WhatsApp us on <b>+91 7075224965</b> (9am–9pm)</span>
        <a href="#contact" class="badge bg-white text-zinc-900">Contact support</a>
      </div>
    </div>`;
    document.getElementById('clearB')?.addEventListener('click', ()=>{
      if(confirm('Clear all bookings from this device?')){ store.bookings=[]; saveStore(); toast('Cleared','error'); renderBookings(); }
    });
    $view.querySelectorAll('[data-cancel]').forEach(b=>b.addEventListener('click', ()=>{
      const id=b.getAttribute('data-cancel'); store.bookings=store.bookings.filter(x=>x.id!==id); saveStore(); toast('Cancelled '+id); renderBookings();
    }));
    $view.querySelectorAll('[data-track]').forEach(b=>b.addEventListener('click', ()=>{
      const id=b.getAttribute('data-track'); const bk=store.bookings.find(x=>x.id===id); if(!bk) return;
      openModal(`
        <h3 class="font-black text-lg">Track ${esc(bk.id)}</h3>
        <div class="mt-3 space-y-3">
          ${['Survey scheduled','Install assigned','Installed','Net-meter applied','Live — saving'].map((s,i)=>`
            <div class="flex gap-3 items-center ${statusIdx(bk.status) >= i ? 'opacity-100' :'opacity-40'}">
              <div class="w-8 h-8 rounded-full ${statusIdx(bk.status) >= i ? 'bg-emerald-500 text-white':'bg-zinc-200'} grid place-items-center text-xs">${statusIdx(bk.status) > i ? '✓' : i+1}</div>
              <div><div class="text-sm font-semibold">${s}</div><div class="text-xs text-zinc-500">Step ${i+1}</div></div>
            </div>
          `).join('')}
        </div>
        <div class="nova-card p-3 mt-4 bg-green-50 border-green-100 text-sm">Engineer will call 12h before visit. Keep roof access ready.</div>
        <button class="btn-secondary w-full rounded-full mt-4" onclick="document.getElementById('modalBackdrop').click()">Close</button>
      `);
    }));
  }
  function statusColor(s){
    s=(s||'').toLowerCase();
    if(s.includes('live')||s.includes('installed')) return 'badge-success';
    if(s.includes('pending')||s.includes('survey')) return 'badge-warning';
    return 'badge-default';
  }
  function statusIdx(s){
    s=(s||'').toLowerCase();
    if(s.includes('live')) return 4;
    if(s.includes('net')) return 3;
    if(s.includes('install') && !s.includes('assigned')) return 2;
    if(s.includes('assigned')) return 1;
    return 0;
  }
  function timeAgo(iso){
    if(!iso) return ''; const d=new Date(iso); const diff=(Date.now()-d.getTime())/1000;
    if(diff<60) return 'just now'; if(diff<3600) return Math.floor(diff/60)+'m ago'; if(diff<86400) return Math.floor(diff/3600)+'h ago'; return d.toLocaleDateString('en-IN');
  }

  function renderAdmin(){
    const totalRent = store.bookings.filter(b=>b.type==='rent').reduce((a,b)=>a+(Number(b.rent)||0),0);
    const pending = store.bookings.filter(b=> (b.status||'').toLowerCase().includes('pending') || (b.status||'').toLowerCase().includes('scheduled')).length;
    $view.innerHTML = `
    <div class="page-enter wrap section">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black">Admin <span class="gradient-text">Dashboard</span></h1>
          <p class="text-sm text-zinc-500">Local admin • Data stored in browser • Use for demo / ops.</p>
        </div>
        <div class="flex gap-2">
          <button id="exportBtn" class="btn-secondary rounded-full">Export JSON</button>
          <button id="seedBtn" class="btn-ghost">Reset seed</button>
        </div>
      </div>
      <div class="grid md:grid-cols-4 gap-4 mt-6">
        <div class="nova-card nova-card-stat p-5"><div class="text-xs tracking-widest text-zinc-500 uppercase">Bookings</div><div class="font-black text-2xl mt-1">${store.bookings.length}</div><div class="text-xs text-zinc-500">All time</div></div>
        <div class="nova-card nova-card-stat p-5"><div class="text-xs tracking-widest text-zinc-500 uppercase">Pending</div><div class="font-black text-2xl mt-1">${pending}</div><div class="text-xs text-green-700">Needs action</div></div>
        <div class="nova-card nova-card-stat p-5"><div class="text-xs tracking-widest text-zinc-500 uppercase">Monthly rent (booked)</div><div class="font-black text-2xl mt-1">${fmt(totalRent)}</div><div class="text-xs text-zinc-500">MRR if all live</div></div>
        <div class="nova-card nova-card-stat p-5"><div class="text-xs tracking-widest text-zinc-500 uppercase">Plans</div><div class="font-black text-2xl mt-1">${store.products.length}</div><div class="text-xs text-zinc-500">Active SKUs</div></div>
      </div>
      <div class="grid lg:grid-cols-3 gap-6 mt-6">
        <div class="lg:col-span-2 nova-card p-0 overflow-hidden">
          <div class="p-4 flex items-center justify-between">
            <h3 class="font-bold">Bookings</h3>
            <input id="adminSearch" class="input-field !w-56 !py-1.5 text-sm" placeholder="Search name/phone/plan" />
          </div>
          <div class="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-[#f0fdf4]"><tr><th class="text-left p-3">ID • Plan</th><th class="text-left p-3">Customer</th><th class="text-left p-3">Date</th><th class="text-left p-3">Status</th><th class="p-3">Actions</th></tr></thead>
              <tbody id="adminTbody"></tbody>
            </table>
          </div>
        </div>
        <div class="space-y-4">
          <div class="nova-card p-4">
            <h3 class="font-bold">Add / edit plan</h3>
            <form id="planForm" class="mt-3 space-y-2">
              <input class="input-field" name="name" placeholder="Plan name e.g. Saathi Home 6kW" required />
              <div class="grid grid-cols-2 gap-2">
                <input class="input-field" name="kw" type="number" step="0.5" placeholder="kW" required />
                <input class="input-field" name="rent" type="number" placeholder="Rent/mo" required />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input class="input-field" name="bill" type="number" placeholder="Typical bill" required />
                <input class="input-field" name="panels" type="number" placeholder="Panels" required />
              </div>
              <input class="input-field" name="img" placeholder="Image URL" />
              <select class="input-field" name="cat"><option>Residential</option><option>Commercial</option><option>Hybrid</option></select>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="popular"/> Mark popular</label>
              <input class="input-field" name="badge" placeholder="Badge e.g. New" />
              <button class="btn-primary w-full rounded-full">Save plan</button>
            </form>
          </div>
          <div class="nova-card p-4">
            <h3 class="font-bold">Plans</h3>
            <div id="adminPlans" class="mt-3 space-y-2 max-h-[420px] overflow-auto pr-1"></div>
          </div>
        </div>
      </div>
    </div>`;
    const $tbody=document.getElementById('adminTbody'), $search=document.getElementById('adminSearch');
    function drawBookings(){
      const q=($search.value||'').toLowerCase();
      let list=[...store.bookings];
      if(q) list=list.filter(b=> (b.id+b.name+b.phone+b.plan).toLowerCase().includes(q));
      $tbody.innerHTML = list.map(b=>`
        <tr class="border-t border-green-50">
          <td class="p-3"><div class="font-medium">${esc(b.id)}</div><div class="text-xs text-zinc-500">${esc(b.plan)}</div></td>
          <td class="p-3"><div>${esc(b.name)}</div><div class="text-xs text-zinc-500">${esc(b.phone)} • ${esc(b.pincode||'')}</div></td>
          <td class="p-3 text-xs">${esc(b.date||'—')}<div class="text-zinc-500">${esc(b.slot||'')}</div></td>
          <td class="p-3">
            <select data-status="${b.id}" class="input-field !py-1 !px-2 text-xs">
              ${['Pending survey','Survey scheduled','Install assigned','Installed','Net-meter applied','Live — saving','Cancelled'].map(o=>`<option ${o===b.status?'selected':''}>${o}</option>`).join('')}
            </select>
          </td>
          <td class="p-3 text-center"><button data-del="${b.id}" class="text-xs text-red-600 hover:underline">Delete</button></td>
        </tr>
      `).join('') || `<tr><td colspan="5" class="p-8 text-center text-zinc-500">No bookings</td></tr>`;
      $tbody.querySelectorAll('[data-status]').forEach(sel=> sel.addEventListener('change', ()=>{
        const id=sel.getAttribute('data-status'); const bk=store.bookings.find(x=>x.id===id); if(bk){ bk.status=sel.value; saveStore(); toast('Updated '+id); }
      }));
      $tbody.querySelectorAll('[data-del]').forEach(btn=> btn.addEventListener('click', ()=>{
        const id=btn.getAttribute('data-del'); if(confirm('Delete '+id+'?')){ store.bookings=store.bookings.filter(x=>x.id!==id); saveStore(); drawBookings(); toast('Deleted'); }
      }));
    }
    $search.addEventListener('input', drawBookings); drawBookings();
    function drawPlans(){
      const el=document.getElementById('adminPlans');
      el.innerHTML = store.products.map(p=>`
        <div class="flex gap-3 p-2 rounded-xl border border-zinc-100">
          <img src="${p.img}" class="w-14 h-14 rounded-lg object-cover" alt=""/>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate">${esc(p.name)}</div>
            <div class="text-xs text-zinc-500">${p.kw}kW • ${fmt(p.rent)}/mo ${p.popular?'• ★':''}</div>
          </div>
          <button data-rm="${p.id}" class="text-xs text-red-600">Remove</button>
        </div>
      `).join('');
      el.querySelectorAll('[data-rm]').forEach(b=> b.addEventListener('click', ()=>{
        const id=b.getAttribute('data-rm'); if(store.products.length<=1) return toast('Keep at least 1 plan','error');
        store.products=store.products.filter(x=>x.id!==id); saveStore(); drawPlans(); toast('Removed');
      }));
    }
    drawPlans();
    document.getElementById('planForm').addEventListener('submit', e=>{
      e.preventDefault();
      const fd=new FormData(e.target); const d=Object.fromEntries(fd.entries());
      const p={ id:'plan-'+Math.random().toString(36).slice(2,6), name:d.name, kw:parseFloat(d.kw), rent:parseInt(d.rent,10), bill:parseInt(d.bill,10), panels:parseInt(d.panels,10), area: Math.round(parseFloat(d.kw)*80)+' sq ft', battery: d.cat==='Hybrid', cat:d.cat, popular: !!d.popular, rating:4.8, reviews:0, img: d.img || 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=640&q=80&auto=format&fit=crop', features:['Tier-1 panels','Inverter + monitoring','Free service'], badge: d.badge || 'New' };
      store.products.unshift(p); saveStore(); toast('Plan added','success'); e.target.reset(); drawPlans();
    });
    document.getElementById('exportBtn').addEventListener('click', ()=>{
      const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='solarSaathi-export.json'; a.click(); URL.revokeObjectURL(url);
    });
    document.getElementById('seedBtn').addEventListener('click', ()=>{
      if(confirm('Reset to seed data? This clears bookings.')){ store={products:SEED_PRODUCTS, bookings:[]}; saveStore(); location.reload(); }
    });
  }

  function attachReveal(){
    const obs=new IntersectionObserver(entries=> entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target);} }),{threshold:0.12});
    document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
  }

  // ——— NEW PAGES ———
  function renderHow(){
    $view.innerHTML = `
    <div class="page-enter">
      <section class="wrap section">
        <div class="max-w-3xl mx-auto text-center">
          <span class="badge badge-pink">How it works</span>
          <h1 class="text-3xl md:text-4xl font-black mt-2">From <span class="gradient-text">survey to savings</span> in 72 hours</h1>
          <p class="text-zinc-500 mt-2">End-to-end — we handle design, permissions, install & service. You just enjoy lower bills.</p>
        </div>
        <div class="grid md:grid-cols-3 gap-4 mt-8">
          ${[
            {n:'01', title:'Free survey & design', icon:'◈', desc:'Engineer + drone shade analysis. Load, sanction load & shadow report in 24h. You get kW needed, rent & savings guaranteed in writing.', points:['Drone + app scan','Sanction load check','Generation guarantee letter']},
            {n:'02', title:'Permissions & net-meter', icon:'◎', desc:'We file DISCOM application, net-meter, subsidy & CEIG. You only sign. Track on app.', points:['DISCOM file handled','Net-meter liaison','Subsidy via lower rent']},
            {n:'03', title:'Install in 48 hours', icon:'⚡', desc:'Eld-certified team mounts structure, panels, inverter, earthing. No wall damage, no leak. Tested & commissioned.', points:['Hot-dip galvanized structure','550W Tier-1 mono','String + Wi-Fi inverter']},
          ].map(s=>`
            <div class="nova-card p-6">
              <div class="flex items-center gap-3">
                <div class="step-num">${s.n}</div>
                <div class="w-9 h-9 rounded-xl bg-green-600 text-white grid place-items-center">${s.icon}</div>
              </div>
              <h3 class="font-bold mt-4">${s.title}</h3>
              <p class="text-sm text-zinc-500 mt-1">${s.desc}</p>
              <ul class="mt-3 space-y-1 text-xs text-zinc-600">${s.points.map(p=>`<li class="flex gap-1.5"><span class="text-emerald-500">✔</span>${p}</li>`).join('')}</ul>
            </div>
          `).join('')}
        </div>
        <div class="nova-card p-6 mt-6 grid md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-bold">What we include — every plan</h3>
            <div class="grid grid-cols-2 gap-3 mt-3 text-sm">
              ${['Install + structure','Net-meter filing','25-yr panel warranty','10-yr inverter','Quarterly cleaning','24×7 monitoring','On-site repairs','Fire & theft cover'].map(x=>`<span class="flex gap-2"><span class="text-emerald-500">✔</span>${x}</span>`).join('')}
            </div>
          </div>
          <div class="rounded-2xl overflow-hidden border border-green-100">
            <img src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80&auto=format&fit=crop" class="w-full h-48 object-cover" alt="install"/>
            <div class="p-4 bg-gradient-to-r from-green-50 to-white">
              <p class="text-sm font-bold">48-hour install promise</p><p class="text-xs text-zinc-500">If we miss it, rent starts only after switch-on.</p>
            </div>
          </div>
        </div>
        <div class="nova-card p-4 mt-6 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white">
          <span class="text-sm">Ready to start? Book a survey — ₹0, no commitment.</span>
          <a href="#/contact" class="btn-primary rounded-full px-6">Book survey</a>
        </div>
      </section>
      <section class="wrap section pt-0">
        <h3 class="font-bold flex items-center gap-2"><span class="w-1.5 h-6 rounded-full bg-green-600"></span> Timeline</h3>
        <div class="nova-card p-6 mt-4">
          <div class="grid md:grid-cols-4 gap-4 text-sm">
            ${[
              {d:'Day 0',t:'You book survey',s:'We call in 2h, fix slot'},
              {d:'Day 1',t:'Survey & design',s:'Report + rent guarantee'},
              {d:'Day 2-3',t:'Install & test',s:'Earthing, meter, app live'},
              {d:'Day 4',t:'You save',s:'Bill drops from next cycle'},
            ].map(x=>`<div class="text-center"><div class="badge badge-pink mx-auto">${x.d}</div><div class="font-bold mt-2">${x.t}</div><div class="text-xs text-zinc-500">${x.s}</div></div>`).join('')}
          </div>
        </div>
      </section>
    </div>`;
    attachReveal();
  }

  function renderAbout(){
    $view.innerHTML = `
    <div class="page-enter">
      <section class="wrap section">
        <div class="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <span class="badge badge-pink">About SolarSaathi</span>
            <h1 class="text-3xl md:text-4xl font-black mt-2 leading-tight">Green energy <span class="gradient-text">without the price tag</span></h1>
            <p class="text-zinc-500 mt-3 leading-relaxed">We started SolarSaathi because buying solar felt like buying a car for the sunlight. Why own panels when you just need cheap power? We own the asset, you rent the savings.</p>
            <div class="grid grid-cols-3 gap-3 mt-6">
              <div class="nova-card p-4 text-center"><div class="font-black text-xl">2.4 MW</div><div class="text-xs text-zinc-500">Installed</div></div>
              <div class="nova-card p-4 text-center"><div class="font-black text-xl">1,200+</div><div class="text-xs text-zinc-500">Homes</div></div>
              <div class="nova-card p-4 text-center"><div class="font-black text-xl">1.8kt</div><div class="text-xs text-zinc-500">CO₂ saved</div></div>
            </div>
          </div>
          <div class="nova-card p-0 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1472145246861-b24cf25c4a36?w=800&q=80&auto=format&fit=crop" class="w-full h-72 object-cover" alt="solar mission"/>
            <div class="p-4">
              <p class="text-sm font-bold">MNRE Approved • Make in India • Tier-1 panels</p>
              <p class="text-xs text-zinc-500 mt-1">We use only ALMM listed 550W mono PERC, BIS inverters, HDGI structure & proper LA/earthing.</p>
            </div>
          </div>
        </div>
        <div class="grid md:grid-cols-3 gap-4 mt-8">
          <div class="nova-card p-5"><div class="w-10 h-10 rounded-xl bg-green-600 text-white grid place-items-center">♻️</div><h4 class="font-bold mt-3">Mission</h4><p class="text-sm text-zinc-500 mt-1">Make solar a monthly subscription — like DTH — affordable for every Indian home.</p></div>
          <div class="nova-card p-5"><div class="w-10 h-10 rounded-xl bg-emerald-500 text-white grid place-items-center">◎</div><h4 class="font-bold mt-3">Vision</h4><p class="text-sm text-zinc-500 mt-1">10,000 rented roofs by 2028, 15 MW green power.</p></div>
          <div class="nova-card p-5"><div class="w-10 h-10 rounded-xl bg-blue-500 text-white grid place-items-center">◈</div><h4 class="font-bold mt-3">Why rent?</h4><p class="text-sm text-zinc-500 mt-1">Zero lock-in stress, maintenance & insurance on us, transfer when you move.</p></div>
        </div>
        <div class="nova-card p-6 mt-6">
          <h3 class="font-bold">Our promise vs market</h3>
          <div class="overflow-x-auto mt-3">
            <table class="compare-table">
              <thead><tr><th></th><th class="text-green-700">SolarSaathi</th><th>Typical vendor</th></tr></thead>
              <tbody>
                <tr><td>Upfront</td><td class="font-bold text-emerald-600">₹0</td><td>₹2–4L</td></tr>
                <tr><td>Warranty handling</td><td>We do</td><td>You chase</td></tr>
                <tr><td>Cleaning</td><td>Free quarterly</td><td>₹800/visit</td></tr>
                <tr><td>Relocation</td><td>We relocate / transfer</td><td>You abandon</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="nova-card p-6 mt-6 text-center bg-gradient-to-br from-green-50 to-white border-green-100">
          <p class="text-sm text-zinc-600">Founded 2023 • Pune • Serving MH, KA, TG, DL, MP • <b>hello@solarsaathi.in</b> • +91 7075224965</p>
        </div>
      </section>
    </div>`;
    attachReveal();
  }

  function renderContact(){
    $view.innerHTML = `
    <div class="page-enter">
      <section class="wrap section">
        <div class="max-w-3xl mx-auto text-center">
          <span class="badge badge-pink">Contact</span>
          <h1 class="text-3xl md:text-4xl font-black mt-2">We’re <span class="gradient-text">here to help</span></h1>
          <p class="text-zinc-500 mt-2">Book a survey, ask a question, or just say hi — we reply within 2 hours.</p>
        </div>
        <div class="grid lg:grid-cols-2 gap-6 mt-8 max-w-5xl mx-auto">
          <div class="nova-card p-6">
            <h3 class="font-bold">Send a message</h3>
            <form id="contactForm" class="mt-4 space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input class="input-field" name="name" placeholder="Full name" required />
                <input class="input-field" name="phone" placeholder="Phone" required pattern="\\d{10}" />
              </div>
              <input class="input-field" name="email" type="email" placeholder="Email (optional)" />
              <select class="input-field" name="topic"><option>Book free survey</option><option>Existing booking</option><option>Partner with us</option><option>Other</option></select>
              <textarea class="input-field" name="msg" rows="4" placeholder="Your message" required></textarea>
              <button class="btn-primary w-full rounded-full" type="submit">Send — we’ll call back</button>
              <p class="text-xs text-zinc-500 text-center">Or WhatsApp +91 7075224965 (9am–9pm)</p>
            </form>
          </div>
          <div class="space-y-4">
            <div class="nova-card p-5">
              <h4 class="font-bold">Offices</h4>
              <div class="grid grid-cols-1 gap-3 mt-3 text-sm">
                ${[
                  {city:'Pune (HO)', addr:'Baner, Pune 411045 • MH', phone:'+91 7075224965'},
                  {city:'Bangalore', addr:'HSR Layout, BLR 560102', phone:'+91 7075224965'},
                  {city:'Hyderabad', addr:'Gachibowli, HYD 500032', phone:'+91 7075224965'},
                  {city:'Delhi NCR', addr:'Gurugram 122001', phone:'+91 7075224965'},
                ].map(o=>`<div class="flex gap-3 p-3 rounded-xl border border-green-50 bg-green-50/50"><div class="w-8 h-8 rounded-lg bg-white border border-green-100 grid place-items-center text-green-700">◉</div><div><div class="font-bold">${o.city}</div><div class="text-xs text-zinc-500">${o.addr}</div><div class="text-xs text-green-700">${o.phone}</div></div></div>`).join('')}
              </div>
            </div>
            <div class="nova-card p-0 overflow-hidden">
              <div class="h-44 bg-gradient-to-br from-green-600 to-emerald-500 grid place-items-center text-white">
                <div class="text-center"><div class="text-3xl">◉ Pune • Bangalore • Hyderabad • Delhi</div><div class="text-sm opacity-80 mt-1">Map placeholder — embed Google Maps on production</div></div>
              </div>
              <div class="p-4 text-xs text-zinc-500 flex flex-wrap gap-2">
                <span class="badge badge-default">Mon–Sat 9am–7pm</span>
                <span class="badge badge-success">Avg reply 1.8h</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>`;
    document.getElementById('contactForm')?.addEventListener('submit', e=>{
      e.preventDefault();
      const fd=new FormData(e.target); const d=Object.fromEntries(fd.entries());
      const id='CT-'+Math.random().toString(36).slice(2,6).toUpperCase();
      toast('Message sent! Ticket '+id+' — we’ll call on '+d.phone, 'success');
      e.target.reset();
    });
    attachReveal();
  }

  function renderFaq(){
    $view.innerHTML = `
    <div class="page-enter">
      <section class="wrap section">
        <div class="max-w-3xl mx-auto text-center">
          <span class="badge badge-pink">FAQ</span>
          <h1 class="text-3xl md:text-4xl font-black mt-2">Got <span class="gradient-text">questions?</span></h1>
          <p class="text-zinc-500 mt-2">Renting solar is new — here are answers we hear daily.</p>
        </div>
        <div class="nova-card p-2 md:p-4 mt-6 max-w-3xl mx-auto">
          ${faqs.map((f,i)=>`
            <div class="border-b last:border-0 border-zinc-100">
              <button data-faq2="${i}" class="w-full flex items-center justify-between py-4 text-left gap-4 group">
                <span class="font-medium group-hover:text-green-700 transition-colors text-sm md:text-[15px]">${esc(f.q)}</span>
                <span class="shrink-0 w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 grid place-items-center group-[.open]:bg-green-600 group-[.open]:text-white group-[.open]:rotate-45 transition-all">+</span>
              </button>
              <div class="faq-ans2 overflow-hidden max-h-0 opacity-0 transition-all duration-300"><p class="text-sm text-zinc-500 pb-4 pr-8">${esc(f.a)}</p></div>
            </div>
          `).join('')}
        </div>
        <div class="max-w-3xl mx-auto nova-card p-4 mt-6 bg-gradient-to-r from-green-600 to-emerald-500 text-white flex flex-wrap items-center justify-between gap-3">
          <span class="text-sm font-medium">Still unsure? Talk to an engineer — free 10-min call.</span>
          <a href="#/contact" class="btn-secondary rounded-full bg-white text-green-700">Contact us</a>
        </div>
      </section>
    </div>`;
    $view.querySelectorAll('[data-faq2]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const wrap=btn.parentElement; const ans=wrap.querySelector('.faq-ans2'); const isOpen=wrap.classList.contains('open');
        $view.querySelectorAll('.open').forEach(o=>{ o.classList.remove('open'); o.querySelector('.faq-ans2').style.maxHeight='0px'; o.querySelector('.faq-ans2').style.opacity='0'; });
        if(!isOpen){ wrap.classList.add('open'); ans.style.maxHeight=ans.scrollHeight+'px'; ans.style.opacity='1'; }
      });
    });
    attachReveal();
  }

  // ——— Router ———
  function router(){
    const hash = location.hash || '#/';
    const path = hash.replace(/^#/, '') || '/';
    // hero visibility — only on home
    const hero = document.querySelector('.hero');
    if(hero){ hero.style.display = (path==='/' || path==='') ? '' : 'none'; }
    // also handle anchor scrolls like #how -> redirect to #/how
    if(['how','faq','contact','about'].includes(path.replace('/','')) && !path.startsWith('/')){
      location.hash = '#/'+path.replace('/','');
      return;
    }
    // nav active
    document.querySelectorAll('[data-nav]').forEach(a=>{
      const isActive = (path==='/' && a.dataset.nav==='home') || path.startsWith('/'+a.dataset.nav);
      a.classList.toggle('active', isActive);
      if(a.classList.contains('nav-link')) a.classList.toggle('bg-white', isActive);
    });
    if(path.startsWith('/shop')) return renderShop();
    if(path.startsWith('/calculator')) return renderCalculator();
    if(path.startsWith('/bookings')) return renderBookings();
    if(path.startsWith('/admin')) return renderAdmin();
    if(path.startsWith('/how')) return renderHow();
    if(path.startsWith('/about')) return renderAbout();
    if(path.startsWith('/contact')) return renderContact();
    if(path.startsWith('/faq')) return renderFaq();
    if(path==='/') return renderHome();
    // fallback home for unknown
    return renderHome();
  }

  window.addEventListener('hashchange', router);
  window.addEventListener('DOMContentLoaded', router);
  // initial
  if(document.readyState !== 'loading') router(); else document.addEventListener('DOMContentLoaded', router);

  // expose for footer etc
  window.closeModal = closeModal;
})();
