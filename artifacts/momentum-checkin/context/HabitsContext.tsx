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
import { AppState } from 'react-native';
import palette from '@/constants/colors';
import { MALL_SLOT_IDS, type MallSlotId } from '@/constants/mall-layout';
import {
  SHOP_INTERIOR_DECORATION_IDS,
  SHOP_INTERIOR_PLACEMENT_IDS,
  SHOP_INTERIOR_DECORATION_BY_ID,
  getShopInteriorDecorations,
  parseShopInteriorPlacementId,
  type ShopInteriorPlacementId,
} from '@/constants/mall-shop-interior';
import { MALL_ITEM_BY_ID } from '@/constants/mall';
import { getRewardedCheckInCount } from '@/constants/progress-milestones';
import { canMakeUpYesterday, getPreviousLocalDate, getWeeklyChallengeLimit, getWeekday, getStreak, MAKEUP_USE_PREFIX } from '@/lib/habit-schedule';
import {
  canDisplayShopProducts,
  getShopFixtureProductCatalog,
  SHOP_DISPLAY_SLOT_COUNT,
} from '@/constants/mall-shop-display';
import {
  DOG_STAFF_PROFILE_BY_DECORATION_ID,
  DOG_STAFF_STATIONS,
  DOG_STAFF_STYLE_CATALOGS,
  isDogStaffAreaId,
  resolveDogStaffLook,
  isValidDogStaffLook,
  type DogStaffAreaId,
  type DogStaffAreaPlacements,
  type DogStaffLook,
  type DogStaffSavedLook,
} from '@/constants/dog-staff-customization';
export { MALL_SLOT_IDS } from '@/constants/mall-layout';
export type { MallSlotId } from '@/constants/mall-layout';

export interface Habit {
  id: string;
  title: string;
  reason: string;
  icon: string;
  color: string;
  rewardCategory: RewardCategory;
  createdAt: string;
  checkIns: string[];
  steps: string[];
  restDays: number[];
  stepCheckIns: Record<string, string>;
  makeupCheckIns: string[];
  weeklyChallengeTarget?: number;
  minimumAction?: string;
}

export type RewardCategory = 'facility' | 'shop' | 'decor';
export type RewardTokens = Record<RewardCategory, number>;
export const MALL_FLOOR_COUNT = 20;

interface CheckInTransaction {
  version: 1;
  habits: Habit[];
  mall: {
    schemaVersion: number;
    coins: number;
    purchasedItems: string[];
    rewardedCheckIns: string[];
    rewardTokens: RewardTokens;
    placements: Record<string, string>;
    shopInteriors: ShopInteriorCollection;
  };
}

export interface ShopInteriorState {
  ownedDecorations: string[];
  placements: Partial<Record<ShopInteriorPlacementId, string>>;
  fixtureContents?: Record<string, (string | null)[]>;
  dogStaffLooks?: Record<string, DogStaffLook>;
  dogStaffOutfits?: Record<string, DogStaffSavedLook[]>;
  dogStaffPlacements?: DogStaffAreaPlacements;
}

export type ShopInteriorCollection = Record<string, ShopInteriorState>;

export interface ProgressSnapshot {
  schemaVersion: 1;
  habits: Habit[];
  mall: CheckInTransaction['mall'];
}

export type CloudSyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export const REWARD_CATEGORY_LABELS: Record<RewardCategory, string> = {
  facility: '設施券',
  shop: '店鋪券',
  decor: '裝飾星',
};

interface HabitsContextValue {
  habits: Habit[];
  isLoading: boolean;
  storageError: string | null;
  mallLoadError: string | null;
  progressSnapshot: ProgressSnapshot;
  cloudSyncStatus: CloudSyncStatus;
  cloudSyncMessage: string | null;
  setCloudSyncState: (status: CloudSyncStatus, message?: string | null) => void;
  replaceProgressFromCloud: (snapshot: unknown) => Promise<void>;
  today: string;
  coins: number;
  purchasedItems: string[];
  rewardedCheckIns: string[];
  mallPlacements: Record<string, string>;
  shopInteriors: ShopInteriorCollection;
  rewardTokens: RewardTokens;
  getCheckInReward: (habitId: string) => number;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'checkIns' | 'stepCheckIns' | 'makeupCheckIns' | 'weeklyChallengeTarget'>) => Promise<void>;
  updateHabit: (id: string, updates: Pick<Habit, 'title' | 'reason' | 'icon' | 'color' | 'rewardCategory' | 'steps' | 'restDays' | 'minimumAction'>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCheckIn: (id: string, completedStep?: string) => Promise<number>;
  makeUpYesterday: (id: string) => Promise<number>;
  setWeeklyChallenge: (habitId: string | null, target: number | null) => Promise<void>;
  purchaseMallItem: (itemId: string, price: number, category: RewardCategory, ticketCost: number, slotId: MallSlotId) => Promise<void>;
  moveMallItem: (itemId: string, slotId: MallSlotId) => Promise<void>;
  storeMallItem: (itemId: string) => Promise<void>;
  grantTestCoins: (minimumBalance: number) => Promise<void>;
  placeShopInteriorDecoration: (shopId: string, decorationId: string, placementId: ShopInteriorPlacementId) => Promise<void>;
  storeShopInteriorDecoration: (shopId: string, placementId: ShopInteriorPlacementId) => Promise<void>;
  setShopInteriorFixtureProduct: (shopId: string, fixtureDecorationId: string, slotIndex: number, productId: string | null) => Promise<void>;
  placeShopInteriorDogStaff: (shopId: string, dogDecorationId: string, areaId: DogStaffAreaId) => Promise<void>;
  storeShopInteriorDogStaff: (shopId: string, dogDecorationId: string) => Promise<void>;
  updateShopInteriorDogLook: (shopId: string, dogDecorationId: string, look: DogStaffLook) => Promise<void>;
  saveShopInteriorDogLook: (shopId: string, dogDecorationId: string, name: string, look: DogStaffLook) => Promise<void>;
  deleteShopInteriorDogLook: (shopId: string, dogDecorationId: string, savedLookId: string) => Promise<void>;
}

const STORAGE_KEY = 'momentum.habits.v1';
const MALL_STORAGE_KEY = 'momentum.mall.v1';
const CHECK_IN_TRANSACTION_KEY = 'momentum.checkin-transaction.v1';
// Version 2 made unplaced items intentional collection items; v3 adds per-shop interiors.
const MALL_SCHEMA_VERSION = 5;
const CHECK_IN_REWARD = 20;
const EMPTY_TOKENS: RewardTokens = { facility: 0, shop: 0, decor: 0 };
const IS_DEVELOPMENT_BUILD = typeof __DEV__ !== 'undefined' && __DEV__;
const MALL_READ_ERROR_MESSAGE = '無法讀取商場資料；原始資料未被更改，也不會顯示成空商場。請修復資料後重新開啟 App。';

type StoredMallData = {
  schemaVersion?: number;
  coins: number;
  purchasedItems: string[];
  rewardedCheckIns?: string[];
  rewardTokens?: Partial<RewardTokens>;
  placements?: Record<string, string>;
  shopInteriors?: ShopInteriorCollection;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string');
}

