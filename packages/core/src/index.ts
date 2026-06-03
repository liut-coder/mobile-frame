export type MFError = {
  code: string;
  message: string;
  module: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
};

export type MFResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: MFError };

export function ok<T>(data: T): MFResult<T> {
  return { ok: true, data };
}

export function err(error: MFError): MFResult<never> {
  return { ok: false, error };
}

export function createError(
  module: string,
  code: string,
  message: string,
  options: Pick<MFError, 'details' | 'recoverable'> = { recoverable: true }
): MFError {
  return {
    code,
    message,
    module,
    recoverable: options.recoverable,
    details: options.details
  };
}

const sensitivePatterns = [
  /token/gi,
  /secret/gi,
  /password/gi,
  /passphrase/gi,
  /private[-_ ]?key/gi
];

export function redactLogValue(value: string): string {
  return sensitivePatterns.reduce((current, pattern) => current.replace(pattern, '[redacted]'), value);
}
