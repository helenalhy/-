import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DogAttendant, type DogAttendantKind } from '@/components/DogAttendant';
import {
  DOG_STAFF_STATIONS,
  DOG_STAFF_STYLE_CATALOGS,
  getDefaultDogStaffLook,
  resolveDogStaffLook,
  type DogStaffLook,
  type DogStaffProfile,
  type DogStaffStationId,
} from '@/constants/dog-staff-customization';
import { useColors } from '@/hooks/useColors';

type LookTab = 'outfit' | 'accessory';
const LOOKS_PER_PAGE = 10;

export function DogStaffCustomizer({
  dogs,
  ownedDecorationIds,
  looks,
  stationPlacements,
  coins,
  busyDogId,
  onRedeem,
  onMoveDog,
  onStoreDog,
  onSelectLook,
}: {
  dogs: DogStaffProfile[];
  ownedDecorationIds: string[];
  looks?: Record<string, DogStaffLook>;
  stationPlacements?: Partial<Record<DogStaffStationId, string>>;
  coins: number;
  busyDogId: string | null;
  onRedeem: (dogDecorationId: string, stationId: DogStaffStationId) => Promise<void>;
  onMoveDog: (dogDecorationId: string, stationId: DogStaffStationId) => Promise<void>;
  onStoreDog: (dogDecorationId: string) => Promise<void>;
  onSelectLook: (dogDecorationId: string, look: DogStaffLook) => Promise<void>;
}) {
  const colors = useColors();
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<DogStaffStationId>(DOG_STAFF_STATIONS[0].id);
  const [activeTab, setActiveTab] = useState<LookTab>('outfit');
  const [page, setPage] = useState(1);
  const [savingLook, setSavingLook] = useState(false);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const owned = new Set(ownedDecorationIds);
  const activeDog = dogs.find(({ decorationId }) => decorationId === selectedDogId)
    ?? dogs.find(({ decorationId }) => owned.has(decorationId))
    ?? dogs[0];

  if (!activeDog) return null;

  const isOwned = owned.has(activeDog.decorationId);
  const catalog = DOG_STAFF_STYLE_CATALOGS[activeDog.decorationId];
  const currentLook = resolveDogStaffLook(activeDog.decorationId, looks?.[activeDog.decorationId])
    ?? getDefaultDogStaffLook(activeDog.decorationId)!;
  const currentStationEntry = Object.entries(stationPlacements ?? {})
    .find(([, dogDecorationId]) => dogDecorationId === activeDog.decorationId);
  const currentStationId = currentStationEntry?.[0] as DogStaffStationId | undefined;
  const currentStation = DOG_STAFF_STATIONS.find(({ id }) => id === currentStationId);
  const selectedStation = DOG_STAFF_STATIONS.find(({ id }) => id === selectedStationId)!;
  const stationOccupantId = stationPlacements?.[selectedStationId];
  const stationOccupant = dogs.find(({ decorationId }) => decorationId === stationOccupantId);
  const alreadyAtStation = currentStationId === selectedStationId;
  const stationOccupiedByOtherDog = !!stationOccupantId && stationOccupantId !== activeDog.decorationId;
  const canRedeem = coins >= activeDog.price;
  const choices = activeTab === 'outfit' ? catalog.outfits : catalog.accessories;
  const pageCount = Math.ceil(choices.length / LOOKS_PER_PAGE);
  const visibleChoices = choices.slice((page - 1) * LOOKS_PER_PAGE, page * LOOKS_PER_PAGE);

  async function redeemOrMoveDog() {
    if (working || busyDogId !== null) return;
    setWorking(true);
    setNotice('');
    try {
      if (isOwned) {
        await onMoveDog(activeDog.decorationId, selectedStationId);
        setNotice(`${activeDog.name}已免費移至「${selectedStation.label}」。`);
      } else {
        await onRedeem(activeDog.decorationId, selectedStationId);
        setNotice(`${activeDog.name}已兌換並安排在「${selectedStation.label}」，服裝與配飾已附送。`);
      }
    } catch (error) {
      setNotice(error instanceof Error ? `操作未完成：${error.message}` : '操作未完成，請稍後再試。');
    } finally {
      setWorking(false);
    }
  }

  async function storeDog() {
    if (!isOwned || !currentStationId || working || busyDogId !== null) return;
    setWorking(true);
    setNotice('');
    try {
      await onStoreDog(activeDog.decorationId);
      setNotice(`${activeDog.name}已收進店員收藏，沒有退款或扣除金幣。`);
    } catch (error) {
      setNotice(error instanceof Error ? `收納未完成：${error.message}` : '收納未完成，請稍後再試。');
    } finally {
      setWorking(false);
    }
  }

  async function chooseLook(choiceId: string) {
    if (savingLook || !isOwned) return;
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
          <Text style={[styles.title, { color: colors.foreground }]}>狗狗店員專屬站位</Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>
            14 個 CAFÉ 專用站位，不佔用一般店內 48 個位置；每個站位可放一位店員。
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stationPicker}
        accessibilityLabel="狗狗店員專屬站位"
      >
        {DOG_STAFF_STATIONS.map((station, index) => {
          const occupantId = stationPlacements?.[station.id];
          const occupant = dogs.find(({ decorationId }) => decorationId === occupantId);
          const occupantLook = occupant
            ? resolveDogStaffLook(occupant.decorationId, looks?.[occupant.decorationId])
              ?? getDefaultDogStaffLook(occupant.decorationId)!
            : null;
          const selected = station.id === selectedStationId;
          return (
            <Pressable
              key={station.id}
              testID={`dog-staff-station-${station.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${station.label}，${occupant ? `由${occupant.name}值班` : '空位'}${selected ? '，目前選取' : ''}`}
              accessibilityState={{ selected }}
              onPress={() => {
                setSelectedStationId(station.id);
                if (occupant) setSelectedDogId(occupant.decorationId);
                setNotice('');
              }}
              style={[
                styles.stationCard,
                {
                  backgroundColor: selected ? colors.secondary : colors.background,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.stationNumber, { color: colors.mutedForeground }]}>站位 {index + 1}</Text>
              <View style={styles.stationPreview}>
                {occupant && occupantLook ? (
                  <DogAttendant
                    kind={occupant.kind as DogAttendantKind}
                    outfitId={occupantLook.outfitId}
                    accessoryId={occupantLook.accessoryId}
                  />
                ) : (
                  <Feather name="plus-circle" size={19} color={colors.mutedForeground} />
                )}
              </View>
              <Text numberOfLines={1} style={[styles.stationName, { color: colors.foreground }]}>
                {occupant?.name ?? station.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.selectedStationCopy, { color: colors.primary }]}>
        目前選取：{selectedStation.label}{stationOccupant ? ` · ${stationOccupant.name}正在值班` : ' · 空位'}
      </Text>

      <Text style={[styles.subheading, { color: colors.foreground }]}>店員名單</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dogPicker}
        accessibilityLabel="狗狗店員名單"
      >
        {dogs.map((dog) => {
          const selected = dog.decorationId === activeDog.decorationId;
          const dogLook = resolveDogStaffLook(dog.decorationId, looks?.[dog.decorationId])
            ?? getDefaultDogStaffLook(dog.decorationId)!;
          const dogOwned = owned.has(dog.decorationId);
          return (
            <Pressable
              key={dog.decorationId}
              testID={`dog-staff-select-${dog.key}`}
              accessibilityRole="button"
              accessibilityLabel={`選擇${dog.name}，${dog.breed}${dogOwned ? '，已兌換' : `，${dog.price}金幣`}`}
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
                  outfitId={dogLook.outfitId}
                  accessoryId={dogLook.accessoryId}
                />
              </View>
              <Text numberOfLines={1} style={[styles.dogChipName, { color: colors.foreground }]}>{dog.name}</Text>
              <Text style={[styles.ownershipLabel, { color: dogOwned ? colors.primary : colors.mutedForeground }]}>
                {dogOwned ? '已兌換' : `${dog.price} 金幣`}
              </Text>
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
          <Text style={[styles.profileLocation, { color: colors.mutedForeground }]}>
            {isOwned ? `目前站位：${currentStation?.label ?? '店員收藏'}` : `兌換價格：${activeDog.price} 金幣`}
          </Text>
          {stationOccupiedByOtherDog && (
            <Text style={[styles.profileLocation, { color: colors.candyCaramelDark }]}>
              此站位已有{stationOccupant?.name ?? '店員'}；移入後原店員會回到收藏，仍保留所有權。
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          testID={isOwned ? `dog-staff-move-${activeDog.key}` : `dog-staff-redeem-${activeDog.key}`}
          accessibilityRole="button"
          accessibilityLabel={isOwned
            ? alreadyAtStation
              ? `${activeDog.name}已在${selectedStation.label}`
              : `免費將${activeDog.name}移到${selectedStation.label}`
            : `使用${activeDog.price}金幣兌換${activeDog.name}並安排在${selectedStation.label}`}
          accessibilityState={{ disabled: (isOwned && alreadyAtStation) || (!isOwned && (!canRedeem || stationOccupiedByOtherDog)) || busyDogId !== null }}
          disabled={(isOwned && alreadyAtStation) || (!isOwned && (!canRedeem || stationOccupiedByOtherDog)) || busyDogId !== null || working}
          onPress={() => void redeemOrMoveDog()}
          style={[
            styles.actionButton,
            {
              backgroundColor: isOwned ? colors.secondary : colors.primary,
              opacity: (isOwned && alreadyAtStation) || (!isOwned && (!canRedeem || stationOccupiedByOtherDog)) || busyDogId !== null || working ? 0.5 : 1,
            },
          ]}
        >
          <Feather name={working ? 'loader' : isOwned ? 'move' : 'plus'} size={15} color={isOwned ? colors.primary : colors.primaryForeground} />
          <Text style={[styles.actionButtonText, { color: isOwned ? colors.primary : colors.primaryForeground }]}>
            {isOwned
              ? alreadyAtStation ? '已在這個專屬站位' : `免費移到${selectedStation.label}`
              : stationOccupiedByOtherDog ? '請選擇空站位' : canRedeem ? `兌換並安排 · ${activeDog.price} 金幣` : `還差 ${activeDog.price - coins} 金幣`}
          </Text>
        </Pressable>
        {isOwned && currentStationId && (
          <Pressable
            testID={`dog-staff-store-${activeDog.key}`}
            accessibilityRole="button"
            accessibilityLabel={`將${activeDog.name}收進店員收藏，不退款`}
            accessibilityState={{ disabled: working || busyDogId !== null }}
            disabled={working || busyDogId !== null}
            onPress={() => void storeDog()}
            style={[styles.storeButton, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <Feather name="archive" size={15} color={colors.primary} />
            <Text style={[styles.storeButtonText, { color: colors.primary }]}>收進收藏</Text>
          </Pressable>
        )}
      </View>

      {isOwned ? (
        <>
          <Text style={[styles.subheading, { color: colors.foreground }]}>免費附送造型</Text>
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
                  style={[styles.tab, { backgroundColor: selected ? colors.primary : colors.secondary }]}
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
                    { backgroundColor: colors.background, borderColor: selected ? colors.primary : colors.border },
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
        </>
      ) : (
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>
          兌換後即可使用該狗狗專屬服裝與配飾；花花和奶昔另有粉紅／紫色公主裙及小裙子。
        </Text>
      )}

      {notice ? (
        <Text testID="dog-staff-customizer-notice" accessibilityRole="text" accessibilityLiveRegion="polite" style={[styles.notice, { color: colors.primary }]}>
          {notice}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 13, borderWidth: 1, borderRadius: 20, gap: 11 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  titleIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '800' },
  copy: { fontSize: 11, lineHeight: 16 },
  subheading: { fontSize: 13, fontWeight: '800' },
  stationPicker: { gap: 8, paddingVertical: 2, paddingRight: 4 },
  stationCard: { width: 78, minHeight: 91, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', padding: 5, gap: 2 },
  stationNumber: { fontSize: 8, fontWeight: '700' },
  stationPreview: { width: 44, height: 45, alignItems: 'center', justifyContent: 'center', transform: [{ scale: 0.78 }] },
  stationName: { maxWidth: '100%', fontSize: 9, fontWeight: '800', textAlign: 'center' },
  selectedStationCopy: { fontSize: 10, fontWeight: '800' },
  dogPicker: { gap: 8, paddingVertical: 2, paddingRight: 4 },
  dogChip: { width: 68, minHeight: 87, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 5, gap: 1 },
  dogChipPreview: { width: 45, height: 45, transform: [{ scale: 0.78 }], alignItems: 'center', justifyContent: 'center' },
  dogChipName: { fontSize: 10, fontWeight: '800' },
  ownershipLabel: { fontSize: 8, fontWeight: '700' },
  dogProfile: { minHeight: 82, borderWidth: 1, borderRadius: 15, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dogPreview: { width: 58, height: 62, alignItems: 'center', justifyContent: 'center', transform: [{ scale: 1.05 }] },
  profileCopy: { flex: 1, gap: 4 },
  profileName: { fontSize: 12, fontWeight: '800' },
  profileLocation: { fontSize: 10, lineHeight: 14 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionButton: { minHeight: 40, flex: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 9 },
  actionButtonText: { fontSize: 10, fontWeight: '800', textAlign: 'center' },
  storeButton: { minHeight: 40, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 9 },
  storeButtonText: { fontSize: 10, fontWeight: '800' },
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
