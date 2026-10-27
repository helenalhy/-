import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DogAttendant, type DogAttendantKind } from '@/components/DogAttendant';
import {
  DOG_STAFF_STYLE_CATALOGS,
  getDefaultDogStaffLook,
  resolveDogStaffLook,
  type DogStaffLook,
  type DogStaffProfile,
} from '@/constants/dog-staff-customization';
import {
  parseShopInteriorPlacementId,
  SHOP_INTERIOR_AREAS,
  SHOP_INTERIOR_SLOTS,
  type ShopInteriorPlacementId,
} from '@/constants/mall-shop-interior';
import { useColors } from '@/hooks/useColors';

type LookTab = 'outfit' | 'accessory';

const LOOKS_PER_PAGE = 10;

export function DogStaffCustomizer({
  dogs,
  looks,
  placements,
  destinationPlacementId,
  destinationLabel,
  busyDecorationId,
  onMoveDog,
  onSelectLook,
}: {
  dogs: DogStaffProfile[];
  looks?: Record<string, DogStaffLook>;
  placements: Partial<Record<ShopInteriorPlacementId, string>>;
  destinationPlacementId: ShopInteriorPlacementId;
  destinationLabel: string;
  busyDecorationId: string | null;
  onMoveDog: (dogDecorationId: string) => void;
  onSelectLook: (dogDecorationId: string, look: DogStaffLook) => Promise<void>;
}) {
  const colors = useColors();
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LookTab>('outfit');
  const [page, setPage] = useState(1);
  const [savingLook, setSavingLook] = useState(false);
  const [notice, setNotice] = useState('');
  const activeDog = dogs.find(({ decorationId }) => decorationId === selectedDogId) ?? dogs[0];

  if (!activeDog) {
    return (
      <View testID="dog-staff-customizer-empty" style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.titleIcon, { backgroundColor: colors.candyPeach }]}>
          <Feather name="heart" size={17} color={colors.candyCaramelDark} />
        </View>
        <View style={styles.emptyCopy}>
          <Text style={[styles.title, { color: colors.foreground }]}>狗狗店員衣帽間</Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>
            兌換狗狗店員後，即附送該狗狗專屬的 50 套服裝和 50 款配飾，不另收金幣。
          </Text>
        </View>
      </View>
    );
  }

  const catalog = DOG_STAFF_STYLE_CATALOGS[activeDog.decorationId];
  const currentLook = resolveDogStaffLook(activeDog.decorationId, looks?.[activeDog.decorationId])
    ?? getDefaultDogStaffLook(activeDog.decorationId)!;
  const currentPlacementId = Object.entries(placements)
    .find(([, decorationId]) => decorationId === activeDog.decorationId)?.[0];
  const currentPlacement = currentPlacementId
    ? parseShopInteriorPlacementId(currentPlacementId)
    : null;
  const currentLocation = currentPlacement
    ? `${SHOP_INTERIOR_AREAS.find(({ id }) => id === currentPlacement.areaId)?.label ?? '店內'} · ${SHOP_INTERIOR_SLOTS.find(({ id }) => id === currentPlacement.slotId)?.label ?? ''}`
    : '收藏中，尚未放置';
  const destinationAlreadyOccupiedByThisDog = currentPlacementId === destinationPlacementId;
  const choices = activeTab === 'outfit' ? catalog.outfits : catalog.accessories;
  const pageCount = Math.ceil(choices.length / LOOKS_PER_PAGE);
  const visibleChoices = choices.slice((page - 1) * LOOKS_PER_PAGE, page * LOOKS_PER_PAGE);

  async function chooseLook(choiceId: string) {
    if (savingLook) return;
    const nextLook: DogStaffLook = activeTab === 'outfit'
      ? { ...currentLook, outfitId: choiceId }
      : { ...currentLook, accessoryId: choiceId };
    if (nextLook.outfitId === currentLook.outfitId && nextLook.accessoryId === currentLook.accessoryId) return;
    setSavingLook(true);
    setNotice('');
    try {
      await onSelectLook(activeDog.decorationId, nextLook);
      setNotice(`${activeDog.name}的造型已保存，沒有扣除金幣。`);
    } catch (error) {
      setNotice(error instanceof Error ? `造型未能保存：${error.message}` : '造型未能保存，請稍後再試。');
    } finally {
      setSavingLook(false);
    }
  }

  return (
    <View testID="dog-staff-customizer" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.heading}>
        <View style={[styles.titleIcon, { backgroundColor: colors.candyPeach }]}>
          <Feather name="heart" size={17} color={colors.candyCaramelDark} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={[styles.title, { color: colors.foreground }]}>狗狗店員衣帽間</Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>
            每位已兌換店員附送專屬 50 套服裝和 50 款配飾，可免費更換。
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dogPicker}
        accessibilityLabel="已兌換的狗狗店員"
      >
        {dogs.map((dog) => {
          const selected = dog.decorationId === activeDog.decorationId;
          const look = resolveDogStaffLook(dog.decorationId, looks?.[dog.decorationId])
            ?? getDefaultDogStaffLook(dog.decorationId)!;
          return (
            <Pressable
              key={dog.decorationId}
              testID={`dog-staff-select-${dog.key}`}
              accessibilityRole="button"
              accessibilityLabel={`選擇${dog.name}，${dog.breed}`}
              accessibilityState={{ selected }}
              onPress={() => {
                setSelectedDogId(dog.decorationId);
                setPage(1);
                setNotice('');
              }}
              style={[
                styles.dogChip,
                {
                  backgroundColor: selected ? colors.secondary : colors.background,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.dogChipPreview}>
                <DogAttendant
                  kind={dog.kind as DogAttendantKind}
                  outfitId={look.outfitId}
                  accessoryId={look.accessoryId}
                />
              </View>
              <Text numberOfLines={1} style={[styles.dogChipName, { color: colors.foreground }]}>{dog.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.dogProfile, { backgroundColor: colors.candyCream, borderColor: colors.border }]}>
        <View style={styles.dogPreview}>
          <DogAttendant
            kind={activeDog.kind as DogAttendantKind}
            outfitId={currentLook.outfitId}
            accessoryId={currentLook.accessoryId}
          />
        </View>
        <View style={styles.profileCopy}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{activeDog.name} · {activeDog.breed}</Text>
          <Text style={[styles.profileLocation, { color: colors.mutedForeground }]}>目前位置：{currentLocation}</Text>
          <Text style={[styles.profileLocation, { color: colors.mutedForeground }]}>移動目標：{destinationLabel}</Text>
        </View>
      </View>
      <Pressable
        testID={`dog-staff-move-${activeDog.key}`}
        accessibilityRole="button"
        accessibilityLabel={destinationAlreadyOccupiedByThisDog
          ? `${activeDog.name}已在${destinationLabel}`
          : `免費將${activeDog.name}移到${destinationLabel}`}
        accessibilityState={{ disabled: destinationAlreadyOccupiedByThisDog || busyDecorationId !== null }}
        disabled={destinationAlreadyOccupiedByThisDog || busyDecorationId !== null}
        onPress={() => onMoveDog(activeDog.decorationId)}
        style={[
          styles.moveButton,
          {
            backgroundColor: colors.secondary,
            opacity: destinationAlreadyOccupiedByThisDog || busyDecorationId !== null ? 0.55 : 1,
          },
        ]}
      >
        <Feather name={busyDecorationId === activeDog.decorationId ? 'loader' : 'move'} size={15} color={colors.primary} />
        <Text style={[styles.moveButtonText, { color: colors.primary }]}>
          {destinationAlreadyOccupiedByThisDog ? '已在目前選取位置' : `免費移到${destinationLabel}`}
        </Text>
      </Pressable>

      <View style={styles.tabs}>
        {([
          ['outfit', `服裝 ${catalog.outfits.length} 款`],
          ['accessory', `配飾 ${catalog.accessories.length} 款`],
        ] as const).map(([tab, label]) => {
          const selected = activeTab === tab;
          return (
            <Pressable
              key={tab}
              testID={`dog-staff-tab-${tab}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                setActiveTab(tab);
                setPage(1);
                setNotice('');
              }}
              style={[
                styles.tab,
                { backgroundColor: selected ? colors.primary : colors.secondary },
              ]}
            >
              <Text style={[styles.tabText, { color: selected ? colors.primaryForeground : colors.primary }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.lookPager}>
        <Text testID="dog-staff-look-page" style={[styles.pageCount, { color: colors.mutedForeground }]}>
          第 {page} / {pageCount} 頁 · 每頁 {LOOKS_PER_PAGE} 款
        </Text>
        <View style={styles.pageActions}>
          <Pressable
            testID="dog-staff-look-page-prev"
            accessibilityRole="button"
            accessibilityLabel="上一頁造型"
            accessibilityState={{ disabled: page <= 1 }}
            disabled={page <= 1}
            onPress={() => setPage((value) => Math.max(1, value - 1))}
            style={[styles.pageButton, { backgroundColor: colors.secondary, opacity: page <= 1 ? 0.45 : 1 }]}
          >
            <Feather name="chevron-left" size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            testID="dog-staff-look-page-next"
            accessibilityRole="button"
            accessibilityLabel="下一頁造型"
            accessibilityState={{ disabled: page >= pageCount }}
            disabled={page >= pageCount}
            onPress={() => setPage((value) => Math.min(pageCount, value + 1))}
            style={[styles.pageButton, { backgroundColor: colors.secondary, opacity: page >= pageCount ? 0.45 : 1 }]}
          >
            <Feather name="chevron-right" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.lookGrid}>
        {visibleChoices.map((choice, index) => {
          const selected = activeTab === 'outfit'
            ? currentLook.outfitId === choice.id
            : currentLook.accessoryId === choice.id;
          const candidateLook = activeTab === 'outfit'
            ? { ...currentLook, outfitId: choice.id }
            : { ...currentLook, accessoryId: choice.id };
          return (
            <Pressable
              key={choice.id}
              testID={`dog-staff-look-${activeDog.key}-${activeTab}-${(page - 1) * LOOKS_PER_PAGE + index + 1}`}
              accessibilityRole="button"
              accessibilityLabel={`${choice.name}${selected ? '，目前穿戴中' : '，免費附送'}`}
              accessibilityState={{ selected, disabled: savingLook }}
              disabled={savingLook}
              onPress={() => void chooseLook(choice.id)}
              style={[
                styles.lookCard,
                {
                  backgroundColor: colors.background,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[styles.lookPreview, { backgroundColor: colors.candyCream }]}>
                <DogAttendant
                  kind={activeDog.kind as DogAttendantKind}
                  outfitId={candidateLook.outfitId}
                  accessoryId={candidateLook.accessoryId}
                />
              </View>
              <Text numberOfLines={2} style={[styles.lookName, { color: colors.foreground }]}>{choice.name}</Text>
              <Text style={[styles.lookStatus, { color: selected ? colors.primary : colors.mutedForeground }]}>
                {selected ? '穿戴中' : '免費附送'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {notice ? (
        <Text testID="dog-staff-customizer-notice" accessibilityRole="text" accessibilityLiveRegion="polite" style={[styles.notice, { color: colors.primary }]}>
          {notice}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 13, borderWidth: 1, borderRadius: 20, gap: 12 },
  emptyCard: { padding: 13, borderWidth: 1, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  titleIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1, gap: 2 },
  emptyCopy: { flex: 1, gap: 3 },
  title: { fontSize: 15, fontWeight: '800' },
  copy: { fontSize: 11, lineHeight: 16 },
  dogPicker: { gap: 8, paddingVertical: 2, paddingRight: 4 },
  dogChip: { width: 66, minHeight: 74, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 5, gap: 1 },
  dogChipPreview: { width: 45, height: 45, transform: [{ scale: 0.78 }], alignItems: 'center', justifyContent: 'center' },
  dogChipName: { fontSize: 10, fontWeight: '800' },
  dogProfile: { minHeight: 82, borderWidth: 1, borderRadius: 15, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dogPreview: { width: 58, height: 62, alignItems: 'center', justifyContent: 'center', transform: [{ scale: 1.05 }] },
  profileCopy: { flex: 1, gap: 4 },
  profileName: { fontSize: 12, fontWeight: '800' },
  profileLocation: { fontSize: 10, lineHeight: 14 },
  moveButton: { minHeight: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 10 },
  moveButtonText: { fontSize: 11, fontWeight: '800' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, minHeight: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  tabText: { fontSize: 11, fontWeight: '800' },
  lookPager: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageCount: { fontSize: 10, fontWeight: '700' },
  pageActions: { flexDirection: 'row', gap: 7 },
  pageButton: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  lookGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lookCard: { width: '48.6%', minHeight: 114, borderWidth: 1, borderRadius: 13, padding: 7, alignItems: 'center', justifyContent: 'center', gap: 3 },
  lookPreview: { width: 50, height: 49, borderRadius: 11, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  lookName: { minHeight: 27, fontSize: 9, fontWeight: '700', textAlign: 'center', lineHeight: 13 },
  lookStatus: { fontSize: 9, fontWeight: '800' },
  notice: { fontSize: 11, lineHeight: 16 },
});
