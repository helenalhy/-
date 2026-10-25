import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MallWing } from '@/constants/mall-layout';
import { useColors } from '@/hooks/useColors';

type WingTabKeyboardEvent = {
  key: string;
  preventDefault: () => void;
};

type WingTabPressableProps = React.ComponentProps<typeof Pressable> & {
  onKeyDown?: (event: WingTabKeyboardEvent) => void;
};

const WingTabPressable = Pressable as React.ComponentType<WingTabPressableProps>;

const WINGS: { id: MallWing; name: string; capacity: number }[] = [
  { id: 'main', name: '主商場', capacity: 12 },
  { id: 'annex', name: '延伸區', capacity: 8 },
  { id: 'extension', name: '延伸區二', capacity: 12 },
  { id: 'extension3', name: '延伸區三', capacity: 12 },
  { id: 'extension4', name: '延伸區四', capacity: 12 },
];

export function MallWingPager({ counts, onWingChange, renderWing, focusWing, focusRequestId }: {
  counts: Record<MallWing, number>;
  onWingChange: () => void;
  renderWing: (wing: MallWing, active: boolean) => React.ReactNode;
  focusWing?: MallWing | null;
  focusRequestId?: number | null;
}) {
  const colors = useColors();
  const pager = useRef<ScrollView>(null);
  const tabs = useRef<ScrollView>(null);
  const tabRefs = useRef<Partial<Record<MallWing, React.ElementRef<typeof Pressable>>>>({});
  const [width, setWidth] = useState(360);
  const [activeWing, setActiveWing] = useState<MallWing>('main');

  function scrollTabsToWing(wing: MallWing) {
    const index = WINGS.findIndex((page) => page.id === wing);
    tabs.current?.scrollTo({ x: Math.max(0, index * 112 - 224), animated: true });
  }

  useEffect(() => {
    if (!focusWing || focusRequestId == null) return;
    const page = WINGS.findIndex((wing) => wing.id === focusWing);
    if (page < 0) return;
    setActiveWing(focusWing);
    pager.current?.scrollTo({ x: page * width, animated: true });
    scrollTabsToWing(focusWing);
  }, [focusWing, focusRequestId, width]);

  function changeWing(wing: MallWing) {
    if (wing !== activeWing) {
      onWingChange();
      setActiveWing(wing);
    }
    pager.current?.scrollTo({ x: WINGS.findIndex((page) => page.id === wing) * width, animated: true });
    scrollTabsToWing(wing);
  }

  function handleTabKeyDown(event: WingTabKeyboardEvent) {
    const activeIndex = WINGS.findIndex((wing) => wing.id === activeWing);
    let nextIndex: number;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (activeIndex + 1) % WINGS.length;
        break;
      case 'ArrowLeft':
        nextIndex = (activeIndex - 1 + WINGS.length) % WINGS.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = WINGS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextWing = WINGS[nextIndex].id;
    changeWing(nextWing);
    tabRefs.current[nextWing]?.focus();
  }

  return (
    <View onLayout={(event) => {
      const nextWidth = event.nativeEvent.layout.width;
      if (nextWidth > 0 && nextWidth !== width) {
        setWidth(nextWidth);
        requestAnimationFrame(() => pager.current?.scrollTo({ x: WINGS.findIndex((page) => page.id === activeWing) * nextWidth, animated: false }));
        requestAnimationFrame(() => scrollTabsToWing(activeWing));
      }
    }}>
      <ScrollView ref={tabs} horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" style={[s.tabScroller, { backgroundColor: colors.candyCream }]} contentContainerStyle={s.tabs} testID="mall-wing-tabs">
        {WINGS.map((wing) => {
          const selected = activeWing === wing.id;
          return (
            <WingTabPressable
              key={wing.id}
              ref={(node) => { tabRefs.current[wing.id] = node ?? undefined; }}
              testID={`mall-wing-${wing.id}`}
              onPress={() => changeWing(wing.id)}
              onKeyDown={Platform.OS === 'web' ? handleTabKeyDown : undefined}
              tabIndex={selected ? 0 : -1}
              accessibilityRole="tab"
              accessibilityLabel={`${wing.name}分區，${counts[wing.id]} 個位置已使用，共 ${wing.capacity} 個位置`}
              accessibilityState={{ selected }}
              style={[s.tab, { backgroundColor: selected ? colors.secondary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
            >
              <Text style={[s.tabText, { color: selected ? colors.primary : colors.mutedForeground }]}>{wing.name} {counts[wing.id]} / {wing.capacity}</Text>
            </WingTabPressable>
          );
        })}
      </ScrollView>
      <ScrollView ref={pager} horizontal pagingEnabled nestedScrollEnabled showsHorizontalScrollIndicator={false} style={{ width, height: width }} testID="mall-wing-pager"
        onMomentumScrollEnd={(event) => {
          const page = Math.max(0, Math.min(WINGS.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
          const wing = WINGS[page].id;
          if (wing !== activeWing) {
            setActiveWing(wing);
            onWingChange();
            scrollTabsToWing(wing);
          }
        }}>
        {WINGS.map((wing) => {
          const active = activeWing === wing.id;
          return (
            <View
              key={wing.id}
              testID={`mall-wing-content-${wing.id}`}
              style={{ width, height: width }}
              accessibilityElementsHidden={!active}
              importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
              aria-hidden={!active}
            >
              {renderWing(wing.id, active)}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  tabScroller: { flexGrow: 0 },
  tabs: { flexDirection: 'row', gap: 8, padding: 8 },
  tab: { width: 112, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1 },
  tabText: { fontSize: 12, fontWeight: '600' },
});
