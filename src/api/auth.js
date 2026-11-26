import { isDemo, request } from './client.js';

export const isApiAvailable = async (signal) => {
  const timeout = AbortSignal.timeout(2500);
  try {
    const health = await request('/health', {
      cache: 'no-store',
      publicRequest: true,
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    return health?.status === 'UP';
  } catch (error) {
    if (signal?.aborted) throw error;
    return false;
  }
};

export const canUseDemo = async (signal) =>
  import.meta.env?.VITE_ENABLE_DEMO !== 'false' && !(await isApiAvailable(signal));

export const login = (loginId, password) => request('/api/auth/login', {
  method: 'POST', body: { login_id: loginId, password }, publicRequest: true,
});

export const getMe = (signal) => isDemo()
  ? Promise.resolve({ user_id: 3, login_id: 'resident201', role: 'RESIDENT', unit: { unit_id: 2, name: '201호', building_id: 1, building_name: '샘플빌라' } })
  : request('/api/me', { signal });
