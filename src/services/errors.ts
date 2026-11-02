export type ErrorCode =
  | 'NO_INTERNET' | 'NETWORK' | 'TIMEOUT' | 'CONFIG' | 'SERVER' | 'UNSUPPORTED'
  | 'TOO_LARGE' | 'STORAGE' | 'PERMISSION' | 'FAILED' | 'BILLING' | 'RATE_LIMIT';

export class AppError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function toMessage(e: unknown): string {
  if (e instanceof AppError) return e.message;
  const msg = e instanceof Error ? e.message : String(e);
  if (/ENOSPC|No space left|not enough space/i.test(msg)) {
    return 'Your phone is out of storage. Free up some space and try again.';
  }
  if (/Network request failed/i.test(msg)) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}
