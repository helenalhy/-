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

test('mall wing tabs keep browser focus and selection in sync', {
  skip: !fs.existsSync(chromiumPath) && !spawnSync('which', ['chromium'], { encoding: 'utf8' }).stdout.trim(),
  timeout: 300_000,
}, async (t) => {
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
  await devTools.send('Page.navigate', { url: appUrl });
  await waitForBrowser(
    devTools,
    `Boolean(document.querySelector('[data-testid="mall-wing-tabs"] [data-testid="mall-wing-main"]'))`,
    'the mall wing tablist',
  );
  await waitForBrowser(
    devTools,
    `document.querySelector('[data-testid="mall-wing-pager"]')?.clientWidth > 360`,
    'the mall pager to finish measuring the browser viewport',
  );
  await devTools.evaluate('new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

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
      focused: document.activeElement?.dataset?.testid ?? null,
    };
  })()`);
  const assertSelectedAndFocused = async (wingId) => {
    const state = await getState();
    const active = state.tabs.find((tab) => tab.id === `mall-wing-${wingId}`);
    assert.equal(state.listRole, 'tablist');
    assert.equal(active?.selected, 'true', `${wingId} should have aria-selected=true`);
    assert.equal(active?.tabIndex, '0', `${wingId} should be the tab stop`);
    assert.equal(state.focused, `mall-wing-${wingId}`, `${wingId} should own browser focus`);
    assert.equal(state.tabs.filter((tab) => tab.selected === 'true').length, 1);
    assert.equal(state.tabs.filter((tab) => tab.tabIndex === '0').length, 1);
  };

  let state = await getState();
  assert.equal(state.tabs.length, 5);
  assert.ok(state.tabs.every((tab) => tab.selected === 'false' || tab.selected === 'true'));
  await devTools.evaluate(`document.querySelector('${tabsSelector}[data-testid="mall-wing-main"]').focus()`);
  await assertSelectedAndFocused('main');
  await sendKey(devTools, 'ArrowRight', 'ArrowRight', 39);
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
});
