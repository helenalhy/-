import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { Image as ExpoImage } from 'expo-image';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { getDailyDogGreeting, getDateOrdinal } from '@/lib/daily-engagement';
import { getDailyMotivationalQuote } from '@/constants/daily-motivation';
import { DOG_STAFF_PROFILES, DOG_STAFF_STYLE_CATALOGS } from '@/constants/dog-staff-customization';
import {
  getDogFluffyImage,
  getDogFluffyStaffImage,
  type DogFluffyPose,
} from '@/constants/dog-fluffy-images';
import { MALL_ITEMS } from '@/constants/mall';
import { SHOP_ROOM_IMAGES } from '@/constants/shop-room-images';
import { getShopInteriorSceneKey } from '@/constants/mall-shop-interior';
import {
  DAILY_ENERGY_OPTIONS,
  DAILY_MOOD_OPTIONS,
  readMoodHistory,
  saveDailyEnergy,
  saveDailyMood,
  type DailyEnergy,
  type DailyMood,
  type MoodEntry,
} from '@/lib/daily-personalization';
import { buildDailyPostcardSvg, getDailyStyleIndex, type DailyPostcardProgress } from '@/lib/daily-postcard';
import { createSvgPngBlob, downloadPngBlob, sharePngBlobOnWeb } from '@/lib/postcard-export';

const DAILY_POSTCARD_SHOPS = MALL_ITEMS
  .filter((item) => item.category === 'shop')
  .sort((left, right) => left.floor - right.floor || left.id.localeCompare(right.id));

function getPostcardDogImage(dogProfileKey: string, pose: DogFluffyPose): number {
  return pose === 1
    ? getDogFluffyStaffImage(dogProfileKey)
    : getDogFluffyImage(dogProfileKey, pose);
}

function getDailyPostcardArtwork(
  today: string,
  quote: string,
  progress: DailyPostcardProgress,
  dogPose: DogFluffyPose,
): string {
  const { dog } = getDailyDogGreeting(today);
  const ordinal = getDateOrdinal(today);
  const dogCatalog = DOG_STAFF_STYLE_CATALOGS[dog.decorationId];
  const outfit = dogCatalog.outfits[getDailyStyleIndex(today, DOG_STAFF_PROFILES.length, dogCatalog.outfits.length)];
  const accessory = dogCatalog.accessories[getDailyStyleIndex(today, DOG_STAFF_PROFILES.length, dogCatalog.accessories.length)];
  const shop = DAILY_POSTCARD_SHOPS[ordinal % DAILY_POSTCARD_SHOPS.length];
  const sceneKey = getShopInteriorSceneKey(shop.shopType, shop.id, shop.name);
  const roomAsset = Asset.fromModule(SHOP_ROOM_IMAGES[sceneKey]);
  const dogImageAsset = Asset.fromModule(getPostcardDogImage(dog.key, dogPose));
  return buildDailyPostcardSvg(
    today,
    quote,
    {
      name: dog.name,
      kind: dog.kind,
      coatColor: dog.color,
      outfit,
      accessory,
    },
    {
      floor: shop.floor,
      name: shop.name,
      roomImageUri: roomAsset.uri,
    },
    progress,
    dogImageAsset.uri,
  );
}

type NativeSvgExportHandle = {
  toDataURL: (callback: (base64: string) => void, options?: object) => void;
};

function getRecentDateKeys(today: string): string[] {
  const date = new Date(`${today}T12:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const previous = new Date(date);
    previous.setDate(date.getDate() - (6 - index));
    return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}-${String(previous.getDate()).padStart(2, '0')}`;
  });
}

function shortDate(date: string): string {
  const [, month, day] = date.split('-');
  return `${Number(month)}/${Number(day)}`;
}

