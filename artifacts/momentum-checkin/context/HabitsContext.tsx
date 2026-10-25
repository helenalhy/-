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
  rewardTokens: RewardTokens;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'checkIns'>) => Promise<void>;
  updateHabit: (id: string, updates: Pick<Habit, 'title' | 'reason' | 'icon' | 'color' | 'rewardCategory'>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCheckIn: (id: string) => Promise<number>;
  purchaseMallItem: (itemId: string, price: number, category: RewardCategory, ticketCost: number) => Promise<void>;
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
  return habits.map((habit) => ({
    ...habit,
    rewardCategory: habit.rewardCategory ?? inferRewardCategory(habit.icon),
  }));
}

const starterHabits: Habit[] = [
  { id: 'starter-walk', title: '散步 20 分鐘', reason: '讓身體和心情都透透氣', icon: 'activity', color: '#DCEAD8', rewardCategory: 'facility', createdAt: '2026-01-01', checkIns: [] },
  { id: 'starter-read', title: '閱讀 10 頁', reason: '每天留一點時間給自己', icon: 'book-open', color: '#F5E7C9', rewardCategory: 'shop', createdAt: '2026-01-01', checkIns: [] },
  { id: 'starter-water', title: '寫下今天的一件好事', reason: '看見已經擁有的進步', icon: 'edit-3', color: '#F2DFD6', rewardCategory: 'decor', createdAt: '2026-01-01', checkIns: [] },
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
          : JSON.parse(savedMall) as { coins?: number; purchasedItems?: string[]; rewardedCheckIns?: string[]; rewardTokens?: Partial<RewardTokens> };
        await Promise.all([
          ...(saved === null ? [AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialHabits))] : []),
          ...(savedMall === null ? [AsyncStorage.setItem(MALL_STORAGE_KEY, JSON.stringify(initialMall))] : []),
        ]);
        if (active) {
          setHabits(initialHabits);
          setCoins(initialMall.coins ?? 50);
          setPurchasedItems(initialMall.purchasedItems ?? []);
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

  const saveMall = useCallback(async (next: { coins: number; purchasedItems: string[]; rewardedCheckIns: string[]; rewardTokens: RewardTokens }) => {
    try {
      await AsyncStorage.setItem(MALL_STORAGE_KEY, JSON.stringify(next));
      setCoins(next.coins);
      setPurchasedItems(next.purchasedItems);
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
  }, [habits, today, rewardedCheckIns, coins, purchasedItems, rewardTokens, save]);

  const purchaseMallItem = useCallback(async (itemId: string, price: number, category: RewardCategory, ticketCost: number) => {
    if (actionLock.current) throw new Error('正在處理上一個操作');
    if (purchasedItems.includes(itemId)) throw new Error('這個項目已經建造完成');
    if (coins < price) throw new Error('金幣還不夠');
    if (rewardTokens[category] < ticketCost) throw new Error(`還需要 ${REWARD_CATEGORY_LABELS[category]}`);
    actionLock.current = true;
    try {
      await saveMall({
        coins: coins - price,
        purchasedItems: [...purchasedItems, itemId],
        rewardedCheckIns,
        rewardTokens: { ...rewardTokens, [category]: rewardTokens[category] - ticketCost },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, rewardedCheckIns, rewardTokens, saveMall]);

  const value = useMemo(() => ({
    habits, isLoading, storageError, today, coins, purchasedItems, rewardTokens, addHabit, updateHabit, deleteHabit, toggleCheckIn, purchaseMallItem,
  }), [habits, isLoading, storageError, today, coins, purchasedItems, rewardTokens, addHabit, updateHabit, deleteHabit, toggleCheckIn, purchaseMallItem]);

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
