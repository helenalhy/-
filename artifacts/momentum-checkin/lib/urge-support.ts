import AsyncStorage from '@react-native-async-storage/async-storage';

export const URGE_SUPPORT_STORAGE_KEY = 'momentum.urge-support.v1';

export const URGE_TRIGGERS = [
  '壓力',
  '無聊',
  '疲倦',
  '焦慮',
  '社交場合',
  '習慣性',
  '其他',
] as const;

export type UrgeTrigger = typeof URGE_TRIGGERS[number];

export interface UrgeRecord {
  id: string;
  habitName: string;
  trigger: string;
  note: string;
  occurredAt: string;
}

export interface UrgeSupportSession {
  startedAt: number;
  endsAt: number;
  durationMinutes: number;
}

export interface UrgeSupportData {
  habitName: string;
  records: UrgeRecord[];
  activeSession: UrgeSupportSession | null;
}

export const EMPTY_URGE_SUPPORT_DATA: UrgeSupportData = {
  habitName: '',
  records: [],
  activeSession: null,
};

export function getReplacementActions(habitName: string): string[] {
  const habit = habitName.toLowerCase();
  if (/手機|短片|影片|滑|社交媒體|scroll|phone/.test(habit)) {
    return [
      '把手機放到伸手以外，伸展 1 分鐘。',
      '先離開螢幕，看看窗外並慢慢呼吸 5 次。',
      '把想看的內容先存起來，站起來走一小圈。',
    ];
  }
  if (/零食|甜食|甜點|糖|宵夜|飲食|吃東西|吃零食|食零食|食甜點|snack|sweet/.test(habit)) {
    return [
      '先喝幾口水，等 5 分鐘再決定下一步。',
      '先離開食物旁邊，做 5 次慢慢的深呼吸。',
      '找一個讓自己舒服的替代小活動，先做 2 分鐘。',
    ];
  }
  if (/購物|網購|買|消費|shop|buy/.test(habit)) {
    return [
      '先把商品放進願望清單，明天再回來看。',
      '暫時關掉購物頁面，起身走動 2 分鐘。',
      '先寫下想買它的原因，稍後再重新決定。',
    ];
  }
  if (/熬夜|晚睡|睡前|夜|sleep|late/.test(habit)) {
    return [
      '把手機放到床邊以外，先做 1 分鐘伸展。',
      '調暗燈光，慢慢呼吸 5 次。',
      '先完成一個睡前小步驟，例如刷牙或整理床邊。',
    ];
  }
  if (/拖延|工作|讀書|學習|功課|procrastinat|study|work/.test(habit)) {
    return [
      '只打開要做的東西，先做 2 分鐘就好。',
      '把任務拆成最小一步，先完成那一步。',
      '收好桌面一小角，讓開始變得容易一點。',
    ];
  }
  return [
    '先離開當下情境，慢慢呼吸 5 次。',
    '喝幾口水，再做一個 2 分鐘的小活動。',
    '把注意力放到身邊一件舒服的小事上，停留 1 分鐘。',
  ];
}

function normalizeRecord(value: unknown): UrgeRecord | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Partial<UrgeRecord>;
  if (
    typeof record.id !== 'string'
    || typeof record.habitName !== 'string'
    || typeof record.trigger !== 'string'
    || typeof record.note !== 'string'
    || typeof record.occurredAt !== 'string'
    || Number.isNaN(Date.parse(record.occurredAt))
  ) return null;
  return {
    id: record.id.slice(0, 100),
    habitName: record.habitName.slice(0, 80),
    trigger: record.trigger.slice(0, 60),
    note: record.note.slice(0, 300),
    occurredAt: record.occurredAt,
  };
}

export function normalizeUrgeSupportData(value: unknown): UrgeSupportData {
  if (typeof value !== 'object' || value === null) return EMPTY_URGE_SUPPORT_DATA;
  const data = value as Partial<UrgeSupportData>;
  const records = Array.isArray(data.records)
    ? data.records.map(normalizeRecord).filter((record): record is UrgeRecord => record !== null).slice(0, 100)
    : [];
  const session = data.activeSession;
  const activeSession = session
    && Number.isFinite(session.startedAt)
    && Number.isFinite(session.endsAt)
    && Number.isFinite(session.durationMinutes)
    && session.durationMinutes > 0
    ? {
        startedAt: session.startedAt,
        endsAt: session.endsAt,
        durationMinutes: session.durationMinutes,
      }
    : null;
  return {
    habitName: typeof data.habitName === 'string' ? data.habitName.slice(0, 80) : '',
    records,
    activeSession,
  };
}

export async function readUrgeSupportData(): Promise<UrgeSupportData> {
  const raw = await AsyncStorage.getItem(URGE_SUPPORT_STORAGE_KEY);
  if (!raw) return EMPTY_URGE_SUPPORT_DATA;
  try {
    return normalizeUrgeSupportData(JSON.parse(raw));
  } catch (error) {
    throw new Error('無法讀取本機保存的陪伴記錄', { cause: error });
  }
}

export async function saveUrgeSupportData(data: UrgeSupportData): Promise<void> {
  await AsyncStorage.setItem(URGE_SUPPORT_STORAGE_KEY, JSON.stringify(normalizeUrgeSupportData(data)));
}

export function createUrgeRecord(
  habitName: string,
  trigger: string,
  note = '',
  occurredAt = new Date().toISOString(),
): UrgeRecord {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    habitName: habitName.trim().slice(0, 80) || '未命名習慣',
    trigger: trigger.trim().slice(0, 60) || '想做時',
    note: note.trim().slice(0, 300),
    occurredAt,
  };
}
