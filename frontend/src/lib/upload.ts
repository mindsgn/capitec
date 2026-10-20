import type { DocMeta } from './state';

export const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_MS = 1200;
export const SUBMIT_MS = 1500;

type FileLike = Pick<File, 'name' | 'size' | 'type'>;

/** Returns an i18n key when the file is not acceptable, otherwise null. */
export function validateFile(file: FileLike): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'v.fileType';
  if (file.size === 0) return 'v.fileEmpty';
  if (file.size > MAX_BYTES) return 'v.fileSize';
  return null;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * There is no backend, so this only pretends to upload and reports progress.
 * A file whose name contains "__fail" rejects, which lets you demo the error toast.
 */
export async function simulateUpload(file: FileLike, onProgress: (pct: number) => void, totalMs = UPLOAD_MS): Promise<DocMeta> {
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    await wait(totalMs / steps);
    onProgress(Math.round((i / steps) * 100));
    if (file.name.includes('__fail') && i === 6) throw new Error('Simulated upload failure');
  }
  return { name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString() };
}

export async function simulateSubmit(ms = SUBMIT_MS): Promise<void> {
  await wait(ms);
}

export function makeReference(now = Date.now(), rand = Math.random()): string {
  return `LS-${now.toString(36).toUpperCase().slice(-6)}${Math.floor(rand * 1296).toString(36).toUpperCase().padStart(2, '0')}`;
}