export function DailyMoodCard({
  today,
  hasCheckedIn,
  recommendedAction,
  onStartRecommendedAction,
}: {
  today: string;
  hasCheckedIn: boolean;
  recommendedAction?: { habitTitle: string; action: string } | null;
  onStartRecommendedAction?: () => void;
}) {
  const colors = useColors();
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [savingMood, setSavingMood] = useState<DailyMood | null>(null);
  const [savingEnergy, setSavingEnergy] = useState<DailyEnergy | null>(null);
  const [error, setError] = useState('');
  const currentMood = history.find((entry) => entry.date === today)?.mood;
  const currentEnergy = history.find((entry) => entry.date === today)?.energy;

  useEffect(() => {
    let active = true;
    void readMoodHistory().then((entries) => {
      if (active) setHistory(entries);
    }).catch(() => {
      if (active) setError('暫時無法讀取心情紀錄。');
    });
    return () => { active = false; };
  }, [today]);

  async function chooseMood(mood: DailyMood) {
    if (!hasCheckedIn || savingMood || savingEnergy) return;
    const previous = history;
    const current = history.find((entry) => entry.date === today);
    const nextEntry = { ...current, date: today, mood };
    const next = [nextEntry, ...history.filter((entry) => entry.date !== today)]
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 180);
    setHistory(next);
    setSavingMood(mood);
    setError('');
    try {
      await saveDailyMood(today, mood);
    } catch {
      setHistory(previous);
      setError('心情沒有保存成功，請再選一次。');
    } finally {
      setSavingMood(null);
    }
  }

  async function chooseEnergy(energy: DailyEnergy) {
    if (savingMood || savingEnergy) return;
    const previous = history;
    const current = history.find((entry) => entry.date === today);
    const nextEntry = { ...current, date: today, energy };
    const next = [nextEntry, ...history.filter((entry) => entry.date !== today)]
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 180);
    setHistory(next);
    setSavingEnergy(energy);
    setError('');
    try {
      await saveDailyEnergy(today, energy);
    } catch {
      setHistory(previous);
      setError('精力紀錄沒有保存成功，請再選一次。');
    } finally {
      setSavingEnergy(null);
    }
  }

  const energyAdvice = currentEnergy === 'low'
    ? '今天先做 2 分鐘或最小的一步，不用更改平常目標。'
    : currentEnergy === 'high'
      ? '可以趁現在有精神，挑一項最想完成的目標。'
      : currentEnergy === 'steady'
        ? '照平常的步調開始，完成一小段就值得肯定。'
        : null;
  const recentDates = getRecentDateKeys(today);
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="daily-mood-card">
      <View style={styles.heading}>
        <View style={[styles.icon, { backgroundColor: colors.candyMint }]}>
          <Feather name="heart" size={16} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>完成後，留意自己的感受</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {currentMood ? '今天的心情已記下' : '完成目標後，今天感覺如何？'}
          </Text>
        </View>
      </View>
      <View style={styles.moodRow}>
        {DAILY_MOOD_OPTIONS.map((option) => {
          const selected = currentMood === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => void chooseMood(option.id)}
              disabled={!hasCheckedIn || savingMood !== null || savingEnergy !== null}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: !hasCheckedIn || savingMood !== null || savingEnergy !== null }}
              accessibilityLabel={`記錄今天的心情：${option.label}`}
              testID={`daily-mood-${option.id}`}
              style={({ pressed }) => [
                styles.moodOption,
                {
                  backgroundColor: selected ? colors.candyPink : colors.secondary,
                  borderColor: selected ? colors.primary : colors.border,
                  opacity: !hasCheckedIn || savingEnergy !== null ? 0.52 : pressed ? 0.72 : 1,
                },
              ]}
            >
              <Feather name={option.icon} size={16} color={selected ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.moodLabel, { color: selected ? colors.primary : colors.foreground }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.energyTitle, { color: colors.foreground }]}>今天的精力如何？</Text>
      <View style={styles.energyRow}>
        {DAILY_ENERGY_OPTIONS.map((option) => {
          const selected = currentEnergy === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => void chooseEnergy(option.id)}
              disabled={savingMood !== null || savingEnergy !== null}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: savingMood !== null || savingEnergy !== null }}
              accessibilityLabel={`記錄今天的精力：${option.label}`}
              testID={`daily-energy-${option.id}`}
              style={({ pressed }) => [
                styles.energyOption,
                {
                  backgroundColor: selected ? colors.candyMint : colors.secondary,
                  borderColor: selected ? colors.candyMintDark : colors.border,
                  opacity: savingMood !== null || savingEnergy !== null ? 0.52 : pressed ? 0.72 : 1,
                },
              ]}
            >
              <Feather name={option.icon} size={15} color={selected ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.moodLabel, { color: selected ? colors.primary : colors.foreground }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {energyAdvice ? (
        <View style={[styles.energyAdvice, { backgroundColor: colors.secondary }]}>
          <Feather name="zap" size={13} color={colors.primary} />
          <Text style={[styles.note, { color: colors.foreground, flex: 1 }]}>{energyAdvice}</Text>
        </View>
      ) : null}
      {currentEnergy && recommendedAction && onStartRecommendedAction ? (
        <View style={styles.energyStart} testID="energy-recommended-action">
          <View style={styles.energyStartCopy}>
            <Text style={[styles.energyStartLabel, { color: colors.mutedForeground }]}>今天可以先試</Text>
            <Text style={[styles.energyStartAction, { color: colors.foreground }]} numberOfLines={2}>
              {recommendedAction.habitTitle} · {recommendedAction.action}
            </Text>
          </View>
          <Pressable
            onPress={onStartRecommendedAction}
            accessibilityRole="button"
            accessibilityLabel={`開始${recommendedAction.habitTitle}：${recommendedAction.action}，兩分鐘`}
            testID="start-energy-recommendation"
            style={({ pressed }) => [
              styles.energyStartButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.76 : 1 },
            ]}
          >
            <Feather name="play" size={14} color={colors.primaryForeground} />
            <Text style={[styles.energyStartButtonText, { color: colors.primaryForeground }]}>開始 2 分鐘</Text>
          </Pressable>
        </View>
      ) : null}
      {currentEnergy && !recommendedAction ? (
        <Text style={[styles.note, { color: colors.mutedForeground }]}>今天沒有待開始的目標，可以安心休息。</Text>
      ) : null}
      <Text style={[styles.note, { color: colors.mutedForeground }]}>
        {hasCheckedIn
          ? '只記錄感受，不評分，也不影響目標或金幣；紀錄只保存在這台裝置。'
          : '精力可在開始前選擇並查看建議；完成第一個目標後再記心情。只保存在這台裝置，不影響目標或金幣。'}
      </Text>
      {error ? <Text style={[styles.error, { color: colors.destructive }]} accessibilityRole="alert">{error}</Text> : null}
      <View style={[styles.history, { borderTopColor: colors.border }]}>
        <Text style={[styles.historyTitle, { color: colors.mutedForeground }]}>最近 7 天</Text>
        <View style={styles.historyRow}>
          {recentDates.map((date) => {
            const entry = history.find((item) => item.date === date);
            const option = DAILY_MOOD_OPTIONS.find((item) => item.id === entry?.mood);
            const energy = DAILY_ENERGY_OPTIONS.find((item) => item.id === entry?.energy);
            return (
              <View key={date} style={styles.historyDay} testID={`mood-history-${date}`}>
                <View style={[styles.historyDot, { backgroundColor: option || energy ? colors.candyPink : colors.secondary }]}>
                  {option ? <Feather name={option.icon} size={12} color={colors.primary} /> : energy ? <Feather name="zap" size={12} color={colors.primary} /> : null}
                </View>
                <Text style={[styles.historyDate, { color: colors.mutedForeground }]}>{option?.label ?? energy?.label ?? shortDate(date)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function DailyPostcardCard({
  today,
  completedGoalsCount,
  streakDays,
}: {
  today: string;
  completedGoalsCount: number;
  streakDays: number;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [pngBlob, setPngBlob] = useState<Blob | null>(null);
  const [preparingPng, setPreparingPng] = useState(false);
  const [dogPose, setDogPose] = useState<DogFluffyPose>(1);
  const [dogPoseLoadedForKey, setDogPoseLoadedForKey] = useState<string | null>(null);
  const nativeSvgRef = useRef<NativeSvgExportHandle | null>(null);
  const quote = getDailyMotivationalQuote(today);
  const { dog } = getDailyDogGreeting(today);
  const dogPoseStorageKey = `momentum.dailyPostcardDogPose.v1.${dog.key}`;
  const dogPoseLoaded = dogPoseLoadedForKey === dogPoseStorageKey;
  const svg = useMemo(() => getDailyPostcardArtwork(today, quote, {
    completedGoalsCount,
    streakDays,
  }, dogPose), [completedGoalsCount, dogPose, quote, streakDays, today]);

  useEffect(() => {
    if (!open) {
      setDogPoseLoadedForKey(null);
      return;
    }
    let active = true;
    setDogPose(1);
    setDogPoseLoadedForKey(null);
    void AsyncStorage.getItem(dogPoseStorageKey)
      .then((savedPose) => {
        if (!active) return;
        const parsedPose = Number(savedPose);
        const nextPose: DogFluffyPose = parsedPose === 2 || parsedPose === 3 || parsedPose === 4
          ? parsedPose
          : 1;
        setDogPose(nextPose);
        setDogPoseLoadedForKey(dogPoseStorageKey);
      })
      .catch(() => {
        if (!active) return;
        setDogPose(1);
        setDogPoseLoadedForKey(dogPoseStorageKey);
        setError('無法讀取明信片狗狗姿勢，暫時使用姿勢 1。');
      });
    return () => { active = false; };
  }, [dogPoseStorageKey, open]);

  useEffect(() => {
    if (!open || !dogPoseLoaded) return;
    void AsyncStorage.setItem(dogPoseStorageKey, String(dogPose)).catch(() => {
      setError('狗狗姿勢未能儲存，請稍後再試。');
    });
  }, [dogPose, dogPoseLoaded, dogPoseStorageKey, open]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web' || !dogPoseLoaded) {
      setPngBlob(null);
      setPreparingPng(false);
      return;
    }
    let active = true;
    setPngBlob(null);
    setPreparingPng(true);
    setError('');
    setStatus('');
    void createSvgPngBlob(svg)
      .then((blob) => {
        if (active) setPngBlob(blob);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : '明信片圖片產生失敗，請稍後再試。');
      })
      .finally(() => {
        if (active) setPreparingPng(false);
      });
    return () => { active = false; };
  }, [dogPoseLoaded, open, svg]);

  async function createNativePngFile() {
    const exporter = nativeSvgRef.current;
    if (!exporter) throw new Error('明信片圖片仍在準備，請稍後再試。');
    const base64 = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('明信片圖片準備逾時，請再試一次。')), 8000);
      try {
        exporter.toDataURL((imageData) => {
          clearTimeout(timeout);
          resolve(imageData.replace(/^data:image\/png;base64,/, ''));
        }, { width: 1080, height: 1440 });
      } catch (caught) {
        clearTimeout(timeout);
        reject(caught);
      }
    });
    const fileSystem = await import('expo-file-system/legacy');
    const sharing = await import('expo-sharing');
    const cacheDirectory = fileSystem.cacheDirectory;
    if (!cacheDirectory) throw new Error('無法建立明信片暫存檔。');
    const fileUri = `${cacheDirectory}momentum-postcard-${today}.png`;
    await fileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: fileSystem.EncodingType.Base64,
    });
    if (!await sharing.isAvailableAsync()) throw new Error('此裝置目前不支援系統分享。');
    return { fileUri, sharing };
  }

  async function savePostcard() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (Platform.OS === 'web') {
        const image = pngBlob ?? await createSvgPngBlob(svg);
        downloadPngBlob(image, `momentum-postcard-${today}.png`);
        setStatus('已下載 PNG 明信片。');
      } else {
        const { fileUri, sharing } = await createNativePngFile();
        await sharing.shareAsync(fileUri, {
          dialogTitle: '儲存 Momentum 明信片 PNG',
          mimeType: 'image/png',
          UTI: 'public.png',
        });
        setStatus('可在系統分享選單選擇儲存到相簿或檔案。');
      }
    } catch (caught) {
      if (!(caught instanceof Error && caught.name === 'AbortError')) {
        setError(caught instanceof Error ? caught.message : '明信片沒有準備成功，請再試一次。');
      }
    } finally {
      setBusy(false);
    }
  }

  async function sharePostcard() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (Platform.OS === 'web') {
        const image = pngBlob ?? await createSvgPngBlob(svg);
        const result = await sharePngBlobOnWeb(
          image,
          `momentum-postcard-${today}.png`,
          'Momentum 每日進度卡',
        );
        setStatus(result === 'shared' ? '已開啟系統分享選單。' : '瀏覽器不支援分享圖片，已下載相同 PNG。');
      } else {
        const { fileUri, sharing } = await createNativePngFile();
        await sharing.shareAsync(fileUri, {
          dialogTitle: '分享 Momentum 每日進度卡',
          mimeType: 'image/png',
          UTI: 'public.png',
        });
        setStatus('已開啟系統分享選單。');
      }
    } catch (caught) {
      if (!(caught instanceof Error && caught.name === 'AbortError')) {
        setError(caught instanceof Error ? caught.message : '明信片沒有準備成功，請再試一次。');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <View style={[styles.postcardCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="daily-postcard-card">
        <View style={styles.heading}>
          <View style={[styles.icon, { backgroundColor: colors.candyLemon }]}>
            <Feather name="image" size={16} color={colors.primary} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>每日限定</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>今天的鼓勵明信片</Text>
            <Text style={[styles.note, { color: colors.mutedForeground }]}>每天更換配色與版面，可以下載收藏。</Text>
          </View>
        </View>
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="查看並下載今天的鼓勵明信片"
          testID="open-daily-postcard"
          style={({ pressed }) => [styles.openPostcardButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 }]}
        >
          <Feather name="eye" size={15} color={colors.primary} />
          <Text style={[styles.openPostcardText, { color: colors.primary }]}>查看今日明信片</Text>
          <Feather name="arrow-right" size={15} color={colors.primary} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="關閉每日明信片"
          />
          <View style={[styles.postcardPanel, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityViewIsModal testID="daily-postcard-preview">
            <View style={styles.modalHeader}>
              <View style={styles.copy}>
                <Text style={[styles.title, { color: colors.foreground }]}>今天的小小紀念</Text>
                <Text style={[styles.note, { color: colors.mutedForeground }]}>{today} · 每日設計會自動更新</Text>
              </View>
              <Pressable
                onPress={() => setOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="關閉明信片預覽"
                style={styles.closeButton}
              >
                <Feather name="x" size={19} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.postcardScroll} contentContainerStyle={styles.postcardPreview}>
              <SvgXml xml={svg} width="100%" height={410} accessibilityLabel={`每日明信片：${quote}`} />
            </ScrollView>
            <View style={styles.dogPoseRow} accessibilityLabel="選擇明信片狗狗姿勢">
              {([1, 2, 3, 4] as const).map((pose) => {
                const selected = dogPose === pose;
                const poseCaption = ['揮手', '捧物', '坐姿', '跳起'][pose - 1];
                return (
                  <Pressable
                    key={pose}
                    onPress={() => setDogPose(pose)}
                    disabled={!dogPoseLoaded}
                    accessibilityRole="radio"
                    accessibilityLabel={`狗狗姿勢 ${pose}：${poseCaption}`}
                    accessibilityState={{ checked: selected, disabled: !dogPoseLoaded }}
                    testID={`daily-postcard-pose-${pose}`}
                    style={[
                      styles.dogPoseOption,
                      {
                        backgroundColor: selected ? colors.primary : colors.candyPink,
                        borderColor: colors.primary,
                        opacity: dogPoseLoaded ? 1 : 0.55,
                      },
                    ]}
                  >
                    <ExpoImage
                      source={getPostcardDogImage(dog.key, pose)}
                      style={styles.dogPoseThumbnail}
                      contentFit="contain"
                      accessible={false}
                    />
                    <Text style={[styles.dogPoseLabel, { color: selected ? colors.background : colors.primary }]}>
                      姿勢 {pose}
                    </Text>
                    <Text style={[styles.dogPoseCaption, { color: selected ? colors.background : colors.primary }]}>
                      {poseCaption}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {error ? <Text style={[styles.error, { color: colors.destructive }]} accessibilityRole="alert">{error}</Text> : null}
            {status ? <Text style={[styles.status, { color: colors.primary }]}>{status}</Text> : null}
            <View style={styles.postcardActionRow}>
              <Pressable
                onPress={() => void sharePostcard()}
                disabled={busy || preparingPng || !dogPoseLoaded}
                accessibilityRole="button"
                accessibilityState={{ disabled: busy || preparingPng || !dogPoseLoaded, busy: busy || preparingPng || !dogPoseLoaded }}
                accessibilityLabel="分享每日進度卡圖片"
                testID="share-daily-postcard"
                style={[styles.postcardActionButton, { backgroundColor: colors.secondary, opacity: busy || preparingPng || !dogPoseLoaded ? 0.65 : 1 }]}
              >
                <Feather name="share-2" size={16} color={colors.primary} />
                <Text style={[styles.postcardActionText, { color: colors.primary }]}>
                  {preparingPng ? '準備圖片…' : '分享'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void savePostcard()}
                disabled={busy || preparingPng || !dogPoseLoaded}
                accessibilityRole="button"
                accessibilityState={{ disabled: busy || preparingPng || !dogPoseLoaded, busy: busy || preparingPng || !dogPoseLoaded }}
                accessibilityLabel={Platform.OS === 'web' ? '下載每日明信片 PNG' : '儲存每日明信片 PNG'}
                testID="download-daily-postcard"
                style={[styles.postcardActionButton, { backgroundColor: colors.primary, opacity: busy || preparingPng || !dogPoseLoaded ? 0.65 : 1 }]}
              >
                <Feather name={busy ? 'loader' : 'download'} size={16} color={colors.primaryForeground} />
                <Text style={[styles.postcardActionText, { color: colors.primaryForeground }]}>
                  {busy ? '準備中…' : Platform.OS === 'web' ? '下載明信片 PNG' : '儲存 PNG'}
                </Text>
              </Pressable>
            </View>
            {open && Platform.OS !== 'web' ? (
              <SvgXml
                xml={svg}
                width={1080}
                height={1440}
                pointerEvents="none"
                style={styles.nativePngRenderer}
                override={{ ref: nativeSvgRef }}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 15, marginBottom: 12 },
  postcardCard: { borderWidth: 1, borderRadius: 20, padding: 15, marginBottom: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  title: { fontSize: 15, lineHeight: 21, fontWeight: '700', marginTop: 3 },
  note: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  moodRow: { flexDirection: 'row', gap: 7, marginTop: 14 },
  energyTitle: { fontSize: 12, fontWeight: '700', marginTop: 14, marginBottom: -7 },
  energyRow: { flexDirection: 'row', gap: 7, marginTop: 14 },
  energyOption: { flex: 1, minHeight: 49, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', gap: 4 },
  energyAdvice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 10, marginTop: 9 },
  energyStart: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 13, padding: 9, marginTop: 8 },
  energyStartCopy: { flex: 1, minWidth: 0, gap: 3 },
  energyStartLabel: { fontSize: 10, fontWeight: '600' },
  energyStartAction: { fontSize: 11, lineHeight: 15, fontWeight: '600' },
  energyStartButton: { minHeight: 40, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  energyStartButtonText: { fontSize: 10, fontWeight: '700' },
  moodOption: { flex: 1, minHeight: 57, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 5 },
  moodLabel: { fontSize: 11, fontWeight: '600' },
  history: { marginTop: 13, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  historyTitle: { fontSize: 10, fontWeight: '600', marginBottom: 8 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyDay: { alignItems: 'center', gap: 4 },
  historyDot: { width: 25, height: 25, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  historyDate: { fontSize: 9 },
  error: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(40, 28, 37, 0.42)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  postcardPanel: { width: '100%', maxWidth: 440, maxHeight: '90%', borderWidth: 1, borderRadius: 24, padding: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  postcardScroll: { flexGrow: 0, maxHeight: 430, borderRadius: 16, overflow: 'hidden' },
  postcardPreview: { alignItems: 'center', paddingHorizontal: 6 },
  dogPoseRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 9 },
  dogPoseOption: { flex: 1, maxWidth: 78, minHeight: 77, alignItems: 'center', justifyContent: 'center', gap: 2, padding: 4, borderWidth: 2, borderRadius: 13 },
  dogPoseThumbnail: { width: 34, height: 34 },
  dogPoseLabel: { fontSize: 10, lineHeight: 13, fontWeight: '700' },
  dogPoseCaption: { fontSize: 8, lineHeight: 10, fontWeight: '600' },
  openPostcardButton: { height: 44, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  openPostcardText: { fontSize: 13, fontWeight: '700' },
  postcardActionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  postcardActionButton: { flex: 1, minHeight: 48, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  postcardActionText: { fontSize: 14, fontWeight: '700' },
  status: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  nativePngRenderer: { position: 'absolute', left: -1200, top: 0, opacity: 0 },
});
