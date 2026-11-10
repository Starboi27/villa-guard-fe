import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkApi } from '../scripts/check-api.mjs';

const eventId = '8f1c2a7e-3b9d-4f4e-9a51-2c6d0e7b1a10';
const item = { event_id: eventId, started_at: '2026-11-09T10:00:00+09:00', zone_id: 'zone-201-door', zone_name: '201호 현관', level: 'SUSPECT', action: 'INTRUSION_ATTEMPT', viewed: false, confirmed: true, response: 'UNSURE', report_status: null, verdict: null };
const list = (items) => ({ items, page: 0, size: 20, total_count: items.length });

test('live API checker logs in, validates U03 filters and optionally reads U04 without submitting responses', async () => {
  const calls = [];
  const checks = [];
  await checkApi({ loginId: 'resident201', password: 'test-password', includeDetail: true, onCheck: (message) => checks.push(message), fetchImpl: async (url, options) => {
    calls.push([url.pathname, options.method]);
    if (url.pathname === '/api/auth/login') {
      assert.deepEqual(JSON.parse(options.body), { login_id: 'resident201', password: 'test-password' });
      assert.equal(options.headers.Authorization, undefined);
      return Response.json({ access_token: 'test-token', user: { role: 'RESIDENT' } });
    }
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    if (url.pathname === '/api/me') return Response.json({ role: 'RESIDENT' });
    if (url.pathname === '/api/me/events') {
      const viewed = url.searchParams.get('viewed');
      return Response.json(list(viewed === 'true' ? [] : [item]));
    }
    assert.equal(url.pathname, `/api/events/${eventId}`);
    return Response.json({ event_id: eventId, confirmed: true, response_locked: false, current_response: { response: 'UNSURE' }, my_view: { first_viewed_at: item.started_at, last_viewed_at: item.started_at } });
  } });
  assert.equal(checks.length, 5);
  assert.equal(checks.some((message) => /test-token|test-password/.test(message)), false);
  assert.deepEqual(calls.filter(([, method]) => method === 'POST'), [['/api/auth/login', 'POST']]);
});

test('live API checker rejects incompatible U03 fields and incorrect viewed filters', async () => {
  for (const invalid of [{ ...item, zone_id: undefined }, { ...item, viewed: 'false' }, { ...item }]) {
    await assert.rejects(checkApi({ token: 'test-token', fetchImpl: async (url) => {
      if (url.pathname === '/api/me') return Response.json({ role: 'RESIDENT' });
      return Response.json(list([invalid]));
    } }), /U03:/);
  }
});

test('live API checker requires explicit credentials and does not mistake HTTP/HTML failures for success', async () => {
  await assert.rejects(checkApi({ fetchImpl: () => { throw new Error('must not call'); } }), /VILLA_API_TOKEN/);
  for (const response of [Response.json({}, { status: 401 }), new Response('<html>SPA</html>')]) {
    await assert.rejects(checkApi({ token: 'test-token', fetchImpl: async () => response }), /HTTP 401|JSON 응답/);
  }
});
