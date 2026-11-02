import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { Header } from '../components/Header';
import { NeonButton } from '../components/NeonButton';
import { Card } from '../components/Card';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { useSettings } from '../context/SettingsContext';
import { formatBytes, saveToGallery, shareImage } from '../services/files';
import { toMessage } from '../services/errors';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ navigation, route }: Props) {
  const { original, resultUri, outWidth, outHeight, outBytes } = route.params;
  const { accent } = useSettings();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const mime = resultUri.toLowerCase().endsWith('.png') ? 'image/png' : resultUri.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg';

  const save = async () => {
    setSaving(true);
    try {
      await saveToGallery(resultUri);
      setSaved(true);
      Alert.alert('Saved', `The ${outWidth} × ${outHeight} image was saved to your gallery.`);
    } catch (e) {
      Alert.alert('Could not save', toMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const share = async () => {
    try { await shareImage(resultUri, mime); }
    catch (e) { Alert.alert('Could not share', toMessage(e)); }
  };

  const factor = (outWidth / original.width).toFixed(1);

  return (
    <ScreenContainer>
      <Header title="RESULT" onBack={() => navigation.popToTop()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        <BeforeAfterSlider before={original.uri} after={resultUri} aspect={outWidth / outHeight} />
        <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 12, marginTop: 10 }}>Drag the slider to compare</Text>

        <Card style={{ marginTop: 16, flexDirection: 'row' }}>
          <Stat label="ORIGINAL" value={`${original.width} × ${original.height}`} />
          <View style={{ width: 1, backgroundColor: colors.border, marginHorizontal: 14 }} />
          <Stat label="ENHANCED" value={`${outWidth} × ${outHeight}`} accent={accent} sub={`${factor}× · ${formatBytes(outBytes)}`} />
        </Card>

        <View style={{ gap: 12, marginTop: 20 }}>
          <NeonButton title={saved ? 'SAVED ✓' : 'SAVE TO GALLERY'} icon="download-outline" onPress={save} loading={saving} />
          <NeonButton title="SHARE IMAGE" icon="share-social-outline" variant="outline" onPress={share} />
          <NeonButton title="ENHANCE ANOTHER PHOTO" icon="add-circle-outline" variant="outline" onPress={() => navigation.popToTop()} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>{label}</Text>
      <Text style={{ color: accent ?? colors.text, fontSize: 17, fontWeight: '800', marginTop: 4 }}>{value}</Text>
      {sub && <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{sub}</Text>}
    </View>
  );
}
