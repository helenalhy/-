import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
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
import palette from '@/constants/colors';

export interface Habit {
  id: string;
  title: string;
  reason: string;
  icon: string;
  color: string;
  rewardCategory: RewardCategory;
  createdAt: string;
  checkIns: string[];
}

export type RewardCategory = 'facility' | 'shop' | 'decor';
export type RewardTokens = Record<RewardCategory, number>;
export type MallSlotId = `floor-${number}-${'left' | 'center' | 'right'}`;
export const MALL_FLOOR_COUNT = 10;
// Keep the original nine positions first so older purchases retain their locations.
export const MALL_SLOT_IDS: MallSlotId[] = [3, 2, 1, 4, 5, 6, 7, 8, 9, 10].flatMap(
  (floor) => (['left', 'center', 'right'] as const).map((column): MallSlotId => `floor-${floor}-${column}`),
);

export const REWARD_CATEGORY_LABELS: Record<RewardCategory, string> = {
  facility: '設施券',
  shop: '店鋪券',
  decor: '裝飾星',
};

interface HabitsContextValue {
  habits: Habit[];
  isLoading: boolean;
  storageError: string | null;
  today: string;
  coins: number;
  purchasedItems: string[];
  mallPlacements: Record<string, string>;
  rewardTokens: RewardTokens;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'checkIns'>) => Promise<void>;
  updateHabit: (id: string, updates: Pick<Habit, 'title' | 'reason' | 'icon' | 'color' | 'rewardCategory'>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCheckIn: (id: string) => Promise<number>;
  purchaseMallItem: (itemId: string, price: number, category: RewardCategory, ticketCost: number, slotId: MallSlotId) => Promise<void>;
  moveMallItem: (itemId: string, slotId: MallSlotId) => Promise<void>;
}

const STORAGE_KEY = 'momentum.habits.v1';
const MALL_STORAGE_KEY = 'momentum.mall.v1';
const CHECK_IN_REWARD = 20;
const EMPTY_TOKENS: RewardTokens = { facility: 0, shop: 0, decor: 0 };

function inferRewardCategory(icon: string): RewardCategory {
  if (icon === 'activity' || icon === 'target') return 'facility';
  if (icon === 'book-open' || icon === 'coffee') return 'shop';
  return 'decor';
}

function normalizeHabits(habits: Habit[]): Habit[] {
  return habits.map((habit) => {
    const rewardCategory = habit.rewardCategory ?? inferRewardCategory(habit.icon);
    const categoryColor = rewardCategory === 'facility'
      ? palette.light.candyMint
      : rewardCategory === 'shop'
        ? palette.light.candyLavender
        : palette.light.candyPink;
    return { ...habit, rewardCategory, color: categoryColor };
  });
}

function normalizeMallPlacements(
  savedPlacements: Record<string, string> | undefined,
  purchasedItems: string[],
): Record<string, string> {
  const placements: Record<string, string> = {};
  const assignedItems = new Set<string>();
  for (const [slotId, itemId] of Object.entries(savedPlacements ?? {})) {
    if (
      (MALL_SLOT_IDS as readonly string[]).includes(slotId)
      && purchasedItems.includes(itemId)
      && !assignedItems.has(itemId)
    ) {
      placements[slotId] = itemId;
      assignedItems.add(itemId);
    }
  }
  for (const itemId of purchasedItems) {
    if (assignedItems.has(itemId)) continue;
    const openSlot = MALL_SLOT_IDS.find((slotId) => !placements[slotId]);
    if (!openSlot) break;
    placements[openSlot] = itemId;
    assignedItems.add(itemId);
  }
  return placements;
}

const starterHabits: Habit[] = [
  { id: 'starter-walk', title: '散步 20 分鐘', reason: '讓身體和心情都透透氣', icon: 'activity', color: palette.light.candyMint, rewardCategory: 'facility', createdAt: '2026-01-01', checkIns: [] },
  { id: 'starter-read', title: '閱讀 10 頁', reason: '每天留一點時間給自己', icon: 'book-open', color: palette.light.candyLavender, rewardCategory: 'shop', createdAt: '2026-01-01', checkIns: [] },
  { id: 'starter-water', title: '寫下今天的一件好事', reason: '看見已經擁有的進步', icon: 'edit-3', color: palette.light.candyPink, rewardCategory: 'decor', createdAt: '2026-01-01', checkIns: [] },
];

