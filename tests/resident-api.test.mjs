import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, getToken, request, setToken, tokenKey } from '../src/api/client.js';
import { login } from '../src/api/auth.js';
import { getEvents, getEvent, saveResponse, submitReport } from '../src/api/events.js';
import { kstDayStart } from '../src/lib/dateFilters.js';

const eventId = '8f1c2a7e-3b9d-4f4e-9a51-2c6d0e7b1a10';
const originalFetch = globalThis.fetch;

const createStorage = () => {
  const storage = new Map();
  return { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) };
};

beforeEach(() => {
  globalThis.sessionStorage = createStorage();
  globalThis.localStorage = createStorage();
  globalThis.window = new EventTarget();
});
afterEach(() => { globalThis.fetch = originalFetch; delete globalThis.sessionStorage; delete globalThis.localStorage; delete globalThis.window; });

test('a real login survives a reload of the same tab and logout removes its token', async () => {
  setToken('real-token');
  assert.equal(localStorage.getItem(tokenKey), null);
  assert.equal(sessionStorage.getItem(tokenKey), 'real-token');
  const reloadedClient = await import('../src/api/client.js?reload');
  assert.equal(reloadedClient.getToken(), 'real-token');
  reloadedClient.setToken(null);
  assert.equal(getToken(), null);
  assert.equal(sessionStorage.getItem(tokenKey), null);
});

test('independent tabs do not share login or logout state', () => {
  setToken('first-tab-token');
  const firstTab = sessionStorage;
  globalThis.sessionStorage = createStorage();
  assert.equal(getToken(), null);
  setToken('second-tab-token');
  assert.equal(firstTab.getItem(tokenKey), 'first-tab-token');
  setToken(null);
  assert.equal(getToken(), null);
  globalThis.sessionStorage = firstTab;
  assert.equal(getToken(), 'first-tab-token');
});

test('legacy persistent tokens are removed without restoring a login or replacing the current tab', () => {
  localStorage.setItem(tokenKey, 'legacy-token');
  localStorage.setItem('unrelated-setting', 'keep');
  assert.equal(getToken(), null);
  assert.equal(sessionStorage.getItem(tokenKey), null);
  assert.equal(localStorage.getItem(tokenKey), null);
  sessionStorage.setItem(tokenKey, 'current-tab-token');
  localStorage.setItem(tokenKey, 'another-legacy-token');
  assert.equal(getToken(), 'current-tab-token');
  assert.equal(localStorage.getItem(tokenKey), null);
  assert.equal(localStorage.getItem('unrelated-setting'), 'keep');
});

test('a blocked localStorage does not prevent session login or logout', () => {
  globalThis.localStorage = {
    removeItem: () => { throw new DOMException('Access denied', 'SecurityError'); },
  };
  setToken('real-token');
  assert.equal(getToken(), 'real-token');
  setToken(null);
  assert.equal(getToken(), null);
});

test('a demo session stays in its tab and does not persist as real authentication', () => {
  setToken('real-token');
  setToken('demo-resident');
  assert.equal(localStorage.getItem(tokenKey), null);
  assert.equal(sessionStorage.getItem(tokenKey), 'demo-resident');
  globalThis.sessionStorage = createStorage();
  assert.equal(getToken(), null);
});

test('date filters use whole-second KST boundaries across month, year and leap-day changes', async () => {
  for (const [day, next] of [
    ['2026-11-07', '2026-11-08'],
    ['2026-11-30', '2026-12-01'],
    ['2026-12-31', '2027-01-01'],
    ['2028-02-28', '2028-02-29'],
    ['2028-02-29', '2028-03-01'],
  ]) {
    const from = kstDayStart(day);
    const to = kstDayStart(day, 1);
    assert.equal(from, `${day}T00:00:00+09:00`);
    assert.equal(to, `${next}T00:00:00+09:00`);
    assert.equal(Date.parse(to) - Date.parse(from), 86400000);
    globalThis.fetch = async (path) => {
      const query = new URL(path, 'http://local').searchParams;
      assert.equal(query.get('from'), from);
      assert.equal(query.get('to'), to);
      return Response.json({ items: [], page: 0, size: 20, total_count: 0 });
    };
    await getEvents({ from, to });
  }
});

test('login sends the contract fields without a previous Bearer token', async () => {
  setToken('old-token');
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/auth/login');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { login_id: 'resident201', password: 'password' });
    assert.equal(options.headers.Authorization, undefined);
    return Response.json({ access_token: 'new-token', user: { role: 'RESIDENT' } });
  };
  assert.equal((await login('resident201', 'password')).access_token, 'new-token');
});

test('protected 401 clears authentication and notifies the UI', async () => {
  setToken('expired-token');
  let expired = false;
  window.addEventListener('villa-guard:expired', () => { expired = true; });
  globalThis.fetch = async (_, options) => {
    assert.equal(options.headers.Authorization, 'Bearer expired-token');
    return Response.json({ code: 'UNAUTHORIZED', message: '로그인이 필요해요.' }, { status: 401 });
  };
  await assert.rejects(request('/api/me'), (error) => error instanceof ApiError && error.status === 401);
  assert.equal(getToken(), null);
  assert.equal(expired, true);
});

test('public login failure does not expire a different existing session', async () => {
  setToken('current-token');
  globalThis.fetch = async () => Response.json({ code: 'LOGIN_FAILED', message: '아이디 또는 비밀번호를 확인해 주세요.' }, { status: 401 });
  await assert.rejects(login('wrong', 'wrong'), { code: 'LOGIN_FAILED' });
  assert.equal(getToken(), 'current-token');
});

