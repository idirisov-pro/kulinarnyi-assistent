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
  'cooking_completed'
]);

const MAX_BATCH = 50;
const MAX_PROPERTY_DEPTH = 3;
const MAX_ARRAY_ITEMS = 30;
const MAX_OBJECT_KEYS = 30;
const MAX_STRING = 160;
const SAFE_ID = /^[A-Za-z0-9._:-]{1,200}$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanValue(value, depth = 0) {
  if (depth > MAX_PROPERTY_DEPTH) return undefined;
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') return value.slice(0, MAX_STRING);
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map(item => cleanValue(item, depth + 1))
      .filter(item => item !== undefined);
  }
  if (isPlainObject(value)) {
    const output = {};
    for (const [key, item] of Object.entries(value).slice(0, MAX_OBJECT_KEYS)) {
      const cleaned = cleanValue(item, depth + 1);
      if (cleaned !== undefined) output[String(key).slice(0, 80)] = cleaned;
    }
    return output;
  }
  return undefined;
}

function normalizeDate(value) {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeSource(value) {
  const source = isPlainObject(value) ? value : {};
  const safe = key => typeof source[key] === 'string' ? source[key].slice(0, 120) : null;
  return {
    utm_source: safe('utm_source'),
    utm_medium: safe('utm_medium'),
    utm_campaign: safe('utm_campaign'),
    referrer_host: safe('referrer_host')
  };
}

export function normalizeEvent(input, receivedAt = new Date().toISOString()) {
  if (!isPlainObject(input)) return { ok: false, error: 'event_not_object' };
  if (!SAFE_ID.test(String(input.event_id || ''))) return { ok: false, error: 'invalid_event_id' };
  if (!ALLOWED_EVENTS.has(input.event)) return { ok: false, error: 'unknown_event' };
  if (!SAFE_ID.test(String(input.install_id || ''))) return { ok: false, error: 'invalid_install_id' };
  if (!SAFE_ID.test(String(input.session_id || ''))) return { ok: false, error: 'invalid_session_id' };

  const occurredAt = normalizeDate(input.occurred_at);
  if (!occurredAt) return { ok: false, error: 'invalid_occurred_at' };

  return {
    ok: true,
    event: {
      event_id: String(input.event_id),
      event: input.event,
      occurred_at: occurredAt,
      server_received_at: normalizeDate(receivedAt) || new Date().toISOString(),
      install_id: String(input.install_id),
      session_id: String(input.session_id),
      app_version: typeof input.app_version === 'string' ? input.app_version.slice(0, 80) : 'unknown',
      source: normalizeSource(input.source),
      properties: cleanValue(isPlainObject(input.properties) ? input.properties : {}) || {}
    }
  };
}

export function validateBatch(payload, receivedAt = new Date().toISOString()) {
  if (!isPlainObject(payload) || !Array.isArray(payload.events)) {
    return { ok: false, status: 400, error: 'events_array_required' };
  }
  if (payload.events.length < 1) {
    return { ok: false, status: 400, error: 'empty_batch' };
  }
  if (payload.events.length > MAX_BATCH) {
    return { ok: false, status: 413, error: 'batch_too_large' };
  }

  const normalized = [];
  for (let index = 0; index < payload.events.length; index += 1) {
    const result = normalizeEvent(payload.events[index], receivedAt);
    if (!result.ok) {
      return {
        ok: false,
        status: 400,
        error: result.error,
        event_index: index
      };
    }
    normalized.push(result.event);
  }

  return { ok: true, events: normalized };
}

export function parseRequestBody(event) {
  if (!event || typeof event !== 'object') return { ok: false, status: 400, error: 'invalid_request' };
  let raw = event.body;
  if (typeof raw !== 'string') return { ok: false, status: 400, error: 'body_required' };

  if (event.isBase64Encoded) {
    try {
      raw = Buffer.from(raw, 'base64').toString('utf8');
    } catch {
      return { ok: false, status: 400, error: 'invalid_base64' };
    }
  }

  try {
    return { ok: true, payload: JSON.parse(raw) };
  } catch {
    return { ok: false, status: 400, error: 'invalid_json' };
  }
}

export function originFromHeaders(headers = {}) {
  const entries = Object.entries(headers || {});
  const found = entries.find(([key]) => key.toLowerCase() === 'origin');
  return typeof found?.[1] === 'string' ? found[1] : null;
}

export function corsHeaders(origin, allowedOrigins = []) {
  const allowed = origin && allowedOrigins.includes(origin) ? origin : null;
  return {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': allowed || 'null',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'vary': 'Origin'
  };
}

export function makeJsonResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers
    },
    body: JSON.stringify(body),
    isBase64Encoded: false
  };
}

export async function handleEventRequest(event, { store, allowedOrigins = [], now = () => new Date().toISOString() } = {}) {
  const method = String(event?.httpMethod || event?.requestContext?.http?.method || '').toUpperCase();
  const origin = originFromHeaders(event?.headers);
  const headers = corsHeaders(origin, allowedOrigins);

  if (method === 'OPTIONS') return makeJsonResponse(204, {}, headers);
  if (method !== 'POST') return makeJsonResponse(405, { error: 'method_not_allowed' }, headers);

  if (origin && allowedOrigins.length && !allowedOrigins.includes(origin)) {
    return makeJsonResponse(403, { error: 'origin_not_allowed' }, headers);
  }
  if (!store || typeof store.saveEvents !== 'function') {
    return makeJsonResponse(503, { error: 'storage_not_configured' }, headers);
  }

  const parsed = parseRequestBody(event);
  if (!parsed.ok) return makeJsonResponse(parsed.status, { error: parsed.error }, headers);

  const validation = validateBatch(parsed.payload, now());
  if (!validation.ok) {
    const body = { error: validation.error };
    if (Number.isInteger(validation.event_index)) body.event_index = validation.event_index;
    return makeJsonResponse(validation.status, body, headers);
  }

  try {
    const saved = await store.saveEvents(validation.events);
    return makeJsonResponse(202, {
      accepted: validation.events.length,
      stored: Number(saved?.stored ?? validation.events.length),
      duplicates: Number(saved?.duplicates ?? 0)
    }, headers);
  } catch {
    return makeJsonResponse(503, { error: 'storage_unavailable' }, headers);
  }
}

export const RECEIVER_LIMITS = Object.freeze({
  maxBatch: MAX_BATCH,
  maxPropertyDepth: MAX_PROPERTY_DEPTH,
  maxArrayItems: MAX_ARRAY_ITEMS,
  maxObjectKeys: MAX_OBJECT_KEYS,
  maxStringLength: MAX_STRING
});
