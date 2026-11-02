import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { accents } from '../theme';

export type AccentKey = keyof typeof accents;
export type QualityKey = 'standard' | 'high';
export type ResolutionKey = 'hd' | '2k' | '4k';

export interface Settings {
  accent: AccentKey;
  quality: QualityKey;
  resolution: ResolutionKey;
}

export const RESOLUTION_EDGE: Record<ResolutionKey, number> = { hd: 1920, '2k': 2560, '4k': 3840 };
const DEFAULTS: Settings = { accent: 'neon', quality: 'high', resolution: '4k' };
const KEY = 'lucky4k.settings.v1';

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  accent: string;
  accent2: string;
}

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => { if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) }); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ settings, update, accent: accents[settings.accent].a, accent2: accents[settings.accent].b }),
    [settings, update],
  );

  if (!loaded) return null;
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
