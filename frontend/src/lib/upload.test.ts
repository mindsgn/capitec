import { makeReference, MAX_BYTES, simulateUpload, validateFile } from './upload';

describe('validateFile', () => {
  it('accepts pdf and images within the limit', () => {
    expect(validateFile({ name: 'a.pdf', type: 'application/pdf', size: 1000 })).toBeNull();
    expect(validateFile({ name: 'a.png', type: 'image/png', size: MAX_BYTES })).toBeNull();
  });
  it('rejects bad types, empty and oversized files', () => {
    expect(validateFile({ name: 'a.exe', type: 'application/x-msdownload', size: 10 })).toBe('v.fileType');
    expect(validateFile({ name: 'a.pdf', type: 'application/pdf', size: 0 })).toBe('v.fileEmpty');
    expect(validateFile({ name: 'a.pdf', type: 'application/pdf', size: MAX_BYTES + 1 })).toBe('v.fileSize');
  });
});

describe('simulateUpload', () => {
  it('reports progress up to 100 and resolves metadata', async () => {
    const seen: number[] = [];
    const meta = await simulateUpload({ name: 'a.pdf', type: 'application/pdf', size: 5 }, (p) => seen.push(p), 10);
    expect(seen[seen.length - 1]).toBe(100);
    expect(meta).toMatchObject({ name: 'a.pdf', size: 5 });
  });
  it('fails for the demo failure filename', async () => {
    await expect(simulateUpload({ name: 'x__fail.pdf', type: 'application/pdf', size: 5 }, () => {}, 10)).rejects.toThrow();
  });
});

describe('makeReference', () => {
  it('is stable for the same inputs and prefixed', () => {
    expect(makeReference(1_700_000_000_000, 0.5)).toBe(makeReference(1_700_000_000_000, 0.5));
    expect(makeReference()).toMatch(/^LS-[A-Z0-9]+$/);
  });
});
