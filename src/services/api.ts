import NetInfo from '@react-native-community/netinfo';
import type { EnhanceOptions, PickedImage } from '../types';
import { AppError, ErrorCode } from './errors';

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export interface StartedJob { id: string; expectedWidth: number; expectedHeight: number }
interface StatusResponse { status: 'processing' | 'succeeded' | 'failed' | 'canceled'; outputUrl?: string; error?: string }

export async function ensureOnline() {
  const s = await NetInfo.fetch();
  if (s.isConnected === false || s.isInternetReachable === false) {
    throw new AppError('NO_INTERNET', 'No internet connection. Connect to Wi-Fi or mobile data and try again.');
  }
  if (!BASE) {
    throw new AppError('CONFIG', 'Backend URL is not configured. Set EXPO_PUBLIC_API_URL (see README).');
  }
}

async function request<T>(path: string, init: RequestInit, signal?: AbortSignal, timeoutMs = 60000): Promise<T> {
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, timeoutMs);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    const res = await fetch(BASE + path, { ...init, signal: ctrl.signal });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const code = (body?.error?.code ?? 'SERVER') as string;
      const map: Record<string, ErrorCode> = {
        UNSUPPORTED: 'UNSUPPORTED', TOO_LARGE: 'TOO_LARGE', BILLING: 'BILLING', RATE_LIMIT: 'RATE_LIMIT',
      };
      throw new AppError(map[code] ?? 'SERVER', body?.error?.message ?? `Server error (${res.status}).`);
    }
    return body as T;
  } catch (e) {
    if (e instanceof AppError) throw e;
    if (timedOut) throw new AppError('TIMEOUT', 'The server took too long to respond. Please try again.');
    if (signal?.aborted) throw e;
    throw new AppError('NETWORK', 'Could not reach the server. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

export function startEnhance(image: PickedImage, opts: EnhanceOptions, signal?: AbortSignal) {
  const form = new FormData();
  form.append('image', { uri: image.uri, name: image.name, type: image.mimeType } as unknown as Blob);
  form.append('targetLongEdge', String(opts.targetLongEdge));
  form.append('faceEnhance', String(opts.faceEnhance));
  return request<StartedJob>('/api/enhance', { method: 'POST', body: form }, signal, 180000);
}

export function cancelJob(id: string) {
  return request<{ ok: boolean }>(`/api/enhance/${id}/cancel`, { method: 'POST' }, undefined, 15000).catch(() => {});
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new Error('aborted')); }, { once: true });
  });

/** Polls until the AI job finishes. Resolves with the output image URL. */
export async function pollJob(id: string, signal: AbortSignal): Promise<string> {
  const deadline = Date.now() + 12 * 60 * 1000;
  let netFails = 0;
  while (Date.now() < deadline) {
    await sleep(2000, signal);
    try {
      const s = await request<StatusResponse>(`/api/enhance/${id}`, { method: 'GET' }, signal, 20000);
      netFails = 0;
      if (s.status === 'succeeded' && s.outputUrl) return s.outputUrl;
      if (s.status === 'failed') throw new AppError('FAILED', s.error ?? 'The AI could not process this image.');
      if (s.status === 'canceled') throw new AppError('FAILED', 'Processing was canceled.');
    } catch (e) {
      if (e instanceof AppError && (e.code === 'NETWORK' || e.code === 'TIMEOUT') && ++netFails < 4) continue;
      throw e;
    }
  }
  throw new AppError('TIMEOUT', 'Processing is taking too long. Please try again.');
}
