import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { getTelegramLink, startTelegramLink, deleteTelegramLink } from '../src/api/telegram.js';
import { setToken } from '../src/api/client.js';

const originalFetch = globalThis.fetch;
const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
};
beforeEach(() => {
  globalThis.sessionStorage = storage();
  globalThis.localStorage = storage();
  globalThis.window = new EventTarget();
  setToken('resident-token');
});
afterEach(() => { globalThis.fetch = originalFetch; delete globalThis.sessionStorage; delete globalThis.localStorage; delete globalThis.window; });

test('telegram status, start and unlink use the authenticated contract', async () => {
  const seen = [];
  globalThis.fetch = async (path, options) => {
    seen.push([path, options.method, options.headers.Authorization]);
    if (options.method === 'POST') return Response.json({ status: 'PENDING', deep_link: 'https://t.me/example_bot?start=code', expires_at: '2026-11-10T10:10:00+09:00' }, { status: 201 });
    if (options.method === 'DELETE') return new Response(null, { status: 204 });
    return Response.json({ status: 'LINKED', linked_at: '2026-11-10T10:00:00+09:00', expires_at: null });
  };
  assert.equal((await getTelegramLink()).status, 'LINKED');
  assert.equal((await startTelegramLink()).status, 'PENDING');
  assert.equal(await deleteTelegramLink(), null);
  assert.deepEqual(seen, ['GET', 'POST', 'DELETE'].map((method) => ['/api/me/telegram', method, 'Bearer resident-token']));
});

test('connection errors preserve status and code for the UI', async () => {
  for (const [status, code] of [[409, 'TELEGRAM_ALREADY_LINKED'], [503, 'SERVICE_UNAVAILABLE']]) {
    globalThis.fetch = async () => Response.json({ code, message: '연결할 수 없어요.' }, { status });
    await assert.rejects(startTelegramLink(), { status, code });
  }
});
