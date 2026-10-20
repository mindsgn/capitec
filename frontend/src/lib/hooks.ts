import { useEffect, useState } from 'react';

/** Simulates a short calculation/network delay so loading states are visible. */
export function useFakeLoading(ms = 700): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(id);
  }, [ms]);
  return loading;
}
