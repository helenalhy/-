import { Feather } from '@expo/vector-icons';
import {
  deleteReminderSubscription,
  getReminderConfig,
  saveReminderSubscription,
  updateReminderCheckInStatus,
} from '@workspace/api-client-react';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useHabits } from '@/context/HabitsContext';
import {
  DEFAULT_REMINDER_SETTINGS,
  readReminderSettings,
  saveReminderSettings,
  type ReminderSettings,
} from '@/lib/reminder-settings';

function decodeApplicationServerKey(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = window.atob(padded);
  const decoded = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const stableBuffer = new ArrayBuffer(decoded.length);
  new Uint8Array(stableBuffer).set(decoded);
  return stableBuffer;
}

function toBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) throw new Error('瀏覽器沒有建立推播金鑰。');
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function getSubscriptionPayload(subscription: PushSubscription) {
  return {
    endpoint: subscription.endpoint,
    p256dh: toBase64Url(subscription.getKey('p256dh')),
    auth: toBase64Url(subscription.getKey('auth')),
  };
}

function getBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Hong_Kong';
}

function getLocalDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getWebPushSupport(): boolean {
  return Platform.OS === 'web'
    && typeof window !== 'undefined'
    && window.isSecureContext
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

export default function ReminderSettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { habits, today } = useHabits();
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    getWebPushSupport() ? Notification.permission : 'unsupported',
  );
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const timeZone = getBrowserTimeZone();

  useEffect(() => {
    let active = true;
    const load = async () => {
      const saved = await readReminderSettings();
      let subscription: PushSubscription | null = null;
      if (getWebPushSupport()) {
        const registration = await navigator.serviceWorker.getRegistration('/');
        subscription = await registration?.pushManager.getSubscription() ?? null;
      }
      if (!active) return;

      const enabled = Boolean(subscription);
      const next = {
        ...saved,
        enabled,
        endpoint: subscription?.endpoint ?? null,
      };
      setSettings(next);
      if (next.enabled !== saved.enabled || next.endpoint !== saved.endpoint) {
        await saveReminderSettings(next);
      }
    };
    void load().catch(() => {
      if (active) setError('無法讀取通知設定，請重新整理後再試。');
    });
    return () => { active = false; };
  }, []);

  function adjustTime(changeMinutes: number) {
    const [hours, minutes] = settings.reminderTime.split(':').map(Number);
    const total = (hours * 60 + minutes + changeMinutes + 1440) % 1440;
    const reminderTime = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    setSettings((current) => ({ ...current, reminderTime }));
    setMessage('');
    setError('');
  }

  async function enableNotifications() {
    if (!getWebPushSupport()) {
      setError('這個瀏覽器目前不支援關閉網頁後的推播提醒。請改用支援推播的手機瀏覽器。');
      return;
    }

    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      const granted = await Notification.requestPermission();
      setPermission(granted);
      if (granted !== 'granted') {
        setError(granted === 'denied'
          ? '通知權限已關閉，請到瀏覽器網站設定允許 Momentum 傳送通知。'
          : '你尚未允許通知；允許後才能收到每日提醒。');
        return;
      }

      const config = await getReminderConfig();
      const registration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeApplicationServerKey(config.publicKey),
        });
      }

      const payload = getSubscriptionPayload(subscription);
      await saveReminderSubscription({
        ...payload,
        reminderTime: settings.reminderTime,
        timeZone,
      });
      const next = { enabled: true, reminderTime: settings.reminderTime, endpoint: payload.endpoint };
      await saveReminderSettings(next);
      setSettings(next);
      await updateReminderCheckInStatus({
        endpoint: payload.endpoint,
        hasCheckedInToday: habits.some((habit) => habit.checkIns.includes(today)),
      });
      setMessage(`已開啟每日 ${settings.reminderTime} 提醒。今天已打卡的話，系統會自動略過。`);
    } catch {
      setError('通知設定沒有完成，請確認網路與瀏覽器權限後重試。');
    } finally {
      setIsBusy(false);
    }
  }

  async function saveTime() {
    if (!getWebPushSupport()) {
      setError('此提醒功能只支援安全連線上的手機網頁版。');
      return;
    }
    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) {
        await saveReminderSettings({ ...settings, enabled: false, endpoint: null });
        setSettings((current) => ({ ...current, enabled: false, endpoint: null }));
        setMessage(`提醒時間已設為 ${settings.reminderTime}；開啟通知後便會套用。`);
        return;
      }

      const payload = getSubscriptionPayload(subscription);
      await saveReminderSubscription({
        ...payload,
        reminderTime: settings.reminderTime,
        timeZone,
      });
      const next = { ...settings, enabled: true, endpoint: payload.endpoint };
      await saveReminderSettings(next);
      setSettings(next);
      setMessage(`每日提醒時間已更新為 ${settings.reminderTime}。`);
    } catch {
      setError('儲存提醒時間失敗，請檢查網路後重試。');
    } finally {
      setIsBusy(false);
    }
  }

  async function disableNotifications() {
    if (!getWebPushSupport()) return;
    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        try {
          await deleteReminderSubscription({ endpoint: subscription.endpoint });
        } finally {
          await subscription.unsubscribe();
        }
      }
      const next = { ...settings, enabled: false, endpoint: null };
      await saveReminderSettings(next);
      setSettings(next);
      setMessage('每日通知提醒已關閉。');
    } catch {
      setError('關閉通知沒有完成，請確認網路連線後再試。');
    } finally {
      setIsBusy(false);
    }
  }

  const isIOS = Platform.OS === 'web'
    && typeof navigator !== 'undefined'
    && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isStandalone = Platform.OS === 'web'
    && typeof window !== 'undefined'
    && (window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const todayKey = getLocalDate(new Date(), timeZone);
  const checkedInToday = todayKey === today && habits.some((habit) => habit.checkIns.includes(today));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="返回上一頁"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={21} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.heading, { color: colors.foreground }]}>打卡提醒</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.hero, { backgroundColor: colors.secondary }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.candyPink }]}>
            <Feather name="bell" size={23} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>每天留一點時間給自己</Text>
          <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>
            到了提醒時間，Momentum 會通知你回來完成今天的小目標。
          </Text>
          <Text style={[styles.zoneLabel, { color: colors.mutedForeground }]}>
            使用時區：{timeZone}
          </Text>
        </View>

        <View style={[styles.timeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.foreground }]}>每日提醒時間</Text>
          <View style={styles.timeControls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="提醒時間提前一小時"
              onPress={() => adjustTime(-60)}
              style={[styles.stepButton, { backgroundColor: colors.secondary }]}
            >
              <Feather name="chevron-left" size={22} color={colors.primary} />
              <Text style={[styles.stepLabel, { color: colors.primary }]}>1 小時</Text>
            </Pressable>
            <Text style={[styles.timeValue, { color: colors.foreground }]} accessibilityLabel={`提醒時間 ${settings.reminderTime}`}>
              {settings.reminderTime}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="提醒時間延後一小時"
              onPress={() => adjustTime(60)}
              style={[styles.stepButton, { backgroundColor: colors.secondary }]}
            >
              <Feather name="chevron-right" size={22} color={colors.primary} />
              <Text style={[styles.stepLabel, { color: colors.primary }]}>1 小時</Text>
            </Pressable>
          </View>
          <View style={styles.minuteRow}>
            <Pressable onPress={() => adjustTime(-15)} accessibilityRole="button" style={styles.minuteButton}>
              <Text style={[styles.minuteText, { color: colors.primary }]}>− 15 分鐘</Text>
            </Pressable>
            <Text style={[styles.timeHint, { color: colors.mutedForeground }]}>依照本機時間</Text>
            <Pressable onPress={() => adjustTime(15)} accessibilityRole="button" style={styles.minuteButton}>
              <Text style={[styles.minuteText, { color: colors.primary }]}>＋ 15 分鐘</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => void saveTime()}
            disabled={isBusy}
            style={[styles.secondaryButton, { backgroundColor: colors.secondary, opacity: isBusy ? 0.65 : 1 }]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>儲存提醒時間</Text>
          </Pressable>
        </View>

        {Platform.OS === 'web' ? (
          <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: settings.enabled ? colors.candyMint : colors.border }]} />
              <View style={styles.statusCopy}>
                <Text style={[styles.statusTitle, { color: colors.foreground }]}>
                  {settings.enabled ? `已開啟 · 每天 ${settings.reminderTime}` : '尚未開啟通知'}
                </Text>
                <Text style={[styles.statusBody, { color: colors.mutedForeground }]}>
                  {checkedInToday ? '今天已完成打卡，今天的提醒會自動略過。' : '每天只提醒一次；完成今日打卡後會自動略過。'}
                </Text>
              </View>
            </View>
            {settings.enabled ? (
              <Pressable
                accessibilityRole="button"
                disabled={isBusy}
                onPress={() => void disableNotifications()}
                style={[styles.secondaryButton, { backgroundColor: colors.candyPink, opacity: isBusy ? 0.65 : 1 }]}
              >
                {isBusy ? <ActivityIndicator color={colors.primary} /> : <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>關閉每日提醒</Text>}
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={isBusy || permission === 'denied'}
                onPress={() => void enableNotifications()}
                style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: isBusy || permission === 'denied' ? 0.65 : 1 }]}
              >
                {isBusy
                  ? <ActivityIndicator color={colors.primaryForeground} />
                  : <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>允許並開啟通知</Text>}
              </Pressable>
            )}
            {permission === 'denied' ? (
              <Text style={[styles.permissionHelp, { color: colors.mutedForeground }]}>
                通知權限目前已被瀏覽器封鎖。請到網址旁的網站設定，允許通知後再回來開啟。
              </Text>
            ) : null}
          </View>
        ) : null}

        {isIOS && !isStandalone ? (
          <View style={[styles.infoCard, { backgroundColor: colors.candyLemon }]}>
            <Feather name="info" size={17} color={colors.candyCaramelDark} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              iPhone／iPad 請先用 Safari 選「加入主畫面」，再從主畫面開啟 App 並允許通知。
            </Text>
          </View>
        ) : null}

        {permission === 'unsupported' ? (
          <View style={[styles.infoCard, { backgroundColor: colors.candyLemon }]}>
            <Feather name="alert-circle" size={17} color={colors.candyCaramelDark} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              目前的瀏覽器或連線不支援背景推播。請使用 HTTPS 的手機瀏覽器；iPhone／iPad 需先加入主畫面。
            </Text>
          </View>
        ) : null}

        {message ? <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.primary }]}>{message}</Text> : null}
        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

        <Text style={[styles.privacyNote, { color: colors.mutedForeground }]}>
          提醒時間會安全地同步保存；清除網站資料後，可能需要重新允許通知。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, justifyContent: 'center' },
  heading: { fontSize: 20, fontWeight: '700', flex: 1 },
  headerSpacer: { width: 42 },
  hero: { borderRadius: 22, padding: 19, alignItems: 'center' },
  heroIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  heroTitle: { fontSize: 18, fontWeight: '700' },
  heroBody: { marginTop: 7, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  zoneLabel: { marginTop: 10, fontSize: 11 },
  timeCard: { borderWidth: 1, borderRadius: 21, padding: 17 },
  cardLabel: { fontSize: 14, fontWeight: '700' },
  timeControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 17 },
  stepButton: { alignItems: 'center', justifyContent: 'center', minWidth: 69, minHeight: 58, borderRadius: 16, padding: 4 },
  stepLabel: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  timeValue: { fontSize: 42, fontWeight: '700', fontVariant: ['tabular-nums'] },
  minuteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 },
  minuteButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 3 },
  minuteText: { fontSize: 12, fontWeight: '700' },
  timeHint: { fontSize: 11 },
  secondaryButton: { minHeight: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 13, paddingHorizontal: 16 },
  secondaryButtonText: { fontSize: 13, fontWeight: '700' },
  statusCard: { borderWidth: 1, borderRadius: 21, padding: 17 },
  statusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  statusDot: { width: 11, height: 11, borderRadius: 6, marginTop: 4 },
  statusCopy: { flex: 1 },
  statusTitle: { fontSize: 14, fontWeight: '700' },
  statusBody: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  primaryButton: { minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingHorizontal: 18 },
  primaryButtonText: { fontSize: 13, fontWeight: '700' },
  permissionHelp: { fontSize: 11, lineHeight: 17, marginTop: 10 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, borderRadius: 15 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 19 },
  message: { fontSize: 12, lineHeight: 18 },
  error: { fontSize: 12, lineHeight: 18 },
  privacyNote: { fontSize: 11, lineHeight: 17, textAlign: 'center', paddingHorizontal: 8 },
});
