import { ApiError } from './client.js';

const key = 'villa-guard-demo-events';
const base = {
  camera_id: 'cam-01', zone_id: 'zone-201-door', zone_name: '201호 현관', zone_type: 'PRIVATE',
  units: [{ unit_id: 2, name: '201호' }], level: 'SUSPECT', action: 'INTRUSION_ATTEMPT', status: 'ENDED',
  received_at: '2026-11-02T22:14:06+09:00', ended_at: '2026-11-02T22:14:48+09:00',
  confidence: null, model_version: null, clip_status: 'PREPARING', clip_url: null, clip_url_expires_at: null,
  my_view: null, confirmed: false, current_response: null, response_locked: false,
  report_status: null, report: null, verdict: null, operator_checked_at: null, repeat_analysis: null,
};
const initialEvents = [
  { ...base, event_id: '8f1c2a7e-3b9d-4f4e-9a51-2c6d0e7b1a10', started_at: '2026-11-02T22:14:05+09:00' },
  { ...base, event_id: '3a7d1c4b-9e2f-4a8b-b1c6-5d0e7f2a9b34', started_at: '2026-11-02T18:05:12+09:00', clip_status: 'EXPIRED', confirmed: true,
    current_response: { response: 'UNSURE', user_id: 3, created_at: '2026-11-02T18:10:00+09:00' } },
  { ...base, event_id: 'b75092ce-ae8f-45ca-a1ea-b3f988e4a717', started_at: '2026-11-01T14:30:00+09:00', confirmed: true, response_locked: true,
    report_status: 'REVIEWED', current_response: { response: 'NORMAL', user_id: 3, created_at: '2026-11-01T14:40:00+09:00' },
    report: { report_id: 12, reason: 'VISITOR_DELIVERY', detail: '택배 기사님이었어요.', training_consent: false, status: 'REVIEWED', reporter_user_id: null, created_at: '2026-11-01T14:40:00+09:00' },
    verdict: { verdict: 'FALSE_POSITIVE', note: '택배 상자를 놓고 떠나는 정상 상황으로 확인했습니다.', operator_id: null, created_at: '2026-11-02T09:00:00+09:00' } },
];

const read = () => {
  try { return JSON.parse(sessionStorage.getItem(key)) || structuredClone(initialEvents); }
  catch { return structuredClone(initialEvents); }
};
const write = (events) => sessionStorage.setItem(key, JSON.stringify(events));
const find = (events, id) => {
  const event = events.find((item) => item.event_id === id);
  if (!event) throw new ApiError(404, { message: '이벤트를 찾을 수 없어요.' });
  return event;
};

export const listEvents = (filters) => {
  const items = read().filter((event) =>
    (!filters.level || filters.level.split(',').includes(event.level)) &&
    (!filters.action || filters.action.split(',').includes(event.action)) &&
    (!filters.viewed || Boolean(event.my_view) === (filters.viewed === 'true')) &&
    (!filters.from || new Date(event.started_at) >= new Date(filters.from)) &&
    (!filters.to || new Date(event.started_at) < new Date(filters.to))
  ).sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
  const page = Number(filters.page || 0);
  const size = Number(filters.size || 20);
  return { items: items.slice(page * size, (page + 1) * size).map((event) => ({ ...event, viewed: Boolean(event.my_view), response: event.current_response?.response || null, verdict: event.verdict?.verdict || null })), page, size, total_count: items.length };
};

export const readEvent = (id) => {
  const events = read();
  const event = find(events, id);
  const now = new Date().toISOString();
  event.my_view = { first_viewed_at: event.my_view?.first_viewed_at || now, last_viewed_at: now };
  write(events);
  return event;
};

export const respond = (id, response) => {
  const events = read();
  const event = find(events, id);
  if (event.response_locked) throw new ApiError(409, { code: 'RESPONSE_LOCKED', message: '신고가 접수되어 응답을 변경할 수 없어요.' });
  if (!['SUSPICIOUS', 'UNSURE'].includes(response)) throw new ApiError(400, { message: '응답을 확인해 주세요.' });
  event.current_response = { response, user_id: 3, created_at: new Date().toISOString() };
  event.confirmed = true;
  write(events);
  return { event_id: id, confirmed: true, current_response: event.current_response, response_locked: false };
};

export const report = (id, body) => {
  const events = read();
  const event = find(events, id);
  if (event.report) throw new ApiError(409, { code: 'REPORT_ALREADY_EXISTS', message: '이미 접수된 신고예요. 이벤트 상세에서 확인해 주세요.' });
  event.current_response = { response: 'NORMAL', user_id: 3, created_at: new Date().toISOString() };
  event.report = { ...body, report_id: Date.now(), status: 'PENDING', reporter_user_id: null, created_at: new Date().toISOString() };
  event.report_status = 'PENDING';
  event.confirmed = true;
  event.response_locked = true;
  write(events);
  return { event_id: id, confirmed: true, current_response: event.current_response, response_locked: true, report_status: 'PENDING', report: event.report };
};
