(() => {
  'use strict';

  const STORAGE = {
    install: 'ka_p0_install_v1',
    queue: 'ka_p0_event_queue_v1',
    attribution: 'ka_p0_attribution_v1'
  };
  const SESSION_KEY = 'ka_p0_session_v1';
  const STARTED_KEY = 'ka_p0_session_started_v1';
  const MAX_QUEUE = 300;
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'];
  const ALLOWED_EVENTS = new Set([
    'session_started',
    'session_returned',
    'ingredient_added',
    'ingredient_removed',
    'search_submitted',
    'results_shown',
    'zero_results',
    'recipe_opened',
    'cooking_started',
    'cooking_completed',
    'feedback_submitted'
  ]);

  let appVersion = 'unknown';
  let sessionId = null;
  let installId = null;
  let endpoint = '';
  let flushing = false;

  function safeParse(raw, fallback) {
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  function randomId(prefix) {
    const raw = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    return `${prefix}_${raw}`;
  }

  function getOrCreateInstall() {
    const stored = safeParse(localStorage.getItem(STORAGE.install), null);
    const now = new Date().toISOString();
    if (stored?.id) {
      const next = { ...stored, lastSeenAt: now, sessionCount: Number(stored.sessionCount || 0) + 1 };
      localStorage.setItem(STORAGE.install, JSON.stringify(next));
      return { id: next.id, returning: true };
    }
    const created = { id: randomId('install'), firstSeenAt: now, lastSeenAt: now, sessionCount: 1 };
    localStorage.setItem(STORAGE.install, JSON.stringify(created));
    return { id: created.id, returning: false };
  }

  function getOrCreateSession() {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = randomId('session');
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  }

  function captureAttribution() {
    const params = new URLSearchParams(location.search);
    const current = safeParse(localStorage.getItem(STORAGE.attribution), {}) || {};
    const next = { ...current };
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) next[key] = value.slice(0, 120);
    }
    if (!next.referrer_host && document.referrer) {
      try {
        const referrer = new URL(document.referrer);
        if (referrer.origin !== location.origin) next.referrer_host = referrer.hostname.slice(0, 120);
      } catch { /* ignore malformed referrer */ }
    }
    localStorage.setItem(STORAGE.attribution, JSON.stringify(next));
    return next;
  }

  function cleanValue(value, depth = 0) {
    if (depth > 3) return undefined;
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    if (typeof value === 'string') return value.slice(0, 160);
    if (Array.isArray(value)) return value.slice(0, 30).map(item => cleanValue(item, depth + 1)).filter(item => item !== undefined);
    if (typeof value === 'object') {
      const output = {};
      Object.entries(value).slice(0, 30).forEach(([key, item]) => {
        const cleaned = cleanValue(item, depth + 1);
        if (cleaned !== undefined) output[String(key).slice(0, 80)] = cleaned;
      });
      return output;
    }
    return undefined;
  }

  function queue() {
    const value = safeParse(localStorage.getItem(STORAGE.queue), []);
    return Array.isArray(value) ? value : [];
  }

  function saveQueue(items) {
    localStorage.setItem(STORAGE.queue, JSON.stringify(items.slice(-MAX_QUEUE)));
  }

  function sourceContext() {
    const source = safeParse(localStorage.getItem(STORAGE.attribution), {}) || {};
    return {
      utm_source: source.utm_source || null,
      utm_medium: source.utm_medium || null,
      utm_campaign: source.utm_campaign || null,
      referrer_host: source.referrer_host || null
    };
  }

  function track(eventName, properties = {}) {
    try {
      if (!ALLOWED_EVENTS.has(eventName) || !installId || !sessionId) return false;
      const event = {
        event: eventName,
        occurred_at: new Date().toISOString(),
        install_id: installId,
        session_id: sessionId,
        app_version: appVersion,
        source: sourceContext(),
        properties: cleanValue(properties) || {}
      };
      const items = queue();
      items.push(event);
      saveQueue(items);
      if (endpoint) void flush();
      return true;
    } catch {
      return false;
    }
  }

  async function flush() {
    if (!endpoint || flushing) return false;
    const items = queue();
    if (!items.length) return true;
    flushing = true;
    const batch = items.slice(0, 50);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        credentials: 'omit',
        keepalive: true
      });
      if (!response.ok) return false;
      saveQueue(items.slice(batch.length));
      if (queue().length) setTimeout(() => void flush(), 500);
      return true;
    } catch {
      return false;
    } finally {
      flushing = false;
    }
  }

  function start(options = {}) {
    try {
      appVersion = String(options.appVersion || appVersion).slice(0, 80);
      endpoint = typeof options.endpoint === 'string' ? options.endpoint.trim() : '';
      captureAttribution();
      const install = getOrCreateInstall();
      installId = install.id;
      sessionId = getOrCreateSession();
      if (!sessionStorage.getItem(STARTED_KEY)) {
        sessionStorage.setItem(STARTED_KEY, '1');
        track('session_started', { returning: install.returning });
        if (install.returning) track('session_returned', {});
      }
      if (endpoint) void flush();
      return { installId, sessionId, endpointEnabled: Boolean(endpoint) };
    } catch {
      return { installId: null, sessionId: null, endpointEnabled: false };
    }
  }

  function configureEndpoint(value) {
    endpoint = typeof value === 'string' ? value.trim() : '';
    if (endpoint) void flush();
  }

  function getDiagnostics() {
    return {
      installId,
      sessionId,
      queuedEvents: queue().length,
      endpointEnabled: Boolean(endpoint)
    };
  }

  window.KA_TELEMETRY = Object.freeze({
    start,
    track,
    flush,
    configureEndpoint,
    getDiagnostics
  });
})();