function parseMallData(value: string): StoredMallData {
  const parsed: unknown = JSON.parse(value);
  if (!isRecord(parsed)) throw new Error('商場資料必須是物件');
  if (
    typeof parsed.coins !== 'number'
    || !Number.isFinite(parsed.coins)
    || parsed.coins < 0
    || !isStringArray(parsed.purchasedItems)
  ) {
    throw new Error('商場金幣或所有權資料格式無效');
  }
  if (
    parsed.schemaVersion !== undefined
    && (!Number.isInteger(parsed.schemaVersion)
      || (parsed.schemaVersion as number) < 1
      || (parsed.schemaVersion as number) > MALL_SCHEMA_VERSION)
  ) {
    throw new Error('商場資料版本不受支援');
  }
  if (parsed.rewardedCheckIns !== undefined && !isStringArray(parsed.rewardedCheckIns)) {
    throw new Error('商場獎勵紀錄格式無效');
  }
  if (parsed.placements !== undefined && !isStringRecord(parsed.placements)) {
    throw new Error('商場位置資料格式無效');
  }
  if (parsed.rewardTokens !== undefined) {
    if (!isRecord(parsed.rewardTokens)) throw new Error('商場獎勵券格式無效');
    for (const category of ['facility', 'shop', 'decor'] as const) {
      const count = parsed.rewardTokens[category];
      if (count !== undefined && (typeof count !== 'number' || !Number.isFinite(count) || count < 0)) {
        throw new Error('商場獎勵券格式無效');
      }
    }
  }
  if (parsed.shopInteriors !== undefined) {
    if (!isRecord(parsed.shopInteriors)) throw new Error('店內佈置資料格式無效');
    for (const interior of Object.values(parsed.shopInteriors)) {
      if (!isRecord(interior)) throw new Error('店內佈置資料格式無效');
      if (interior.ownedDecorations !== undefined && !isStringArray(interior.ownedDecorations)) {
        throw new Error('店內裝飾所有權格式無效');
      }
      if (interior.placements !== undefined && !isStringRecord(interior.placements)) {
        throw new Error('店內裝飾位置格式無效');
      }
      if (interior.fixtureContents !== undefined) {
        if (!isRecord(interior.fixtureContents)
          || Object.values(interior.fixtureContents).some((contents) => (
            !Array.isArray(contents)
            || contents.some((productId) => productId !== null && typeof productId !== 'string')
          ))) {
          throw new Error('店內商品展示格式無效');
        }
      }
      if (interior.dogStaffLooks !== undefined) {
        if (!isRecord(interior.dogStaffLooks)
          || Object.values(interior.dogStaffLooks).some((look) => (
            !isRecord(look)
            || typeof look.outfitId !== 'string'
            || typeof look.accessoryId !== 'string'
          ))) {
          throw new Error('店員造型格式無效');
        }
      }
      if (interior.dogStaffOutfits !== undefined) {
        if (!isRecord(interior.dogStaffOutfits)
          || Object.values(interior.dogStaffOutfits).some((outfits) => (
            !Array.isArray(outfits)
            || outfits.some((outfit) => (
              !isRecord(outfit)
              || typeof outfit.id !== 'string'
              || typeof outfit.name !== 'string'
              || !isRecord(outfit.look)
              || typeof outfit.look.outfitId !== 'string'
              || typeof outfit.look.accessoryId !== 'string'
            ))
          ))) {
          throw new Error('已保存穿搭格式無效');
        }
      }
      if (interior.dogStaffPlacements !== undefined && !isStringRecord(interior.dogStaffPlacements)) {
        throw new Error('店員位置格式無效');
      }
    }
  }
  return parsed as StoredMallData;
}

function parseCheckInTransaction(value: string | null): CheckInTransaction | null {
  if (value === null) return null;
  const transaction = JSON.parse(value) as CheckInTransaction;
  if (
    transaction.version !== 1
    || !Array.isArray(transaction.habits)
    || !transaction.mall
    || typeof transaction.mall.coins !== 'number'
    || !Array.isArray(transaction.mall.purchasedItems)
    || !Array.isArray(transaction.mall.rewardedCheckIns)
  ) {
    throw new Error('打卡交易紀錄格式無效');
  }
  return transaction;
}

async function synchronizeCheckInTransaction(transaction: CheckInTransaction): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transaction.habits));
  await AsyncStorage.setItem(MALL_STORAGE_KEY, JSON.stringify(transaction.mall));
  await AsyncStorage.removeItem(CHECK_IN_TRANSACTION_KEY);
}

async function recoverPendingCheckInTransaction(): Promise<void> {
  const transaction = parseCheckInTransaction(await AsyncStorage.getItem(CHECK_IN_TRANSACTION_KEY));
  if (transaction) await synchronizeCheckInTransaction(transaction);
}

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
    const steps = Array.isArray(habit.steps)
      ? [...new Set(habit.steps.filter((step): step is string => typeof step === 'string').map((step) => step.trim()).filter(Boolean))].slice(0, 5)
      : [];
    const restDays = Array.isArray(habit.restDays)
      ? [...new Set(habit.restDays.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6))]
      : [];
    const stepCheckIns = habit.stepCheckIns && typeof habit.stepCheckIns === 'object'
      ? Object.fromEntries(Object.entries(habit.stepCheckIns).filter(([, step]) => typeof step === 'string' && steps.includes(step)))
      : {};
    const makeupCheckIns = Array.isArray(habit.makeupCheckIns)
      ? [...new Set(habit.makeupCheckIns.filter((date): date is string => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)))]
      : [];
    const weeklyChallengeTarget = Number.isInteger(habit.weeklyChallengeTarget)
      && Number(habit.weeklyChallengeTarget) >= 1
      && Number(habit.weeklyChallengeTarget) <= 7
      ? Number(habit.weeklyChallengeTarget)
      : undefined;
    const minimumAction = typeof habit.minimumAction === 'string'
      ? habit.minimumAction.trim().slice(0, 120) || undefined
      : undefined;
    return { ...habit, rewardCategory, color: categoryColor, steps, restDays, stepCheckIns, makeupCheckIns, weeklyChallengeTarget, minimumAction };
  });
}

function normalizeMallPlacements(
  savedPlacements: Record<string, string> | undefined,
  purchasedItems: string[],
  schemaVersion = 1,
): Record<string, string> {
  const placements: Record<string, string> = {};
  const assignedItems = new Set<string>();
  for (const [slotId, itemId] of Object.entries(savedPlacements ?? {})) {
    const migratedSlotId = schemaVersion < 5
      && slotId.startsWith('floor-10-')
      && MALL_ITEM_BY_ID[itemId]?.floor === 20
      ? `floor-20-${slotId.slice('floor-10-'.length)}`
      : slotId;
    if (
      (MALL_SLOT_IDS as readonly string[]).includes(migratedSlotId)
      && !placements[migratedSlotId]
      && purchasedItems.includes(itemId)
      && !assignedItems.has(itemId)
    ) {
      placements[migratedSlotId] = itemId;
      assignedItems.add(itemId);
    }
  }
  for (const itemId of schemaVersion < 2 ? purchasedItems : []) {
    if (assignedItems.has(itemId)) continue;
    const openSlot = MALL_SLOT_IDS.find((slotId) => !placements[slotId]);
    if (!openSlot) break;
    placements[openSlot] = itemId;
    assignedItems.add(itemId);
  }
  return placements;
}

