import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@clerk/expo';
import {
  getGetProgressQueryKey,
  useGetProgress,
  useSaveProgress,
} from '@workspace/api-client-react';
import type { ProgressSnapshot as ApiProgressSnapshot } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useHabits, type ProgressSnapshot } from '@/context/HabitsContext';

interface CloudSyncControls {
  retry: () => Promise<void>;
}

const CloudSyncContext = createContext<CloudSyncControls>({ retry: async () => {} });

const starterHabits = [
  { id: 'starter-walk', title: '散步 20 分鐘', reason: '讓身體和心情都透透氣', icon: 'activity' },
  { id: 'starter-read', title: '閱讀 10 頁', reason: '每天留一點時間給自己', icon: 'book-open' },
  { id: 'starter-water', title: '寫下今天的一件好事', reason: '看見已經擁有的進步', icon: 'edit-3' },
];

function hasMeaningfulLocalProgress(snapshot: ProgressSnapshot) {
  const unchangedStarterList = snapshot.habits.length === starterHabits.length
    && snapshot.habits.every((habit) => {
      const starter = starterHabits.find((item) => item.id === habit.id);
      return Boolean(
        starter
        && habit.title === starter.title
        && habit.reason === starter.reason
        && habit.icon === starter.icon
        && habit.checkIns.length === 0
        && (habit.steps?.length ?? 0) === 0
        && (habit.restDays?.length ?? 0) === 0
        && Object.keys(habit.stepCheckIns ?? {}).length === 0
        && (habit.makeupCheckIns?.length ?? 0) === 0
        && habit.weeklyChallengeTarget === undefined
        && habit.minimumAction === undefined,
      );
    });
  const mall = snapshot.mall;
  return !unchangedStarterList
    || mall.coins > 0
    || mall.purchasedItems.length > 0
    || mall.rewardedCheckIns.length > 0
    || (mall.leaveCards ?? 0) > 0
    || ((mall.protectedStreakDates as string[] | undefined)?.length ?? 0) > 0
    || ((mall.weeklyChallengeRewardedWeeks as string[] | undefined)?.length ?? 0) > 0
    || Object.keys(mall.placements).length > 0
    || Object.keys(mall.shopInteriors).length > 0
    || Object.values(mall.rewardTokens).some((count) => count > 0);
}

export function useCloudSyncControls() {
  return useContext(CloudSyncContext);
}

