import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { colors } from '../theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16 }, style]}>
      {children}
    </View>
  );
}
