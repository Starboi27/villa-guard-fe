import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const verifyList = (data) => {
  assert.ok(Array.isArray(data.items), 'U03: items 배열이 필요합니다.');
  for (const key of ['page', 'size', 'total_count']) {
    assert.ok(Number.isInteger(data[key]) && data[key] >= 0, `U03: ${key}가 올바르지 않습니다.`);
  }
  for (const item of data.items) {
    for (const key of ['event_id', 'started_at', 'zone_id', 'zone_name', 'level', 'action']) {
      assert.equal(typeof item[key], 'string', `U03: ${key} 문자열이 필요합니다.`);
    }
    for (const key of ['viewed', 'confirmed']) {
      assert.equal(typeof item[key], 'boolean', `U03: ${key}는 boolean이어야 합니다.`);
    }
    assert.ok(item.response === null || ['NORMAL', 'SUSPICIOUS', 'UNSURE'].includes(item.response), 'U03: response 값이 올바르지 않습니다.');
    assert.ok(item.report_status === null || ['PENDING', 'REVIEWED'].includes(item.report_status), 'U03: report_status 값이 올바르지 않습니다.');
    assert.ok(item.verdict === null || ['FALSE_POSITIVE', 'TRUE_POSITIVE', 'INCONCLUSIVE'].includes(item.verdict), 'U03: verdict 값이 올바르지 않습니다.');
  }
};

// Only login and read APIs are called. The optional U04 check records viewing
// through the detail API, as the resident app does; it never submits responses.
export const checkApi = async ({
  baseUrl = 'http://localhost:8080', token, loginId, password,
  includeDetail = false, eventId, fetchImpl = fetch, onCheck = () => {},
}) => {
  const origin = new URL(baseUrl);
  assert.ok(['http:', 'https:'].includes(origin.protocol) && origin.pathname === '/' && !origin.search && !origin.hash && !origin.username && !origin.password,
    'API_PROXY_TARGET은 /api를 붙이지 않은 서버 주소여야 합니다.');
  assert.ok(token || (loginId && password), 'VILLA_API_TOKEN 또는 VILLA_LOGIN_ID·VILLA_LOGIN_PASSWORD를 .env.local에 설정해 주세요.');

  const json = async (path, body) => {
    let response;
    try {
      response = await fetchImpl(new URL(path, origin), {
        method: body ? 'POST' : 'GET',
        redirect: 'error', signal: AbortSignal.timeout(10000),
        headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : { Authorization: `Bearer ${token}` }) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw new Error(`${path}: 서버에 연결하지 못했습니다. 서버 실행 상태와 API_PROXY_TARGET을 확인해 주세요.`);
    }
    assert.ok(response.ok, `${path}: HTTP ${response.status}`);
    try { return await response.json(); }
    catch { throw new Error(`${path}: JSON 응답이 아닙니다. /api 프록시 설정을 확인해 주세요.`); }
  };

  if (!token) {
    const result = await json('/api/auth/login', { login_id: loginId, password });
    assert.equal(result.user?.role, 'RESIDENT', '주민 계정이 필요합니다.');
    assert.ok(typeof result.access_token === 'string' && result.access_token, '로그인 토큰이 없습니다.');
    token = result.access_token;
    onCheck('U01 주민 로그인');
  }

  const me = await json('/api/me');
  assert.equal(me.role, 'RESIDENT', '내 정보의 역할이 RESIDENT가 아닙니다.');
  onCheck('내 정보 조회');

  const list = await json('/api/me/events?page=0&size=20');
  verifyList(list);
  onCheck(list.items.length
    ? `U03 목록 응답 (${list.items.length}건, zone_id·내 열람·세대 응답)`
    : 'U03 빈 목록 응답 (카드 필드는 이벤트 데이터가 있을 때 검증)');

  for (const viewed of [false, true]) {
    const filtered = await json(`/api/me/events?page=0&size=20&viewed=${viewed}`);
    verifyList(filtered);
    assert.ok(filtered.items.every((item) => item.viewed === viewed), `U03: viewed=${viewed} 필터가 맞지 않습니다.`);
  }
  onCheck('U03 열람/미열람 필터');

  if (includeDetail || eventId) {
    const id = eventId || list.items[0]?.event_id;
    assert.ok(id, '상세 검사할 이벤트가 없습니다. VILLA_EVENT_ID를 지정해 주세요.');
    const detail = await json(`/api/events/${encodeURIComponent(id)}`);
    assert.equal(detail.event_id, id, 'U04: 이벤트 ID가 다릅니다.');
    assert.equal(typeof detail.confirmed, 'boolean', 'U04: confirmed가 필요합니다.');
    assert.equal(typeof detail.response_locked, 'boolean', 'U04: response_locked가 필요합니다.');
    assert.ok(detail.current_response === null || ['NORMAL', 'SUSPICIOUS', 'UNSURE'].includes(detail.current_response?.response), 'U04: current_response가 올바르지 않습니다.');
    assert.ok(Number.isFinite(Date.parse(detail.my_view?.first_viewed_at)) && Number.isFinite(Date.parse(detail.my_view?.last_viewed_at)), 'U04: 열람 시각이 필요합니다.');
    onCheck('U04 상세·본인 열람 기록 응답');
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('npm run check:api [-- --detail]\n.env.local: API_PROXY_TARGET, VILLA_API_TOKEN 또는 VILLA_LOGIN_ID·VILLA_LOGIN_PASSWORD\n기본: 로그인·내 정보·U03 목록/열람 필터. --detail 또는 VILLA_EVENT_ID: U04 열람 기록 포함.\n응답·오탐 신고는 제출하지 않습니다. 토큰·비밀번호·응답 본문은 출력하지 않습니다.');
  } else {
    try {
      assert.ok(args.every((arg) => arg === '--detail'), '지원하는 옵션은 --detail, --help입니다.');
      await checkApi({
        baseUrl: process.env.API_PROXY_TARGET || 'http://localhost:8080',
        token: process.env.VILLA_API_TOKEN,
        loginId: process.env.VILLA_LOGIN_ID, password: process.env.VILLA_LOGIN_PASSWORD,
        includeDetail: args.includes('--detail'), eventId: process.env.VILLA_EVENT_ID,
        onCheck: (message) => console.log(`PASS ${message}`),
      });
    } catch (error) {
      console.error(`FAIL ${error.message}`);
      process.exitCode = 1;
    }
  }
}
