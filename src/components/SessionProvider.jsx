import { useEffect, useState } from 'react';
import { getMe, login } from '../api/auth.js';
import { getToken, isDemo, setToken } from '../api/client.js';
import { SessionContext } from '../SessionContext.js';

export const SessionProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const token = getToken();
    if (token) getMe(controller.signal).then(
      (data) => { if (!controller.signal.aborted && getToken() === token) { setUser(data); setLoading(false); } },
      (err) => { if (!controller.signal.aborted && getToken() === token) { setError(err); setLoading(false); } },
    );
    const expire = () => { setUser(null); setError(null); setLoading(false); };
    window.addEventListener('villa-guard:expired', expire);
    return () => {
      controller.abort();
      window.removeEventListener('villa-guard:expired', expire);
    };
  }, [revision]);

  const signIn = async (loginId, password) => {
    const result = await login(loginId, password);
    if (result.user.role !== 'RESIDENT') throw new Error('주민용 계정으로 로그인해 주세요. 운영자 계정은 운영자 웹을 이용해 주세요.');
    setToken(result.access_token);
    try {
      const me = await getMe();
      if (getToken() !== result.access_token) throw new Error('로그인 상태가 변경됐어요. 다시 로그인해 주세요.');
      setUser(me);
      setError(null);
    } catch (err) { if (getToken() === result.access_token) setToken(null); throw err; }
  };
  const signOut = () => { setToken(null); setUser(null); setError(null); setLoading(false); };
  const startDemo = async () => {
    setToken('demo-resident');
    setUser(await getMe());
    setError(null);
  };
  const retry = () => { setError(null); setLoading(true); setRevision((value) => value + 1); };

  return <SessionContext.Provider value={{ user, loading, error, signIn, signOut, startDemo, retry, demo: isDemo() }}>{children}</SessionContext.Provider>;
};
