/* SolarSaathi API client + server-state hydration.
   When index.html is served by server/server.js, the backend injects
   window.__SS_BOOTSTRAP__ before this file runs. The existing SPA can keep
   reading localStorage synchronously; this script hydrates that cache from
   the server snapshot. All mutations then go through window.SSAPI. */
(function () {
  'use strict';

  // Tunnel-ready: allow absolute backend URL.
  // Priority: window.__SS_API_BASE__ > localStorage ss.apiBase > ?api= > '' (same-origin).
  // Example: window.__SS_API_BASE__ = 'https://xyz.trycloudflare.com'
  const bootstrap = window.__SS_BOOTSTRAP__ || null;
  function resolveApiBase() {
    try {
      const qs = new URLSearchParams(window.location.search || '');
      const q = qs.get('api');
      if (q) {
        const clean = q.replace(/\/+$/, '');
        try { localStorage.setItem('ss.apiBase', clean); } catch (_) { /* ignore */ }
        return clean;
      }
    } catch (_) { /* ignore */ }
    if (window.__SS_API_BASE__) return String(window.__SS_API_BASE__).replace(/\/+$/, '');
    try {
      const saved = localStorage.getItem('ss.apiBase');
      if (saved) return String(saved).replace(/\/+$/, '');
    } catch (_) { /* ignore */ }
    return '';
  }
  const API_BASE = resolveApiBase();
  window.__SS_API_BASE__ = API_BASE || window.__SS_API_BASE__ || '';
  // Helper for UI: SSSetApiBase('https://xyz.trycloudflare.com') then reload.
  window.SSSetApiBase = function (url) {
    try {
      if (!url) localStorage.removeItem('ss.apiBase');
      else localStorage.setItem('ss.apiBase', String(url).replace(/\/+$/, ''));
    } catch (_) { /* ignore */ }
  };

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* storage may be unavailable */ }
  }

  function remove(key) {
    try { localStorage.removeItem(key); } catch (_) { /* ignore */ }
  }

  if (bootstrap) {
    if (bootstrap.user) write('solarSaathi.auth.v3', bootstrap.user);
    else remove('solarSaathi.auth.v3');

    write('solarSaathi.users.v3', bootstrap.users || []);
    write('solarSaathi.v3', bootstrap.store || { bookings: [], payments: [], requests: [], notifications: [] });
    write('solarSaathi.seeded.v3', '1');

    if (bootstrap.vendor && bootstrap.user) {
      write('solarSaathi.vendor.v1', { [bootstrap.user.id]: bootstrap.vendor });
    } else {
      remove('solarSaathi.vendor.v1');
    }

    if (bootstrap.ops) write('solarSaathi.ops.v1', bootstrap.ops);
    else remove('solarSaathi.ops.v1');

    window.__SS_SERVER_MODE__ = true;
  }

  function setOffline() {
    try { window.__SS_SERVER_MODE__ = false; } catch (_) { /* ignore */ }
    try { if (window.SSAPI) window.SSAPI.enabled = false; } catch (_) { /* ignore */ }
    try {
      if (typeof document !== 'undefined') {
        const pill = document.querySelector('#ssModePill');
        if (pill) {
          pill.textContent = '● Local demo mode';
          pill.style.background = '#92400e';
          pill.style.color = '#fff';
        }
      }
    } catch (_) { /* ignore */ }
  }

  function isNetworkError(err) {
    if (err instanceof TypeError) return true;
    return /failed to fetch|networkerror|load failed|network request failed/i.test((err && err.message) || '');
  }

  // Live server-mode check. Starts true when the backend injected a
  // bootstrap snapshot; flips permanently to false if the backend
  // becomes unreachable, so the SPA falls back to local demo data.
  window.SSServerMode = function () {
    return !!(window.SSAPI && window.SSAPI.enabled && window.__SS_SERVER_MODE__ !== false);
  };
  window.SSSetOffline = setOffline;

  async function request(path, options = {}) {
    const method = options.method || 'GET';
    const headers = { Accept: 'application/json' };
    let body;
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }
    const url = (API_BASE || '') + '/api' + path;
    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        body,
        credentials: 'include',
        cache: 'no-store'
      });
    } catch (err) {
      if (isNetworkError(err)) {
        setOffline();
        try { err.offline = true; } catch (_) { /* ignore */ }
      }
      throw err;
    }
    const raw = await res.text();
    let data = {};
    if (raw) {
      try { data = JSON.parse(raw); } catch (_) { data = { error: raw }; }
    }
    if (!res.ok) {
      const error = new Error(data.error || ('Request failed (' + res.status + ')'));
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  function download(path, filename) {
    return fetch((API_BASE || '') + '/api' + path, { credentials: 'include', cache: 'no-store' })
      .catch(err => {
        if (isNetworkError(err)) {
          setOffline();
          try { err.offline = true; } catch (_) { /* ignore */ }
        }
        throw err;
      })
      .then(async res => {
        if (!res.ok) throw new Error('Download failed (' + res.status + ')');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'solarsaathi-export.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
  }

  window.SSAPI = {
    enabled: !!bootstrap || !!API_BASE,
    apiBase: API_BASE,
    bootstrap,
    request,
    get: path => request(path),
    post: (path, body) => request(path, { method: 'POST', body }),
    patch: (path, body) => request(path, { method: 'PATCH', body }),
    del: path => request(path, { method: 'DELETE' }),
    download
  };

  // Tunnel mode: deployed frontend has no injected bootstrap, so hydrate
  // from GET <API_BASE>/api/bootstrap once, then reload once.
  if (!bootstrap && API_BASE && !window.__SS_BOOTSTRAP_FETCHED__) {
    window.__SS_BOOTSTRAP_FETCHED__ = true;
    window.__SS_SERVER_MODE__ = true;
    fetch(API_BASE + '/api/bootstrap', { credentials: 'include', cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) { setOffline(); return; }
        if (data.user) write('solarSaathi.auth.v3', data.user);
        write('solarSaathi.users.v3', data.users || []);
        write('solarSaathi.v3', data.store || { bookings: [], payments: [], requests: [], notifications: [] });
        write('solarSaathi.seeded.v3', '1');
        if (data.vendor && data.user) write('solarSaathi.vendor.v1', { [data.user.id]: data.vendor });
        if (data.ops) write('solarSaathi.ops.v1', data.ops);
        try {
          if (!sessionStorage.getItem('ss.bootstrapped')) {
            sessionStorage.setItem('ss.bootstrapped', '1');
            location.reload();
          }
        } catch (_) { /* ignore */ }
      })
      .catch(() => setOffline());
  }
})();
