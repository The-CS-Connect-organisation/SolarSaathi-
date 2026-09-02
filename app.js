/* Project S.E.V.A. v3 — Solar Energy for Vendor Access • Login • Plans • District Pricing • Dashboard • Admin */
(() => {
  // ——— PREMIUM: Loading Screen & Dot Matrix Beacon ———
  (function initLoading(){
    const canvas = document.getElementById('beaconCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const SIZE = 240, DOT_SIZE = 5, GRID = 9, GAP = SIZE / GRID;
    const CENTER = GRID / 2 - 0.5;
    let frame = 0;

    function drawBeacon(){
      ctx.clearRect(0, 0, SIZE, SIZE);
      frame++;
      const t = frame / 60;
      const beamAngle = t * Math.PI * 2;

      for(let r = 0; r < GRID; r++){
        for(let c = 0; c < GRID; c++){
          const cx = c * GAP + GAP / 2;
          const cy = r * GAP + GAP / 2;
          const dx = c - CENTER, dy = r - CENTER;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if(dist > CENTER + 0.5) continue;
          const angle = Math.atan2(dy, dx);
          const beam = Math.max(0, 1 - Math.abs(Math.cos(angle - beamAngle)) * 0.3);
          const ringFade = 1 - dist / (CENTER + 1);
          const pulse = 0.3 + 0.7 * Math.sin(t * 2 + dist * 0.8);
          const alpha = Math.min(1, beam * ringFade * pulse * 0.9 + 0.08);
          const size = DOT_SIZE * (0.5 + alpha * 0.5);
          ctx.beginPath();
          ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(22, 163, 74, ${alpha})`;
          ctx.fill();
        }
      }
      requestAnimationFrame(drawBeacon);
    }
    drawBeacon();

    // Auto-hide after 2.2s
    setTimeout(()=>{
      const ls = document.getElementById('loadingScreen');
      if(ls){
        ls.classList.add('fade-out');
        setTimeout(()=>ls.remove(), 700);
      }
      // Trigger Prisma hero animations after loading
      setTimeout(initPrismaHero, 100);
    }, 2200);

  })();

  // ——— PRISMA HERO: Word-by-word pull-up + Dot pattern ———
  function initPrismaHero(){
    // Word pull-up for title
    const title = document.getElementById('prismaTitle');
    if(title && !title.dataset.init){
      title.dataset.init = '1';
      const lines = ['S.E.V.A.', ''];
      let delay = 0;
      title.innerHTML = lines.map((word, li) => {
        const chars = word.split('').map((ch, ci) => {
          const d = delay++;
          return `<span class="word-pull-up" style="transition-delay:${d * 0.07}s;">${ch}</span>`;
        }).join('');
        // Add asterisk after last char of second line
        const suffix = li === lines.length - 1 ? '<span class="asterisk">*</span>' : '';
        return `<span class="hero-line">${chars}${suffix}</span>`;
      }).join('');
      // Trigger
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
          title.querySelectorAll('.word-pull-up').forEach(w => w.classList.add('visible'));
        });
      });
      // Show side text + CTA
      setTimeout(()=>{
        const desc = document.getElementById('prismaDesc');
        const cta = document.getElementById('prismaCta');
        if(desc){ desc.style.opacity = '1'; desc.style.transform = 'translateY(0)'; }
        if(cta){ cta.style.opacity = '1'; cta.style.transform = 'translateY(0)'; }
      }, 400);
    }

    // SVG Dot Pattern for hero
    const heroDot = document.getElementById('heroDotPattern');
    if(heroDot && !heroDot.dataset.init){
      heroDot.dataset.init = '1';
      heroDot.innerHTML = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="heroDot" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="rgba(225,224,204,0.15)"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#heroDot)"/>
      </svg>`;
    }

    // SVG Dot Pattern for quote
    const quoteDot = document.getElementById('quoteDotPattern');
    if(quoteDot && !quoteDot.dataset.init){
      quoteDot.dataset.init = '1';
      quoteDot.innerHTML = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="quoteDot" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="rgba(22,163,74,0.3)"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#quoteDot)"/>
      </svg>`;
    }

    // Quote section stagger reveal
    const quoteSection = document.querySelector('.quote-section');
    if(quoteSection){
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.querySelectorAll('.quote-label, .quote-heading, .prisma-cta').forEach((el, i) => {
              el.classList.add('quote-stagger');
              el.style.transitionDelay = (i * 0.15) + 's';
              requestAnimationFrame(()=>{
                requestAnimationFrame(()=>{ el.classList.add('visible'); });
              });
            });
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      observer.observe(quoteSection);
    }
  }

  // ——— PREMIUM: Scroll Progress Bar ———
  (function initScrollProgress(){
    const bar = document.getElementById('scrollProgress');
    if(!bar) return;
    function update(){
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      bar.style.transform = `scaleX(${progress})`;
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  })();

  // ——— PREMIUM: Magnetic hover on cards ———
  function initMagneticCards(){
    document.querySelectorAll('.magnetic-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / centerY * -3;
        const rotateY = (x - centerX) / centerX * 3;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
      });
    });
  }

  // ——— PREMIUM: Staggered reveal on scroll ———
  function initStaggerReveal(){
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.stagger-in').forEach(el => observer.observe(el));
  }

  // ——— PREMIUM: Count-up numbers ———
  function animateCountUp(){
    document.querySelectorAll('.count-up').forEach(el => {
      const target = parseInt(el.getAttribute('data-target'), 10);
      const prefix = el.getAttribute('data-prefix') || '';
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 1500;
      const start = performance.now();
      function update(now){
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);
        el.textContent = prefix + current.toLocaleString('en-IN') + suffix;
        if(progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    });
  }

  // ——— PREMIUM: Smooth page transition ———
  let isFirstLoad = true;
  function pageTransition(callback){
    if(isFirstLoad){ isFirstLoad = false; callback(); initStaggerReveal(); initMagneticCards(); return; }
    $view.classList.add('transitioning');
    setTimeout(()=>{
      callback();
      requestAnimationFrame(()=>{
        $view.classList.remove('transitioning');
        initStaggerReveal();
        initMagneticCards();
        animateCountUp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }, 300);
  }

  const $view = document.getElementById('view');
  const $modalRoot = document.getElementById('modal-root');
  const $toastRoot = document.getElementById('toast-root');
  const $menuBtn = document.getElementById('menuBtn');
  const $menuClose = document.getElementById('menuClose');
  const $overlay = document.getElementById('mobileOverlay');
  const $drawer = document.getElementById('mobileDrawer');

  // ——— Mobile nav ———
  function openMenu(){ $overlay.classList.add('open'); $drawer.classList.add('open'); document.body.style.overflow='hidden'; }
  function closeMenu(){ $overlay.classList.remove('open'); $drawer.classList.remove('open'); document.body.style.overflow=''; }
  $menuBtn?.addEventListener('click', openMenu);
  $menuClose?.addEventListener('click', closeMenu);
  $overlay?.addEventListener('click', closeMenu);
  document.querySelectorAll('.mobile-link').forEach(a=>a.addEventListener('click', closeMenu));

  // ——— Helpers ———
  const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');
  const esc = s => String(s||'').replace(/[&<>\"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;' }[c]));
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
  function timeAgo(iso){
    if(!iso) return '';
    const d=new Date(iso); const diff=(Date.now()-d.getTime())/1000;
    if(diff<60) return 'just now'; if(diff<3600) return Math.floor(diff/60)+'m ago';
    if(diff<86400) return Math.floor(diff/3600)+'h ago'; return d.toLocaleDateString('en-IN');
  }

  // ——— Auth System ———
  const AUTH_KEY = 'solarSaathi.auth.v3';
  function getUsers(){ try{ return JSON.parse(localStorage.getItem('solarSaathi.users.v3')) || []; }catch(e){ return []; } }
  function saveUsers(u){ localStorage.setItem('solarSaathi.users.v3', JSON.stringify(u)); }
  function getSession(){ try{ return JSON.parse(localStorage.getItem(AUTH_KEY)); }catch(e){ return null; } }
  function saveSession(s){ localStorage.setItem(AUTH_KEY, JSON.stringify(s)); }
  function logout(){ localStorage.removeItem(AUTH_KEY); location.hash='#/'; location.reload(); }
  function currentUser(){ return getSession(); }
  function isAdmin(){ const u=currentUser(); return u && u.role==='admin'; }
  function isLoggedIn(){ return !!currentUser(); }

  // seed default admin
  (function seedAdmin(){
    const users = getUsers();
    if(!users.find(u=>u.email==='admin@solarsaathi.in')){
      users.push({ id:'USR-admin', name:'Admin', email:'admin@solarsaathi.in', phone:'7075224965', password:'admin123', role:'admin', created:'2026-01-01' });
      saveUsers(users);
    }
  })();

  // ——— District Grid Pricing ———
  const DISTRICTS = [
    { name:'Pune', state:'Maharashtra', gridRate:90 },
    { name:'Mumbai', state:'Maharashtra', gridRate:100 },
    { name:'Nagpur', state:'Maharashtra', gridRate:85 },
    { name:'Nashik', state:'Maharashtra', gridRate:88 },
    { name:'Bangalore', state:'Karnataka', gridRate:95 },
    { name:'Mysore', state:'Karnataka', gridRate:80 },
    { name:'Hyderabad', state:'Telangana', gridRate:78 },
    { name:'Warangal', state:'Telangana', gridRate:72 },
    { name:'Delhi NCR', state:'Delhi', gridRate:110 },
    { name:'Gurugram', state:'Haryana', gridRate:100 },
    { name:'Indore', state:'Madhya Pradesh', gridRate:75 },
    { name:'Bhopal', state:'Madhya Pradesh', gridRate:80 },
    { name:'Jaipur', state:'Rajasthan', gridRate:70 },
    { name:'Ahmedabad', state:'Gujarat', gridRate:72 },
    { name:'Chennai', state:'Tamil Nadu', gridRate:82 },
    { name:'Kolkata', state:'West Bengal', gridRate:88 },
    { name:'Lucknow', state:'Uttar Pradesh', gridRate:85 },
    { name:'Patna', state:'Bihar', gridRate:75 },
    { name:'Chandigarh', state:'Punjab', gridRate:80 },
    { name:'Ranchi', state:'Jharkhand', gridRate:72 },
  ];
  const SOLAR_DISCOUNT = 0.65; // 65% of grid pricing

  // ——— 3 Plans ———
  const PLANS = [
    {
      id:'micro', name:'Micro', tagline:'For Street Vendors & Rural Households',
      icon:'🛒', color:'bg-amber-500',
      desc:'Built for India\'s 75 lakh+ registered street vendors. Power your tea stall, food cart, pani puri stand or small shop. Zero upfront cost, pay a micro daily fee via UPI.',
      capacityRange:'0.5 kW – 2 kW',
      features:['Powers 2-4 lights + fans + small fridge','Zero downtime for your business','Quick 24h install at your stall','Pay ₹45-50/day via UPI — 35% less than diesel','Free cleaning & maintenance monthly','We own the asset, you own the savings'],
      img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=640&q=80&auto=format&fit=crop',
    },
    {
      id:'residential', name:'Residential', tagline:'For Rural Homes & Tier-2 Towns',
      icon:'🏠', color:'bg-green-600',
      desc:'For rural households and tier-2 cities where the grid is unreliable. Hours of daily power cuts overlap with peak hours — S.E.V.A. gives you uninterrupted power at 65% of grid cost.',
      capacityRange:'2 kW – 8 kW',
      features:['Powers entire home — lights, fan, TV, fridge','Zero upfront — we install, you pay daily','UPI micro-payments, no paperwork burden','We handle DISCOM, net-metering & subsidy','Quarterly cleaning & 24×7 monitoring','25-year panel warranty, full maintenance'],
      img:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=640&q=80&auto=format&fit=crop',
    },
    {
      id:'industrial', name:'Industrial', tagline:'For Markets, Cold Storage & Warehouses',
      icon:'🏭', color:'bg-blue-600',
      desc:'Heavy-duty solar for market complexes, cold storage, warehouses and large commercial setups. 3-phase inverter, dedicated relationship manager, SCADA-ready monitoring.',
      capacityRange:'10 kW – 100 kW',
      features:['3-phase industrial inverter, LT/HT compatible','Dedicated account manager & SLA','Subsidy, CEIG & all paperwork handled','Monthly generation & savings report','Priority service with 24h response','SCADA-ready real-time monitoring'],
      img:'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=640&q=80&auto=format&fit=crop',
    }
  ];

  // ——— Data Store ———
  const STORE_KEY = 'solarSaathi.v3';
  function loadStore(){
    try{ const raw=localStorage.getItem(STORE_KEY); if(raw){ const j=JSON.parse(raw); if(j.bookings) return j; } }catch(e){}
    return { bookings: [], requests: [], notifications: [], payments: [] };
  }
  let store = loadStore();
  if(!store.notifications) store.notifications = [];
  if(!store.payments) store.payments = [];
  function saveStore(){ localStorage.setItem(STORE_KEY, JSON.stringify(store)); }

  // ——— Notification helpers ———
  function addNotification(type, title, message, bookingId){
    store.notifications.unshift({
      id: 'NTF-'+Math.random().toString(36).slice(2,7).toUpperCase(),
      type, title, message, bookingId,
      read: false, created: new Date().toISOString()
    });
    saveStore();
  }
  function unreadCount(){ return store.notifications.filter(n=>!n.read).length; }
  function markAllRead(){ store.notifications.forEach(n=>n.read=true); saveStore(); }

  // ——— Resource allotment helpers ———
  const EQUIPMENT = {
    micro: { panels: '1-4 × 450W Monocrystalline', inverter: '1kW Grid-tie Inverter', mounting: 'Rooftop aluminium rails', wiring: 'DC/AC cables + MC4 connectors', misc: 'Earthing kit, surge protector' },
    residential: { panels: '4-16 × 450W Monocrystalline', inverter: '3-8kW Hybrid Inverter', mounting: 'Rooftop aluminium rails', wiring: 'DC/AC cables + MC4 connectors', meter: 'Net meter (bi-directional)', misc: 'Earthing kit, surge protector, DC isolator' },
    industrial: { panels: '20-200 × 550W Monocrystalline', inverter: '10-100kW String Inverter', mounting: 'Heavy-duty ground/roof mount', wiring: 'HT/LT cables, combiner box', meter: 'CT-meter for 3-phase', misc: 'Earthing kit, lightning arrestor, SCADA-ready' }
  };
  function allotResources(bookingId, data){
    const bk = store.bookings.find(b=>b.id===bookingId);
    if(!bk) return;
    bk.resources = {
      panels: data.panels || '',
      inverter: data.inverter || '',
      mounting: data.mounting || '',
      wiring: data.wiring || '',
      misc: data.misc || '',
      techName: data.techName || '',
      techPhone: data.techPhone || '',
      installDate: data.installDate || '',
      allotDate: new Date().toISOString()
    };
    bk.status = 'Resources allotted';
    saveStore();
    addNotification('allotted', 'Resources Allotted', `${bk.planName} for ${bk.name} — ${bk.district}. Install scheduled: ${data.installDate || 'TBD'}`, bookingId);
  }
  function markInstalled(bookingId){
    const bk = store.bookings.find(b=>b.id===bookingId);
    if(!bk) return;
    bk.status = 'Installed';
    bk.installedDate = new Date().toISOString();
    saveStore();
    addNotification('installed', 'Installation Complete', `${bk.planName} for ${bk.name} — ${bk.district} is now live!`, bookingId);
  }
  // ——— Simulated usage data for live bookings ———
  function generateUsageData(booking){
    if(!booking || booking.status !== 'Live') return null;
    const daysLive = booking.installedDate ? Math.floor((Date.now() - new Date(booking.installedDate).getTime()) / 86400000) : 30;
    const dailyAvg = Math.round(booking.units / 30);
    const monthUsed = Math.min(booking.units, dailyAvg * 30 + Math.floor(Math.random() * 20 - 10));
    const gridRate = (DISTRICTS.find(d=>d.name===booking.district)||DISTRICTS[0]).gridRate;
    const gridBill = Math.round(monthUsed * gridRate);
    const ourBill = booking.monthlyAmount;
    const saved = gridBill - ourBill;
    return { monthUsed, gridBill, ourBill, saved, daysLive, dailyAvg, efficiency: Math.round(85 + Math.random()*10) };
  }

  // ——— FAQ data ———
  const faqs = [
    { q:'What is Project S.E.V.A.?', a:'S.E.V.A. stands for Solar Energy for Vendor Access. It\'s a pioneering pay-as-you-go solar model designed specifically for India\'s informal street economy. We install compact solar + battery systems at zero upfront cost, and you pay a micro daily fee via UPI — just 65% of what you\'d spend on diesel or the unreliable grid.' },
    { q:'Why not just buy solar panels?', a:'A standard solar kit costs ₹18,000–₹20,000 upfront. Street vendors lack collateral, are often unregistered, and can\'t access formal credit. S.E.V.A. removes this barrier entirely — we own the asset, handle all maintenance, and you pay only for the power you consume.' },
    { q:'How much do I actually save?', a:'Vendors typically spend ₹90–₹120/day on diesel generators or informal grid taps. S.E.V.A. charges just ₹45–₹50/day — that\'s an immediate saving of up to ₹2,100/month or ₹20,520/year. The economics sell themselves.' },
    { q:'How does the daily UPI payment work?', a:'Every day, a micro-fee (₹45–₹50) is charged via UPI for the power you consume. No cash collection, no manual billing. India\'s deep UPI penetration makes this frictionless — zero behavior change required from you.' },
    { q:'What if the grid is already available?', a:'Connection doesn\'t equal reliability. Rural areas and tier-2 cities experience hours of daily power cuts — especially during peak evening business hours. S.E.V.A. replaces both diesel and unreliable grid with consistent, clean power.' },
    { q:'Who handles maintenance and repairs?', a:'We do — everything. Quarterly cleaning, inverter checks, wiring, earthing, plus 24×7 remote monitoring. If generation dips, our local maintenance agents are auto-dispatched. You never lift a finger.' },
    { q:'Can I cancel or relocate?', a:'12-month lock-in at the fixed rate. After that, cancel anytime with 30 days notice. If you shift location, we relocate the system for a small fee or transfer the plan to the new tenant.' },
    { q:'Is this available in my area?', a:'S.E.V.A. is initially launching in Maharashtra, Karnataka, Telangana, Delhi NCR, Madhya Pradesh, Rajasthan, Gujarat, Tamil Nadu, West Bengal, UP, Bihar, Punjab and Jharkhand. We cover 20+ districts across India and expanding rapidly.' },
  ];

  // ——— Attach reveal observer ———
  function attachReveal(){
    const obs=new IntersectionObserver(entries=> entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target);} }),{threshold:0.12});
    document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
  }

  // ===================== AUTH PAGES =====================

  function renderLogin(){
    $view.innerHTML = `
    <div class="page-enter">
      <section class="wrap section" style="min-height:70vh;display:flex;align-items:center;">
        <div class="max-w-md mx-auto w-full">
          <div class="text-center mb-8">
            <span class="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 text-white grid place-items-center mx-auto text-3xl shadow-lg shadow-green-600/20">☀️</span>
            <h1 class="text-3xl font-black mt-4">Welcome back</h1>
            <p class="text-zinc-500 mt-1 text-sm">Login to manage your S.E.V.A. solar plan</p>
          </div>
          <div class="nova-card p-6 md:p-8">
            <form id="loginForm" class="space-y-4">
              <div>
                <label class="text-sm font-semibold">Email</label>
                <input id="loginEmail" class="input-field mt-1" type="email" placeholder="you@example.com" required />
              </div>
              <div>
                <label class="text-sm font-semibold">Password</label>
                <input id="loginPass" class="input-field mt-1" type="password" placeholder="••••••" required />
              </div>
              <button class="btn-primary btn-ripple w-full rounded-full" type="submit">Login →</button>
              <div class="text-center text-sm text-zinc-500">
                Don't have an account? <a href="#/register" class="text-green-700 font-semibold hover:underline">Register</a>
              </div>
            </form>
            <div class="mt-4 p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs text-zinc-500">
              <b>Demo admin:</b> admin@solarsaathi.in / admin123
              <b>Register</b> as a user to see the customer dashboard.
            </div>
          </div>
        </div>
      </section>
    </div>`;
    document.getElementById('loginForm').addEventListener('submit', e=>{
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const pass = document.getElementById('loginPass').value;
      const users = getUsers();
      const user = users.find(u=> u.email.toLowerCase()===email && u.password===pass);
      if(!user){ toast('Invalid email or password','error'); return; }
      saveSession({ id:user.id, name:user.name, email:user.email, phone:user.phone, role:user.role });
      toast('Welcome back, '+user.name+'!','success');
      location.hash = user.role==='admin' ? '#/admin' : '#/dashboard';
      location.reload();
    });
    attachReveal();
  }

  function renderRegister(){
    $view.innerHTML = `
    <div class="page-enter">
      <section class="wrap section" style="min-height:70vh;display:flex;align-items:center;">
        <div class="max-w-md mx-auto w-full">
          <div class="text-center mb-8">
            <span class="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 text-white grid place-items-center mx-auto text-3xl shadow-lg shadow-green-600/20">☀️</span>
            <h1 class="text-3xl font-black mt-4">Create account</h1>
            <p class="text-zinc-500 mt-1 text-sm">Join vendors & households saving with S.E.V.A.</p>
          </div>
          <div class="nova-card p-6 md:p-8">
            <form id="regForm" class="space-y-4">
              <div>
                <label class="text-sm font-semibold">Full name</label>
                <input id="regName" class="input-field mt-1" placeholder="Rahul Sharma" required />
              </div>
              <div>
                <label class="text-sm font-semibold">Email</label>
                <input id="regEmail" class="input-field mt-1" type="email" placeholder="you@example.com" required />
              </div>
              <div>
                <label class="text-sm font-semibold">Phone</label>
                <input id="regPhone" class="input-field mt-1" type="tel" placeholder="9876543210" pattern="\\d{10}" required />
              </div>
              <div>
                <label class="text-sm font-semibold">Password</label>
                <input id="regPass" class="input-field mt-1" type="password" placeholder="Min 6 characters" required minlength="6" />
              </div>
              <div>
                <label class="text-sm font-semibold">Your district</label>
                <select id="regDistrict" class="input-field mt-1" required>
                  <option value="">Select your district</option>
                  ${DISTRICTS.map(d=>`<option value="${d.name}">${d.name}, ${d.state}</option>`).join('')}
                </select>
              </div>
              <button class="btn-primary btn-ripple w-full rounded-full" type="submit">Register →</button>
              <div class="text-center text-sm text-zinc-500">
                Already have an account? <a href="#/login" class="text-green-700 font-semibold hover:underline">Login</a>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>`;
    document.getElementById('regForm').addEventListener('submit', e=>{
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const phone = document.getElementById('regPhone').value.trim();
      const pass = document.getElementById('regPass').value;
      const district = document.getElementById('regDistrict').value;
      const users = getUsers();
      if(users.find(u=>u.email.toLowerCase()===email)){ toast('Email already registered','error'); return; }
      const user = { id:'USR-'+Math.random().toString(36).slice(2,7), name, email, phone, password:pass, role:'user', district, created:new Date().toISOString().slice(0,10) };
      users.push(user);
      saveUsers(users);
      saveSession({ id:user.id, name:user.name, email:user.email, phone:user.phone, role:user.role, district:user.district });
      toast('Account created! Welcome, '+name,'success');
      location.hash='#/dashboard';
      location.reload();
    });
    attachReveal();
  }

  // ===================== PLANS PAGE =====================

  function renderPlans(){
    $view.innerHTML = `
    <div class="page-enter">
      <section class="wrap section">
        <div class="text-center max-w-2xl mx-auto">
          <span class="badge badge-pink">3 Plans for Everyone</span>
          <h1 class="text-3xl md:text-4xl font-black mt-2">Pick your <span class="gradient-text">S.E.V.A. plan</span></h1>
          <p class="text-zinc-500 mt-2">From street vendors to market complexes — zero upfront, pay daily via UPI at <b>65% of diesel/grid rate</b>.</p>
        </div>
        <div class="grid md:grid-cols-3 gap-6 mt-8 max-w-5xl mx-auto">
          ${PLANS.map((p,i)=>`
            <div class="nova-card p-0 overflow-hidden card-hover magnetic-card stagger-in" style="transition-delay:${i*0.12}s">
              <div class="relative">
                <img src="${p.img}" alt="${esc(p.name)}" class="w-full h-48 object-cover" loading="lazy"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div class="absolute bottom-4 left-4 right-4">
                  <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
                    <span>${p.icon}</span> ${esc(p.tagline)}
                  </span>
                </div>
              </div>
              <div class="p-5">
                <h3 class="font-black text-xl flex items-center gap-2">
                  <span class="w-10 h-10 rounded-xl ${p.color} text-white grid place-items-center text-lg">${p.icon}</span>
                  ${esc(p.name)}
                </h3>
                <p class="text-sm text-zinc-500 mt-2 leading-relaxed">${esc(p.desc)}</p>
                <div class="mt-3 badge badge-default">Capacity: ${esc(p.capacityRange)}</div>
                <ul class="mt-4 space-y-1.5 text-sm text-zinc-600">
                  ${p.features.map(f=>`<li class="flex gap-2"><span class="text-emerald-500">✔</span>${esc(f)}</li>`).join('')}
                </ul>
                <button class="btn-primary btn-ripple w-full rounded-full mt-5 choose-plan" data-plan="${p.id}">
                  ${isLoggedIn() ? 'Choose this plan →' : 'Login to book →'}
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Pricing section -->
        <div class="nova-card p-6 md:p-8 mt-10 max-w-5xl mx-auto">
          <div class="text-center mb-6">
            <span class="badge badge-pink">Transparent Pricing</span>
            <h2 class="text-2xl font-black mt-2">How we charge — <span class="gradient-text">65% of diesel/grid rate</span></h2>
            <p class="text-zinc-500 text-sm mt-1">Vendors spend ₹90-120/day on diesel. S.E.V.A. charges ₹45-50/day. See your savings.</p>
          </div>
          <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="text-sm font-semibold">Select your district</label>
                <select id="priceDistrict" class="input-field mt-1">
                  <option value="">Choose district...</option>
                  ${DISTRICTS.map(d=>`<option value="${d.name}">${d.name}, ${d.state} — ₹${d.gridRate}/unit grid rate</option>`).join('')}
                </select>
              </div>
              <div id="priceDistrictInfo" class="hidden">
                <div>
                  <label class="text-sm font-semibold">Monthly units consumed</label>
                  <input id="priceUnits" type="range" min="50" max="2000" step="10" value="300" class="calc-range mt-2"/>
                  <div class="flex justify-between text-xs text-zinc-500"><span>50 units</span><span id="priceUnitsLabel">300 units</span><span>2000 units</span></div>
                </div>
                <div>
                  <label class="text-sm font-semibold">Choose plan type</label>
                  <select id="pricePlanType" class="input-field mt-1">
                    ${PLANS.map(p=>`<option value="${p.id}">${p.icon} ${p.name} — ${p.capacityRange}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
            <div id="priceOutput" class="flex items-center justify-center text-zinc-400 text-sm">
              Select a district to see pricing comparison
            </div>
          </div>
        </div>

        <!-- Trust badges -->
        <div class="mt-8 max-w-5xl mx-auto flex flex-wrap gap-3 justify-center">
          <span class="badge badge-success">Zero upfront cost</span>
          <span class="badge badge-pink">65% of grid rate guaranteed</span>
          <span class="badge badge-warning">Free installation & maintenance</span>
          <span class="badge badge-default">Cancel after 12 months</span>
        </div>
      </section>
    </div>`;

    // pricing calculator wiring
    const distSel = document.getElementById('priceDistrict');
    const unitRange = document.getElementById('priceUnits');
    const unitLabel = document.getElementById('priceUnitsLabel');
    const planType = document.getElementById('pricePlanType');
    const distInfo = document.getElementById('priceDistrictInfo');
    const output = document.getElementById('priceOutput');

    function updatePricing(){
      const dName = distSel.value;
      if(!dName){
        distInfo.classList.add('hidden');
        output.innerHTML = 'Select a district to see pricing comparison';
        output.classList.add('flex','items-center','justify-center','text-zinc-400','text-sm');
        return;
      }
      distInfo.classList.remove('hidden');
      const district = DISTRICTS.find(d=>d.name===dName);
      const units = parseInt(unitRange.value,10);
      unitLabel.textContent = units + ' units';
      const gridRate = district.gridRate;
      const ourRate = Math.round(gridRate * SOLAR_DISCOUNT * 100) / 100;
      const gridBill = Math.round(units * gridRate);
      const ourBill = Math.round(units * ourRate);
      const savings = gridBill - ourBill;
      const yearlySavings = savings * 12;
      const plan = PLANS.find(p=>p.id===planType.value);

      output.className = '';
      output.innerHTML = `
        <div class="w-full space-y-3">
          <div class="text-center">
            <div class="text-xs text-zinc-500 uppercase tracking-wider">${esc(district.name)}, ${esc(district.state)}</div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-red-50 border border-red-100 p-4 text-center">
              <div class="text-xs text-red-600 font-semibold uppercase">Grid Rate</div>
              <div class="font-black text-2xl text-red-700 mt-1">₹${gridRate}</div>
              <div class="text-xs text-red-500">per unit</div>
              <div class="font-bold text-red-600 mt-2">₹${fmt(gridBill)}/mo</div>
            </div>
            <div class="rounded-xl bg-emerald-50 border-2 border-emerald-200 p-4 text-center">
              <div class="text-xs text-emerald-600 font-semibold uppercase">Our Rate (65%)</div>
              <div class="font-black text-2xl text-emerald-700 mt-1">₹${ourRate}</div>
              <div class="text-xs text-emerald-500">per unit</div>
              <div class="font-bold text-emerald-700 mt-2">₹${fmt(ourBill)}/mo</div>
            </div>
          </div>
          <div class="rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 p-4 text-white text-center">
            <div class="text-sm opacity-80">You save</div>
            <div class="font-black text-3xl">${fmt(savings)}/mo</div>
            <div class="text-sm opacity-80">${fmt(yearlySavings)}/year</div>
          </div>
          <div class="text-center text-xs text-zinc-500">
            Plan: <b>${esc(plan.name)}</b> (${esc(plan.capacityRange)}) • ${esc(units)} units × ₹${ourRate} = ₹${fmt(ourBill)}/mo
          </div>                <button class="btn-primary btn-ripple w-full rounded-full book-now-btn" data-plan="${planType.value}" data-district="${dName}" data-units="${units}">
            ${isLoggedIn() ? 'Start S.E.V.A. now →' : 'Login to book →'}
          </button>
        </div>
      `;
      output.querySelectorAll('.book-now-btn').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(!isLoggedIn()){ location.hash='#/login'; return; }
          openBookingModal(plan, district, units);
        });
      });
    }

    distSel.addEventListener('change', updatePricing);
    unitRange.addEventListener('input', updatePricing);
    planType.addEventListener('change', updatePricing);

    // plan buttons
    $view.querySelectorAll('.choose-plan').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(!isLoggedIn()){ location.hash='#/login'; return; }
        const planId = btn.getAttribute('data-plan');
        const plan = PLANS.find(p=>p.id===planId);
        // scroll to pricing
        document.getElementById('priceDistrict').scrollIntoView({behavior:'smooth',block:'center'});
        toast('Select your district below to see pricing');
      });
    });
    attachReveal();
  }

  function openBookingModal(plan, district, units){
    const gridRate = district.gridRate;
    const ourRate = Math.round(gridRate * SOLAR_DISCOUNT * 100) / 100;
    const ourBill = Math.round(units * ourRate);
    const user = currentUser();
    openModal(`
      <div class="flex items-center gap-3 mb-4">
        <span class="w-12 h-12 rounded-xl ${plan.color} text-white grid place-items-center text-xl">${plan.icon}</span>
        <div>
          <h3 class="font-black text-lg">${esc(plan.name)} Plan</h3>
          <p class="text-xs text-zinc-500">${esc(district.name)} • ${units} units/mo • ₹${ourRate}/unit</p>
        </div>
      </div>
      <form id="bookForm" class="space-y-3">
        <input type="hidden" name="planId" value="${plan.id}" />
        <input type="hidden" name="district" value="${district.name}" />
        <input type="hidden" name="units" value="${units}" />
        <input type="hidden" name="rate" value="${ourRate}" />
        <input type="hidden" name="amount" value="${ourBill}" />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input class="input-field" name="name" placeholder="Full name" value="${esc(user.name)}" required />
          <input class="input-field" name="phone" placeholder="Phone" value="${esc(user.phone)}" required />
        </div>
        <input class="input-field" name="address" placeholder="Full address with landmark" required />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input class="input-field" name="pincode" placeholder="Pincode" pattern="\\d{6}" required />
          <input class="input-field" name="date" type="date" required />
        </div>
        <select class="input-field" name="roofType">
          <option value="">Roof type</option>
          <option>Flat RCC</option>
          <option>Tin shed</option>
          <option>Car parking</option>
          <option>Open ground</option>
        </select>
        <textarea class="input-field" name="note" rows="2" placeholder="Any special requirements?"></textarea>
        <div class="nova-card p-3 bg-gradient-to-r from-green-50 to-white border-green-100 text-sm">
          <div class="flex justify-between"><span>Monthly charge</span><b class="text-emerald-600">${fmt(ourBill)}/mo</b></div>
          <div class="flex justify-between text-xs text-zinc-500"><span>Grid would cost</span><span class="line-through">${fmt(Math.round(units*gridRate))}/mo</span></div>
          <div class="flex justify-between text-xs"><span>Your savings</span><b class="text-emerald-600">${fmt(Math.round(units*gridRate - ourBill))}/mo</b></div>
        </div>
        <label class="flex gap-2 items-start text-xs text-zinc-600">
          <input type="checkbox" required class="mt-1"/>
          I agree to site survey and that my charge is ₹${ourBill}/mo (${units} units × ₹${ourRate}/unit). Zero upfront cost. Cancel after 12 months.
        </label>
        <div class="flex gap-3">
          <button class="btn-primary btn-ripple flex-1 rounded-full" type="submit">Confirm booking — ₹0 today</button>
          <button class="btn-secondary rounded-full" type="button" id="cancelBook">Cancel</button>
        </div>
        <p class="text-xs text-center text-zinc-500">No payment today. We verify roof, then schedule install.</p>
      </form>
    `);
    document.getElementById('cancelBook').addEventListener('click', closeModal);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    const dateInput = document.querySelector('#bookForm input[name="date"]');
    if(dateInput){ dateInput.min = tomorrow.toISOString().slice(0,10); dateInput.value = tomorrow.toISOString().slice(0,10); }
    document.getElementById('bookForm').addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const d = Object.fromEntries(fd.entries());
      const booking = {
        id:'BK-'+Math.random().toString(36).slice(2,7).toUpperCase(),
        userId: user.id,
        planId: d.planId,
        planName: PLANS.find(p=>p.id===d.planId)?.name || d.planId,
        district: d.district,
        units: parseInt(d.units),
        rate: parseFloat(d.rate),
        monthlyAmount: parseInt(d.amount),
        name:d.name, phone:d.phone, address:d.address, pincode:d.pincode,
        date:d.date, roofType:d.roofType, note:d.note,
        status:'Pending survey',
        created: new Date().toISOString()
      };
      store.bookings.unshift(booking);
      saveStore();
      addNotification('new_booking', 'New Booking!', `${booking.name} (${booking.phone}) booked ${booking.planName} for ${booking.district} — ${booking.units} units/mo. ₹${booking.monthlyAmount}/mo`, booking.id);
      closeModal();
      toast('Booked! '+booking.planName+' — '+booking.id,'success');
      location.hash = '#/dashboard';
    });
  }

  // ===================== USER DASHBOARD =====================

  function renderDashboard(){
    if(!isLoggedIn()){ location.hash='#/login'; return; }
    const user = currentUser();
    const myBookings = store.bookings.filter(b=>b.userId===user.id);
    const activeBookings = myBookings.filter(b=>!['Cancelled','Rejected','Removed'].includes(b.status));
    const liveBookings = activeBookings.filter(b=>b.status==='Live');
    const district = DISTRICTS.find(d=>d.name===(user.district||'')) || DISTRICTS[0];
    const INSTALL_STEPS = ['Pending survey','Survey scheduled','Resources allotted','Installation scheduled','Installed','Net-meter applied','Live'];

    $view.innerHTML = `
    <div class="page-enter">
      <section class="wrap section">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl font-black">My <span class="gradient-text">Dashboard</span></h1>
            <p class="text-sm text-zinc-500 mt-1">Welcome, <b>${esc(user.name)}</b> \u2022 ${esc(user.email)}</p>
          </div>
          <div class="flex gap-2">
            <a href="#/plans" class="btn-primary btn-ripple rounded-full">+ Book solar</a>
            <button id="logoutBtn" class="btn-ghost">Logout</button>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid md:grid-cols-4 gap-4 mt-6">
          <div class="nova-card nova-card-stat p-5">
            <div class="text-xs tracking-widest text-zinc-500 uppercase">Active plans</div>
            <div class="font-black text-2xl mt-1">${activeBookings.length}</div>
            <div class="text-xs text-green-700">Generating savings</div>
          </div>
          <div class="nova-card nova-card-stat p-5">
            <div class="text-xs tracking-widest text-zinc-500 uppercase">Your district</div>
            <div class="font-black text-lg mt-1">${esc(user.district || 'Not set')}</div>
            <div class="text-xs text-zinc-500">Grid: ₹${district.gridRate}/unit</div>
          </div>
          <div class="nova-card nova-card-stat p-5">
            <div class="text-xs tracking-widest text-zinc-500 uppercase">Your rate</div>
            <div class="font-black text-2xl mt-1 text-emerald-600">₹${Math.round(district.gridRate * SOLAR_DISCOUNT * 100)/100}</div>
            <div class="text-xs text-zinc-500">65% of ₹${district.gridRate}</div>
          </div>
          <div class="nova-card nova-card-stat p-5">
            <div class="text-xs tracking-widest text-zinc-500 uppercase">Monthly savings</div>
            <div class="font-black text-2xl mt-1">${fmt(activeBookings.reduce((a,b)=>a+(Math.round(b.units*district.gridRate)-b.monthlyAmount),0))}</div>
            <div class="text-xs text-emerald-600">${fmt(activeBookings.reduce((a,b)=>a+(Math.round(b.units*district.gridRate)-b.monthlyAmount),0)*12)}/year</div>
          </div>
        </div>

        <!-- Installation Progress Tracker -->
        ${activeBookings.filter(b=>b.status!=='Live').length > 0 ? `
        <div class="mt-6 space-y-4">
          ${activeBookings.filter(b=>b.status!=='Live').map(b=>{
            const currentIdx = INSTALL_STEPS.indexOf(b.status);
            return `
            <div class="nova-card p-5 stagger-in">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <span class="badge badge-pink">${esc(b.planName)}</span>
                  <span class="text-xs text-zinc-500 ml-2">${esc(b.id)} \u2022 ${esc(b.district)}</span>
                </div>
                <span class="badge badge-warning">${esc(b.status)}</span>
              </div>
              <div class="flex items-center gap-1 overflow-x-auto pb-2">
                ${INSTALL_STEPS.map((step, i)=>{
                  const done = i <= currentIdx;
                  const current = i === currentIdx;
                  return `
                    <div class="flex items-center gap-1 shrink-0">
                      <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-400'} ${current ? 'ring-2 ring-emerald-300' : ''}">
                        ${done ? '\u2713' : i+1}
                      </div>
                      <span class="text-[10px] ${done ? 'text-emerald-700 font-semibold' : 'text-zinc-400'} hidden sm:inline">${step}</span>
                      ${i < INSTALL_STEPS.length-1 ? `<div class="w-4 h-0.5 ${done && i < currentIdx ? 'bg-emerald-400' : 'bg-zinc-200'} shrink-0"></div>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
              ${b.resources ? `
              <div class="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
                <b>\ud83d\udd27 Resources:</b> ${esc(b.resources.panels)} \u2022 ${esc(b.resources.inverter)} \u2022 Tech: ${esc(b.resources.techName)} (${esc(b.resources.techPhone)}) \u2022 Install: ${esc(b.resources.installDate)}
              </div>
              ` : ''}
            </div>
            `;
          }).join('')}
        </div>
        ` : ''}

        <!-- Live Plans: Usage, Bill, Savings, Payments -->
        ${liveBookings.length > 0 ? `
        <div class="mt-6 space-y-6">
          ${liveBookings.map(b=>{
            const d = DISTRICTS.find(dd=>dd.name===b.district) || DISTRICTS[0];
            const usage = generateUsageData(b);
            const u = usage || { monthUsed: b.units, gridBill: Math.round(b.units*d.gridRate), ourBill: b.monthlyAmount, saved: Math.round(b.units*d.gridRate)-b.monthlyAmount, daysLive: 30, dailyAvg: Math.round(b.units/30), efficiency: 90 };
            return `
            <div class="nova-card p-0 overflow-hidden stagger-in">
              <div class="bg-gradient-to-r from-emerald-600 to-green-600 p-5 text-white">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-sm opacity-80">\u26a1 ${esc(b.planName)} Plan \u2022 ${esc(b.district)}</span>
                    <div class="font-black text-3xl mt-1">${fmt(u.ourBill)}/mo</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm opacity-80">You save</div>
                    <div class="font-black text-2xl">${fmt(u.saved)}/mo</div>
                    <div class="text-xs opacity-70">${fmt(u.saved*12)}/year</div>
                  </div>
                </div>
              </div>
              <div class="p-5">
                <!-- Usage Stats -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  <div class="text-center p-3 rounded-xl bg-zinc-50">
                    <div class="text-xs text-zinc-500">Units Used</div>
                    <div class="font-black text-xl">${u.monthUsed}</div>
                    <div class="text-[10px] text-zinc-400">of ${b.units} units/mo</div>
                  </div>
                  <div class="text-center p-3 rounded-xl bg-zinc-50">
                    <div class="text-xs text-zinc-500">Daily Average</div>
                    <div class="font-black text-xl">${u.dailyAvg}</div>
                    <div class="text-[10px] text-zinc-400">units/day</div>
                  </div>
                  <div class="text-center p-3 rounded-xl bg-zinc-50">
                    <div class="text-xs text-zinc-500">Efficiency</div>
                    <div class="font-black text-xl text-emerald-600">${u.efficiency}%</div>
                    <div class="text-[10px] text-zinc-400">panel output</div>
                  </div>
                  <div class="text-center p-3 rounded-xl bg-zinc-50">
                    <div class="text-xs text-zinc-500">Days Live</div>
                    <div class="font-black text-xl">${u.daysLive}</div>
                    <div class="text-[10px] text-zinc-400">generating power</div>
                  </div>
                </div>
                <!-- Bill Breakdown -->
                <div class="grid md:grid-cols-2 gap-4 mb-5">
                  <div class="p-4 rounded-xl bg-red-50 border border-red-100">
                    <div class="text-xs text-red-600 font-semibold uppercase">Without Solar (Grid)</div>
                    <div class="font-black text-2xl text-red-700 mt-1">${fmt(u.gridBill)}</div>
                    <div class="text-xs text-red-500">${u.monthUsed} units \u00d7 ₹${d.gridRate}/unit</div>
                  </div>
                  <div class="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-200">
                    <div class="text-xs text-emerald-600 font-semibold uppercase">With S.E.V.A. Solar</div>
                    <div class="font-black text-2xl text-emerald-700 mt-1">${fmt(u.ourBill)}</div>
                    <div class="text-xs text-emerald-500">${u.monthUsed} units \u00d7 ₹${b.rate}/unit</div>
                  </div>
                </div>
                <!-- Payment Options -->
                <div class="p-4 rounded-xl border border-zinc-200">
                  <h4 class="font-bold text-sm mb-3">\ud83d\udcb3 Payment Options</h4>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button class="p-3 rounded-xl border border-zinc-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-center pay-option" data-method="upi" data-booking="${b.id}">
                      <div class="text-lg mb-1">\ud83d\udcf1</div>
                      <div class="text-xs font-semibold">UPI</div>
                      <div class="text-[10px] text-zinc-500">GPay / PhonePe</div>
                    </button>
                    <button class="p-3 rounded-xl border border-zinc-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-center pay-option" data-method="card" data-booking="${b.id}">
                      <div class="text-lg mb-1">\ud83d\udcb3</div>
                      <div class="text-xs font-semibold">Card</div>
                      <div class="text-[10px] text-zinc-500">Debit / Credit</div>
                    </button>
                    <button class="p-3 rounded-xl border border-zinc-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-center pay-option" data-method="netbanking" data-booking="${b.id}">
                      <div class="text-lg mb-1">\ud83c\udfe6</div>
                      <div class="text-xs font-semibold">Net Banking</div>
                      <div class="text-[10px] text-zinc-500">All banks</div>
                    </button>
                    <button class="p-3 rounded-xl border border-zinc-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-center pay-option" data-method="auto" data-booking="${b.id}">
                      <div class="text-lg mb-1">\ud83d\udd04</div>
                      <div class="text-xs font-semibold">Auto Pay</div>
                      <div class="text-[10px] text-zinc-500">NEFT / ECS</div>
                    </button>
                  </div>
                  <div id="payStatus-${b.id}" class="mt-3"></div>
                </div>
              </div>
            </div>
            `;
          }).join('')}
        </div>
        ` : ''}

        <!-- Request Removal -->
        ${activeBookings.length > 0 ? `
        <div class="nova-card p-6 mt-6">
          <h3 class="font-bold flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-zinc-800 text-white grid place-items-center">\u2699</span>
            Manage Your Plans
          </h3>
          <div class="mt-4 space-y-3">
            ${activeBookings.map(b=>`
              <div class="p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                <div>
                  <div class="font-bold text-sm">${esc(b.planName)} \u2014 ${esc(b.district)}</div>
                  <div class="text-xs text-zinc-500">${b.units} units \u2022 ₹${b.rate}/unit \u2022 ${esc(b.id)}</div>
                </div>
                <button class="btn-ghost text-xs text-red-600 request-removal" data-booking="${b.id}">Request Removal</button>
              </div>
            `).join('')}
          </div>

          <!-- Removal request form -->
          <div class="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-100">
            <h4 class="font-bold text-sm">📋 Request Removal</h4>
            <p class="text-xs text-zinc-500 mt-1">Submit a removal request. Our team will contact you within 48 hours.</p>
            <form id="removalForm" class="mt-3 space-y-2">
              <select id="removalBooking" class="input-field" required>
                <option value="">Select plan to remove</option>
                ${activeBookings.map(b=>`<option value="${b.id}">${esc(b.planName)} — ${esc(b.district)} (${esc(b.id)})</option>`).join('')}
              </select>
              <select class="input-field" id="removalReason">
                <option value="">Reason (optional)</option>
                <option>Moving to new house</option>
                <option>Not satisfied with service</option>
                <option>Financial reasons</option>
                <option>Roof repairs needed</option>
                <option>Other</option>
              </select>
              <textarea class="input-field" id="removalNote" rows="2" placeholder="Additional details..."></textarea>
              <button class="btn-primary btn-ripple w-full rounded-full" type="submit" id="submitRemoval">Submit Removal Request</button>
            </form>
          </div>

          <!-- My Requests -->
          <div class="mt-6">
            <h4 class="font-bold text-sm mb-3">My Requests</h4>
            ${store.requests.filter(r=>r.userId===user.id).length === 0 ?
              `<p class="text-xs text-zinc-500">No requests yet.</p>` :
              store.requests.filter(r=>r.userId===user.id).map(r=>`
                <div class="p-3 rounded-xl bg-zinc-50 border border-zinc-100 mb-2">
                  <div class="flex items-center justify-between">
                    <span class="badge ${r.status==='Pending'?'badge-warning':r.status==='Approved'?'badge-success':'badge-error'}">${esc(r.status)}</span>
                    <span class="text-xs text-zinc-500">${timeAgo(r.created)}</span>
                  </div>
                  <div class="text-sm mt-1">${esc(r.type)} — ${esc(r.planName||r.bookingId)}</div>
                  ${r.adminNote ? `<div class="text-xs text-zinc-500 mt-1">Admin: ${esc(r.adminNote)}</div>` : ''}
                </div>
              `).join('')
            }
          </div>
        </div>
        ` : `
        <div class="nova-card p-10 text-center mt-6">
          <div class="w-14 h-14 rounded-2xl bg-green-100 text-green-700 grid place-items-center mx-auto text-xl">☀️</div>
          <h3 class="font-bold mt-3">No active plans yet</h3>
          <p class="text-sm text-zinc-500">Choose a solar plan to start saving from day 1.</p>
          <a href="#/plans" class="btn-primary rounded-full mt-4 inline-flex">Browse plans</a>
        </div>
        `}

        <!-- All bookings history -->
        ${myBookings.length > 0 ? `
        <div class="nova-card p-0 overflow-hidden mt-6">
          <div class="p-4 flex items-center justify-between">
            <h3 class="font-bold">Booking History</h3>
            <span class="text-xs text-zinc-500">${myBookings.length} total</span>
          </div>
          <div class="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-[#f0fdf4]">
                <tr><th class="text-left p-3">ID</th><th class="text-left p-3">Plan</th><th class="text-left p-3">District</th><th class="text-left p-3">Units</th><th class="text-left p-3">Rate</th><th class="text-left p-3">Status</th><th class="p-3">Action</th></tr>
              </thead>
              <tbody>
                ${myBookings.map(b=>`
                  <tr class="border-t border-green-50">
                    <td class="p-3 text-xs">${esc(b.id)}</td>
                    <td class="p-3">${esc(b.planName)}</td>
                    <td class="p-3 text-xs">${esc(b.district)}</td>
                    <td class="p-3">${b.units}</td>
                    <td class="p-3 text-emerald-600 font-bold">₹${b.rate}</td>
                    <td class="p-3"><span class="badge ${statusColor(b.status)}">${esc(b.status)}</span></td>
                    <td class="p-3 text-center">
                      <button class="text-xs text-red-600 hover:underline cancel-booking" data-id="${b.id}">Cancel</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        <!-- District pricing quick view -->
        <div class="nova-card p-6 mt-6">
          <h3 class="font-bold flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-emerald-500 text-white grid place-items-center">◎</span>
            All District Rates
          </h3>
          <p class="text-xs text-zinc-500 mt-1">You pay 65% of the grid rate. Here's how it breaks down:</p>
          <div class="overflow-x-auto mt-4">
            <table class="compare-table">
              <thead><tr><th>District</th><th>State</th><th>Grid Rate</th><th>Your Rate (65%)</th><th>Savings/unit</th></tr></thead>
              <tbody>
                ${DISTRICTS.map(d=>`
                  <tr>
                    <td class="font-medium">${esc(d.name)}</td>
                    <td class="text-zinc-500">${esc(d.state)}</td>
                    <td>₹${d.gridRate}</td>
                    <td class="font-bold text-emerald-600">₹${Math.round(d.gridRate*SOLAR_DISCOUNT*100)/100}</td>
                    <td class="text-emerald-600">₹${Math.round(d.gridRate*0.35*100)/100}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>`;

    // event handlers
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    // Payment options
    $view.querySelectorAll('.pay-option').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const method = btn.getAttribute('data-method');
        const bId = btn.getAttribute('data-booking');
        const bk = store.bookings.find(b=>b.id===bId);
        const payId = 'PAY-'+Math.random().toString(36).slice(2,7).toUpperCase();
        store.payments.push({ id:payId, bookingId:bId, userId:user.id, amount:bk.monthlyAmount, method, status:'Pending', created:new Date().toISOString() });
        saveStore();
        const statusEl = document.getElementById('payStatus-'+bId);
        if(statusEl){
          statusEl.innerHTML = `<div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
            <b>✓ Payment initiated</b> • ${payId} • Method: ${method.toUpperCase()} • Amount: ${fmt(bk.monthlyAmount)}
            <br/><span class="text-xs text-emerald-500">You will receive a confirmation shortly.</span>
          </div>`;
        }
        toast('Payment initiated — '+fmt(bk.monthlyAmount),'success');
      });
    });

    $view.querySelectorAll('.request-removal').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const bId = btn.getAttribute('data-booking');
        document.getElementById('removalBooking').value = bId;
        document.getElementById('removalForm').scrollIntoView({behavior:'smooth'});
      });
    });

    document.getElementById('removalForm')?.addEventListener('submit', e=>{
      e.preventDefault();
      const bookingId = document.getElementById('removalBooking').value;
      const reason = document.getElementById('removalReason').value;
      const note = document.getElementById('removalNote').value;
      if(!bookingId){ toast('Select a plan to remove','error'); return; }
      const booking = store.bookings.find(b=>b.id===bookingId);
      const request = {
        id:'REQ-'+Math.random().toString(36).slice(2,7).toUpperCase(),
        userId: user.id,
        userName: user.name,
        type: 'Removal',
        bookingId: bookingId,
        planName: booking?.planName || 'Unknown',
        district: booking?.district || '',
        reason: reason,
        note: note,
        status: 'Pending',
        created: new Date().toISOString()
      };
      store.requests.unshift(request);
      saveStore();
      toast('Removal request submitted! Admin will review within 48h.','success');
      document.getElementById('removalForm').reset();
      renderDashboard();
    });

    $view.querySelectorAll('.cancel-booking').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-id');
        if(!confirm('Cancel booking '+id+'?')) return;
        const bk = store.bookings.find(b=>b.id===id);
        if(bk) bk.status = 'Cancelled';
        saveStore();
        toast('Booking cancelled');
        renderDashboard();
      });
    });

    attachReveal();
  }

  // ===================== ADMIN PANEL =====================

  function renderAdmin(){
    if(!isAdmin()){ location.hash='#/login'; return; }
    const user = currentUser();
    const allBookings = store.bookings;
    const allUsers = getUsers().filter(u=>u.role==='user');
    const allRequests = store.requests;
    const allNotifs = store.notifications;
    const unread = unreadCount();
    const pendingBookings = allBookings.filter(b=>['Pending survey','Survey scheduled'].includes(b.status));
    const liveBookings = allBookings.filter(b=>b.status==='Live');
    const pendingRequests = allRequests.filter(r=>r.status==='Pending');
    const totalMRR = allBookings.filter(b=>b.status==='Live').reduce((a,b)=>a+b.monthlyAmount,0);

    $view.innerHTML = `
    <div class="page-enter">
      <section class="wrap section">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl font-black">Admin <span class="gradient-text">Dashboard</span></h1>
            <p class="text-sm text-zinc-500 mt-1">Welcome, <b>${esc(user.name)}</b> • ${allUsers.length} users • ${allBookings.length} bookings</p>
          </div>
          <div class="flex gap-2">
            <button id="exportBtn" class="btn-secondary rounded-full">Export JSON</button>
            <button id="logoutBtn" class="btn-ghost">Logout</button>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid md:grid-cols-5 gap-4 mt-6">
          <div class="nova-card nova-card-stat p-5">
            <div class="text-xs tracking-widest text-zinc-500 uppercase">Total Users</div>
            <div class="font-black text-2xl mt-1">${allUsers.length}</div>
          </div>
          <div class="nova-card nova-card-stat p-5">
            <div class="text-xs tracking-widest text-zinc-500 uppercase">Bookings</div>
            <div class="font-black text-2xl mt-1">${allBookings.length}</div>
          </div>
          <div class="nova-card nova-card-stat p-5">
            <div class="text-xs tracking-widest text-zinc-500 uppercase">Live</div>
            <div class="font-black text-2xl mt-1 text-emerald-600">${liveBookings.length}</div>
          </div>
          <div class="nova-card nova-card-stat p-5">
            <div class="text-xs tracking-widest text-zinc-500 uppercase">Pending</div>
            <div class="font-black text-2xl mt-1 text-amber-600">${pendingBookings.length}</div>
          </div>
          <div class="nova-card nova-card-stat p-5">
            <div class="text-xs tracking-widest text-zinc-500 uppercase">Monthly Revenue</div>
            <div class="font-black text-2xl mt-1">${fmt(totalMRR)}</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-2 mt-6 flex-wrap">
          <button class="btn-primary rounded-full admin-tab active-tab" data-tab="bookings">Bookings</button>
          <button class="btn-secondary rounded-full admin-tab relative" data-tab="notifications">Notifications ${unread > 0 ? `<span class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">${unread}</span>` : ''}</button>
          <button class="btn-secondary rounded-full admin-tab" data-tab="requests">Removal Requests</button>
          <button class="btn-secondary rounded-full admin-tab" data-tab="users">Users</button>
          <button class="btn-secondary rounded-full admin-tab" data-tab="districts">District Rates</button>
        </div>

        <!-- Bookings Tab -->
        <div id="tab-bookings" class="admin-panel mt-4">
          <div class="nova-card p-0 overflow-hidden">
            <div class="p-4 flex items-center justify-between flex-wrap gap-3">
              <h3 class="font-bold">All Bookings</h3>
              <input id="adminSearch" class="input-field !w-56 !py-1.5 text-sm" placeholder="Search name/phone/plan" />
            </div>
            <div class="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="sticky top-0 bg-[#f0fdf4]">
                  <tr><th class="text-left p-3">ID</th><th class="text-left p-3">Customer</th><th class="text-left p-3">Plan</th><th class="text-left p-3">District</th><th class="text-left p-3">Units</th><th class="text-left p-3">Amount</th><th class="text-left p-3">Status</th><th class="p-3">Actions</th></tr>
                </thead>
                <tbody id="adminBookingsBody"></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Notifications Tab -->
        <div id="tab-notifications" class="admin-panel mt-4 hidden">
          <div class="nova-card p-0 overflow-hidden">
            <div class="p-4 flex items-center justify-between">
              <h3 class="font-bold">Notifications ${unread > 0 ? `<span class="badge badge-error ml-2">${unread} new</span>` : ''}</h3>
              <button id="markAllRead" class="btn-ghost text-xs">Mark all read</button>
            </div>
            <div class="p-4 space-y-2 max-h-[520px] overflow-y-auto">
              ${allNotifs.length === 0 ? '<p class="text-sm text-zinc-500 text-center py-8">No notifications yet.</p>' :
                allNotifs.map(n=>`
                  <div class="p-4 rounded-xl border ${n.read ? 'border-zinc-100 bg-white' : 'border-green-200 bg-green-50'}">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="w-8 h-8 rounded-lg ${n.type==='new_booking' ? 'bg-amber-100 text-amber-700' : n.type==='allotted' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'} grid place-items-center text-sm">
                            ${n.type==='new_booking' ? '📋' : n.type==='allotted' ? '🔧' : '✅'}
                          </span>
                          <div>
                            <div class="font-bold text-sm">${esc(n.title)}</div>
                            <div class="text-xs text-zinc-500">${esc(n.message)}</div>
                          </div>
                        </div>
                        <div class="text-xs text-zinc-400 mt-1 ml-10">${timeAgo(n.created)}</div>
                      </div>
                      ${!n.read ? '<span class="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-2"></span>' : ''}
                    </div>
                  </div>
                `).join('')
              }
            </div>
          </div>
        </div>

        <!-- Requests Tab -->
        <div id="tab-requests" class="admin-panel mt-4 hidden">
          <div class="nova-card p-0 overflow-hidden">
            <div class="p-4">
              <h3 class="font-bold">Removal & Support Requests</h3>
            </div>
            <div id="adminRequestsBody" class="p-4 space-y-3">
              ${allRequests.length===0 ? '<p class="text-sm text-zinc-500 text-center py-8">No requests yet.</p>' :
                allRequests.map(r=>`
                  <div class="p-4 rounded-xl border ${r.status==='Pending'?'border-amber-200 bg-amber-50':r.status==='Approved'?'border-emerald-200 bg-emerald-50':'border-red-200 bg-red-50'}">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="badge ${r.status==='Pending'?'badge-warning':r.status==='Approved'?'badge-success':'badge-error'}">${esc(r.status)}</span>
                          <span class="text-xs text-zinc-500">${esc(r.id)} \u2022 ${esc(r.type)}</span>
                        </div>
                        <div class="font-bold mt-1">${esc(r.userName)} \u2014 ${esc(r.planName)}</div>
                        <div class="text-xs text-zinc-500">${esc(r.district)} \u2022 Booking: ${esc(r.bookingId)}</div>
                        ${r.reason ? `<div class="text-xs text-zinc-500 mt-1">Reason: ${esc(r.reason)}</div>` : ''}
                        ${r.note ? `<div class="text-xs text-zinc-500">Note: ${esc(r.note)}</div>` : ''}
                        <div class="text-xs text-zinc-400 mt-1">${timeAgo(r.created)}</div>
                      </div>
                      <div class="flex gap-2 shrink-0">
                        <input class="input-field !w-40 !py-1 text-xs" placeholder="Admin note" data-note="${r.id}" />
                        <button class="btn-primary rounded-full text-xs px-3 approve-req" data-id="${r.id}">Approve</button>
                        <button class="btn-ghost text-xs text-red-600 reject-req" data-id="${r.id}">Reject</button>
                      </div>
                    </div>
                  </div>
                `).join('')
              }
            </div>
          </div>
        </div>

        <!-- Users Tab -->
        <div id="tab-users" class="admin-panel mt-4 hidden">
          <div class="nova-card p-0 overflow-hidden">
            <div class="p-4">
              <h3 class="font-bold">Registered Users (${allUsers.length})</h3>
            </div>
            <div class="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="sticky top-0 bg-[#f0fdf4]">
                  <tr><th class="text-left p-3">ID</th><th class="text-left p-3">Name</th><th class="text-left p-3">Email</th><th class="text-left p-3">Phone</th><th class="text-left p-3">District</th><th class="text-left p-3">Joined</th><th class="text-left p-3">Bookings</th></tr>
                </thead>
                <tbody>
                  ${allUsers.map(u=>`
                    <tr class="border-t border-green-50">
                      <td class="p-3 text-xs">${esc(u.id)}</td>
                      <td class="p-3 font-medium">${esc(u.name)}</td>
                      <td class="p-3 text-xs">${esc(u.email)}</td>
                      <td class="p-3 text-xs">${esc(u.phone)}</td>
                      <td class="p-3 text-xs">${esc(u.district||'\u2014')}</td>
                      <td class="p-3 text-xs">${esc(u.created||'\u2014')}</td>
                      <td class="p-3 text-xs font-bold">${allBookings.filter(b=>b.userId===u.id).length}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- District Rates Tab -->
        <div id="tab-districts" class="admin-panel mt-4 hidden">
          <div class="nova-card p-0 overflow-hidden">
            <div class="p-4 flex items-center justify-between">
              <h3 class="font-bold">District Grid Rates & Our Pricing</h3>
              <span class="badge badge-pink">All customers pay 65% of grid rate</span>
            </div>
            <div class="overflow-x-auto">
              <table class="compare-table">
                <thead><tr><th>District</th><th>State</th><th>Grid Rate (\u20b9/unit)</th><th>Our Rate (65%)</th><th>Savings/unit</th><th>Savings %</th></tr></thead>
                <tbody>
                  ${DISTRICTS.map(d=>`
                    <tr>
                      <td class="font-medium">${esc(d.name)}</td>
                      <td>${esc(d.state)}</td>
                      <td>\u20b9${d.gridRate}</td>
                      <td class="font-bold text-emerald-600">\u20b9${Math.round(d.gridRate*SOLAR_DISCOUNT*100)/100}</td>
                      <td class="text-emerald-600">\u20b9${Math.round(d.gridRate*0.35*100)/100}</td>
                      <td class="text-emerald-600 font-bold">35% off</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>`;

    // tab switching
    $view.querySelectorAll('.admin-tab').forEach(tab=>{
      tab.addEventListener('click', ()=>{
        $view.querySelectorAll('.admin-tab').forEach(t=>{ t.className = t===tab ? 'btn-primary rounded-full admin-tab active-tab' : 'btn-secondary rounded-full admin-tab relative'; });
        $view.querySelectorAll('.admin-panel').forEach(p=>p.classList.add('hidden'));
        document.getElementById('tab-'+tab.getAttribute('data-tab')).classList.remove('hidden');
      });
    });

    // mark all notifications read
    document.getElementById('markAllRead')?.addEventListener('click', ()=>{
      markAllRead(); renderAdmin(); toast('All notifications marked as read');
    });

    // bookings table
    function drawBookings(){
      const q = (document.getElementById('adminSearch')?.value||'').toLowerCase();
      let list = [...allBookings];
      if(q) list = list.filter(b=>(b.id+b.name+b.phone+b.planName+b.district).toLowerCase().includes(q));
      document.getElementById('adminBookingsBody').innerHTML = list.map(b=>{
        const eq = EQUIPMENT[b.planId] || {};
        const hasResources = !!b.resources;
        const isInstalled = b.status==='Installed' || b.status==='Live';
        return `
        <tr class="border-t border-green-50">
          <td class="p-3 text-xs">${esc(b.id)}</td>
          <td class="p-3"><div class="font-medium">${esc(b.name)}</div><div class="text-xs text-zinc-500">${esc(b.phone)}</div></td>
          <td class="p-3 text-xs">${esc(b.planName)}</td>
          <td class="p-3 text-xs">${esc(b.district)}</td>
          <td class="p-3">${b.units}</td>
          <td class="p-3 font-bold">${fmt(b.monthlyAmount)}/mo</td>
          <td class="p-3">
            <select data-status="${b.id}" class="input-field !py-1 !px-2 text-xs">
              ${['Pending survey','Survey scheduled','Resources allotted','Installation scheduled','Installed','Net-meter applied','Live','Cancelled'].map(o=>`<option ${o===b.status?'selected':''}>${o}</option>`).join('')}
            </select>
          </td>
          <td class="p-3">
            <div class="flex gap-1 flex-wrap">
              ${!hasResources ? `<button class="btn-primary text-[10px] px-2 py-1 rounded-lg allot-btn" data-id="${b.id}" data-plan="${b.planId}">Allot Resources</button>` : `<span class="text-[10px] text-emerald-600 font-semibold">\u2713 Allotted</span>`}
              ${hasResources && !isInstalled ? `<button class="btn-secondary text-[10px] px-2 py-1 rounded-lg install-btn" data-id="${b.id}">Mark Installed</button>` : ''}
              ${isInstalled ? `<span class="text-[10px] text-emerald-600 font-semibold">\u2713 Live</span>` : ''}
              <button data-del="${b.id}" class="text-[10px] text-red-600 hover:underline">Delete</button>
            </div>
          </td>
        </tr>`;
      }).join('') || '<tr><td colspan="8" class="p-8 text-center text-zinc-500">No bookings</td></tr>';
      // bind status changes
      document.querySelectorAll('#adminBookingsBody [data-status]').forEach(sel=>{
        sel.addEventListener('change', ()=>{
          const bk = allBookings.find(x=>x.id===sel.getAttribute('data-status'));
          if(bk){
            const oldStatus = bk.status;
            bk.status=sel.value;
            if(sel.value==='Installed') bk.installedDate = new Date().toISOString();
            saveStore();
            addNotification(sel.value==='Live' ? 'live' : 'status', 'Status Updated', `${bk.planName} for ${bk.name} — now "${sel.value}"`, bk.id);
            toast('Updated '+bk.id); drawBookings();
          }
        });
      });
      // bind allot buttons
      document.querySelectorAll('.allot-btn').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const bId = btn.getAttribute('data-id');
          const planId = btn.getAttribute('data-plan');
          const bk = allBookings.find(b=>b.id===bId);
          const eq = EQUIPMENT[planId] || {};
          const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+7);
          openModal(`
            <div class="flex items-center gap-3 mb-4">
              <span class="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 grid place-items-center text-lg">\ud83d\udd27</span>
              <div>
                <h3 class="font-black text-lg">Allot Resources</h3>
                <p class="text-xs text-zinc-500">${esc(bk.planName)} for ${esc(bk.name)} \u2022 ${esc(bk.district)}</p>
              </div>
            </div>
            <form id="allotForm" class="space-y-3">
              <div class="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
                <b>Suggested equipment for ${esc(bk.planName)} (${bk.units} units):</b>
                <div class="mt-1 space-y-0.5">
                  <div>Panels: ${eq.panels||'TBD'}</div>
                  <div>Inverter: ${eq.inverter||'TBD'}</div>
                  <div>Mounting: ${eq.mounting||'TBD'}</div>
                  <div>Wiring: ${eq.wiring||'TBD'}</div>
                  ${eq.meter ? `<div>Meter: ${eq.meter}</div>` : ''}
                  <div>Misc: ${eq.misc||'TBD'}</div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div><label class="text-xs font-semibold">Panels (override)</label><input class="input-field mt-1 text-sm" name="panels" value="${eq.panels||''}" /></div>
                <div><label class="text-xs font-semibold">Inverter</label><input class="input-field mt-1 text-sm" name="inverter" value="${eq.inverter||''}" /></div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div><label class="text-xs font-semibold">Technician Name</label><input class="input-field mt-1 text-sm" name="techName" placeholder="Rajesh Kumar" required /></div>
                <div><label class="text-xs font-semibold">Technician Phone</label><input class="input-field mt-1 text-sm" name="techPhone" placeholder="9876543210" required /></div>
              </div>
              <div><label class="text-xs font-semibold">Installation Date</label><input type="date" class="input-field mt-1 text-sm" name="installDate" min="${new Date().toISOString().slice(0,10)}" value="${tomorrow.toISOString().slice(0,10)}" required /></div>
              <div class="flex gap-3">
                <button class="btn-primary btn-ripple flex-1 rounded-full" type="submit">Allot & Notify Customer</button>
                <button class="btn-secondary rounded-full" type="button" onclick="closeModal()">Cancel</button>
              </div>
            </form>
          `);
          document.getElementById('allotForm').addEventListener('submit', e=>{
            e.preventDefault();
            const fd = new FormData(e.target);
            const d = Object.fromEntries(fd.entries());
            allotResources(bId, d);
            toast('Resources allotted for '+bk.id+'! Customer notified.', 'success');
            closeModal();
            renderAdmin();
          });
        });
      });
      // bind install buttons
      document.querySelectorAll('.install-btn').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const bId = btn.getAttribute('data-id');
          const bk = allBookings.find(b=>b.id===bId);
          if(confirm('Mark installation complete for '+bk.name+'? This will make the system LIVE.')){
            markInstalled(bId);
            toast('Installation marked complete! '+bk.name+' is now LIVE.', 'success');
            renderAdmin();
          }
        });
      });
      // bind delete
      document.querySelectorAll('#adminBookingsBody [data-del]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const id=btn.getAttribute('data-del');
          if(confirm('Delete '+id+'?')){
            store.bookings = store.bookings.filter(x=>x.id!==id);
            saveStore(); drawBookings(); toast('Deleted');
          }
        });
      });
    }
    document.getElementById('adminSearch')?.addEventListener('input', drawBookings);
    drawBookings();

    // request actions
    document.querySelectorAll('.approve-req').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-id');
        const req = store.requests.find(r=>r.id===id);
        const noteInput = document.querySelector(`[data-note="${id}"]`);
        if(req){
          req.status = 'Approved';
          req.adminNote = noteInput?.value || '';
          if(req.type==='Removal'){
            const bk = store.bookings.find(b=>b.id===req.bookingId);
            if(bk) bk.status = 'Removed';
          }
          saveStore();
          toast('Request approved');
          renderAdmin();
        }
      });
    });
    document.querySelectorAll('.reject-req').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-id');
        const req = store.requests.find(r=>r.id===id);
        const noteInput = document.querySelector(`[data-note="${id}"]`);
        if(req){
          req.status = 'Rejected';
          req.adminNote = noteInput?.value || '';
          saveStore();
          toast('Request rejected');
          renderAdmin();
        }
      });
    });

    document.getElementById('exportBtn')?.addEventListener('click', ()=>{
      const data = { bookings: store.bookings, requests: store.requests, notifications: store.notifications, users: getUsers() };
      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download='seva-admin-export.json'; a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    attachReveal();
  }

  function statusColor(s){
    s=(s||'').toLowerCase();
    if(s.includes('live')||s.includes('installed')) return 'badge-success';
    if(s.includes('pending')||s.includes('survey')) return 'badge-warning';
    if(s.includes('cancel')||s.includes('removed')||s.includes('reject')) return 'badge-error';
    return 'badge-default';
  }

  // ===================== OTHER PAGES =====================

  function renderHome(){
    $view.innerHTML = `
    <div class="page-enter">
      <section class="wrap py-6">
        <div class="nova-card p-3 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs text-zinc-600">
          <span class="inline-flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-emerald-500 text-white grid place-items-center text-[11px]">✓</span> First-of-its-kind Pay-As-You-Go Solar</span>
          <span class="hidden md:inline h-4 w-px bg-green-100"></span>
          <span>⚡ 75 Lakh+ Vendors Registered</span>
          <span class="hidden md:inline h-4 w-px bg-green-100"></span>
          <span>UPI Micro-Payments</span>
          <span class="badge badge-success">35% less than diesel/grid</span>
        </div>
      </section>

      <section class="wrap pb-6">
        <div class="grid md:grid-cols-3 gap-4">
          <div class="nova-card nova-card-stat p-6">
            <p class="text-xs font-bold tracking-widest text-green-600 uppercase">Live Impact</p>
            <div class="mt-3 grid grid-cols-3 gap-3 text-center">
              <div><div class="font-black text-2xl">₹0</div><div class="text-xs text-zinc-500">Upfront Cost</div></div>
              <div><div class="font-black text-2xl">₹45</div><div class="text-xs text-zinc-500">Daily via UPI</div></div>
              <div><div class="font-black text-2xl">35%</div><div class="text-xs text-zinc-500">Instant Savings</div></div>
            </div>
          </div>
          <div class="nova-card p-0 overflow-hidden md:col-span-2">
            <div class="grid md:grid-cols-2 h-full">
              <div class="p-6">
                <span class="badge badge-pink">Why S.E.V.A.?</span>
                <h3 class="mt-3 text-xl font-black leading-tight">Solar for <span class="gradient-text">every vendor</span>.</h3>
                <p class="text-sm text-zinc-500 mt-2">Zero upfront cost. Pay a micro daily fee via UPI. We install, own & maintain the system.</p>
                <div class="mt-4 space-y-2 text-sm">
                  <div class="flex gap-2"><span class="text-emerald-500">✔</span> ₹0 upfront — we own the hardware</div>
                  <div class="flex gap-2"><span class="text-emerald-500">✔</span> Daily UPI payment — ₹45-50 vs ₹90-120 diesel</div>
                  <div class="flex gap-2"><span class="text-emerald-500">✔</span> Free install, maintenance & 24×7 monitoring</div>
                </div>
              </div>
              <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white p-6 flex flex-col justify-between relative overflow-hidden">
                <div class="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10 blur-2xl"></div>
                <div>
                  <p class="text-xs tracking-widest opacity-60 uppercase">Real Vendor Savings</p>
                  <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div class="rounded-xl bg-white/10 p-3">
                      <div class="opacity-60 text-xs">Diesel/Grid daily</div>
                      <div class="font-bold text-amber-300">₹90–120/day</div>
                    </div>
                    <div class="rounded-xl bg-green-600 p-3">
                      <div class="opacity-90 text-xs">S.E.V.A. daily</div>
                      <div class="font-bold">₹45–50/day</div>
                    </div>
                  </div>
                </div>
                <div class="text-xs opacity-70 mt-4">Save up to ₹2,100/month • ₹20,520/year — money for a second cart or child's education</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3 Plans preview -->
      <section class="wrap section">
        <div class="text-center max-w-2xl mx-auto">
          <span class="badge badge-pink">3 Plans</span>
          <h2 class="text-3xl font-black mt-2">Solar for <span class="gradient-text">every vendor</span></h2>
          <p class="text-zinc-500 mt-2">From tea stalls to market complexes — zero upfront, pay daily via UPI, see your savings instantly.</p>
        </div>
        <div class="grid md:grid-cols-3 gap-4 mt-8">
          ${PLANS.map((p,i)=>`
            <div class="nova-card p-5 card-hover text-center magnetic-card stagger-in" style="transition-delay:${i*0.1}s">
              <div class="w-14 h-14 rounded-2xl ${p.color} text-white grid place-items-center mx-auto text-2xl">${p.icon}</div>
              <h3 class="font-black text-lg mt-3">${esc(p.name)}</h3>
              <p class="text-xs text-zinc-500 mt-1">${esc(p.tagline)}</p>
              <div class="mt-2 badge badge-default">${esc(p.capacityRange)}</div>
              <ul class="mt-4 space-y-1.5 text-xs text-zinc-600 text-left">
                ${p.features.slice(0,4).map(f=>`<li class="flex gap-1.5"><span class="text-emerald-500">✔</span>${esc(f)}</li>`).join('')}
              </ul>
              <a href="#/plans" class="btn-primary w-full rounded-full mt-4 text-sm">Choose plan →</a>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- How it works -->
      <section class="wrap section pt-0">
        <div class="text-center max-w-2xl mx-auto">
          <h2 class="text-3xl font-black">How it works — <span class="gradient-text">3 steps</span></h2>
        </div>
        <div class="steps mt-8">
          ${[
            {n:'01', t:'Choose your plan', d:'Pick Micro (vendors), Residential (homes) or Industrial. Select your district — see grid vs S.E.V.A. rate.'},
            {n:'02', t:'We install for free', d:'Free survey, DISCOM filing, system install in 48h. Zero upfront cost — ₹0 today.'},
            {n:'03', t:'Pay daily via UPI', d:'Micro daily fee of ₹45-50 — just 65% of diesel/grid. Free maintenance & monitoring included.'},
          ].map((s,i)=>`
            <div class="nova-card p-6 flex gap-4 stagger-in" style="transition-delay:${i*0.15}s">
              <div class="step-num">${s.n}</div>
              <div><h3 class="font-bold">${s.t}</h3><p class="text-sm text-zinc-500 mt-1">${s.d}</p></div>
            </div>`).join('')}
        </div>
      </section>

      <!-- Testimonials -->
      <section class="wrap section pt-0">
        <h3 class="text-xl font-bold flex items-center gap-2"><span class="w-8 h-8 rounded-xl bg-green-600 text-white grid place-items-center">❝</span> Loved by vendors & households</h3>
        <div class="grid md:grid-cols-3 gap-4 mt-4">
          ${[
            { name:'Ramesh Tea Stall', city:'Pune • Micro', text:'I was spending ₹100/day on a diesel generator. S.E.V.A. charges me ₹48/day via UPI. I save ₹1,500 every month — enough to buy a second cart.', avatar:'https://i.pravatar.cc/100?img=15', stars:5 },
            { name:'Sunita & Family', city:'Indore • Residential', text:'Power cuts ruined our evening business hours. Now S.E.V.A. runs our lights, fan and fridge — zero downtime, zero upfront cost.', avatar:'https://i.pravatar.cc/100?img=5', stars:5 },
            { name:'Anil Market Complex', city:'Bangalore • Industrial', text:'For our cold storage, S.E.V.A. is 35% cheaper than BESCOM. Saving ₹18,000 every month. The daily UPI deduction is seamless.', avatar:'https://i.pravatar.cc/100?img=26', stars:5 },
          ].map((t,i)=>`
            <div class="nova-card p-5 stagger-in" style="transition-delay:${i*0.12}s">
              <div class="flex gap-1 text-amber-500 text-sm">${'★'.repeat(t.stars)}</div>
              <p class="text-sm mt-3 leading-relaxed text-zinc-700">"${esc(t.text)}"</p>
              <div class="flex items-center gap-3 mt-4">
                <img src="${t.avatar}" class="w-9 h-9 rounded-full object-cover" alt=""/>
                <div><div class="text-sm font-bold">${esc(t.name)}</div><div class="text-xs text-zinc-500">${esc(t.city)}</div></div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="wrap section pt-0">
        <h3 class="text-xl font-bold flex items-center gap-2"><span class="w-8 h-8 rounded-xl bg-zinc-900 text-white grid place-items-center">?</span> FAQ</h3>
        <div class="nova-card p-2 md:p-4 mt-4">
          ${faqs.map((f,i)=>`
            <div class="border-b last:border-0 border-zinc-100">
              <button data-faq="${i}" class="w-full flex items-center justify-between py-4 text-left gap-4 group">
                <span class="font-medium group-hover:text-green-700 transition-colors text-sm md:text-[15px]">${esc(f.q)}</span>
                <span class="shrink-0 w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 grid place-items-center group-[.open]:bg-green-600 group-[.open]:text-white group-[.open]:rotate-45 transition-all">+</span>
              </button>
              <div class="faq-ans overflow-hidden max-h-0 opacity-0 transition-all duration-300"><p class="text-sm text-zinc-500 pb-4 pr-8">${esc(f.a)}</p></div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- CTA -->
      <section class="wrap section pt-0">
        <div class="nova-card p-8 md:p-12 text-center bg-gradient-to-br from-green-600 to-emerald-500 text-white stagger-in relative overflow-hidden">
          <div class="glow-orb" style="width:300px;height:300px;background:rgba(255,255,255,0.1);top:-50%;right:-20%;"></div>
          <div class="glow-orb" style="width:200px;height:200px;background:rgba(255,255,255,0.08);bottom:-30%;left:-10%;animation-delay:3s;"></div>
          <h2 class="text-3xl font-black">Start saving with S.E.V.A. today</h2>
          <p class="text-white/80 mt-2">Zero upfront • Pay ₹45-50/day via UPI • Free install & maintenance</p>
          <div class="flex flex-wrap gap-3 justify-center mt-6">
            ${isLoggedIn() ?
              `<a href="#/plans" class="btn-primary btn-ripple rounded-full px-8 py-3 bg-white text-green-700 border-white">Choose your plan →</a>` :
              `<a href="#/register" class="btn-primary btn-ripple rounded-full px-8 py-3 bg-white text-green-700 border-white">Register & start saving →</a>`
            }
            <a href="#/plans" class="btn-outline-white btn-ripple rounded-full px-8 py-3">View plans</a>
          </div>
        </div>
      </section>
    </div>`;

    // faq accordion
    $view.querySelectorAll('[data-faq]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const wrap = btn.parentElement;
        const ans = wrap.querySelector('.faq-ans');
        const isOpen = wrap.classList.contains('open');
        $view.querySelectorAll('#faq .open').forEach(o=>{ o.classList.remove('open'); o.querySelector('.faq-ans').style.maxHeight='0px'; o.querySelector('.faq-ans').style.opacity='0'; });
        if(!isOpen){ wrap.classList.add('open'); ans.style.maxHeight=ans.scrollHeight+'px'; ans.style.opacity='1'; }
      });
    });
    attachReveal();
  }

  function renderHow(){
    $view.innerHTML = `
    <div class="page-enter">
      <section class="wrap section">
        <div class="max-w-3xl mx-auto text-center">
          <span class="badge badge-pink">How it works</span>
          <h1 class="text-3xl md:text-4xl font-black mt-2">From zero to <span class="gradient-text">solar-powered</span> in 48 hours</h1>
          <p class="text-zinc-500 mt-3 leading-relaxed">No upfront cost. No paperwork burden. No maintenance worries. We handle everything — you just pay a micro daily fee via UPI.</p>
        </div>
        <div class="grid md:grid-cols-3 gap-4 mt-8">
          ${[
            {n:'01', title:'Choose your plan & district', desc:'Pick Micro (vendors), Residential (homes) or Industrial (markets). Select your district — see diesel/grid rate vs S.E.V.A. rate instantly.'},
            {n:'02', title:'Free survey & 48h install', desc:'Our engineer visits your stall/home. We handle DISCOM filing, net-metering, subsidy paperwork. System installed in 48 hours. ₹0 upfront.'},
            {n:'03', title:'Pay daily via UPI', desc:'Micro fee of ₹45-50/day — just 65% of diesel/grid cost. Free cleaning, repairs, monitoring included. We own the asset, you own the savings.'},
          ].map(s=>`
            <div class="nova-card p-6 text-center">
              <div class="step-num mx-auto">${s.n}</div>
              <h3 class="font-bold mt-3">${s.title}</h3>
              <p class="text-sm text-zinc-500 mt-1">${s.desc}</p>
            </div>
          `).join('')}
        </div>
        <div class="nova-card p-6 md:p-8 mt-8 max-w-3xl mx-auto">
          <h3 class="font-black text-lg text-center">The Problem We Solve</h3>
          <div class="grid md:grid-cols-2 gap-6 mt-4 text-sm text-zinc-600 leading-relaxed">
            <div>
              <p>While national electrification numbers appear high on paper, <b>connection does not equal reliability</b>. Rural areas and tier-2 cities frequently experience hours of daily power cuts. For a street vendor running a tea or food stall, these outages perfectly overlap with peak evening business hours.</p>
            </div>
            <div>
              <p>To keep their businesses running, vendors are forced to rely on expensive diesel. With fuel prices constantly rising, running a small generator is a massive daily drain on their already thin margins. Even when the grid is technically present, it is <b>effectively unusable</b> during the exact hours these micro entrepreneurs need it most.</p>
            </div>
          </div>
          <div class="mt-4 p-4 rounded-xl bg-green-50 border border-green-100">
            <p class="text-sm text-green-800 font-semibold text-center">"Everyone has the right to clean energy. Solar power should never be a luxury that hardworking vendors cannot afford."</p>
          </div>
        </div>
        <div class="nova-card p-6 md:p-8 mt-6 max-w-3xl mx-auto">
          <h3 class="font-black text-lg text-center">Our Philosophy</h3>
          <p class="text-sm text-zinc-600 leading-relaxed mt-3 text-center">S.E.V.A. treats solar energy as an <b>affordable daily service</b> rather than a heavy hardware purchase. We install the system, retain ownership of the asset, and take full responsibility for its maintenance. Crucially, S.E.V.A. does not just replace diesel — we also provide a direct, reliable alternative to the grid. Users pay a micro daily fee calculated at just 65% of the standard grid or diesel rate.</p>
        </div>
      </section>
    </div>`;
    attachReveal();
  }

  function renderAbout(){
    $view.innerHTML = `
    <div class="page-enter">
      <section class="wrap section">
        <div class="max-w-3xl mx-auto text-center">
          <span class="badge badge-pink">About Project S.E.V.A.</span>
          <h1 class="text-3xl md:text-4xl font-black mt-2">Solar Energy for <span class="gradient-text">Vendor Access</span></h1>
          <p class="text-zinc-500 mt-3 leading-relaxed">Project S.E.V.A. is a pioneering, first-of-its-kind pay-as-you-go solar model designed to bridge the gap between India's informal street economy and clean energy. We provide compact, zero upfront cost solar and battery systems to street vendors and rural households.</p>
        </div>
        <div class="nova-card p-6 md:p-8 mt-8 max-w-3xl mx-auto">
          <h3 class="font-black text-lg">The Vision</h3>
          <p class="text-sm text-zinc-600 leading-relaxed mt-3">Our core philosophy is simple: <b>everyone has the right to clean energy</b>. Solar power should never be a luxury that hardworking vendors cannot afford. Instead of buying expensive hardware, users pay a micro daily fee via UPI for the power they consume. Our solution is significantly more affordable than existing alternatives, priced at 35% less than their current daily spend on diesel generators or their struggles with an unusable, unreliable grid.</p>
        </div>
        <div class="nova-card p-6 md:p-8 mt-6 max-w-3xl mx-auto">
          <h3 class="font-black text-lg">The Financing Barrier</h3>
          <p class="text-sm text-zinc-600 leading-relaxed mt-3">The traditional solar market completely ignores street vendors. A standard solar and battery kit requires a massive upfront investment of roughly ₹18,000 to ₹20,000. Vendors lack collateral, are often unregistered, and cannot access formal credit to cover these costs. S.E.V.A. solves this financing bottleneck by treating solar energy as an affordable daily service rather than a heavy hardware purchase.</p>
          <div class="mt-4 overflow-x-auto">
            <table class="w-full text-sm">
              <thead><tr class="border-b border-zinc-200"><th class="text-left py-2 pr-4 font-semibold">Aspect</th><th class="text-left py-2 pr-4 font-semibold">Traditional Solar</th><th class="text-left py-2 font-semibold text-green-700">S.E.V.A. Model</th></tr></thead>
              <tbody class="text-zinc-600">
                <tr class="border-b border-zinc-100"><td class="py-2 pr-4">Upfront Hardware Cost</td><td class="py-2 pr-4">₹18,000 – ₹20,000</td><td class="py-2 font-semibold text-green-700">₹0</td></tr>
                <tr class="border-b border-zinc-100"><td class="py-2 pr-4">Asset Ownership</td><td class="py-2 pr-4">User (requires bank loan)</td><td class="py-2 font-semibold text-green-700">S.E.V.A.</td></tr>
                <tr><td class="py-2 pr-4">Maintenance Burden</td><td class="py-2 pr-4">User's responsibility</td><td class="py-2 font-semibold text-green-700">Fully covered by S.E.V.A.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="nova-card p-6 md:p-8 mt-6 max-w-3xl mx-auto">
          <h3 class="font-black text-lg">Why Now?</h3>
          <p class="text-sm text-zinc-600 leading-relaxed mt-3">This is a truly unprecedented approach — the first of its kind in the market. We are leveraging three converging trends that make this the perfect time for an advanced pay-as-you-go solar model:</p>
          <div class="mt-4 space-y-3">
            <div class="flex gap-3"><span class="w-8 h-8 rounded-lg bg-green-600 text-white grid place-items-center shrink-0 text-xs font-bold">1</span><div><p class="text-sm font-semibold">Government Formalization</p><p class="text-xs text-zinc-500 mt-0.5">The government has recently formalized and registered over 75 lakh street vendors, creating a massive and trackable customer base.</p></div></div>
            <div class="flex gap-3"><span class="w-8 h-8 rounded-lg bg-green-600 text-white grid place-items-center shrink-0 text-xs font-bold">2</span><div><p class="text-sm font-semibold">UPI Deep Penetration</p><p class="text-xs text-zinc-500 mt-0.5">The deep penetration of UPI across India makes frictionless, daily micro payments technologically viable without the overhead of manual collection.</p></div></div>
            <div class="flex gap-3"><span class="w-8 h-8 rounded-lg bg-green-600 text-white grid place-items-center shrink-0 text-xs font-bold">3</span><div><p class="text-sm font-semibold">Ignored Street-Level Segment</p><p class="text-xs text-zinc-500 mt-0.5">While rooftop solar is growing rapidly nationwide, it is entirely restricted to wealthy homeowners and commercial buildings. S.E.V.A. captures the ignored street-level segment with a model built specifically for their daily cash flow.</p></div></div>
          </div>
        </div>
        <div class="nova-card p-6 md:p-8 mt-6 max-w-3xl mx-auto">
          <h3 class="font-black text-lg">The Economic Engine</h3>
          <p class="text-sm text-zinc-600 leading-relaxed mt-3">The pricing strategy requires zero behavior change or consumer education because it offers an immediate, massive cash saving from day one. While the user currently spends roughly ₹90 to ₹120 daily on erratic diesel generators and exorbitant informal grid tapping fees, S.E.V.A. charges a fixed daily fee of just ₹45 to ₹50.</p>
          <p class="text-sm text-zinc-600 leading-relaxed mt-2">This gives the vendor an immediate, guaranteed saving of up to <b>₹2,100 per month</b> while providing a superior, uninterrupted power supply.</p>
          <div class="mt-4 overflow-x-auto">
            <table class="w-full text-sm">
              <thead><tr class="border-b border-zinc-200"><th class="text-left py-2 pr-4 font-semibold">Month</th><th class="text-left py-2 pr-4 font-semibold">Status Quo (Diesel/Grid)</th><th class="text-left py-2 font-semibold text-green-700">S.E.V.A. Cost</th></tr></thead>
              <tbody class="text-zinc-600">
                <tr class="border-b border-zinc-100"><td class="py-2 pr-4">Month 1</td><td class="py-2 pr-4">₹3,150</td><td class="py-2 font-semibold text-green-700">₹1,440</td></tr>
                <tr class="border-b border-zinc-100"><td class="py-2 pr-4">Month 3</td><td class="py-2 pr-4">₹9,450</td><td class="py-2 font-semibold text-green-700">₹4,320</td></tr>
                <tr class="border-b border-zinc-100"><td class="py-2 pr-4">Month 6</td><td class="py-2 pr-4">₹18,900</td><td class="py-2 font-semibold text-green-700">₹8,640</td></tr>
                <tr class="border-b border-zinc-100"><td class="py-2 pr-4">Month 9</td><td class="py-2 pr-4">₹28,350</td><td class="py-2 font-semibold text-green-700">₹12,960</td></tr>
                <tr><td class="py-2 pr-4 font-bold">Month 12</td><td class="py-2 pr-4 font-bold">₹37,800</td><td class="py-2 font-bold text-green-700">₹17,280</td></tr>
              </tbody>
            </table>
          </div>
          <div class="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-center">
            <p class="text-sm opacity-90">By Month 12, the gap between diesel and S.E.V.A. equals</p>
            <p class="font-black text-2xl">₹20,520 in direct savings</p>
            <p class="text-xs opacity-80 mt-1">For a street vendor, that's capital for a second cart, child's education, or emergency fund.</p>
          </div>
        </div>
        <div class="grid md:grid-cols-3 gap-4 mt-8">
          <div class="nova-card p-5 text-center"><div class="w-10 h-10 rounded-xl bg-green-600 text-white grid place-items-center mx-auto">🛒</div><h4 class="font-bold mt-3">Micro Plans</h4><p class="text-sm text-zinc-500 mt-1">For street vendors, food carts, tea stalls — the backbone of India's economy</p></div>
          <div class="nova-card p-5 text-center"><div class="w-10 h-10 rounded-xl bg-emerald-500 text-white grid place-items-center mx-auto">🏠</div><h4 class="font-bold mt-3">Residential</h4><p class="text-sm text-zinc-500 mt-1">For rural households and tier-2 cities with unreliable grid</p></div>
          <div class="nova-card p-5 text-center"><div class="w-10 h-10 rounded-xl bg-blue-600 text-white grid place-items-center mx-auto">🏭</div><h4 class="font-bold mt-3">Industrial</h4><p class="text-sm text-zinc-500 mt-1">For market complexes, cold storage & warehouses</p></div>
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
          <h1 class="text-3xl md:text-4xl font-black mt-2">Ready to <span class="gradient-text">go solar?</span></h1>
          <p class="text-zinc-500 mt-2">Book a free survey, ask about S.E.V.A., or partner with us — we reply within 2 hours.</p>
        </div>
        <div class="max-w-2xl mx-auto mt-8">
          <div class="nova-card p-6">
            <form id="contactForm" class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input class="input-field" name="name" placeholder="Full name" required />
                <input class="input-field" name="phone" placeholder="Phone" required pattern="\\d{10}" />
              </div>
              <input class="input-field" name="email" type="email" placeholder="Email (optional)" />
              <select class="input-field" name="topic">
                <option>Book free S.E.V.A. survey</option>
                <option>Existing S.E.V.A. booking</option>
                <option>Partner / Franchise with us</option>
                <option>Media / Press inquiry</option>
                <option>Other</option>
              </select>
              <textarea class="input-field" name="msg" rows="4" placeholder="Your message" required></textarea>
              <button class="btn-primary btn-ripple w-full rounded-full" type="submit">Send — we'll call back</button>
            </form>
          </div>
        </div>
      </section>
    </div>`;
    document.getElementById('contactForm')?.addEventListener('submit', e=>{
      e.preventDefault();
      toast('Message sent! We\'ll call you back soon.','success');
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
        </div>
        <div class="nova-card p-2 md:p-4 mt-6 max-w-3xl mx-auto">
          ${faqs.map((f,i)=>`
            <div class="border-b last:border-0 border-zinc-100">
              <button data-faq2="${i}" class="w-full flex items-center justify-between py-4 text-left gap-4 group">
                <span class="font-medium group-hover:text-green-700 transition-colors text-sm">${esc(f.q)}</span>
                <span class="shrink-0 w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 grid place-items-center group-[.open]:bg-green-600 group-[.open]:text-white group-[.open]:rotate-45 transition-all">+</span>
              </button>
              <div class="faq-ans2 overflow-hidden max-h-0 opacity-0 transition-all duration-300"><p class="text-sm text-zinc-500 pb-4 pr-8">${esc(f.a)}</p></div>
            </div>
          `).join('')}
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
    // hero visibility
    const hero = document.querySelector('.prisma-hero');
    const quote = document.getElementById('prismaQuote');
    const isHome = (path==='/' || path==='');
    if(hero){ hero.classList.toggle('hero-hidden', !isHome); }
    if(quote){ quote.style.display = isHome ? '' : 'none'; }
    // Toggle floating nav visibility on home
    document.body.classList.toggle('home-page', isHome);
    // nav active
    document.querySelectorAll('[data-nav]').forEach(a=>{
      const isActive = (path==='/' && a.dataset.nav==='home') || path.startsWith('/'+a.dataset.nav);
      a.classList.toggle('active', isActive);
      if(a.classList.contains('nav-link')) a.classList.toggle('bg-white', isActive);
    });
    // update nav to show login state
    updateNavAuth();

    if(path.startsWith('/login')) return pageTransition(renderLogin);
    if(path.startsWith('/register')) return pageTransition(renderRegister);
    if(path.startsWith('/plans')) return pageTransition(renderPlans);
    if(path.startsWith('/dashboard')) return pageTransition(renderDashboard);
    if(path.startsWith('/admin')) return pageTransition(renderAdmin);
    if(path.startsWith('/how')) return pageTransition(renderHow);
    if(path.startsWith('/about')) return pageTransition(renderAbout);
    if(path.startsWith('/contact')) return pageTransition(renderContact);
    if(path.startsWith('/faq')) return pageTransition(renderFaq);
    if(path==='/') return pageTransition(renderHome);
    return pageTransition(renderHome);
  }

  function updateNavAuth(){
    const user = currentUser();
    const authNav = document.getElementById('authNav');
    if(authNav){
      if(user){
        const dashLink = user.role==='admin' ? '#/admin' : '#/dashboard';
        const dashLabel = user.role==='admin' ? 'Admin' : 'Dashboard';
        authNav.innerHTML = `
          <a href="${dashLink}" class="btn-ghost text-sm">${dashLabel}</a>
          <a href="#" class="btn-ghost text-sm" id="navLogout">Logout</a>
        `;
        document.getElementById('navLogout')?.addEventListener('click', e=>{ e.preventDefault(); logout(); });
      } else {
        authNav.innerHTML = `
          <a href="#/login" class="btn-ghost text-sm">Login</a>
          <a href="#/register" class="btn-primary rounded-full px-5 py-2 text-sm">Register →</a>
        `;
      }
    }
    // Also update the Prisma hero nav (black top bar)
    const prismaNav = document.querySelector('.prisma-nav-inner');
    if(prismaNav){
      // Remove old auth links if any
      prismaNav.querySelectorAll('.prisma-login-btn, .prisma-reg-btn, .prisma-dash-btn, .prisma-logout-btn').forEach(el=>el.remove());
      if(user){
        const dashLink = user.role==='admin' ? '#/admin' : '#/dashboard';
        const dashLabel = user.role==='admin' ? 'Admin' : 'Dashboard';
        const dashA = document.createElement('a');
        dashA.href = dashLink; dashA.textContent = dashLabel; dashA.className = 'prisma-dash-btn';
        const logoutA = document.createElement('a');
        logoutA.href = '#'; logoutA.textContent = 'Logout'; logoutA.className = 'prisma-logout-btn';
        logoutA.addEventListener('click', e=>{ e.preventDefault(); logout(); });
        prismaNav.appendChild(dashA);
        prismaNav.appendChild(logoutA);
      } else {
        const loginA = document.createElement('a');
        loginA.href = '#/login'; loginA.textContent = 'Login'; loginA.className = 'prisma-login-btn';
        const regA = document.createElement('a');
        regA.href = '#/register'; regA.textContent = 'Register'; regA.className = 'prisma-reg-btn';
        prismaNav.appendChild(loginA);
        prismaNav.appendChild(regA);
      }
    }
  }

  window.addEventListener('hashchange', router);
  if(document.readyState !== 'loading') router(); else document.addEventListener('DOMContentLoaded', router);
  window.closeModal = closeModal;
})();
