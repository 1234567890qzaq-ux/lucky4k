import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { colors } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function NeonButton({ title, onPress, variant = 'primary', icon, loading, disabled, style }: Props) {
  const { accent, accent2 } = useSettings();
  const primary = variant === 'primary';
  const fg = primary ? '#050505' : accent;
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56 }}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 15, fontWeight: '800', letterSpacing: 1.4 }}>{title}</Text>
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          borderRadius: 18,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          shadowColor: accent,
          shadowOpacity: primary ? 0.7 : 0.25,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 0 },
          elevation: primary ? 12 : 0,
        },
        style,
      ]}
    >
      {primary ? (
        <LinearGradient colors={[accent, accent2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 18 }}>
          {content}
        </LinearGradient>
      ) : (
        <View style={{ borderRadius: 18, borderWidth: 1.5, borderColor: accent, backgroundColor: colors.card }}>{content}</View>
      )}
    </Pressable>
  );
}