function normalizeShopInteriors(
  savedInteriors: ShopInteriorCollection | undefined,
  purchasedItems: string[],
): ShopInteriorCollection {
  const placementIds = new Set<string>(SHOP_INTERIOR_PLACEMENT_IDS);
  const interiors: ShopInteriorCollection = {};
  for (const [shopId, saved] of Object.entries(savedInteriors ?? {})) {
    if (!purchasedItems.includes(shopId) || !saved || typeof saved !== 'object') continue;
    const shopItem = MALL_ITEM_BY_ID[shopId];
    const savedDecorationIds = (saved.ownedDecorations ?? []).filter(
      (id): id is string => typeof id === 'string',
    );
    const currentCatalog = shopItem?.category === 'shop'
      ? getShopInteriorDecorations(shopItem.shopType, shopId, shopItem.name, savedDecorationIds)
      : [];
    const decorationIds = new Set([
      ...SHOP_INTERIOR_DECORATION_IDS,
      ...currentCatalog.map(({ id }) => id),
    ]);
    const ownedDecorations = [...new Set(
      savedDecorationIds.filter((id) => decorationIds.has(id)),
    )];
    const owned = new Set(ownedDecorations);
    const shopDecorations = shopItem?.category === 'shop'
      ? getShopInteriorDecorations(shopItem.shopType, shopId, shopItem.name, ownedDecorations)
      : [];
    const fixtureById = new Map(shopDecorations.map((decoration) => [decoration.id, decoration]));
    const fixtureContents: Record<string, (string | null)[]> = {};
    for (const [fixtureId, savedProducts] of Object.entries(saved.fixtureContents ?? {})) {
      const fixture = fixtureById.get(fixtureId);
      if (!owned.has(fixtureId) || !fixture || !canDisplayShopProducts(fixture) || !Array.isArray(savedProducts)) continue;
      const allowedProductIds = new Set(
        getShopFixtureProductCatalog(shopId, shopItem?.name ?? '', shopItem?.shopType, fixture).map(({ id }) => id),
      );
      const slots = Array.from({ length: SHOP_DISPLAY_SLOT_COUNT }, (_, index) => {
        const productId = savedProducts[index];
        return typeof productId === 'string' && allowedProductIds.has(productId) ? productId : null;
      });
      if (slots.some(Boolean)) fixtureContents[fixtureId] = slots;
    }
    const assigned = new Set<string>();
    const placements: Partial<Record<ShopInteriorPlacementId, string>> = {};
    const dogStaffLooks: Record<string, DogStaffLook> = {};
    const dogStaffOutfits: Record<string, DogStaffSavedLook[]> = {};
    const dogStaffPlacements: DogStaffAreaPlacements = {};
    const staffAssigned = new Set<string>();
    const stationsById = new Map<string, (typeof DOG_STAFF_STATIONS)[number]>(
      DOG_STAFF_STATIONS.map((station) => [station.id, station] as const),
    );
    const isFluffyCafe = shopId === 'fluffy-marshmallow-cafe';
    if (isFluffyCafe) {
      const savedStaffPlacements = saved.dogStaffPlacements as unknown as Record<string, unknown> | undefined;
      for (const [placementKey, savedValue] of Object.entries(savedStaffPlacements ?? {})) {
        if (
          DOG_STAFF_PROFILE_BY_DECORATION_ID[placementKey]
          && owned.has(placementKey)
          && isDogStaffAreaId(savedValue)
        ) {
          dogStaffPlacements[placementKey] = savedValue;
          staffAssigned.add(placementKey);
          continue;
        }
        const legacyStation = stationsById.get(placementKey);
        if (
          legacyStation
          && typeof savedValue === 'string'
          && DOG_STAFF_PROFILE_BY_DECORATION_ID[savedValue]
          && owned.has(savedValue)
          && !staffAssigned.has(savedValue)
        ) {
          dogStaffPlacements[savedValue] = legacyStation.areaId;
          staffAssigned.add(savedValue);
        }
      }
    }
    for (const [placementId, decorationId] of Object.entries(saved.placements ?? {})) {
      if (typeof decorationId !== 'string') continue;
      if (DOG_STAFF_PROFILE_BY_DECORATION_ID[decorationId]) {
        if (isFluffyCafe && owned.has(decorationId) && !staffAssigned.has(decorationId)) {
          const areaId = parseShopInteriorPlacementId(placementId)?.areaId ?? 'main';
          dogStaffPlacements[decorationId] = areaId as DogStaffAreaId;
          staffAssigned.add(decorationId);
        }
        continue;
      }
      if (
        placementIds.has(placementId)
        && owned.has(decorationId)
        && !assigned.has(decorationId)
      ) {
        placements[placementId as ShopInteriorPlacementId] = decorationId;
        assigned.add(decorationId);
      }
    }
    for (const [dogDecorationId, savedLook] of Object.entries(saved.dogStaffLooks ?? {})) {
      if (!owned.has(dogDecorationId) || !DOG_STAFF_STYLE_CATALOGS[dogDecorationId]) continue;
      const look = resolveDogStaffLook(dogDecorationId, savedLook);
      if (look) dogStaffLooks[dogDecorationId] = look;
    }
    for (const [dogDecorationId, savedOutfits] of Object.entries(saved.dogStaffOutfits ?? {})) {
      if (!owned.has(dogDecorationId) || !DOG_STAFF_STYLE_CATALOGS[dogDecorationId] || !Array.isArray(savedOutfits)) continue;
      const seenIds = new Set<string>();
      const outfits = savedOutfits.flatMap((savedOutfit) => {
        if (
          !savedOutfit
          || typeof savedOutfit.id !== 'string'
          || !savedOutfit.id
          || seenIds.has(savedOutfit.id)
          || typeof savedOutfit.name !== 'string'
          || !savedOutfit.name.trim()
          || savedOutfit.name.trim().length > 24
        ) return [];
        const look = resolveDogStaffLook(dogDecorationId, savedOutfit.look);
        if (!look) return [];
        seenIds.add(savedOutfit.id);
        return [{ id: savedOutfit.id, name: savedOutfit.name.trim(), look }];
      });
      if (outfits.length > 0) dogStaffOutfits[dogDecorationId] = outfits;
    }
    if (ownedDecorations.length > 0 || Object.keys(placements).length > 0 || Object.keys(fixtureContents).length > 0 || Object.keys(dogStaffLooks).length > 0 || Object.keys(dogStaffOutfits).length > 0 || Object.keys(dogStaffPlacements).length > 0) {
      interiors[shopId] = {
        ownedDecorations,
        placements,
        ...(Object.keys(fixtureContents).length > 0 ? { fixtureContents } : {}),
        ...(Object.keys(dogStaffLooks).length > 0 ? { dogStaffLooks } : {}),
        ...(Object.keys(dogStaffOutfits).length > 0 ? { dogStaffOutfits } : {}),
        ...(Object.keys(dogStaffPlacements).length > 0 ? { dogStaffPlacements } : {}),
      };
    }
  }
  return interiors;
}

const starterHabits: Habit[] = [
  { id: 'starter-walk', title: '散步 20 分鐘', reason: '讓身體和心情都透透氣', icon: 'activity', color: palette.light.candyMint, rewardCategory: 'facility', createdAt: '2026-01-01', checkIns: [], steps: [], restDays: [], stepCheckIns: {}, makeupCheckIns: [] },
  { id: 'starter-read', title: '閱讀 10 頁', reason: '每天留一點時間給自己', icon: 'book-open', color: palette.light.candyLavender, rewardCategory: 'shop', createdAt: '2026-01-01', checkIns: [], steps: [], restDays: [], stepCheckIns: {}, makeupCheckIns: [] },
  { id: 'starter-water', title: '寫下今天的一件好事', reason: '看見已經擁有的進步', icon: 'edit-3', color: palette.light.candyPink, rewardCategory: 'decor', createdAt: '2026-01-01', checkIns: [], steps: [], restDays: [], stepCheckIns: {}, makeupCheckIns: [] },
];

