import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export type MallElevatorFloor = { floor: number; title: string };

export type MallElevatorPanelProps = {
  visible: boolean;
  currentFloor: number;
  floors: readonly MallElevatorFloor[];
  disabled?: boolean;
  onClose: () => void;
  onSelectFloor: (floor: number) => void;
};

const FLOOR_TINTS = ['candyPink', 'candyPeach', 'candyLemon', 'candyMint', 'candySky', 'candyLavender'] as const;
const useNativeDriver = Platform.OS !== 'web';

export function MallElevatorPanel({
  visible,
  currentFloor,
  floors,
  disabled = false,
  onClose,
  onSelectFloor,
}: MallElevatorPanelProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const doors = useRef(new Animated.Value(0)).current;
  const travel = useRef(new Animated.Value(0)).current;
  const sequenceRef = useRef<Animated.CompositeAnimation | null>(null);
  const closeRef = useRef(onClose);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [travelingTo, setTravelingTo] = useState<number | null>(null);
  const [displayFloor, setDisplayFloor] = useState(currentFloor);

  closeRef.current = onClose;

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      sequenceRef.current?.stop();
      setTravelingTo(null);
      doors.setValue(1);
      travel.setValue(0);
      return;
    }
    setDisplayFloor(currentFloor);
    if (reduceMotion) {
      doors.setValue(1);
      return;
    }
    doors.setValue(0);
    const entrance = Animated.timing(doors, { toValue: 1, duration: 440, useNativeDriver });
    sequenceRef.current = entrance;
    entrance.start();
    return () => entrance.stop();
  }, [visible, currentFloor, reduceMotion, doors, travel]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (travelingTo !== null) return true;
      closeRef.current();
      return true;
    });
    return () => subscription.remove();
  }, [visible, travelingTo]);

  function chooseFloor(floor: number) {
    if (disabled || travelingTo !== null || floor === currentFloor) return;
    setTravelingTo(floor);
    setDisplayFloor(floor);
    if (reduceMotion) {
      onSelectFloor(floor);
      setTravelingTo(null);
      onClose();
      return;
    }
    const animation = Animated.sequence([
       Animated.timing(doors, { toValue: 0, duration: 180, useNativeDriver }),
       Animated.timing(travel, { toValue: 1, duration: 520, useNativeDriver }),
      Animated.delay(140),
       Animated.timing(doors, { toValue: 1, duration: 380, useNativeDriver }),
    ]);
    sequenceRef.current = animation;
    animation.start(({ finished }) => {
      if (!finished) return;
      onSelectFloor(floor);
      setTravelingTo(null);
      onClose();
    });
  }

  if (!visible) return null;

  const floorNumber = (floor: number) => `${floor}F`;
  const current = floors.find((floor) => floor.floor === currentFloor);
  const displayTheme = floors.find((floor) => floor.floor === displayFloor);
  const leftDoorStyle = {
    transform: [{ translateX: doors.interpolate({ inputRange: [0, 1], outputRange: [0, -300] }) }],
  };
  const rightDoorStyle = {
    transform: [{ translateX: doors.interpolate({ inputRange: [0, 1], outputRange: [0, 300] }) }],
  };
  const displayPulse = {
    opacity: travel.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 0.45, 1] }),
    transform: [{ translateY: travel.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  };
  const handleModalClose = () => {
    if (travelingTo === null) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleModalClose}
    >
      <View
        style={[s.backdrop, { backgroundColor: colors.background }]}
        testID="mall-elevator-panel"
        accessibilityViewIsModal
        accessibilityLabel="商場電梯樓層選擇"
      >
      <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
        <View style={[s.header, {
          paddingTop: Platform.OS === 'web' ? Math.max(insets.top, 67) : Math.max(insets.top, 10),
        }]}>
          <View style={s.headerCopy}>
            <Text style={[s.eyebrow, { color: colors.primary }]}>MOMENTUM MALL</Text>
            <Text style={[s.heading, { color: colors.foreground }]}>搭電梯，去逛逛</Text>
          </View>
          <Pressable
            onPress={onClose}
            disabled={travelingTo !== null}
            style={({ pressed }) => [s.closeButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.68 : travelingTo !== null ? 0.45 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="關閉樓層選擇"
            accessibilityHint="返回商場"
            accessibilityState={{ disabled: travelingTo !== null }}
            testID="mall-elevator-close"
          >
            <Text style={[s.closeMark, { color: colors.foreground }]}>×</Text>
          </Pressable>
        </View>

        <View style={[s.elevatorCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View style={s.elevatorTop}>
            <View style={[s.floorDisplay, { backgroundColor: colors.candyInk }]}>
              <Animated.View style={[s.displayInner, displayPulse]}>
                <Text style={[s.displayLabel, { color: colors.candyRose }]}>
                  {travelingTo !== null ? '目的樓層' : '目前樓層'}
                </Text>
                <Text
                  style={[s.displayNumber, { color: colors.candyCream }]}
                  testID="mall-elevator-current-floor"
                  accessibilityRole="text"
                  accessibilityLabel={`${travelingTo !== null ? '目的樓層' : '目前樓層'} ${floorNumber(displayFloor)}${displayTheme?.title ? `，${displayTheme.title}` : ''}${travelingTo !== null ? '，電梯行進中' : ''}`}
                  accessibilityLiveRegion={Platform.OS === 'android' ? 'polite' : 'none'}
                >
                  {floorNumber(displayFloor)}
                </Text>
              </Animated.View>
              <View style={[s.displayLight, { backgroundColor: colors.candyMintDark }]} />
            </View>
            <View style={s.liftCaption}>
              <Text style={[s.liftCaptionTitle, { color: colors.foreground }]}>目的樓層</Text>
              <Text style={[s.liftCaptionBody, { color: colors.mutedForeground }]}>
                {travelingTo !== null ? '電梯正在前往…' : current?.title ?? '選一層開始探索'}
              </Text>
            </View>
          </View>

          <View style={[s.elevatorFrame, { backgroundColor: colors.candyCaramel, borderColor: colors.candyCaramelDark }]}>
            <View style={[s.elevatorInterior, { backgroundColor: colors.candyCream }]}>
              <View style={[s.elevatorCeiling, { backgroundColor: colors.candyLemon }]} />
              <View style={[s.elevatorBack, { backgroundColor: colors.card }]} />
              <View style={[s.floorLine, { backgroundColor: colors.candyCaramel }]} />
              <Animated.View style={[s.door, s.leftDoor, { backgroundColor: colors.candyRose, borderColor: colors.border }, leftDoorStyle]} />
              <Animated.View style={[s.door, s.rightDoor, { backgroundColor: colors.candyPeach, borderColor: colors.border }, rightDoorStyle]} />
              <View pointerEvents="none" style={[s.doorSeam, { backgroundColor: colors.border }]} />
              <View style={[s.doorHandle, { backgroundColor: colors.candyRoseDark }]} />
              <View style={[s.doorHandle, s.rightHandle, { backgroundColor: colors.candyCaramelDark }]} />
            </View>
          </View>
          <View style={s.elevatorFooter}>
            <View style={[s.statusDot, { backgroundColor: travelingTo !== null ? colors.candyOrange : colors.candyMintDark }]} />
            <Text style={[s.elevatorFooterText, { color: colors.mutedForeground }]}>
              {travelingTo !== null ? '正在移動' : '每層都有新的小驚喜'}
            </Text>
            <View style={[s.floorPips, { backgroundColor: colors.card }]}>
              {[0, 1, 2].map((pip) => (
                <View key={pip} style={[s.pip, { backgroundColor: pip === 1 ? colors.primary : colors.border }]} />
              ))}
            </View>
          </View>
        </View>

        <View style={s.floorHeading}>
          <View>
            <Text style={[s.floorTitle, { color: colors.foreground }]}>選擇樓層</Text>
            <Text style={[s.floorSubtitle, { color: colors.mutedForeground }]}>點一下，直達想去的地方</Text>
          </View>
          <Text style={[s.floorCount, { color: colors.primary }]}>共 {floors.length} 層</Text>
        </View>

        <ScrollView
          style={s.floorScroll}
          contentContainerStyle={[s.floorGrid, {
            paddingBottom: Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 14),
          }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          accessibilityLabel="可前往樓層"
        >
          {floors.map(({ floor, title }, index) => {
            const selected = floor === currentFloor;
            const blocked = disabled || travelingTo !== null || selected;
            const tint = colors[FLOOR_TINTS[index % FLOOR_TINTS.length]];
            return (
              <Pressable
                key={floor}
                onPress={() => chooseFloor(floor)}
                disabled={blocked}
                accessibilityRole="button"
                accessibilityLabel={`${floorNumber(floor)}，${title}${selected ? '，目前所在樓層' : blocked ? '，無法選擇' : '，前往此樓層'}`}
                accessibilityHint={selected ? undefined : '選擇後電梯將直接前往此樓層'}
                accessibilityState={{ selected, disabled: blocked, busy: travelingTo === floor }}
                style={({ pressed }) => [
                  s.floorButton,
                  {
                    backgroundColor: selected ? colors.accent : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                    opacity: blocked && !selected ? 0.5 : pressed ? 0.72 : 1,
                    transform: [{ scale: pressed && !blocked ? 0.97 : 1 }],
                  },
                ]}
                testID={`mall-elevator-select-floor-${floor}`}
              >
                <View style={[s.floorBadge, { backgroundColor: selected ? colors.primary : tint }]}>
                  <Text style={[s.floorNumber, { color: selected ? colors.primaryForeground : colors.foreground }]}>{floorNumber(floor)}</Text>
                </View>
                <View style={s.floorTextWrap}>
                  <Text numberOfLines={1} style={[s.floorTheme, { color: selected ? colors.primary : colors.foreground }]}>{title}</Text>
                  <Text style={[s.floorHint, { color: selected ? colors.accentForeground : colors.mutedForeground }]}>
                    {selected ? '目前所在' : '前往樓層'}
                  </Text>
                </View>
                {selected ? (
                  <View style={[s.currentPill, { backgroundColor: colors.primary }]}>
                    <Text style={[s.currentPillText, { color: colors.primaryForeground }]}>目前</Text>
                  </View>
                ) : (
                  <Text style={[s.chevron, { color: colors.mutedForeground }]}>›</Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, zIndex: 1000, elevation: 30 },
  safeArea: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { minHeight: 72, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCopy: { gap: 2 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  heading: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  closeButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  closeMark: { fontSize: 30, lineHeight: 34, fontWeight: '300', marginTop: -2 },
  elevatorCard: { marginHorizontal: 16, paddingHorizontal: 16, paddingTop: 13, paddingBottom: 12, borderRadius: 24, borderWidth: 1 },
  elevatorTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  floorDisplay: { minWidth: 105, minHeight: 62, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  displayInner: { gap: 1 },
  displayLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  displayNumber: { fontSize: 29, lineHeight: 34, fontWeight: '900', fontVariant: ['tabular-nums'] },
  displayLight: { width: 7, height: 7, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  liftCaption: { alignItems: 'flex-end', flex: 1, paddingLeft: 12 },
  liftCaptionTitle: { fontSize: 14, fontWeight: '800' },
  liftCaptionBody: { fontSize: 11, marginTop: 3, textAlign: 'right' },
  elevatorFrame: { height: 116, borderRadius: 17, borderWidth: 2, padding: 5, overflow: 'hidden' },
  elevatorInterior: { flex: 1, borderRadius: 11, overflow: 'hidden', alignItems: 'center' },
  elevatorCeiling: { position: 'absolute', top: 0, left: 0, right: 0, height: 12, opacity: 0.85 },
  elevatorBack: { position: 'absolute', top: 12, bottom: 10, width: '44%', borderTopLeftRadius: 40, borderTopRightRadius: 40, opacity: 0.76 },
  floorLine: { position: 'absolute', bottom: 10, height: 2, left: 0, right: 0 },
  door: { position: 'absolute', top: 0, bottom: 0, width: '50%', borderWidth: 1 },
  leftDoor: { left: 0, borderTopLeftRadius: 11, borderBottomLeftRadius: 11 },
  rightDoor: { right: 0, borderTopRightRadius: 11, borderBottomRightRadius: 11 },
  doorSeam: { position: 'absolute', top: 12, bottom: 11, width: 1, left: '50%' },
  doorHandle: { position: 'absolute', width: 4, height: 27, borderRadius: 3, left: '45%', top: '43%' },
  rightHandle: { left: undefined, right: '45%' },
  elevatorFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  elevatorFooterText: { fontSize: 11, fontWeight: '600', flex: 1 },
  floorPips: { flexDirection: 'row', gap: 3, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 9 },
  pip: { width: 4, height: 4, borderRadius: 2 },
  floorHeading: { marginTop: 18, marginHorizontal: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  floorTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  floorSubtitle: { fontSize: 11, marginTop: 2 },
  floorCount: { fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginBottom: 3 },
  floorScroll: { flex: 1 },
  floorGrid: { paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  floorButton: { width: '48.5%', minHeight: 64, borderWidth: 1, borderRadius: 15, paddingHorizontal: 9, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  floorBadge: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  floorNumber: { fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] },
  floorTextWrap: { flex: 1, minWidth: 0, justifyContent: 'center' },
  floorTheme: { fontSize: 12, fontWeight: '800' },
  floorHint: { fontSize: 9, marginTop: 3 },
  currentPill: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 7 },
  currentPillText: { fontSize: 8, fontWeight: '800' },
  chevron: { fontSize: 22, lineHeight: 24, marginLeft: -2 },
});

export default MallElevatorPanel;
