import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Segmented } from '../components/Segmented';
import { AccentKey, QualityKey, ResolutionKey, useSettings } from '../context/SettingsContext';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{title}</Text>
      {hint && <Text style={{ color: colors.muted, fontSize: 12.5, marginTop: 4, lineHeight: 18 }}>{hint}</Text>}
      <View style={{ marginTop: 12 }}>{children}</View>
    </Card>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  const { settings, update } = useSettings();
  return (
    <ScreenContainer>
      <Header title="SETTINGS" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }}>
        <Section title="App theme" hint="Accent color used for buttons and glow effects.">
          <Segmented<AccentKey>
            value={settings.accent}
            onChange={(accent) => update({ accent })}
            options={[{ value: 'neon', label: 'Neon Green' }, { value: 'emerald', label: 'Emerald' }]}
          />
        </Section>

        <Section title="Image quality" hint="High runs AI face restoration (GFPGAN) on faces in addition to upscaling. Standard is faster and best for landscapes or objects.">
          <Segmented<QualityKey>
            value={settings.quality}
            onChange={(quality) => update({ quality })}
            options={[{ value: 'standard', label: 'Standard' }, { value: 'high', label: 'High + Faces' }]}
          />
        </Section>

        <Section title="Output resolution" hint="Target size of the longest edge. Very small source images may not reach the target because the AI scale factor is capped at 10×.">
          <Segmented<ResolutionKey>
            value={settings.resolution}
            onChange={(resolution) => update({ resolution })}
            options={[{ value: 'hd', label: 'HD 1920' }, { value: '2k', label: '2K 2560' }, { value: '4k', label: '4K 3840' }]}
          />
        </Section>

        <Card style={{ paddingVertical: 4 }}>
          <Row icon="information-circle-outline" label="About application" onPress={() => navigation.navigate('Info', { kind: 'about' })} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <Row icon="shield-checkmark-outline" label="Privacy policy" onPress={() => navigation.navigate('Info', { kind: 'privacy' })} />
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

function Row({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const { accent } = useSettings();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}>
      <Ionicons name={icon} size={22} color={accent} />
      <Text style={{ flex: 1, color: colors.text, marginLeft: 12, fontWeight: '600' }}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}
