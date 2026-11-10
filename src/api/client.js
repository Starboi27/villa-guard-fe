export const tokenKey = 'villa-guard-resident-token';

const clearLegacyToken = () => {
  try {
    localStorage.removeItem(tokenKey);
  } catch {
    // Legacy storage restrictions must not prevent a tab-scoped session.
  }
};

export const getToken = () => {
  clearLegacyToken();
  return sessionStorage.getItem(tokenKey);
};
export const setToken = (token) => {
  clearLegacyToken();
  if (token) {
    sessionStorage.setItem(tokenKey, token);
  } else {
    sessionStorage.removeItem(tokenKey);
  }
};
export const isDemo = () => getToken() === 'demo-resident';

export class ApiError extends Error {
  constructor(status, body) {
    super(body.message || '요청을 처리하지 못했어요. 다시 시도해 주세요.');
    this.status = status;
    this.code = body.code;
    this.fields = body.errors || [];
  }
}

export const request = async (path, { body, method = 'GET', signal, publicRequest = false } = {}) => {
  const token = getToken();
  let response;
  try {
    response = await fetch(`${import.meta.env?.VITE_API_BASE_URL || ''}${path}`, {
      method, signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(!publicRequest && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, { message: '서버에 연결할 수 없어요. 네트워크를 확인하고 다시 시도해 주세요.' });
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && !publicRequest && getToken() === token) {
      setToken(null);
      window.dispatchEvent(new Event('villa-guard:expired'));
    }
    throw new ApiError(response.status, data || {});
  }
  if (data === null && response.status !== 204) {
    throw new ApiError(0, { message: '서버 응답을 읽을 수 없어요. API 연결 설정을 확인해 주세요.' });
  }
  return data;
};
