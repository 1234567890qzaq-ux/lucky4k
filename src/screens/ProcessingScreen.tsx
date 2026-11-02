import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { NeonButton } from '../components/NeonButton';
import { Card } from '../components/Card';
import { RESOLUTION_EDGE, useSettings } from '../context/SettingsContext';
import { cancelJob, ensureOnline, pollJob, startEnhance } from '../services/api';
import { cancelDownload, downloadResult, getImageSize } from '../services/files';
import { toMessage } from '../services/errors';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Processing'>;
type Stage = 'check' | 'upload' | 'process' | 'download';
const STAGES: { key: Stage; label: string }[] = [
  { key: 'check', label: 'Checking connection' },
  { key: 'upload', label: 'Uploading photo' },
  { key: 'process', label: 'AI is enhancing (can take up to a minute)' },
  { key: 'download', label: 'Downloading 4K result' },
];

export default function ProcessingScreen({ navigation, route }: Props) {
  const { image } = route.params;
  const { settings, accent } = useSettings();
  const [stage, setStage] = useState<Stage>('check');
  const [error, setError] = useState<string | null>(null);
  const [dlProgress, setDlProgress] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const jobRef = useRef<string | null>(null);
  const doneRef = useRef(false);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const run = useCallback(async () => {
    setError(null);
    setDlProgress(null);
    setStage('check');
    jobRef.current = null;
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await ensureOnline();
      setStage('upload');
      const job = await startEnhance(
        image,
        { targetLongEdge: RESOLUTION_EDGE[settings.resolution], faceEnhance: settings.quality === 'high' },
        ac.signal,
      );
      jobRef.current = job.id;
      setStage('process');
      const url = await pollJob(job.id, ac.signal);
      setStage('download');
      const file = await downloadResult(url, setDlProgress);
      const size = await getImageSize(file.uri);
      doneRef.current = true;
      navigation.replace('Result', {
        original: image,
        resultUri: file.uri,
        outWidth: size.width,
        outHeight: size.height,
        outBytes: file.bytes,
      });
    } catch (e) {
      if (ac.signal.aborted) return;
      setError(toMessage(e));
    }
  }, [image, settings.resolution, settings.quality, navigation]);

  useEffect(() => {
    run();
    return () => {
      abortRef.current?.abort();
      cancelDownload();
      if (!doneRef.current && jobRef.current) cancelJob(jobRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancel = () => navigation.goBack();
  const idx = STAGES.findIndex((s) => s.key === stage);

  return (
    <ScreenContainer style={{ padding: 20 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 230, height: 230, alignItems: 'center', justifyContent: 'center' }}>
          {!error && (
            <Animated.View
              style={{
                position: 'absolute', width: 230, height: 230, borderRadius: 115,
                borderWidth: 4, borderColor: 'transparent', borderTopColor: accent, borderRightColor: accent,
                shadowColor: accent, shadowOpacity: 1, shadowRadius: 16, elevation: 10,
                transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
              }}
            />
          )}
          <Image source={{ uri: image.uri }} style={{ width: 196, height: 196, borderRadius: 98, opacity: error ? 0.35 : 1 }} />
        </View>

        <Text style={{ color: error ? colors.danger : colors.text, fontSize: 16, fontWeight: '800', letterSpacing: 1.5, marginTop: 28, textAlign: 'center' }}>
          {error ? 'PROCESSING FAILED' : 'AI IS ENHANCING YOUR PHOTO...'}
        </Text>

        {error ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 12, lineHeight: 21, paddingHorizontal: 12 }}>{error}</Text>
        ) : (
          <Card style={{ alignSelf: 'stretch', marginTop: 24 }}>
            {STAGES.map((s, i) => {
              const done = i < idx;
              const active = i === idx;
              return (
                <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7 }}>
                  <Ionicons
                    name={done ? 'checkmark-circle' : active ? 'radio-button-on' : 'ellipse-outline'}
                    size={20}
                    color={done || active ? accent : '#3a3a3a'}
                  />
                  <Text style={{ marginLeft: 10, color: active ? colors.text : done ? colors.muted : '#555', fontWeight: active ? '700' : '500' }}>
                    {s.label}
                  </Text>
                </View>
              );
            })}
            {stage === 'download' && dlProgress !== null && (
              <View style={{ height: 6, borderRadius: 3, backgroundColor: '#222', marginTop: 8, overflow: 'hidden' }}>
                <View style={{ height: 6, width: `${Math.round(dlProgress * 100)}%`, backgroundColor: accent }} />
              </View>
            )}
          </Card>
        )}
      </View>

      <View style={{ gap: 12 }}>
        {error && <NeonButton title="RETRY" icon="refresh" onPress={run} />}
        <NeonButton title="CANCEL" variant="outline" onPress={cancel} />
      </View>
    </ScreenContainer>
  );
}
