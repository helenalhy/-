import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import palette from '@/constants/colors';
import { ThemedMallObject } from './ThemedMallObject';

const c = palette.light;

export function MallObjectVisual({ id, color, icon, category }: {
  id: string;
  color: string;
  icon: string;
  category: string;
}) {
  if (category === 'shop') {
    return (
      <View style={s.shop}>
        <View style={[s.awning, { backgroundColor: color }]}>
          {[0, 1, 2, 3, 4].map((n) => <View key={n} style={[s.stripe, { backgroundColor: n % 2 ? color : c.card }]} />)}
        </View>
        <View style={[s.shopFront, { backgroundColor: c.candyCream, borderColor: color }]}>
          <View style={[s.window, { backgroundColor: c.candySky }]}>
            <Feather name={icon as keyof typeof Feather.glyphMap} size={18} color={c.candyCaramelDark} />
          </View>
          <View style={[s.door, { backgroundColor: color, borderColor: c.candyCaramelDark }]} />
        </View>
      </View>
    );
  }
  if (!['central-fountain', 'wooden-bench', 'garden-lights', 'colorful-planter', 'rest-pavilion', 'cloud-walk'].includes(id)) {
    return <ThemedMallObject id={id} color={color} />;
  }
  if (id === 'central-fountain') return <MiniFountain color={color} />;
  if (id === 'wooden-bench') {
    return <View style={s.object}><View style={[s.benchBack, { backgroundColor: c.candyCaramelDark }]} /><View style={[s.benchSeat, { backgroundColor: color }]} /><View style={s.legs}><View style={[s.leg, { backgroundColor: c.candyInk }]} /><View style={[s.leg, { backgroundColor: c.candyInk }]} /></View></View>;
  }
  if (id === 'garden-lights') {
    return <View style={s.object}><View style={[s.lampGlow, { backgroundColor: color }]} /><View style={[s.lampStem, { backgroundColor: c.candyCaramelDark }]} /><View style={[s.lampBase, { backgroundColor: c.candyCaramelDark }]} /></View>;
  }
  if (id === 'colorful-planter') {
    return <View style={s.object}><View style={s.flowers}>{[c.candyRose, c.candyLemon, c.candyLavender].map((flower, i) => <View key={i} style={s.flower}><View style={[s.flowerHead, { backgroundColor: flower, borderColor: c.candyRoseDark }]} /><View style={[s.flowerStem, { backgroundColor: c.candyMintDark }]} /></View>)}</View><View style={[s.planter, { backgroundColor: color }]} /></View>;
  }
  if (id === 'rest-pavilion') {
    return <View style={s.object}><View style={[s.pavilionRoof, { borderBottomColor: color }]} /><View style={s.pavilionColumns}><View style={[s.column, { backgroundColor: c.candyPeach }]} /><View style={[s.column, { backgroundColor: c.candyPeach }]} /></View><View style={[s.pavilionBase, { backgroundColor: color }]} /></View>;
  }
  return <View style={s.object}><View style={s.walkway}>{[0, 1, 2, 3].map((n) => <View key={n} style={[s.paving, { backgroundColor: n % 2 ? c.candyPeach : c.candyCream }]} />)}</View><View style={[s.pathPlant, { backgroundColor: c.candyMintDark }]} /></View>;
}

