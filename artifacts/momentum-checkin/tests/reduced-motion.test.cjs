const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const contextPath = path.join(__dirname, '../context/ReducedMotionContext.tsx');
const contextSource = fs.readFileSync(contextPath, 'utf8');
const compiled = ts.transpileModule(contextSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.React,
    esModuleInterop: true,
  },
}).outputText;

test('reduced-motion preference is loaded, observed, and removes navigation animation', async () => {
  const reactState = [];
  let stateCursor = 0;
  let effect;
  let motionListener;
  let preferenceResolve;
  let currentContext;
  const context = { Provider: 'ReducedMotionProvider' };
  const react = {
    createContext: () => context,
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useContext: () => currentContext,
    useEffect: (callback) => { effect = callback; },
    useState: (initialValue) => {
      const index = stateCursor++;
      if (!(index in reactState)) reactState[index] = initialValue;
      return [reactState[index], (nextValue) => { reactState[index] = nextValue; }];
    },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(
    (name) => {
      if (name === 'react') return react;
      if (name === 'react-native') return {
        AccessibilityInfo: {
          isReduceMotionEnabled: () => new Promise((resolve) => { preferenceResolve = resolve; }),
          addEventListener: (event, listener) => {
            assert.equal(event, 'reduceMotionChanged');
            motionListener = listener;
            return { remove() {} };
          },
        },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    module,
    module.exports,
  );

  const renderProvider = () => {
    stateCursor = 0;
    const tree = module.exports.ReducedMotionProvider({ children: 'app' });
    currentContext = tree.props.value;
    return tree;
  };
  let tree = renderProvider();
  assert.equal(tree.props.value, null, 'unknown preference is treated as low-motion');
  const cleanup = effect();
  assert.equal(typeof preferenceResolve, 'function');

  preferenceResolve(true);
  await Promise.resolve();
  tree = renderProvider();
  assert.equal(tree.props.value, true);
  assert.equal(module.exports.getMotionAwareAnimation(tree.props.value, 'slide_from_right'), 'none');

  motionListener(false);
  tree = renderProvider();
  assert.equal(tree.props.value, false);
  assert.equal(module.exports.getMotionAwareAnimation(tree.props.value, 'slide_from_right'), 'slide_from_right');

  motionListener(true);
  tree = renderProvider();
  assert.equal(module.exports.getMotionAwareAnimation(tree.props.value, 'slide_from_right'), 'none');
  cleanup();
});

test('main routes and native modals use the shared reduced-motion preference', () => {
  const rootLayout = fs.readFileSync(path.join(__dirname, '../app/_layout.tsx'), 'utf8');
  const todayScreen = fs.readFileSync(path.join(__dirname, '../app/(tabs)/index.tsx'), 'utf8');
  const shopScene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  const fixturePanel = fs.readFileSync(path.join(__dirname, '../components/ShopDisplayFixturePanel.tsx'), 'utf8');
  const errorFallback = fs.readFileSync(path.join(__dirname, '../components/ErrorFallback.tsx'), 'utf8');

  assert.match(rootLayout, /getMotionAwareAnimation\(reduceMotion, 'slide_from_right'\)/);
  assert.match(rootLayout, /presentation: 'modal'[\s\S]*animation: 'none'/);
  for (const [name, source] of Object.entries({ todayScreen, shopScene, fixturePanel, errorFallback })) {
    assert.match(source, /useReducedMotion/);
    assert.match(source, /animationType=\{(?:systemReduceMotion|reduceMotion) === false \? '(?:slide|fade)' : 'none'\}/, name);
  }
});
