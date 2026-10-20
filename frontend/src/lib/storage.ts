import { initialState, stateSchema, type SimState } from './state';

export const STORAGE_KEY = 'loan-simulator:v1';
type Reader = Pick<Storage, 'getItem'>;
type Writer = Pick<Storage, 'setItem' | 'removeItem'>;

function browserStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined; // blocked (private mode / disabled)
  }
}

/** Never throws. `error` is true when saved data existed but was unreadable or invalid. */
export function loadState(storage: Reader | undefined = browserStorage()): { state: SimState; error: boolean } {
  if (!storage) return { state: initialState, error: false };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { state: initialState, error: false };
    const parsed = stateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? { state: parsed.data, error: false } : { state: initialState, error: true };
  } catch {
    return { state: initialState, error: true };
  }
}

export function saveState(state: SimState, storage: Writer | undefined = browserStorage()): boolean {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    return !!storage;
  } catch {
    return false;
  }
}

export function clearState(storage: Writer | undefined = browserStorage()) {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
