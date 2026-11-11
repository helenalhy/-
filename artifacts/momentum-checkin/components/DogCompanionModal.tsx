import { Feather } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { Image as ExpoImage } from 'expo-image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DogStaffFoodOption } from '@/constants/dog-staff-foods';
import { DOG_STAFF_FOOD_OPTIONS } from '@/constants/dog-staff-foods';
import { getDogFluffyImage } from '@/constants/dog-fluffy-images';
import type { DogStaffLook, DogStaffProfile } from '@/constants/dog-staff-customization';
import { DogAttendant, type DogAttendantKind } from '@/components/DogAttendant';
import { useColors } from '@/hooks/useColors';
import { buildDogCompanionPostcardSvg } from '@/lib/dog-companion-postcard';
import {
  DOG_FEED_COST,
  type DogCompanionAction,
  type DogCompanionInteractionResult,
} from '@/lib/dog-companion';
import { downloadSvgAsPng } from '@/lib/postcard-export';
import { DogFoodIllustration } from '@/components/ShopInteriorScene';
import { getDogCompanionToys, type DogCompanionToy } from '@/constants/dog-companion-toys';

type DogCompanionModalProps = {
  visible: boolean;
  dog: DogStaffProfile | null;
  artStyle: 'original' | 'fluffy';
  dogLook?: DogStaffLook;
  owned: boolean;
  coins: number;
  today: string;
  affection: number;
  onClose: () => void;
  onInteract: (
    dogDecorationId: string,
    action: DogCompanionAction,
    requestedAffection: number,
    coinCost: number,
  ) => Promise<DogCompanionInteractionResult>;
};

type CompanionActionButtonProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  detail: string;
  disabled: boolean;
  testID: string;
  onPress: () => void;
  color: string;
  backgroundColor: string;
};

