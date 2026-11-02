import React from 'react';
import { ScrollView, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { Header } from '../components/Header';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Info'>;

const ABOUT = [
  ['LUCKY 4K AI', 'Version 1.0.0'],
  ['What it does', 'Upscales and restores photos using the Real-ESRGAN AI model (with optional GFPGAN face restoration), running on a cloud GPU through our backend.'],
  ['Limits', 'Results depend on the quality of the source image. Output size is capped by the scale factor the model supports; very small or heavily damaged images may not reach the target resolution.'],
];

const PRIVACY = [
  ['What we process', 'Only the photo you explicitly select. The app never scans your gallery.'],
  ['Where it goes', 'The photo is sent over the network to our backend, then to the AI provider (Replicate) to be enhanced. The enhanced image is downloaded to your phone.'],
  ['Retention', 'Our backend does not store your photos. The AI provider may keep inputs and outputs for a limited time under its own policy before deleting them.'],
  ['On your device', 'Enhanced images are kept in the app cache until you save them to your gallery or the system clears the cache. Settings are stored locally.'],
  ['Permissions', 'Selecting photos uses the Android Photo Picker (no permission needed). Saving asks for permission to add photos to your gallery.'],
  ['Contact', 'Replace this section with your support email and your hosted privacy-policy URL before publishing to Google Play.'],
];

export default function InfoScreen({ navigation, route }: Props) {
  const about = route.params.kind === 'about';
  const rows = about ? ABOUT : PRIVACY;
  return (
    <ScreenContainer>
      <Header title={about ? 'ABOUT' : 'PRIVACY POLICY'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {rows.map(([h, t]) => (
          <React.Fragment key={h}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 16 }}>{h}</Text>
            <Text style={{ color: colors.muted, lineHeight: 22, marginTop: 6 }}>{t}</Text>
          </React.Fragment>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
