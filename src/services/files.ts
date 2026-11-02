import { Image } from 'react-native';
// SDK 54+: the classic FileSystem API lives under /legacy
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { AppError } from './errors';

const MIN_FREE_BYTES = 150 * 1024 * 1024;

export function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) =>
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject),
  );
}

export interface Downloaded { uri: string; bytes: number; mime: string }

let activeDownload: FileSystem.DownloadResumable | null = null;
export function cancelDownload() { activeDownload?.pauseAsync().catch(() => {}); activeDownload = null; }

export async function downloadResult(url: string, onProgress?: (p: number) => void): Promise<Downloaded> {
  const free = await FileSystem.getFreeDiskStorageAsync();
  if (free < MIN_FREE_BYTES) {
    throw new AppError('STORAGE', 'Not enough free storage on your phone. Free up at least 150 MB and try again.');
  }
  const ext = (url.split('?')[0].split('.').pop() ?? 'png').toLowerCase();
  const safeExt = ['png', 'jpg', 'jpeg', 'webp'].includes(ext) ? ext : 'png';
  const mime = safeExt === 'jpg' || safeExt === 'jpeg' ? 'image/jpeg' : `image/${safeExt}`;
  const dest = `${FileSystem.cacheDirectory}lucky4k-${Date.now()}.${safeExt}`;

  const dl = FileSystem.createDownloadResumable(url, dest, {}, (p) => {
    if (p.totalBytesExpectedToWrite > 0) onProgress?.(p.totalBytesWritten / p.totalBytesExpectedToWrite);
  });
  activeDownload = dl;
  try {
    const res = await dl.downloadAsync();
    if (!res || res.status !== 200) throw new AppError('FAILED', 'Downloading the enhanced image failed.');
    const info = await FileSystem.getInfoAsync(res.uri);
    return { uri: res.uri, bytes: info.exists && 'size' in info ? info.size : 0, mime };
  } finally {
    activeDownload = null;
  }
}

export async function saveToGallery(uri: string) {
  const perm = await MediaLibrary.requestPermissionsAsync(true);
  if (!perm.granted) {
    throw new AppError('PERMISSION', 'Permission to save photos was denied. Enable it for LUCKY 4K AI in system Settings.');
  }
  try {
    await MediaLibrary.saveToLibraryAsync(uri); // saves the file as-is, no re-compression
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (/ENOSPC|space/i.test(msg)) throw new AppError('STORAGE', 'Not enough storage to save the image.');
    throw new AppError('FAILED', 'Could not save the image to your gallery.');
  }
}

export async function shareImage(uri: string, mime: string) {
  if (!(await Sharing.isAvailableAsync())) throw new AppError('FAILED', 'Sharing is not available on this device.');
  await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: 'Share enhanced image' });
}

export function formatBytes(b: number) {
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
