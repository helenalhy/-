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
import {
  getDogCompanionToys,
  type DogCompanionToy,
  type DogCompanionToyKind,
} from '@/constants/dog-companion-toys';

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
  const ballFlightProgress = useRef(new Animated.Value(0)).current;
  const tugDrag = useRef(new Animated.ValueXY()).current;
  const plushSquash = useRef(new Animated.Value(0)).current;
  const squeakerPulse = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const modalRootRef = useRef<View | null>(null);
  const dogImageFrameRef = useRef<View | null>(null);
  const foodTileRefs = useRef<Record<string, View | null>>({});
  const launchFrisbeeRef = useRef<(dx: number, dy: number) => void>(() => {});
  const finishTugPullRef = useRef<(dx: number) => void>(() => {});
  const tugPullCountRef = useRef(0);
  const lastTugDirectionRef = useRef<number | null>(null);
  const squeakerTapCountRef = useRef(0);
  const plushHoldStartedAtRef = useRef<number | null>(null);
  const [pose, setPose] = useState<1 | 2 | 3 | 4>(1);
  const [stageWidth, setStageWidth] = useState(320);
  const [busy, setBusy] = useState(false);
  const [foodPickerOpen, setFoodPickerOpen] = useState(false);
  const [flyingFood, setFlyingFood] = useState<DogStaffFoodOption | null>(null);
  const [foodFlightPath, setFoodFlightPath] = useState<FoodFlightPath | null>(null);
  const [chewing, setChewing] = useState(false);
  const [feedFinishedHappy, setFeedFinishedHappy] = useState(false);
  const [toyPickerOpen, setToyPickerOpen] = useState(false);
  const [selectedToy, setSelectedToy] = useState<DogCompanionToy | null>(null);
  const [activeToyKind, setActiveToyKind] = useState<DogCompanionToyKind | null>(null);
  const [frisbeeReady, setFrisbeeReady] = useState(false);
  const [frisbeeLaunching, setFrisbeeLaunching] = useState(false);
  const [frisbeePath, setFrisbeePath] = useState<ToyFlightPath | null>(null);
  const [frisbeePower, setFrisbeePower] = useState(0);
  const [ballLaunching, setBallLaunching] = useState(false);
  const [tugPullCount, setTugPullCount] = useState(0);
  const [tugAnimating, setTugAnimating] = useState(false);
  const [plushHeld, setPlushHeld] = useState(false);
  const [plushAnimating, setPlushAnimating] = useState(false);
  const [squeakerTaps, setSqueakerTaps] = useState(0);
  const [squeakerCelebrating, setSqueakerCelebrating] = useState(false);
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
    setActiveToyKind(null);
    setFrisbeeReady(false);
    setFrisbeeLaunching(false);
    setFrisbeePath(null);
    setFrisbeePower(0);
    setBallLaunching(false);
    setTugPullCount(0);
    tugPullCountRef.current = 0;
    lastTugDirectionRef.current = null;
    setTugAnimating(false);
    tugDrag.setValue({ x: 0, y: 0 });
    setPlushHeld(false);
    setPlushAnimating(false);
    plushHoldStartedAtRef.current = null;
    plushSquash.setValue(0);
    setSqueakerTaps(0);
    squeakerTapCountRef.current = 0;
    setSqueakerCelebrating(false);
    foodFlightProgress.setValue(0);
    foodBiteProgress.setValue(0);
    frisbeeDrag.setValue({ x: 0, y: 0 });
    frisbeeFlightProgress.setValue(0);
    ballFlightProgress.setValue(0);
    setPhotoReady(false);
    setFeedback('');
    setHeartBurstCount(0);
    setLastActionAffection(null);
  }, [artStyle, ballFlightProgress, dog?.decorationId, dog?.key, foodBiteProgress, foodFlightProgress, frisbeeDrag, frisbeeFlightProgress, plushSquash, tugDrag, visible]);

  useEffect(() => () => {
    animationRef.current?.stop();
    motion.stopAnimation();
    heartProgress.stopAnimation();
    flashOpacity.stopAnimation();
    foodFlightProgress.stopAnimation();
    foodBiteProgress.stopAnimation();
    frisbeeDrag.stopAnimation();
    frisbeeFlightProgress.stopAnimation();
    ballFlightProgress.stopAnimation();
    tugDrag.stopAnimation();
    plushSquash.stopAnimation();
    squeakerPulse.stopAnimation();
  }, [ballFlightProgress, flashOpacity, foodBiteProgress, foodFlightProgress, frisbeeDrag, frisbeeFlightProgress, heartProgress, motion, plushSquash, squeakerPulse, tugDrag]);

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
  const ballFlightX = ballFlightProgress.interpolate({
    inputRange: [0, 0.24, 0.5, 0.76, 1],
    outputRange: [0, stageWidth * 0.19, stageWidth * 0.38, stageWidth * 0.2, 0],
  });
  const ballFlightY = ballFlightProgress.interpolate({
    inputRange: [0, 0.24, 0.5, 0.76, 1],
    outputRange: [0, -25, 5, -17, 0],
  });
  const ballRotation = ballFlightProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'],
  });
  const tugPullX = tugDrag.x;
  const plushScaleX = plushSquash.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] });
  const plushScaleY = plushSquash.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });
  const plushTilt = plushSquash.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-6deg'] });
  const squeakerScale = squeakerPulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.78, 1.12] });
  const squeakerRingScale = squeakerPulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1.9] });
  const squeakerRingOpacity = squeakerPulse.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.8, 0] });

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
  const tugPanResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => activeToyKind === 'tug' && !tugAnimating,
      onMoveShouldSetPanResponder: (_, gesture) => (
        activeToyKind === 'tug'
        && !tugAnimating
        && Math.abs(gesture.dx) > 7
        && Math.abs(gesture.dx) > Math.abs(gesture.dy)
      ),
      onPanResponderGrant: () => tugDrag.setValue({ x: 0, y: 0 }),
      onPanResponderMove: (_, gesture) => {
        tugDrag.setValue({ x: clamp(gesture.dx, -92, 92), y: 0 });
      },
      onPanResponderRelease: (_, gesture) => finishTugPullRef.current(gesture.dx),
      onPanResponderTerminate: () => {
        Animated.spring(tugDrag, {
          toValue: { x: 0, y: 0 },
          speed: 18,
          bounciness: 5,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderTerminationRequest: () => false,
    }),
    [activeToyKind, tugAnimating, tugDrag],
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
    setActiveToyKind(null);
    setFrisbeeReady(false);
    setFrisbeeLaunching(false);
    setFrisbeePath(null);
    setBallLaunching(false);
    setTugAnimating(false);
    setPlushHeld(false);
    setPlushAnimating(false);
    plushHoldStartedAtRef.current = null;
    setSqueakerCelebrating(false);
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
    setActiveToyKind(null);
    await performAction('play', undefined, selectedPlayToy ?? undefined);
  }
  launchFrisbeeRef.current = (dx, dy) => { void launchFrisbee(dx, dy); };

  async function tossBall() {
    if (activeToyKind !== 'ball' || ballLaunching) return;
    setBallLaunching(true);
    setFeedback('球球彈出去，狗狗去追再帶返來！');
    ballFlightProgress.setValue(0);
    const toss = Animated.timing(ballFlightProgress, {
      toValue: 1,
      duration: 1280,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
    });
    animationRef.current = toss;
    await new Promise<void>((resolve) => toss.start(() => resolve()));
    if (!visible) return;
    ballFlightProgress.setValue(0);
    setBallLaunching(false);
    setActiveToyKind(null);
    await performAction('play', undefined, selectedPlayToy ?? undefined);
  }

  async function completeTugPull(dx: number) {
    if (activeToyKind !== 'tug' || tugAnimating) return;
    const direction = Math.sign(dx);
    if (Math.abs(dx) < 28 || direction === 0) {
      setFeedback('再拉遠一點繩子，左右來回各拉一次。');
      Animated.spring(tugDrag, {
        toValue: { x: 0, y: 0 },
        speed: 18,
        bounciness: 6,
        useNativeDriver: false,
      }).start();
      return;
    }
    if (lastTugDirectionRef.current === direction) {
      setFeedback('要換另一邊拉，和狗狗來回拔河！');
      Animated.spring(tugDrag, {
        toValue: { x: 0, y: 0 },
        speed: 18,
        bounciness: 6,
        useNativeDriver: false,
      }).start();
      return;
    }

    lastTugDirectionRef.current = direction;
    const nextPullCount = tugPullCountRef.current + 1;
    tugPullCountRef.current = nextPullCount;
    setTugPullCount(nextPullCount);
    Animated.spring(tugDrag, {
      toValue: { x: 0, y: 0 },
      speed: 18,
      bounciness: 6,
      useNativeDriver: false,
    }).start();
    setFeedback(`拔河來回 ${nextPullCount}/3，再拉 ${nextPullCount < 3 ? '另一邊' : '一下就完成'}！`);
    if (nextPullCount < 3) return;

    setTugAnimating(true);
    const tugCelebration = Animated.sequence([
      Animated.timing(motion, { toValue: 0.58, duration: 130, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(motion, { toValue: 0.04, duration: 130, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(motion, { toValue: 0.58, duration: 130, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(motion, { toValue: 0, duration: 160, useNativeDriver: Platform.OS !== 'web' }),
    ]);
    animationRef.current = tugCelebration;
    await new Promise<void>((resolve) => tugCelebration.start(() => resolve()));
    if (!visible) return;
    setTugAnimating(false);
    setActiveToyKind(null);
    await performAction('play', undefined, selectedPlayToy ?? undefined);
  }
  finishTugPullRef.current = (dx) => { void completeTugPull(dx); };

  function onPlushPressIn() {
    if (activeToyKind !== 'plush' || plushHeld || plushAnimating) return;
    plushHoldStartedAtRef.current = Date.now();
    setPlushHeld(true);
    plushSquash.stopAnimation();
    Animated.spring(plushSquash, {
      toValue: 1,
      speed: 16,
      bounciness: 5,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    setFeedback('抱緊布偶，保持一秒鐘！');
  }

  async function onPlushPressOut() {
    const startedAt = plushHoldStartedAtRef.current;
    plushHoldStartedAtRef.current = null;
    setPlushHeld(false);
    const duration = startedAt === null ? 0 : Date.now() - startedAt;
    if (duration < 1000) {
      Animated.spring(plushSquash, {
        toValue: 0,
        speed: 18,
        bounciness: 7,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
      setFeedback('長按布偶一秒，和牠抱抱！');
      return;
    }
    if (activeToyKind !== 'plush') return;

    setPlushAnimating(true);
    const cuddle = Animated.parallel([
      Animated.sequence([
        Animated.timing(plushSquash, { toValue: 0.65, duration: 130, useNativeDriver: Platform.OS !== 'web' }),
        Animated.spring(plushSquash, { toValue: 0, speed: 15, bounciness: 8, useNativeDriver: Platform.OS !== 'web' }),
      ]),
      Animated.sequence([
        Animated.timing(motion, { toValue: 0.5, duration: 160, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(motion, { toValue: 0, duration: 180, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    ]);
    animationRef.current = cuddle;
    await new Promise<void>((resolve) => cuddle.start(() => resolve()));
    if (!visible) return;
    setPlushAnimating(false);
    setActiveToyKind(null);
    await performAction('play', undefined, selectedPlayToy ?? undefined);
  }

  async function tapSqueaker() {
    if (activeToyKind !== 'squeaker' || squeakerCelebrating || squeakerTapCountRef.current >= 3) return;
    const nextTapCount = squeakerTapCountRef.current + 1;
    squeakerTapCountRef.current = nextTapCount;
    setSqueakerTaps(nextTapCount);
    setFeedback(`啾啾 ${nextTapCount}/3，再按幾下！`);
    squeakerPulse.stopAnimation();
    squeakerPulse.setValue(0);
    Animated.sequence([
      Animated.timing(squeakerPulse, { toValue: 1, duration: 85, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(squeakerPulse, { toValue: 0, speed: 18, bounciness: 7, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
    if (nextTapCount < 3) return;

    setSqueakerCelebrating(true);
    setFeedback('啾啾三聲，狗狗聽到啦！');
    const excitedBounce = Animated.sequence([
      Animated.timing(motion, { toValue: 0.6, duration: 110, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(motion, { toValue: 0, duration: 130, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(motion, { toValue: 0.6, duration: 110, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(motion, { toValue: 0, duration: 130, useNativeDriver: Platform.OS !== 'web' }),
    ]);
    animationRef.current = excitedBounce;
    await new Promise<void>((resolve) => excitedBounce.start(() => resolve()));
    if (!visible) return;
    setSqueakerCelebrating(false);
    setActiveToyKind(null);
    await performAction('play', undefined, selectedPlayToy ?? undefined);
  }

  function cancelToyInteraction() {
    setActiveToyKind(null);
    setActionKind(null);
    setPose(1);
    setFrisbeeReady(false);
    setFrisbeeLaunching(false);
    setFrisbeePath(null);
    setBallLaunching(false);
    setTugAnimating(false);
    setPlushHeld(false);
    setPlushAnimating(false);
    plushHoldStartedAtRef.current = null;
    setSqueakerCelebrating(false);
    setToyPickerOpen(true);
    setFeedback('選一款玩具開始互動。');
    frisbeeDrag.setValue({ x: 0, y: 0 });
    frisbeeFlightProgress.setValue(0);
    ballFlightProgress.setValue(0);
    tugDrag.setValue({ x: 0, y: 0 });
    plushSquash.setValue(0);
    squeakerPulse.setValue(0);
    tugPullCountRef.current = 0;
    lastTugDirectionRef.current = null;
    setTugPullCount(0);
    squeakerTapCountRef.current = 0;
    setSqueakerTaps(0);
  }

  function chooseToy(playToy: DogCompanionToy) {
    setSelectedToy(playToy);
    setToyPickerOpen(false);
    setFeedback('');
    setActiveToyKind(playToy.kind);
    setPose(artStyle === 'fluffy' ? 4 : 1);
    setActionKind('play');
    setBallLaunching(false);
    setTugAnimating(false);
    setPlushHeld(false);
    setPlushAnimating(false);
    plushHoldStartedAtRef.current = null;
    setSqueakerCelebrating(false);
    setTugPullCount(0);
    tugPullCountRef.current = 0;
    lastTugDirectionRef.current = null;
    setSqueakerTaps(0);
    squeakerTapCountRef.current = 0;
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
    if (playToy.kind === 'ball') {
      ballFlightProgress.setValue(0);
      setFeedback('輕點彈力球，狗狗會追出去再帶返來！');
    } else if (playToy.kind === 'tug') {
      tugDrag.setValue({ x: 0, y: 0 });
      setFeedback('左右交替拉繩三次，和狗狗一起拔河！');
    } else if (playToy.kind === 'plush') {
      plushSquash.setValue(0);
      setFeedback('長按布偶一秒，給狗狗一個抱抱！');
    } else {
      squeakerPulse.setValue(0);
      setFeedback('連按啾啾玩具三下，聽聽狗狗的反應！');
    }
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

  const interactionDisabled = busy || !owned || activeToyKind !== null || frisbeeReady || frisbeeLaunching || ballLaunching || tugAnimating || plushHeld || squeakerCelebrating;

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
              onLayout={(event) => setStageWidth(event.nativeEvent.layout.width)}
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
                    <ExpoImage
                      testID="dog-companion-original-art-background"
                      source={getDogFluffyImage(dog.key, 1)}
                      contentFit="cover"
                      blurRadius={18}
                      transition={160}
                      style={styles.originalDogBackdrop}
                    />
                    <View
                      pointerEvents="none"
                      style={[styles.originalDogBackdropTint, { backgroundColor: colors.candyCream }]}
                    />
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
              {activeToyKind === 'frisbee' && (frisbeeReady || frisbeeLaunching) && (
                <Animated.View
                  {...frisbeePanResponder.panHandlers}
                  testID="dog-companion-frisbee"
                  accessibilityRole="button"
                  accessibilityLabel={frisbeeLaunching ? '布飛盤正在飛行' : `按住飛盤向後拉，蓄力 ${frisbeePower}%`}
                  style={[
                    styles.frisbeeDraggable,
                    {
                      backgroundColor: selectedPlayToy?.color ?? dogColor,
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
              {activeToyKind === 'ball' && (
                <Animated.View
                  style={[
                    styles.toyBallTarget,
                    {
                      transform: [
                        { translateX: ballFlightX },
                        { translateY: ballFlightY },
                        { rotate: ballRotation },
                      ],
                    },
                  ]}
                >
                  <Pressable
                    testID="dog-companion-ball"
                    accessibilityRole="button"
                    accessibilityLabel={ballLaunching ? '彈力球正在彈出再回來' : '輕點彈力球，讓狗狗追球'}
                    disabled={ballLaunching}
                    onPress={() => void tossBall()}
                    style={({ pressed }) => [styles.toyBallBody, { backgroundColor: selectedPlayToy?.color, opacity: pressed ? 0.78 : 1 }]}
                  >
                    <View style={styles.toyBallStripe} />
                    <View style={styles.toyBallDot} />
                  </Pressable>
                </Animated.View>
              )}
              {activeToyKind === 'tug' && (
                <Animated.View
                  {...tugPanResponder.panHandlers}
                  testID="dog-companion-tug-rope"
                  accessibilityRole="button"
                  accessibilityLabel={`左右交替拉拔河繩，目前完成 ${tugPullCount}/3 次`}
                  style={[
                    styles.tugRopeTarget,
                    {
                      transform: [{ translateX: tugPullX }],
                    },
                  ]}
                >
                  <View style={[styles.tugGrip, { backgroundColor: selectedPlayToy?.color }]} />
                  <View style={[styles.tugRope, { borderColor: selectedPlayToy?.color }]}>
                    {[0, 1, 2, 3, 4].map((link) => (
                      <View key={link} style={[styles.tugRopeLink, { borderColor: selectedPlayToy?.color }]} />
                    ))}
                  </View>
                  <View style={[styles.tugGrip, { backgroundColor: selectedPlayToy?.color }]} />
                </Animated.View>
              )}
              {activeToyKind === 'plush' && (
                <Animated.View
                  style={[
                    styles.plushTarget,
                    {
                      transform: [
                        { scaleX: plushScaleX },
                        { scaleY: plushScaleY },
                        { rotate: plushTilt },
                      ],
                    },
                  ]}
                >
                  <Pressable
                    testID="dog-companion-plush"
                    accessibilityRole="button"
                    accessibilityLabel={plushHeld ? '正在抱住布偶' : '長按布偶一秒，和狗狗抱抱'}
                    onPressIn={onPlushPressIn}
                    onPressOut={() => void onPlushPressOut()}
                    style={styles.plushPressable}
                  >
                    <View style={styles.plushEars}>
                      <View style={[styles.plushEar, { backgroundColor: selectedPlayToy?.color }]} />
                      <View style={[styles.plushEar, { backgroundColor: selectedPlayToy?.color }]} />
                    </View>
                    <View style={[styles.plushBody, { backgroundColor: selectedPlayToy?.color }]}>
                      <View style={styles.plushFace}>
                        <View style={styles.plushEyes}>
                          <View style={styles.plushEye} />
                          <View style={styles.plushEye} />
                        </View>
                        <View style={styles.plushMuzzle}>
                          <Feather name="heart" size={11} color={colors.candyRose} />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              )}
              {activeToyKind === 'squeaker' && (
                <>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.squeakerRing,
                      {
                        borderColor: selectedPlayToy?.color,
                        opacity: squeakerRingOpacity,
                        transform: [{ scale: squeakerRingScale }],
                      },
                    ]}
                  />
                  <Animated.View style={[styles.squeakerTarget, { transform: [{ scale: squeakerScale }] }]}>
                    <Pressable
                      testID="dog-companion-squeaker"
                      accessibilityRole="button"
                      accessibilityLabel={`按啾啾玩具，已按 ${squeakerTaps}/3 下`}
                      disabled={squeakerCelebrating}
                      onPress={() => void tapSqueaker()}
                      style={({ pressed }) => [styles.squeakerBody, { backgroundColor: selectedPlayToy?.color, opacity: pressed ? 0.78 : 1 }]}
                    >
                      <Feather name="volume-2" size={23} color={colors.card} />
                    </Pressable>
                  </Animated.View>
                </>
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
              {!foodPickerOpen && !toyPickerOpen && activeToyKind === null && !tugAnimating && !squeakerCelebrating && (
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
                          ) : playToy.kind === 'ball' ? (
                            <View style={[styles.toyBallPreview, { backgroundColor: playToy.color }]}>
                              <View style={styles.toyDiscBand} />
                            </View>
                          ) : playToy.kind === 'tug' ? (
                            <Feather name="link" size={21} color={playToy.color} />
                          ) : playToy.kind === 'plush' ? (
                            <Feather name="smile" size={21} color={playToy.color} />
                        ) : (
                            <Feather name="volume-2" size={21} color={playToy.color} />
                        )}
                        <Text style={[styles.toyTileName, { color: colors.foreground }]} numberOfLines={2}>{playToy.name}</Text>
                        <Text style={[styles.toyTileHint, { color: colors.mutedForeground }]}>
                          {playToy.kind === 'frisbee' ? '拉住投擲' : playToy.kind === 'ball' ? '輕點追球' : playToy.kind === 'tug' ? '左右拔河' : playToy.kind === 'plush' ? '長按抱抱' : '連按三下'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {activeToyKind !== null && (
                <View
                  testID={activeToyKind === 'frisbee' ? 'dog-companion-frisbee-instructions' : `dog-companion-${activeToyKind}-instructions`}
                  style={[styles.frisbeeInstructions, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                >
                  <View style={styles.frisbeeInstructionsCopy}>
                    <Text style={[styles.frisbeeInstructionsTitle, { color: colors.foreground }]}>
                      {activeToyKind === 'frisbee' ? '按住飛盤向後拉，再放手！'
                        : activeToyKind === 'ball' ? '輕點彈力球，狗狗會追出去再帶返來！'
                          : activeToyKind === 'tug' ? '左右交替拉繩，和狗狗拔河！'
                            : activeToyKind === 'plush' ? '長按布偶一秒，給狗狗一個抱抱！'
                              : '連按啾啾玩具三下，看看狗狗反應！'}
                    </Text>
                    <Text style={[styles.foodPickerSubtitle, { color: colors.mutedForeground }]}>
                      {activeToyKind === 'frisbee' ? `力度 ${frisbeePower}% · 拉得越遠，飛得越遠`
                        : activeToyKind === 'ball' ? ballLaunching ? '球球彈出去再回來中…' : '點一下就會彈跳出去，再滾回來'
                          : activeToyKind === 'tug' ? `拔河來回 ${tugPullCount}/3 · 每次放手後換另一邊拉`
                            : activeToyKind === 'plush' ? plushHeld ? '保持按住，狗狗正抱緊布偶…' : '按住不放，輕輕抱緊布偶'
                              : `啾啾聲 ${squeakerTaps}/3 · 連按三下`}
                    </Text>
                  </View>
                  <Pressable
                    testID="dog-companion-toy-change"
                    accessibilityRole="button"
                    accessibilityLabel="更換一起玩的玩具"
                    disabled={ballLaunching || tugAnimating || plushHeld || plushAnimating || squeakerCelebrating || frisbeeLaunching}
                    onPress={cancelToyInteraction}
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
   originalDogArtwork: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
   originalDogBackdrop: { ...StyleSheet.absoluteFill, opacity: 0.72 },
   originalDogBackdropTint: { ...StyleSheet.absoluteFill, opacity: 0.38 },
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
   toyBallPreview: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  toyDiscBand: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(255,255,255,0.92)' },
  frisbeeInstructions: { borderWidth: 1, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  frisbeeInstructionsCopy: { flex: 1, gap: 3 },
  frisbeeInstructionsTitle: { fontSize: 11, fontWeight: '900' },
  frisbeeDraggable: { position: 'absolute', left: '50%', top: '58%', marginLeft: -23, marginTop: -23, width: 46, height: 46, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 20, elevation: 20, shadowColor: '#48324A', shadowOpacity: 0.24, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  frisbeeOuterRing: { position: 'absolute', width: 35, height: 35, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.72)' },
  frisbeeInnerRing: { width: 21, height: 21, borderRadius: 11, borderWidth: 2 },
  frisbeeCenterDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.9)' },
   toyBallTarget: { position: 'absolute', left: '50%', top: '58%', marginLeft: -24, marginTop: -24, zIndex: 20, elevation: 20 },
   toyBallBody: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center', shadowColor: '#48324A', shadowOpacity: 0.24, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
   toyBallStripe: { width: 38, height: 11, borderTopWidth: 2, borderBottomWidth: 2, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 8, transform: [{ rotate: '-34deg' }] },
   toyBallDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.9)' },
   tugRopeTarget: { position: 'absolute', left: '50%', top: '58%', marginLeft: -70, marginTop: -18, width: 140, height: 36, zIndex: 20, elevation: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
   tugGrip: { width: 19, height: 26, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
   tugRope: { width: 86, height: 18, borderWidth: 2, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.82)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 3 },
   tugRopeLink: { width: 12, height: 8, borderWidth: 2, borderRadius: 5, transform: [{ rotate: '-32deg' }] },
   plushTarget: { position: 'absolute', left: '50%', top: '57%', marginLeft: -36, marginTop: -38, width: 72, height: 76, zIndex: 20, elevation: 20 },
   plushPressable: { width: 72, height: 76, alignItems: 'center', justifyContent: 'flex-end' },
   plushEars: { position: 'absolute', top: 2, width: 62, height: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 5 },
   plushEar: { width: 20, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.92)' },
   plushBody: { width: 58, height: 54, borderRadius: 25, borderWidth: 2, borderColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', shadowColor: '#48324A', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
   plushFace: { alignItems: 'center', gap: 4 },
   plushEyes: { flexDirection: 'row', gap: 12 },
   plushEye: { width: 4, height: 5, borderRadius: 3, backgroundColor: '#48324A' },
   plushMuzzle: { width: 22, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' },
   squeakerRing: { position: 'absolute', left: '50%', top: '58%', marginLeft: -26, marginTop: -22, width: 52, height: 44, borderRadius: 22, borderWidth: 2, zIndex: 18 },
   squeakerTarget: { position: 'absolute', left: '50%', top: '58%', marginLeft: -27, marginTop: -22, zIndex: 20, elevation: 20 },
   squeakerBody: { width: 54, height: 44, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center', shadowColor: '#48324A', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
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
