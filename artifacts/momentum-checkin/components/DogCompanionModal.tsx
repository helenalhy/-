import { Feather } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { Image as ExpoImage } from 'expo-image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
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
import type { DogStaffProfile } from '@/constants/dog-staff-customization';
import { useColors } from '@/hooks/useColors';
import { buildDogCompanionPostcardSvg } from '@/lib/dog-companion-postcard';
import {
  DOG_FEED_COST,
  type DogCompanionAction,
  type DogCompanionInteractionResult,
} from '@/lib/dog-companion';
import { downloadSvgAsPng } from '@/lib/postcard-export';
import { DogFoodIllustration } from '@/components/ShopInteriorScene';

const DOG_TOYS: Record<string, { name: string; icon: keyof typeof Feather.glyphMap }> = {
  'fluffy-staff-huahua': { name: '粉紅色小球', icon: 'circle' },
  'fluffy-staff-milkshake': { name: '紫色布球', icon: 'circle' },
  'fluffy-staff-xiaoniu': { name: '飛碟', icon: 'disc' },
  'fluffy-staff-pudding': { name: '橙色小球', icon: 'circle' },
  'fluffy-staff-tangtang': { name: '軟綿綿抱枕', icon: 'square' },
  'fluffy-staff-pipi': { name: '骨頭玩具', icon: 'award' },
  'fluffy-staff-amber': { name: '拉繩玩具', icon: 'link' },
  'fluffy-staff-cloud': { name: '雲朵球', icon: 'cloud' },
  'fluffy-staff-wonton': { name: '小布偶', icon: 'smile' },
  'fluffy-staff-butter': { name: '奶油色小球', icon: 'circle' },
  'fluffy-staff-sesame': { name: '布製飛盤', icon: 'disc' },
  'fluffy-staff-snowball': { name: '雪花布球', icon: 'circle' },
  'fluffy-staff-maomao': { name: '蓬鬆玩具', icon: 'feather' },
  'fluffy-staff-poppy': { name: '小骨頭', icon: 'award' },
};

type DogCompanionModalProps = {
  visible: boolean;
  dog: DogStaffProfile | null;
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

export function DogCompanionModal({
  visible,
  dog,
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
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [pose, setPose] = useState<1 | 2 | 3 | 4>(1);
  const [busy, setBusy] = useState(false);
  const [foodPickerOpen, setFoodPickerOpen] = useState(false);
  const [photoReady, setPhotoReady] = useState(false);
  const [heartBurstCount, setHeartBurstCount] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [actionKind, setActionKind] = useState<DogCompanionAction | null>(null);
  const [lastActionAffection, setLastActionAffection] = useState<number | null>(null);

  const foods = useMemo(
    () => (dog ? DOG_STAFF_FOOD_OPTIONS[dog.key] ?? [] : []),
    [dog],
  );
  const visibleAffection = lastActionAffection ?? affection;
  const dogColor = dog?.color ?? colors.primary;
  const toy = dog ? DOG_TOYS[dog.key] : undefined;

  useEffect(() => {
    setPose(1);
    setBusy(false);
    setFoodPickerOpen(false);
    setPhotoReady(false);
    setFeedback('');
    setHeartBurstCount(0);
    setLastActionAffection(null);
  }, [dog?.decorationId, visible]);

  useEffect(() => () => {
    animationRef.current?.stop();
    motion.stopAnimation();
    heartProgress.stopAnimation();
    flashOpacity.stopAnimation();
  }, [flashOpacity, heartProgress, motion]);

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

  if (!dog) return null;

  const activeDog = dog;
  const dogImage = getDogFluffyImage(dog.key, pose);
  const imageSource = dogImage as number;

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

  async function performAction(action: DogCompanionAction, food?: DogStaffFoodOption) {
    if (busy || !owned) return;
    if (action === 'feed' && !food) {
      setFoodPickerOpen(true);
      setFeedback('');
      return;
    }
    setBusy(true);
    setActionKind(action);
    setPhotoReady(false);
    setFeedback('');
    const poseByAction: Record<DogCompanionAction, 1 | 2 | 3 | 4> = {
      feed: 2,
      pet: 3,
      play: 4,
      photo: 1,
    };
    setPose(poseByAction[action]);
    setFoodPickerOpen(false);
    try {
      const result = await onInteract(
        activeDog.decorationId,
        action,
        action === 'feed' ? (food?.favorite ? 2 : 1) : 1,
        action === 'feed' ? DOG_FEED_COST : 0,
      );
      setLastActionAffection(result.affection);
      const heartCount = result.affectionGained;
      if (heartCount > 0) void showHearts(action === 'feed' && food?.favorite ? Math.max(2, heartCount) : heartCount);
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
      await animateInteraction(action, action === 'feed' && Boolean(food?.favorite));
    } catch (error) {
      setPose(1);
      setFeedback(error instanceof Error ? error.message : '互動未完成，請稍後再試。');
    } finally {
      setBusy(false);
      setActionKind(null);
      if (action !== 'photo') setPose(1);
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

  const interactionDisabled = busy || !owned;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView testID="dog-companion-modal" style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
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
              testID="dog-companion-image-stage"
              style={[styles.dogImageFrame, foodPickerOpen && styles.dogImageFrameFoodMode, { transform: [{ translateY: lift }, { rotate: tilt }] }]}
            >
              <ExpoImage
                testID={`dog-companion-pose-${pose}`}
                source={imageSource}
                contentFit="contain"
                transition={120}
                style={styles.dogImage}
              />
              {actionKind === 'photo' && (
                <View pointerEvents="none" style={styles.cameraFrame}>
                  <View style={styles.cameraCornerTopLeft} />
                  <View style={styles.cameraCornerTopRight} />
                  <View style={styles.cameraCornerBottomLeft} />
                  <View style={styles.cameraCornerBottomRight} />
                </View>
              )}
              {actionKind === 'play' && toy && (
                <View pointerEvents="none" style={[styles.toyBubble, { backgroundColor: colors.card, borderColor: dogColor }]}>
                  <Feather name={toy.icon} size={18} color={dogColor} />
                  <Text style={[styles.toyLabel, { color: colors.foreground }]}>{toy.name}</Text>
                </View>
              )}
              <Animated.View pointerEvents="none" style={[styles.cameraFlash, { opacity: flashOpacity }]} />
              {heartBurstCount > 0 && (
                <Animated.View
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
                    icon={toy?.icon ?? 'circle'}
                    title="一起玩"
                    detail={`免費 · ${toy?.name ?? '狗狗玩具'}`}
                    disabled={interactionDisabled}
                    onPress={() => void performAction('play')}
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
                            opacity: pressed ? 0.78 : 1,
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
  foodPicker: { borderWidth: 1, borderRadius: 19, padding: 11, gap: 9 },
  foodPickerHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foodPickerCopy: { flex: 1, gap: 3 },
  foodPickerTitle: { fontSize: 14, fontWeight: '900' },
  foodPickerSubtitle: { fontSize: 10, lineHeight: 14 },
  foodClose: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  foodTile: { width: '23.5%', minHeight: 106, borderWidth: 1, borderRadius: 13, paddingVertical: 6, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'space-between', gap: 2 },
  foodArt: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
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