export function getLocalDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function previousDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return getLocalDate(date);
}

function createId(): string {
  return `${Date.now().toString()}-${Math.random().toString(36).slice(2, 9)}`;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [coins, setCoins] = useState(50);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [mallPlacements, setMallPlacements] = useState<Record<string, string>>({});
  const [rewardTokens, setRewardTokens] = useState<RewardTokens>(EMPTY_TOKENS);
  const [rewardedCheckIns, setRewardedCheckIns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const actionLock = useRef(false);
  const today = getLocalDate();

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [saved, savedMall] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(MALL_STORAGE_KEY),
        ]);
        const initialHabits = saved === null ? starterHabits : normalizeHabits(JSON.parse(saved) as Habit[]);
        const initialMall = savedMall === null
          ? { coins: 50, purchasedItems: [], rewardedCheckIns: [], rewardTokens: EMPTY_TOKENS }
          : JSON.parse(savedMall) as { coins?: number; purchasedItems?: string[]; rewardedCheckIns?: string[]; rewardTokens?: Partial<RewardTokens>; placements?: Record<string, string> };
        const initialPurchasedItems = initialMall.purchasedItems ?? [];
        const initialPlacements = normalizeMallPlacements(initialMall.placements, initialPurchasedItems);
        await Promise.all([
          ...(saved === null ? [AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialHabits))] : []),
          ...(savedMall === null ? [AsyncStorage.setItem(MALL_STORAGE_KEY, JSON.stringify(initialMall))] : []),
        ]);
        if (active) {
          setHabits(initialHabits);
          setCoins(initialMall.coins ?? 50);
          setPurchasedItems(initialPurchasedItems);
          setMallPlacements(initialPlacements);
          setRewardedCheckIns(initialMall.rewardedCheckIns ?? []);
          setRewardTokens({ ...EMPTY_TOKENS, ...initialMall.rewardTokens });
        }
      } catch {
        if (active) setStorageError('目前無法讀取已儲存的紀錄，請重新開啟 App。');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const save = useCallback(async (next: Habit[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setHabits(next);
      setStorageError(null);
    } catch {
      setStorageError('儲存失敗，請檢查裝置空間後再試一次。');
      throw new Error('無法儲存打卡紀錄');
    }
  }, []);

  const saveMall = useCallback(async (next: { coins: number; purchasedItems: string[]; rewardedCheckIns: string[]; rewardTokens: RewardTokens; placements: Record<string, string> }) => {
    try {
      await AsyncStorage.setItem(MALL_STORAGE_KEY, JSON.stringify(next));
      setCoins(next.coins);
      setPurchasedItems(next.purchasedItems);
      setMallPlacements(next.placements);
      setRewardedCheckIns(next.rewardedCheckIns);
      setRewardTokens(next.rewardTokens);
      setStorageError(null);
    } catch {
      setStorageError('商場資料儲存失敗，請檢查裝置空間後再試一次。');
      throw new Error('無法儲存商場資料');
    }
  }, []);

  const addHabit = useCallback(async (habit: Omit<Habit, 'id' | 'createdAt' | 'checkIns'>) => {
    const next = [...habits, { ...habit, id: createId(), createdAt: today, checkIns: [] }];
    await save(next);
  }, [habits, save, today]);

  const updateHabit = useCallback(async (id: string, updates: Pick<Habit, 'title' | 'reason' | 'icon' | 'color' | 'rewardCategory'>) => {
    await save(habits.map((habit) => habit.id === id ? { ...habit, ...updates } : habit));
  }, [habits, save]);

  const deleteHabit = useCallback(async (id: string) => {
    await save(habits.filter((habit) => habit.id !== id));
  }, [habits, save]);

  const toggleCheckIn = useCallback(async (id: string) => {
    if (actionLock.current) return 0;
    actionLock.current = true;
    try {
      const habit = habits.find((item) => item.id === id);
      if (!habit) return 0;
      const alreadyDone = habit.checkIns.includes(today);
      const nextHabits = habits.map((item) => item.id !== id ? item : {
        ...item,
        checkIns: alreadyDone ? item.checkIns.filter((date) => date !== today) : [...item.checkIns, today],
      });
      let reward = 0;
      if (!alreadyDone) {
        const rewardKey = `${id}:${today}`;
        if (!rewardedCheckIns.includes(rewardKey)) reward = CHECK_IN_REWARD;
      }
      if (reward > 0) {
        const rewardKey = `${id}:${today}`;
        const category = habit.rewardCategory ?? inferRewardCategory(habit.icon);
        const nextRewardTokens = { ...rewardTokens, [category]: rewardTokens[category] + 1 };
        const nextMall = {
          coins: coins + reward,
          purchasedItems,
          placements: mallPlacements,
          rewardedCheckIns: [...rewardedCheckIns, rewardKey],
          rewardTokens: nextRewardTokens,
        };
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextHabits)),
          AsyncStorage.setItem(MALL_STORAGE_KEY, JSON.stringify(nextMall)),
        ]);
        setHabits(nextHabits);
        setCoins(nextMall.coins);
        setRewardedCheckIns(nextMall.rewardedCheckIns);
        setRewardTokens(nextMall.rewardTokens);
        setStorageError(null);
      } else {
        await save(nextHabits);
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return reward;
    } catch {
      setStorageError('打卡沒有儲存成功，請再試一次。');
      throw new Error('無法儲存打卡紀錄');
    } finally {
      actionLock.current = false;
    }
  }, [habits, today, rewardedCheckIns, coins, purchasedItems, mallPlacements, rewardTokens, save]);

  const purchaseMallItem = useCallback(async (itemId: string, price: number, category: RewardCategory, ticketCost: number, slotId: MallSlotId) => {
    if (actionLock.current) throw new Error('正在處理上一個操作');
    if (purchasedItems.includes(itemId)) throw new Error('這個項目已經建造完成');
    if (coins < price) throw new Error('金幣還不夠');
    if (rewardTokens[category] < ticketCost) throw new Error(`還需要 ${REWARD_CATEGORY_LABELS[category]}`);
    if (!(MALL_SLOT_IDS as readonly string[]).includes(slotId)) throw new Error('這個商場位置不存在');
    if (mallPlacements[slotId]) throw new Error('這個位置已經有設施');
    actionLock.current = true;
    try {
      await saveMall({
        coins: coins - price,
        purchasedItems: [...purchasedItems, itemId],
        placements: { ...mallPlacements, [slotId]: itemId },
        rewardedCheckIns,
        rewardTokens: { ...rewardTokens, [category]: rewardTokens[category] - ticketCost },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, mallPlacements, rewardedCheckIns, rewardTokens, saveMall]);

  const moveMallItem = useCallback(async (itemId: string, slotId: MallSlotId) => {
    if (actionLock.current) throw new Error('正在處理上一個操作');
    if (!purchasedItems.includes(itemId)) throw new Error('這個項目尚未建造');
    if (!(MALL_SLOT_IDS as readonly string[]).includes(slotId)) throw new Error('這個商場位置不存在');
    actionLock.current = true;
    try {
      const originalSlot = Object.entries(mallPlacements).find(([, placedItemId]) => placedItemId === itemId)?.[0];
      const targetItem = mallPlacements[slotId];
      if (!originalSlot && targetItem) throw new Error('目前不能交換這兩個項目');
      const placements = Object.fromEntries(
        Object.entries(mallPlacements).filter(([, placedItemId]) => placedItemId !== itemId),
      );
      placements[slotId] = itemId;
      if (originalSlot && targetItem && targetItem !== itemId) placements[originalSlot] = targetItem;
      await saveMall({ coins, purchasedItems, rewardedCheckIns, rewardTokens, placements });
      await Haptics.selectionAsync();
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, rewardedCheckIns, rewardTokens, mallPlacements, saveMall]);

  const value = useMemo(() => ({
    habits, isLoading, storageError, today, coins, purchasedItems, mallPlacements, rewardTokens, addHabit, updateHabit, deleteHabit, toggleCheckIn, purchaseMallItem, moveMallItem,
  }), [habits, isLoading, storageError, today, coins, purchasedItems, mallPlacements, rewardTokens, addHabit, updateHabit, deleteHabit, toggleCheckIn, purchaseMallItem, moveMallItem]);

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (!context) throw new Error('useHabits must be used inside HabitsProvider');
  return context;
}

export function getStreak(checkIns: string[], today: string): number {
  const dates = new Set(checkIns);
  let cursor = dates.has(today) ? today : previousDate(today);
  let count = 0;
  while (dates.has(cursor)) {
    count += 1;
    cursor = previousDate(cursor);
  }
  return count;
}
