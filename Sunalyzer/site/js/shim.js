// ============================================================================
// SolarSaathi demo shim — intercepts all of Sunalyzer's backend API calls and
// serves deterministic demo data in the browser. No backend needed.
// Also adds the "Pay Bill" pane (billed at 65% of grid rate + savings).
// MUST be loaded before main.js.
// ============================================================================
(function () {
  'use strict';

  // ---- SolarSaathi pricing -------------------------------------------------
  var GRID_RATE = 8.5;                 // ₹ per kWh (utility grid price)
  var OUR_RATE = GRID_RATE * 0.65;     // 65% of grid — what the customer pays
  var FEEDIN_RATE = 3.0;               // ₹ per kWh fed into grid
  var START_DATE = '2024-01-15';       // plan went live
  var PAID_KEY = 'solarSaathi.sunalyzer.paid';

  // ---- tiny helpers --------------------------------------------------------
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function inr(x) { return '₹' + Math.round(x).toLocaleString('en-IN'); }
  function inr2(x) { return '₹' + x.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function isValidDateStr(d) { return /^\d{4}-\d{2}(-\d{2})?$/.test(d); }

  // ---- deterministic solar / load curves -----------------------------------
  function pvKW(dateStr, hour) {
    var r = rng(hashStr(dateStr));
    var cloud = 0.55 + 0.45 * r();                                  // day quality
    var m = parseInt(dateStr.slice(5, 7), 10);
    var season = 0.72 + 0.42 * Math.sin(((m - 3) / 12) * 2 * Math.PI); // summer peak
    var rise = 6.1, set = 18.4;
    if (hour <= rise || hour >= set) return 0;
    var x = (hour - rise) / (set - rise);
    var kw = 3.2 * season * cloud * Math.pow(Math.sin(Math.PI * x), 1.6);
    var r2 = rng(hashStr(dateStr + ':' + Math.round(hour * 12)));
    kw *= 0.85 + 0.3 * r2();
    return Math.max(0, kw);
  }
  function loadKW(dateStr, hour) {
    var r = rng(hashStr('load' + dateStr + ':' + Math.round(hour * 12)));
    var kw = 0.25 + 0.5 * r();
    if (hour >= 6 && hour < 9) kw += 0.6 + 0.5 * r();   // morning
    if (hour >= 17 && hour < 22) kw += 1.0 + 0.8 * r(); // evening peak
    if (hour >= 22 || hour < 6) kw = 0.15 + 0.2 * r();  // night
    return kw;
  }

  // minute-level simulation for one day -> { prod, cons, grid, fed } kWh
  var dayCache = {}; // memoized: current stats poll every 3s
  function simulateDay(dateStr) {
    if (dayCache[dateStr]) return dayCache[dateStr];
    var prod = 0, cons = 0, grid = 0, fed = 0, peak = 0;
    for (var min = 0; min < 1440; min++) {
      var h = min / 60;
      var p = pvKW(dateStr, h), l = loadKW(dateStr, h);
      if (p > peak) peak = p;
      prod += p / 60; cons += l / 60;
      fed += Math.max(0, p - l) / 60;
      grid += Math.max(0, l - p) / 60;
    }
    var selfUsed = Math.min(prod, cons);
    var r = {
      produced: prod, consumed: cons, fedIn: fed,
      consumedFromPv: Math.max(0, cons - grid),
      consumedFromGrid: grid,
      peakW: peak * 1000
    };
    dayCache[dateStr] = r;
    return r;
  }

  // month totals
  function daysInMonth(ym) {
    var y = parseInt(ym.slice(0, 4), 10), m = parseInt(ym.slice(5, 7), 10);
    return new Date(y, m, 0).getDate();
  }
  function simulateMonth(ym) {
    var tot = { produced: 0, consumed: 0, fedIn: 0, consumedFromPv: 0, consumedFromGrid: 0, peakW: 0 };
    var n = daysInMonth(ym);
    var now = new Date();
    for (var d = 1; d <= n; d++) {
      var ds = ym + '-' + pad(d);
      if (new Date(ds + 'T00:00:00') > now) break; // don't simulate the future
      var s = simulateDay(ds);
      tot.produced += s.produced; tot.consumed += s.consumed;
      tot.fedIn += s.fedIn; tot.consumedFromPv += s.consumedFromPv;
      tot.consumedFromGrid += s.consumedFromGrid;
      if (s.peakW > tot.peakW) tot.peakW = s.peakW;
    }
    return tot;
  }
  function simulateYear(y) {
    var tot = { produced: 0, consumed: 0, fedIn: 0, consumedFromPv: 0, consumedFromGrid: 0, peakW: 0 };
    for (var m = 1; m <= 12; m++) {
      var s = simulateMonth(y + '-' + pad(m));
      tot.produced += s.produced; tot.consumed += s.consumed;
      tot.fedIn += s.fedIn; tot.consumedFromPv += s.consumedFromPv;
      tot.consumedFromGrid += s.consumedFromGrid;
      if (s.peakW > tot.peakW) tot.peakW = s.peakW;
    }
    return tot;
  }

  // minute rows for charts.
  // dashboard rows: [x, "HH:MM", prodKwh, consKwh, fedKwh]  (kWh per minute)
  // high-res rows:  ["HH:MM", prodKwh, consKwh, fedKwh]
  function minuteRows(dateStr, hours, indexed) {
    var now = new Date();
    var isToday = dateStr === todayStr();
    var endMin = isToday ? Math.max(2, now.getHours() * 60 + now.getMinutes()) : 1440;
    var startMin = Math.max(0, endMin - hours * 60);
    var rows = [];
    var step = (endMin - startMin) > 720 ? 2 : 1; // thin out long spans
    for (var min = startMin; min < endMin; min += step) {
      var h = min / 60;
      var p = pvKW(dateStr, h) / 60, l = loadKW(dateStr, h);
      var f = Math.max(0, p - l), c = Math.max(0, l - Math.min(p, l)) + Math.min(p, l); // consumed = load
      c = l / 60; f = Math.max(0, (p - l)) / 60; p = p / 60;
      var label = pad(Math.floor(min / 60)) + ':' + pad(min % 60);
      rows.push(indexed ? [rows.length, label, p, c, f] : [label, p, c, f]);
    }
    return rows;
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function historyPayload(dateStr, sim) {
    var selfPct = sim.produced > 0 ? (sim.consumedFromPv / sim.produced) * 100 : 0;
    var fedPct = 100 - selfPct;
    var gridPct = sim.consumed > 0 ? (sim.consumedFromGrid / sim.consumed) * 100 : 0;
    var pvPct = 100 - gridPct;
    var autarky = sim.consumed > 0 ? (sim.consumedFromPv / sim.consumed) * 100 : 0;
    var earnedFeedin = sim.fedIn * FEEDIN_RATE;
    var earnedSelf = sim.consumedFromPv * GRID_RATE;
    var highRes = '';
    if (dateStr.length === 10) highRes = JSON.stringify(minuteRows(dateStr, 24, false));
    return {
      state: 'ok',
      produced_kwh: +sim.produced.toFixed(2),
      consumed_from_pv_kwh: +sim.consumedFromPv.toFixed(2),
      usage_fed_in_kwh: +sim.fedIn.toFixed(2),
      consumed_from_grid_kwh: +sim.consumedFromGrid.toFixed(2),
      consumed_total_kwh: +sim.consumed.toFixed(2),
      earned_feedin: +earnedFeedin.toFixed(2),
      earned_savings: +earnedSelf.toFixed(2),
      earned_total: +(earnedFeedin + earnedSelf).toFixed(2),
      autarky: +autarky.toFixed(0),
      consumed_from_grid_percent: +gridPct.toFixed(1),
      consumed_from_pv_percent: +pvPct.toFixed(1),
      usage_fed_in_percent: +fedPct.toFixed(1),
      usage_self_consumed_percent: +selfPct.toFixed(1),
      high_res: highRes
    };
  }

  function detailRows(list, dateLen) {
    return list.map(function (s) {
      return {
        date: s.date,
        produced_self: +s.sim.consumedFromPv.toFixed(2),
        produced_feed_in: +s.sim.fedIn.toFixed(2),
        consumed_from_pv: +s.sim.consumedFromPv.toFixed(2),
        consumed_from_grid: +s.sim.consumedFromGrid.toFixed(2)
      };
    });
  }

  // ---- current stats -------------------------------------------------------
  function allTimeTotals() {
    var t = { produced: 0, consumed: 0, fedIn: 0, consumedFromPv: 0, consumedFromGrid: 0 };
    ['2024', '2025'].forEach(function (y) {
      var s = simulateYear(y);
      t.produced += s.produced; t.consumed += s.consumed; t.fedIn += s.fedIn;
      t.consumedFromPv += s.consumedFromPv; t.consumedFromGrid += s.consumedFromGrid;
    });
    var nowY = new Date().getFullYear();
    for (var m = 1; m <= new Date().getMonth() + 1; m++) {
      var s2 = simulateMonth(nowY + '-' + pad(m));
      t.produced += s2.produced; t.consumed += s2.consumed; t.fedIn += s2.fedIn;
      t.consumedFromPv += s2.consumedFromPv; t.consumedFromGrid += s2.consumedFromGrid;
    }
    return t;
  }

  function currentStats() {
    var now = new Date();
    var ds = todayStr();
    var h = now.getHours() + now.getMinutes() / 60;
    // Demo should always look alive: pretend early afternoon at night.
    if (h < 7 || h > 18) h = 13.6;
    var today = simulateDay(ds);
    var p = pvKW(ds, h), l = loadKW(ds, h);
    var at = allTimeTotals();
    return {
      today_produced_kwh: +today.produced.toFixed(3),
      today_consumed_kwh: +today.consumed.toFixed(3),
      today_fed_in_kwh: +today.fedIn.toFixed(3),
      today_earned: +(today.fedIn * FEEDIN_RATE + today.consumedFromPv * GRID_RATE).toFixed(2),
      today_autarky: today.consumed > 0 ? +((today.consumedFromPv / today.consumed) * 100).toFixed(0) : 0,
      all_time_produced_kwh: +at.produced.toFixed(1),
      all_time_consumed_kwh: +at.consumed.toFixed(1),
      all_time_fed_in_kwh: +at.fedIn.toFixed(1),
      all_time_earned: +(at.fedIn * FEEDIN_RATE + at.consumedFromPv * GRID_RATE).toFixed(2),
      all_time_autarky: at.consumed > 0 ? +((at.consumedFromPv / at.consumed) * 100).toFixed(0) : 0,
      currently_produced_w: Math.round(p * 1000),
      currently_consumed_grid_w: Math.round(Math.max(0, l - p) * 1000),
      currently_fed_in_w: Math.round(Math.max(0, p - l) * 1000)
    };
  }

  // ============================================================================
  // PAY BILL PANE — SolarSaathi billing at 65% of grid rate + savings
  // ============================================================================
  function monthList() {
    var out = [];
    var start = new Date(START_DATE + 'T00:00:00');
    var now = new Date();
    var d = new Date(start.getFullYear(), start.getMonth(), 1);
    while (d <= now) {
      out.push(d.getFullYear() + '-' + pad(d.getMonth() + 1));
      d.setMonth(d.getMonth() + 1);
    }
    return out.reverse(); // newest first
  }

  function paidMonths() { return lsGet(PAID_KEY); }
  function isPaid(ym) { return paidMonths().indexOf(ym) !== -1; }

  function showViewPayBill() {
    setElementVisible('view_dashboard', false);
    setElementVisible('view_statistics', false);
    setElementVisible('view_history', false);
    setElementVisible('view_csv', false);
    setElementVisible('view_paybill', true);
    setInfoGraphicEnabled(false);
    gDashboardVisible = false;
    renderPayBill();
  }

  function renderPayBill() {
    var el = document.getElementById('view_paybill');
    if (!el) return;
    var months = monthList();
    var currentYm = months[0];
    var rows = months.map(function (ym) {
      var sim = simulateMonth(ym);
      var gridBill = sim.consumed * GRID_RATE;
      var ourBill = sim.consumed * OUR_RATE;
      return { ym: ym, sim: sim, gridBill: gridBill, ourBill: ourBill, saved: gridBill - ourBill, paid: isPaid(ym) };
    });
    var cur = rows[0];
    var allSaved = rows.reduce(function (a, r) { return a + r.saved; }, 0);
    var allGrid = rows.reduce(function (a, r) { return a + r.gridBill; }, 0);
    var allOurs = rows.reduce(function (a, r) { return a + r.ourBill; }, 0);
    var allUnits = rows.reduce(function (a, r) { return a + r.sim.consumed; }, 0);
    var dueRows = rows.filter(function (r) { return !r.paid; });

    var monthName = function (ym) {
      var y = parseInt(ym.slice(0, 4), 10), m = parseInt(ym.slice(5, 7), 10);
      return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    };

    var html = '' +
      '<h1 class="mt-4">Pay Bill <span class="badge bg-success ms-2">65% of grid rate</span></h1>' +
      '<ol class="breadcrumb mb-4"><li class="breadcrumb-item active">SolarSaathi billing • you pay 65% of the utility grid rate, always</li></ol>' +

      // Summary cards
      '<div class="row">' +
        '<div class="col-xl-3 col-md-6 mb-4"><div class="card border-left-success shadow h-100 py-2"><div class="card-body">' +
          '<div class="text-xs font-weight-bold text-success text-uppercase mb-1">This month (' + monthName(cur.ym) + ')</div>' +
          '<div class="h5 mb-0 font-weight-bold text-gray-800">' + inr(cur.ourBill) + '</div>' +
          '<div class="small text-muted">' + cur.sim.consumed.toFixed(0) + ' kWh × ' + inr2(OUR_RATE) + ' (65% of ' + inr2(GRID_RATE) + ')</div>' +
        '</div></div></div>' +
        '<div class="col-xl-3 col-md-6 mb-4"><div class="card border-left-danger shadow h-100 py-2"><div class="card-body">' +
          '<div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Grid would cost (this month)</div>' +
          '<div class="h5 mb-0 font-weight-bold text-gray-800"><s>' + inr(cur.gridBill) + '</s></div>' +
          '<div class="small text-muted">' + cur.sim.consumed.toFixed(0) + ' kWh × ' + inr2(GRID_RATE) + '</div>' +
        '</div></div></div>' +
        '<div class="col-xl-3 col-md-6 mb-4"><div class="card border-left-primary shadow h-100 py-2"><div class="card-body">' +
          '<div class="text-xs font-weight-bold text-primary text-uppercase mb-1">You saved (this month)</div>' +
          '<div class="h5 mb-0 font-weight-bold text-gray-800">' + inr(cur.saved) + '</div>' +
          '<div class="small text-success">35% off, every single month</div>' +
        '</div></div></div>' +
        '<div class="col-xl-3 col-md-6 mb-4"><div class="card border-left-warning shadow h-100 py-2"><div class="card-body">' +
          '<div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Saved since ' + monthName(months[months.length - 1]) + '</div>' +
          '<div class="h5 mb-0 font-weight-bold text-gray-800">' + inr(allSaved) + '</div>' +
          '<div class="small text-muted">on ' + allUnits.toFixed(0) + ' kWh total</div>' +
        '</div></div></div>' +
      '</div>' +

      // Pay now card
      '<div class="card shadow mb-4"><div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">' +
        '<h6 class="m-0 font-weight-bold text-primary">Pay "' + monthName(cur.ym) + '" bill — ' + inr(cur.ourBill) + '</h6>' +
        (cur.paid ? '<span class="badge bg-success">PAID ✓</span>' : '<span class="badge bg-danger">DUE</span>') +
      '</div><div class="card-body">' +
        (cur.paid
          ? '<div class="alert alert-success mb-0">✓ This bill is already paid. Thank you!</div>'
          :
          '<div class="row g-2 align-items-end">' +
            '<div class="col-md-4"><label class="form-label small mb-1">Payment method</label>' +
              '<select id="pb_method" class="form-select"><option value="upi">UPI — GPay / PhonePe</option><option value="card">Card — Debit / Credit</option><option value="netbanking">Net Banking</option><option value="autopay">Auto Pay — NEFT / ECS</option></select></div>' +
            '<div class="col-md-3"><button id="pb_paybtn" class="btn btn-success w-100">Pay ' + inr(cur.ourBill) + ' now</button></div>' +
            '<div class="col-md-5 small text-muted">Grid-equivalent: <s>' + inr(cur.gridBill) + '</s> → you pay <b class="text-success">' + inr(cur.ourBill) + '</b> and save <b class="text-success">' + inr(cur.saved) + '</b>.</div>' +
          '</div><div id="pb_status" class="mt-3"></div>') +
      '</div></div>' +

      // Bills table
      '<div class="card shadow mb-4"><div class="card-header py-3"><h6 class="m-0 font-weight-bold text-primary">All bills — grid vs SolarSaathi (65%)</h6></div><div class="card-body">' +
      '<div class="table-responsive"><table class="table table-sm table-hover align-middle">' +
        '<thead><tr><th>Month</th><th>Units (kWh)</th><th>Grid bill</th><th>SolarSaathi bill (65%)</th><th>You saved</th><th>Status</th><th></th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><td class="fw-bold">' + monthName(r.ym) + '</td>' +
            '<td>' + r.sim.consumed.toFixed(0) + '</td>' +
            '<td><s class="text-danger">' + inr(r.gridBill) + '</s></td>' +
            '<td class="fw-bold text-success">' + inr(r.ourBill) + '</td>' +
            '<td class="text-success">− ' + inr(r.saved) + '</td>' +
            '<td>' + (r.paid ? '<span class="badge bg-success">Paid</span>' : (r.ym === currentYm ? '<span class="badge bg-danger">Due</span>' : '<span class="badge bg-warning text-dark">Overdue</span>')) + '</td>' +
            '<td>' + (r.paid ? '' : '<button class="btn btn-sm btn-outline-success pb-row-pay" data-ym="' + r.ym + '">Pay now</button>') + '</td></tr>';
        }).join('') +
      '</tbody></table></div>' +
      '<div class="small text-muted">Lifetime: grid ' + inr(allGrid) + ' → you paid ' + inr(allOurs) + ' • <b class="text-success">total saved ' + inr(allSaved) + '</b></div>' +
      '</div></div>';

    el.innerHTML = html;

    document.getElementById('pb_paybtn')?.addEventListener('click', function () { payMonth(currentYm); });
    el.querySelectorAll('.pb-row-pay').forEach(function (b) {
      b.addEventListener('click', function () { payMonth(b.getAttribute('data-ym')); });
    });
  }

  function payMonth(ym) {
    var method = (document.getElementById('pb_method') || {}).value || 'upi';
    var sim = simulateMonth(ym);
    var amount = sim.consumed * OUR_RATE;
    var paid = paidMonths();
    if (paid.indexOf(ym) === -1) { paid.push(ym); lsSet(PAID_KEY, paid); }
    var id = 'PAY-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    var st = document.getElementById('pb_status');
    if (st) {
      st.innerHTML = '<div class="alert alert-success mb-0"><b>✓ Payment initiated</b> • ' + id + ' • ' +
        method.toUpperCase() + ' • ' + inr(amount) + '<br><span class="small">You will receive a confirmation shortly. You saved ' +
        inr(sim.consumed * GRID_RATE - amount) + ' vs the grid this month.</span></div>';
    }
    renderPayBill();
  }

  // expose for sidebar onclick
  window.showViewPayBill = showViewPayBill;

  // ---- floating "back to site" button --------------------------------------
  window.addEventListener('DOMContentLoaded', function () {
    var btn = document.createElement('button');
    btn.textContent = '← SolarSaathi';
    btn.setAttribute('style', 'position:fixed;bottom:14px;right:14px;z-index:99999;background:#16a34a;color:#fff;border:none;border-radius:999px;padding:10px 18px;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.35);cursor:pointer;font-size:13px;');
    btn.addEventListener('click', function () { try { parent.postMessage('sunalyzer:home', '*'); } catch (e) {} });
    document.body.appendChild(btn);
  });

  // ============================================================================
  // fetch() interception — serves every endpoint Sunalyzer asks for
  // ============================================================================
  var realFetch = window.fetch.bind(window);
  function jsonResp(obj) {
    return Promise.resolve(new Response(JSON.stringify(obj), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  }

  window.fetch = function (url) {
    var u = String(url || '');
    function after(kw) { // strip base uri / leading slash -> "query?type=..." or "csv?..."
      var i = u.indexOf(kw);
      return i === -1 ? '' : u.slice(i + kw.length);
    }
    var q = after('query?');
    if (q === '' && u.indexOf('name') !== -1 && u.indexOf('query') === -1) {
      return jsonResp('SolarSaathi — Pune Rooftop (Demo)');
    }
    if (q !== '') {
      var params = {};
      q.split('&').forEach(function (kv) {
        var p = kv.split('=');
        params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
      var type = params.type;

      if (type === 'current') {
        return jsonResp(currentStats());
      }
      if (type === 'real_time') {
        var hrs = parseInt(params.h || '24', 10) || 24;
        return jsonResp(minuteRows(todayStr(), hrs, true));
      }
      if (type === 'dates') return jsonResp({ year_min: 2024, year_max: new Date().getFullYear() });
      if (type === 'historical') {
        var table = params.table, date = params.date || '';
        if (!isValidDateStr(date) && table !== 'all_time') return jsonResp({ state: 'error' });
        if (table === 'days') return jsonResp(historyPayload(date, simulateDay(date)));
        if (table === 'months') return jsonResp(historyPayload(date, simulateMonth(date)));
        if (table === 'years') return jsonResp(historyPayload(date, simulateYear(date)));
        if (table === 'all_time') {
          var t = { produced: 0, consumed: 0, fedIn: 0, consumedFromPv: 0, consumedFromGrid: 0 };
          ['2024', '2025'].forEach(function (y) { var s = simulateYear(y); t.produced += s.produced; t.consumed += s.consumed; t.fedIn += s.fedIn; t.consumedFromPv += s.consumedFromPv; t.consumedFromGrid += s.consumedFromGrid; });
          for (var mm = 1; mm <= new Date().getMonth() + 1; mm++) {
            var s3 = simulateMonth(new Date().getFullYear() + '-' + pad(mm));
            t.produced += s3.produced; t.consumed += s3.consumed; t.fedIn += s3.fedIn; t.consumedFromPv += s3.consumedFromPv; t.consumedFromGrid += s3.consumedFromGrid;
          }
          return jsonResp(historyPayload('all_time', t));
        }
        return jsonResp({ state: 'error' });
      }
      if (type === 'days_in_month') {
        var ym = params.date, out = [];
        for (var d = 1; d <= daysInMonth(ym); d++) {
          var ds2 = ym + '-' + pad(d);
          if (new Date(ds2 + 'T00:00:00') > new Date()) break;
          out.push({ date: ds2, sim: simulateDay(ds2) });
        }
        return jsonResp(detailRows(out));
      }
      if (type === 'months_in_year') {
        var y = params.date, out2 = [];
        for (var m2 = 1; m2 <= 12; m2++) {
          var ym2 = y + '-' + pad(m2);
          if (new Date(ym2 + '-01T00:00:00') > new Date()) break;
          out2.push({ date: ym2, sim: simulateMonth(ym2) });
        }
        return jsonResp(detailRows(out2));
      }
      if (type === 'years_in_all_time') {
        var out3 = [];
        for (var yy = 2024; yy <= new Date().getFullYear(); yy++) out3.push({ date: String(yy), sim: simulateYear(String(yy)) });
        return jsonResp(detailRows(out3));
      }
      if (type === 'statistics') {
        var best = { day: { d: todayStr(), k: 0 }, month: { d: todayStr().slice(0, 7), k: 0 }, year: { d: String(new Date().getFullYear()), k: 0 } };
        for (var d3 = 1; d3 <= 28; d3++) {
          ['2025-05', '2026-05'].forEach(function (ym3) {
            var ds3 = ym3 + '-' + pad(d3);
            var k = simulateDay(ds3).produced;
            if (k > best.day.k) best.day = { d: ds3, k: k };
          });
        }
        var bestM = simulateMonth('2026-05');
        var startY = new Date(START_DATE + 'T00:00:00');
        var daysOp = Math.max(1, Math.floor((new Date() - startY) / 86400000));
        return jsonResp({
          state: 'ok',
          highest_production_w: Math.round(3200 * 0.95),
          highest_production_date: best.day.d,
          best_day_production_kwh: +best.day.k.toFixed(2),
          best_day_date: best.day.d,
          best_month_production_kwh: +bestM.produced.toFixed(2),
          best_month_date: '2026-05',
          best_year_production_kwh: +simulateYear('2025').produced.toFixed(2),
          best_year_date: '2025',
          average_daily_production_kwh: +12.4,
          start_of_operation: START_DATE,
          days_of_operation: daysOp
        });
      }
      return jsonResp({ state: 'error' });
    }
    return realFetch.apply(null, arguments);
  };

  // ---- CSV download interception (csv.js uses window.open) ------------------
  var realOpen = window.open;
  window.open = function (url) {
    var u = String(url || '');
    var i = u.indexOf('csv?table=');
    if (i !== -1) {
      var params = {};
      u.slice(i + 10).split('&').forEach(function (kv) { var p = kv.split('='); params[p[0]] = decodeURIComponent(p[1] || ''); });
      var table = params.table || 'days', date = params.date || '';
      var lines = ['date,produced_kwh,fed_in_kwh,consumed_from_grid_kwh,consumed_from_pv_kwh,consumed_total_kwh'];
      function pushDay(ds) { var s = simulateDay(ds); lines.push([ds, s.produced.toFixed(2), s.fedIn.toFixed(2), s.consumedFromGrid.toFixed(2), s.consumedFromPv.toFixed(2), s.consumed.toFixed(2)].join(',')); }
      function pushMonth(ym) { var s = simulateMonth(ym); lines.push([ym, s.produced.toFixed(2), s.fedIn.toFixed(2), s.consumedFromGrid.toFixed(2), s.consumedFromPv.toFixed(2), s.consumed.toFixed(2)].join(',')); }
      if (table === 'days') {
        if (date) { pushDay(date); }
        else { for (var m = 1; m <= 12; m++) { var ym = '2025-' + pad(m); for (var d = 1; d <= daysInMonth(ym); d++) pushDay(ym + '-' + pad(d)); } }
      } else if (table === 'months') {
        if (date) pushMonth(date); else for (var m2 = 1; m2 <= 12; m2++) pushMonth('2025-' + pad(m2));
      } else {
        ['2024', '2025'].forEach(function (y) { lines.push([y, simulateYear(y).produced.toFixed(2)].join(',')); });
      }
      var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'sunalyzer_' + table + (date ? '_' + date : '') + '.csv';
      a.click();
      return null;
    }
    return realOpen.apply(window, arguments);
  };
})();
