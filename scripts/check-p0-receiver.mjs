import assert from 'node:assert/strict';
import {
  handleEventRequest,
  normalizeEvent,
  RECEIVER_LIMITS
} from '../server/p0-receiver/core.mjs';

function baseEvent(overrides = {}) {
  return {
    event_id: 'event_123',
    event: 'search_submitted',
    occurred_at: '2026-09-04T12:00:00.000Z',
    install_id: 'install_123',
    session_id: 'session_123',
    app_version: '3.1-beta.1',
    source: {
      utm_source: 'vk',
      utm_medium: 'clip',
      utm_campaign: 'p0'
    },
    properties: {
      selected_count: 4,
      max_time: 45,
      servings: 3,
      mode: 'strict'
    },
    ...overrides
  };
}

function request(events, origin = 'https://idirisov-pro.github.io') {
  return {
    httpMethod: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ events }),
    isBase64Encoded: false
  };
}

const allowedOrigins = ['https://idirisov-pro.github.io'];

// 1. Корректная партия проходит нормализацию и сохраняется.
{
  const saved = [];
  const store = {
    async saveEvents(events) {
      saved.push(...events);
      return { stored: events.length };
    }
  };
  const response = await handleEventRequest(request([baseEvent()]), {
    store,
    allowedOrigins,
    now: () => '2026-09-04T12:00:01.000Z'
  });
  assert.equal(response.statusCode, 202);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].server_received_at, '2026-09-04T12:00:01.000Z');
  assert.equal(saved[0].event, 'search_submitted');
}

// 2. Неизвестное событие и feedback_submitted не принимаются этим приёмником.
{
  const unknown = normalizeEvent(baseEvent({ event: 'invented_event' }));
  assert.equal(unknown.ok, false);
  const feedback = normalizeEvent(baseEvent({ event: 'feedback_submitted' }));
  assert.equal(feedback.ok, false);
}

// 3. Сервер повторно ограничивает размер партии, даже если клиент уже делает это сам.
{
  const events = Array.from({ length: RECEIVER_LIMITS.maxBatch + 1 }, (_, index) => baseEvent({ event_id: `event_${index}` }));
  const response = await handleEventRequest(request(events), {
    store: { saveEvents: async () => ({ stored: 0 }) },
    allowedOrigins
  });
  assert.equal(response.statusCode, 413);
}

// 4. Origin-фильтр блокирует обычный браузерный запрос с чужого домена.
{
  const response = await handleEventRequest(request([baseEvent()], 'https://example.org'), {
    store: { saveEvents: async () => ({ stored: 1 }) },
    allowedOrigins
  });
  assert.equal(response.statusCode, 403);
  assert.equal(response.headers['access-control-allow-origin'], 'null');
}

// 5. Предварительный CORS-запрос не требует хранилища.
{
  const response = await handleEventRequest({
    httpMethod: 'OPTIONS',
    headers: { origin: 'https://idirisov-pro.github.io' },
    body: ''
  }, { allowedOrigins });
  assert.equal(response.statusCode, 204);
  assert.equal(response.headers['access-control-allow-origin'], 'https://idirisov-pro.github.io');
}

// 6. Ошибка постоянного хранилища не подтверждается клиенту как успешная запись.
{
  const response = await handleEventRequest(request([baseEvent()]), {
    store: { saveEvents: async () => { throw new Error('db unavailable'); } },
    allowedOrigins
  });
  assert.equal(response.statusCode, 503);
}

console.log(JSON.stringify({ passed: true, checks: 6 }, null, 2));
