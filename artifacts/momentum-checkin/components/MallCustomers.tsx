import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import palette from '@/constants/colors';
import { GUEST_SHEETS, GUEST_FRAME_WIDTH, GUEST_FRAME_HEIGHT } from '@/constants/mall-guests';

const c = palette.light;
const ROUTES = [
  { from: 8, to: 65, top: 62, duration: 14500 },
  { from: 77, to: 31, top: 64, duration: 12000 },
  { from: 22, to: 73, top: 73, duration: 17500 },
  { from: 70, to: 12, top: 82, duration: 16000 },
  { from: 45, to: 5, top: 82, duration: 13000 },
  { from: 12, to: 52, top: 74, duration: 18000 },
  { from: 54, to: 85, top: 63, duration: 11000 },
  { from: 85, to: 46, top: 76, duration: 19000 },
];

function Shopper({ index, floor, width, reducedMotion }: { index: number; floor: number; width: number; reducedMotion: boolean }) {
  const route = ROUTES[index];
  const progress = useRef(new Animated.Value(0)).current;
  const stride = useRef(new Animated.Value(0)).current;
  const facing = useRef(new Animated.Value(route.to > route.from ? 1 : -1)).current;
  const native = Platform.OS !== 'web';
  useEffect(() => {
    if (reducedMotion) return;
    function walk(to: number) {
      return Animated.parallel([
        Animated.timing(progress, { toValue: to, duration: route.duration, easing: Easing.linear, useNativeDriver: native }),
        Animated.loop(Animated.sequence([
          Animated.timing(stride, { toValue: 1, duration: 300, useNativeDriver: native }),
          Animated.timing(stride, { toValue: -1, duration: 300, useNativeDriver: native }),
        ]), { iterations: Math.floor(route.duration / 600) }),
      ]);
    }
    const direction = route.to > route.from ? 1 : -1;
    const journey = Animated.loop(Animated.sequence([
      Animated.delay(index * 180),
      Animated.timing(facing, { toValue: direction, duration: 0, useNativeDriver: native }),
      walk(1),
      Animated.timing(stride, { toValue: 0, duration: 100, useNativeDriver: native }),
      Animated.delay(1800 + index * 130),
      Animated.timing(facing, { toValue: -direction, duration: 0, useNativeDriver: native }),
      walk(0),
      Animated.timing(stride, { toValue: 0, duration: 100, useNativeDriver: native }),
      Animated.delay(1400),
    ]));
    journey.start();
    return () => { journey.stop(); };
  }, [index, route, native, reducedMotion, progress, stride, facing]);
  const bob = stride.interpolate({ inputRange: [-1, 0, 1], outputRange: [-1.3, 0, -1.3] });
  const sheet = GUEST_SHEETS[floor - 1];
  return (
    <Animated.View testID={`mall-guest-${floor}-${index}`} style={[
      s.guest,
      { left: `${route.from}%`, top: Math.min(route.top * width / 100, Math.max(0, width - GUEST_FRAME_HEIGHT)), zIndex: route.top, transform: [
        { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, (route.to - route.from) * width / 100] }) },
        { translateY: bob },
        { scale: index === 5 ? 0.86 : 1 },
      ] },
    ]}>
      <View style={[s.shadow, { backgroundColor: c.candyLavenderDark }]} />
      <Animated.View style={{ transform: [
        { scaleX: facing },
        { rotate: stride.interpolate({ inputRange: [-1, 1], outputRange: ['-1.5deg', '1.5deg'] }) },
      ] }}>
        <View style={s.spriteWindow}>
          <Image
            source={sheet}
            resizeMode="stretch"
            fadeDuration={0}
            style={[s.spriteSheet, {
              left: -(index % 4) * GUEST_FRAME_WIDTH,
              top: -Math.floor(index / 4) * GUEST_FRAME_HEIGHT,
            }]}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export function MallCustomers({ floor }: { floor: number }) {
  const [width, setWidth] = useState(360);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (active) setReducedMotion(enabled); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { active = false; subscription.remove(); };
  }, []);
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="mall-customers" style={StyleSheet.absoluteFill} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {ROUTES.map((_, index) => <Shopper key={`${floor}-${index}`} index={index} floor={floor} width={width} reducedMotion={reducedMotion} />)}
    </View>
  );
}

const s = StyleSheet.create({
  guest: { position: 'absolute', width: GUEST_FRAME_WIDTH, height: GUEST_FRAME_HEIGHT },
  shadow: { position: 'absolute', bottom: 7, left: 5, width: 22, height: 4, borderRadius: 12, opacity: 0.15 },
  spriteWindow: { width: GUEST_FRAME_WIDTH, height: GUEST_FRAME_HEIGHT, overflow: 'hidden' },
  spriteSheet: { position: 'absolute', width: GUEST_FRAME_WIDTH * 4, height: GUEST_FRAME_HEIGHT * 2 },
});
