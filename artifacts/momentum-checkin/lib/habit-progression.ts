export const HABIT_PROGRESS_PATH_MIN_STEPS = 2;
export const HABIT_PROGRESS_PATH_MAX_STEPS = 5;
export const HABIT_PROGRESS_PATH_ADVANCE_AFTER = 5;
export const HABIT_PROGRESS_PATH_MAX_STEP_LENGTH = 120;

export type HabitProgressPathStatus = 'active' | 'paused' | 'completed';
export type HabitProgressPathAction = 'advance' | 'stay' | 'pause' | 'resume' | 'finish' | 'restart';

export interface HabitProgressPath {
  steps: string[];
  currentStepIndex: number;
  completedDates: string[];
  status: HabitProgressPathStatus;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function sanitizeHabitProgressSteps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const uniqueSteps = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const step = entry.trim().slice(0, HABIT_PROGRESS_PATH_MAX_STEP_LENGTH);
    if (step) uniqueSteps.add(step);
    if (uniqueSteps.size >= HABIT_PROGRESS_PATH_MAX_STEPS) break;
  }
  return [...uniqueSteps];
}

export function normalizeHabitProgressPath(value: unknown): HabitProgressPath | undefined {
  if (!isRecord(value)) return undefined;
  const steps = sanitizeHabitProgressSteps(value.steps);
  if (steps.length < HABIT_PROGRESS_PATH_MIN_STEPS) return undefined;

  const rawIndex = value.currentStepIndex;
  const currentStepIndex = Number.isInteger(rawIndex)
    ? Math.max(0, Math.min(steps.length - 1, Number(rawIndex)))
    : 0;
  const completedDates = Array.isArray(value.completedDates)
    ? [...new Set(value.completedDates.filter((date): date is string => (
      typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    )))]
    : [];
  const status: HabitProgressPathStatus = value.status === 'paused' || value.status === 'completed'
    ? value.status
    : 'active';

  return { steps, currentStepIndex, completedDates, status };
}

export function createHabitProgressPath(
  stepsValue: unknown,
  status: HabitProgressPathStatus = 'active',
): HabitProgressPath | undefined {
  const steps = sanitizeHabitProgressSteps(stepsValue);
  if (steps.length < HABIT_PROGRESS_PATH_MIN_STEPS) return undefined;
  return { steps, currentStepIndex: 0, completedDates: [], status };
}

export function buildHabitProgressPath(
  previousValue: unknown,
  stepsValue: unknown,
  enabled: boolean,
  restart = false,
): HabitProgressPath | undefined {
  const steps = sanitizeHabitProgressSteps(stepsValue);
  if (steps.length < HABIT_PROGRESS_PATH_MIN_STEPS) return undefined;
  const previous = normalizeHabitProgressPath(previousValue);

  if (!previous || restart) {
    return createHabitProgressPath(steps, enabled ? 'active' : 'paused');
  }

  const activeStep = previous.steps[previous.currentStepIndex];
  const nextIndex = steps.indexOf(activeStep);
  const stepsChanged = previous.steps.length !== steps.length
    || previous.steps.some((step, index) => step !== steps[index]);
  const completedRouteWasEdited = previous.status === 'completed' && stepsChanged;
  const currentStepIndex = completedRouteWasEdited ? 0 : nextIndex >= 0 ? nextIndex : 0;
  const stageIsUnchanged = nextIndex >= 0;
  const status = previous.status === 'completed' && !stepsChanged
    ? 'completed'
    : enabled ? 'active' : 'paused';

  return {
    steps,
    currentStepIndex,
    completedDates: stageIsUnchanged && !completedRouteWasEdited ? previous.completedDates : [],
    status,
  };
}

export function updateHabitProgressPathCheckIn(
  value: unknown,
  date: string,
  completed: boolean,
): HabitProgressPath | undefined {
  const path = normalizeHabitProgressPath(value);
  if (!path) return undefined;
  if (!completed) {
    return { ...path, completedDates: path.completedDates.filter((savedDate) => savedDate !== date) };
  }
  if (path.status !== 'active' || path.completedDates.includes(date)) return path;
  return { ...path, completedDates: [...path.completedDates, date] };
}

export function applyHabitProgressPathAction(
  value: unknown,
  action: HabitProgressPathAction,
): HabitProgressPath | undefined {
  const path = normalizeHabitProgressPath(value);
  if (!path) return undefined;
  const ready = path.completedDates.length >= HABIT_PROGRESS_PATH_ADVANCE_AFTER;
  const isLastStep = path.currentStepIndex >= path.steps.length - 1;

  switch (action) {
    case 'advance':
      return path.status === 'active' && ready && !isLastStep
        ? { ...path, currentStepIndex: path.currentStepIndex + 1, completedDates: [] }
        : path;
    case 'stay':
      return path.status === 'active' && ready ? { ...path, completedDates: [] } : path;
    case 'pause':
      return path.status === 'active' ? { ...path, status: 'paused' } : path;
    case 'resume':
      return path.status === 'paused' ? { ...path, status: 'active' } : path;
    case 'finish':
      return path.status === 'active' && ready && isLastStep
        ? { ...path, status: 'completed' }
        : path;
    case 'restart':
      return { ...path, currentStepIndex: 0, completedDates: [], status: 'active' };
  }
}

export function getActiveHabitProgressPathStep(value: unknown): string | undefined {
  const path = normalizeHabitProgressPath(value);
  if (!path || path.status !== 'active') return undefined;
  return path.steps[path.currentStepIndex];
}