export function getLocalDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createId(): string {
  return `${Date.now().toString()}-${Math.random().toString(36).slice(2, 9)}`;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [coins, setCoins] = useState(0);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [mallPlacements, setMallPlacements] = useState<Record<string, string>>({});
  const [shopInteriors, setShopInteriors] = useState<ShopInteriorCollection>({});
  const [rewardTokens, setRewardTokens] = useState<RewardTokens>(EMPTY_TOKENS);
  const [rewardedCheckIns, setRewardedCheckIns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [mallLoadError, setMallLoadError] = useState<string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('local');
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string | null>(null);
  const actionLock = useRef(false);
  const mallLoadErrorRef = useRef(false);
  const [today, setToday] = useState(() => getLocalDate());
  const setCloudSyncState = useCallback((status: CloudSyncStatus, message: string | null = null) => {
    setCloudSyncStatus(status);
    setCloudSyncMessage(message);
  }, []);
  const getCheckInReward = useCallback((habitId: string) => (
    rewardedCheckIns.includes(`${habitId}:${today}`) ? 0 : CHECK_IN_REWARD
  ), [rewardedCheckIns, today]);

  useEffect(() => {
    let active = true;
    let midnightTimer: ReturnType<typeof setTimeout> | undefined;
    let timezoneCheckTimer: ReturnType<typeof setTimeout> | undefined;
    const refreshDateAndScheduleMidnight = () => {
      if (!active) return;
      const now = new Date();
      const currentDate = getLocalDate(now);
      setToday((previousDateKey) => previousDateKey === currentDate ? previousDateKey : currentDate);

      if (midnightTimer !== undefined) clearTimeout(midnightTimer);
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      midnightTimer = setTimeout(
        refreshDateAndScheduleMidnight,
        Math.max(1, nextMidnight.getTime() - now.getTime()),
      );

      if (timezoneCheckTimer !== undefined) clearTimeout(timezoneCheckTimer);
      timezoneCheckTimer = setTimeout(refreshDateAndScheduleMidnight, 30_000);
    };
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (midnightTimer !== undefined) clearTimeout(midnightTimer);
      if (timezoneCheckTimer !== undefined) clearTimeout(timezoneCheckTimer);
      refreshDateAndScheduleMidnight();
    });

    refreshDateAndScheduleMidnight();
    return () => {
      active = false;
      if (midnightTimer !== undefined) clearTimeout(midnightTimer);
      if (timezoneCheckTimer !== undefined) clearTimeout(timezoneCheckTimer);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      let mallDataLoaded = false;
      try {
        const [saved, savedMall, savedCheckInTransaction] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(MALL_STORAGE_KEY),
          AsyncStorage.getItem(CHECK_IN_TRANSACTION_KEY),
        ]);
        const checkInTransaction = parseCheckInTransaction(savedCheckInTransaction);
        const initialHabits = normalizeHabits(
          checkInTransaction?.habits
            ?? (saved === null ? starterHabits : JSON.parse(saved) as Habit[]),
        );
        if (active) setHabits(initialHabits);
        const initialMall = checkInTransaction?.mall ?? (savedMall === null
          ? { coins: 0, purchasedItems: [], rewardedCheckIns: [], rewardTokens: EMPTY_TOKENS }
          : parseMallData(savedMall));
        const initialPurchasedItems = initialMall.purchasedItems ?? [];
        const initialPlacements = normalizeMallPlacements(initialMall.placements, initialPurchasedItems, initialMall.schemaVersion);
        const initialShopInteriors = normalizeShopInteriors(initialMall.shopInteriors, initialPurchasedItems);
        mallDataLoaded = true;
        if (active) {
          setCoins(initialMall.coins ?? 0);
          setPurchasedItems(initialPurchasedItems);
          setMallPlacements(initialPlacements);
          setShopInteriors(initialShopInteriors);
          setRewardedCheckIns(initialMall.rewardedCheckIns ?? []);
          setRewardTokens({ ...EMPTY_TOKENS, ...initialMall.rewardTokens });
        }
        // Reading existing data must not depend on being able to write a migration.
        try {
          if (checkInTransaction) {
            await synchronizeCheckInTransaction({
              ...checkInTransaction,
              mall: {
                ...checkInTransaction.mall,
                schemaVersion: MALL_SCHEMA_VERSION,
                placements: initialPlacements,
                shopInteriors: initialShopInteriors,
              },
            });
            return;
          }
          await Promise.all([
            ...(saved === null ? [AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialHabits))] : []),
          ...((initialMall.schemaVersion ?? 1) < MALL_SCHEMA_VERSION ? [
              AsyncStorage.setItem(MALL_STORAGE_KEY, JSON.stringify({
                ...initialMall,
                schemaVersion: MALL_SCHEMA_VERSION,
                placements: initialPlacements,
              shopInteriors: initialShopInteriors,
              })),
            ] : []),
          ]);
        } catch {
          if (active) {
            setStorageError(checkInTransaction
              ? '打卡與金幣已一致記錄；部分同步暫時失敗，重新開啟 App 會自動修復。'
              : '紀錄已載入，但初始化儲存失敗，請檢查裝置空間後重新開啟 App。');
          }
        }
      } catch {
        if (active) {
          if (!mallDataLoaded) {
            mallLoadErrorRef.current = true;
            setMallLoadError(MALL_READ_ERROR_MESSAGE);
            setStorageError(MALL_READ_ERROR_MESSAGE);
          } else {
            setStorageError('目前無法讀取已儲存的紀錄，請重新開啟 App。');
          }
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const save = useCallback(async (next: Habit[]) => {
    try {
      await recoverPendingCheckInTransaction();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setHabits(next);
      setStorageError(null);
    } catch {
      setStorageError('儲存失敗，請檢查裝置空間後再試一次。');
      throw new Error('無法儲存打卡紀錄');
    }
  }, []);

  const saveMall = useCallback(async (next: { coins: number; purchasedItems: string[]; rewardedCheckIns: string[]; rewardTokens: RewardTokens; placements: Record<string, string>; shopInteriors: ShopInteriorCollection }) => {
    if (mallLoadErrorRef.current) throw new Error('無法讀取商場資料，請先修復資料並重新開啟 App。');
    try {
      await recoverPendingCheckInTransaction();
      await AsyncStorage.setItem(MALL_STORAGE_KEY, JSON.stringify({ ...next, schemaVersion: MALL_SCHEMA_VERSION }));
      setCoins(next.coins);
      setPurchasedItems(next.purchasedItems);
      setMallPlacements(next.placements);
      setShopInteriors(next.shopInteriors);
      setRewardedCheckIns(next.rewardedCheckIns);
      setRewardTokens(next.rewardTokens);
      setStorageError(null);
    } catch {
      setStorageError('商場資料儲存失敗，請檢查裝置空間後再試一次。');
      throw new Error('無法儲存商場資料');
    }
  }, []);

  const replaceProgressFromCloud = useCallback(async (snapshot: unknown) => {
    if (mallLoadErrorRef.current) throw new Error('無法讀取商場資料，請先修復資料並重新開啟 App。');
    if (!snapshot || typeof snapshot !== 'object') throw new Error('雲端進度格式無效');
    const source = snapshot as Record<string, unknown>;
    if (!Array.isArray(source.habits) || !source.mall || typeof source.mall !== 'object') {
      throw new Error('雲端進度格式無效');
    }
    const validHabits = source.habits.every((item) => (
      item !== null
      && typeof item === 'object'
      && typeof (item as Record<string, unknown>).id === 'string'
      && typeof (item as Record<string, unknown>).title === 'string'
      && typeof (item as Record<string, unknown>).reason === 'string'
      && typeof (item as Record<string, unknown>).icon === 'string'
      && typeof (item as Record<string, unknown>).color === 'string'
      && typeof (item as Record<string, unknown>).createdAt === 'string'
      && Array.isArray((item as Record<string, unknown>).checkIns)
      && ((item as Record<string, unknown>).checkIns as unknown[]).every((date) => typeof date === 'string')
    ));
    if (!validHabits) throw new Error('雲端目標資料格式無效');

    const rawMall = source.mall as Record<string, unknown>;
    const coins = rawMall.coins;
    if (typeof coins !== 'number' || !Number.isFinite(coins) || coins < 0) {
      throw new Error('雲端金幣資料格式無效');
    }
    const purchasedItems = Array.isArray(rawMall.purchasedItems)
      ? rawMall.purchasedItems.filter((id): id is string => typeof id === 'string')
      : [];
    const rewardedCheckIns = Array.isArray(rawMall.rewardedCheckIns)
      ? rawMall.rewardedCheckIns.filter((key): key is string => typeof key === 'string')
      : [];
    const rawRewardTokens = rawMall.rewardTokens && typeof rawMall.rewardTokens === 'object'
      ? rawMall.rewardTokens as Partial<RewardTokens>
      : {};
    const nextRewardTokens: RewardTokens = {
      facility: typeof rawRewardTokens.facility === 'number' ? rawRewardTokens.facility : 0,
      shop: typeof rawRewardTokens.shop === 'number' ? rawRewardTokens.shop : 0,
      decor: typeof rawRewardTokens.decor === 'number' ? rawRewardTokens.decor : 0,
    };
    const rawPlacements = rawMall.placements && typeof rawMall.placements === 'object'
      ? rawMall.placements as Record<string, unknown>
      : {};
    const savedPlacements = Object.fromEntries(
      Object.entries(rawPlacements).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    );
    const rawInteriors = rawMall.shopInteriors && typeof rawMall.shopInteriors === 'object'
      ? rawMall.shopInteriors as ShopInteriorCollection
      : {};
    const nextHabits = normalizeHabits(source.habits as Habit[]);
    const nextPlacements = normalizeMallPlacements(
      savedPlacements,
      purchasedItems,
      Number(rawMall.schemaVersion ?? 1),
    );
    const nextShopInteriors = normalizeShopInteriors(rawInteriors, purchasedItems);
    const transaction: CheckInTransaction = {
      version: 1,
      habits: nextHabits,
      mall: {
        schemaVersion: MALL_SCHEMA_VERSION,
        coins,
        purchasedItems,
        rewardedCheckIns,
        rewardTokens: nextRewardTokens,
        placements: nextPlacements,
        shopInteriors: nextShopInteriors,
      },
    };

    try {
      await AsyncStorage.setItem(CHECK_IN_TRANSACTION_KEY, JSON.stringify(transaction));
      await synchronizeCheckInTransaction(transaction);
      setHabits(nextHabits);
      setCoins(coins);
      setPurchasedItems(purchasedItems);
      setMallPlacements(nextPlacements);
      setShopInteriors(nextShopInteriors);
      setRewardedCheckIns(rewardedCheckIns);
      setRewardTokens(nextRewardTokens);
      setStorageError(null);
    } catch {
      setStorageError('雲端資料已讀取，但無法安全寫入裝置；原有進度未被覆蓋。');
      throw new Error('無法還原雲端進度');
    }
  }, []);

  const addHabit = useCallback(async (habit: Omit<Habit, 'id' | 'createdAt' | 'checkIns' | 'stepCheckIns' | 'makeupCheckIns'>) => {
    const minimumAction = habit.minimumAction?.trim().slice(0, 120) || undefined;
    const next = [...habits, { ...habit, minimumAction, id: createId(), createdAt: today, checkIns: [], stepCheckIns: {}, makeupCheckIns: [] }];
    await save(next);
  }, [habits, save, today]);

  const updateHabit = useCallback(async (id: string, updates: Pick<Habit, 'title' | 'reason' | 'icon' | 'color' | 'rewardCategory' | 'steps' | 'restDays' | 'minimumAction'>) => {
    await save(habits.map((habit) => habit.id === id ? {
      ...habit,
      ...updates,
      minimumAction: updates.minimumAction?.trim().slice(0, 120) || undefined,
      stepCheckIns: Object.fromEntries(
        Object.entries(habit.stepCheckIns).filter(([, step]) => updates.steps.includes(step)),
      ),
    } : habit));
  }, [habits, save]);

  const deleteHabit = useCallback(async (id: string) => {
    await save(habits.filter((habit) => habit.id !== id));
  }, [habits, save]);

  const toggleCheckIn = useCallback(async (id: string, completedStep?: string) => {
    if (actionLock.current) return 0;
    actionLock.current = true;
    try {
      if (mallLoadErrorRef.current) throw new Error('無法讀取商場資料，請先修復資料並重新開啟 App。');
      await recoverPendingCheckInTransaction();
      const checkInDate = getLocalDate();
      const habit = habits.find((item) => item.id === id);
      if (!habit) return 0;
      if (!habit.checkIns.includes(checkInDate) && habit.restDays.includes(getWeekday(checkInDate))) {
        throw new Error('今天是這個目標的休息日。');
      }
      const alreadyDone = habit.checkIns.includes(checkInDate);
      const nextHabits = habits.map((item) => {
        if (item.id !== id) return item;
        const stepCheckIns = { ...item.stepCheckIns };
        if (alreadyDone) delete stepCheckIns[checkInDate];
        else if (completedStep && item.steps.includes(completedStep)) stepCheckIns[checkInDate] = completedStep;
        return {
          ...item,
          checkIns: alreadyDone
            ? item.checkIns.filter((date) => date !== checkInDate)
            : [...item.checkIns, checkInDate],
          stepCheckIns,
        };
      });
      let reward = 0;
      if (!alreadyDone) {
        const rewardKey = `${id}:${checkInDate}`;
        if (!rewardedCheckIns.includes(rewardKey)) reward = CHECK_IN_REWARD;
      }
      if (reward > 0) {
        const rewardKey = `${id}:${checkInDate}`;
        const transaction: CheckInTransaction = {
          version: 1,
          habits: nextHabits,
          mall: {
            schemaVersion: MALL_SCHEMA_VERSION,
            coins: coins + reward,
            purchasedItems,
            placements: mallPlacements,
            shopInteriors,
            rewardedCheckIns: [...rewardedCheckIns, rewardKey],
            rewardTokens,
          },
        };
        // The one-key journal is the commit point. If either legacy mirror write
        // fails, hydration can still restore both halves from this transaction.
        await AsyncStorage.setItem(CHECK_IN_TRANSACTION_KEY, JSON.stringify(transaction));
        setHabits(nextHabits);
        setCoins(transaction.mall.coins);
        setRewardedCheckIns(transaction.mall.rewardedCheckIns);
        setRewardTokens(transaction.mall.rewardTokens);
        try {
          await synchronizeCheckInTransaction(transaction);
          setStorageError(null);
        } catch {
          setStorageError('打卡與金幣已一致記錄；部分同步暫時失敗，重新開啟 App 會自動修復。');
        }
      } else {
        await save(nextHabits);
      }
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Feedback failure must not make a durably saved check-in look unsaved.
      }
      return reward;
    } catch {
      setStorageError('打卡沒有儲存成功，請再試一次。');
      throw new Error('無法儲存打卡紀錄');
    } finally {
      actionLock.current = false;
    }
  }, [habits, today, rewardedCheckIns, coins, purchasedItems, mallPlacements, shopInteriors, rewardTokens, save]);

  const makeUpYesterday = useCallback(async (id: string) => {
    if (actionLock.current) throw new Error('正在處理上一個操作');
    if (mallLoadErrorRef.current) throw new Error('無法讀取商場資料，請先修復資料並重新開啟 App。');
    const habit = habits.find((item) => item.id === id);
    if (!habit) throw new Error('找不到這個目標');
    const usedMakeups = [
      ...habits.flatMap((item) => item.makeupCheckIns),
      ...rewardedCheckIns.flatMap((key) => key.startsWith(MAKEUP_USE_PREFIX) ? [key.slice(MAKEUP_USE_PREFIX.length)] : []),
    ];
    if (!canMakeUpYesterday(habit, today, usedMakeups)) {
      throw new Error('昨天已完成、是休息日，或本週補打卡額度已用完。');
    }
    const yesterday = getPreviousLocalDate(today);
    actionLock.current = true;
    try {
      await recoverPendingCheckInTransaction();
      const nextHabits = habits.map((item) => item.id !== id ? item : {
        ...item,
        checkIns: [...new Set([...item.checkIns, yesterday])].sort(),
        makeupCheckIns: [...new Set([...item.makeupCheckIns, yesterday])].sort(),
      });
      const rewardKey = `${id}:${yesterday}`;
      const reward = rewardedCheckIns.includes(rewardKey) ? 0 : CHECK_IN_REWARD;
      const nextRewardedCheckIns = [...new Set([
        ...rewardedCheckIns,
        rewardKey,
        `${MAKEUP_USE_PREFIX}${yesterday}`,
      ])];
      const transaction: CheckInTransaction = {
        version: 1,
        habits: nextHabits,
        mall: {
          schemaVersion: MALL_SCHEMA_VERSION,
          coins: coins + reward,
          purchasedItems,
          placements: mallPlacements,
          shopInteriors,
          rewardedCheckIns: nextRewardedCheckIns,
          rewardTokens,
        },
      };
      await AsyncStorage.setItem(CHECK_IN_TRANSACTION_KEY, JSON.stringify(transaction));
      setHabits(nextHabits);
      setCoins(transaction.mall.coins);
      setRewardedCheckIns(transaction.mall.rewardedCheckIns);
      setRewardTokens(transaction.mall.rewardTokens);
      try {
        await synchronizeCheckInTransaction(transaction);
        setStorageError(null);
      } catch {
        setStorageError('補打卡與金幣已一致記錄；部分同步暫時失敗，重新開啟 App 會自動修復。');
      }
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Feedback failure must not make a durably saved recovery look unsaved.
      }
      return reward;
    } finally {
      actionLock.current = false;
    }
  }, [habits, save, today, rewardedCheckIns, coins, purchasedItems, mallPlacements, shopInteriors, rewardTokens]);

  const setWeeklyChallenge = useCallback(async (habitId: string | null, target: number | null) => {
    if (habitId === null) {
      if (target !== null) throw new Error('請選擇挑戰目標');
      await save(habits.map((habit) => ({ ...habit, weeklyChallengeTarget: undefined })));
      return;
    }
    if (target === null || !Number.isInteger(target) || target < 1 || target > 7) {
      throw new Error('每週挑戰次數必須介乎 1 至 7 次');
    }
    const selectedHabit = habits.find((habit) => habit.id === habitId);
    if (!selectedHabit) throw new Error('找不到這個目標');
    if (target > getWeeklyChallengeLimit(selectedHabit.restDays)) {
      throw new Error('每週挑戰次數不能多於這個目標每週安排的練習日');
    }
    await save(habits.map((habit) => ({
      ...habit,
      weeklyChallengeTarget: habit.id === habitId ? target : undefined,
    })));
  }, [habits, save]);

  // Legacy arguments remain compatible with saved/older clients; only earned coins are spent.
  const purchaseMallItem = useCallback(async (itemId: string, price: number, _category: RewardCategory, _ticketCost: number, slotId: MallSlotId) => {
    if (actionLock.current) throw new Error('正在處理上一個操作');
    if (purchasedItems.includes(itemId)) throw new Error('這個項目已經建造完成');
    const catalogItem = MALL_ITEM_BY_ID[itemId];
    if (!catalogItem) throw new Error('找不到這個商場項目');
    if (catalogItem.unlockCheckIns !== undefined && getRewardedCheckInCount(rewardedCheckIns) < catalogItem.unlockCheckIns) {
      throw new Error(`完成 ${catalogItem.unlockCheckIns} 次目標後即可免費兌換`);
    }
    if (coins < price) throw new Error('金幣還不夠');
    if (!(MALL_SLOT_IDS as readonly string[]).includes(slotId)) throw new Error('這個商場位置不存在');
    if (mallPlacements[slotId]) throw new Error('這個位置已經有設施');
    actionLock.current = true;
    try {
      await saveMall({
        coins: coins - price,
        purchasedItems: [...purchasedItems, itemId],
        placements: { ...mallPlacements, [slotId]: itemId },
        shopInteriors,
        rewardedCheckIns,
        rewardTokens,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, mallPlacements, shopInteriors, rewardedCheckIns, rewardTokens, saveMall]);

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
      await saveMall({ coins, purchasedItems, rewardedCheckIns, rewardTokens, placements, shopInteriors });
      await Haptics.selectionAsync();
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, rewardedCheckIns, rewardTokens, shopInteriors, mallPlacements, saveMall]);

  const storeMallItem = useCallback(async (itemId: string) => {
    if (actionLock.current) throw new Error('正在處理上一個操作');
    if (!purchasedItems.includes(itemId)) throw new Error('這個項目尚未購買');
    actionLock.current = true;
    try {
      const placements = Object.fromEntries(
        Object.entries(mallPlacements).filter(([, placedItemId]) => placedItemId !== itemId),
      );
      await saveMall({ coins, purchasedItems, rewardedCheckIns, rewardTokens, placements, shopInteriors });
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, rewardedCheckIns, rewardTokens, shopInteriors, mallPlacements, saveMall]);

  const placeShopInteriorDecoration = useCallback(async (shopId: string, decorationId: string, placementId: ShopInteriorPlacementId) => {
    if (actionLock.current) throw new Error('正在處理上一個操作');
    if (!purchasedItems.includes(shopId)) throw new Error('請先兌換這間商店');
    const decoration = SHOP_INTERIOR_DECORATION_BY_ID[decorationId];
    if (!decoration) throw new Error('找不到這款店內裝飾');
    if (DOG_STAFF_PROFILE_BY_DECORATION_ID[decorationId]) throw new Error('狗狗店員請使用CAFE專屬站位');
    if (!(SHOP_INTERIOR_PLACEMENT_IDS as readonly string[]).includes(placementId)) throw new Error('這個店內位置不存在');
    const current = shopInteriors[shopId] ?? { ownedDecorations: [], placements: {} };
    const alreadyOwned = current.ownedDecorations.includes(decorationId);
    if (!alreadyOwned && coins < decoration.price) throw new Error(`金幣還差 ${decoration.price - coins} 枚`);
    actionLock.current = true;
    try {
      const placements = Object.fromEntries(
        Object.entries(current.placements).filter(([, id]) => id !== decorationId && id !== current.placements[placementId]),
      ) as Partial<Record<ShopInteriorPlacementId, string>>;
      placements[placementId] = decorationId;
      const nextInterior = {
        ...current,
        ownedDecorations: alreadyOwned ? current.ownedDecorations : [...current.ownedDecorations, decorationId],
        placements,
      };
      await saveMall({
        coins: alreadyOwned ? coins : coins - decoration.price,
        purchasedItems,
        rewardedCheckIns,
        rewardTokens,
        placements: mallPlacements,
        shopInteriors: { ...shopInteriors, [shopId]: nextInterior },
      });
      if (alreadyOwned) await Haptics.selectionAsync();
      else await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, rewardedCheckIns, rewardTokens, mallPlacements, shopInteriors, saveMall]);

  const storeShopInteriorDecoration = useCallback(async (shopId: string, placementId: ShopInteriorPlacementId) => {
    if (actionLock.current) throw new Error('正在處理上一個操作');
    if (!purchasedItems.includes(shopId)) throw new Error('請先兌換這間商店');
    const current = shopInteriors[shopId];
    if (!current?.placements[placementId]) return;
    actionLock.current = true;
    try {
      const placements = Object.fromEntries(
        Object.entries(current.placements).filter(([id]) => id !== placementId),
      ) as Partial<Record<ShopInteriorPlacementId, string>>;
      await saveMall({
        coins,
        purchasedItems,
        rewardedCheckIns,
        rewardTokens,
        placements: mallPlacements,
        shopInteriors: { ...shopInteriors, [shopId]: { ...current, placements } },
      });
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, rewardedCheckIns, rewardTokens, mallPlacements, shopInteriors, saveMall]);

  const setShopInteriorFixtureProduct = useCallback(async (
    shopId: string,
    fixtureDecorationId: string,
    slotIndex: number,
    productId: string | null,
  ) => {
    if (actionLock.current) throw new Error('正在處理上一個操作');
    if (!purchasedItems.includes(shopId)) throw new Error('請先兌換這間商店');
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= SHOP_DISPLAY_SLOT_COUNT) {
      throw new Error('這個商品展示位置不存在');
    }
    const shop = MALL_ITEM_BY_ID[shopId];
    const current = shopInteriors[shopId];
    if (!shop || shop.category !== 'shop' || !current?.ownedDecorations.includes(fixtureDecorationId)) {
      throw new Error('請先兌換這個展示架');
    }
    const fixture = getShopInteriorDecorations(shop.shopType, shopId, shop.name, current.ownedDecorations)
      .find(({ id }) => id === fixtureDecorationId);
    if (!fixture || !canDisplayShopProducts(fixture)) throw new Error('這個物件沒有商品展示位置');
    if (productId !== null) {
      const product = getShopFixtureProductCatalog(shopId, shop.name, shop.shopType, fixture)
        .find(({ id }) => id === productId);
      if (
        !product
        || product.legacyOnly
        || (product.fixtureIds && !product.fixtureIds.includes(fixtureDecorationId))
      ) {
        throw new Error('這款商品不屬於這間商店的展示目錄');
      }
    }
    actionLock.current = true;
    try {
      const slots = Array.from(
        { length: SHOP_DISPLAY_SLOT_COUNT },
        (_, index) => current.fixtureContents?.[fixtureDecorationId]?.[index] ?? null,
      );
      slots[slotIndex] = productId;
      const fixtureContents = { ...current.fixtureContents };
      if (slots.some(Boolean)) fixtureContents[fixtureDecorationId] = slots;
      else delete fixtureContents[fixtureDecorationId];
      await saveMall({
        coins,
        purchasedItems,
        rewardedCheckIns,
        rewardTokens,
        placements: mallPlacements,
        shopInteriors: { ...shopInteriors, [shopId]: { ...current, fixtureContents } },
      });
      await Haptics.selectionAsync();
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, rewardedCheckIns, rewardTokens, mallPlacements, shopInteriors, saveMall]);

  const placeShopInteriorDogStaff = useCallback(async (
    shopId: string,
    dogDecorationId: string,
    areaId: DogStaffAreaId,
  ) => {
    if (actionLock.current) throw new Error('正在處理上一個操作');
    if (shopId !== 'fluffy-marshmallow-cafe') throw new Error('狗狗店員只能放在毛茸茸棉花糖CAFE');
    if (!purchasedItems.includes(shopId)) throw new Error('請先兌換這間商店');
    if (!DOG_STAFF_PROFILE_BY_DECORATION_ID[dogDecorationId]) throw new Error('找不到這位狗狗店員');
    if (!isDogStaffAreaId(areaId)) throw new Error('這個店內區域不存在');
    const decoration = SHOP_INTERIOR_DECORATION_BY_ID[dogDecorationId];
    if (!decoration) throw new Error('找不到這位狗狗店員的兌換資料');
    const current = shopInteriors[shopId] ?? { ownedDecorations: [], placements: {} };
    const alreadyOwned = current.ownedDecorations.includes(dogDecorationId);
    if (!alreadyOwned && coins < decoration.price) throw new Error(`金幣還差 ${decoration.price - coins} 枚`);
    actionLock.current = true;
    try {
      const dogStaffPlacements = {
        ...current.dogStaffPlacements,
        [dogDecorationId]: areaId,
      };
      const nextInterior = {
        ...current,
        ownedDecorations: alreadyOwned ? current.ownedDecorations : [...current.ownedDecorations, dogDecorationId],
        dogStaffPlacements,
      };
      await saveMall({
        coins: alreadyOwned ? coins : coins - decoration.price,
        purchasedItems,
        rewardedCheckIns,
        rewardTokens,
        placements: mallPlacements,
        shopInteriors: { ...shopInteriors, [shopId]: nextInterior },
      });
      if (alreadyOwned) await Haptics.selectionAsync();
      else await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, rewardedCheckIns, rewardTokens, mallPlacements, shopInteriors, saveMall]);

  const storeShopInteriorDogStaff = useCallback(async (shopId: string, dogDecorationId: string) => {
    if (actionLock.current) throw new Error('正在處理上一個操作');
    if (shopId !== 'fluffy-marshmallow-cafe') throw new Error('狗狗店員只能放在毛茸茸棉花糖CAFE');
    if (!purchasedItems.includes(shopId)) throw new Error('請先兌換這間商店');
    const current = shopInteriors[shopId];
    if (!current?.ownedDecorations.includes(dogDecorationId)) throw new Error('請先兌換這位狗狗店員');
    if (!current.dogStaffPlacements?.[dogDecorationId]) return;
    actionLock.current = true;
    try {
      const dogStaffPlacements = { ...current.dogStaffPlacements };
      delete dogStaffPlacements[dogDecorationId];
      await saveMall({
        coins,
        purchasedItems,
        rewardedCheckIns,
        rewardTokens,
        placements: mallPlacements,
        shopInteriors: { ...shopInteriors, [shopId]: { ...current, dogStaffPlacements } },
      });
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, rewardedCheckIns, rewardTokens, mallPlacements, shopInteriors, saveMall]);

  const updateShopInteriorDogLook = useCallback(async (
    shopId: string,
    dogDecorationId: string,
    look: DogStaffLook,
  ) => {
    if (actionLock.current) throw new Error('正在處理上一個操作');
    if (shopId !== 'fluffy-marshmallow-cafe') throw new Error('狗狗造型只適用於毛茸茸棉花糖CAFE');
    if (!purchasedItems.includes(shopId)) throw new Error('請先兌換這間商店');
    const current = shopInteriors[shopId];
    if (!current?.ownedDecorations.includes(dogDecorationId)) throw new Error('請先兌換這位狗狗店員');
    if (!isValidDogStaffLook(dogDecorationId, look)) throw new Error('這套服裝或配飾不屬於這位狗狗店員');
    actionLock.current = true;
    try {
      await saveMall({
        coins,
        purchasedItems,
        rewardedCheckIns,
        rewardTokens,
        placements: mallPlacements,
        shopInteriors: {
          ...shopInteriors,
          [shopId]: {
            ...current,
            dogStaffLooks: { ...current.dogStaffLooks, [dogDecorationId]: look },
          },
        },
      });
      await Haptics.selectionAsync();
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, rewardedCheckIns, rewardTokens, mallPlacements, shopInteriors, saveMall]);

  const saveShopInteriorDogLook = useCallback(async (
    shopId: string,
    dogDecorationId: string,
    name: string,
    look: DogStaffLook,
  ) => {
    if (actionLock.current) throw new Error('正在處理上一個操作');
    if (shopId !== 'fluffy-marshmallow-cafe') throw new Error('狗狗造型只適用於毛茸茸棉花糖CAFE');
    if (!purchasedItems.includes(shopId)) throw new Error('請先兌換這間商店');
    const current = shopInteriors[shopId];
    if (!current?.ownedDecorations.includes(dogDecorationId)) throw new Error('請先兌換這位狗狗店員');
    if (!isValidDogStaffLook(dogDecorationId, look)) throw new Error('這套服裝或配飾不屬於這位狗狗店員');
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 24) throw new Error('穿搭名稱請填寫 1 至 24 個字');
    const savedOutfits = current.dogStaffOutfits?.[dogDecorationId] ?? [];
    if (savedOutfits.some(({ name: existingName }) => existingName.toLocaleLowerCase() === trimmedName.toLocaleLowerCase())) {
      throw new Error('這隻狗已經有相同的穿搭名稱');
    }
    const idBase = `saved-${Date.now().toString(36)}`;
    let id = idBase;
    let suffix = 1;
    while (savedOutfits.some((savedOutfit) => savedOutfit.id === id)) {
      id = `${idBase}-${suffix++}`;
    }
    const nextSavedOutfits = [...savedOutfits, { id, name: trimmedName, look }];
    actionLock.current = true;
    try {
      await saveMall({
        coins,
        purchasedItems,
        rewardedCheckIns,
        rewardTokens,
        placements: mallPlacements,
        shopInteriors: {
          ...shopInteriors,
          [shopId]: {
            ...current,
            dogStaffOutfits: { ...current.dogStaffOutfits, [dogDecorationId]: nextSavedOutfits },
          },
        },
      });
      await Haptics.selectionAsync();
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, rewardedCheckIns, rewardTokens, mallPlacements, shopInteriors, saveMall]);

  const deleteShopInteriorDogLook = useCallback(async (
    shopId: string,
    dogDecorationId: string,
    savedLookId: string,
  ) => {
    if (actionLock.current) throw new Error('正在處理上一個操作');
    if (shopId !== 'fluffy-marshmallow-cafe') throw new Error('狗狗造型只適用於毛茸茸棉花糖CAFE');
    if (!purchasedItems.includes(shopId)) throw new Error('請先兌換這間商店');
    const current = shopInteriors[shopId];
    if (!current?.ownedDecorations.includes(dogDecorationId)) throw new Error('請先兌換這位狗狗店員');
    const savedOutfits = current.dogStaffOutfits?.[dogDecorationId] ?? [];
    if (!savedOutfits.some(({ id }) => id === savedLookId)) throw new Error('找不到要刪除的穿搭');
    const nextSavedOutfits = savedOutfits.filter(({ id }) => id !== savedLookId);
    const dogStaffOutfits = { ...current.dogStaffOutfits };
    if (nextSavedOutfits.length > 0) dogStaffOutfits[dogDecorationId] = nextSavedOutfits;
    else delete dogStaffOutfits[dogDecorationId];
    actionLock.current = true;
    try {
      await saveMall({
        coins,
        purchasedItems,
        rewardedCheckIns,
        rewardTokens,
        placements: mallPlacements,
        shopInteriors: {
          ...shopInteriors,
          [shopId]: { ...current, dogStaffOutfits },
        },
      });
      await Haptics.selectionAsync();
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, rewardedCheckIns, rewardTokens, mallPlacements, shopInteriors, saveMall]);

  const grantTestCoins = useCallback(async (minimumBalance: number) => {
    if (!IS_DEVELOPMENT_BUILD) throw new Error('測試金幣只供開發預覽使用');
    if (!Number.isSafeInteger(minimumBalance) || minimumBalance < 0) throw new Error('測試金幣數量無效');
    if (actionLock.current) throw new Error('正在處理上一個操作');
    actionLock.current = true;
    try {
      await saveMall({
        coins: Math.max(coins, minimumBalance),
        purchasedItems,
        rewardedCheckIns,
        rewardTokens,
        placements: mallPlacements,
        shopInteriors,
      });
    } finally {
      actionLock.current = false;
    }
  }, [coins, purchasedItems, rewardedCheckIns, rewardTokens, mallPlacements, shopInteriors, saveMall]);

  const progressSnapshot = useMemo<ProgressSnapshot>(() => ({
    schemaVersion: 1,
    habits,
    mall: {
      schemaVersion: MALL_SCHEMA_VERSION,
      coins,
      purchasedItems,
      rewardedCheckIns,
      rewardTokens,
      placements: mallPlacements,
      shopInteriors,
    },
  }), [habits, coins, purchasedItems, rewardedCheckIns, rewardTokens, mallPlacements, shopInteriors]);

  const value = useMemo(() => ({
      habits, isLoading, storageError, mallLoadError, progressSnapshot, cloudSyncStatus, cloudSyncMessage, setCloudSyncState, replaceProgressFromCloud,
      today, coins, purchasedItems, mallPlacements, shopInteriors, rewardTokens, rewardedCheckIns, getCheckInReward, addHabit, updateHabit, deleteHabit, toggleCheckIn, makeUpYesterday, setWeeklyChallenge, purchaseMallItem, moveMallItem, storeMallItem, grantTestCoins, placeShopInteriorDecoration, storeShopInteriorDecoration, setShopInteriorFixtureProduct, placeShopInteriorDogStaff, storeShopInteriorDogStaff, updateShopInteriorDogLook, saveShopInteriorDogLook, deleteShopInteriorDogLook,
  }), [habits, isLoading, storageError, mallLoadError, progressSnapshot, cloudSyncStatus, cloudSyncMessage, setCloudSyncState, replaceProgressFromCloud, today, coins, purchasedItems, mallPlacements, shopInteriors, rewardTokens, rewardedCheckIns, getCheckInReward, addHabit, updateHabit, deleteHabit, toggleCheckIn, makeUpYesterday, setWeeklyChallenge, purchaseMallItem, moveMallItem, storeMallItem, grantTestCoins, placeShopInteriorDecoration, storeShopInteriorDecoration, setShopInteriorFixtureProduct, placeShopInteriorDogStaff, storeShopInteriorDogStaff, updateShopInteriorDogLook, saveShopInteriorDogLook, deleteShopInteriorDogLook]);

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (!context) throw new Error('useHabits must be used inside HabitsProvider');
  return context;
}

export { getStreak } from '@/lib/habit-schedule';
