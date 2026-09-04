import { Driver } from '@ydbjs/core';
import { EnvironCredentialsProvider } from '@ydbjs/auth/environ';
import { query } from '@ydbjs/query';

const DEFAULT_TABLE = 'p0_events';
const SAFE_TABLE_NAME = /^[A-Za-z0-9_]{1,64}$/;

let driverPromise = null;
let sqlClient = null;

function connectionString() {
  const value = String(process.env.YDB_CONNECTION_STRING || '').trim();
  if (!value) throw new Error('YDB_CONNECTION_STRING is required');
  return value;
}

async function getSqlClient() {
  if (sqlClient) return sqlClient;
  if (!driverPromise) {
    driverPromise = (async () => {
      const cs = connectionString();
      const credentials = new EnvironCredentialsProvider(cs);
      const driver = new Driver(cs, {
        credentialsProvider: credentials,
        secureOptions: credentials.secureOptions
      });
      await driver.ready();
      return driver;
    })();
  }
  const driver = await driverPromise;
  sqlClient = query(driver);
  return sqlClient;
}

function tableName(value) {
  const name = String(value || DEFAULT_TABLE).trim();
  if (!SAFE_TABLE_NAME.test(name)) throw new Error('Invalid YDB table name');
  return name;
}

export function createYdbEventStore(options = {}) {
  const targetTable = tableName(options.tableName || process.env.KA_P0_EVENTS_TABLE || DEFAULT_TABLE);

  return {
    async saveEvents(events) {
      const sql = await getSqlClient();
      for (const event of events) {
        const payloadJson = JSON.stringify(event);
        await sql`
          UPSERT INTO ${sql.identifier(targetTable)}
            (event_id, event_name, occurred_at, server_received_at, install_id, session_id, app_version, payload_json)
          VALUES
            (${event.event_id}, ${event.event}, ${event.occurred_at}, ${event.server_received_at}, ${event.install_id}, ${event.session_id}, ${event.app_version}, ${payloadJson})
        `.idempotent(true);
      }
      return { stored: events.length };
    }
  };
}
