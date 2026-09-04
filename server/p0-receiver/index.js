'use strict';

let coreModulePromise = null;
let storeModulePromise = null;
let storeInstance = null;

function allowedOrigins() {
  return String(process.env.KA_P0_ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

async function modules() {
  coreModulePromise ||= import('./core.mjs');
  storeModulePromise ||= import('./ydb-store.mjs');
  return Promise.all([coreModulePromise, storeModulePromise]);
}

module.exports.handler = async function handler(event) {
  const [core, storage] = await modules();
  storeInstance ||= storage.createYdbEventStore();
  return core.handleEventRequest(event, {
    store: storeInstance,
    allowedOrigins: allowedOrigins()
  });
};
