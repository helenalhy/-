import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MallWing } from '@/constants/mall-layout';
import { useColors } from '@/hooks/useColors';

const WINGS: { id: MallWing; name: string; capacity: number }[] = [
  { id: 'main', name: '主商場', capacity: 12 },
  { id: 'annex', name: '延伸區', capacity: 8 },
  { id: 'extension', name: '延伸區二', capacity: 12 },
];

export function MallWingPager({ counts, onWingChange, renderWing }: {
  counts: Record<MallWing, number>;
  onWingChange: () => void;
  renderWing: (wing: MallWing, active: boolean) => React.ReactNode;
}) {
  const colors = useColors();
  const pager = useRef<ScrollView>(null);
  const [width, setWidth] = useState(360);
  const [activeWing, setActiveWing] = useState<MallWing>('main');

  function changeWing(wing: MallWing) {
    if (wing !== activeWing) {
      onWingChange();
      setActiveWing(wing);
    }
    pager.current?.scrollTo({ x: WINGS.findIndex((page) => page.id === wing) * width, animated: true });
  }

  return (
    <View onLayout={(event) => {
      const nextWidth = event.nativeEvent.layout.width;
      if (nextWidth > 0 && nextWidth !== width) {
        setWidth(nextWidth);
        requestAnimationFrame(() => pager.current?.scrollTo({ x: WINGS.findIndex((page) => page.id === activeWing) * nextWidth, animated: false }));
      }
    }}>
      <View style={[s.tabs, { backgroundColor: colors.candyCream }]}>
        {WINGS.map((wing) => {
          const selected = activeWing === wing.id;
          return (
            <Pressable key={wing.id} testID={`mall-wing-${wing.id}`} onPress={() => changeWing(wing.id)} accessibilityRole="button" accessibilityState={{ selected }} style={[s.tab, { backgroundColor: selected ? colors.secondary : colors.card, borderColor: selected ? colors.primary : colors.border }]}>
              <Text style={[s.tabText, { color: selected ? colors.primary : colors.mutedForeground }]}>{wing.name} {counts[wing.id]} / {wing.capacity}</Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView ref={pager} horizontal pagingEnabled nestedScrollEnabled showsHorizontalScrollIndicator={false} style={{ width, height: width }} testID="mall-wing-pager"
        onMomentumScrollEnd={(event) => {
          const page = Math.max(0, Math.min(WINGS.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
          const wing = WINGS[page].id;
          if (wing !== activeWing) {
            setActiveWing(wing);
            onWingChange();
          }
        }}>
        {WINGS.map((wing) => <View key={wing.id} style={{ width, height: width }}>{renderWing(wing.id, activeWing === wing.id)}</View>)}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, padding: 8 },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1 },
  tabText: { fontSize: 12, fontWeight: '600' },
});
