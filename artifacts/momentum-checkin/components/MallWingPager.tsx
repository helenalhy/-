import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MallWing } from '@/constants/mall-layout';
import { useColors } from '@/hooks/useColors';

type WingTabKeyboardEvent = {
  key?: string;
  nativeEvent?: { key: string };
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
  const scrollSettleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabRefs = useRef<Partial<Record<MallWing, React.ElementRef<typeof Pressable>>>>({});
  const [width, setWidth] = useState(360);
  const [activeWing, setActiveWing] = useState<MallWing>('main');
  const activeWingRef = useRef(activeWing);
  activeWingRef.current = activeWing;
  const [wingAnnouncement, setWingAnnouncement] = useState('');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const styleId = 'mall-wing-forced-colors-focus';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @media (forced-colors: active) {
        [data-testid="mall-wing-tabs"] [role="tab"]:focus-visible,
        [data-testid^="mall-wing-content-"] :focus-visible {
          outline: 3px solid Highlight !important;
          outline-offset: 2px !important;
          forced-color-adjust: auto;
        }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  function announceWing(wing: MallWing) {
    const message = `目前所在區域：${WINGS.find((page) => page.id === wing)?.name ?? ''}`;
    setWingAnnouncement(message);
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  function scrollTabsToWing(wing: MallWing, animated = true) {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const scroller = document.querySelector<HTMLElement>('[data-testid="mall-wing-tabs"]');
      const tab = document.querySelector<HTMLElement>(`[data-testid="mall-wing-${wing}"]`);
      if (scroller && tab) {
        const scrollerRect = scroller.getBoundingClientRect();
        const tabRect = tab.getBoundingClientRect();
        let targetOffset = scroller.scrollLeft;
        const focusRingClearance = 6;
        if (tabRect.left < scrollerRect.left + focusRingClearance) {
          targetOffset -= scrollerRect.left + focusRingClearance - tabRect.left;
        }
        if (tabRect.right > scrollerRect.right - focusRingClearance) {
          targetOffset += tabRect.right - scrollerRect.right + focusRingClearance;
        }
        scroller.scrollLeft = targetOffset;
        return;
      }
    }
    const index = WINGS.findIndex((page) => page.id === wing);
    tabs.current?.scrollTo({ x: Math.max(0, index * 112 - 224), animated });
  }

  useEffect(() => {
    if (!focusWing || focusRequestId == null) return;
    const page = WINGS.findIndex((wing) => wing.id === focusWing);
    if (page < 0) return;
    setActiveWing(focusWing);
    pager.current?.scrollTo({ x: page * width, animated: true });
    scrollTabsToWing(focusWing);
  }, [focusWing, focusRequestId, width]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const selectedWing = activeWingRef.current;
      const page = WINGS.findIndex((wing) => wing.id === selectedWing);
      pager.current?.scrollTo({ x: page * width, animated: false });
      scrollTabsToWing(selectedWing, false);
    });
    return () => cancelAnimationFrame(frame);
  }, [width]);

  function changeWing(wing: MallWing, animated = true) {
    if (wing !== activeWing) {
      onWingChange();
      activeWingRef.current = wing;
      setActiveWing(wing);
      announceWing(wing);
    }
    pager.current?.scrollTo({ x: WINGS.findIndex((page) => page.id === wing) * width, animated });
    scrollTabsToWing(wing, animated);
  }

  function handleTabKeyDown(event: WingTabKeyboardEvent) {
    const key = event.key ?? event.nativeEvent?.key;
    const activeIndex = WINGS.findIndex((wing) => wing.id === activeWing);
    let nextIndex: number;
    switch (key) {
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
    changeWing(nextWing, !reduceMotion);
    tabRefs.current[nextWing]?.focus();
  }

  function handlePagerScrollEnd(offset: number) {
    const page = Math.max(0, Math.min(WINGS.length - 1, Math.round(offset / width)));
    const wing = WINGS[page].id;
    if (wing !== activeWingRef.current) {
      activeWingRef.current = wing;
      setActiveWing(wing);
      onWingChange();
      scrollTabsToWing(wing);
      announceWing(wing);
    }
  }

  useEffect(() => () => {
    if (scrollSettleTimer.current) clearTimeout(scrollSettleTimer.current);
  }, []);

  return (
    <View onLayout={(event) => {
      const nextWidth = event.nativeEvent.layout.width;
      if (nextWidth > 0 && nextWidth !== width) {
        setWidth(nextWidth);
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
              onKeyDown={handleTabKeyDown}
              focusable={Platform.OS === 'web' ? undefined : selected}
              tabIndex={selected ? 0 : -1}
              aria-selected={selected}
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
      {Platform.OS !== 'ios' && (
        <Text
          testID="mall-wing-announcement"
          accessibilityLiveRegion={Platform.OS === 'android' ? 'polite' : undefined}
          role={Platform.OS === 'web' ? 'status' : undefined}
          aria-live={Platform.OS === 'web' ? 'polite' : undefined}
          style={s.visuallyHidden}
        >
          {wingAnnouncement}
        </Text>
      )}
      <ScrollView ref={pager} horizontal pagingEnabled nestedScrollEnabled showsHorizontalScrollIndicator={false} scrollEventThrottle={16} style={{ width, height: width }} testID="mall-wing-pager"
        onScroll={(event) => {
          if (Platform.OS !== 'web') return;
          if (scrollSettleTimer.current) clearTimeout(scrollSettleTimer.current);
          const offset = event.nativeEvent.contentOffset.x;
          scrollSettleTimer.current = setTimeout(() => handlePagerScrollEnd(offset), 120);
        }}
        onMomentumScrollEnd={(event) => {
          handlePagerScrollEnd(event.nativeEvent.contentOffset.x);
        }}>
        {WINGS.map((wing) => {
          const active = activeWing === wing.id;
          return (
            <View
              key={wing.id}
              ref={(node) => {
                if (Platform.OS === 'web' && node) {
                  (node as unknown as HTMLElement).inert = !active;
                }
              }}
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
  visuallyHidden: { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', borderWidth: 0 },
});