function ActionButton({
  icon,
  title,
  detail,
  disabled,
  testID,
  onPress,
  color,
  backgroundColor,
}: CompanionActionButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}，${detail}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor, opacity: disabled ? 0.55 : pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${color}18` }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.actionTitle, { color }]}>{title}</Text>
      <Text style={styles.actionDetail}>{detail}</Text>
    </Pressable>
  );
}

function foodKeyForTest(food: DogStaffFoodOption): string {
  return food.id.replace(/[^a-zA-Z0-9-]/g, '-');
}

type FoodWindowRect = { x: number; y: number; width: number; height: number };
type FoodFlightPath = {
  startX: number;
  startY: number;
  middleX: number;
  middleY: number;
  endX: number;
  endY: number;
};
type ToyFlightPath = {
  startX: number;
  startY: number;
  middleX: number;
  middleY: number;
  endX: number;
  endY: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function measureInWindow(view: View | null): Promise<FoodWindowRect | null> {
  if (!view) return Promise.resolve(null);
  return new Promise((resolve) => {
    view.measureInWindow((x, y, width, height) => {
      if (![x, y, width, height].every(Number.isFinite)) {
        resolve(null);
        return;
      }
      resolve({ x, y, width, height });
    });
  });
}

export function DogCompanionModal({
  visible,
  dog,
  artStyle,
  dogLook,
  owned,
  coins,
  today,
  affection,
  onClose,
  onInteract,
}: DogCompanionModalProps) {
  const colors = useColors();
  const motion = useRef(new Animated.Value(0)).current;
  const heartProgress = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const foodFlightProgress = useRef(new Animated.Value(0)).current;
  const foodBiteProgress = useRef(new Animated.Value(0)).current;
  const frisbeeDrag = useRef(new Animated.ValueXY()).current;
  const frisbeeFlightProgress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const modalRootRef = useRef<View | null>(null);
  const dogImageFrameRef = useRef<View | null>(null);
  const foodTileRefs = useRef<Record<string, View | null>>({});
  const launchFrisbeeRef = useRef<(dx: number, dy: number) => void>(() => {});
  const [pose, setPose] = useState<1 | 2 | 3 | 4>(1);
  const [busy, setBusy] = useState(false);
  const [foodPickerOpen, setFoodPickerOpen] = useState(false);
  const [flyingFood, setFlyingFood] = useState<DogStaffFoodOption | null>(null);
  const [foodFlightPath, setFoodFlightPath] = useState<FoodFlightPath | null>(null);
  const [chewing, setChewing] = useState(false);
  const [feedFinishedHappy, setFeedFinishedHappy] = useState(false);
  const [toyPickerOpen, setToyPickerOpen] = useState(false);
  const [selectedToy, setSelectedToy] = useState<DogCompanionToy | null>(null);
  const [frisbeeReady, setFrisbeeReady] = useState(false);
  const [frisbeeLaunching, setFrisbeeLaunching] = useState(false);
  const [frisbeePath, setFrisbeePath] = useState<ToyFlightPath | null>(null);
  const [frisbeePower, setFrisbeePower] = useState(0);
  const [photoReady, setPhotoReady] = useState(false);
  const [heartBurstCount, setHeartBurstCount] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [actionKind, setActionKind] = useState<DogCompanionAction | null>(null);
  const [lastActionAffection, setLastActionAffection] = useState<number | null>(null);

  const foods = useMemo(
    () => (dog ? DOG_STAFF_FOOD_OPTIONS[dog.key] ?? [] : []),
    [dog],
  );
  const toys = useMemo(
    () => (dog ? getDogCompanionToys(dog.key) : []),
    [dog?.key],
  );
  const visibleAffection = lastActionAffection ?? affection;
  const dogColor = dog?.color ?? colors.primary;
  const selectedPlayToy = selectedToy?.dogKey === dog?.key ? selectedToy : toys[0];

  useEffect(() => {
    setPose(1);
    setBusy(false);
    setFoodPickerOpen(false);
    setFlyingFood(null);
    setFoodFlightPath(null);
    setChewing(false);
    setFeedFinishedHappy(false);
    setToyPickerOpen(false);
    setSelectedToy(null);
    setFrisbeeReady(false);
    setFrisbeeLaunching(false);
    setFrisbeePath(null);
    setFrisbeePower(0);
    foodFlightProgress.setValue(0);
    foodBiteProgress.setValue(0);
    frisbeeDrag.setValue({ x: 0, y: 0 });
    frisbeeFlightProgress.setValue(0);
    setPhotoReady(false);
    setFeedback('');
    setHeartBurstCount(0);
    setLastActionAffection(null);
  }, [artStyle, dog?.decorationId, dog?.key, foodBiteProgress, foodFlightProgress, frisbeeDrag, frisbeeFlightProgress, visible]);

  useEffect(() => () => {
    animationRef.current?.stop();
    motion.stopAnimation();
    heartProgress.stopAnimation();
    flashOpacity.stopAnimation();
    foodFlightProgress.stopAnimation();
    foodBiteProgress.stopAnimation();
    frisbeeDrag.stopAnimation();
    frisbeeFlightProgress.stopAnimation();
  }, [flashOpacity, foodBiteProgress, foodFlightProgress, frisbeeDrag, frisbeeFlightProgress, heartProgress, motion]);

  const lift = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: actionKind === 'play' ? [0, -18, 0] : actionKind === 'feed' ? [0, -10, 0] : [0, -3, 0],
  });
  const tilt = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: actionKind === 'pet' ? ['0deg', '-7deg', '7deg'] : ['0deg', '0deg', '0deg'],
  });
  const heartY = heartProgress.interpolate({ inputRange: [0, 1], outputRange: [12, -52] });
  const heartOpacity = heartProgress.interpolate({ inputRange: [0, 0.18, 0.78, 1], outputRange: [0, 1, 1, 0] });
  const heartScale = heartProgress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.55, 1.16, 0.92] });
  const foodFlightX = foodFlightProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: foodFlightPath
      ? [foodFlightPath.startX, foodFlightPath.middleX, foodFlightPath.endX]
      : [0, 0, 0],
  });
  const foodFlightY = foodFlightProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: foodFlightPath
      ? [foodFlightPath.startY, foodFlightPath.middleY, foodFlightPath.endY]
      : [0, 0, 0],
  });
  const foodFlightScale = foodFlightProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1],
  });
  const foodBiteScale = foodBiteProgress.interpolate({
    inputRange: [0, 1 / 3, 2 / 3, 1],
    outputRange: [1, 0.74, 0.42, 0.04],
  });
  const foodFlightOpacity = foodFlightProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1],
  });
  const frisbeeX = frisbeePath
    ? frisbeeFlightProgress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [frisbeePath.startX, frisbeePath.middleX, frisbeePath.endX],
    })
    : frisbeeDrag.x;
  const frisbeeY = frisbeePath
    ? frisbeeFlightProgress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [frisbeePath.startY, frisbeePath.middleY, frisbeePath.endY],
    })
    : frisbeeDrag.y;
  const frisbeeRotation = frisbeeFlightProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const frisbeePanResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => frisbeeReady && !frisbeeLaunching,
      onMoveShouldSetPanResponder: (_, gesture) => (
        frisbeeReady
        && !frisbeeLaunching
        && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4
      ),
      onPanResponderGrant: () => {
        frisbeeDrag.setValue({ x: 0, y: 0 });
        setFrisbeePower(0);
      },
      onPanResponderMove: (_, gesture) => {
        const x = clamp(gesture.dx, -145, 0);
        const y = clamp(gesture.dy, 0, 76);
        frisbeeDrag.setValue({ x, y });
        setFrisbeePower(clamp(Math.round(Math.hypot(x, y) / 1.6), 0, 100));
      },
      onPanResponderRelease: (_, gesture) => launchFrisbeeRef.current(gesture.dx, gesture.dy),
      onPanResponderTerminate: () => {
        Animated.spring(frisbeeDrag, {
          toValue: { x: 0, y: 0 },
          speed: 20,
          bounciness: 6,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderTerminationRequest: () => false,
    }),
    [frisbeeDrag, frisbeeLaunching, frisbeeReady],
  );

  if (!dog) return null;

  const activeDog = dog;
  const dogImage = getDogFluffyImage(dog.key, pose);
  const imageSource = dogImage as number;

  async function measureFoodFlightPath(food: DogStaffFoodOption): Promise<FoodFlightPath | null> {
    const [sourceRect, dogRect, rootRect] = await Promise.all([
      measureInWindow(foodTileRefs.current[food.id]),
      measureInWindow(dogImageFrameRef.current),
      measureInWindow(modalRootRef.current),
    ]);
    if (!sourceRect || !dogRect || !rootRect || sourceRect.width <= 0 || dogRect.width <= 0) return null;
    const iconSize = 40;
    const startX = sourceRect.x - rootRect.x + (sourceRect.width - iconSize) / 2;
    const startY = sourceRect.y - rootRect.y + (sourceRect.height - iconSize) / 2;
    const endX = dogRect.x - rootRect.x + (dogRect.width - iconSize) / 2;
    const endY = dogRect.y - rootRect.y + dogRect.height * 0.46 - iconSize / 2;
    return {
      startX,
      startY,
      middleX: (startX + endX) / 2,
      middleY: (startY + endY) / 2 - 22,
      endX,
      endY,
    };
  }

  async function animateFoodFlight(food: DogStaffFoodOption, path: FoodFlightPath, excited: boolean) {
    setFoodFlightPath(path);
    setFlyingFood(food);
    foodFlightProgress.setValue(0);
    foodBiteProgress.setValue(0);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const flight = Animated.timing(foodFlightProgress, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animationRef.current = flight;
    await new Promise<void>((resolve) => flight.start(() => resolve()));
    const bites = 3;
    for (let bite = 1; bite <= bites; bite += 1) {
      setChewing(true);
      const shrink = Animated.timing(foodBiteProgress, {
        toValue: bite / bites,
        duration: 170,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      });
      const nod = Animated.sequence([
        Animated.timing(motion, { toValue: 0.38, duration: 125, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(motion, { toValue: 0, duration: 130, useNativeDriver: Platform.OS !== 'web' }),
      ]);
      animationRef.current = Animated.parallel([shrink, nod]);
      await new Promise<void>((resolve) => animationRef.current?.start(() => resolve()));
      setChewing(false);
      await new Promise<void>((resolve) => setTimeout(resolve, 65));
    }
    setFlyingFood(null);
    setFoodFlightPath(null);
    motion.setValue(0);
    setFeedFinishedHappy(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 320));
  }

  async function animateInteraction(action: DogCompanionAction, excited: boolean) {
    animationRef.current?.stop();
    motion.setValue(0);
    flashOpacity.setValue(0);
    if (action === 'photo') {
      const flash = Animated.sequence([
        Animated.timing(flashOpacity, { toValue: 0.9, duration: 80, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(flashOpacity, { toValue: 0, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
      ]);
      animationRef.current = flash;
      flash.start();
      await new Promise<void>((resolve) => setTimeout(resolve, 620));
      return;
    }
    if (action === 'play') {
      const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(motion, { toValue: 0.5, duration: 230, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(motion, { toValue: 0, duration: 230, useNativeDriver: Platform.OS !== 'web' }),
        ]),
        { iterations: 4 },
      );
      animationRef.current = bounce;
      bounce.start();
      await new Promise<void>((resolve) => setTimeout(resolve, 1900));
      bounce.stop();
      return;
    }
    const bounce = Animated.sequence([
      Animated.timing(motion, { toValue: 0.5, duration: excited ? 240 : 360, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(motion, { toValue: 1, duration: excited ? 260 : 440, useNativeDriver: Platform.OS !== 'web' }),
    ]);
    animationRef.current = bounce;
    bounce.start();
    await new Promise<void>((resolve) => setTimeout(resolve, excited ? 520 : 820));
  }

  async function showHearts(count: number) {
    if (count <= 0) return;
    setHeartBurstCount(Math.min(count, 3));
    heartProgress.setValue(0);
    Animated.timing(heartProgress, {
      toValue: 1,
      duration: 900,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }

  async function performAction(
    action: DogCompanionAction,
    food?: DogStaffFoodOption,
    playToy?: DogCompanionToy,
  ) {
    if (busy || !owned) return;
    if (action === 'feed' && !food) {
      setFoodPickerOpen(true);
      setFeedback('');
      return;
    }
    setBusy(true);
    const activeToy = playToy ?? selectedPlayToy;
    if (action === 'play' && activeToy) setSelectedToy(activeToy);
    setPhotoReady(false);
    setFeedback('');
    setFeedFinishedHappy(false);
    setChewing(false);
    setFrisbeeReady(false);
    setFrisbeeLaunching(false);
    setFrisbeePath(null);
    setToyPickerOpen(false);
    let foodPath: FoodFlightPath | null = null;
    if (action === 'feed' && food) {
      motion.setValue(0);
      foodPath = await measureFoodFlightPath(food);
      if (!foodPath) {
        setBusy(false);
        setFeedback('未能讀取食物位置，今次沒有扣金幣；請再選一次。');
        return;
      }
    }
    setActionKind(action);
    const poseByAction: Record<DogCompanionAction, 1 | 2 | 3 | 4> = {
      feed: 2,
      pet: 3,
      play: 4,
      photo: 1,
    };
    setPose(artStyle === 'fluffy' ? poseByAction[action] : 1);
    if (action !== 'feed') setFoodPickerOpen(false);
    try {
      const result = await onInteract(
        activeDog.decorationId,
        action,
        action === 'feed' ? (food?.favorite ? 2 : 1) : 1,
        action === 'feed' ? DOG_FEED_COST : 0,
      );
      setLastActionAffection(result.affection);
      const heartCount = result.affectionGained;
      if (action === 'photo') setPhotoReady(true);
      if (result.affectionRewardCoins > 0) {
        setFeedback(`親密度達到 10 顆心，已領取 ${result.affectionRewardCoins} 金幣獎勵。`);
      } else if (result.alreadyCountedToday) {
        setFeedback('今日已記錄過這種互動，仍可繼續玩，親密度不會重複增加。');
      } else if (result.dailyLimitReached) {
        setFeedback(`今日親密度已達每隻狗最多 ${4} 顆心；互動動畫仍會播放。`);
      } else if (result.affectionGained > 0) {
        const foodText = action === 'feed' && food?.favorite ? '牠最喜歡這款！' : '';
        setFeedback(`${foodText}親密度 +${result.affectionGained}。`);
      } else {
        setFeedback('互動已完成。');
      }
      if (action === 'feed' && food && foodPath) {
        await animateFoodFlight(food, foodPath, Boolean(food.favorite));
        setFoodPickerOpen(false);
        if (heartCount > 0) {
          void showHearts(food.favorite ? Math.max(2, heartCount) : heartCount);
        }
        await new Promise<void>((resolve) => setTimeout(resolve, heartCount > 0 ? 700 : 320));
        setFeedFinishedHappy(false);
      } else {
        if (heartCount > 0) void showHearts(heartCount);
        await animateInteraction(action, false);
      }
    } catch (error) {
      setPose(1);
      setFlyingFood(null);
      setFoodFlightPath(null);
      setChewing(false);
      setFeedFinishedHappy(false);
      setFeedback(error instanceof Error ? error.message : '互動未完成，請稍後再試。');
    } finally {
      setBusy(false);
      setActionKind(null);
      if (action !== 'photo') setPose(1);
    }
  }

  async function launchFrisbee(dx: number, dy: number) {
    if (!frisbeeReady || frisbeeLaunching || selectedPlayToy?.kind !== 'frisbee') return;
    const startX = clamp(dx, -145, 0);
    const startY = clamp(dy, 0, 76);
    const pullDistance = Math.hypot(startX, startY);
    if (pullDistance < 20) {
      setFeedback('再向後拉一點飛盤，放手就會發射！');
      Animated.spring(frisbeeDrag, {
        toValue: { x: 0, y: 0 },
        speed: 20,
        bounciness: 7,
        useNativeDriver: false,
      }).start();
      return;
    }

    const power = clamp(Math.round(pullDistance / 1.6), 15, 100);
    const endX = clamp(130 + power * 1.15, 150, 255);
    const endY = -(58 + power * 0.62);
    setFrisbeePower(power);
    setFrisbeePath({
      startX,
      startY,
      middleX: (startX + endX) / 2,
      middleY: (startY + endY) / 2 - 44,
      endX,
      endY,
    });
    setFrisbeeReady(false);
    setFrisbeeLaunching(true);
    frisbeeFlightProgress.setValue(0);
    const launch = Animated.timing(frisbeeFlightProgress, {
      toValue: 1,
      duration: 620 + power * 2,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animationRef.current = launch;
    await new Promise<void>((resolve) => launch.start(() => resolve()));
    setFrisbeeLaunching(false);
    setFrisbeePath(null);
    frisbeeFlightProgress.setValue(0);
    frisbeeDrag.setValue({ x: 0, y: 0 });
    await performAction('play', undefined, selectedPlayToy);
  }
  launchFrisbeeRef.current = (dx, dy) => { void launchFrisbee(dx, dy); };

  function chooseToy(playToy: DogCompanionToy) {
    setSelectedToy(playToy);
    setToyPickerOpen(false);
    setFeedback('');
    if (playToy.kind === 'frisbee') {
      setFrisbeePath(null);
      frisbeeFlightProgress.setValue(0);
      frisbeeDrag.setValue({ x: 0, y: 0 });
      setFrisbeePower(0);
      setFrisbeeReady(true);
      setActionKind('play');
      setPose(artStyle === 'fluffy' ? 4 : 1);
      setFeedback('按住飛盤向左或向下拉蓄力，放開就會飛出去！');
      return;
    }
    void performAction('play', undefined, playToy);
  }

  function cancelFrisbeeReady() {
    setFrisbeeReady(false);
    setActionKind(null);
    setPose(1);
    setFrisbeePath(null);
    setToyPickerOpen(true);
    setFeedback('選一款玩具開始互動。');
  }

  async function savePhotoPostcard() {
    if (!dog || !photoReady) return;
    try {
      const imageAsset = Asset.fromModule(getDogFluffyImage(dog.key, 1) as number);
      const imageUri = await imageAsset.downloadAsync();
      const svg = buildDogCompanionPostcardSvg(dog.name, today, imageUri.localUri ?? imageUri.uri);
      if (Platform.OS === 'web') {
        await downloadSvgAsPng(svg, `dog-companion-${dog.key}-${today}.png`);
        setFeedback('已下載今日狗狗明信片 PNG。');
      } else {
        await Share.share({
          title: `${dog.name} · 今日陪伴`,
          message: `${dog.name} · 今日陪伴 ${today}`,
        });
        setFeedback('已開啟分享功能，可保存這張狗狗明信片。');
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '明信片圖片產生失敗，請稍後再試。');
    }
  }

  const interactionDisabled = busy || !owned || frisbeeReady || frisbeeLaunching;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView ref={modalRootRef} testID="dog-companion-modal" style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>毛茸茸棉花糖 CAFE</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>{dog.name}的專屬時間</Text>
          </View>
          <Pressable
            testID="dog-companion-close"
            accessibilityRole="button"
            accessibilityLabel="關閉狗狗互動畫面"
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.secondary }]}
          >
            <Feather name="x" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, foodPickerOpen && styles.heroFoodMode, { backgroundColor: colors.candyCream, borderColor: colors.border }]}>
            <Animated.View
              ref={dogImageFrameRef}
              testID="dog-companion-image-stage"
              style={[styles.dogImageFrame, foodPickerOpen && styles.dogImageFrameFoodMode, { transform: [{ translateY: lift }, { rotate: tilt }] }]}
            >
                {artStyle === 'fluffy' ? (
                  <ExpoImage
                    testID={`dog-companion-pose-${pose}`}
                    source={imageSource}
                    contentFit="contain"
                    transition={120}
                    style={styles.dogImage}
                  />
                ) : (
                  <View
                    testID={`dog-companion-original-art-${dog.key}`}
                    style={styles.originalDogArtwork}
                  >
                    <View style={[styles.originalDogScale, foodPickerOpen && styles.originalDogScaleFoodMode]}>
                      <DogAttendant
                        kind={dog.kind as DogAttendantKind}
                        outfitId={dogLook?.outfitId}
                        accessoryId={dogLook?.accessoryId}
                        happy={actionKind === 'pet' || feedFinishedHappy}
                        eating={actionKind === 'feed' && !feedFinishedHappy}
                        chewing={chewing}
                      />
                    </View>
                  </View>
                )}
              {artStyle === 'fluffy' && actionKind === 'feed' && chewing && (
                <View
                  testID="dog-companion-chewing-mouth"
                  pointerEvents="none"
                  style={[styles.fluffyChewingMouth, { backgroundColor: colors.foreground }]}
                >
                  <View style={styles.fluffyChewingTongue} />
                </View>
              )}
              {actionKind === 'photo' && (
                <View pointerEvents="none" style={styles.cameraFrame}>
                  <View style={styles.cameraCornerTopLeft} />
                  <View style={styles.cameraCornerTopRight} />
                  <View style={styles.cameraCornerBottomLeft} />
                  <View style={styles.cameraCornerBottomRight} />
                </View>
              )}
              {actionKind === 'play' && selectedPlayToy && (
                <View pointerEvents="none" style={[styles.toyBubble, { backgroundColor: colors.card, borderColor: dogColor }]}>
                  <Feather name={selectedPlayToy.icon} size={18} color={selectedPlayToy.color} />
                  <Text style={[styles.toyLabel, { color: colors.foreground }]}>{selectedPlayToy.name}</Text>
                </View>
              )}
              {selectedPlayToy?.kind === 'frisbee' && (frisbeeReady || frisbeeLaunching) && (
                <Animated.View
                  {...frisbeePanResponder.panHandlers}
                  testID="dog-companion-frisbee"
                  accessibilityRole="button"
                  accessibilityLabel={frisbeeLaunching ? '布飛盤正在飛行' : `按住飛盤向後拉，蓄力 ${frisbeePower}%`}
                  style={[
                    styles.frisbeeDraggable,
                    {
                      backgroundColor: selectedPlayToy.color,
                      borderColor: colors.card,
                      transform: [
                        { translateX: frisbeeX },
                        { translateY: frisbeeY },
                        { rotate: frisbeeRotation },
                      ],
                    },
                  ]}
                >
                  <View style={styles.frisbeeOuterRing} />
                  <View style={[styles.frisbeeInnerRing, { borderColor: 'rgba(255,255,255,0.92)' }]} />
                  <View style={styles.frisbeeCenterDot} />
                </Animated.View>
              )}
              <Animated.View pointerEvents="none" style={[styles.cameraFlash, { opacity: flashOpacity }]} />
              {heartBurstCount > 0 && (
                <Animated.View
                  testID="dog-companion-heart-burst"
                  pointerEvents="none"
                  style={[
                    styles.heartBurst,
                    {
                      opacity: heartOpacity,
                      transform: [{ translateY: heartY }, { scale: heartScale }],
                    },
                  ]}
                >
                  {Array.from({ length: heartBurstCount }, (_, index) => (
                    <Feather key={index} name="heart" size={index === 1 ? 26 : 20} color={colors.candyRose} />
                  ))}
                </Animated.View>
              )}
            </Animated.View>

            <View style={[styles.dogSummary, foodPickerOpen && styles.dogSummaryFoodMode]}>
              <View style={styles.nameAndOwned}>
                <Text style={[styles.dogName, { color: colors.foreground }]}>{dog.name}</Text>
                <View style={[styles.ownedBadge, { backgroundColor: owned ? colors.candyMint : colors.candyPeach }]}>
                  <Text style={[styles.ownedBadgeText, { color: colors.foreground }]}>
                    {owned ? '已擁有' : `尚未兌換 · ${dog.price} 金幣`}
                  </Text>
                </View>
              </View>
              <Text style={[styles.breed, { color: colors.mutedForeground }]}>{dog.breed}</Text>
              <View style={styles.affectionRow}>
                <Feather name="heart" size={17} color={colors.candyRose} />
                <Text style={[styles.affectionText, { color: colors.foreground }]}>親密度 {visibleAffection} 顆心</Text>
                {visibleAffection >= 10 && (
                  <Text style={[styles.milestone, { color: colors.primary }]}>已領取 +20</Text>
                )}
              </View>
              <View style={[styles.walletChip, { backgroundColor: colors.secondary }]}>
                <Feather name="star" size={14} color={colors.primary} />
                <Text style={[styles.walletText, { color: colors.primary }]}>{coins} 金幣</Text>
              </View>
            </View>
          </View>

          {!owned ? (
            <View style={[styles.lockedNotice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="lock" size={18} color={colors.primary} />
              <Text style={[styles.lockedText, { color: colors.foreground }]}>兌換這位店員後，即可餵食、摸摸、玩耍和拍照。</Text>
            </View>
          ) : (
            <>
              {!foodPickerOpen && (
                <View style={styles.actionGrid}>
                  <ActionButton
                    testID="dog-companion-feed"
                    icon="coffee"
                    title="餵食"
                    detail={`挑一款 · ${DOG_FEED_COST} 金幣`}
                    disabled={interactionDisabled}
                    onPress={() => void performAction('feed')}
                    color={colors.primary}
                    backgroundColor={colors.card}
                  />
                  <ActionButton
                    testID="dog-companion-pet"
                    icon="heart"
                    title="摸摸頭"
                    detail="免費 · 摸摸牠"
                    disabled={interactionDisabled}
                    onPress={() => void performAction('pet')}
                    color={colors.candyRose}
                    backgroundColor={colors.card}
                  />
                  <ActionButton
                    testID="dog-companion-play"
                    icon={selectedPlayToy?.icon ?? 'disc'}
                    title="一起玩"
                    detail={`${toys.length}款玩具 · 點選選擇`}
                    disabled={interactionDisabled}
                    onPress={() => {
                      setToyPickerOpen(true);
                      setFrisbeeReady(false);
                      setFrisbeeLaunching(false);
                      setActionKind(null);
                      setPose(1);
                    }}
                    color={colors.candyLavenderDark}
                    backgroundColor={colors.card}
                  />
                  <ActionButton
                    testID="dog-companion-photo"
                    icon="camera"
                    title="影相留念"
                    detail="免費 · 揮手 pose"
                    disabled={interactionDisabled}
                    onPress={() => void performAction('photo')}
                    color={colors.candyCaramelDark}
                    backgroundColor={colors.card}
                  />
                </View>
              )}

              {toyPickerOpen && (
                <View testID="dog-companion-toy-picker" style={[styles.toyPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.toyPickerHeading}>
                    <View style={styles.foodPickerCopy}>
                      <Text style={[styles.foodPickerTitle, { color: colors.foreground }]}>選一款玩具一起玩</Text>
                      <Text style={[styles.foodPickerSubtitle, { color: colors.mutedForeground }]}>每隻狗狗有 5 款專屬玩具；布飛盤可以拉住再放手發射。</Text>
                    </View>
                    <Pressable
                      testID="dog-companion-toy-close"
                      accessibilityRole="button"
                      accessibilityLabel="關閉玩具選擇"
                      onPress={() => setToyPickerOpen(false)}
                      style={[styles.foodClose, { backgroundColor: colors.secondary }]}
                    >
                      <Feather name="x" size={16} color={colors.primary} />
                    </Pressable>
                  </View>
                  <View style={styles.toyGrid}>
                    {toys.map((playToy) => (
                      <Pressable
                        key={playToy.id}
                        testID={`dog-companion-toy-${playToy.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={`${playToy.name}${playToy.kind === 'frisbee' ? '，可拉動投擲' : ''}`}
                        disabled={busy}
                        onPress={() => chooseToy(playToy)}
                        style={({ pressed }) => [
                          styles.toyTile,
                          {
                            backgroundColor: selectedPlayToy?.id === playToy.id ? colors.secondary : colors.background,
                            borderColor: selectedPlayToy?.id === playToy.id ? playToy.color : colors.border,
                            opacity: pressed ? 0.76 : 1,
                          },
                        ]}
                      >
                        {playToy.kind === 'frisbee' ? (
                          <View style={[styles.toyDiscPreview, { backgroundColor: playToy.color }]}>
                            <View style={styles.toyDiscBand} />
                          </View>
                        ) : (
                          <Feather name={playToy.icon} size={21} color={playToy.color} />
                        )}
                        <Text style={[styles.toyTileName, { color: colors.foreground }]} numberOfLines={2}>{playToy.name}</Text>
                        {playToy.kind === 'frisbee' && (
                          <Text style={[styles.toyTileHint, { color: colors.mutedForeground }]}>拉住投擲</Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {frisbeeReady && selectedPlayToy?.kind === 'frisbee' && (
                <View testID="dog-companion-frisbee-instructions" style={[styles.frisbeeInstructions, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <View style={styles.frisbeeInstructionsCopy}>
                    <Text style={[styles.frisbeeInstructionsTitle, { color: colors.foreground }]}>按住飛盤向後拉，再放手！</Text>
                    <Text style={[styles.foodPickerSubtitle, { color: colors.mutedForeground }]}>力度 {frisbeePower}% · 拉得越遠，飛得越遠</Text>
                  </View>
                  <Pressable
                    testID="dog-companion-toy-change"
                    accessibilityRole="button"
                    accessibilityLabel="更換一起玩的玩具"
                    onPress={cancelFrisbeeReady}
                    style={[styles.foodClose, { backgroundColor: colors.card }]}
                  >
                    <Feather name="refresh-cw" size={16} color={colors.primary} />
                  </Pressable>
                </View>
              )}

              {foodPickerOpen && (
                <View testID="dog-companion-food-picker" style={[styles.foodPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.foodPickerHeading}>
                    <View style={styles.foodPickerCopy}>
                      <Text style={[styles.foodPickerTitle, { color: colors.foreground }]}>選一款狗狗食物</Text>
                      <Text style={[styles.foodPickerSubtitle, { color: colors.mutedForeground }]}>每次餵食 {DOG_FEED_COST} 金幣；每天首次餵食才增加親密度。</Text>
                    </View>
                    <Pressable
                      testID="dog-companion-food-close"
                      accessibilityRole="button"
                      accessibilityLabel="關閉食物選擇"
                      disabled={busy}
                      onPress={() => setFoodPickerOpen(false)}
                      style={[styles.foodClose, { backgroundColor: colors.secondary }]}
                    >
                      <Feather name="x" size={16} color={colors.primary} />
                    </Pressable>
                  </View>
                  <View style={styles.foodGrid}>
                    {foods.map((food) => (
                      <Pressable
                        ref={(node) => { foodTileRefs.current[food.id] = node; }}
                        key={food.id}
                        testID={`dog-companion-food-${foodKeyForTest(food)}`}
                        accessibilityRole="button"
                        accessibilityLabel={`${food.name}${food.favorite ? '，最喜歡' : ''}，${DOG_FEED_COST} 金幣`}
                        accessibilityState={{ disabled: busy }}
                        disabled={busy}
                        onPress={() => void performAction('feed', food)}
                        style={({ pressed }) => [
                          styles.foodTile,
                          {
                            backgroundColor: food.favorite ? colors.secondary : colors.background,
                            borderColor: food.favorite ? colors.primary : colors.border,
                            opacity: flyingFood?.id === food.id ? 0.18 : pressed ? 0.78 : 1,
                          },
                        ]}
                      >
                        <View style={styles.foodArt}>
                          <DogFoodIllustration
                            food={food}
                            dogColor={dogColor}
                            size={34}
                            testID={`dog-companion-food-art-${foodKeyForTest(food)}`}
                          />
                          {food.favorite && (
                            <View style={[styles.favoriteBadge, { backgroundColor: colors.card }]}>
                              <Feather name="heart" size={11} color={colors.candyRose} />
                            </View>
                          )}
                        </View>
                        <Text numberOfLines={2} style={[styles.foodName, { color: colors.foreground }]}>{food.name}</Text>
                        <Text style={[styles.foodPrice, { color: colors.primary }]}>{DOG_FEED_COST} 金幣</Text>
                      </Pressable>
                    ))}
            </View>
          </View>
              )}

              {photoReady && (
                <Pressable
                  testID="dog-companion-save-photo"
                  accessibilityRole="button"
                  accessibilityLabel={Platform.OS === 'web' ? '下載狗狗明信片 PNG' : '分享狗狗明信片'}
                  onPress={() => void savePhotoPostcard()}
                  style={({ pressed }) => [styles.savePhotoButton, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}
                >
                  <Feather name={Platform.OS === 'web' ? 'download' : 'share-2'} size={18} color={colors.primaryForeground} />
                  <Text style={[styles.savePhotoText, { color: colors.primaryForeground }]}>
                    {Platform.OS === 'web' ? '下載 PNG 明信片' : '分享狗狗明信片'}
                  </Text>
                </Pressable>
              )}
            </>
          )}

          <Text
            testID="dog-companion-feedback"
            accessibilityLiveRegion="polite"
            style={[styles.feedback, { color: feedback.includes('不足') ? colors.candyRose : colors.primary }]}
          >
            {busy ? '狗狗正在陪你…' : feedback}
          </Text>
          <Text style={[styles.dailyLimitHint, { color: colors.mutedForeground }]}>
            每種互動每天記錄一次；每隻狗每日最多增加 4 顆心。累積 10 顆心會送 20 金幣，每隻狗一次。
          </Text>
        </ScrollView>
        {flyingFood && (
          <Animated.View
            testID="dog-companion-food-flight"
            pointerEvents="none"
            style={[
              styles.foodFlight,
              {
                opacity: foodFlightOpacity,
                transform: [
                  { translateX: foodFlightX },
                  { translateY: foodFlightY },
                  { scale: foodFlightScale },
                { scale: foodBiteScale },
                ],
              },
            ]}
          >
            <DogFoodIllustration
              food={flyingFood}
              dogColor={dogColor}
              size={36}
              testID="dog-companion-food-flight-art"
            />
          </Animated.View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { minHeight: 68, paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerCopy: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { fontSize: 18, fontWeight: '900' },
  closeButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 15 },
   hero: { borderWidth: 1, borderRadius: 24, padding: 12, overflow: 'hidden' },
  heroFoodMode: { padding: 8, borderRadius: 20 },
  dogImageFrame: { width: '100%', aspectRatio: 0.96, maxHeight: 360, alignSelf: 'center', borderRadius: 19, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)' },
  dogImageFrameFoodMode: { height: 190, maxHeight: 190, aspectRatio: undefined },
  dogImage: { width: '100%', height: '100%' },
  originalDogArtwork: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  originalDogScale: { transform: [{ scale: 4.8 }] },
  originalDogScaleFoodMode: { transform: [{ scale: 3.8 }] },
  fluffyChewingMouth: { position: 'absolute', left: '50%', top: '47%', width: 9, height: 7, marginLeft: -4.5, borderRadius: 5, alignItems: 'center', justifyContent: 'flex-end', zIndex: 12 },
  fluffyChewingTongue: { width: 4, height: 2.5, marginBottom: 0.8, borderRadius: 2, backgroundColor: '#ef8b9f' },
  cameraFrame: { position: 'absolute', top: '8%', bottom: '8%', left: '8%', right: '8%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.92)', borderRadius: 21 },
  cameraCornerTopLeft: { position: 'absolute', top: -2, left: -2, width: 28, height: 28, borderTopWidth: 5, borderLeftWidth: 5, borderColor: '#FFF9F2', borderTopLeftRadius: 10 },
  cameraCornerTopRight: { position: 'absolute', top: -2, right: -2, width: 28, height: 28, borderTopWidth: 5, borderRightWidth: 5, borderColor: '#FFF9F2', borderTopRightRadius: 10 },
  cameraCornerBottomLeft: { position: 'absolute', bottom: -2, left: -2, width: 28, height: 28, borderBottomWidth: 5, borderLeftWidth: 5, borderColor: '#FFF9F2', borderBottomLeftRadius: 10 },
  cameraCornerBottomRight: { position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderBottomWidth: 5, borderRightWidth: 5, borderColor: '#FFF9F2', borderBottomRightRadius: 10 },
  toyBubble: { position: 'absolute', right: 10, bottom: 10, minHeight: 34, borderWidth: 1.5, borderRadius: 13, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  toyLabel: { fontSize: 10, fontWeight: '900' },
  cameraFlash: { ...StyleSheet.absoluteFill, backgroundColor: '#FFFDF9' },
  heartBurst: { position: 'absolute', top: '44%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 3 },
  dogSummary: { padding: 8, gap: 5 },
  dogSummaryFoodMode: { padding: 4, gap: 3 },
  nameAndOwned: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dogName: { fontSize: 20, fontWeight: '900' },
  ownedBadge: { minHeight: 25, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
  ownedBadgeText: { fontSize: 10, fontWeight: '800' },
  breed: { fontSize: 12, fontWeight: '600' },
  affectionRow: { minHeight: 27, flexDirection: 'row', alignItems: 'center', gap: 6 },
  affectionText: { fontSize: 12, fontWeight: '800' },
  milestone: { marginLeft: 'auto', fontSize: 10, fontWeight: '900' },
  walletChip: { alignSelf: 'flex-start', minHeight: 27, borderRadius: 10, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  walletText: { fontSize: 11, fontWeight: '900' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  actionButton: { width: '48%', minHeight: 102, borderRadius: 17, padding: 11, alignItems: 'center', justifyContent: 'center', gap: 3, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(150,100,120,0.12)' },
  actionIcon: { width: 35, height: 35, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 13, fontWeight: '900' },
  actionDetail: { fontSize: 10, color: '#897783', fontWeight: '600', textAlign: 'center' },
  toyPicker: { borderWidth: 1, borderRadius: 20, padding: 11, gap: 9 },
  toyPickerHeading: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8 },
  toyGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 7 },
  toyTile: { width: '18%', minHeight: 82, borderWidth: 1.2, borderRadius: 13, paddingVertical: 7, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center', gap: 4 },
  toyTileName: { width: '100%', minHeight: 26, fontSize: 8, lineHeight: 10, fontWeight: '800', textAlign: 'center' },
  toyTileHint: { fontSize: 7, lineHeight: 9, fontWeight: '700', textAlign: 'center' },
  toyDiscPreview: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  toyDiscBand: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(255,255,255,0.92)' },
  frisbeeInstructions: { borderWidth: 1, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  frisbeeInstructionsCopy: { flex: 1, gap: 3 },
  frisbeeInstructionsTitle: { fontSize: 11, fontWeight: '900' },
  frisbeeDraggable: { position: 'absolute', left: '50%', top: '58%', marginLeft: -23, marginTop: -23, width: 46, height: 46, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 20, elevation: 20, shadowColor: '#48324A', shadowOpacity: 0.24, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  frisbeeOuterRing: { position: 'absolute', width: 35, height: 35, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.72)' },
  frisbeeInnerRing: { width: 21, height: 21, borderRadius: 11, borderWidth: 2 },
  frisbeeCenterDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.9)' },
  foodPicker: { borderWidth: 1, borderRadius: 19, padding: 11, gap: 9 },
  foodPickerHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foodPickerCopy: { flex: 1, gap: 3 },
  foodPickerTitle: { fontSize: 14, fontWeight: '900' },
  foodPickerSubtitle: { fontSize: 10, lineHeight: 14 },
  foodClose: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  foodTile: { width: '23.5%', minHeight: 106, borderWidth: 1, borderRadius: 13, paddingVertical: 6, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'space-between', gap: 2 },
  foodArt: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  foodFlight: { position: 'absolute', left: 0, top: 0, width: 40, height: 40, zIndex: 30, elevation: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(235, 196, 212, 0.85)', backgroundColor: 'rgba(255, 255, 255, 0.94)', shadowColor: '#7e536c', shadowOpacity: 0.18, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  favoriteBadge: { position: 'absolute', top: -2, right: -5, width: 17, height: 17, borderRadius: 8.5, alignItems: 'center', justifyContent: 'center', elevation: 1 },
  foodName: { width: '100%', minHeight: 27, fontSize: 9, lineHeight: 12, fontWeight: '800', textAlign: 'center' },
  foodPrice: { fontSize: 9, fontWeight: '900' },
  savePhotoButton: { minHeight: 49, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  savePhotoText: { fontSize: 13, fontWeight: '900' },
  feedback: { minHeight: 18, fontSize: 12, fontWeight: '800', textAlign: 'center', lineHeight: 18 },
  dailyLimitHint: { fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 12 },
  lockedNotice: { minHeight: 72, borderWidth: 1, borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  lockedText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '700' },
});
