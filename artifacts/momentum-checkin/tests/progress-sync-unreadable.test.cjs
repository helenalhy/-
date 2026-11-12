const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const source = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../context/ProgressSyncBridge.tsx'), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  },
).outputText;

const localMallKey = 'momentum.mall.v1';
const malformedLocalMall = '{"coins":125,"purchasedItems":["local-shop"],';
const localSnapshot = {
  schemaVersion: 1,
  habits: [],
  mall: {
    schemaVersion: 1,
    coins: 0,
    purchasedItems: [],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: {},
    shopInteriors: {},
  },
};
const repairedSnapshot = {
  schemaVersion: 1,
  habits: [],
  mall: {
    schemaVersion: 1,
    coins: 125,
    purchasedItems: ['local-shop'],
    rewardedCheckIns: ['goal:2026-11-11'],
    rewardTokens: { facility: 2, shop: 1, decor: 3 },
    placements: { 'F1-main-01': 'local-shop' },
    shopInteriors: {},
  },
};
const cloudSnapshot = {
  schemaVersion: 1,
  habits: [],
  mall: {
    schemaVersion: 1,
    coins: 80,
    purchasedItems: ['cloud-shop'],
    rewardedCheckIns: ['cloud-goal:2026-11-10'],
    rewardTokens: { facility: 1, shop: 2, decor: 1 },
    placements: { 'F2-main-01': 'cloud-shop' },
    shopInteriors: {},
  },
};

function sameDependencies(previous, next) {
  return previous && next && previous.length === next.length
    && previous.every((value, index) => Object.is(value, next[index]));
}

