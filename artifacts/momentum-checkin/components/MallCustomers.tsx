import React, { useEffect, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import palette from '@/constants/colors';
import {
  BEAUTY_BAG_GUEST_INDICES,
  COSMETICS_SHOP_FLOOR,
  GUEST_FRAME_CELLS,
  GUEST_FRAME_HEIGHT,
  GUEST_FRAME_WIDTH,
  GUEST_FRAME_SIZES_BY_FLOOR,
  GUEST_ROUTES,
  GUEST_ROWS,
  GUEST_SHEETS,
  GUEST_COLUMNS,
  GUEST_COUNTS_BY_FLOOR,
} from '@/constants/mall-guests';

const c = palette.light;
const beautyBagColors = [c.candyPink, c.candyLavender, c.candyPeach, c.candySky, c.candyMint, c.candyCoral];

function Shopper({ index, floor, width, reducedMotion }: { index: number; floor: number; width: number; reducedMotion: boolean }) {
  const route = GUEST_ROUTES[index];
  const progress = useRef(new Animated.Value(0)).current;
  const stride = useRef(new Animated.Value(0)).current;
  const facing = useRef(new Animated.Value(route.to > route.from ? 1 : -1)).current;
  const native = Platform.OS !== 'web';
  const frameSize = GUEST_FRAME_SIZES_BY_FLOOR[floor - 1] ?? { width: GUEST_FRAME_WIDTH, height: GUEST_FRAME_HEIGHT };
  const frameWidth = frameSize.width;
  const frameHeight = frameSize.height;
  const carriesBeautyBag = floor === COSMETICS_SHOP_FLOOR
    && (BEAUTY_BAG_GUEST_INDICES as readonly number[]).includes(index);
  const beautyBagColor = beautyBagColors[index % beautyBagColors.length];
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
  const frameCell = GUEST_FRAME_CELLS[index];
  return (
    <Animated.View testID={`mall-guest-${floor}-${index}`} style={[
      s.guest,
      { left: `${route.from}%`, top: Math.min(route.top * width / 100, Math.max(0, width - frameHeight)), zIndex: route.top, width: frameWidth, height: frameHeight, transform: [
        { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, (route.to - route.from) * width / 100] }) },
        { translateY: bob },
      ] },
    ]}>
      <View style={[s.shadow, { backgroundColor: c.candyLavenderDark }]} />
      <Animated.View style={{ transform: [
        { scaleX: facing },
        { rotate: stride.interpolate({ inputRange: [-1, 1], outputRange: ['-1.5deg', '1.5deg'] }) },
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
        {carriesBeautyBag && (
          <View testID={`mall-guest-beauty-bag-${floor}-${index}`} style={s.beautyBagWrap}>
            <View style={[s.beautyBagHandle, { borderColor: c.candyRoseDark }]} />
            <View style={[s.beautyBag, { backgroundColor: beautyBagColor, borderColor: c.candyRoseDark }]}>
              <Feather name={index % 2 === 0 ? 'heart' : 'star'} size={6} color={c.candyRoseDark} />
            </View>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

export function MallCustomers({ floor }: { floor: number }) {
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
      {GUEST_ROUTES.slice(0, guestCount).map((_, index) => <Shopper key={`${floor}-${index}`} index={index} floor={floor} width={width} reducedMotion={reducedMotion} />)}
    </View>
  );
}

const s = StyleSheet.create({
  guest: { position: 'absolute' },
  shadow: { position: 'absolute', bottom: 7, left: 10, width: 28, height: 4, borderRadius: 12, opacity: 0.15 },
  spriteWindow: { overflow: 'hidden' },
  spriteSheet: { position: 'absolute' },
  beautyBagWrap: { position: 'absolute', left: 32, bottom: 9, width: 14, height: 17, alignItems: 'center', justifyContent: 'flex-end' },
  beautyBagHandle: { position: 'absolute', top: 0, width: 6, height: 5, borderWidth: 1.2, borderBottomWidth: 0, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  beautyBag: { width: 12, height: 12, borderWidth: 1, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
});
