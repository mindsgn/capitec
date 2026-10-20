import { clearState, loadState, saveState, STORAGE_KEY } from './storage';
import { initialState } from './state';

function fakeStorage(seed: Record<string, string> = {}) {
  const data = { ...seed };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => { data[k] = v; },
    removeItem: (k: string) => { delete data[k]; },
  };
}

describe('storage', () => {
  it('returns the initial state when nothing is saved', () => {
    expect(loadState(fakeStorage())).toEqual({ state: initialState, error: false });
  });
  it('round-trips state', () => {
    const s = fakeStorage();
    const next = { ...initialState, phase: 'eligibility' as const, step: 2, loanType: 'personal' as const };
    expect(saveState(next, s)).toBe(true);
    expect(loadState(s)).toEqual({ state: next, error: false });
  });
  it('recovers from corrupt JSON and from invalid shapes', () => {
    expect(loadState(fakeStorage({ [STORAGE_KEY]: '{oops' }))).toEqual({ state: initialState, error: true });
    expect(loadState(fakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, phase: 'nope' }) })).error).toBe(true);
  });
  it('survives unavailable storage', () => {
    expect(loadState(undefined).error).toBe(false);
    expect(saveState(initialState, undefined)).toBe(false);
    const throwing = { setItem: () => { throw new Error('quota'); }, removeItem: () => { throw new Error('x'); } };
    expect(saveState(initialState, throwing)).toBe(false);
    expect(() => clearState(throwing)).not.toThrow();
  });
  it('clears saved data', () => {
    const s = fakeStorage();
    saveState(initialState, s);
    clearState(s);
    expect(s.getItem(STORAGE_KEY)).toBeNull();
  });
});