function MiniFountain({ color }: { color: string }) {
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(rise, { toValue: -4, duration: 900, useNativeDriver: false }),
      Animated.timing(rise, { toValue: 0, duration: 900, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [rise]);
  return <View style={s.object}><Animated.View style={{ transform: [{ translateY: rise }] }}><Feather name="droplet" size={24} color={c.candySkyDark} /></Animated.View><View style={[s.fountainBowl, { backgroundColor: color, borderColor: c.candySkyDark }]} /><View style={[s.fountainFoot, { backgroundColor: c.candyLavender }]} /></View>;
}

export function MallAmbience() {
  const shimmer = useRef(new Animated.Value(0.25)).current;
  const stroll = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const twinkle = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 0.95, duration: 1600, useNativeDriver: false }),
      Animated.timing(shimmer, { toValue: 0.25, duration: 1600, useNativeDriver: false }),
    ]));
    const visitors = Animated.loop(Animated.sequence([
      Animated.timing(stroll, { toValue: 85, duration: 12000, easing: Easing.linear, useNativeDriver: false }),
      Animated.timing(stroll, { toValue: 0, duration: 12000, easing: Easing.linear, useNativeDriver: false }),
    ]));
    twinkle.start();
    visitors.start();
    return () => { twinkle.stop(); visitors.stop(); };
  }, [shimmer, stroll]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[s.sparkle, { left: '24%', top: '8%', opacity: shimmer }]}><Feather name="star" size={11} color={c.card} /></Animated.View>
      <Animated.View style={[s.sparkle, { right: '20%', top: '11%', opacity: shimmer }]}><Feather name="star" size={8} color={c.card} /></Animated.View>
      <Animated.View style={[s.waterGlint, { opacity: shimmer }]}><Feather name="droplet" size={14} color={c.candySkyDark} /></Animated.View>
      <Animated.View style={[s.visitor, { left: '25%', top: '68%', transform: [{ translateX: stroll }] }]}>
        <View style={[s.head, { backgroundColor: c.candyCaramel }]} /><View style={[s.body, { backgroundColor: c.candyRoseDark }]} />
      </Animated.View>
      <Animated.View style={[s.visitor, { left: '43%', top: '73%', transform: [{ translateX: Animated.multiply(stroll, -0.7) }] }]}>
        <View style={[s.head, { backgroundColor: c.candyPeach }]} /><View style={[s.body, { backgroundColor: c.candySkyDark }]} />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  shop: { width: 62, height: 47 },
  awning: { height: 11, flexDirection: 'row', overflow: 'hidden', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  stripe: { flex: 1, height: 11, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  shopFront: { flex: 1, borderWidth: 3, flexDirection: 'row', padding: 3, gap: 4 },
  window: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 2 },
  door: { width: 12, borderWidth: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  object: { width: 62, height: 47, alignItems: 'center', justifyContent: 'flex-end' },
  benchBack: { height: 13, width: 49, borderRadius: 3 },
  benchSeat: { height: 7, width: 55, borderRadius: 2 },
  legs: { width: 43, justifyContent: 'space-between', flexDirection: 'row' },
  leg: { width: 4, height: 10 },
  lampGlow: { width: 23, height: 18, borderRadius: 9 },
  lampStem: { width: 4, height: 24 },
  lampBase: { width: 20, height: 4, borderRadius: 2 },
  flowers: { flexDirection: 'row', gap: 3, alignItems: 'flex-end' },
  flower: { alignItems: 'center' },
  flowerHead: { width: 13, height: 13, borderRadius: 7, borderWidth: 1 },
  flowerStem: { width: 3, height: 13 },
  planter: { width: 53, height: 14, borderBottomLeftRadius: 9, borderBottomRightRadius: 9 },
  pavilionRoof: { width: 0, height: 0, borderLeftWidth: 30, borderRightWidth: 30, borderBottomWidth: 18, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  pavilionColumns: { flexDirection: 'row', justifyContent: 'space-between', width: 42 },
  column: { width: 5, height: 23 },
  pavilionBase: { width: 58, height: 6, borderRadius: 2 },
  walkway: { flexDirection: 'row', flexWrap: 'wrap', width: 52, transform: [{ rotate: '-12deg' }] },
  paving: { width: 25, height: 15, margin: 0.5, borderRadius: 2 },
  pathPlant: { width: 12, height: 20, borderRadius: 7, position: 'absolute', right: 0, top: 8 },
  fountainBowl: { width: 48, height: 13, borderWidth: 2, borderRadius: 24 },
  fountainFoot: { width: 55, height: 7, borderRadius: 20 },
  sparkle: { position: 'absolute' },
  waterGlint: { position: 'absolute', left: '48%', top: '82%' },
  visitor: { position: 'absolute', alignItems: 'center' },
  head: { width: 5, height: 5, borderRadius: 3 },
  body: { width: 7, height: 12, borderRadius: 3 },
});