test('an old request cannot clear a newer session', async () => {
  setToken('old-token');
  globalThis.fetch = async () => { setToken('new-token'); return Response.json({ code: 'UNAUTHORIZED' }, { status: 401 }); };
  await assert.rejects(request('/api/me'));
  assert.equal(getToken(), 'new-token');
});

test('network failures remain errors and never fall back to demo data', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(getEvents({ page: 0, size: 20 }), (error) => error.status === 0 && /서버에 연결/.test(error.message));
});

test('validation errors preserve server field information', async () => {
  globalThis.fetch = async () => Response.json({ code: 'INVALID_REQUEST', message: '입력을 확인해 주세요.', errors: [{ field: 'reason', reason: '필수 항목이에요.' }] }, { status: 400 });
  await assert.rejects(submitReport(eventId, {}), (error) => error.fields[0].field === 'reason');
});

test('aborted requests keep their abort error', async () => {
  globalThis.fetch = async () => { throw new DOMException('aborted', 'AbortError'); };
  await assert.rejects(request('/api/me'), { name: 'AbortError' });
});

test('successful HTML responses are reported as a misconfigured API', async () => {
  globalThis.fetch = async () => new Response('<html>SPA fallback</html>', { status: 200 });
  await assert.rejects(request('/api/me'), (error) => /API 연결 설정/.test(error.message));
});

test('query parameters encode KST offsets and use the resident endpoint', async () => {
  globalThis.fetch = async (path) => {
    assert.ok(path.startsWith('/api/me/events?'));
    assert.ok(path.includes('%2B09%3A00'));
    assert.equal(new URL(path, 'http://local').searchParams.get('from'), '2026-11-02T00:00:00+09:00');
    return Response.json({ items: [], page: 0, size: 20, total_count: 0 });
  };
  await getEvents({ from: '2026-11-02T00:00:00+09:00' });
});

test('NORMAL is submitted only through the report contract', async () => {
  globalThis.fetch = async (path, options) => {
    assert.equal(path, `/api/events/${eventId}/report`);
    assert.deepEqual(JSON.parse(options.body), { reason: 'RESIDENT_ENTRY', detail: null, training_consent: false });
    return Response.json({ response_locked: true }, { status: 201 });
  };
  await submitReport(eventId, { reason: 'RESIDENT_ENTRY', detail: null, training_consent: false });
});

test('real U03 data keeps personal viewing separate from household responses and preserves zone_id', async () => {
  setToken('real-resident-token');
  const items = [
    { event_id: eventId, zone_id: 'zone-201-door', zone_name: '201호 현관', viewed: false, confirmed: true, response: 'UNSURE', report_status: null, verdict: null },
    { event_id: '3a7d1c4b-9e2f-4a8b-b1c6-5d0e7f2a9b34', zone_id: 'zone-201-door', zone_name: '201호 현관', viewed: true, confirmed: false, response: null, report_status: null, verdict: null },
  ];
  globalThis.fetch = async (path, options) => {
    assert.equal(new URL(path, 'http://local').pathname, '/api/me/events');
    assert.equal(options.headers.Authorization, 'Bearer real-resident-token');
    assert.equal(options.method, 'GET');
    return Response.json({ items, page: 0, size: 20, total_count: 2 });
  };
  const data = await getEvents({ page: 0, size: 20 });
  assert.deepEqual(data.items, items);
  assert.equal(sessionStorage.getItem('villa-guard-demo-events'), null);
});

test('demo detail records viewing without confirming or changing a response', async () => {
  setToken('demo-resident');
  const event = await getEvent(eventId);
  assert.ok(event.my_view.first_viewed_at);
  assert.equal(event.confirmed, false);
  assert.equal(event.current_response, null);
  assert.equal((await getEvents({ viewed: 'true' })).total_count, 1);
});

test('responding can be changed before a report; opening the report target does not save NORMAL', async () => {
  setToken('demo-resident');
  await saveResponse(eventId, 'SUSPICIOUS');
  assert.equal((await getEvent(eventId)).current_response.response, 'SUSPICIOUS');
  await saveResponse(eventId, 'UNSURE');
  const event = await getEvent(eventId);
  assert.equal(event.current_response.response, 'UNSURE');
  assert.equal(event.report, null);
  assert.equal(event.response_locked, false);
  await assert.rejects(saveResponse(eventId, 'NORMAL'), (error) => error.status === 400);
});

test('report saves NORMAL and consent atomically and prevents later changes', async () => {
  setToken('demo-resident');
  const result = await submitReport(eventId, { reason: 'VISITOR_DELIVERY', detail: '택배 기사님', training_consent: false });
  assert.equal(result.current_response.response, 'NORMAL');
  assert.equal(result.confirmed, true);
  assert.equal(result.report.training_consent, false);
  assert.equal(result.report_status, 'PENDING');
  assert.equal(result.response_locked, true);
  await assert.rejects(saveResponse(eventId, 'SUSPICIOUS'), { code: 'RESPONSE_LOCKED' });
  await assert.rejects(submitReport(eventId, { reason: 'OTHER', training_consent: true }), { code: 'REPORT_ALREADY_EXISTS' });
  assert.equal((await getEvent(eventId)).report.training_consent, false);
});

test('demo date, action and viewed filters and page counts match the contract', async () => {
  setToken('demo-resident');
  const result = await getEvents({ from: '2026-11-02T00:00:00+09:00', to: '2026-11-03T00:00:00+09:00', action: 'INTRUSION_ATTEMPT', viewed: 'false', size: 1, page: 1 });
  assert.equal(result.total_count, 2);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].zone_type, 'PRIVATE');
  assert.equal((await getEvents({ action: 'WALL_CLIMBING' })).total_count, 0);
});
