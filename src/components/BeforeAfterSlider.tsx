import React, { useRef, useState } from 'react';
import { Animated, Image, LayoutChangeEvent, PanResponder, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';

export function BeforeAfterSlider({ before, after, aspect }: { before: string; after: string; aspect: number }) {
  const { accent } = useSettings();
  const [width, setWidth] = useState(0);
  const pos = useRef(new Animated.Value(0)).current;
  const posNum = useRef(0);
  const startNum = useRef(0);
  const widthRef = useRef(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setWidth(w);
    posNum.current = w / 2;
    pos.setValue(w / 2);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => { startNum.current = posNum.current; },
      onPanResponderMove: (_e, g) => {
        const next = Math.min(widthRef.current, Math.max(0, startNum.current + g.dx));
        posNum.current = next;
        pos.setValue(next);
      },
    }),
  ).current;

  return (
    <View
      onLayout={onLayout}
      {...pan.panHandlers}
      style={{ width: '100%', aspectRatio: aspect, borderRadius: 18, overflow: 'hidden', backgroundColor: '#000' }}
    >
      <Image source={{ uri: after }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pos, overflow: 'hidden' }}>
        <Image source={{ uri: before }} style={{ position: 'absolute', left: 0, top: 0, width, height: '100%' }} resizeMode="cover" />
      </Animated.View>

      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: pos, width: 40, marginLeft: -20, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: accent }} />
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#0A0A0A', borderWidth: 2, borderColor: accent, alignItems: 'center', justifyContent: 'center', shadowColor: accent, shadowOpacity: 0.9, shadowRadius: 10, elevation: 8 }}>
          <Ionicons name="swap-horizontal" size={20} color={accent} />
        </View>
      </Animated.View>

      <Tag text="BEFORE" side="left" />
      <Tag text="AFTER" side="right" accent={accent} />
    </View>
  );
}

function Tag({ text, side, accent }: { text: string; side: 'left' | 'right'; accent?: string }) {
  return (
    <View style={{ position: 'absolute', top: 10, [side]: 10, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
      <Text style={{ color: accent ?? '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>{text}</Text>
    </View>
  );
}
