import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DogStaffProfile } from '@/constants/dog-staff-customization';
import { getDogFluffyStaffImage } from '@/constants/dog-fluffy-images';
import { useColors } from '@/hooks/useColors';
import {
  DOG_COLLECTION_REWARD_UNLOCKS,
  type DogCompanionState,
} from '@/lib/dog-companion';

type DogCollectionBookProps = {
  visible: boolean;
  dogs: DogStaffProfile[];
  ownedDecorationIds: string[];
  companionState?: DogCompanionState;
  onClose: () => void;
  onOpenOwnedDog: (dogDecorationId: string) => void;
  onGoToMallFloor: () => void;
};

const REWARDS = [
  { tier: 5, icon: 'star' as const, title: '收集 5 隻', detail: '獲得 50 金幣' },
  { tier: 10, icon: 'gift' as const, title: '收集 10 隻', detail: '限定裝飾：雲朵星光擺飾', unlockId: DOG_COLLECTION_REWARD_UNLOCKS.limitedDecoration },
  { tier: 14, icon: 'award' as const, title: '收集全部 14 隻', detail: '狗狗大師稱號、金色棉花糖、200 金幣', unlockIds: [DOG_COLLECTION_REWARD_UNLOCKS.masterTitle, DOG_COLLECTION_REWARD_UNLOCKS.goldenMarshmallow] },
];

