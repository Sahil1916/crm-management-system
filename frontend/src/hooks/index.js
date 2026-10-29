import { useState, useEffect, useCallback, useRef } from 'react';

// ── useDebounce ───────────────────────────────────────────────────────────────
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── useFetch ──────────────────────────────────────────────────────────────────
export function useFetch(fetchFn, deps = [], options = {}) {
  const { immediate = true } = options;
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn(...args);
      if (mounted.current) setData(res.data?.data ?? res.data);
    } catch (err) {
      if (mounted.current) setError(err.response?.data?.message || 'An error occurred');
    } finally {
      if (mounted.current) setLoading(false);
    }
  // eslint-disable-next-line
  }, deps);

  useEffect(() => { if (immediate) execute(); }, [execute, immediate]);

  return { data, loading, error, refetch: execute };
}

// ── usePagination ─────────────────────────────────────────────────────────────
export function usePagination(initialSize = 20) {
  const [page, setPage] = useState(0);
  const [size] = useState(initialSize);

  const goTo      = (p) => setPage(p);
  const nextPage  = ()  => setPage(p => p + 1);
  const prevPage  = ()  => setPage(p => Math.max(0, p - 1));
  const resetPage = ()  => setPage(0);

  return { page, size, goTo, nextPage, prevPage, resetPage };
}

// ── useToast ──────────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

// ── useLocalStorage ───────────────────────────────────────────────────────────
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });

  const setStoredValue = (val) => {
    setValue(val);
    window.localStorage.setItem(key, JSON.stringify(val));
  };

  return [value, setStoredValue];
}
