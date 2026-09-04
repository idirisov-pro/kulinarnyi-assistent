import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const source = fs.readFileSync(path.join(root, 'p0-telemetry.js'), 'utf8');

class StorageMock {
  constructor(seed = {}) {
    this.data = new Map(Object.entries(seed));
  }

  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }

  setItem(key, value) {
    this.data.set(String(key), String(value));
  }

  removeItem(key) {
    this.data.delete(String(key));
  }

  clear() {
    this.data.clear();
  }
}

let idCounter = 0;
function nextUuid() {
  idCounter += 1;
  return `00000000-0000-4000-8000-${String(idCounter).padStart(12, '0')}`;
}

function makeContext({
  localStorage = new StorageMock(),
  sessionStorage = new StorageMock(),
  search = '',
  referrer = '',
  fetchImpl = async () => ({ ok: true })
} = {}) {
  const window = {};
  const location = {
    search,
    origin: 'https://assistant.example',
    protocol: 'https:'
  };
  const document = { referrer };
  const context = {
    window,
    localStorage,
    sessionStorage,
    location,
    document,
    URL,
    URLSearchParams,
    Date,
    Math,
    JSON,
    Object,
    Array,
    Set,
    Map,
    Number,
    String,
    Boolean,
    Promise,
    fetch: fetchImpl,
    setTimeout,
    clearTimeout,
    crypto: { randomUUID: nextUuid }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

function queue(storage) {
  return JSON.parse(storage.getItem('ka_p0_event_queue_v1') || '[]');
}

function immediate() {
  return new Promise(resolve => setImmediate(resolve));
}

// 1. Без настроенного приёмника модуль не делает сетевых запросов.
{
  const local = new StorageMock();
  const session = new StorageMock();
  let fetchCalls = 0;
  const context = makeContext({
    localStorage: local,
    sessionStorage: session,
    search: '?utm_source=instagram&utm_medium=reels&utm_campaign=p0',
    referrer: 'https://www.instagram.com/some/path?private=value',
    fetchImpl: async () => {
      fetchCalls += 1;
      return { ok: true };
    }
  });

  const diagnostics = context.window.KA_TELEMETRY.start({ appVersion: 'test', endpoint: '' });
  assert.equal(diagnostics.endpointEnabled, false);
  assert.equal(fetchCalls, 0);

  const events = queue(local);
  assert.equal(events.length, 1);
  assert.equal(events[0].event, 'session_started');
  assert.ok(events[0].event_id.startsWith('event_'));
  assert.equal(events[0].source.utm_source, 'instagram');
  assert.equal(events[0].source.utm_medium, 'reels');
  assert.equal(events[0].source.utm_campaign, 'p0');
  assert.equal(events[0].source.referrer_host, 'www.instagram.com');
  assert.equal(JSON.stringify(events).includes('/some/path'), false);
  assert.equal(JSON.stringify(events).includes('private=value'), false);
}

// 2. Разрешённое событие ставится в очередь, неизвестное — отвергается.
{
  const local = new StorageMock();
  const context = makeContext({ localStorage: local });
  context.window.KA_TELEMETRY.start({ appVersion: 'test', endpoint: '' });
  assert.equal(context.window.KA_TELEMETRY.track('ingredient_added', { ingredient_id: 'potato' }), true);
  assert.equal(context.window.KA_TELEMETRY.track('invented_event', { any: 'value' }), false);
  const events = queue(local);
  assert.equal(events.filter(item => item.event === 'ingredient_added').length, 1);
  assert.equal(events.some(item => item.event === 'invented_event'), false);
}

// 3. Источник относится к конкретному сеансу, а не навечно к установке.
{
  const local = new StorageMock();
  const first = makeContext({
    localStorage: local,
    sessionStorage: new StorageMock(),
    search: '?utm_source=instagram&utm_campaign=first'
  });
  first.window.KA_TELEMETRY.start({ appVersion: 'test', endpoint: '' });
  first.window.KA_TELEMETRY.track('search_submitted', { selected_count: 3 });

  const second = makeContext({
    localStorage: local,
    sessionStorage: new StorageMock(),
    search: '?utm_source=vk&utm_campaign=second'
  });
  second.window.KA_TELEMETRY.start({ appVersion: 'test', endpoint: '' });
  second.window.KA_TELEMETRY.track('search_submitted', { selected_count: 4 });

  const searchEvents = queue(local).filter(item => item.event === 'search_submitted');
  assert.equal(searchEvents.length, 2);
  assert.equal(searchEvents[0].source.utm_source, 'instagram');
  assert.equal(searchEvents[1].source.utm_source, 'vk');
  assert.equal(queue(local).some(item => item.event === 'session_returned'), true);
}

// 4. Новое событие, возникшее во время отправки старой партии, не теряется.
{
  const local = new StorageMock();
  let resolveFetch;
  let fetchStarted = false;
  const context = makeContext({
    localStorage: local,
    fetchImpl: () => {
      fetchStarted = true;
      return new Promise(resolve => { resolveFetch = resolve; });
    }
  });

  context.window.KA_TELEMETRY.start({ appVersion: 'test', endpoint: '' });
  context.window.KA_TELEMETRY.track('ingredient_added', { ingredient_id: 'potato' });
  context.window.KA_TELEMETRY.configureEndpoint('https://collector.example/events');

  while (!fetchStarted) await immediate();
  context.window.KA_TELEMETRY.track('ingredient_added', { ingredient_id: 'onion' });
  resolveFetch({ ok: true });
  await immediate();
  await immediate();

  const remaining = queue(local);
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].event, 'ingredient_added');
  assert.equal(remaining[0].properties.ingredient_id, 'onion');
}

// 5. Неуспешный ответ приёмника не удаляет события из очереди.
{
  const local = new StorageMock();
  let fetchCalls = 0;
  const context = makeContext({
    localStorage: local,
    fetchImpl: async () => {
      fetchCalls += 1;
      return { ok: false };
    }
  });

  context.window.KA_TELEMETRY.start({ appVersion: 'test', endpoint: '' });
  context.window.KA_TELEMETRY.track('recipe_opened', { recipe_id: 'test_recipe' });
  const before = queue(local).length;
  context.window.KA_TELEMETRY.configureEndpoint('https://collector.example/events');
  await immediate();
  await immediate();
  assert.equal(fetchCalls, 1);
  assert.equal(queue(local).length, before);
}

console.log(JSON.stringify({ passed: true, checks: 5 }, null, 2));