export function ProgressSyncBridge({ children }: { children: ReactNode }) {
  const colors = useColors();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const {
    isLoading,
    mallLoadError,
    progressSnapshot,
    replaceProgressFromCloud,
    setCloudSyncState,
    cloudSyncStatus,
  } = useHabits();
  const [readyUserId, setReadyUserId] = useState<string | null>(null);
  const [pendingConflict, setPendingConflict] = useState<{
    userId: string;
    snapshot: unknown;
  } | null>(null);
  const [conflictBusy, setConflictBusy] = useState(false);
  const identityRef = useRef<string | null>(null);
  const reconcilePendingRef = useRef(false);
  const lastSyncedSnapshotRef = useRef<string | null>(null);
  const currentUserRef = useRef<string | null>(null);
  const currentSnapshotRef = useRef(progressSnapshot);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  currentUserRef.current = isSignedIn ? userId ?? null : null;
  currentSnapshotRef.current = progressSnapshot;

  const progressQuery = useGetProgress({
    query: {
      queryKey: [...getGetProgressQueryKey(), userId ?? 'signed-out'],
      enabled: isLoaded && Boolean(isSignedIn && userId),
      staleTime: 0,
      refetchOnMount: 'always',
      retry: 0,
    },
  });
  const saveProgress = useSaveProgress();

  useEffect(() => {
    const identity = isSignedIn && userId ? userId : null;
    if (identityRef.current === identity) return;
    identityRef.current = identity;
    setReadyUserId(null);
    setPendingConflict(null);
    reconcilePendingRef.current = false;
    lastSyncedSnapshotRef.current = null;
    if (!identity) setCloudSyncState('local');
  }, [isSignedIn, userId, setCloudSyncState]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      setCloudSyncState('local');
      return;
    }
    if (mallLoadError) {
      setCloudSyncState('error', '無法讀取本機商場資料；為避免覆蓋進度，雲端同步已暫停。');
      return;
    }
    if (isLoading || progressQuery.isPending || progressQuery.isFetching) {
      setCloudSyncState('syncing');
      return;
    }
    if (progressQuery.isError) {
      reconcilePendingRef.current = true;
      setReadyUserId(userId);
      setCloudSyncState('error', '暫時無法連接雲端；進度仍保存在這台裝置。');
      return;
    }
    if (!progressQuery.data || readyUserId === userId || pendingConflict?.userId === userId) return;

    let active = true;
    const reconcile = async () => {
      setCloudSyncState('syncing');
      reconcilePendingRef.current = true;
      try {
        if (progressQuery.data.exists) {
          const localSnapshotKey = JSON.stringify(progressSnapshot);
          const cloudSnapshotKey = JSON.stringify(progressQuery.data.snapshot);
          if (
            hasMeaningfulLocalProgress(progressSnapshot)
            && localSnapshotKey !== cloudSnapshotKey
          ) {
            setPendingConflict({ userId, snapshot: progressQuery.data.snapshot });
            return;
          }
          await replaceProgressFromCloud(progressQuery.data.snapshot);
        } else {
          const initialSnapshot = progressSnapshot as unknown as ApiProgressSnapshot;
          await saveProgress.mutateAsync({ data: initialSnapshot });
          lastSyncedSnapshotRef.current = JSON.stringify(progressSnapshot);
        }
        if (active) {
          reconcilePendingRef.current = false;
          setReadyUserId(userId);
          setCloudSyncState('synced');
        }
      } catch {
        if (active) {
          setReadyUserId(userId);
          setCloudSyncState('error', '同步沒有完成；本機進度仍保留，請稍後重試。');
        }
      }
    };

    void reconcile();
    return () => {
      active = false;
    };
  }, [
    isLoaded,
    isSignedIn,
    userId,
    isLoading,
    mallLoadError,
    progressQuery.isPending,
    progressQuery.isFetching,
    progressQuery.isError,
    progressQuery.data,
    readyUserId,
    pendingConflict,
    progressSnapshot,
    replaceProgressFromCloud,
    saveProgress.mutateAsync,
    setCloudSyncState,
  ]);

  const snapshotKey = JSON.stringify(progressSnapshot);
  useEffect(() => {
    if (
      !isLoaded
      || !isSignedIn
      || !userId
      || isLoading
      || mallLoadError
      || readyUserId !== userId
      || cloudSyncStatus === 'error'
      || snapshotKey === lastSyncedSnapshotRef.current
    ) {
      return;
    }

    setCloudSyncState('syncing');
    const timeout = setTimeout(() => {
      const queuedSnapshot = progressSnapshot as unknown as ApiProgressSnapshot;
      const work = saveQueueRef.current.catch(() => {}).then(async () => {
        if (currentUserRef.current !== userId) return;
        await saveProgress.mutateAsync({ data: queuedSnapshot });
      });
      saveQueueRef.current = work;
      void work.then(() => {
        if (currentUserRef.current !== userId) return;
        lastSyncedSnapshotRef.current = snapshotKey;
        setCloudSyncState('synced');
      }).catch(() => {
        if (currentUserRef.current !== userId) return;
        setCloudSyncState('error', '雲端儲存暫時失敗；本機進度仍保留，請稍後重試。');
      });
    }, 650);

    return () => clearTimeout(timeout);
  }, [
    isLoaded,
    isSignedIn,
    userId,
    isLoading,
    mallLoadError,
    readyUserId,
    cloudSyncStatus,
    snapshotKey,
    progressSnapshot,
    saveProgress.mutateAsync,
    setCloudSyncState,
  ]);

  const retry = useCallback(async () => {
    if (!isSignedIn || !userId) return;
    if (mallLoadError) {
      setCloudSyncState('error', '無法讀取本機商場資料；請先修復資料並重新開啟 App。');
      return;
    }
    setCloudSyncState('syncing');
    try {
      if (readyUserId === userId && progressQuery.data && !reconcilePendingRef.current) {
        await saveProgress.mutateAsync({
          data: currentSnapshotRef.current as unknown as ApiProgressSnapshot,
        });
        lastSyncedSnapshotRef.current = JSON.stringify(currentSnapshotRef.current);
        setCloudSyncState('synced');
        return;
      }
      setReadyUserId(null);
      const result = await progressQuery.refetch();
      if (result.isError) {
        setCloudSyncState('error', '暫時無法連接雲端；進度仍保存在這台裝置。');
      }
    } catch {
      setCloudSyncState('error', '同步沒有完成；本機進度仍保留，請稍後重試。');
    }
  }, [
    isSignedIn,
    userId,
    mallLoadError,
    readyUserId,
    progressQuery.data,
    progressQuery.refetch,
    saveProgress.mutateAsync,
    setCloudSyncState,
  ]);

  const resolveConflict = useCallback(async (useCloud: boolean) => {
    if (!pendingConflict || pendingConflict.userId !== userId || !userId) return;
    setConflictBusy(true);
    setCloudSyncState('syncing');
    try {
      if (useCloud) {
        await replaceProgressFromCloud(pendingConflict.snapshot);
      } else {
        const snapshot = currentSnapshotRef.current as unknown as ApiProgressSnapshot;
        await saveProgress.mutateAsync({ data: snapshot });
        lastSyncedSnapshotRef.current = JSON.stringify(currentSnapshotRef.current);
      }
      reconcilePendingRef.current = false;
      setPendingConflict(null);
      setReadyUserId(userId);
      setCloudSyncState('synced');
    } catch {
      setCloudSyncState('error', '選擇的進度沒有同步成功，兩份資料都仍保留；請再試一次。');
    } finally {
      setConflictBusy(false);
    }
  }, [
    pendingConflict,
    userId,
    replaceProgressFromCloud,
    saveProgress.mutateAsync,
    setCloudSyncState,
  ]);

  const controls = useMemo(() => ({ retry }), [retry]);
  const waitingForCloud = Boolean(
    isLoaded
    && isSignedIn
    && userId
    && !isLoading
    && readyUserId !== userId
    && !progressQuery.isError,
  );

  return (
    <CloudSyncContext.Provider value={controls}>
      {pendingConflict?.userId === userId ? (
        <View style={[styles.loading, { backgroundColor: colors.background }]}>
          <View style={[styles.conflictIcon, { backgroundColor: colors.candyPink }]}>
            <Text style={styles.conflictEmoji}>☁️</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>同步前先選擇進度</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            這台裝置已有訪客進度，而 Google 帳戶也有保存資料。選擇要保留哪一份，避免不小心覆蓋。
          </Text>
          {cloudSyncStatus === 'error' ? (
            <Text style={styles.error}>{'兩份資料都仍保留，請重新選擇。'}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={conflictBusy}
            onPress={() => void resolveConflict(true)}
            style={({ pressed }) => [
              styles.conflictPrimary,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
              conflictBusy && styles.disabled,
            ]}
          >
            {conflictBusy ? <ActivityIndicator color="#FFFFFF" /> : (
              <Text style={styles.conflictPrimaryText}>載入 Google 帳戶進度</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={conflictBusy}
            onPress={() => void resolveConflict(false)}
            style={({ pressed }) => [
              styles.conflictSecondary,
              { backgroundColor: colors.secondary },
              pressed && styles.pressed,
              conflictBusy && styles.disabled,
            ]}
          >
            <Text style={[styles.conflictSecondaryText, { color: colors.primary }]}>
              保留本機進度並更新帳戶
            </Text>
          </Pressable>
          <Text style={[styles.conflictNote, { color: colors.mutedForeground }]}>
            選擇本機進度會取代帳戶內目前保存的進度。
          </Text>
        </View>
      ) : waitingForCloud ? (
        <View style={[styles.loading, { backgroundColor: colors.background }]}>
          <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
            <ActivityIndicator color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>正在保存你的進度</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            正在安全地連結目標、金幣和商場收藏。
          </Text>
        </View>
      ) : children}
    </CloudSyncContext.Provider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conflictIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  conflictEmoji: { fontSize: 26 },
  title: { fontSize: 19, fontWeight: '700', marginTop: 18 },
  subtitle: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  conflictPrimary: { width: '100%', minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 23, paddingHorizontal: 16 },
  conflictPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  conflictSecondary: { width: '100%', minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 9, paddingHorizontal: 16 },
  conflictSecondaryText: { fontSize: 13, fontWeight: '700' },
  conflictNote: { fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 9 },
  error: { color: '#B74760', fontSize: 12, marginTop: 12 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.58 },
});
