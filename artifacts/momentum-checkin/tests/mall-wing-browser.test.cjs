// Verifies React Native Web's real DOM semantics and browser focus behavior.
// Run: pnpm --filter @workspace/momentum-checkin run test:mall-browser
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const net = require('node:net');
const { firefox, webkit } = require('playwright');

const projectRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(projectRoot, '../..');
const chromiumPath = process.env.CHROMIUM_PATH || '/repl/tools/bin/chromium';

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function createStaticServer(root) {
  const contentTypes = {
    '.css': 'text/css',
    '.html': 'text/html',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.ttf': 'font/ttf',
  };

  return http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const filePath = path.resolve(root, `.${pathname}`);
    const relativePath = path.relative(root, filePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      response.writeHead(403).end();
      return;
    }

    const target = fs.existsSync(filePath) && fs.statSync(filePath).isFile()
      ? filePath
      : path.join(root, 'index.html');
    response.setHeader('content-type', contentTypes[path.extname(target)] || 'application/octet-stream');
    fs.createReadStream(target).pipe(response);
  });
}

class DevTools {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 0;
    this.pending = new Map();
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      const resolve = this.pending.get(message.id);
      if (!resolve) return;
      this.pending.delete(message.id);
      if (message.error) resolve.reject(new Error(message.error.message));
      else resolve.resolve(message.result);
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    return new DevTools(socket);
  }

  send(method, params = {}) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const response = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.text || 'Browser evaluation failed');
    }
    return response.result?.value;
  }

  close() {
    this.socket.close();
  }
}

async function waitForBrowser(devTools, expression, description) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await devTools.evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  const pageState = await devTools.evaluate(`({
    url: location.href,
    title: document.title,
    body: document.body?.innerText?.slice(0, 400) ?? '',
    wingTabs: document.querySelectorAll('[data-testid^="mall-wing-"]').length,
    selectedWing: document.querySelector('[data-testid="mall-wing-tabs"] [aria-selected="true"]')?.dataset.testid,
    tabScroller: (() => {
      const list = document.querySelector('[data-testid="mall-wing-tabs"]');
      return list && {
        left: list.getBoundingClientRect().left,
        right: list.getBoundingClientRect().right,
        scrollLeft: list.scrollLeft,
        clientWidth: list.clientWidth,
        scrollWidth: list.scrollWidth,
        tabs: Array.from(list.querySelectorAll('[role="tab"]')).map((tab) => ({
          id: tab.dataset.testid,
          left: tab.getBoundingClientRect().left,
          right: tab.getBoundingClientRect().right,
        })),
      };
    })(),
    pager: (() => {
      const node = document.querySelector('[data-testid="mall-wing-pager"]');
      return node && { left: node.scrollLeft, width: node.clientWidth, contentWidth: node.scrollWidth };
    })(),
  })`);
  throw new Error(`Timed out waiting for ${description}: ${JSON.stringify(pageState)}`);
}

async function sendKey(devTools, key, code, virtualKeyCode) {
  await devTools.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key,
    code,
    windowsVirtualKeyCode: virtualKeyCode,
  });
  await devTools.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key,
    code,
    windowsVirtualKeyCode: virtualKeyCode,
  });
}

async function swipePager(devTools, direction) {
  const gesture = await devTools.evaluate(`(() => {
    const pager = document.querySelector('[data-testid="mall-wing-pager"]');
    const rect = pager.getBoundingClientRect();
    return {
      fromX: rect.left + rect.width * ${direction === 'right' ? 0.15 : 0.85},
      toX: rect.left + rect.width * ${direction === 'right' ? 0.85 : 0.15},
      y: rect.top + rect.height / 2,
      before: pager.scrollLeft,
    };
  })()`);
  await devTools.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 1,
    configuration: 'mobile',
  });
  const touchPoints = (x) => [{ x, y: gesture.y, id: 1, radiusX: 4, radiusY: 4, force: 1 }];
  await devTools.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touchPoints(gesture.fromX) });
  for (let step = 1; step <= 8; step += 1) {
    const x = gesture.fromX + ((gesture.toX - gesture.fromX) * step) / 8;
    await devTools.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touchPoints(x) });
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  await devTools.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  return {
    before: gesture.before,
    after: await devTools.evaluate(`document.querySelector('[data-testid="mall-wing-pager"]')?.scrollLeft ?? null`),
  };
}

