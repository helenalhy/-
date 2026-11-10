import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DogAttendant, type DogAttendantKind } from '@/components/DogAttendant';
import { useColors } from '@/hooks/useColors';
import { getDailyDogGreeting } from '@/lib/daily-engagement';
import {
  createUrgeRecord,
  EMPTY_URGE_SUPPORT_DATA,
  getReplacementActions,
  readUrgeSupportData,
  saveUrgeSupportData,
  URGE_TRIGGERS,
  type UrgeSupportData,
} from '@/lib/urge-support';

const SUPPORT_DURATIONS = [2, 5, 10] as const;

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRecordDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function UrgeSupportCard({ today }: { today: string }) {
  const colors = useColors();
  const { dog } = getDailyDogGreeting(today);
  const [data, setData] = useState<UrgeSupportData>(EMPTY_URGE_SUPPORT_DATA);
  const [habitName, setHabitName] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [triggerNote, setTriggerNote] = useState('');
  const [triggerFormOpen, setTriggerFormOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [replacementOpen, setReplacementOpen] = useState(false);
  const [replacementIndex, setReplacementIndex] = useState(-1);
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [now, setNow] = useState(() => Date.now());
  const [isReady, setIsReady] = useState(false);
  const [readFailed, setReadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const finishingSession = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    void readUrgeSupportData()
      .then((saved) => {
        if (!active) return;
        setData(saved);
        setHabitName(saved.habitName);
        setIsReady(true);
      })
      .catch(() => {
        if (!active) return;
        setReadFailed(true);
        setError('暫時無法讀取本機記錄，現有內容不會被覆蓋。');
        setIsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!data.activeSession) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [data.activeSession]);

  const remainingSeconds = data.activeSession
    ? Math.max(0, Math.ceil((data.activeSession.endsAt - now) / 1000))
    : 0;

  useEffect(() => {
    const session = data.activeSession;
    if (!session || remainingSeconds > 0 || finishingSession.current === session.endsAt) return;
    finishingSession.current = session.endsAt;
    const next: UrgeSupportData = { ...data, activeSession: null };
    void saveUrgeSupportData(next)
      .then(() => {
        setData(next);
        setMessage('這幾分鐘完成了，謝謝你願意停下來照顧自己。');
      })
      .catch(() => setError('陪伴已結束，但計時狀態暫時無法保存。'));
  }, [data, remainingSeconds]);

  async function persist(next: UrgeSupportData, successMessage = ''): Promise<boolean> {
    setIsSaving(true);
    setError('');
    try {
      await saveUrgeSupportData(next);
      setData(next);
      setHabitName(next.habitName);
      setMessage(successMessage);
      return true;
    } catch {
      setError('儲存失敗，請稍後再試；記錄沒有同步到雲端。');
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function saveHabitName(): Promise<void> {
    const name = habitName.trim().slice(0, 80);
    if (!name) {
      setError('先填寫你想減少的習慣，或直接使用這個陪伴功能。');
      return;
    }
    await persist({ ...data, habitName: name }, '已在這部裝置保存你的設定。');
  }

  async function saveTriggerRecord(): Promise<void> {
    const record = createUrgeRecord(
      habitName || data.habitName,
      selectedTrigger ?? '想做時',
      triggerNote,
    );
    const next: UrgeSupportData = {
      ...data,
      habitName: habitName.trim().slice(0, 80) || data.habitName,
      records: [record, ...data.records].slice(0, 100),
    };
    if (await persist(next, '已記下這次情況，沒有評分或責備。')) {
      setTriggerFormOpen(false);
      setSelectedTrigger(null);
      setTriggerNote('');
    }
  }

  async function startCompanion(): Promise<void> {
    const startedAt = Date.now();
    const record = createUrgeRecord(
      habitName || data.habitName,
      selectedTrigger ?? '想做時',
      triggerNote,
      new Date(startedAt).toISOString(),
    );
    const session = {
      startedAt,
      endsAt: startedAt + durationMinutes * 60_000,
      durationMinutes,
    };
    const next: UrgeSupportData = {
      ...data,
      habitName: habitName.trim().slice(0, 80) || data.habitName,
      records: [record, ...data.records].slice(0, 100),
      activeSession: session,
    };
    finishingSession.current = null;
    setNow(startedAt);
    if (await persist(next, `${dog.name}會陪你 ${durationMinutes} 分鐘。這段時間不會自動打卡。`)) {
      setSelectedTrigger(null);
      setTriggerNote('');
      setTriggerFormOpen(false);
    }
  }

  async function finishCompanionEarly(): Promise<void> {
    finishingSession.current = data.activeSession?.endsAt ?? null;
    await persist({ ...data, activeSession: null }, '已結束陪伴，想回來時仍可重新開始。');
  }

  function cycleReplacement(): void {
    const actions = getReplacementActions(habitName || data.habitName);
    setReplacementIndex((current) => (current + 1) % actions.length);
    setReplacementOpen(true);
    setMessage('');
  }

  const replacements = getReplacementActions(habitName || data.habitName);
  const latestRecord = data.records[0];
  const session = data.activeSession;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="urge-support-card"
    >
      <View style={styles.heading}>
        <View style={[styles.headingIcon, { backgroundColor: colors.candyPink }]}>
          <Feather name="heart" size={17} color={colors.primary} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={[styles.title, { color: colors.foreground }]}>想做時，陪我一下</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            衝動來了，先停一停；不用責備自己。
          </Text>
        </View>
      </View>

      <Text style={[styles.label, { color: colors.foreground }]}>我想減少的習慣（可自行填寫）</Text>
      <View style={styles.habitRow}>
        <TextInput
          value={habitName}
          onChangeText={(value) => {
            setHabitName(value);
            setMessage('');
          }}
          onSubmitEditing={() => void saveHabitName()}
          placeholder="例如：睡前一直滑手機"
          placeholderTextColor={colors.mutedForeground}
          maxLength={80}
          returnKeyType="done"
          accessibilityLabel="填寫想減少的習慣"
          testID="urge-habit-name"
          style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
        />
        <Pressable
          onPress={() => void saveHabitName()}
          disabled={isSaving || !isReady || readFailed}
          accessibilityRole="button"
          accessibilityLabel="保存想減少的習慣"
          testID="save-urge-habit"
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: colors.secondary, opacity: pressed || isSaving ? 0.65 : 1 },
          ]}
        >
          <Text style={[styles.saveButtonText, { color: colors.primary }]}>保存</Text>
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={cycleReplacement}
          accessibilityRole="button"
          accessibilityLabel={replacementOpen ? '換一個替代小行動' : '推薦一個替代小行動'}
          testID="urge-replacement-action"
          style={({ pressed }) => [styles.actionButton, { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="shuffle" size={14} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>
            {replacementOpen ? '換個小行動' : '換個小行動'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setTriggerFormOpen((open) => !open);
            setMessage('');
          }}
          accessibilityRole="button"
          accessibilityLabel="記錄觸發情況"
          accessibilityState={{ expanded: triggerFormOpen }}
          testID="open-urge-trigger-form"
          style={({ pressed }) => [styles.actionButton, { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="edit-3" size={14} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>記錄觸發</Text>
        </Pressable>
      </View>

      {replacementOpen ? (
        <View style={[styles.replacementBox, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.replacementLabel, { color: colors.primary }]}>可以先試試</Text>
          <Text style={[styles.replacementText, { color: colors.foreground }]}>
            {replacements[Math.max(0, replacementIndex)]}
          </Text>
        </View>
      ) : null}

      {triggerFormOpen ? (
        <View style={[styles.triggerPanel, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.foreground }]}>剛才比較像哪種情況？</Text>
          <View style={styles.triggerList}>
            {URGE_TRIGGERS.map((trigger) => {
              const selected = selectedTrigger === trigger;
              return (
                <Pressable
                  key={trigger}
                  onPress={() => setSelectedTrigger(selected ? null : trigger)}
                  accessibilityRole="button"
                  accessibilityLabel={`觸發情況：${trigger}${selected ? '，已選擇' : ''}`}
                  accessibilityState={{ selected }}
                  testID={`urge-trigger-${trigger}`}
                  style={[
                    styles.triggerChip,
                    { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.candyPink : colors.card },
                  ]}
                >
                  <Text style={[styles.triggerText, { color: selected ? colors.primary : colors.foreground }]}>{trigger}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={triggerNote}
            onChangeText={setTriggerNote}
            placeholder="可選：補充當時的情境"
            placeholderTextColor={colors.mutedForeground}
            maxLength={300}
            accessibilityLabel="補充觸發情況"
            testID="urge-trigger-note"
            style={[styles.noteInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
          />
          <Pressable
            onPress={() => void saveTriggerRecord()}
            disabled={isSaving || !isReady || readFailed}
            accessibilityRole="button"
            testID="save-urge-trigger"
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: pressed || isSaving ? 0.7 : 1 }]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>保存這次記錄</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={[styles.label, { color: colors.foreground }]}>陪伴倒數</Text>
      {session ? (
        <View style={[styles.sessionPanel, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View style={styles.dogPreview}>
            <DogAttendant kind={dog.kind as DogAttendantKind} happy />
          </View>
          <View style={styles.sessionCopy}>
            <Text style={[styles.sessionTitle, { color: colors.foreground }]}>{dog.name}在這裡陪你</Text>
            <Text style={[styles.countdown, { color: colors.primary }]}>{formatCountdown(remainingSeconds)}</Text>
          </View>
          <Pressable
            onPress={() => void finishCompanionEarly()}
            accessibilityRole="button"
            accessibilityLabel="提早結束陪伴倒數"
            testID="finish-urge-companion"
            style={({ pressed }) => [styles.stopButton, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="check" size={16} color={colors.primary} />
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.durationRow}>
            {SUPPORT_DURATIONS.map((minutes) => {
              const selected = durationMinutes === minutes;
              return (
                <Pressable
                  key={minutes}
                  onPress={() => setDurationMinutes(minutes)}
                  accessibilityRole="button"
                  accessibilityLabel={`${minutes} 分鐘陪伴${selected ? '，已選擇' : ''}`}
                  accessibilityState={{ selected }}
                  testID={`urge-duration-${minutes}`}
                  style={[
                    styles.durationChip,
                    { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.candyPink : colors.background },
                  ]}
                >
                  <Text style={[styles.durationText, { color: selected ? colors.primary : colors.foreground }]}>{minutes} 分鐘</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={() => void startCompanion()}
            disabled={isSaving || !isReady || readFailed}
            accessibilityRole="button"
            accessibilityLabel={`讓${dog.name}陪伴 ${durationMinutes} 分鐘`}
            testID="start-urge-companion"
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: pressed || isSaving ? 0.7 : 1 }]}
          >
            <Feather name="heart" size={15} color={colors.primaryForeground} />
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>想做時，陪我一下</Text>
          </Pressable>
        </>
      )}

      {data.records.length > 0 ? (
        <>
          <Pressable
            onPress={() => setHistoryOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel={`${historyOpen ? '收起' : '查看'}觸發記錄，共 ${data.records.length} 次`}
            accessibilityState={{ expanded: historyOpen }}
            testID="toggle-urge-record-history"
            style={styles.historyToggle}
          >
            <Text style={[styles.history, { color: colors.mutedForeground }]} testID="urge-record-summary">
              已記錄 {data.records.length} 次 · 最近：{data.records[0].trigger} {formatTime(data.records[0].occurredAt)}
            </Text>
            <Feather name={historyOpen ? 'chevron-up' : 'chevron-down'} size={14} color={colors.mutedForeground} />
          </Pressable>
          {historyOpen ? (
            <View style={[styles.recordList, { borderColor: colors.border, backgroundColor: colors.background }]} testID="urge-record-history">
              {data.records.slice(0, 5).map((record) => (
                <View key={record.id} style={[styles.recordItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.recordHeading}>
                    <Text style={[styles.recordTrigger, { color: colors.foreground }]}>{record.trigger}</Text>
                    <Text style={[styles.recordTime, { color: colors.mutedForeground }]}>
                      {formatRecordDate(record.occurredAt)} {formatTime(record.occurredAt)}
                    </Text>
                  </View>
                  <Text style={[styles.recordHabit, { color: colors.mutedForeground }]}>{record.habitName}</Text>
                  {record.note ? (
                    <Text style={[styles.recordNote, { color: colors.foreground }]}>{record.note}</Text>
                  ) : null}
                </View>
              ))}
              {data.records.length > 5 ? (
                <Text style={[styles.history, { color: colors.mutedForeground }]}>先顯示最近 5 次；其餘記錄仍保存在本機。</Text>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
      <Text style={[styles.privacy, { color: colors.mutedForeground }]}>
        記錄只保存在這部裝置，不同步雲端；陪伴倒數不會自動打卡或扣金幣。
      </Text>
      {message ? (
        <Text style={[styles.feedback, { color: colors.primary }]} accessibilityRole="text" accessibilityLiveRegion="polite" testID="urge-support-feedback">
          {message}
        </Text>
      ) : null}
      {error ? (
        <Text style={[styles.feedback, { color: colors.candyRoseDark }]} accessibilityRole="text" accessibilityLiveRegion="polite" testID="urge-support-error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 14, marginBottom: 12, gap: 10 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headingIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1 },
  title: { fontSize: 15, lineHeight: 21, fontWeight: '800' },
  subtitle: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  label: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, minWidth: 0, minHeight: 42, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8, fontSize: 13 },
  saveButton: { minHeight: 42, minWidth: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  saveButtonText: { fontSize: 12, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 12, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  actionText: { fontSize: 12, fontWeight: '700' },
  replacementBox: { borderRadius: 13, padding: 11, gap: 4 },
  replacementLabel: { fontSize: 11, fontWeight: '800' },
  replacementText: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  triggerPanel: { borderWidth: 1, borderRadius: 14, padding: 10, gap: 9 },
  triggerList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  triggerChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  triggerText: { fontSize: 11, fontWeight: '700' },
  noteInput: { minHeight: 42, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12 },
  durationRow: { flexDirection: 'row', gap: 8 },
  durationChip: { flex: 1, minHeight: 36, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  durationText: { fontSize: 12, fontWeight: '700' },
  primaryButton: { minHeight: 44, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontSize: 13, fontWeight: '800' },
  sessionPanel: { borderWidth: 1, borderRadius: 14, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dogPreview: { width: 54, height: 48, alignItems: 'center', justifyContent: 'center' },
  sessionCopy: { flex: 1 },
  sessionTitle: { fontSize: 12, fontWeight: '700' },
  countdown: { fontSize: 23, lineHeight: 29, fontWeight: '900', fontVariant: ['tabular-nums'], marginTop: 1 },
  stopButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  history: { fontSize: 11, lineHeight: 16 },
  historyToggle: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  recordList: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10 },
  recordItem: { paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  recordHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  recordTrigger: { fontSize: 12, fontWeight: '800' },
  recordTime: { fontSize: 10 },
  recordHabit: { fontSize: 10, marginTop: 3 },
  recordNote: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  privacy: { fontSize: 10, lineHeight: 15 },
  feedback: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
});
