import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as ExpoImage } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DogAttendant, type DogAttendantKind } from '@/components/DogAttendant';
import { getDogFluffyStaffImage } from '@/constants/dog-fluffy-images';
import {
  DOG_STAFF_STYLE_CATALOGS,
  getDogStaffAreaLabel,
  getDefaultDogStaffLook,
  resolveDogStaffLook,
  type DogStaffLook,
  type DogStaffSavedLook,
  type DogStaffAreaId,
  type DogStaffAreaPlacements,
  type DogStaffProfile,
} from '@/constants/dog-staff-customization';
import { SHOP_INTERIOR_AREAS } from '@/constants/mall-shop-interior';
import { useColors } from '@/hooks/useColors';

type LookTab = 'outfit' | 'theme' | 'accessory';
type AccessoryFilter = 'all' | 'animal-ears';
export type DogStaffListArtStyle = 'original' | 'fluffy';
const DOG_STAFF_LIST_ART_STYLE_KEY = 'momentum.dogStaffListArtStyle.v1';
const LOOKS_PER_PAGE = 10;

export function DogStaffCustomizer({
  dogs,
  ownedDecorationIds,
  looks,
  savedLooks,
  areaPlacements,
  coins,
  busyDogId,
  onRedeem,
  onMoveDog,
  onStoreDog,
  onSelectLook,
  onSaveLook,
  onDeleteLook,
  onOpenDogCompanion,
  onDogListArtStyleChange,
  onOpenCollection,
}: {
  dogs: DogStaffProfile[];
  ownedDecorationIds: string[];
  looks?: Record<string, DogStaffLook>;
  savedLooks?: Record<string, DogStaffSavedLook[]>;
  areaPlacements?: DogStaffAreaPlacements;
  coins: number;
  busyDogId: string | null;
  onRedeem: (dogDecorationId: string, areaId: DogStaffAreaId) => Promise<void>;
  onMoveDog: (dogDecorationId: string, areaId: DogStaffAreaId) => Promise<void>;
  onStoreDog: (dogDecorationId: string) => Promise<void>;
  onSelectLook: (dogDecorationId: string, look: DogStaffLook) => Promise<void>;
  onSaveLook: (dogDecorationId: string, name: string, look: DogStaffLook) => Promise<void>;
  onDeleteLook: (dogDecorationId: string, savedLookId: string) => Promise<void>;
  onOpenDogCompanion?: (dogDecorationId: string) => void;
  onDogListArtStyleChange?: (style: DogStaffListArtStyle, loaded?: boolean) => void;
  onOpenCollection?: () => void;
}) {
  const colors = useColors();
  const owned = new Set(ownedDecorationIds);
  const initialDog = dogs.find(({ decorationId }) => owned.has(decorationId)) ?? dogs[0];
  const [selectedDogId, setSelectedDogId] = useState<string | null>(initialDog?.decorationId ?? null);
  const [selectedAreaId, setSelectedAreaId] = useState<DogStaffAreaId>(
    initialDog ? areaPlacements?.[initialDog.decorationId] ?? 'main' : 'main',
  );
  const [activeTab, setActiveTab] = useState<LookTab>('outfit');
  const [accessoryFilter, setAccessoryFilter] = useState<AccessoryFilter>('all');
  const [page, setPage] = useState(1);
  const [savingLook, setSavingLook] = useState(false);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const [savedLookName, setSavedLookName] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);
  const [workingPresetId, setWorkingPresetId] = useState<string | null>(null);
  const [dogListArtStyle, setDogListArtStyle] = useState<DogStaffListArtStyle>('fluffy');
  const [dogListArtStyleLoaded, setDogListArtStyleLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    let resolvedStyle: DogStaffListArtStyle = 'fluffy';
    AsyncStorage.getItem(DOG_STAFF_LIST_ART_STYLE_KEY)
      .then((savedStyle) => {
        if (active && (savedStyle === 'original' || savedStyle === 'fluffy')) {
          resolvedStyle = savedStyle;
          setDogListArtStyle(savedStyle);
        }
      })
      .catch(() => {
        if (active) setNotice('圖片風格設定暫時無法讀取，將先使用毛茸茸新版。');
      })
      .finally(() => {
        if (active) {
          setDogListArtStyleLoaded(true);
          onDogListArtStyleChange?.(resolvedStyle, true);
        }
      });
    return () => {
      active = false;
    };
  }, [onDogListArtStyleChange]);
  function reportNotice(message: string) {
    setNotice(message);
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  }
  async function chooseDogListArtStyle(style: DogStaffListArtStyle) {
    if (!dogListArtStyleLoaded || style === dogListArtStyle) return;
    setDogListArtStyle(style);
    onDogListArtStyleChange?.(style);
    setNotice('');
    try {
      await AsyncStorage.setItem(DOG_STAFF_LIST_ART_STYLE_KEY, style);
    } catch {
      reportNotice('圖片風格設定未能儲存，請稍後再試。');
    }
  }
  const activeDog = dogs.find(({ decorationId }) => decorationId === selectedDogId)
    ?? initialDog;

  if (!activeDog) return null;

  const isOwned = owned.has(activeDog.decorationId);
  const catalog = DOG_STAFF_STYLE_CATALOGS[activeDog.decorationId];
  const currentLook = resolveDogStaffLook(activeDog.decorationId, looks?.[activeDog.decorationId])
    ?? getDefaultDogStaffLook(activeDog.decorationId)!;
  const savedDogLooks = savedLooks?.[activeDog.decorationId] ?? [];
  const trimmedSavedLookName = savedLookName.trim();
  const duplicateSavedLookName = savedDogLooks.some(
    ({ name }) => name.toLocaleLowerCase() === trimmedSavedLookName.toLocaleLowerCase(),
  );
  const currentAreaId = areaPlacements?.[activeDog.decorationId];
  const currentAreaLabel = currentAreaId ? getDogStaffAreaLabel(currentAreaId) : '';
  const selectedAreaLabel = getDogStaffAreaLabel(selectedAreaId);
  const alreadyAtArea = currentAreaId === selectedAreaId;
  const canRedeem = coins >= activeDog.price;
  const basicOutfits = catalog.outfits.filter(({ theme }) => !theme);
  const themedOutfits = catalog.outfits.filter(({ theme }) => !!theme);
  const choices = activeTab === 'accessory'
    ? catalog.accessories.filter(({ shape }) => accessoryFilter === 'all' || shape === 'animal-ears')
    : activeTab === 'theme' ? themedOutfits : basicOutfits;
  const pageCount = Math.ceil(choices.length / LOOKS_PER_PAGE);
  const visibleChoices = choices.slice((page - 1) * LOOKS_PER_PAGE, page * LOOKS_PER_PAGE);

  async function redeemOrMoveDog() {
    if (working || busyDogId !== null) return;
    if (!isOwned && !canRedeem) {
      reportNotice(`金幣不足：目前有 ${coins} 枚，兌換${activeDog.name}需要 ${activeDog.price} 枚，還差 ${activeDog.price - coins} 枚。完成目標即可賺取金幣。`);
      return;
    }
    setWorking(true);
    setNotice('');
    try {
      if (isOwned) {
        await onMoveDog(activeDog.decorationId, selectedAreaId);
        reportNotice(`已將${activeDog.name}免費移到${selectedAreaLabel}；目前造型保留。`);
      } else {
        await onRedeem(activeDog.decorationId, selectedAreaId);
        reportNotice(`已兌換${activeDog.name}並安排到${selectedAreaLabel}；服裝與配飾免費附送。`);
      }
    } catch (error) {
      reportNotice(error instanceof Error ? `操作未完成：${error.message}` : '操作未完成，請稍後再試。');
    } finally {
      setWorking(false);
    }
  }

  async function storeDog() {
    if (!isOwned || !currentAreaId || working || busyDogId !== null) return;
    setWorking(true);
    setNotice('');
    try {
      await onStoreDog(activeDog.decorationId);
      reportNotice(`${activeDog.name}已收進店員收藏，沒有退款或扣除金幣。`);
    } catch (error) {
      reportNotice(error instanceof Error ? `收納未完成：${error.message}` : '收納未完成，請稍後再試。');
    } finally {
      setWorking(false);
    }
  }

  async function chooseLook(choiceId: string) {
    if (savingLook || !isOwned) return;
    const nextLook: DogStaffLook = activeTab === 'accessory'
      ? { ...currentLook, accessoryId: choiceId }
      : { ...currentLook, outfitId: choiceId };
    if (nextLook.outfitId === currentLook.outfitId && nextLook.accessoryId === currentLook.accessoryId) return;
    const choice = choices.find(({ id }) => id === choiceId);
    if (!choice) return;
    const category = activeTab === 'accessory' ? '配飾' : activeTab === 'theme' ? '主題服裝' : '服裝';
    setSavingLook(true);
    setNotice('');
    try {
      await onSelectLook(activeDog.decorationId, nextLook);
      reportNotice(`已保存${activeDog.name}的${category}「${choice.name}」，免費穿戴。`);
    } catch (error) {
      reportNotice(error instanceof Error ? `造型未能保存：${error.message}` : '造型未能保存，請稍後再試。');
    } finally {
      setSavingLook(false);
    }
  }

  async function saveNamedLook() {
    if (savingPreset || !trimmedSavedLookName || duplicateSavedLookName || !isOwned) return;
    setSavingPreset(true);
    setNotice('');
    try {
      await onSaveLook(activeDog.decorationId, trimmedSavedLookName, currentLook);
      setSavedLookName('');
      reportNotice(`已保存${activeDog.name}的穿搭「${trimmedSavedLookName}」，免費保存。`);
    } catch (error) {
      reportNotice(error instanceof Error ? `穿搭未能保存：${error.message}` : '穿搭未能保存，請稍後再試。');
    } finally {
      setSavingPreset(false);
    }
  }

  async function applyNamedLook(savedLook: DogStaffSavedLook) {
    if (savingLook || workingPresetId) return;
    setWorkingPresetId(savedLook.id);
    setNotice('');
    try {
      await onSelectLook(activeDog.decorationId, savedLook.look);
      reportNotice(`已為${activeDog.name}套用「${savedLook.name}」，服裝與配飾均已更新，免費穿戴。`);
    } catch (error) {
      reportNotice(error instanceof Error ? `穿搭未能套用：${error.message}` : '穿搭未能套用，請稍後再試。');
    } finally {
      setWorkingPresetId(null);
    }
  }

  async function deleteNamedLook(savedLook: DogStaffSavedLook) {
    if (workingPresetId || savingPreset) return;
    setWorkingPresetId(savedLook.id);
    setNotice('');
    try {
      await onDeleteLook(activeDog.decorationId, savedLook.id);
      reportNotice(`已刪除${activeDog.name}的穿搭「${savedLook.name}」。`);
    } catch (error) {
      reportNotice(error instanceof Error ? `穿搭未能刪除：${error.message}` : '穿搭未能刪除，請稍後再試。');
    } finally {
      setWorkingPresetId(null);
    }
  }

  return (
    <View testID="dog-staff-customizer" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.heading}>
        <View style={[styles.titleIcon, { backgroundColor: colors.candyPeach }]}>
          <Feather name="heart" size={17} color={colors.candyCaramelDark} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={[styles.title, { color: colors.foreground }]}>狗狗店員活動區域</Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>
            店員可安排在主區或 5 個延伸區並在地面巡走，不佔每區 8 個一般位置；餵食每次 5 金幣，摸摸、玩耍與影相免費。
          </Text>
        </View>
      </View>
      {onOpenCollection && (
        <Pressable
          testID="dog-collection-open"
          accessibilityRole="button"
          accessibilityLabel="打開狗狗收集圖鑑"
          onPress={onOpenCollection}
          style={[styles.collectionButton, { backgroundColor: colors.secondary, borderColor: colors.border }]}
        >
          <Feather name="book-open" size={17} color={colors.primary} />
          <Text style={[styles.collectionButtonText, { color: colors.primary }]}>狗狗圖鑑</Text>
          <Feather name="arrow-right" size={15} color={colors.primary} />
        </Pressable>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.areaPicker}
        accessibilityLabel="狗狗店員活動區域"
      >
        {SHOP_INTERIOR_AREAS.map((area) => {
          const selected = area.id === selectedAreaId;
          const areaDogCount = Object.values(areaPlacements ?? {}).filter((assignedArea) => assignedArea === area.id).length;
          return (
            <Pressable
              key={area.id}
              testID={`dog-staff-area-${area.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${area.label}，${areaDogCount} 位狗狗店員${selected ? '，目前選取' : ''}`}
              accessibilityState={{ selected }}
              onPress={() => {
                setSelectedAreaId(area.id);
                setNotice('');
              }}
              style={[
                styles.areaCard,
                {
                  backgroundColor: selected ? colors.secondary : colors.background,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <Feather name={area.id === 'main' ? 'home' : 'map-pin'} size={17} color={selected ? colors.primary : colors.mutedForeground} />
              <Text numberOfLines={1} style={[styles.areaName, { color: colors.foreground }]}>{area.label}</Text>
              <Text style={[styles.areaCount, { color: colors.mutedForeground }]}>{areaDogCount} 隻</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.selectedAreaCopy, { color: colors.primary }]}>
        {isOwned && currentAreaLabel ? `目前位置：${currentAreaLabel} · ` : '安排位置：'}
        {selectedAreaLabel} · 狗狗會在地面移動
      </Text>

      <View style={styles.staffListHeader}>
        <Text style={[styles.subheading, { color: colors.foreground }]}>店員名單</Text>
        <View style={[styles.staffArtToggle, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          {([
            { id: 'fluffy', label: '毛茸茸新版' },
            { id: 'original', label: '原裝' },
          ] as const).map((option) => {
            const selected = dogListArtStyle === option.id;
            return (
              <Pressable
                key={option.id}
                testID={`dog-staff-art-style-${option.id}`}
                accessibilityRole="radio"
                accessibilityLabel={`店員名單圖片風格：${option.label}`}
                accessibilityState={{ checked: selected, disabled: !dogListArtStyleLoaded }}
                disabled={!dogListArtStyleLoaded}
                onPress={() => void chooseDogListArtStyle(option.id)}
                style={[
                  styles.staffArtOption,
                  { backgroundColor: selected ? colors.card : 'transparent' },
                ]}
              >
                <Text style={[styles.staffArtOptionText, { color: selected ? colors.primary : colors.mutedForeground }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
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
              accessibilityLabel={`選擇${dog.name}，${dog.breed}${selected ? '，目前選取' : ''}${dogOwned ? '，已兌換' : `，${dog.price}金幣`}`}
              accessibilityState={{ selected }}
              onPress={() => {
                setSelectedDogId(dog.decorationId);
                setSelectedAreaId(areaPlacements?.[dog.decorationId] ?? 'main');
                setPage(1);
                setNotice('');
                onOpenDogCompanion?.(dog.decorationId);
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
                {dogListArtStyle === 'fluffy' ? (
                  <ExpoImage
                    source={getDogFluffyStaffImage(dog.key)}
                    style={styles.dogChipImage}
                    contentFit="contain"
                    accessible={false}
                  />
                ) : (
                  <DogAttendant
                    kind={dog.kind as DogAttendantKind}
                    outfitId={dogLook.outfitId}
                    accessoryId={dogLook.accessoryId}
                  />
                )}
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
          <View style={styles.profileDogScale}>
            <DogAttendant
              kind={activeDog.kind as DogAttendantKind}
              outfitId={currentLook.outfitId}
              accessoryId={currentLook.accessoryId}
            />
          </View>
        </View>
        <View style={styles.profileCopy}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{activeDog.name} · {activeDog.breed}</Text>
          <Text style={[styles.profileLocation, { color: colors.mutedForeground }]}>
            {isOwned ? `目前位置：${currentAreaLabel || '店員收藏'}` : `兌換價格：${activeDog.price} 金幣`}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          testID={isOwned ? `dog-staff-move-${activeDog.key}` : `dog-staff-redeem-${activeDog.key}`}
          accessibilityRole="button"
          accessibilityLabel={isOwned
            ? alreadyAtArea
              ? `${activeDog.name}已在${selectedAreaLabel}`
              : `免費將${activeDog.name}安排到${selectedAreaLabel}`
            : canRedeem
              ? `使用${activeDog.price}金幣兌換${activeDog.name}並安排到${selectedAreaLabel}`
              : `金幣不足，兌換${activeDog.name}還差${activeDog.price - coins}枚`}
          accessibilityState={{ disabled: (isOwned && alreadyAtArea) || busyDogId !== null }}
          disabled={(isOwned && alreadyAtArea) || busyDogId !== null || working}
          onPress={() => void redeemOrMoveDog()}
          style={[
            styles.actionButton,
            {
              backgroundColor: isOwned ? colors.secondary : colors.primary,
              opacity: (isOwned && alreadyAtArea) || busyDogId !== null || working ? 0.5 : 1,
            },
          ]}
        >
          <Feather name={working ? 'loader' : isOwned ? 'move' : 'plus'} size={15} color={isOwned ? colors.primary : colors.primaryForeground} />
          <Text style={[styles.actionButtonText, { color: isOwned ? colors.primary : colors.primaryForeground }]}>
            {isOwned
              ? alreadyAtArea ? `已在${selectedAreaLabel}` : `免費移到${selectedAreaLabel}`
              : canRedeem ? `兌換並安排 · ${activeDog.price} 金幣` : `還差 ${activeDog.price - coins} 金幣`}
          </Text>
        </Pressable>
        {isOwned && currentAreaId && (
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
          <Text style={[styles.subheading, { color: colors.foreground }]}>常用穿搭</Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>
            儲存目前服裝與配飾組合；套用或刪除都不扣金幣。
          </Text>
          <View style={styles.savedLookCreateRow}>
            <TextInput
              testID={`dog-staff-saved-look-name-${activeDog.key}`}
              accessibilityLabel={`輸入${activeDog.name}的穿搭名稱`}
              value={savedLookName}
              onChangeText={setSavedLookName}
              maxLength={24}
              placeholder="例如：魔法少女"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.savedLookInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
            />
            <Pressable
              testID={`dog-staff-saved-look-save-${activeDog.key}`}
              accessibilityRole="button"
              accessibilityLabel={`保存${activeDog.name}目前的服裝與配飾`}
              accessibilityState={{ disabled: !trimmedSavedLookName || duplicateSavedLookName || savingPreset || workingPresetId !== null }}
              disabled={!trimmedSavedLookName || duplicateSavedLookName || savingPreset || workingPresetId !== null}
              onPress={() => void saveNamedLook()}
              style={[styles.savedLookSaveButton, { backgroundColor: colors.primary, opacity: !trimmedSavedLookName || duplicateSavedLookName || savingPreset || workingPresetId !== null ? 0.45 : 1 }]}
            >
              <Feather name="bookmark" size={14} color={colors.primaryForeground} />
              <Text style={[styles.savedLookSaveText, { color: colors.primaryForeground }]}>保存</Text>
            </Pressable>
          </View>
          {duplicateSavedLookName ? (
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>這隻狗已有相同名稱，請換一個名稱。</Text>
          ) : null}
          {savedDogLooks.length > 0 ? (
            <View style={styles.savedLookList}>
              {savedDogLooks.map((savedLook) => (
                <View key={savedLook.id} style={[styles.savedLookRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.savedLookCopy}>
                    <Text numberOfLines={1} style={[styles.savedLookName, { color: colors.foreground }]}>{savedLook.name}</Text>
                    <Text style={[styles.copy, { color: colors.mutedForeground }]}>服裝與配飾</Text>
                  </View>
                  <Pressable
                    testID={`dog-staff-saved-look-apply-${activeDog.key}-${savedLook.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`為${activeDog.name}套用穿搭「${savedLook.name}」`}
                    accessibilityState={{ disabled: savingLook || workingPresetId !== null }}
                    disabled={savingLook || workingPresetId !== null}
                    onPress={() => void applyNamedLook(savedLook)}
                    style={[styles.savedLookAction, { backgroundColor: colors.secondary }]}
                  >
                    <Text style={[styles.savedLookActionText, { color: colors.primary }]}>套用</Text>
                  </Pressable>
                  <Pressable
                    testID={`dog-staff-saved-look-delete-${activeDog.key}-${savedLook.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`刪除${activeDog.name}的穿搭「${savedLook.name}」`}
                    accessibilityState={{ disabled: workingPresetId !== null || savingPreset }}
                    disabled={workingPresetId !== null || savingPreset}
                    onPress={() => void deleteNamedLook(savedLook)}
                    style={[styles.savedLookAction, { backgroundColor: colors.secondary }]}
                  >
                    <Text style={[styles.savedLookActionText, { color: colors.primary }]}>刪除</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>尚未保存穿搭。</Text>
          )}
          <Text style={[styles.subheading, { color: colors.foreground }]}>免費附送造型</Text>
          <View style={styles.tabs}>
            {([
              ['outfit', `服裝 ${basicOutfits.length} 款`],
              ['theme', `主題服裝 ${themedOutfits.length} 款`],
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
                    if (tab === 'accessory') setAccessoryFilter('all');
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

          {activeTab === 'accessory' ? (
            <View style={styles.accessoryFilters} accessibilityLabel="配飾分類">
              {([
                ['all', `全部 ${catalog.accessories.length} 款`],
                ['animal-ears', `動物耳朵帽 ${catalog.accessories.filter(({ shape }) => shape === 'animal-ears').length} 款`],
              ] as const).map(([filter, label]) => {
                const selected = accessoryFilter === filter;
                return (
                  <Pressable
                    key={filter}
                    testID={`dog-staff-accessory-filter-${filter}`}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setAccessoryFilter(filter);
                      setPage(1);
                      setNotice('');
                    }}
                    style={[
                      styles.accessoryFilter,
                      {
                        backgroundColor: selected ? colors.secondary : colors.background,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.accessoryFilterText, { color: selected ? colors.primary : colors.mutedForeground }]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

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
              const selected = activeTab === 'accessory'
                ? currentLook.accessoryId === choice.id
                : currentLook.outfitId === choice.id;
              const candidateLook = activeTab === 'accessory'
                ? { ...currentLook, accessoryId: choice.id }
                : { ...currentLook, outfitId: choice.id };
              return (
                <Pressable
                  key={choice.id}
                  testID={`dog-staff-look-${activeDog.key}-${activeTab}-${(page - 1) * LOOKS_PER_PAGE + index + 1}`}
                  accessibilityRole="button"
                  accessibilityLabel={`為${activeDog.name}選擇${choice.name}，${selected ? '目前穿戴中' : '尚未穿戴'}，免費附送`}
                  accessibilityState={{ selected, disabled: savingLook }}
                  disabled={savingLook}
                  onPress={() => void chooseLook(choice.id)}
                  style={[
                    styles.lookCard,
                    { backgroundColor: colors.background, borderColor: selected ? colors.primary : colors.border },
                  ]}
                >
                  <View style={[styles.lookPreview, { backgroundColor: colors.candyCream }]}>
                    <View style={styles.lookDogScale}>
                      <DogAttendant
                        kind={activeDog.kind as DogAttendantKind}
                        outfitId={candidateLook.outfitId}
                        accessoryId={candidateLook.accessoryId}
                      />
                    </View>
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
          兌換後免費解鎖服裝與配飾，包含 50 套節日造型、14 色魔法少女服、毛衣、動物造型服及動物耳朵帽；選穿不扣金幣。
        </Text>
      )}

      {notice ? (
        <Text testID="dog-staff-customizer-notice" accessibilityRole="text" accessibilityLiveRegion={Platform.OS === 'ios' ? 'none' : 'polite'} style={[styles.notice, { color: colors.primary }]}>
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
  collectionButton: { minHeight: 46, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  collectionButtonText: { fontSize: 13, fontWeight: '900' },
  title: { fontSize: 15, fontWeight: '800' },
  copy: { fontSize: 11, lineHeight: 16 },
  subheading: { fontSize: 13, fontWeight: '800' },
  areaPicker: { gap: 8, paddingVertical: 2, paddingRight: 4 },
  areaCard: { width: 82, minHeight: 69, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', padding: 5, gap: 2 },
  areaName: { maxWidth: '100%', fontSize: 9, fontWeight: '800', textAlign: 'center' },
  areaCount: { fontSize: 8, fontWeight: '700' },
  selectedAreaCopy: { fontSize: 10, fontWeight: '800' },
  staffListHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  staffArtToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 2 },
  staffArtOption: { minHeight: 31, borderRadius: 9, justifyContent: 'center', paddingHorizontal: 9 },
  staffArtOptionText: { fontSize: 9, fontWeight: '800' },
  dogPicker: { gap: 8, paddingVertical: 2, paddingRight: 4 },
  dogChip: { width: 68, minHeight: 87, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 5, gap: 1 },
  dogChipPreview: { width: 54, height: 48, alignItems: 'center', justifyContent: 'center' },
  dogChipImage: { width: 54, height: 48 },
  dogChipName: { fontSize: 10, fontWeight: '800' },
  ownershipLabel: { fontSize: 8, fontWeight: '700' },
  dogProfile: { minHeight: 82, borderWidth: 1, borderRadius: 15, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dogPreview: { width: 66, height: 62, alignItems: 'center', justifyContent: 'center' },
  profileDogScale: { transform: [{ scale: 1.18 }] },
  profileCopy: { flex: 1, gap: 4 },
  profileName: { fontSize: 12, fontWeight: '800' },
  profileLocation: { fontSize: 10, lineHeight: 14 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: { minHeight: 44, flex: 1, minWidth: 150, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 9 },
  actionButtonText: { fontSize: 10, fontWeight: '800', textAlign: 'center' },
  storeButton: { minHeight: 44, minWidth: 112, flexGrow: 1, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 9 },
  storeButtonText: { fontSize: 10, fontWeight: '800' },
  savedLookCreateRow: { flexDirection: 'row', gap: 7 },
  savedLookInput: { flex: 1, minWidth: 0, minHeight: 42, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, fontSize: 12 },
  savedLookSaveButton: { minHeight: 42, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 13 },
  savedLookSaveText: { fontSize: 11, fontWeight: '800' },
  savedLookList: { gap: 6 },
  savedLookRow: { minHeight: 54, borderWidth: 1, borderRadius: 12, padding: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  savedLookCopy: { flex: 1, gap: 2 },
  savedLookName: { fontSize: 11, fontWeight: '800' },
  savedLookAction: { minWidth: 45, minHeight: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  savedLookActionText: { fontSize: 10, fontWeight: '800' },
  tabs: { flexDirection: 'row', gap: 6 },
  tab: { flex: 1, minWidth: 0, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabText: { fontSize: 10, fontWeight: '800', textAlign: 'center', lineHeight: 14 },
  accessoryFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  accessoryFilter: { minHeight: 38, borderWidth: 1, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 12 },
  accessoryFilterText: { fontSize: 10, fontWeight: '800' },
  lookPager: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageCount: { fontSize: 10, fontWeight: '700' },
  pageActions: { flexDirection: 'row', gap: 7 },
  pageButton: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  lookGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lookCard: { width: '48%', minHeight: 132, borderWidth: 1, borderRadius: 13, padding: 7, alignItems: 'center', justifyContent: 'center', gap: 3 },
  lookPreview: { width: 68, height: 60, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  lookDogScale: { transform: [{ scale: 1.16 }] },
  lookName: { minHeight: 27, fontSize: 9, fontWeight: '700', textAlign: 'center', lineHeight: 13 },
  lookStatus: { fontSize: 9, fontWeight: '800' },
  notice: { fontSize: 11, lineHeight: 16 },
});
