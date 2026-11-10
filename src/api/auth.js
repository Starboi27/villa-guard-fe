import { isDemo, request } from './client.js';

export const login = (loginId, password) => request('/api/auth/login', {
  method: 'POST', body: { login_id: loginId, password }, publicRequest: true,
});

export const getMe = (signal) => isDemo()
  ? Promise.resolve({ user_id: 3, login_id: 'resident201', role: 'RESIDENT', unit: { unit_id: 2, name: '201호', building_id: 1, building_name: '샘플빌라' } })
  : request('/api/me', { signal });