test('mall wing tabs keep browser focus and selection in sync', {
  skip: !fs.existsSync(chromiumPath) && !spawnSync('which', ['chromium'], { encoding: 'utf8' }).stdout.trim(),
  timeout: 300_000,
}, async (t) => {
  const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
  if (!clerkPublishableKey) {
    t.skip('Clerk publishable key is not available to this test process');
    return;
  }

  const exportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'momentum-wing-web-'));
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'momentum-wing-chrome-'));
  let server;
  let browser;
  let devTools;

  t.after(async () => {
    devTools?.close();
    if (browser && browser.exitCode == null) {
      browser.kill('SIGTERM');
      await new Promise((resolve) => browser.once('exit', resolve));
    }
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(exportDir, { recursive: true, force: true });
    fs.rmSync(profileDir, { recursive: true, force: true });
  });

  const build = spawnSync('pnpm', [
    '--filter',
    '@workspace/momentum-checkin',
    'exec',
    'expo',
    'export',
    '--platform',
    'web',
    '--output-dir',
    exportDir,
    '--clear',
  ], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 240_000,
    env: {
      ...process.env,
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
    },
  });
  assert.equal(build.status, 0, `Expo web export failed:\n${build.stdout}\n${build.stderr}`);

  server = createStaticServer(exportDir);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const appUrl = `http://127.0.0.1:${server.address().port}/`;
  const debugPort = await freePort();
  const executable = fs.existsSync(chromiumPath) ? chromiumPath : 'chromium';
  browser = spawn(executable, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    '--touch-events=enabled',
    appUrl,
  ], { stdio: 'ignore' });
  browser.once('error', (error) => t.diagnostic(`Could not start Chromium: ${error.message}`));

  let targetUrl;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
      targetUrl = targets.find((target) => target.type === 'page')?.webSocketDebuggerUrl;
      if (targetUrl) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(targetUrl, 'Chromium did not expose a page target');
  devTools = await DevTools.connect(targetUrl);
  await devTools.send('Page.enable');
  await devTools.send('Runtime.enable');
  await devTools.send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await devTools.send('Page.navigate', { url: appUrl });
  await waitForBrowser(
    devTools,
    `Boolean(document.querySelector('[aria-label="先體驗，不登入"]'))`,
    'the welcome screen guest option',
  );
  await devTools.evaluate(`document.querySelector('[aria-label="先體驗，不登入"]')?.click()`);
  await waitForBrowser(
    devTools,
    `Boolean(document.querySelector('[data-testid="mall-wing-tabs"] [data-testid="mall-wing-main"]'))`,
    'the mall wing tablist',
  );
  await waitForBrowser(
    devTools,
    `document.querySelector('[data-testid="mall-wing-pager"]')?.clientWidth > 0
      && document.querySelector('[data-testid="mall-wing-pager"]')?.clientWidth < 400`,
    'the mall pager to finish measuring the narrow browser viewport',
  );
  await devTools.evaluate('new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  await devTools.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'forced-colors', value: 'active' }],
  });
  await waitForBrowser(
    devTools,
    `matchMedia('(forced-colors: active)').matches`,
    'Chromium forced-colors mode to become active',
  );

  const tabsSelector = '[data-testid="mall-wing-tabs"] [role="tab"]';
  const getState = () => devTools.evaluate(`(() => {
    const list = document.querySelector('[data-testid="mall-wing-tabs"]');
    const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
    return {
      listRole: list.getAttribute('role'),
      tabs: tabs.map((tab) => ({
        id: tab.dataset.testid,
        selected: tab.getAttribute('aria-selected'),
        tabIndex: tab.getAttribute('tabindex'),
      })),
      panels: Array.from(document.querySelectorAll('[data-testid^="mall-wing-content-"]')).map((panel) => ({
        id: panel.dataset.testid,
        hidden: panel.getAttribute('aria-hidden') === 'true',
        inert: panel.inert,
      })),
      focused: document.activeElement?.dataset?.testid ?? null,
      tabScroller: {
        left: list.getBoundingClientRect().left,
        right: list.getBoundingClientRect().right,
        scrollLeft: list.scrollLeft,
      },
    };
  })()`);
  const getFocusIndicator = (selector) => devTools.evaluate(`(() => {
    const target = document.querySelector(${JSON.stringify(selector)});
    if (!target) return null;
    const style = getComputedStyle(target);
    const rect = target.getBoundingClientRect();
    const clearance = Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset);
    const clippingAncestors = [];
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      const parentStyle = getComputedStyle(parent);
      const clipsX = ['hidden', 'clip', 'auto', 'scroll'].includes(parentStyle.overflowX);
      const clipsY = ['hidden', 'clip', 'auto', 'scroll'].includes(parentStyle.overflowY);
      if (!clipsX && !clipsY) continue;
      const bounds = parent.getBoundingClientRect();
      const left = bounds.left + parent.clientLeft;
      const top = bounds.top + parent.clientTop;
      const right = left + parent.clientWidth;
      const bottom = top + parent.clientHeight;
      clippingAncestors.push({
        id: parent.dataset.testid ?? parent.tagName.toLowerCase(),
        containsRing: (!clipsX || (rect.left - clearance >= left - 1 && rect.right + clearance <= right + 1))
          && (!clipsY || (rect.top - clearance >= top - 1 && rect.bottom + clearance <= bottom + 1)),
      });
    }
    return {
      focused: document.activeElement === target,
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      outlineOffset: Number.parseFloat(style.outlineOffset),
      outlineColor: style.outlineColor,
      forcedColorAdjust: style.forcedColorAdjust,
      clippingAncestors,
    };
  })()`);
  const assertForcedColorsFocusIndicator = async (selector, description) => {
    const indicator = await getFocusIndicator(selector);
    assert.ok(indicator, `${description} should exist`);
    assert.equal(indicator.focused, true, `${description} should own keyboard focus`);
    assert.equal(indicator.outlineStyle, 'solid', `${description} should have a visible solid focus ring`);
    assert.ok(indicator.outlineWidth >= 2, `${description} focus ring should be at least 2px wide`);
    assert.ok(indicator.outlineOffset >= 1, `${description} focus ring should sit outside its border`);
    assert.notEqual(indicator.outlineColor, 'rgba(0, 0, 0, 0)', `${description} focus ring should not be transparent`);
    assert.equal(indicator.forcedColorAdjust, 'auto', `${description} should use the browser's high-contrast colors`);
    assert.ok(
      indicator.clippingAncestors.every((ancestor) => ancestor.containsRing),
      `${description} focus ring should not be clipped: ${JSON.stringify(indicator.clippingAncestors)}`,
    );
  };
  const assertSelectedAndFocused = async (wingId) => {
    await waitForBrowser(devTools, `(() => {
      const list = document.querySelector('[data-testid="mall-wing-tabs"]');
      const tab = list?.querySelector('[data-testid="mall-wing-${wingId}"]');
      if (!list || !tab) return false;
      const listRect = list.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      return tabRect.left >= listRect.left - 1 && tabRect.right <= listRect.right + 1;
    })()`, `${wingId} tab to be visible in the narrow tab scroller`);
    const state = await getState();
    const active = state.tabs.find((tab) => tab.id === `mall-wing-${wingId}`);
    assert.equal(state.listRole, 'tablist');
    assert.equal(active?.selected, 'true', `${wingId} should have aria-selected=true`);
    assert.equal(active?.tabIndex, '0', `${wingId} should be the tab stop`);
    assert.equal(state.focused, `mall-wing-${wingId}`, `${wingId} should own browser focus`);
    assert.equal(state.tabs.filter((tab) => tab.selected === 'true').length, 1);
    assert.equal(state.tabs.filter((tab) => tab.tabIndex === '0').length, 1);
    for (const panel of state.panels) {
      const isActive = panel.id === `mall-wing-content-${wingId}`;
      assert.equal(panel.hidden, !isActive, `${panel.id} should match the selected wing's visibility`);
      assert.equal(panel.inert, !isActive, `${panel.id} should only allow focus in the selected wing`);
    }
  };

  let state = await getState();
  assert.ok(state.tabScroller.right - state.tabScroller.left < 400, 'the browser test should use a narrow tab viewport');
  assert.equal(state.tabs.length, 5);
  assert.ok(state.tabs.every((tab) => tab.selected === 'false' || tab.selected === 'true'));
  await devTools.evaluate(`document.querySelector('${tabsSelector}[data-testid="mall-wing-main"]').focus()`);
  await assertSelectedAndFocused('main');
  await assertForcedColorsFocusIndicator(
    '[data-testid="mall-wing-main"]',
    'the focused mall wing tab in forced-colors mode',
  );
  await sendKey(devTools, 'ArrowRight', 'ArrowRight', 39);
  await assertSelectedAndFocused('annex');
  await assertForcedColorsFocusIndicator(
    '[data-testid="mall-wing-annex"]',
    'the keyboard-selected mall wing tab in forced-colors mode',
  );

  let reachedActiveWingControlInForcedColors = false;
  for (let index = 0; index < 40; index += 1) {
    await sendKey(devTools, 'Tab', 'Tab', 9);
    const focusedControl = await devTools.evaluate(`(() => {
      const focused = document.activeElement;
      return Boolean(
        focused?.matches('[data-testid^="mall-slot-"]')
        && focused.closest('[data-testid="mall-wing-content-annex"]')
        && !focused.closest('[data-testid="mall-wing-content-annex"][aria-hidden="true"]')
      );
    })()`);
    if (focusedControl) {
      reachedActiveWingControlInForcedColors = true;
      break;
    }
  }
  assert.equal(
    reachedActiveWingControlInForcedColors,
    true,
    'keyboard Tab should reach a control in the selected wing while forced colors are active',
  );
  await assertForcedColorsFocusIndicator(
    '[data-testid="mall-wing-content-annex"] [data-testid^="mall-slot-"]:focus',
    'the focused control in the selected mall wing in forced-colors mode',
  );

  await devTools.evaluate(`document.querySelector('${tabsSelector}[data-testid="mall-wing-main"]').focus()`);
  await sendKey(devTools, 'Home', 'Home', 36);
  await assertSelectedAndFocused('main');

  let reachedActiveWingControl = false;
  for (let index = 0; index < 40; index += 1) {
    await sendKey(devTools, 'Tab', 'Tab', 9);
    const focusState = await devTools.evaluate(`(() => {
      const focused = document.activeElement;
      const hiddenPanel = focused?.closest('[data-testid^="mall-wing-content-"][aria-hidden="true"]');
      return {
        focusedId: focused?.dataset?.testid ?? null,
        isInsideActivePanel: Boolean(focused?.closest('[data-testid="mall-wing-content-main"]')),
        isInsideHiddenPanel: Boolean(hiddenPanel),
      };
    })()`);
    assert.equal(focusState.isInsideHiddenPanel, false, 'Tab should never focus a control in a hidden wing');
    if (focusState.isInsideActivePanel) {
      reachedActiveWingControl = true;
      break;
    }
  }
  assert.equal(reachedActiveWingControl, true, 'Tab should still reach controls in the active wing');
  await devTools.evaluate(`document.querySelector('${tabsSelector}[data-testid="mall-wing-main"]').focus()`);
  await sendKey(devTools, 'ArrowRight', 'ArrowRight', 39);
  await assertSelectedAndFocused('annex');
  const annexControlFocus = await devTools.evaluate(`(() => {
    const control = document.querySelector('[data-testid="mall-wing-content-annex"] [data-testid^="mall-slot-"]');
    control?.focus();
    return {
      focusedControl: document.activeElement === control,
      activePanelIsNotInert: !document.querySelector('[data-testid="mall-wing-content-annex"]').inert,
    };
  })()`);
  assert.equal(annexControlFocus.focusedControl, true, 'the active wing control should remain keyboard-focusable after switching');
  assert.equal(annexControlFocus.activePanelIsNotInert, true);

  await devTools.evaluate(`document.querySelector('${tabsSelector}[data-testid="mall-wing-annex"]').focus()`);
  await sendKey(devTools, 'ArrowLeft', 'ArrowLeft', 37);
  await assertSelectedAndFocused('main');

  await sendKey(devTools, 'ArrowRight', 'ArrowRight', 39);
  await assertSelectedAndFocused('annex');

  await sendKey(devTools, 'ArrowRight', 'ArrowRight', 39);
  await assertSelectedAndFocused('extension');

  await sendKey(devTools, 'ArrowLeft', 'ArrowLeft', 37);
  await assertSelectedAndFocused('annex');

  await sendKey(devTools, 'ArrowLeft', 'ArrowLeft', 37);
  await assertSelectedAndFocused('main');

  await sendKey(devTools, 'End', 'End', 35);
  await assertSelectedAndFocused('extension4');

  await sendKey(devTools, 'Home', 'Home', 36);
  await assertSelectedAndFocused('main');

  const mouseTarget = await devTools.evaluate(`(() => {
    const tab = document.querySelector('${tabsSelector}[data-testid="mall-wing-extension"]');
    window.scrollTo(0, 0);
    tab.scrollIntoView({ block: 'center', inline: 'center' });
    const rect = tab.getBoundingClientRect();
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      hitId: document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
        ?.closest('[data-testid]')?.dataset.testid,
    };
  })()`);
  assert.equal(mouseTarget.hitId, 'mall-wing-extension', 'mouse should target the visible wing tab');
  await devTools.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: mouseTarget.x,
    y: mouseTarget.y,
    button: 'left',
    clickCount: 1,
  });
  await devTools.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: mouseTarget.x,
    y: mouseTarget.y,
    button: 'left',
    clickCount: 1,
  });
  await waitForBrowser(
    devTools,
    `document.querySelector('${tabsSelector}[data-testid="mall-wing-extension"]')?.getAttribute('aria-selected') === 'true'`,
    'mouse tab selection',
  );
  await waitForBrowser(
    devTools,
    `(() => {
      const pager = document.querySelector('[data-testid="mall-wing-pager"]');
      return pager.scrollLeft >= pager.clientWidth * 1.5;
    })()`,
    'the selected mall page to finish scrolling to the right section',
  );
  state = await getState();
  assert.equal(state.tabs.find((tab) => tab.id === 'mall-wing-extension')?.tabIndex, '0');

  const pagerPosition = await devTools.evaluate(`(() => {
    const pager = document.querySelector('[data-testid="mall-wing-pager"]');
    return { scrollLeft: pager.scrollLeft, width: pager.clientWidth };
  })()`);
  assert.ok(pagerPosition.width > 0);
  assert.equal(
    Math.round(pagerPosition.scrollLeft / pagerPosition.width),
    2,
    'mouse selection should move the horizontal mall pager to the selected wing',
  );

  await devTools.evaluate(`document.querySelector('${tabsSelector}[data-testid="mall-wing-main"]').focus()`);
  await sendKey(devTools, 'End', 'End', 35);
  await assertSelectedAndFocused('extension4');
  await waitForBrowser(
    devTools,
    `(() => {
      const pager = document.querySelector('[data-testid="mall-wing-pager"]');
      return pager && Math.abs(pager.scrollLeft - pager.clientWidth * 4) < 2;
    })()`,
    'the selected mall page to finish scrolling before resizing',
  );

  await devTools.send('Emulation.setDeviceMetricsOverride', {
    width: 220,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await waitForBrowser(
    devTools,
    `document.querySelector('[data-testid="mall-wing-pager"]')?.clientWidth > 0
      && document.querySelector('[data-testid="mall-wing-pager"]')?.clientWidth < 250`,
    'the mall pager to finish measuring the resized browser viewport',
  );
  await devTools.evaluate('new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  await assertSelectedAndFocused('extension4');
  await waitForBrowser(
    devTools,
    `(() => {
      const pager = document.querySelector('[data-testid="mall-wing-pager"]');
      return pager && Math.abs(pager.scrollLeft - pager.clientWidth * 4) < 2;
    })()`,
    'the selected mall page to stay aligned after narrowing the viewport',
  );

  await devTools.send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await waitForBrowser(
    devTools,
    `document.querySelector('[data-testid="mall-wing-pager"]')?.clientWidth >= 250`,
    'the mall pager to finish measuring the restored browser viewport',
  );
  await devTools.evaluate('new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  await assertSelectedAndFocused('extension4');
  await waitForBrowser(
    devTools,
    `(() => {
      const pager = document.querySelector('[data-testid="mall-wing-pager"]');
      return pager && Math.abs(pager.scrollLeft - pager.clientWidth * 4) < 2;
    })()`,
    'the selected mall page to stay aligned after restoring the viewport',
  );

  const focusedControl = await devTools.evaluate(`(() => {
    const panel = document.querySelector('[data-testid="mall-wing-content-extension4"]');
    const control = panel?.querySelector('button, [tabindex="0"]');
    control?.focus();
    return Boolean(control && document.activeElement === control);
  })()`);
  assert.equal(focusedControl, true, 'the current wing should have a focusable control before the swipe');
  const swipeState = await swipePager(devTools, 'right');
  assert.notEqual(swipeState.after, swipeState.before, `the browser swipe should move the pager: ${JSON.stringify(swipeState)}`);
  await waitForBrowser(
    devTools,
    `document.querySelector('${tabsSelector}[data-testid="mall-wing-extension3"]')?.getAttribute('aria-selected') === 'true'`,
    'touch swipe selection of the adjacent mall wing',
  );
  await waitForBrowser(
    devTools,
    `(() => {
      const pager = document.querySelector('[data-testid="mall-wing-pager"]');
      return pager && Math.abs(pager.scrollLeft - pager.clientWidth * 3) < 2;
    })()`,
    'the selected mall page to finish swiping to extension3',
  );
  state = await getState();
  assert.equal(state.tabs.find((tab) => tab.id === 'mall-wing-extension3')?.selected, 'true');
  assert.equal(state.tabs.find((tab) => tab.id === 'mall-wing-extension3')?.tabIndex, '0');
  assert.equal(state.tabs.filter((tab) => tab.selected === 'true').length, 1);
  assert.equal(state.tabs.filter((tab) => tab.tabIndex === '0').length, 1);
  for (const panel of state.panels) {
    const isActive = panel.id === 'mall-wing-content-extension3';
    assert.equal(panel.hidden, !isActive, `${panel.id} should match the swiped-to wing's visibility`);
    assert.equal(panel.inert, !isActive, `${panel.id} should only allow focus in the swiped-to wing`);
  }
  const focusAfterSwipe = await devTools.evaluate(`(() => {
    const focused = document.activeElement;
    return {
      focusedId: focused?.dataset?.testid ?? null,
      isInsideHiddenPanel: Boolean(focused?.closest('[data-testid^="mall-wing-content-"][aria-hidden="true"]')),
    };
  })()`);
  assert.equal(focusAfterSwipe.isInsideHiddenPanel, false, 'swiping must not leave focus inside the hidden wing');

  await devTools.evaluate(`document.querySelector('${tabsSelector}[data-testid="mall-wing-extension3"]').focus()`);
  await sendKey(devTools, 'ArrowRight', 'ArrowRight', 39);
  await assertSelectedAndFocused('extension4');

  for (const engine of [
    { name: 'Firefox', browserType: firefox },
    { name: 'WebKit (Safari engine)', browserType: webkit },
  ]) {
    await t.test(`${engine.name} keeps narrow-screen wing keyboard state in sync`, async (engineTest) => {
      let crossBrowser;
      try {
        crossBrowser = await engine.browserType.launch({ headless: true });
      } catch (error) {
        if (/Host system is missing dependencies|Executable doesn't exist|cannot open shared object file/.test(error.message)) {
          const missingLibraries = [...new Set(error.message.match(/lib[\w.-]+\.so(?:\.\d+)?/g) ?? [])];
          const reason = missingLibraries.length
            ? `Missing system libraries: ${missingLibraries.join(', ')}`
            : 'Required browser runtime dependencies are unavailable';
          engineTest.skip(reason);
          return;
        }
        throw error;
      }

      try {
        const page = await crossBrowser.newPage({ viewport: { width: 320, height: 800 } });
        await page.goto(appUrl);
        await page.locator('[aria-label="先體驗，不登入"]').click();
        const tablist = page.locator('[data-testid="mall-wing-tabs"]');
        await tablist.waitFor({ state: 'visible' });

        const verifyWing = async (wingId) => {
          await page.waitForFunction((expectedWing) => {
            const list = document.querySelector('[data-testid="mall-wing-tabs"]');
            const tab = list?.querySelector(`[data-testid="mall-wing-${expectedWing}"]`);
            if (!list || !tab || document.activeElement !== tab) return false;
            const listRect = list.getBoundingClientRect();
            const tabRect = tab.getBoundingClientRect();
            return tabRect.left >= listRect.left - 1 && tabRect.right <= listRect.right + 1;
          }, wingId);

          const state = await page.evaluate(() => {
            const list = document.querySelector('[data-testid="mall-wing-tabs"]');
            const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
            return {
              listRole: list.getAttribute('role'),
              tabs: tabs.map((tab) => ({
                id: tab.dataset.testid,
                selected: tab.getAttribute('aria-selected'),
                tabIndex: tab.tabIndex,
              })),
              focused: document.activeElement?.dataset?.testid ?? null,
            };
          });
          const activeTab = state.tabs.find((tab) => tab.id === `mall-wing-${wingId}`);
          assert.equal(state.listRole, 'tablist');
          assert.equal(activeTab?.selected, 'true', `${wingId} should have aria-selected=true`);
          assert.equal(activeTab?.tabIndex, 0, `${wingId} should be the only Tab stop`);
          assert.equal(state.focused, `mall-wing-${wingId}`, `${wingId} should own browser focus`);
          assert.equal(state.tabs.filter((tab) => tab.selected === 'true').length, 1);
          assert.equal(state.tabs.filter((tab) => tab.tabIndex === 0).length, 1);
        };

        await page.locator('[data-testid="mall-wing-main"]').focus();
        await verifyWing('main');
        await page.keyboard.press('ArrowRight');
        await verifyWing('annex');
        await page.keyboard.press('ArrowRight');
        await verifyWing('extension');
        await page.keyboard.press('ArrowLeft');
        await verifyWing('annex');
        await page.keyboard.press('End');
        await verifyWing('extension4');
        await page.keyboard.press('Home');
        await verifyWing('main');
      } finally {
        await crossBrowser.close();
      }
    });
  }
});
