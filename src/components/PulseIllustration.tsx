import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';

export function PulseIllustration({ size = 200 }: { size?: number }) {
  const { accent, accent2 } = useSettings();
  const pulses = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = pulses.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 800),
          Animated.timing(v, { toValue: 1, duration: 2400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [pulses]);

  const core = size * 0.5;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {pulses.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute', width: size, height: size, borderRadius: size / 2,
            borderWidth: 1.5, borderColor: accent,
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
            transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.1] }) }],
          }}
        />
      ))}
      <View style={{ shadowColor: accent, shadowOpacity: 0.9, shadowRadius: 28, shadowOffset: { width: 0, height: 0 }, elevation: 16 }}>
        <LinearGradient colors={[accent, accent2]} style={{ width: core, height: core, borderRadius: core * 0.28, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="sparkles" size={core * 0.3} color="#050505" />
          <Text style={{ color: '#050505', fontWeight: '900', fontSize: core * 0.28, letterSpacing: 1 }}>4K</Text>
        </LinearGradient>
      </View>
    </View>
  );
}
