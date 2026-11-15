import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import palette from '@/constants/colors';
import {
  GUEST_FRAME_CELLS,
  GUEST_FRAME_HEIGHT,
  GUEST_FRAME_WIDTH,
  GUEST_FRAME_SIZES_BY_FLOOR,
  GUEST_ROUTES,
  GUEST_ROWS,
  GUEST_SHEETS,
  GUEST_COLUMNS,
  GUEST_COUNTS_BY_FLOOR,
  getGuestRouteBounds,
} from '@/constants/mall-guests';

const c = palette.light;

function Shopper({ index, floor, width, reducedMotion, celebrationKey }: { index: number; floor: number; width: number; reducedMotion: boolean; celebrationKey: number }) {
  const route = GUEST_ROUTES[index];
  const progress = useRef(new Animated.Value(0)).current;
  const stride = useRef(new Animated.Value(0)).current;
  const facing = useRef(new Animated.Value(route.to > route.from ? 1 : -1)).current;
  const cheer = useRef(new Animated.Value(0)).current;
  const previousCelebrationKey = useRef<number | null>(null);
  const native = Platform.OS !== 'web';
  const frameSize = GUEST_FRAME_SIZES_BY_FLOOR[floor - 1] ?? { width: GUEST_FRAME_WIDTH, height: GUEST_FRAME_HEIGHT };
  const frameWidth = frameSize.width;
  const frameHeight = frameSize.height;
  const routeBounds = getGuestRouteBounds(route, frameSize, width);
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
  useEffect(() => {
    const isNewCelebration = previousCelebrationKey.current === null
      ? celebrationKey > 0
      : celebrationKey > previousCelebrationKey.current;
    previousCelebrationKey.current = celebrationKey;
    if (reducedMotion || !isNewCelebration) return undefined;
    cheer.setValue(0);
    const bounce = Animated.sequence([
      Animated.delay((index % 5) * 65),
      Animated.timing(cheer, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(cheer, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]);
    bounce.start();
    return () => bounce.stop();
  }, [celebrationKey, cheer, index, reducedMotion]);
  const bob = stride.interpolate({ inputRange: [-1, 0, 1], outputRange: [-1.3, 0, -1.3] });
  const cheerScaleY = cheer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.13, 1] });
  const sheet = GUEST_SHEETS[floor - 1];
  const frameCell = GUEST_FRAME_CELLS[index];
  return (
    <Animated.View testID={`mall-guest-${floor}-${index}`} style={[
      s.guest,
      { left: routeBounds.fromX, top: routeBounds.top, zIndex: route.top, width: frameWidth, height: frameHeight, transform: [
        { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, routeBounds.toX - routeBounds.fromX] }) },
        { translateY: bob },
      ] },
    ]}>
      <View style={[s.shadow, { backgroundColor: c.candyLavenderDark }]} />
      <Animated.View style={{ transform: [
        { scaleX: facing },
        { rotate: stride.interpolate({ inputRange: [-1, 1], outputRange: ['-1.5deg', '1.5deg'] }) },
        { scaleY: cheerScaleY },
      ] }}>
        <View style={[s.spriteWindow, { width: frameWidth, height: frameHeight }]}>
          <Image
            source={sheet}
            resizeMode="stretch"
            fadeDuration={0}
            style={[s.spriteSheet, {
              left: -frameCell.column * frameWidth,
              top: -frameCell.row * frameHeight,
              width: frameWidth * GUEST_COLUMNS,
              height: frameHeight * GUEST_ROWS,
            }]}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export function MallCustomers({ floor, celebrationKey = 0 }: { floor: number; celebrationKey?: number }) {
  const [width, setWidth] = useState(360);
  const [reducedMotion, setReducedMotion] = useState(false);
  const guestCount = GUEST_COUNTS_BY_FLOOR[floor - 1] ?? 0;
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (active) setReducedMotion(enabled); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { active = false; subscription.remove(); };
  }, []);
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="mall-customers" style={StyleSheet.absoluteFill} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {GUEST_ROUTES.slice(0, guestCount).map((_, index) => <Shopper key={`${floor}-${index}`} index={index} floor={floor} width={width} reducedMotion={reducedMotion} celebrationKey={celebrationKey} />)}
    </View>
  );
}

const s = StyleSheet.create({
  guest: { position: 'absolute' },
  shadow: { position: 'absolute', bottom: 7, left: 10, width: 28, height: 4, borderRadius: 12, opacity: 0.15 },
  spriteWindow: { overflow: 'hidden' },
  spriteSheet: { position: 'absolute' },
});
