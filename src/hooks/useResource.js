import { useCallback, useEffect, useState } from 'react';

export const useResource = (loader) => {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loader(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setState({ data, error: null, loading: false }); },
      (error) => { if (!controller.signal.aborted) setState({ data: null, error, loading: false }); },
    );
    return () => controller.abort();
  }, [loader, revision]);
  const reload = useCallback(() => {
    setState({ data: null, error: null, loading: true });
    setRevision((value) => value + 1);
  }, []);
  return { ...state, reload };
};