function mountBridge({
  mallLoadError,
  progressData,
  snapshot = localSnapshot,
  savedMall = malformedLocalMall,
}) {
  const localStorage = new Map([[localMallKey, savedMall]]);
  let cloudStorage = progressData?.exists ? structuredClone(progressData.snapshot) : null;
  const actions = { saves: [], replaces: [], refetches: 0, states: [], queryOptions: [] };
  const hooks = [];
  const cleanups = new Map();
  let cursor = 0;
  let pendingEffects = [];
  let rerenderRequested = false;
  let controls;

  const context = { Provider: 'CloudSyncProvider' };
  const react = {
    createContext: () => context,
    createElement(type, props, ...children) {
      const resolvedProps = {
        ...(props ?? {}),
        children: children.length === 1 ? children[0] : children,
      };
      if (type === context.Provider) {
        controls = resolvedProps.value;
        return resolvedProps.children;
      }
      return { type, props: resolvedProps };
    },
    useContext: () => context.value,
    useState(initial) {
      const index = cursor++;
      if (!hooks[index]) hooks[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [hooks[index].value, (next) => {
        const value = typeof next === 'function' ? next(hooks[index].value) : next;
        if (!Object.is(value, hooks[index].value)) {
          hooks[index].value = value;
          rerenderRequested = true;
        }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!hooks[index]) hooks[index] = { current: initial };
      return hooks[index];
    },
    useCallback(callback, dependencies) {
      return memo(callback, dependencies);
    },
    useMemo(factory, dependencies) {
      return memo(factory(), dependencies);
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const hook = hooks[index] ?? (hooks[index] = {});
      if (!sameDependencies(hook.dependencies, dependencies)) {
        hook.dependencies = dependencies;
        pendingEffects.push({ index, effect });
      }
    },
  };

  function memo(value, dependencies) {
    const index = cursor++;
    const hook = hooks[index] ?? (hooks[index] = {});
    if (!sameDependencies(hook.dependencies, dependencies)) {
      hook.dependencies = dependencies;
      hook.value = value;
    }
    return hook.value;
  }

  const module = { exports: {} };
  const mockedRequire = (name) => {
    if (name === 'react') return react;
    if (name === '@tanstack/react-query') {
      return { onlineManager: { isOnline: () => true, subscribe: () => () => {} } };
    }
    if (name === 'react-native') {
      return {
        ActivityIndicator: 'ActivityIndicator',
        Pressable: 'Pressable',
        StyleSheet: { create: (styles) => styles },
        Text: 'Text',
        View: 'View',
      };
    }
    if (name === '@clerk/expo') {
      return { useAuth: () => ({ isLoaded: true, isSignedIn: true, userId: 'authenticated-user' }) };
    }
    if (name === '@workspace/api-client-react') {
      return {
        getGetProgressQueryKey: () => ['progress'],
        useGetProgress: (options) => {
          actions.queryOptions.push(options);
          return {
            data: progressData,
            isPending: false,
            isFetching: false,
            isError: false,
            refetch: async () => {
              actions.refetches += 1;
              return { isError: false, data: progressData };
            },
          };
        },
        useSaveProgress: () => ({
          mutateAsync: async ({ data }) => {
            actions.saves.push(structuredClone(data));
            cloudStorage = structuredClone(data);
          },
        }),
      };
    }
    if (name === '@/hooks/useColors') return { useColors: () => ({
      background: '#fff', foreground: '#111', mutedForeground: '#666',
      candyPink: '#f8c', secondary: '#eee', primary: '#48c',
    }) };
    if (name === '@/context/HabitsContext') {
      return {
        useHabits: () => ({
          isLoading: false,
          mallLoadError,
          progressSnapshot: snapshot,
          replaceProgressFromCloud: async (next) => {
            actions.replaces.push(structuredClone(next));
            localStorage.set(localMallKey, JSON.stringify(next.mall));
          },
          setCloudSyncState: (status, message = null) => actions.states.push({ status, message }),
          cloudSyncStatus: 'error',
        }),
      };
    }
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', 'setTimeout', 'clearTimeout', source)(
    mockedRequire,
    module,
    module.exports,
    (callback) => { queueMicrotask(callback); return 1; },
    () => {},
  );

  const render = () => {
    cursor = 0;
    pendingEffects = [];
    module.exports.ProgressSyncBridge({ children: 'app' });
    const effects = pendingEffects;
    pendingEffects = [];
    for (const { index, effect } of effects) {
      cleanups.get(index)?.();
      const cleanup = effect();
      if (typeof cleanup === 'function') cleanups.set(index, cleanup);
      else cleanups.delete(index);
    }
  };
  for (let pass = 0; pass < 10; pass += 1) {
    rerenderRequested = false;
    render();
    if (!rerenderRequested) break;
  }

  return {
    actions,
    localStorage,
    get cloudStorage() { return cloudStorage; },
    get controls() { return controls; },
  };
}

test('authenticated initial sync and retry preserve unreadable local mall and cloud progress', async (t) => {
  for (const progressData of [
    { exists: true, snapshot: cloudSnapshot },
    { exists: false, snapshot: null },
  ]) {
    await t.test(progressData.exists ? 'existing cloud record' : 'new cloud record', async () => {
      const app = mountBridge({
        mallLoadError: '無法讀取本機商場資料；原始資料未被更改。',
        progressData,
      });

      assert.equal(app.actions.queryOptions[0].query.enabled, true, 'the sync query runs for the signed-in account');
      assert.ok(app.actions.queryOptions[0].query.queryKey.includes('authenticated-user'));
      assert.deepEqual(app.actions.saves, [], 'initial reconciliation must not upload fallback progress');
      assert.deepEqual(app.actions.replaces, [], 'initial reconciliation must not replace local progress');
      assert.equal(app.actions.refetches, 0);

      const localBeforeRetry = app.localStorage.get(localMallKey);
      const cloudBeforeRetry = structuredClone(app.cloudStorage);
      await app.controls.retry();

      assert.equal(app.actions.refetches, 0, 'manual retry remains blocked in the unreadable app session');
      assert.deepEqual(app.actions.saves, [], 'manual retry must not upload fallback progress');
      assert.deepEqual(app.actions.replaces, [], 'manual retry must not restore cloud data over local progress');
      assert.equal(app.localStorage.get(localMallKey), localBeforeRetry);
      assert.deepEqual(app.cloudStorage, cloudBeforeRetry);
      assert.equal(localBeforeRetry, malformedLocalMall, 'the unreadable local mall bytes remain untouched');
    });
  }
});

test('a fresh authenticated app session synchronizes the repaired local mall snapshot', async () => {
  const app = mountBridge({
    mallLoadError: null,
    progressData: { exists: false, snapshot: null },
    snapshot: repairedSnapshot,
    savedMall: JSON.stringify(repairedSnapshot.mall),
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(app.actions.saves, [repairedSnapshot]);
  assert.deepEqual(app.actions.replaces, []);
});
