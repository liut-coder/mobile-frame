import { describe, expect, it } from 'vitest';

import { err, ok, redactLogValue } from './index';

describe('MFResult helpers', () => {
  it('creates successful results', () => {
    expect(ok({ id: 'demo' })).toEqual({ ok: true, data: { id: 'demo' } });
  });

  it('creates failed results', () => {
    expect(
      err({
        code: 'E_TEST',
        message: 'Test failure',
        module: 'test',
        recoverable: true
      })
    ).toMatchObject({ ok: false });
  });
});

describe('redactLogValue', () => {
  it('redacts sensitive words', () => {
    expect(redactLogValue('password token privateKey')).toBe('[redacted] [redacted] [redacted]');
  });
});