export function DogCollectionBook({
  visible,
  dogs,
  ownedDecorationIds,
  companionState,
  onClose,
  onOpenOwnedDog,
  onGoToMallFloor,
}: DogCollectionBookProps) {
  const colors = useColors();
  const [pendingDogId, setPendingDogId] = useState<string | null>(null);
  const owned = useMemo(() => new Set(ownedDecorationIds), [ownedDecorationIds]);
  const ownedCount = dogs.filter(({ decorationId }) => owned.has(decorationId)).length;
  const progress = dogs.length > 0 ? ownedCount / dogs.length : 0;
  const claimedTiers = new Set(companionState?.collectionRewardTiers ?? []);
  const unlocks = new Set(companionState?.collectionRewardUnlocks ?? []);
  const pendingDog = dogs.find(({ decorationId }) => decorationId === pendingDogId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView testID="dog-collection-book" style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headingCopy}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>毛茸茸棉花糖 CAFE</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>狗狗圖鑑</Text>
          </View>
          <Pressable
            testID="dog-collection-close"
            accessibilityRole="button"
            accessibilityLabel="關閉狗狗圖鑑"
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.secondary }]}
          >
            <Feather name="x" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.progressHeading}>
              <Text testID="dog-collection-count" style={[styles.progressTitle, { color: colors.foreground }]}>
                已收集 {ownedCount} / {dogs.length}
              </Text>
              <Feather name="heart" size={17} color={colors.candyRose} />
            </View>
            <View
              accessible
              accessibilityLabel={`狗狗圖鑑進度 ${ownedCount} / ${dogs.length}`}
              style={[styles.progressTrack, { backgroundColor: colors.secondary }]}
            >
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.progressHint, { color: colors.mutedForeground }]}>在 6F 毛茸茸棉花糖 CAFE 用金幣兌換狗狗店員。</Text>
          </View>

          <View style={styles.dogGrid}>
            {dogs.map((dog, index) => {
              const isOwned = owned.has(dog.decorationId);
              const affection = companionState?.affection[dog.decorationId] ?? 0;
              return (
                <Pressable
                  key={dog.decorationId}
                  testID={`dog-collection-card-${dog.key}`}
                  accessibilityRole="button"
                  accessibilityLabel={isOwned
                    ? `${dog.name}，已擁有，親密度 ${affection} 顆心`
                    : `未收集狗狗 ${index + 1}，${dog.price} 金幣，6F 毛茸茸棉花糖 CAFE`}
                  onPress={() => {
                    if (isOwned) onOpenOwnedDog(dog.decorationId);
                    else setPendingDogId(dog.decorationId);
                  }}
                  style={({ pressed }) => [
                    styles.dogCard,
                    {
                      backgroundColor: isOwned ? colors.card : colors.secondary,
                      borderColor: isOwned ? colors.border : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View style={[styles.dogImageWell, { backgroundColor: colors.candyCream }]}>
                    <ExpoImage
                      source={getDogFluffyStaffImage(dog.key)}
                      contentFit="contain"
                      style={[
                        styles.dogImage,
                        !isOwned && { tintColor: colors.mutedForeground, opacity: 0.38 },
                      ]}
                    />
                    {!isOwned && (
                      <View style={styles.questionOverlay}>
                        <Text style={[styles.questionMark, { color: colors.foreground }]}>?</Text>
                      </View>
                    )}
                  </View>
                  {isOwned ? (
                    <>
                      <Text numberOfLines={1} style={[styles.dogName, { color: colors.foreground }]}>{dog.name}</Text>
                      <View style={styles.heartCount}>
                        <Feather name="heart" size={11} color={colors.candyRose} />
                        <Text style={[styles.heartText, { color: colors.foreground }]}>{affection}</Text>
                      </View>
                      <Text style={[styles.ownedLabel, { color: colors.primary }]}>已擁有</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.dogName, { color: colors.foreground }]}>尚未收集</Text>
                      <Text style={[styles.priceText, { color: colors.primary }]}>{dog.price} 金幣</Text>
                      <Text style={[styles.floorText, { color: colors.mutedForeground }]}>6F 棉花糖 CAFE</Text>
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.rewardSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.rewardHeading, { color: colors.foreground }]}>收集獎勵</Text>
            {REWARDS.map((reward) => {
              const claimed = claimedTiers.has(reward.tier);
              const unlocked = ('unlockId' in reward && Boolean(reward.unlockId && unlocks.has(reward.unlockId)))
                || ('unlockIds' in reward && Boolean(reward.unlockIds?.every((id) => unlocks.has(id))));
              const complete = claimed || unlocked;
              return (
                <View key={reward.tier} style={[styles.rewardRow, { borderColor: colors.border }]}>
                  <View style={[styles.rewardIcon, { backgroundColor: complete ? colors.candyMint : colors.secondary }]}>
                    <Feather name={reward.icon} size={17} color={complete ? colors.candyMintDark : colors.primary} />
                  </View>
                  <View style={styles.rewardCopy}>
                    <Text style={[styles.rewardTitle, { color: colors.foreground }]}>{reward.title}</Text>
                    <Text style={[styles.rewardDetail, { color: colors.mutedForeground }]}>{reward.detail}</Text>
                  </View>
                  <Text style={[styles.rewardStatus, { color: complete ? colors.candyMintDark : colors.mutedForeground }]}>
                    {complete ? '已領取' : ownedCount >= reward.tier ? '即將領取' : `還差 ${reward.tier - ownedCount} 隻`}
                  </Text>
                </View>
              );
            })}
            {unlocks.has(DOG_COLLECTION_REWARD_UNLOCKS.masterTitle) && (
              <View testID="dog-collection-master-title" style={[styles.unlockedBadge, { backgroundColor: colors.secondary }]}>
                <Feather name="award" size={15} color={colors.primary} />
                <Text style={[styles.unlockedBadgeText, { color: colors.primary }]}>已解鎖稱號：狗狗大師</Text>
              </View>
            )}
            {unlocks.has(DOG_COLLECTION_REWARD_UNLOCKS.goldenMarshmallow) && (
              <View testID="dog-collection-golden-marshmallow" style={[styles.unlockedBadge, { backgroundColor: colors.candyLemon }]}>
                <Feather name="star" size={15} color={colors.candyCaramelDark} />
                <Text style={[styles.unlockedBadgeText, { color: colors.candyCaramelDark }]}>已解鎖裝飾：金色棉花糖</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {pendingDog && (
          <View style={styles.promptBackdrop}>
            <View style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.promptIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="shopping-bag" size={21} color={colors.primary} />
              </View>
              <Text style={[styles.promptTitle, { color: colors.foreground }]}>到 6F 認識新店員</Text>
              <Text style={[styles.promptBody, { color: colors.mutedForeground }]}>
                {pendingDog.name}可在毛茸茸棉花糖 CAFE 以 {pendingDog.price} 金幣兌換。
              </Text>
              <Pressable
                testID="dog-collection-go-to-mall"
                accessibilityRole="button"
                accessibilityLabel="前往商場 6F 兌換狗狗店員"
                onPress={() => {
                  setPendingDogId(null);
                  onGoToMallFloor();
                }}
                style={({ pressed }) => [styles.goToMallButton, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}
              >
                <Feather name="navigation" size={16} color={colors.primaryForeground} />
                <Text style={[styles.goToMallText, { color: colors.primaryForeground }]}>前往 6F 商場</Text>
              </Pressable>
              <Pressable
                testID="dog-collection-dismiss-prompt"
                accessibilityRole="button"
                accessibilityLabel="稍後再看"
                onPress={() => setPendingDogId(null)}
                style={styles.dismissPrompt}
              >
                <Text style={[styles.dismissPromptText, { color: colors.mutedForeground }]}>稍後再看</Text>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { minHeight: 68, paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headingCopy: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: '900' },
  closeButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 15, paddingBottom: 30, gap: 14 },
  progressCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 9 },
  progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressTitle: { fontSize: 16, fontWeight: '900' },
  progressTrack: { height: 11, borderRadius: 7, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 7 },
  progressHint: { fontSize: 10, lineHeight: 15 },
  dogGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 9 },
  dogCard: { width: '31.8%', minHeight: 154, borderWidth: 1, borderRadius: 15, padding: 7, alignItems: 'center', justifyContent: 'flex-start', gap: 3 },
  dogImageWell: { width: '100%', aspectRatio: 1, borderRadius: 11, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  dogImage: { width: '100%', height: '100%' },
  questionOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  questionMark: { fontSize: 35, lineHeight: 42, fontWeight: '900' },
  dogName: { maxWidth: '100%', fontSize: 12, lineHeight: 16, fontWeight: '900', textAlign: 'center' },
  heartCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heartText: { fontSize: 10, fontWeight: '800' },
  ownedLabel: { fontSize: 9, fontWeight: '900' },
  priceText: { fontSize: 10, fontWeight: '900' },
  floorText: { fontSize: 8, lineHeight: 11, textAlign: 'center' },
  rewardSection: { borderWidth: 1, borderRadius: 18, padding: 12, gap: 8 },
  rewardHeading: { fontSize: 15, fontWeight: '900', marginBottom: 2 },
  rewardRow: { minHeight: 58, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 7 },
  rewardIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rewardCopy: { flex: 1, gap: 2 },
  rewardTitle: { fontSize: 11, fontWeight: '900' },
  rewardDetail: { fontSize: 9, lineHeight: 13 },
  rewardStatus: { fontSize: 9, fontWeight: '800' },
  unlockedBadge: { minHeight: 36, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  unlockedBadgeText: { fontSize: 10, fontWeight: '900' },
  promptBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(47,35,42,0.3)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  promptCard: { width: '100%', maxWidth: 360, borderWidth: 1, borderRadius: 22, padding: 20, alignItems: 'center', gap: 10, elevation: 8 },
  promptIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  promptTitle: { fontSize: 17, fontWeight: '900' },
  promptBody: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  goToMallButton: { width: '100%', minHeight: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 3 },
  goToMallText: { fontSize: 13, fontWeight: '900' },
  dismissPrompt: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 18 },
  dismissPromptText: { fontSize: 11, fontWeight: '700' },
});
