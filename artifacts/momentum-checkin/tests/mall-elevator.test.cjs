const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function createAnimation() {
  return {
    start(callback) {
      callback?.({ finished: true });
    },
    stop() {},
  };
}

function renderElevatorPanel(props, platformOS = 'ios') {
  const componentPath = path.join(__dirname, '../components/MallElevatorPanel.tsx');
  const source = ts.transpileModule(fs.readFileSync(componentPath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const react = {
    createElement(type, properties, ...children) {
      return {
        type,
        props: {
          ...(properties ?? {}),
          ...(children.length === 1 ? { children: children[0] } : children.length > 1 ? { children } : {}),
        },
      };
    },
    useEffect() {},
    useRef(initial) { return { current: initial }; },
    useState(initial) { return [initial, () => {}]; },
  };
  class AnimatedValue {
    setValue(value) { this.value = value; }
    interpolate() { return this; }
  }
  const animated = {
    Value: AnimatedValue,
    View: 'Animated.View',
    timing(_value, config) {
      animationConfigs.push(config);
      return createAnimation();
    },
    delay: createAnimation,
    sequence: createAnimation,
  };
  const animationConfigs = [];
  const colors = new Proxy({ radius: 20 }, {
    get(target, key) {
      return key in target ? target[key] : `color-${String(key)}`;
    },
  });
  const mockRequire = (name) => {
    if (name === 'react') return react;
    if (name === 'react-native') return {
      AccessibilityInfo: { isReduceMotionEnabled: async () => false, addEventListener: () => ({ remove() {} }) },
      Animated: animated,
      BackHandler: { addEventListener: () => ({ remove() {} }) },
      Modal: 'Modal',
      Platform: { OS: platformOS },
      Pressable: 'Pressable',
      ScrollView: 'ScrollView',
      StyleSheet: { absoluteFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, create: (styles) => styles },
      Text: 'Text',
      View: 'View',
    };
    if (name === 'react-native-safe-area-context') return {
      SafeAreaView: 'SafeAreaView',
      useSafeAreaInsets: () => ({ top: 20, bottom: 16 }),
    };
    if (name === '@/hooks/useColors') return { useColors: () => colors };
    throw new Error(`Unexpected dependency: ${name}`);
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)(mockRequire, module, module.exports);
  return {
    tree: module.exports.MallElevatorPanel(props),
    animationConfigs,
  };
}

function collectNodes(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(collectNodes);
  return [node, ...collectNodes(node.props?.children)];
}

test('elevator shows all thirty accessible floors and highlights the current one', () => {
  const floors = Array.from({ length: 30 }, (_, index) => ({ floor: index + 1, title: `主題${index + 1}` }));
  const { tree } = renderElevatorPanel({
    visible: true,
    currentFloor: 5,
    floors,
    onClose() {},
    onSelectFloor() {},
  });
  const nodes = collectNodes(tree);
  const panel = nodes.find((node) => node.props.testID === 'mall-elevator-panel');
  assert.ok(panel);
  assert.equal(panel.props.accessibilityViewIsModal, true);
  assert.equal(nodes.filter((node) => /^mall-elevator-select-floor-/.test(node.props.testID ?? '')).length, 30);

  const current = nodes.find((node) => node.props.testID === 'mall-elevator-select-floor-5');
  const destination = nodes.find((node) => node.props.testID === 'mall-elevator-select-floor-30');
  assert.equal(current.props.disabled, true);
  assert.equal(current.props.accessibilityState.selected, true);
  assert.match(destination.props.accessibilityLabel, /30F，主題30/);
  assert.equal(destination.props.disabled, false);
});

test('choosing a destination completes the elevator animation before navigating and closing', () => {
  const floors = Array.from({ length: 30 }, (_, index) => ({ floor: index + 1, title: `主題${index + 1}` }));
  const selectedFloors = [];
  let closeCalls = 0;
  const { tree } = renderElevatorPanel({
    visible: true,
    currentFloor: 2,
    floors,
    onClose() { closeCalls += 1; },
    onSelectFloor(floor) { selectedFloors.push(floor); },
  });
  const destination = collectNodes(tree).find((node) => node.props.testID === 'mall-elevator-select-floor-17');
  destination.props.onPress();
  assert.deepEqual(selectedFloors, [17]);
  assert.equal(closeCalls, 1);

  const modal = collectNodes(tree).find((node) => node.type === 'Modal');
  modal.props.onRequestClose();
  assert.equal(closeCalls, 2, 'the native back action closes the panel when idle');
});

test('disabled and current-floor choices cannot start a ride', () => {
  const floors = Array.from({ length: 30 }, (_, index) => ({ floor: index + 1, title: `主題${index + 1}` }));
  const selectedFloors = [];
  const { tree: disabledTree } = renderElevatorPanel({
    visible: true,
    currentFloor: 2,
    floors,
    disabled: true,
    onClose() {},
    onSelectFloor(floor) { selectedFloors.push(floor); },
  });
  const disabledDestination = collectNodes(disabledTree).find((node) => node.props.testID === 'mall-elevator-select-floor-8');
  assert.equal(disabledDestination.props.disabled, true);
  disabledDestination.props.onPress();
  assert.deepEqual(selectedFloors, []);

  const { tree: currentTree } = renderElevatorPanel({
    visible: true,
    currentFloor: 2,
    floors,
    onClose() {},
    onSelectFloor(floor) { selectedFloors.push(floor); },
  });
  const current = collectNodes(currentTree).find((node) => node.props.testID === 'mall-elevator-select-floor-2');
  current.props.onPress();
  assert.deepEqual(selectedFloors, []);
});

test('hidden elevator panel does not mount an overlay', () => {
  const { tree } = renderElevatorPanel({
    visible: false,
    currentFloor: 1,
    floors: [{ floor: 1, title: '糖果迎賓街' }],
    onClose() {},
    onSelectFloor() {},
  });
  assert.equal(tree, null);
});

test('web elevator travel uses the JavaScript animation driver', () => {
  const floors = Array.from({ length: 30 }, (_, index) => ({ floor: index + 1, title: `主題${index + 1}` }));
  const { tree, animationConfigs } = renderElevatorPanel({
    visible: true,
    currentFloor: 1,
    floors,
    onClose() {},
    onSelectFloor() {},
  }, 'web');
  collectNodes(tree).find((node) => node.props.testID === 'mall-elevator-select-floor-9').props.onPress();
  assert.ok(animationConfigs.length > 0);
  assert.ok(animationConfigs.every(({ useNativeDriver }) => useNativeDriver === false));
});
