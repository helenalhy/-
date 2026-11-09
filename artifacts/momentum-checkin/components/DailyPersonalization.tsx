import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { getDailyDogGreeting } from '@/lib/daily-engagement';
import { getDailyMotivationalQuote } from '@/constants/daily-motivation';
import {
  DAILY_MOOD_OPTIONS,
  readMoodHistory,
  saveDailyMood,
  type DailyMood,
  type MoodEntry,
} from '@/lib/daily-personalization';
import { buildDailyPostcardSvg } from '@/lib/daily-postcard';

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

export function DailyMoodCard({ today, hasCheckedIn }: { today: string; hasCheckedIn: boolean }) {
  const colors = useColors();
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [savingMood, setSavingMood] = useState<DailyMood | null>(null);
  const [error, setError] = useState('');
  const currentMood = history.find((entry) => entry.date === today)?.mood;

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
    if (!hasCheckedIn || savingMood) return;
    const previous = history;
    const next = [{ date: today, mood }, ...history.filter((entry) => entry.date !== today)]
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
              disabled={!hasCheckedIn || savingMood !== null}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: !hasCheckedIn || savingMood !== null }}
              accessibilityLabel={`記錄今天的心情：${option.label}`}
              testID={`daily-mood-${option.id}`}
              style={({ pressed }) => [
                styles.moodOption,
                {
                  backgroundColor: selected ? colors.candyPink : colors.secondary,
                  borderColor: selected ? colors.primary : colors.border,
                  opacity: !hasCheckedIn ? 0.52 : pressed ? 0.72 : 1,
                },
              ]}
            >
              <Feather name={option.icon} size={16} color={selected ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.moodLabel, { color: selected ? colors.primary : colors.foreground }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.note, { color: colors.mutedForeground }]}>
        {hasCheckedIn ? '只記錄感受，不評分，也不影響目標或金幣。紀錄保存在這台裝置。' : '完成今天第一個目標後，就可以記下感受。'}
      </Text>
      {error ? <Text style={[styles.error, { color: colors.destructive }]} accessibilityRole="alert">{error}</Text> : null}
      <View style={[styles.history, { borderTopColor: colors.border }]}>
        <Text style={[styles.historyTitle, { color: colors.mutedForeground }]}>最近 7 天</Text>
        <View style={styles.historyRow}>
          {recentDates.map((date) => {
            const entry = history.find((item) => item.date === date);
            const option = DAILY_MOOD_OPTIONS.find((item) => item.id === entry?.mood);
            return (
              <View key={date} style={styles.historyDay} testID={`mood-history-${date}`}>
                <View style={[styles.historyDot, { backgroundColor: option ? colors.candyPink : colors.secondary }]}>
                  {option ? <Feather name={option.icon} size={12} color={colors.primary} /> : null}
                </View>
                <Text style={[styles.historyDate, { color: colors.mutedForeground }]}>{shortDate(date)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

async function downloadPostcardPng(svg: string, date: string): Promise<void> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    throw new Error('目前無法在此裝置直接下載。');
  }
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const imageUrl = URL.createObjectURL(svgBlob);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('明信片圖片產生失敗。'));
      image.src = imageUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('瀏覽器不支援圖片下載。');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG 匯出失敗。')), 'image/png');
    });
    triggerDownload(png, `momentum-postcard-${date}.png`);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function DailyPostcardCard({ today }: { today: string }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const quote = getDailyMotivationalQuote(today);
  const { dog } = getDailyDogGreeting(today);
  const svg = buildDailyPostcardSvg(today, quote, dog.name);

  async function savePostcard() {
    setBusy(true);
    setError('');
    try {
      if (Platform.OS === 'web') {
        await downloadPostcardPng(svg, today);
      } else {
        await Share.share({
          title: 'Momentum 每日明信片',
          message: `${quote}\n\n${dog.name}今天陪你 · ${today}`,
        });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '明信片沒有準備成功，請再試一次。');
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
            {error ? <Text style={[styles.error, { color: colors.destructive }]} accessibilityRole="alert">{error}</Text> : null}
            <Pressable
              onPress={() => void savePostcard()}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ disabled: busy, busy }}
              accessibilityLabel={Platform.OS === 'web' ? '下載每日明信片 PNG' : '分享每日明信片內容'}
              testID="download-daily-postcard"
              style={[styles.downloadButton, { backgroundColor: colors.primary, opacity: busy ? 0.65 : 1 }]}
            >
              <Feather name={busy ? 'loader' : Platform.OS === 'web' ? 'download' : 'share'} size={17} color={colors.primaryForeground} />
              <Text style={[styles.downloadText, { color: colors.primaryForeground }]}>
                {busy ? '準備中…' : Platform.OS === 'web' ? '下載明信片 PNG' : '分享明信片內容'}
              </Text>
            </Pressable>
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
  openPostcardButton: { height: 44, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  openPostcardText: { fontSize: 13, fontWeight: '700' },
  downloadButton: { minHeight: 48, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 12 },
  downloadText: { fontSize: 14, fontWeight: '700' },
});
