import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { PickedImage } from '../types';
import { ScreenContainer } from '../components/ScreenContainer';
import { NeonButton } from '../components/NeonButton';
import { Card } from '../components/Card';
import { PulseIllustration } from '../components/PulseIllustration';
import { useSettings } from '../context/SettingsContext';
import { formatBytes } from '../services/files';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = /^image\/(jpeg|jpg|png|webp)$/i;
const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string }[] = [
  { icon: 'expand-outline', title: 'AI 4K Upscaling' },
  { icon: 'happy-outline', title: 'Face Enhancement' },
  { icon: 'aperture-outline', title: 'Blur Removal' },
  { icon: 'pulse-outline', title: 'Noise Reduction' },
];

function validate(a: ImagePicker.ImagePickerAsset): string | null {
  const name = a.fileName ?? a.uri;
  const okType = a.mimeType ? ALLOWED_MIME.test(a.mimeType) : ALLOWED_EXT.test(name);
  if (!okType) return 'Unsupported format. Please choose a JPG, PNG or WEBP image.';
  if (a.fileSize && a.fileSize > MAX_BYTES) {
    return `This image is ${formatBytes(a.fileSize)}. The maximum is ${formatBytes(MAX_BYTES)}.`;
  }
  return null;
}

export default function HomeScreen({ navigation }: Props) {
  const { accent, accent2 } = useSettings();
  const [picked, setPicked] = useState<PickedImage | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    setBusy(true);
    try {
      // Uses the native Android Photo Picker, so no storage permission is needed.
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        exif: false,
      });
      if (res.canceled || !res.assets?.length) return;
      const a = res.assets[0];
      const problem = validate(a);
      if (problem) { Alert.alert('Cannot use this image', problem); return; }
      const ext = (a.fileName ?? a.uri).split('.').pop()?.toLowerCase() ?? 'jpg';
      setPicked({
        uri: a.uri,
        width: a.width,
        height: a.height,
        name: a.fileName ?? `photo.${ext}`,
        mimeType: a.mimeType ?? (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'),
        fileSize: a.fileSize,
      });
    } catch (e) {
      Alert.alert('Could not open gallery', 'Please check that LUCKY 4K AI is allowed to access photos in your system settings, then try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 64 }}>
          <LinearGradient colors={[accent, accent2]} style={{ width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#050505', fontWeight: '900', fontSize: 14 }}>4K</Text>
          </LinearGradient>
          <Text style={{ flex: 1, marginLeft: 12, color: colors.text, fontSize: 17, fontWeight: '800', letterSpacing: 1.5 }}>LUCKY 4K AI</Text>
          <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={12} accessibilityLabel="Settings">
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </Pressable>
        </View>

        {picked ? (
          <Card style={{ marginTop: 12 }}>
            <Image source={{ uri: picked.uri }} style={{ width: '100%', aspectRatio: picked.width / picked.height, maxHeight: 380, borderRadius: 14, backgroundColor: '#000' }} resizeMode="contain" />
            <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '700', marginTop: 12 }}>{picked.name}</Text>
            <Text style={{ color: colors.muted, marginTop: 2 }}>
              {picked.width} × {picked.height}px{picked.fileSize ? ` · ${formatBytes(picked.fileSize)}` : ''}
            </Text>
            <NeonButton title="ENHANCE TO 4K" icon="sparkles" style={{ marginTop: 16 }} onPress={() => navigation.navigate('Processing', { image: picked })} />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <NeonButton title="CHANGE" variant="outline" style={{ flex: 1 }} onPress={pick} loading={busy} />
              <NeonButton title="CANCEL" variant="outline" style={{ flex: 1 }} onPress={() => setPicked(null)} />
            </View>
          </Card>
        ) : (
          <>
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <PulseIllustration size={210} />
            </View>
            <Text style={{ color: colors.text, fontSize: 30, fontWeight: '800', textAlign: 'center', marginTop: 8 }}>Upgrade Your Photos</Text>
            <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
              Transform your images into stunning 4K quality.
            </Text>
            <NeonButton title="SELECT IMAGE" icon="images-outline" style={{ marginTop: 28 }} onPress={pick} loading={busy} />
            <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 12, letterSpacing: 0.5 }}>
              Supported formats: JPG · PNG · WEBP
            </Text>
          </>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
          {FEATURES.map((f) => (
            <Card key={f.title} style={{ width: '48%', flexGrow: 1, padding: 14 }}>
              <Ionicons name={f.icon} size={24} color={accent} />
              <Text style={{ color: colors.text, fontWeight: '700', marginTop: 10, fontSize: 14 }}>{f.title}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
