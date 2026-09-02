/* S.E.V.A. Prototype App — Pitch Deck Version */
(() => {
  // ——— Elements ———
  const $ = id => document.getElementById(id);
  const splash = $('splash');
  const loginScreen = $('loginScreen');
  const otpScreen = $('otpScreen');
  const appShell = $('appShell');
  const phoneInput = $('phoneInput');
  const getOtpBtn = $('getOtpBtn');
  const otpPhoneLabel = $('otpPhoneLabel');
  const verifyOtpBtn = $('verifyOtpBtn');
  const hamburgerBtn = $('hamburgerBtn');
  const sidebarOverlay = $('sidebarOverlay');
  const sidebar = $('sidebar');
  const topBarTitle = $('topBarTitle');
  const toastApp = $('toastApp');

  let currentPhone = '';
  let currentPane = 'dashboard';

  // ——— Splash Screen ———
  setTimeout(() => {
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.6s ease';
    setTimeout(() => {
      splash.classList.remove('active');
      splash.style.display = 'none';
      showScreen(loginScreen);
    }, 600);
  }, 2400);

  // ——— Screen transitions ———
  function showScreen(target) {
    document.querySelectorAll('.screen').forEach(s => {
      if (s === target) return;
      s.classList.remove('active');
      s.style.opacity = '0';
      s.style.pointerEvents = 'none';
    });
    target.style.display = '';
    requestAnimationFrame(() => {
      target.classList.add('active');
      target.style.opacity = '1';
      target.style.pointerEvents = 'auto';
    });
  }

  // ——— Phone Input ———
  phoneInput.addEventListener('input', () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
  });

  getOtpBtn.addEventListener('click', () => {
    const num = phoneInput.value.trim();
    if (num.length !== 10) {
      toastApp_(num.length === 0 ? 'Please enter your mobile number' : 'Please enter a valid 10-digit number');
      phoneInput.focus();
      return;
    }
    currentPhone = num;
    otpPhoneLabel.textContent = `Enter the 4-digit code sent to +91 ${num.slice(0,5)} ${num.slice(5)}`;
    showScreen(otpScreen);
    // Focus first OTP box
    setTimeout(() => {
      const firstBox = otpScreen.querySelector('.otp-box');
      if (firstBox) firstBox.focus();
    }, 400);
  });

  phoneInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') getOtpBtn.click();
  });

  // ——— OTP Boxes ———
  const otpBoxes = otpScreen.querySelectorAll('.otp-box');
  otpBoxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/\D/g, '').slice(0, 1);
      if (box.value) {
        box.classList.add('filled');
        if (i < 3) otpBoxes[i + 1].focus();
      } else {
        box.classList.remove('filled');
      }
    });
    box.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        otpBoxes[i - 1].focus();
        otpBoxes[i - 1].value = '';
        otpBoxes[i - 1].classList.remove('filled');
      }
    });
    // Allow paste
    box.addEventListener('paste', e => {
      e.preventDefault();
      const data = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 4);
      data.split('').forEach((ch, j) => {
        if (otpBoxes[j]) {
          otpBoxes[j].value = ch;
          otpBoxes[j].classList.add('filled');
        }
      });
      if (data.length > 0) otpBoxes[Math.min(data.length, 3)].focus();
    });
  });

  // ——— Verify OTP (any 4 digits work) ———
  verifyOtpBtn.addEventListener('click', () => {
    const code = Array.from(otpBoxes).map(b => b.value).join('');
    if (code.length !== 4) {
      toastApp_('Please enter the 4-digit OTP');
      return;
    }
    // Success animation
    otpBoxes.forEach(b => {
      b.style.borderColor = 'var(--green-500)';
      b.style.background = 'var(--green-50)';
    });
    toastApp_('Verified! Welcome to S.E.V.A. ☀️');
    setTimeout(() => {
      showScreen(appShell);
      animateBattery();
      animateChartBars();
    }, 600);
  });

  resendOtp = $('resendOtp');
  resendOtp?.addEventListener('click', e => {
    e.preventDefault();
    toastApp_('OTP resent to +91 ' + currentPhone);
    otpBoxes.forEach(b => { b.value = ''; b.classList.remove('filled'); });
    otpBoxes[0].focus();
  });

  // ——— Sidebar ———
  function openSidebar() {
    sidebarOverlay.classList.add('open');
    sidebar.classList.add('open');
    hamburgerBtn.classList.add('open');
  }

  function closeSidebar() {
    sidebarOverlay.classList.remove('open');
    sidebar.classList.remove('open');
    hamburgerBtn.classList.remove('open');
  }

  hamburgerBtn.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  sidebarOverlay.addEventListener('click', e => {
    if (e.target === sidebarOverlay) closeSidebar();
  });

  // ——— Sidebar Navigation ———
  const paneTitles = {
    dashboard: 'Dashboard',
    health: 'System Health',
    payments: 'Payments & UPI',
    savings: 'My Savings',
    contact: 'Contact Agent'
  };

  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      const pane = item.dataset.pane;
      if (pane === currentPane) { closeSidebar(); return; }

      // Update sidebar active
      document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
      item.classList.add('active');

      // Switch pane
      document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
      const targetPane = document.getElementById('pane-' + pane);
      if (targetPane) {
        targetPane.classList.add('active');
        targetPane.style.animation = 'none';
        targetPane.offsetHeight; // reflow
        targetPane.style.animation = '';
      }

      currentPane = pane;
      topBarTitle.textContent = paneTitles[pane] || 'Dashboard';
      closeSidebar();

      // Re-animate chart bars when savings pane opens
      if (pane === 'savings') {
        setTimeout(animateChartBars, 100);
      }

      // Scroll to top
      $('appContent').scrollTop = 0;
    });
  });

  // ——— Pay Now Button ———
  $('payNowBtn')?.addEventListener('click', () => {
    const btn = $('payNowBtn');
    btn.innerHTML = '<span style="animation:spin 0.8s linear infinite;display:inline-block;">⏳</span> Processing...';
    btn.style.pointerEvents = 'none';
    setTimeout(() => {
      btn.innerHTML = '✅ Paid ₹45 via UPI';
      btn.style.background = 'var(--green-100)';
      btn.style.color = 'var(--green-700)';
      toastApp_('Payment successful! Receipt sent to your phone ☀️');
      // Update status
      const statusEl = document.querySelector('.payment-status');
      if (statusEl) {
        statusEl.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:var(--green-400);display:inline-block;"></span> Paid';
        statusEl.style.background = 'rgba(255,255,255,0.3)';
      }
    }, 1800);
  });

  // ——— Contact Agent Buttons ———
  $('callAgentBtn')?.addEventListener('click', () => {
    toastApp_('📞 Calling Suresh Kumar...');
  });

  $('reportIssueBtn')?.addEventListener('click', () => {
    toastApp_('🚨 Issue reported! Suresh will contact you within 30 min');
  });

  // ——— Battery Animation ———
  function animateBattery() {
    const fill = $('batteryFill');
    const percent = $('batteryPercent');
    if (!fill || !percent) return;

    const circumference = 2 * Math.PI * 85; // ~534
    const targetPercent = 88;
    const offset = circumference - (circumference * targetPercent / 100);

    // Animate from full offset to target
    fill.style.strokeDashoffset = circumference;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fill.style.strokeDashoffset = offset;
      });
    });

    // Count up percentage
    let current = 0;
    const duration = 1500;
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(targetPercent * eased);
      percent.textContent = current + '%';
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ——— Chart Bar Animation ———
  function animateChartBars() {
    document.querySelectorAll('.chart-bar-fill').forEach(bar => {
      const target = bar.dataset.width;
      bar.style.width = '0%';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bar.style.width = target + '%';
        });
      });
    });
  }

  // ——— Payment List ———
  const payments = [
    { date: 'Sept 2', amount: 45, method: 'Paytm', status: 'paid' },
    { date: 'Sept 1', amount: 45, method: 'PhonePe', status: 'paid' },
    { date: 'Aug 31', amount: 45, method: 'Cash to Agent', status: 'paid' },
    { date: 'Aug 30', amount: 45, method: 'GPay', status: 'paid' },
    { date: 'Aug 29', amount: 45, method: 'Paytm', status: 'paid' },
    { date: 'Aug 28', amount: 45, method: 'PhonePe', status: 'paid' },
    { date: 'Aug 27', amount: 45, method: 'GPay', status: 'paid' },
    { date: 'Aug 26', amount: 45, method: 'Cash to Agent', status: 'paid' },
    { date: 'Aug 25', amount: 45, method: 'Paytm', status: 'paid' },
    { date: 'Aug 24', amount: 45, method: 'PhonePe', status: 'paid' },
  ];

  const paymentList = $('paymentList');
  if (paymentList) {
    paymentList.innerHTML = payments.map((p, i) => `
      <div class="payment-row" style="animation-delay:${i * 0.05}s;">
        <div class="payment-icon ${p.status}">
          ${p.status === 'paid' ? '✅' : '⏳'}
        </div>
        <div class="payment-info">
          <h4>${p.date}</h4>
          <p>Paid via ${p.method}</p>
        </div>
        <div style="text-align:right;">
          <div class="payment-amount-cell">₹${p.amount}</div>
          <div class="payment-check">✓</div>
        </div>
      </div>
    `).join('');
  }

  // ——— Toast ———
  function toastApp_(msg) {
    toastApp.textContent = msg;
    toastApp.classList.add('show');
    setTimeout(() => toastApp.classList.remove('show'), 2800);
  }

  // ——— Savings Count Up ———
  function animateSavings() {
    const el = $('savingsTotal');
    if (!el) return;
    const target = 1240;
    const duration = 1500;
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = '₹' + current.toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ——— Spin animation for loading ———
  const style = document.createElement('style');
  style.textContent = '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
  document.head.appendChild(style);

  // ——— Auto-trigger savings animation when savings pane opens ———
  const savingsObserver = new MutationObserver(() => {
    const pane = $('pane-savings');
    if (pane && pane.classList.contains('active')) {
      animateSavings();
    }
  });
  const savingsPane = $('pane-savings');
  if (savingsPane) {
    savingsObserver.observe(savingsPane, { attributes: true, attributeFilter: ['class'] });
  }

})();
